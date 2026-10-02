begin;

-- Profile visibility is directional: a profile owner may hide themselves from
-- a blocked viewer without preventing the owner from viewing that viewer.
-- The caller identity is always derived from auth.uid().
create or replace function public.can_view_public_profile(profile_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and profile_owner_id is not null
    and not exists (
      select 1
      from public.user_blocks as block
      where block.blocker_id = profile_owner_id
        and block.blocked_user_id = (select auth.uid())
    );
$$;

comment on function public.can_view_public_profile(uuid) is
  'Returns whether the authenticated viewer may read a public profile without exposing block rows.';

revoke all on function public.can_view_public_profile(uuid) from public, anon, authenticated;
grant execute on function public.can_view_public_profile(uuid) to authenticated;

drop policy if exists "Authenticated users can read public profiles" on public.public_profiles;
create policy "Authenticated users can read public profiles"
on public.public_profiles
for select
to authenticated
using (public.can_view_public_profile(user_id));

-- SECURITY DEFINER bypasses public_profiles RLS, so search must apply the same
-- directional visibility check explicitly.
create or replace function public.search_public_profiles(
  search_query text,
  result_limit integer default 10
)
returns table (
  user_id uuid,
  company_name text,
  avatar_id text,
  avatar_frame_id text,
  career_rank text,
  career_xp integer,
  reputation integer,
  success_rate numeric,
  completed_sessions integer,
  selected_badge_ids jsonb,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  folded_query text := private.company_name_casefold(private.company_name_display(coalesce(search_query, '')));
  escaped_query text;
  safe_limit integer := least(10, greatest(1, coalesce(result_limit, 10)));
begin
  if caller_id is null or char_length(folded_query) < 2 then
    return;
  end if;

  escaped_query := replace(replace(replace(folded_query, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_');

  return query
  select
    profile.user_id,
    profile.company_name,
    profile.avatar_id,
    profile.avatar_frame_id,
    profile.career_rank,
    profile.career_xp,
    profile.reputation,
    profile.success_rate,
    profile.completed_sessions,
    profile.selected_badge_ids,
    profile.updated_at
  from public.public_profiles as profile
  where profile.user_id <> caller_id
    and not exists (
      select 1
      from public.user_blocks as block
      where block.blocker_id = profile.user_id
        and block.blocked_user_id = caller_id
    )
    and private.company_name_casefold(profile.company_name) like escaped_query || '%' escape E'\\'
  order by
    case when private.company_name_casefold(profile.company_name) = folded_query then 0 else 1 end,
    char_length(profile.company_name),
    private.company_name_casefold(profile.company_name),
    profile.user_id
  limit safe_limit;
end;
$$;

revoke all on function public.search_public_profiles(text, integer) from public, anon, authenticated;
grant execute on function public.search_public_profiles(text, integer) to authenticated;

-- Profile stats are part of direct profile viewing and also bypass RLS, so a
-- blocked viewer must receive the same not-found result as for a missing row.
create or replace function public.get_social_profile_stats(target_user_id uuid)
returns table (
  friend_count bigint,
  mutual_friend_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  viewer_id uuid := (select auth.uid());
begin
  if viewer_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if target_user_id is null then
    raise exception using errcode = '22023', message = 'A target user is required.';
  end if;

  if not exists (
    select 1
    from public.public_profiles as profile
    where profile.user_id = target_user_id
      and not exists (
        select 1
        from public.user_blocks as block
        where block.blocker_id = target_user_id
          and block.blocked_user_id = viewer_id
      )
  ) then
    raise exception using errcode = 'P0002', message = 'Public profile not found.';
  end if;

  return query
  with target_friends as (
    select distinct
      case
        when relationship.requester_id = target_user_id then relationship.addressee_id
        else relationship.requester_id
      end as friend_id
    from public.friend_relationships as relationship
    where relationship.status = 'accepted'
      and (
        relationship.requester_id = target_user_id
        or relationship.addressee_id = target_user_id
      )
  ),
  viewer_friends as (
    select distinct
      case
        when relationship.requester_id = viewer_id then relationship.addressee_id
        else relationship.requester_id
      end as friend_id
    from public.friend_relationships as relationship
    where relationship.status = 'accepted'
      and (
        relationship.requester_id = viewer_id
        or relationship.addressee_id = viewer_id
      )
  )
  select
    count(distinct target_friend.friend_id)::bigint as friend_count,
    case
      when viewer_id = target_user_id then 0::bigint
      else count(distinct viewer_friend.friend_id)::bigint
    end as mutual_friend_count
  from target_friends as target_friend
  left join viewer_friends as viewer_friend
    on viewer_friend.friend_id = target_friend.friend_id;
end;
$$;

revoke all on function public.get_social_profile_stats(uuid) from public, anon, authenticated;
grant execute on function public.get_social_profile_stats(uuid) to authenticated;

-- Blocking is destructive only to the social relationship. Conversations and
-- messages are deliberately untouched so existing participants retain history.
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

  delete from public.friend_relationships as relationship
  where relationship.pair_low_id = least(caller_id, target_user_id)
    and relationship.pair_high_id = greatest(caller_id, target_user_id);

  return true;
end;
$$;

revoke all on function public.block_user(uuid) from public, anon, authenticated;
grant execute on function public.block_user(uuid) to authenticated;

commit;
