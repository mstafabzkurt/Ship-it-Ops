begin;

-- This pool is deliberately independent of the single-player question catalog.
create table public.duel_questions (
  key text primary key,
  category text not null,
  prompt text not null,
  options jsonb not null,
  correct_index integer not null check (correct_index between 0 and 3),
  explanation text not null,
  active boolean not null default true,
  constraint duel_questions_four_options check (
    jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4
    and jsonb_typeof(options->0) = 'string' and jsonb_typeof(options->1) = 'string'
    and jsonb_typeof(options->2) = 'string' and jsonb_typeof(options->3) = 'string'
    and length(options->>0) > 0 and length(options->>1) > 0
    and length(options->>2) > 0 and length(options->>3) > 0
  )
);

create table public.friend_duels (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invitee_id uuid not null references auth.users(id) on delete cascade,
  pair_low_id uuid generated always as (least(inviter_id, invitee_id)) stored,
  pair_high_id uuid generated always as (greatest(inviter_id, invitee_id)) stored,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'forfeited', 'declined', 'cancelled', 'expired')),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '10 minutes'),
  starts_at timestamptz,
  completed_at timestamptz,
  winner_id uuid references auth.users(id) on delete cascade,
  forfeited_by uuid references auth.users(id) on delete cascade,
  inviter_score integer not null default 0 check (inviter_score between 0 and 7),
  invitee_score integer not null default 0 check (invitee_score between 0 and 7),
  inviter_response_ms integer not null default 0 check (inviter_response_ms between 0 and 140000),
  invitee_response_ms integer not null default 0 check (invitee_response_ms between 0 and 140000),
  check (inviter_id <> invitee_id),
  check (winner_id is null or winner_id in (inviter_id, invitee_id)),
  check (forfeited_by is null or forfeited_by in (inviter_id, invitee_id)),
  check (status <> 'active' or starts_at is not null)
);

create unique index friend_duels_open_pair_idx on public.friend_duels(pair_low_id, pair_high_id) where status in ('pending', 'active');
create index friend_duels_inviter_idx on public.friend_duels(inviter_id, created_at desc);
create index friend_duels_invitee_idx on public.friend_duels(invitee_id, created_at desc);

-- Freeze question text and answers when accepting; later catalog edits do not
-- change an already accepted match. These rows are never client-readable.
create table public.friend_duel_rounds (
  duel_id uuid not null references public.friend_duels(id) on delete cascade,
  round_index integer not null check (round_index between 0 and 6),
  question_key text not null,
  category text not null,
  prompt text not null,
  options jsonb not null,
  correct_index integer not null check (correct_index between 0 and 3),
  explanation text not null,
  primary key (duel_id, round_index),
  unique (duel_id, question_key)
);

create table public.friend_duel_answers (
  duel_id uuid not null,
  round_index integer not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  option_index integer not null check (option_index between 0 and 3),
  answered_at timestamptz not null,
  response_ms integer not null check (response_ms between 0 and 19999),
  primary key (duel_id, round_index, user_id),
  foreign key (duel_id, round_index) references public.friend_duel_rounds(duel_id, round_index) on delete cascade
);

alter table public.duel_questions enable row level security;
alter table public.friend_duels enable row level security;
alter table public.friend_duel_rounds enable row level security;
alter table public.friend_duel_answers enable row level security;
revoke all on table public.duel_questions, public.friend_duels, public.friend_duel_rounds, public.friend_duel_answers from public, anon, authenticated;
-- No direct-read policies: all participant data comes through narrow RPCs.

create or replace function private.duel_check_pair(actor uuid, opponent uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if actor is null then raise exception using errcode = '42501', message = 'duel_auth_required'; end if;
  if opponent is null or actor = opponent then raise exception using errcode = '22023', message = 'duel_invalid_opponent'; end if;
  if exists (select 1 from public.user_blocks b where
    (b.blocker_id = actor and b.blocked_user_id = opponent)
    or (b.blocker_id = opponent and b.blocked_user_id = actor)) then
    raise exception using errcode = '42501', message = 'duel_blocked';
  end if;
end;
$$;

create or replace function private.duel_require_match(match_id uuid)
returns public.friend_duels language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); m public.friend_duels;
begin
  if actor is null then raise exception using errcode = '42501', message = 'duel_auth_required'; end if;
  select d.* into m from public.friend_duels d where d.id = match_id and actor in (d.inviter_id, d.invitee_id) for update;
  if not found then raise exception using errcode = 'P0002', message = 'duel_not_found'; end if;
  perform private.duel_check_pair(actor, case when actor = m.inviter_id then m.invitee_id else m.inviter_id end);
  return m;
end;
$$;

-- Lazy settlement uses the authoritative server clock under the match lock.
-- Missing answers count as zero correct and 20 seconds in the response total.
create or replace function private.duel_settle(match_id uuid)
returns public.friend_duels language plpgsql security definer set search_path = '' as $$
declare m public.friend_duels; instant timestamptz;
begin
  select d.* into m from public.friend_duels d where d.id = match_id for update;
  instant := clock_timestamp();
  if m.status = 'pending' and m.expires_at <= instant then
    update public.friend_duels set status = 'expired', completed_at = instant where id = m.id returning * into m;
  elsif m.status = 'active' and m.starts_at + interval '140 seconds' <= instant then
    select count(*) filter (where a.option_index = r.correct_index)::integer,
      sum(coalesce(a.response_ms, 20000))::integer
    into m.inviter_score, m.inviter_response_ms
    from public.friend_duel_rounds r left join public.friend_duel_answers a
      on a.duel_id = r.duel_id and a.round_index = r.round_index and a.user_id = m.inviter_id
    where r.duel_id = m.id;
    select count(*) filter (where a.option_index = r.correct_index)::integer,
      sum(coalesce(a.response_ms, 20000))::integer
    into m.invitee_score, m.invitee_response_ms
    from public.friend_duel_rounds r left join public.friend_duel_answers a
      on a.duel_id = r.duel_id and a.round_index = r.round_index and a.user_id = m.invitee_id
    where r.duel_id = m.id;
    m.winner_id := case
      when m.inviter_score > m.invitee_score then m.inviter_id
      when m.invitee_score > m.inviter_score then m.invitee_id
      when m.inviter_response_ms < m.invitee_response_ms then m.inviter_id
      when m.invitee_response_ms < m.inviter_response_ms then m.invitee_id
      else null end;
    update public.friend_duels set status = 'completed', completed_at = m.starts_at + interval '140 seconds',
      inviter_score = m.inviter_score, invitee_score = m.invitee_score,
      inviter_response_ms = m.inviter_response_ms, invitee_response_ms = m.invitee_response_ms,
      winner_id = m.winner_id where id = m.id returning * into m;
  end if;
  return m;
end;
$$;

create or replace function private.duel_summary(m public.friend_duels, actor uuid, instant timestamptz)
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', m.id, 'inviter_id', m.inviter_id, 'invitee_id', m.invitee_id,
    'opponent_id', case when actor = m.inviter_id then m.invitee_id else m.inviter_id end,
    'status', m.status, 'created_at', m.created_at, 'expires_at', m.expires_at,
    'starts_at', m.starts_at, 'completed_at', m.completed_at,
    'winner_id', m.winner_id, 'forfeited_by', m.forfeited_by,
    'my_score', case when actor = m.inviter_id then m.inviter_score else m.invitee_score end,
    'opponent_score', case when actor = m.inviter_id then m.invitee_score else m.inviter_score end,
    'my_response_ms', case when actor = m.inviter_id then m.inviter_response_ms else m.invitee_response_ms end,
    'opponent_response_ms', case when actor = m.inviter_id then m.invitee_response_ms else m.inviter_response_ms end,
    'server_now', instant);
$$;

create or replace function public.get_friend_duel(match_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid := auth.uid(); m public.friend_duels; instant timestamptz; idx integer;
  q jsonb := null; own_answer jsonb := null; results jsonb := null;
begin
  perform private.duel_require_match(match_id);
  m := private.duel_settle(match_id);
  instant := clock_timestamp();
  if m.status = 'active' and instant >= m.starts_at and instant < m.starts_at + interval '140 seconds' then
    idx := floor(extract(epoch from (instant - m.starts_at)) / 20)::integer;
    select jsonb_build_object('round_index', r.round_index, 'category', r.category,
      'prompt', r.prompt, 'options', r.options,
      'round_starts_at', m.starts_at + idx * interval '20 seconds',
      'round_ends_at', m.starts_at + (idx + 1) * interval '20 seconds') into q
    from public.friend_duel_rounds r where r.duel_id = m.id and r.round_index = idx;
    select jsonb_build_object('round_index', a.round_index, 'option_index', a.option_index,
      'answered_at', a.answered_at, 'response_ms', a.response_ms) into own_answer
    from public.friend_duel_answers a where a.duel_id = m.id and a.round_index = idx and a.user_id = actor;
  end if;
  if m.status in ('completed', 'forfeited') then
    select jsonb_agg(jsonb_build_object('round_index', r.round_index,
      'category', r.category, 'prompt', r.prompt, 'options', r.options,
      'correct_index', r.correct_index, 'explanation', r.explanation,
      'my_option_index', mine.option_index, 'opponent_option_index', theirs.option_index,
      'my_response_ms', coalesce(mine.response_ms, 20000), 'opponent_response_ms', coalesce(theirs.response_ms, 20000))
      order by r.round_index) into results
    from public.friend_duel_rounds r
    left join public.friend_duel_answers mine on mine.duel_id = r.duel_id and mine.round_index = r.round_index and mine.user_id = actor
    left join public.friend_duel_answers theirs on theirs.duel_id = r.duel_id and theirs.round_index = r.round_index
      and theirs.user_id = case when actor = m.inviter_id then m.invitee_id else m.inviter_id end
    where r.duel_id = m.id;
  end if;
  return private.duel_summary(m, actor, instant) || jsonb_build_object(
    'round_count', 7, 'round_duration_seconds', 20, 'current_round_index', idx,
    'current_question', q, 'my_answer', own_answer, 'results', results);
end;
$$;

create or replace function public.create_friend_duel(opponent_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid := auth.uid(); m public.friend_duels; open_id uuid; instant timestamptz;
begin
  perform private.duel_check_pair(actor, opponent_id);
  -- Canonical user locks serialize creation/rate checks and accepting matches.
  perform u.id from auth.users u where u.id in (actor, opponent_id) order by u.id for update;
  perform private.duel_check_pair(actor, opponent_id);
  if not exists (select 1 from public.friend_relationships f where f.status = 'accepted'
    and f.pair_low_id = least(actor, opponent_id) and f.pair_high_id = greatest(actor, opponent_id)) then
    raise exception using errcode = '42501', message = 'duel_friend_required';
  end if;
  for open_id in select d.id from public.friend_duels d
    where d.pair_low_id = least(actor, opponent_id) and d.pair_high_id = greatest(actor, opponent_id)
    and d.status in ('pending', 'active') order by d.id loop
    m := private.duel_settle(open_id);
    if m.status in ('pending', 'active') then return public.get_friend_duel(m.id); end if;
  end loop;
  instant := clock_timestamp();
  if (select count(*) from public.friend_duels d where d.inviter_id = actor and d.created_at > instant - interval '1 hour') >= 12
    or (select count(*) from public.friend_duels d where d.inviter_id = actor and d.created_at > instant - interval '1 day') >= 40
    or (select count(*) from public.friend_duels d where d.inviter_id = actor and d.status = 'pending' and d.expires_at > instant) >= 5
    or (select count(*) from public.friend_duels d where d.invitee_id = opponent_id and d.status = 'pending' and d.expires_at > instant) >= 20 then
    raise exception using errcode = '54000', message = 'duel_rate_limit';
  end if;
  insert into public.friend_duels(inviter_id, invitee_id, created_at, expires_at)
    values (actor, opponent_id, instant, instant + interval '10 minutes') returning * into m;
  return public.get_friend_duel(m.id);
end;
$$;

create or replace function public.respond_friend_duel(match_id uuid, response_action text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid := auth.uid(); m public.friend_duels; open_id uuid; other public.friend_duels; instant timestamptz;
begin
  if actor is null then raise exception using errcode = '42501', message = 'duel_auth_required'; end if;
  if response_action is null or response_action not in ('accept', 'decline', 'cancel') then
    raise exception using errcode = '22023', message = 'duel_invalid_action';
  end if;
  -- Acquire user locks before match locks, consistently with creation. Only
  -- participants can acquire these locks through this public RPC.
  select d.* into m from public.friend_duels d where d.id = match_id and actor in (d.inviter_id, d.invitee_id);
  if not found then raise exception using errcode = 'P0002', message = 'duel_not_found'; end if;
  perform private.duel_check_pair(actor, case when actor = m.inviter_id then m.invitee_id else m.inviter_id end);
  perform u.id from auth.users u where u.id in (m.inviter_id, m.invitee_id) order by u.id for update;
  -- Read RPCs may settle several matches in one transaction. Take all match
  -- locks in UUID order too, avoiding lock cycles against those list calls.
  perform d.id from public.friend_duels d where d.id = match_id or
    (d.status = 'active' and (d.inviter_id in (m.inviter_id, m.invitee_id) or d.invitee_id in (m.inviter_id, m.invitee_id)))
    order by d.id for update;
  m := private.duel_require_match(match_id);
  if (response_action = 'cancel' and actor <> m.inviter_id)
    or (response_action in ('accept', 'decline') and actor <> m.invitee_id) then
    raise exception using errcode = '42501', message = 'duel_action_forbidden';
  end if;
  m := private.duel_settle(match_id);
  if m.status = 'expired'
    or (response_action = 'accept' and m.status in ('active', 'completed', 'forfeited'))
    or (response_action = 'decline' and m.status = 'declined')
    or (response_action = 'cancel' and m.status = 'cancelled') then return public.get_friend_duel(m.id); end if;
  if m.status <> 'pending' then raise exception using errcode = '55000', message = 'duel_not_pending'; end if;
  if response_action = 'accept' then
    if not exists (select 1 from public.friend_relationships f where f.status = 'accepted'
      and f.pair_low_id = m.pair_low_id and f.pair_high_id = m.pair_high_id) then
      raise exception using errcode = '42501', message = 'duel_friend_required';
    end if;
    for open_id in select d.id from public.friend_duels d where d.status = 'active' and d.id <> m.id
      and (d.inviter_id in (m.inviter_id, m.invitee_id) or d.invitee_id in (m.inviter_id, m.invitee_id)) order by d.id loop
      other := private.duel_settle(open_id);
      if other.status = 'active' then raise exception using errcode = '55000', message = 'duel_busy'; end if;
    end loop;
    insert into public.friend_duel_rounds(duel_id, round_index, question_key, category, prompt, options, correct_index, explanation)
      select m.id, (row_number() over () - 1)::integer, q.key, q.category, q.prompt, q.options, q.correct_index, q.explanation
      from (select * from public.duel_questions where active order by random() limit 7) q;
    if (select count(*) from public.friend_duel_rounds r where r.duel_id = m.id) <> 7 then
      raise exception using errcode = '55000', message = 'duel_question_pool_unavailable';
    end if;
    instant := clock_timestamp();
    update public.friend_duels set status = 'active', starts_at = instant + interval '5 seconds' where id = m.id;
  else
    update public.friend_duels set status = case when response_action = 'decline' then 'declined' else 'cancelled' end,
      completed_at = clock_timestamp() where id = m.id;
  end if;
  return public.get_friend_duel(m.id);
end;
$$;

create or replace function public.answer_friend_duel(match_id uuid, round_index integer, option_index integer)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid := auth.uid(); m public.friend_duels; instant timestamptz; round_start timestamptz; existing_option integer;
begin
  m := private.duel_require_match(match_id);
  if round_index is null or round_index not between 0 and 6 or option_index is null or option_index not between 0 and 3 then
    raise exception using errcode = '22023', message = 'duel_invalid_answer';
  end if;
  -- An exact retry returns the current snapshot even after a round has closed;
  -- a changed retry cannot overwrite the first immutable answer.
  select a.option_index into existing_option from public.friend_duel_answers a
    where a.duel_id = match_id and a.round_index = answer_friend_duel.round_index and a.user_id = actor;
  if found then
    if existing_option <> option_index then raise exception using errcode = '55000', message = 'duel_answer_locked'; end if;
    return public.get_friend_duel(m.id);
  end if;
  m := private.duel_settle(match_id);
  instant := clock_timestamp();
  round_start := m.starts_at + round_index * interval '20 seconds';
  if m.status <> 'active' or instant < round_start or instant >= round_start + interval '20 seconds' then
    raise exception using errcode = '55000', message = 'duel_round_closed';
  end if;
  insert into public.friend_duel_answers(duel_id, round_index, user_id, option_index, answered_at, response_ms)
    values (m.id, round_index, actor, option_index, instant,
      least(19999, greatest(0, floor(extract(epoch from (instant - round_start)) * 1000)::integer)));
  return public.get_friend_duel(m.id);
end;
$$;

create or replace function public.forfeit_friend_duel(match_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid := auth.uid(); m public.friend_duels;
begin
  perform private.duel_require_match(match_id);
  m := private.duel_settle(match_id);
  if m.status in ('completed', 'forfeited') then return public.get_friend_duel(m.id); end if;
  if m.status <> 'active' then raise exception using errcode = '55000', message = 'duel_not_active'; end if;
  -- Score the answers already recorded; winner is always the other player.
  select count(*) filter (where a.option_index = r.correct_index)::integer,
    sum(coalesce(a.response_ms, 20000))::integer into m.inviter_score, m.inviter_response_ms
  from public.friend_duel_rounds r left join public.friend_duel_answers a
    on a.duel_id = r.duel_id and a.round_index = r.round_index and a.user_id = m.inviter_id where r.duel_id = m.id;
  select count(*) filter (where a.option_index = r.correct_index)::integer,
    sum(coalesce(a.response_ms, 20000))::integer into m.invitee_score, m.invitee_response_ms
  from public.friend_duel_rounds r left join public.friend_duel_answers a
    on a.duel_id = r.duel_id and a.round_index = r.round_index and a.user_id = m.invitee_id where r.duel_id = m.id;
  update public.friend_duels set status = 'forfeited', forfeited_by = actor,
    winner_id = case when actor = m.inviter_id then m.invitee_id else m.inviter_id end,
    completed_at = clock_timestamp(), inviter_score = m.inviter_score, invitee_score = m.invitee_score,
    inviter_response_ms = m.inviter_response_ms, invitee_response_ms = m.invitee_response_ms where id = m.id;
  return public.get_friend_duel(m.id);
end;
$$;

create or replace function public.list_friend_duels()
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid := auth.uid(); match_id uuid; output jsonb; instant timestamptz;
begin
  if actor is null then raise exception using errcode = '42501', message = 'duel_auth_required'; end if;
  for match_id in select d.id from public.friend_duels d where actor in (d.inviter_id, d.invitee_id)
    and d.status in ('pending', 'active')
    and not exists (select 1 from public.user_blocks b where
      (b.blocker_id = d.inviter_id and b.blocked_user_id = d.invitee_id)
      or (b.blocker_id = d.invitee_id and b.blocked_user_id = d.inviter_id)) order by d.id loop
    perform private.duel_settle(match_id);
  end loop;
  instant := clock_timestamp();
  select coalesce(jsonb_agg(private.duel_summary(d, actor, instant) order by
    case when d.status = 'active' then 0 when d.status = 'pending' then 1 else 2 end, d.created_at desc), '[]'::jsonb) into output
  from (select d.* from public.friend_duels d where actor in (d.inviter_id, d.invitee_id)
    and not exists (select 1 from public.user_blocks b where
      (b.blocker_id = d.inviter_id and b.blocked_user_id = d.invitee_id)
      or (b.blocker_id = d.invitee_id and b.blocked_user_id = d.inviter_id))
    order by case when d.status in ('active', 'pending') then 0 else 1 end, d.created_at desc limit 60) d;
  return output;
end;
$$;

create or replace function public.get_friend_duel_head_to_head(opponent_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid := auth.uid(); match_id uuid; output jsonb;
begin
  perform private.duel_check_pair(actor, opponent_id);
  for match_id in select d.id from public.friend_duels d where
    d.pair_low_id = least(actor, opponent_id) and d.pair_high_id = greatest(actor, opponent_id)
    and d.status = 'active' order by d.id loop perform private.duel_settle(match_id); end loop;
  select jsonb_build_object('opponent_id', opponent_id,
    'wins', count(*) filter (where d.winner_id = actor),
    'losses', count(*) filter (where d.winner_id = opponent_id),
    'draws', count(*) filter (where d.winner_id is null), 'total', count(*)) into output
  from public.friend_duels d where d.pair_low_id = least(actor, opponent_id)
    and d.pair_high_id = greatest(actor, opponent_id) and d.status in ('completed', 'forfeited');
  return output;
end;
$$;

revoke all on function private.duel_check_pair(uuid, uuid) from public, anon, authenticated;
revoke all on function private.duel_require_match(uuid) from public, anon, authenticated;
revoke all on function private.duel_settle(uuid) from public, anon, authenticated;
revoke all on function private.duel_summary(public.friend_duels, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.create_friend_duel(uuid) from public, anon, authenticated;
revoke all on function public.respond_friend_duel(uuid, text) from public, anon, authenticated;
revoke all on function public.answer_friend_duel(uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.forfeit_friend_duel(uuid) from public, anon, authenticated;
revoke all on function public.get_friend_duel(uuid) from public, anon, authenticated;
revoke all on function public.list_friend_duels() from public, anon, authenticated;
revoke all on function public.get_friend_duel_head_to_head(uuid) from public, anon, authenticated;
grant execute on function public.create_friend_duel(uuid) to authenticated;
grant execute on function public.respond_friend_duel(uuid, text) to authenticated;
grant execute on function public.answer_friend_duel(uuid, integer, integer) to authenticated;
grant execute on function public.forfeit_friend_duel(uuid) to authenticated;
grant execute on function public.get_friend_duel(uuid) to authenticated;
grant execute on function public.list_friend_duels() to authenticated;
grant execute on function public.get_friend_duel_head_to_head(uuid) to authenticated;

comment on table public.friend_duels is 'Private friend-only 1v1 matches. No rewards or changes to single-player progress.';
comment on function public.get_friend_duel(uuid) is 'Participant-only authoritative snapshot; only the current question is revealed until match completion.';

commit;
