begin;

-- Existing accepted matches and historical scores retain their original rules.
alter table public.friend_duels add column scoring_version integer not null default 1 check (scoring_version in (1, 2));
alter table public.friend_duels alter column scoring_version set default 2;
update public.friend_duels set scoring_version = 2 where status = 'pending';
alter table public.friend_duels drop constraint friend_duels_inviter_score_check;
alter table public.friend_duels drop constraint friend_duels_invitee_score_check;
alter table public.friend_duels add check (inviter_score between 0 and 700), add check (invitee_score between 0 and 700);
alter table public.friend_duel_rounds add column starts_at timestamptz, add column resolved_at timestamptz;

-- Keep the old implementation for already accepted matches only. All helpers
-- remain inaccessible to clients; public wrappers still authorize participants.
alter function private.duel_settle(uuid) rename to duel_settle_v1;
alter function public.get_friend_duel(uuid) set schema private;
alter function private.get_friend_duel(uuid) rename to duel_get_v1;
alter function public.answer_friend_duel(uuid, integer, integer) set schema private;
alter function public.forfeit_friend_duel(uuid) set schema private;
alter function private.forfeit_friend_duel(uuid) rename to duel_forfeit_v1;
revoke all on function private.duel_get_v1(uuid), private.answer_friend_duel(uuid, integer, integer), private.duel_forfeit_v1(uuid) from public, anon, authenticated;
alter function private.duel_summary(public.friend_duels, uuid, timestamptz) rename to duel_summary_v1;
create function private.duel_summary(m public.friend_duels, actor uuid, instant timestamptz)
returns jsonb language sql security definer set search_path = '' as $$
  select private.duel_summary_v1(m, actor, instant) || jsonb_build_object('scoring_version', m.scoring_version);
$$;
revoke all on function private.duel_summary(public.friend_duels, uuid, timestamptz) from public, anon, authenticated;

create function private.duel_round_results(m public.friend_duels, actor uuid)
returns jsonb language sql security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'round_index', r.round_index, 'category', r.category, 'prompt', r.prompt, 'options', r.options,
    'correct_index', r.correct_index, 'explanation', r.explanation, 'resolved_at', r.resolved_at,
    'my_option_index', mine.option_index, 'opponent_option_index', theirs.option_index,
    'my_response_ms', coalesce(mine.response_ms, 20000), 'opponent_response_ms', coalesce(theirs.response_ms, 20000),
    'my_speed_bonus', bonus.my_speed, 'opponent_speed_bonus', bonus.their_speed,
    'my_first_bonus', bonus.my_first, 'opponent_first_bonus', bonus.their_first,
    'my_points', case when mine.option_index = r.correct_index then 70 + bonus.my_speed + bonus.my_first else 0 end,
    'opponent_points', case when theirs.option_index = r.correct_index then 70 + bonus.their_speed + bonus.their_first else 0 end
  ) order by r.round_index), '[]'::jsonb)
  from public.friend_duel_rounds r
  left join public.friend_duel_answers mine on mine.duel_id = r.duel_id and mine.round_index = r.round_index and mine.user_id = actor
  left join public.friend_duel_answers theirs on theirs.duel_id = r.duel_id and theirs.round_index = r.round_index
    and theirs.user_id = case when actor = m.inviter_id then m.invitee_id else m.inviter_id end
  cross join lateral (select
    case when mine.option_index = r.correct_index then (20000 - mine.response_ms) / 1000 else 0 end as my_speed,
    case when theirs.option_index = r.correct_index then (20000 - theirs.response_ms) / 1000 else 0 end as their_speed,
    case when mine.option_index = r.correct_index and (theirs.option_index is distinct from r.correct_index or mine.answered_at <= theirs.answered_at) then 10 else 0 end as my_first,
    case when theirs.option_index = r.correct_index and (mine.option_index is distinct from r.correct_index or theirs.answered_at <= mine.answered_at) then 10 else 0 end as their_first
  ) bonus
  where r.duel_id = m.id and r.resolved_at is not null;
$$;

create function private.duel_update_score(match_id uuid)
returns public.friend_duels language plpgsql security definer set search_path = '' as $$
declare m public.friend_duels; results jsonb;
begin
  select * into m from public.friend_duels where id = match_id for update;
  results := private.duel_round_results(m, m.inviter_id);
  update public.friend_duels set
    inviter_score = coalesce((select sum((x->>'my_points')::integer) from jsonb_array_elements(results) x), 0),
    invitee_score = coalesce((select sum((x->>'opponent_points')::integer) from jsonb_array_elements(results) x), 0),
    inviter_response_ms = coalesce((select sum((x->>'my_response_ms')::integer) from jsonb_array_elements(results) x), 0),
    invitee_response_ms = coalesce((select sum((x->>'opponent_response_ms')::integer) from jsonb_array_elements(results) x), 0)
  where id = match_id returning * into m;
  return m;
end;
$$;

create function private.duel_settle(match_id uuid)
returns public.friend_duels language plpgsql security definer set search_path = '' as $$
declare m public.friend_duels; r public.friend_duel_rounds; instant timestamptz; next_start timestamptz; answer_count integer; last_answer timestamptz;
begin
  select * into m from public.friend_duels where id = match_id for update;
  if m.scoring_version = 1 then return private.duel_settle_v1(match_id); end if;
  instant := clock_timestamp();
  if m.status = 'pending' and m.expires_at <= instant then
    update public.friend_duels set status = 'expired', completed_at = instant where id = match_id returning * into m;
  end if;
  if m.status <> 'active' or instant < m.starts_at then return m; end if;
  next_start := m.starts_at;
  for r in select * from public.friend_duel_rounds where duel_id = m.id order by round_index loop
    if r.starts_at is null then
      update public.friend_duel_rounds set starts_at = next_start where duel_id = m.id and round_index = r.round_index returning * into r;
    end if;
    if instant < r.starts_at then exit; end if;
    if r.resolved_at is null then
      select count(*), max(answered_at) into answer_count, last_answer from public.friend_duel_answers
        where duel_id = m.id and round_index = r.round_index;
      if answer_count = 2 or instant >= r.starts_at + interval '20 seconds' then
        update public.friend_duel_rounds set resolved_at = case when answer_count = 2 then last_answer else r.starts_at + interval '20 seconds' end
          where duel_id = m.id and round_index = r.round_index returning * into r;
      else exit;
      end if;
    end if;
    next_start := r.resolved_at + interval '3 seconds';
    if instant < next_start then exit; end if;
    if r.round_index = 6 then
      m := private.duel_update_score(m.id);
      update public.friend_duels set status = 'completed', completed_at = next_start,
        winner_id = case when m.inviter_score > m.invitee_score then m.inviter_id when m.invitee_score > m.inviter_score then m.invitee_id else null end
        where id = m.id returning * into m;
    end if;
  end loop;
  return private.duel_update_score(m.id);
end;
$$;

create function public.get_friend_duel(match_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid := auth.uid(); m public.friend_duels; r public.friend_duel_rounds; instant timestamptz;
  phase text := 'pending'; q jsonb := null; own_answer jsonb := null; results jsonb := null; round_result jsonb := null;
  opponent_answered boolean := false; reveal_ends timestamptz;
begin
  m := private.duel_require_match(match_id);
  if m.scoring_version = 1 then return private.duel_get_v1(match_id) || jsonb_build_object('scoring_version', 1); end if;
  m := private.duel_settle(match_id);
  instant := clock_timestamp();
  if m.status = 'active' then
    phase := 'countdown';
    if instant >= m.starts_at then
      select * into r from public.friend_duel_rounds where duel_id = m.id and starts_at <= instant
        order by round_index desc limit 1;
      phase := case when r.resolved_at is null then 'question' else 'reveal' end;
      if phase = 'question' then
        select jsonb_build_object('round_index', r.round_index, 'category', r.category, 'prompt', r.prompt, 'options', r.options,
          'round_starts_at', r.starts_at, 'round_ends_at', r.starts_at + interval '20 seconds') into q;
      else
        reveal_ends := r.resolved_at + interval '3 seconds';
      end if;
      select jsonb_build_object('round_index', a.round_index, 'option_index', a.option_index, 'answered_at', a.answered_at, 'response_ms', a.response_ms)
        into own_answer from public.friend_duel_answers a where a.duel_id = m.id and a.round_index = r.round_index and a.user_id = actor;
      select exists(select 1 from public.friend_duel_answers a where a.duel_id = m.id and a.round_index = r.round_index and a.user_id <> actor) into opponent_answered;
    end if;
    results := private.duel_round_results(m, actor);
    if phase = 'reveal' then
      select x into round_result from jsonb_array_elements(results) x where (x->>'round_index')::integer = r.round_index;
    end if;
  elsif m.status in ('completed', 'forfeited') then
    phase := 'finished'; results := private.duel_round_results(m, actor);
  end if;
  return private.duel_summary(m, actor, instant) || jsonb_build_object(
    'scoring_version', 2, 'round_count', 7, 'round_duration_seconds', 20, 'phase', phase,
    'current_round_index', r.round_index, 'current_question', q, 'my_answer', own_answer,
    'opponent_answered', opponent_answered, 'reveal_ends_at', reveal_ends, 'round_result', round_result, 'results', results);
end;
$$;

create function public.answer_friend_duel(match_id uuid, round_index integer, option_index integer)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid := auth.uid(); m public.friend_duels; r public.friend_duel_rounds; instant timestamptz; existing_option integer;
begin
  m := private.duel_require_match(match_id);
  if m.scoring_version = 1 then return private.answer_friend_duel(match_id, round_index, option_index); end if;
  if round_index is null or round_index not between 0 and 6 or option_index is null or option_index not between 0 and 3 then
    raise exception using errcode = '22023', message = 'duel_invalid_answer';
  end if;
  select a.option_index into existing_option from public.friend_duel_answers a
    where a.duel_id = match_id and a.round_index = answer_friend_duel.round_index and a.user_id = actor;
  if found then
    if existing_option <> option_index then raise exception using errcode = '55000', message = 'duel_answer_locked'; end if;
    return public.get_friend_duel(match_id);
  end if;
  m := private.duel_settle(match_id);
  instant := clock_timestamp();
  select * into r from public.friend_duel_rounds where duel_id = match_id and friend_duel_rounds.round_index = answer_friend_duel.round_index;
  if m.status <> 'active' or r.starts_at is null or r.resolved_at is not null or instant < r.starts_at or instant >= r.starts_at + interval '20 seconds' then
    raise exception using errcode = '55000', message = 'duel_round_closed';
  end if;
  insert into public.friend_duel_answers(duel_id, round_index, user_id, option_index, answered_at, response_ms)
    values (match_id, round_index, actor, option_index, instant, least(19999, greatest(0, floor(extract(epoch from (instant - r.starts_at)) * 1000)::integer)));
  return public.get_friend_duel(match_id);
end;
$$;

create function public.forfeit_friend_duel(match_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare actor uuid := auth.uid(); m public.friend_duels; instant timestamptz;
begin
  m := private.duel_require_match(match_id);
  if m.scoring_version = 1 then return private.duel_forfeit_v1(match_id); end if;
  m := private.duel_settle(match_id);
  if m.status in ('completed', 'forfeited') then return public.get_friend_duel(match_id); end if;
  if m.status <> 'active' then raise exception using errcode = '55000', message = 'duel_not_active'; end if;
  instant := clock_timestamp();
  -- Reveal only rounds actually started, never future answer keys on a forfeit.
  update public.friend_duel_rounds set resolved_at = instant where duel_id = m.id and resolved_at is null and starts_at <= instant;
  m := private.duel_update_score(match_id);
  update public.friend_duels set status = 'forfeited', forfeited_by = actor,
    winner_id = case when actor = m.inviter_id then m.invitee_id else m.inviter_id end,
    completed_at = instant where id = m.id;
  return public.get_friend_duel(match_id);
end;
$$;

revoke all on function private.duel_round_results(public.friend_duels, uuid), private.duel_update_score(uuid), private.duel_settle(uuid) from public, anon, authenticated;
revoke all on function public.get_friend_duel(uuid), public.answer_friend_duel(uuid, integer, integer), public.forfeit_friend_duel(uuid) from public, anon, authenticated;
grant execute on function public.get_friend_duel(uuid), public.answer_friend_duel(uuid, integer, integer), public.forfeit_friend_duel(uuid) to authenticated;

comment on function public.get_friend_duel(uuid) is 'Participant-only snapshot. V2 reveals only resolved rounds, with server-clock 3 second transitions and 100 point scoring.';
commit;
