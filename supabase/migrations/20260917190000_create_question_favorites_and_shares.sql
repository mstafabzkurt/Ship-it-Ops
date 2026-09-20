begin;

create table public.question_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.game_incidents(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

comment on table public.question_favorites is
  'Account-owned references to saved game questions. Question content remains in game_incidents.';

alter table public.question_favorites enable row level security;

revoke all on table public.question_favorites from public, anon, authenticated;
grant select, insert, delete on table public.question_favorites to authenticated;

create policy "Users can read their own question favorites"
on public.question_favorites
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add their own question favorites"
on public.question_favorites
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can remove their own question favorites"
on public.question_favorites
for delete
to authenticated
using ((select auth.uid()) = user_id);

create table public.question_shares (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.game_incidents(id) on delete cascade,
  created_at timestamptz not null default now(),
  opened_at timestamptz,
  constraint question_shares_distinct_users check (sender_id <> recipient_id)
);

comment on table public.question_shares is
  'Reference-only question shares between accepted friends. No free-text message content is stored.';

create index question_shares_recipient_created_idx
  on public.question_shares (recipient_id, created_at desc);
create index question_shares_sender_created_idx
  on public.question_shares (sender_id, created_at desc);
create index question_shares_recent_duplicate_idx
  on public.question_shares (sender_id, recipient_id, question_id, created_at desc);

alter table public.question_shares enable row level security;

revoke all on table public.question_shares from public, anon, authenticated;
grant select (id, sender_id, recipient_id, question_id, created_at, opened_at)
  on public.question_shares to authenticated;

create policy "Recipients can read received question shares"
on public.question_shares
for select
to authenticated
using ((select auth.uid()) = recipient_id);

create or replace function public.share_question_with_friend(
  target_user_id uuid,
  shared_question_id text
)
returns table (
  id uuid,
  sender_id uuid,
  recipient_id uuid,
  question_id text,
  created_at timestamptz,
  opened_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  normalized_question_id text := btrim(coalesce(shared_question_id, ''));
  existing_share public.question_shares%rowtype;
  created_share public.question_shares%rowtype;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if target_user_id is null or target_user_id = caller_id then
    raise exception using errcode = '22023', message = 'A different target user is required.';
  end if;

  if normalized_question_id = '' then
    raise exception using errcode = '22023', message = 'A question is required.';
  end if;

  if not exists (
    select 1
    from public.game_incidents as incident
    where incident.id = normalized_question_id
  ) then
    raise exception using errcode = '23503', message = 'Question not found.';
  end if;

  if not exists (
    select 1
    from public.friend_relationships as relationship
    where relationship.pair_low_id = least(caller_id, target_user_id)
      and relationship.pair_high_id = greatest(caller_id, target_user_id)
      and relationship.status = 'accepted'
  ) then
    raise exception using errcode = '42501', message = 'Questions can only be shared with accepted friends.';
  end if;

  select share.*
  into existing_share
  from public.question_shares as share
  where share.sender_id = caller_id
    and share.recipient_id = target_user_id
    and share.question_id = normalized_question_id
    and share.created_at >= now() - interval '5 minutes'
  order by share.created_at desc
  limit 1;

  if found then
    return query select
      existing_share.id,
      existing_share.sender_id,
      existing_share.recipient_id,
      existing_share.question_id,
      existing_share.created_at,
      existing_share.opened_at;
    return;
  end if;

  insert into public.question_shares (sender_id, recipient_id, question_id)
  values (caller_id, target_user_id, normalized_question_id)
  returning * into created_share;

  return query select
    created_share.id,
    created_share.sender_id,
    created_share.recipient_id,
    created_share.question_id,
    created_share.created_at,
    created_share.opened_at;
end;
$$;

create or replace function public.mark_question_share_opened(share_id uuid)
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

  update public.question_shares as share
  set opened_at = coalesce(share.opened_at, now())
  where share.id = share_id
    and share.recipient_id = caller_id;

  return found;
end;
$$;

revoke all on function public.share_question_with_friend(uuid, text) from public, anon, authenticated;
revoke all on function public.mark_question_share_opened(uuid) from public, anon, authenticated;

grant execute on function public.share_question_with_friend(uuid, text) to authenticated;
grant execute on function public.mark_question_share_opened(uuid) to authenticated;

commit;
