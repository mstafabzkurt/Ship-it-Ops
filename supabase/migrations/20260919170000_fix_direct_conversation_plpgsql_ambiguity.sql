begin;

-- The original helper declared conversation_id, which collided with the
-- direct_conversation_state conflict target during PL/pgSQL SQL preparation.
-- Keep the same signature and behavior; make every value/column role explicit.
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
  resolved_conversation_id uuid;
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

  insert into public.direct_conversations as conversation (user_low_id, user_high_id)
  values (least(actor_id, target_user_id), greatest(actor_id, target_user_id))
  on conflict on constraint direct_conversations_pair_unique do update
    set user_low_id = excluded.user_low_id
  returning conversation.id into resolved_conversation_id;

  insert into public.direct_conversation_state as state (conversation_id, user_id)
  values (resolved_conversation_id, actor_id), (resolved_conversation_id, target_user_id)
  on conflict on constraint direct_conversation_state_pkey do nothing;

  return resolved_conversation_id;
end;
$$;

revoke all on function private.require_direct_message_conversation(uuid, uuid)
  from public, anon, authenticated;

commit;
