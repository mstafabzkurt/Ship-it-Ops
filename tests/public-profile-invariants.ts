import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  PUBLIC_PROFILE_RESULT_LIMIT,
  normalizePublicProfileQuery,
  normalizePublicProfileResultLimit,
  serializePublicProfile,
} from '../src/utils/publicProfile';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(normalizePublicProfileQuery('') === null, 'Empty searches must not query');
assert(normalizePublicProfileQuery(' a ') === null, 'Search must require at least two trimmed characters');
assert(normalizePublicProfileQuery('  İyi   Kod  ') === 'İyi Kod', 'Search input must be trimmed and collapse whitespace');
assert(normalizePublicProfileResultLimit(999) === PUBLIC_PROFILE_RESULT_LIMIT, 'Search results must be capped at ten');
assert(normalizePublicProfileResultLimit(0) === 1, 'Search result limit must remain positive');

const unsafeDatabaseRow = {
  user_id: '00000000-0000-0000-0000-000000000001',
  company_name: 'Güvenli Yazılım',
  avatar_id: 'avatar_default',
  avatar_frame_id: 'avatar_frame_default',
  career_rank: 'Mühendis I',
  career_xp: 2_400,
  reputation: 320,
  success_rate: 81.25,
  completed_sessions: 7,
  selected_badge_ids: ['first_session', 'not_a_real_badge'],
  updated_at: '2026-09-17T12:00:00.000Z',
  email: 'private@example.com',
  auth_provider: 'private',
  company_budget: 999_999,
  owned_cosmetic_ids: ['private'],
  raw_player_saves: { private: true },
};
const serialized = serializePublicProfile(unsafeDatabaseRow);

assert(serialized, 'A valid public row must serialize');
assert(JSON.stringify(Object.keys(serialized).sort()) === JSON.stringify([
  'avatarFrameId',
  'avatarId',
  'careerRank',
  'careerXp',
  'companyName',
  'completedSessions',
  'reputation',
  'selectedBadgeIds',
  'successRate',
  'updatedAt',
  'userId',
].sort()), 'The public serializer must contain only the explicit allowlist');
assert(!('email' in serialized) && !('companyBudget' in serialized) && !('ownedCosmeticIds' in serialized), 'Private save fields must never enter the public payload');
assert(serialized.selectedBadgeIds.length === 1 && serialized.selectedBadgeIds[0] === 'first_session', 'Only safe achievement IDs may be public');
assert(serializePublicProfile({}) === null, 'A missing public profile row must have a safe null fallback');

const root = process.cwd();
const migration = readFileSync(resolve(root, 'supabase/migrations/20260917120000_create_public_profiles.sql'), 'utf8');
const searchFixMigration = readFileSync(
  resolve(root, 'supabase/migrations/20260917150000_remove_public_profile_search_identity_gate.sql'),
  'utf8',
);
const service = readFileSync(resolve(root, 'src/services/publicProfile.ts'), 'utf8');
const profileScreen = readFileSync(resolve(root, 'app/public-profile/[userId].tsx'), 'utf8');

assert(migration.includes('alter table public.public_profiles enable row level security'), 'Public profiles must have RLS enabled');
assert(migration.includes('(select auth.uid()) = user_id'), 'Insert/update policies must scope writes to the authenticated user');
assert(migration.includes('where profile.user_id <> caller_id'), 'Server search must exclude the current user');
assert(service.includes('profile?.userId !== currentUserId'), 'Client search must defensively exclude the current user');
assert(migration.includes('limit safe_limit'), 'Server search must enforce its bounded result limit');
assert(migration.includes('on conflict (user_id) do update set'), 'Company-name changes must update the same public profile row');
assert(migration.includes('after insert or update of') && migration.includes('player_saves_sync_public_profile'), 'Public sync must run after meaningful player-save commits');
assert(!profileScreen.includes('email') && !profileScreen.includes('companyBudget') && !profileScreen.includes('ownedCosmeticIds'), 'The public screen must not reference private account or save fields');

assert(
  searchFixMigration.includes('create or replace function public.search_public_profiles('),
  'The search correction must replace the existing RPC in place',
);
assert(
  searchFixMigration.includes('from public.public_profiles as profile'),
  'Public search must read directly from public profiles',
);
assert(
  !searchFixMigration.includes('company_name_identities'),
  'Missing or display-divergent identity rows must not hide valid public profiles',
);
for (const returnedColumn of [
  'user_id uuid',
  'company_name text',
  'avatar_id text',
  'avatar_frame_id text',
  'career_rank text',
  'career_xp integer',
  'reputation integer',
  'success_rate numeric',
  'completed_sessions integer',
  'selected_badge_ids jsonb',
  'updated_at timestamptz',
]) {
  assert(
    searchFixMigration.includes(returnedColumn),
    `The replacement RPC must preserve its ${returnedColumn} return column`,
  );
}
assert(
  searchFixMigration.includes('caller_id uuid := (select auth.uid())')
    && searchFixMigration.includes('if caller_id is null')
    && searchFixMigration.includes('where profile.user_id <> caller_id'),
  'Public search must remain authenticated and exclude the current user',
);
assert(
  searchFixMigration.includes("private.company_name_casefold(private.company_name_display(coalesce(search_query, '')))"),
  'Search queries must retain display normalization and Turkish-aware casefolding',
);
assert(
  searchFixMigration.includes("replace(replace(replace(folded_query, E'\\\\', E'\\\\\\\\'), '%', E'\\\\%'), '_', E'\\\\_')"),
  'Backslash, percent, and underscore wildcards must remain escaped',
);
assert(
  searchFixMigration.includes("private.company_name_casefold(profile.company_name) like escaped_query || '%' escape E'\\\\'"),
  'Search must retain normalized prefix matching',
);
assert(
  searchFixMigration.includes('case when private.company_name_casefold(profile.company_name) = folded_query then 0 else 1 end')
    && searchFixMigration.includes('char_length(profile.company_name)')
    && searchFixMigration.includes('private.company_name_casefold(profile.company_name)')
    && searchFixMigration.includes('profile.user_id'),
  'Exact matches must rank first with the existing deterministic prefix ordering',
);
assert(
  searchFixMigration.includes('safe_limit integer := least(10, greatest(1, coalesce(result_limit, 10)))')
    && searchFixMigration.includes('limit safe_limit'),
  'Search must continue to cap results at ten',
);
assert(
  searchFixMigration.includes('security definer')
    && searchFixMigration.includes("set search_path = ''")
    && searchFixMigration.includes('revoke all on function public.search_public_profiles(text, integer) from public, anon')
    && searchFixMigration.includes('grant execute on function public.search_public_profiles(text, integer) to authenticated'),
  'The replacement RPC must retain its authenticated-only security boundary',
);

console.log('Public-profile and company-search invariants passed.');
