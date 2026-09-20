begin;

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

comment on function public.get_social_profile_stats(uuid) is
  'Returns accepted friend and mutual-friend counts for a public profile without exposing relationship rows.';

revoke all on function public.get_social_profile_stats(uuid) from public, anon, authenticated;
grant execute on function public.get_social_profile_stats(uuid) to authenticated;

commit;
