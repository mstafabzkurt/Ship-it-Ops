begin;

create table public.friend_relationships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  pair_low_id uuid generated always as (least(requester_id, addressee_id)) stored,
  pair_high_id uuid generated always as (greatest(requester_id, addressee_id)) stored,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friend_relationships_distinct_users check (requester_id <> addressee_id),
  constraint friend_relationships_status_check check (status in ('pending', 'accepted', 'rejected')),
  constraint friend_relationships_pair_unique unique (pair_low_id, pair_high_id)
);

comment on table public.friend_relationships is
  'One canonical friend request or friendship row per unordered pair of users.';
comment on column public.friend_relationships.requester_id is
  'The user who initiated the current pending request, or most recently reopened a rejected pair.';
comment on column public.friend_relationships.addressee_id is
  'The user allowed to accept or reject the current pending request.';

create index friend_relationships_requester_status_idx
  on public.friend_relationships (requester_id, status, updated_at desc);
create index friend_relationships_addressee_status_idx
  on public.friend_relationships (addressee_id, status, updated_at desc);
create index friend_relationships_status_idx
  on public.friend_relationships (status);

create or replace function private.set_friend_relationship_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger friend_relationships_set_updated_at
before update on public.friend_relationships
for each row execute function private.set_friend_relationship_updated_at();

alter table public.friend_relationships enable row level security;

revoke all on table public.friend_relationships from public, anon, authenticated;
grant select (id, requester_id, addressee_id, status, created_at, updated_at)
  on public.friend_relationships to authenticated;

create policy "Participants can read their friend relationships"
on public.friend_relationships
for select
to authenticated
using (
  (select auth.uid()) = requester_id
  or (select auth.uid()) = addressee_id
);

create or replace function public.send_friend_request(target_user_id uuid)
returns table (
  id uuid,
  requester_id uuid,
  addressee_id uuid,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  relationship public.friend_relationships%rowtype;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if target_user_id is null then
    raise exception using errcode = '22023', message = 'A target user is required.';
  end if;

  if target_user_id = caller_id then
    raise exception using errcode = '22023', message = 'A user cannot send a friend request to themselves.';
  end if;

  -- The unique canonical pair closes the absent-row race. If another request
  -- wins concurrently, retry and apply the same deterministic state machine.
  loop
    select relation.*
    into relationship
    from public.friend_relationships as relation
    where relation.pair_low_id = least(caller_id, target_user_id)
      and relation.pair_high_id = greatest(caller_id, target_user_id)
    for update;

    exit when found;

    begin
      insert into public.friend_relationships (requester_id, addressee_id, status)
      values (caller_id, target_user_id, 'pending')
      returning * into relationship;

      return query select
        relationship.id,
        relationship.requester_id,
        relationship.addressee_id,
        relationship.status,
        relationship.created_at,
        relationship.updated_at;
      return;
    exception
      when unique_violation then
        -- A concurrent insert created the canonical pair; load it on retry.
        null;
    end;
  end loop;

  if relationship.status = 'pending'
    and relationship.addressee_id = caller_id
    and relationship.requester_id = target_user_id then
    update public.friend_relationships as relation
    set status = 'accepted'
    where relation.id = relationship.id
    returning relation.* into relationship;
  elsif relationship.status = 'rejected' then
    update public.friend_relationships as relation
    set
      requester_id = caller_id,
      addressee_id = target_user_id,
      status = 'pending'
    where relation.id = relationship.id
    returning relation.* into relationship;
  end if;

  -- Existing same-direction pending and accepted relationships are idempotent.
  return query select
    relationship.id,
    relationship.requester_id,
    relationship.addressee_id,
    relationship.status,
    relationship.created_at,
    relationship.updated_at;
end;
$$;

create or replace function public.respond_friend_request(
  request_id uuid,
  response_action text
)
returns table (
  id uuid,
  requester_id uuid,
  addressee_id uuid,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  normalized_action text := lower(btrim(coalesce(response_action, '')));
  relationship public.friend_relationships%rowtype;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if normalized_action not in ('accept', 'reject') then
    raise exception using errcode = '22023', message = 'Unsupported friend request action.';
  end if;

  select relation.*
  into relationship
  from public.friend_relationships as relation
  where relation.id = request_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Friend request not found.';
  end if;

  if relationship.addressee_id <> caller_id then
    raise exception using errcode = '42501', message = 'Only the addressee may respond to this friend request.';
  end if;

  if relationship.status <> 'pending' then
    raise exception using errcode = '55000', message = 'Friend request is no longer pending.';
  end if;

  update public.friend_relationships as relation
  set status = case when normalized_action = 'accept' then 'accepted' else 'rejected' end
  where relation.id = relationship.id
  returning relation.* into relationship;

  return query select
    relationship.id,
    relationship.requester_id,
    relationship.addressee_id,
    relationship.status,
    relationship.created_at,
    relationship.updated_at;
end;
$$;

create or replace function public.remove_friend(friend_user_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  relationship_id uuid;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if friend_user_id is null or friend_user_id = caller_id then
    raise exception using errcode = '22023', message = 'A valid friend user is required.';
  end if;

  select relation.id
  into relationship_id
  from public.friend_relationships as relation
  where relation.pair_low_id = least(caller_id, friend_user_id)
    and relation.pair_high_id = greatest(caller_id, friend_user_id)
    and relation.status = 'accepted'
  for update;

  if relationship_id is null then
    return false;
  end if;

  delete from public.friend_relationships as relation
  where relation.id = relationship_id;

  return true;
end;
$$;

revoke all on function private.set_friend_relationship_updated_at() from public, anon, authenticated;
revoke all on function public.send_friend_request(uuid) from public, anon, authenticated;
revoke all on function public.respond_friend_request(uuid, text) from public, anon, authenticated;
revoke all on function public.remove_friend(uuid) from public, anon, authenticated;

grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.respond_friend_request(uuid, text) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;

commit;
