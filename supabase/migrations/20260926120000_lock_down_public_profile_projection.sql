begin;

-- public_profiles is a read-only projection for API clients. Every value is
-- owned by trusted projection/database logic; no column is directly client-owned.
revoke all on table public.public_profiles from public, anon, authenticated;

-- Also clear any column-level write privileges that may have been granted
-- independently of the original table-level INSERT/UPDATE grant.
revoke insert (
  user_id,
  company_name,
  avatar_id,
  avatar_frame_id,
  career_rank,
  career_xp,
  reputation,
  success_rate,
  completed_sessions,
  selected_badge_ids,
  updated_at
), update (
  user_id,
  company_name,
  avatar_id,
  avatar_frame_id,
  career_rank,
  career_xp,
  reputation,
  success_rate,
  completed_sessions,
  selected_badge_ids,
  updated_at
) on public.public_profiles from public, anon, authenticated;

grant select on table public.public_profiles to authenticated;

-- Client write policies are no longer needed because the projection has no
-- client-writable columns. The SECURITY DEFINER player-save trigger remains
-- the only write path and continues to execute with its owner's privileges.
drop policy if exists "Users can insert their public profile" on public.public_profiles;
drop policy if exists "Users can update their public profile" on public.public_profiles;

comment on table public.public_profiles is
  'Authenticated-readable, server-controlled profile projection populated from trusted player-save state. Contains no email, auth metadata, economy, inventory, settings, consent, telemetry, or raw player save JSON.';

commit;
