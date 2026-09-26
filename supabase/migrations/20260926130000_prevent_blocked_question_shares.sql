begin;

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

  if exists (
    select 1
    from public.user_blocks as block
    where (block.blocker_id = caller_id and block.blocked_user_id = target_user_id)
      or (block.blocker_id = target_user_id and block.blocked_user_id = caller_id)
  ) then
    raise exception using errcode = '42501', message = 'Question sharing is not available for this user pair.';
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

revoke all on function public.share_question_with_friend(uuid, text)
  from public, anon, authenticated;
grant execute on function public.share_question_with_friend(uuid, text) to authenticated;

commit;
