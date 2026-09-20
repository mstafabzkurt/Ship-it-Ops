begin;

create table public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  user_low_id uuid not null references auth.users(id) on delete cascade,
  user_high_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint direct_conversations_distinct_users check (user_low_id <> user_high_id),
  constraint direct_conversations_canonical_pair check (user_low_id < user_high_id),
  constraint direct_conversations_pair_unique unique (user_low_id, user_high_id)
);

comment on table public.direct_conversations is
  'One canonical direct-message conversation per unordered user pair. History survives friendship and block changes.';

create index direct_conversations_low_updated_idx
  on public.direct_conversations (user_low_id, updated_at desc);
create index direct_conversations_high_updated_idx
  on public.direct_conversations (user_high_id, updated_at desc);

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message_type text not null,
  body text,
  question_id text references public.game_incidents(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint direct_messages_type_check check (message_type in ('text', 'question_share')),
  constraint direct_messages_payload_check check (
    (message_type = 'text'
      and body is not null
      and body = btrim(body)
      and char_length(body) between 1 and 1000
      and question_id is null)
    or
    (message_type = 'question_share'
      and body is null
      and question_id is not null)
  )
);

comment on table public.direct_messages is
  'Participant-only text or reference-only question messages. Question content remains in game_incidents.';

create index direct_messages_conversation_cursor_idx
  on public.direct_messages (conversation_id, created_at desc, id desc);
create index direct_messages_sender_rate_idx
  on public.direct_messages (sender_id, created_at desc);
create index direct_messages_question_duplicate_idx
  on public.direct_messages (conversation_id, sender_id, question_id, created_at desc)
  where message_type = 'question_share';

create table public.direct_conversation_state (
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

comment on table public.direct_conversation_state is
  'Private per-participant conversation cursor. It is never exposed to the other participant.';

create index direct_conversation_state_user_idx
  on public.direct_conversation_state (user_id, updated_at desc);

create table public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_user_id),
  constraint user_blocks_no_self check (blocker_id <> blocked_user_id)
);

comment on table public.user_blocks is
  'Directional user blocks. Either direction disables new direct messages without deleting history or friendships.';

create index user_blocks_blocked_lookup_idx
  on public.user_blocks (blocked_user_id, blocker_id);

create table public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.direct_conversations(id) on delete set null,
  message_id uuid references public.direct_messages(id) on delete set null,
  reason text not null,
  details text,
  created_at timestamptz not null default now(),
  constraint user_reports_no_self check (reporter_id <> reported_user_id),
  constraint user_reports_reason_check check (reason in ('spam', 'harassment', 'inappropriate', 'other')),
  constraint user_reports_details_check check (
    details is null or (details = btrim(details) and char_length(details) between 1 and 500)
  )
);

comment on table public.user_reports is
  'Private moderation reports. Reports never block, ban, or delete content automatically.';

create index user_reports_reporter_created_idx
  on public.user_reports (reporter_id, created_at desc);
create index user_reports_reported_created_idx
  on public.user_reports (reported_user_id, created_at desc);

alter table public.direct_conversations enable row level security;
alter table public.direct_messages enable row level security;
alter table public.direct_conversation_state enable row level security;
alter table public.user_blocks enable row level security;
alter table public.user_reports enable row level security;

revoke all on table public.direct_conversations from public, anon, authenticated;
revoke all on table public.direct_messages from public, anon, authenticated;
revoke all on table public.direct_conversation_state from public, anon, authenticated;
revoke all on table public.user_blocks from public, anon, authenticated;
revoke all on table public.user_reports from public, anon, authenticated;

grant select (id, user_low_id, user_high_id, created_at, updated_at)
  on public.direct_conversations to authenticated;
grant select (id, conversation_id, sender_id, message_type, body, question_id, created_at)
  on public.direct_messages to authenticated;
grant select (conversation_id, user_id, last_read_at, updated_at)
  on public.direct_conversation_state to authenticated;
grant select (blocker_id, blocked_user_id, created_at)
  on public.user_blocks to authenticated;

create policy "Participants can read direct conversations"
on public.direct_conversations
for select
to authenticated
using (
  (select auth.uid()) = user_low_id
  or (select auth.uid()) = user_high_id
);

create policy "Participants can read direct messages"
on public.direct_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.direct_conversations as conversation
    where conversation.id = direct_messages.conversation_id
      and ((select auth.uid()) = conversation.user_low_id
        or (select auth.uid()) = conversation.user_high_id)
  )
);

create policy "Users can read only their own conversation cursor"
on public.direct_conversation_state
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read only blocks they created"
on public.user_blocks
for select
to authenticated
using ((select auth.uid()) = blocker_id);

-- user_reports intentionally has no SELECT policy and no direct table grants.

create or replace function private.require_direct_message_conversation(
  actor_id uuid,
  target_user_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  conversation_id uuid;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if target_user_id is null or target_user_id = actor_id then
    raise exception using errcode = '22023', message = 'A different target user is required.';
  end if;

  if not exists (
    select 1
    from public.friend_relationships as relationship
    where relationship.pair_low_id = least(actor_id, target_user_id)
      and relationship.pair_high_id = greatest(actor_id, target_user_id)
      and relationship.status = 'accepted'
  ) then
    raise exception using errcode = '42501', message = 'Direct messages require an accepted friendship.';
  end if;

  if exists (
    select 1
    from public.user_blocks as block
    where (block.blocker_id = actor_id and block.blocked_user_id = target_user_id)
      or (block.blocker_id = target_user_id and block.blocked_user_id = actor_id)
  ) then
    raise exception using errcode = '42501', message = 'Direct messaging is not available for this user pair.';
  end if;

  insert into public.direct_conversations (user_low_id, user_high_id)
  values (least(actor_id, target_user_id), greatest(actor_id, target_user_id))
  on conflict (user_low_id, user_high_id) do update
    set user_low_id = excluded.user_low_id
  returning id into conversation_id;

  insert into public.direct_conversation_state (conversation_id, user_id)
  values (conversation_id, actor_id), (conversation_id, target_user_id)
  on conflict (conversation_id, user_id) do nothing;

  return conversation_id;
end;
$$;

create or replace function private.enforce_direct_message_rate_limit(actor_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  sent_in_ten_seconds integer;
  sent_in_minute integer;
begin
  -- Serialize rate checks per sender so concurrent RPCs cannot bypass the window.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor_id::text, 0));

  select
    count(*) filter (where message.created_at >= now() - interval '10 seconds'),
    count(*)
  into sent_in_ten_seconds, sent_in_minute
  from public.direct_messages as message
  where message.sender_id = actor_id
    and message.created_at >= now() - interval '1 minute';

  if sent_in_ten_seconds >= 10 or sent_in_minute >= 60 then
    raise exception using errcode = '54000', message = 'Message rate limit exceeded.';
  end if;
end;
$$;

create or replace function public.get_or_create_direct_conversation(target_user_id uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
begin
  return private.require_direct_message_conversation(caller_id, target_user_id);
end;
$$;

create or replace function public.get_direct_conversation_context(target_user_id uuid)
returns table (
  conversation_id uuid,
  can_send boolean,
  is_friend boolean,
  blocked_by_viewer boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  existing_conversation_id uuid;
  accepted_friendship boolean := false;
  viewer_block boolean := false;
  either_block boolean := false;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if target_user_id is null or target_user_id = caller_id then
    raise exception using errcode = '22023', message = 'A different target user is required.';
  end if;

  select conversation.id
  into existing_conversation_id
  from public.direct_conversations as conversation
  where conversation.user_low_id = least(caller_id, target_user_id)
    and conversation.user_high_id = greatest(caller_id, target_user_id);

  select exists (
    select 1
    from public.friend_relationships as relationship
    where relationship.pair_low_id = least(caller_id, target_user_id)
      and relationship.pair_high_id = greatest(caller_id, target_user_id)
      and relationship.status = 'accepted'
  ) into accepted_friendship;

  select
    coalesce(bool_or(block.blocker_id = caller_id), false),
    count(*) > 0
  into viewer_block, either_block
  from public.user_blocks as block
  where (block.blocker_id = caller_id and block.blocked_user_id = target_user_id)
    or (block.blocker_id = target_user_id and block.blocked_user_id = caller_id);

  return query select
    existing_conversation_id,
    accepted_friendship and not either_block,
    accepted_friendship,
    viewer_block;
end;
$$;

create or replace function public.send_direct_message(
  target_user_id uuid,
  message_body text
)
returns table (
  id uuid,
  conversation_id uuid,
  sender_id uuid,
  message_type text,
  body text,
  question_id text,
  created_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  normalized_body text := btrim(coalesce(message_body, ''));
  target_conversation_id uuid;
  created_message public.direct_messages%rowtype;
begin
  if char_length(normalized_body) < 1 or char_length(normalized_body) > 1000 then
    raise exception using errcode = '22023', message = 'Message body must contain 1 to 1000 characters.';
  end if;

  target_conversation_id := private.require_direct_message_conversation(caller_id, target_user_id);
  perform private.enforce_direct_message_rate_limit(caller_id);

  insert into public.direct_messages (conversation_id, sender_id, message_type, body)
  values (target_conversation_id, caller_id, 'text', normalized_body)
  returning * into created_message;

  update public.direct_conversations as conversation
  set updated_at = created_message.created_at
  where conversation.id = target_conversation_id;

  update public.direct_conversation_state as state
  set last_read_at = greatest(coalesce(state.last_read_at, '-infinity'::timestamptz), created_message.created_at),
      updated_at = now()
  where state.conversation_id = target_conversation_id
    and state.user_id = caller_id;

  return query select
    created_message.id,
    created_message.conversation_id,
    created_message.sender_id,
    created_message.message_type,
    created_message.body,
    created_message.question_id,
    created_message.created_at;
end;
$$;

create or replace function public.send_question_to_direct_message(
  target_user_id uuid,
  shared_question_id text
)
returns table (
  id uuid,
  conversation_id uuid,
  sender_id uuid,
  message_type text,
  body text,
  question_id text,
  created_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  normalized_question_id text := btrim(coalesce(shared_question_id, ''));
  target_conversation_id uuid;
  existing_message public.direct_messages%rowtype;
  created_message public.direct_messages%rowtype;
begin
  if normalized_question_id = '' or not exists (
    select 1 from public.game_incidents as incident where incident.id = normalized_question_id
  ) then
    raise exception using errcode = '23503', message = 'Question not found.';
  end if;

  target_conversation_id := private.require_direct_message_conversation(caller_id, target_user_id);

  select message.*
  into existing_message
  from public.direct_messages as message
  where message.conversation_id = target_conversation_id
    and message.sender_id = caller_id
    and message.message_type = 'question_share'
    and message.question_id = normalized_question_id
    and message.created_at >= now() - interval '5 minutes'
  order by message.created_at desc, message.id desc
  limit 1;

  if found then
    return query select
      existing_message.id,
      existing_message.conversation_id,
      existing_message.sender_id,
      existing_message.message_type,
      existing_message.body,
      existing_message.question_id,
      existing_message.created_at;
    return;
  end if;

  perform private.enforce_direct_message_rate_limit(caller_id);

  insert into public.direct_messages (conversation_id, sender_id, message_type, question_id)
  values (target_conversation_id, caller_id, 'question_share', normalized_question_id)
  returning * into created_message;

  update public.direct_conversations as conversation
  set updated_at = created_message.created_at
  where conversation.id = target_conversation_id;

  update public.direct_conversation_state as state
  set last_read_at = greatest(coalesce(state.last_read_at, '-infinity'::timestamptz), created_message.created_at),
      updated_at = now()
  where state.conversation_id = target_conversation_id
    and state.user_id = caller_id;

  return query select
    created_message.id,
    created_message.conversation_id,
    created_message.sender_id,
    created_message.message_type,
    created_message.body,
    created_message.question_id,
    created_message.created_at;
end;
$$;

create or replace function public.list_direct_messages(
  target_conversation_id uuid,
  before_created_at timestamptz default null,
  before_message_id uuid default null,
  requested_limit integer default 40
)
returns table (
  id uuid,
  conversation_id uuid,
  sender_id uuid,
  message_type text,
  body text,
  question_id text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  safe_limit integer := least(greatest(coalesce(requested_limit, 40), 1), 50);
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if not exists (
    select 1
    from public.direct_conversations as conversation
    where conversation.id = target_conversation_id
      and (conversation.user_low_id = caller_id or conversation.user_high_id = caller_id)
  ) then
    raise exception using errcode = '42501', message = 'Conversation access denied.';
  end if;

  if (before_created_at is null) <> (before_message_id is null) then
    raise exception using errcode = '22023', message = 'A complete message cursor is required.';
  end if;

  return query
  select
    message.id,
    message.conversation_id,
    message.sender_id,
    message.message_type,
    message.body,
    message.question_id,
    message.created_at
  from public.direct_messages as message
  where message.conversation_id = target_conversation_id
    and (
      before_created_at is null
      or (message.created_at, message.id) < (before_created_at, before_message_id)
    )
  order by message.created_at desc, message.id desc
  limit safe_limit;
end;
$$;

create or replace function public.list_direct_conversations()
returns table (
  conversation_id uuid,
  other_user_id uuid,
  conversation_updated_at timestamptz,
  last_message_id uuid,
  last_message_sender_id uuid,
  last_message_type text,
  last_message_body text,
  last_message_question_id text,
  last_message_created_at timestamptz,
  unread_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  return query
  select
    conversation.id,
    case when conversation.user_low_id = caller_id
      then conversation.user_high_id else conversation.user_low_id end,
    conversation.updated_at,
    latest.id,
    latest.sender_id,
    latest.message_type,
    latest.body,
    latest.question_id,
    latest.created_at,
    coalesce(unread.unread_count, 0)::bigint
  from public.direct_conversations as conversation
  left join public.direct_conversation_state as state
    on state.conversation_id = conversation.id
   and state.user_id = caller_id
  left join lateral (
    select message.*
    from public.direct_messages as message
    where message.conversation_id = conversation.id
    order by message.created_at desc, message.id desc
    limit 1
  ) as latest on true
  left join lateral (
    select count(*)::bigint as unread_count
    from public.direct_messages as message
    where message.conversation_id = conversation.id
      and message.sender_id <> caller_id
      and (state.last_read_at is null or message.created_at > state.last_read_at)
  ) as unread on true
  where conversation.user_low_id = caller_id
     or conversation.user_high_id = caller_id
  order by coalesce(latest.created_at, conversation.updated_at) desc, conversation.id desc;
end;
$$;

create or replace function public.get_direct_message_unread_total()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null then 0::bigint
    else coalesce(sum(conversation.unread_count), 0)::bigint
  end
  from public.list_direct_conversations() as conversation;
$$;

create or replace function public.mark_conversation_read(target_conversation_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  latest_message_at timestamptz;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if not exists (
    select 1
    from public.direct_conversations as conversation
    where conversation.id = target_conversation_id
      and (conversation.user_low_id = caller_id or conversation.user_high_id = caller_id)
  ) then
    return false;
  end if;

  select max(message.created_at)
  into latest_message_at
  from public.direct_messages as message
  where message.conversation_id = target_conversation_id;

  insert into public.direct_conversation_state (conversation_id, user_id, last_read_at, updated_at)
  values (target_conversation_id, caller_id, coalesce(latest_message_at, now()), now())
  on conflict (conversation_id, user_id) do update
    set last_read_at = greatest(
          coalesce(public.direct_conversation_state.last_read_at, '-infinity'::timestamptz),
          excluded.last_read_at
        ),
        updated_at = now();

  return true;
end;
$$;

create or replace function public.block_user(target_user_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if target_user_id is null or target_user_id = caller_id then
    raise exception using errcode = '22023', message = 'A different target user is required.';
  end if;

  insert into public.user_blocks (blocker_id, blocked_user_id)
  values (caller_id, target_user_id)
  on conflict (blocker_id, blocked_user_id) do nothing;
  return true;
end;
$$;

create or replace function public.unblock_user(target_user_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if target_user_id is null or target_user_id = caller_id then
    raise exception using errcode = '22023', message = 'A different target user is required.';
  end if;

  delete from public.user_blocks as block
  where block.blocker_id = caller_id
    and block.blocked_user_id = target_user_id;
  return found;
end;
$$;

create or replace function public.report_user_or_message(
  target_user_id uuid,
  report_reason text,
  report_details text default null,
  target_conversation_id uuid default null,
  target_message_id uuid default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  normalized_reason text := lower(btrim(coalesce(report_reason, '')));
  normalized_details text := nullif(btrim(coalesce(report_details, '')), '');
  message_conversation_id uuid;
  message_sender_id uuid;
  created_report_id uuid;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if target_user_id is null or target_user_id = caller_id then
    raise exception using errcode = '22023', message = 'A different reported user is required.';
  end if;
  if normalized_reason not in ('spam', 'harassment', 'inappropriate', 'other') then
    raise exception using errcode = '22023', message = 'Unsupported report reason.';
  end if;
  if normalized_details is not null and char_length(normalized_details) > 500 then
    raise exception using errcode = '22023', message = 'Report details may contain at most 500 characters.';
  end if;

  if target_conversation_id is not null and not exists (
    select 1
    from public.direct_conversations as conversation
    where conversation.id = target_conversation_id
      and ((conversation.user_low_id = caller_id and conversation.user_high_id = target_user_id)
        or (conversation.user_high_id = caller_id and conversation.user_low_id = target_user_id))
  ) then
    raise exception using errcode = '42501', message = 'Report conversation access denied.';
  end if;

  if target_message_id is not null then
    select message.conversation_id, message.sender_id
    into message_conversation_id, message_sender_id
    from public.direct_messages as message
    join public.direct_conversations as conversation on conversation.id = message.conversation_id
    where message.id = target_message_id
      and (conversation.user_low_id = caller_id or conversation.user_high_id = caller_id);

    if message_conversation_id is null or message_sender_id <> target_user_id then
      raise exception using errcode = '42501', message = 'Report message access denied.';
    end if;
    if target_conversation_id is not null and target_conversation_id <> message_conversation_id then
      raise exception using errcode = '22023', message = 'Report message does not belong to the conversation.';
    end if;
    target_conversation_id := message_conversation_id;
  end if;

  if target_conversation_id is null and not exists (
    select 1 from auth.users as account where account.id = target_user_id
  ) then
    raise exception using errcode = 'P0002', message = 'Reported user not found.';
  end if;

  insert into public.user_reports (
    reporter_id,
    reported_user_id,
    conversation_id,
    message_id,
    reason,
    details
  ) values (
    caller_id,
    target_user_id,
    target_conversation_id,
    target_message_id,
    normalized_reason,
    normalized_details
  ) returning id into created_report_id;

  return created_report_id;
end;
$$;

revoke all on function private.require_direct_message_conversation(uuid, uuid) from public, anon, authenticated;
revoke all on function private.enforce_direct_message_rate_limit(uuid) from public, anon, authenticated;
revoke all on function public.get_or_create_direct_conversation(uuid) from public, anon, authenticated;
revoke all on function public.get_direct_conversation_context(uuid) from public, anon, authenticated;
revoke all on function public.send_direct_message(uuid, text) from public, anon, authenticated;
revoke all on function public.send_question_to_direct_message(uuid, text) from public, anon, authenticated;
revoke all on function public.list_direct_messages(uuid, timestamptz, uuid, integer) from public, anon, authenticated;
revoke all on function public.list_direct_conversations() from public, anon, authenticated;
revoke all on function public.get_direct_message_unread_total() from public, anon, authenticated;
revoke all on function public.mark_conversation_read(uuid) from public, anon, authenticated;
revoke all on function public.block_user(uuid) from public, anon, authenticated;
revoke all on function public.unblock_user(uuid) from public, anon, authenticated;
revoke all on function public.report_user_or_message(uuid, text, text, uuid, uuid) from public, anon, authenticated;

grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;
grant execute on function public.get_direct_conversation_context(uuid) to authenticated;
grant execute on function public.send_direct_message(uuid, text) to authenticated;
grant execute on function public.send_question_to_direct_message(uuid, text) to authenticated;
grant execute on function public.list_direct_messages(uuid, timestamptz, uuid, integer) to authenticated;
grant execute on function public.list_direct_conversations() to authenticated;
grant execute on function public.get_direct_message_unread_total() to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.unblock_user(uuid) to authenticated;
grant execute on function public.report_user_or_message(uuid, text, text, uuid, uuid) to authenticated;

-- Supabase Realtime does not publish new tables automatically. Add only this
-- insert-only chat table when the standard publication is present.
do $$
begin
  if exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_catalog.pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'direct_messages'
    ) then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
end;
$$;

commit;
