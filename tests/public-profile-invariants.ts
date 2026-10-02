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
const projectionLockdownMigration = readFileSync(
  resolve(root, 'supabase/migrations/20260926120000_lock_down_public_profile_projection.sql'),
  'utf8',
);
const correctedBlockSemantics = readFileSync(
  resolve(root, 'supabase/migrations/20260927120000_correct_block_semantics.sql'),
  'utf8',
);
const service = readFileSync(resolve(root, 'src/services/publicProfile.ts'), 'utf8');
const profileScreen = readFileSync(resolve(root, 'app/public-profile/[userId].tsx'), 'utf8');
const reportSheet = readFileSync(resolve(root, 'src/components/messaging/ReportUserSheet.tsx'), 'utf8');

assert(migration.includes('alter table public.public_profiles enable row level security'), 'Public profiles must have RLS enabled');
assert(
  migration.includes('grant select, insert, update on table public.public_profiles to authenticated')
    && migration.includes('(select auth.uid()) = user_id'),
  'The applied Phase 1 migration must document the formerly owner-scoped, all-column write surface',
);
assert(migration.includes('where profile.user_id <> caller_id'), 'Server search must exclude the current user');
assert(service.includes('profile?.userId !== currentUserId'), 'Client search must defensively exclude the current user');
assert(migration.includes('limit safe_limit'), 'Server search must enforce its bounded result limit');
assert(migration.includes('on conflict (user_id) do update set'), 'Company-name changes must update the same public profile row');
assert(migration.includes('after insert or update of') && migration.includes('player_saves_sync_public_profile'), 'Public sync must run after meaningful player-save commits');
assert(!profileScreen.includes('email') && !profileScreen.includes('companyBudget') && !profileScreen.includes('ownedCosmeticIds'), 'The public screen must not reference private account or save fields');

// Public-profile social actions reuse the existing safety services and keep
// blocked, friend, pending, and non-friend states mutually exclusive.
assert(
  profileScreen.includes('getDirectConversationContext(userId)')
    && profileScreen.includes('blockDirectMessageUser(profile.userId)')
    && profileScreen.includes('unblockDirectMessageUser(profile.userId)')
    && profileScreen.includes('reportDirectMessageUser({ targetUserId: profile.userId, reason, details })')
    && profileScreen.includes('<ReportUserSheet')
    && profileScreen.includes('isBlocked={blockedByViewer}'),
  'The profile must reuse existing block, unblock, context, and report flows',
);
const socialActionsSource = profileScreen.slice(
  profileScreen.indexOf('function SocialActions'),
  profileScreen.indexOf('function confirmProfileBlock'),
);
const blockedBranch = socialActionsSource.slice(
  socialActionsSource.indexOf('{blockedByViewer ? ('),
  socialActionsSource.indexOf(') : relationshipUnavailable ? ('),
);
assert(
  blockedBranch.includes('Bu kullanıcıyı engellediniz.')
    && blockedBranch.includes('Engeli Kaldır'),
  'Blocked state must clearly expose only the unblock relationship action',
);
for (const contradictoryLabel of ['Mesaj Gönder', 'Arkadaşlık İsteği Gönder', 'Arkadaşsınız', 'Arkadaşlıktan Çıkar']) {
  assert(!blockedBranch.includes(contradictoryLabel), `Blocked state must not render ${contradictoryLabel}`);
}
assert(
  profileScreen.includes('setBlockedByViewer(true);\n        setRelationship(null);')
    && profileScreen.includes('setBlockedByViewer(false);\n        setRelationship(null);'),
  'Block and unblock must refresh local state immediately without restoring friendship',
);
assert(
  profileScreen.includes("const title = 'Kullanıcı engellensin mi?'")
    && profileScreen.includes('arkadaşlığın varsa sona erecek')
    && profileScreen.includes('yeni mesaj gönderilemeyecek')
    && profileScreen.includes('Eski mesaj geçmişin silinmeyecek')
    && profileScreen.includes('Engeli daha sonra kaldırabilirsin.'),
  'Block confirmation must explain friendship, new messages, retained history, and later unblock',
);
for (const normalStateLabel of [
  'Mesaj Gönder',
  'Arkadaşlıktan Çıkar',
  'Arkadaşlık İsteği Gönder',
  'Kabul Et',
  'Reddet',
]) {
  assert(profileScreen.includes(normalStateLabel), `Public profile must preserve normal social state ${normalStateLabel}`);
}
assert(
  profileScreen.includes('const statusLabel = getFriendshipStatusLabel(direction);'),
  'Accepted and pending status copy must continue to use the existing friendship-state labels',
);
assert(
  profileScreen.includes("onFocus={() => setFocusedControl('block')}")
    && profileScreen.includes('styles.controlFocused')
    && profileScreen.includes("flexBasis: tokens.layout.isNarrow ? '100%' : 'auto'")
    && profileScreen.includes("safetyButtonRow: { flexDirection: 'row', flexWrap: 'wrap'"),
  'Safety actions must expose web focus and wrap or stack responsively',
);
const socialStatsUnavailableStyle = profileScreen.match(/socialStatsUnavailable:\s*\{([^}]*)\}/)?.[1] ?? '';
assert(
  socialStatsUnavailableStyle.includes('minHeight: 28')
    && !socialStatsUnavailableStyle.includes('backgroundColor')
    && !socialStatsUnavailableStyle.includes('borderWidth'),
  'Social stats failure must remain a compact muted inline state',
);
assert(
  reportSheet.includes('if (pending) return;')
    && reportSheet.includes('accessibilityState={{ disabled: pending }}')
    && reportSheet.includes('styles.controlFocused')
    && reportSheet.includes("isBlocked ? '' : ' İstersen kullanıcıyı ayrıca engelleyebilirsin.'"),
  'The reused report sheet must prevent duplicate submissions and retain accessible disabled/focus states',
);

const projectedColumns = [
  'user_id',
  'company_name',
  'avatar_id',
  'avatar_frame_id',
  'career_rank',
  'career_xp',
  'reputation',
  'success_rate',
  'completed_sessions',
  'selected_badge_ids',
  'updated_at',
];

assert(
  projectionLockdownMigration.includes('revoke all on table public.public_profiles from public, anon, authenticated'),
  'Public profiles must expose no table-level client writes',
);
assert(
  projectionLockdownMigration.includes('grant select on table public.public_profiles to authenticated'),
  'Authenticated public-profile reads must remain available',
);
assert(
  projectionLockdownMigration.includes('drop policy if exists "Users can insert their public profile"')
    && projectionLockdownMigration.includes('drop policy if exists "Users can update their public profile"'),
  'Obsolete owner-scoped client write policies must be removed',
);
assert(
  !/grant\s+(?:[^;]*\s)?(?:insert|update|delete)\b[^;]*public_profiles/is.test(projectionLockdownMigration),
  'The lockdown must not regrant any public-profile mutation privilege',
);
for (const column of projectedColumns) {
  assert(
    new RegExp(`revoke insert \\([\\s\\S]*?\\b${column}\\b[\\s\\S]*?\\), update \\(`, 'i').test(projectionLockdownMigration)
      && new RegExp(`update \\([\\s\\S]*?\\b${column}\\b[\\s\\S]*?\\) on public\\.public_profiles`, 'i').test(projectionLockdownMigration),
    `Column-level INSERT and UPDATE must be revoked for projected column ${column}`,
  );
}
assert(
  migration.includes('create or replace function private.sync_public_profile_from_player_save()')
    && migration.includes('security definer')
    && migration.includes("set search_path = ''")
    && migration.includes('insert into public.public_profiles (')
    && migration.includes('on conflict (user_id) do update set'),
  'The trusted SECURITY DEFINER projection must retain its insert/update path',
);
assert(
  !projectionLockdownMigration.includes('alter table public.player_saves')
    && !projectionLockdownMigration.includes('grant select on table public.player_saves'),
  'The lockdown must not expose or alter private player-save data',
);
assert(
  service.includes(".from('public_profiles')")
    && service.includes(`.select(PUBLIC_PROFILE_SELECT)`)
    && !service.includes(".from('player_saves')"),
  'Public profile rendering must continue to read only the public projection',
);

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

assert(
  correctedBlockSemantics.includes('create or replace function public.can_view_public_profile(profile_owner_id uuid)')
    && correctedBlockSemantics.includes('profile_owner_id is not null')
    && correctedBlockSemantics.includes('block.blocker_id = profile_owner_id')
    && correctedBlockSemantics.includes('block.blocked_user_id = (select auth.uid())'),
  'Direct profile reads must use directional owner-blocked-viewer visibility with auth-derived identity',
);
assert(
  correctedBlockSemantics.includes('revoke all on function public.can_view_public_profile(uuid) from public, anon, authenticated')
    && correctedBlockSemantics.includes('grant execute on function public.can_view_public_profile(uuid) to authenticated'),
  'The visibility helper must expose only an authenticated boolean result, never block rows',
);
assert(
  /create policy "Authenticated users can read public profiles"[\s\S]*using \(public\.can_view_public_profile\(user_id\)\)/.test(correctedBlockSemantics),
  'The public_profiles SELECT policy must hide an owner from a viewer blocked by that owner',
);
assert(
  /create or replace function public\.search_public_profiles\([\s\S]*security definer[\s\S]*block\.blocker_id = profile\.user_id[\s\S]*block\.blocked_user_id = caller_id/.test(correctedBlockSemantics),
  'SECURITY DEFINER search must explicitly hide profiles whose owners blocked the caller',
);
assert(
  /create or replace function public\.get_social_profile_stats\(target_user_id uuid\)[\s\S]*block\.blocker_id = target_user_id[\s\S]*block\.blocked_user_id = viewer_id[\s\S]*Public profile not found/.test(correctedBlockSemantics),
  'SECURITY DEFINER profile stats must enforce the same directional visibility rule',
);
assert(
  !/grant select[\s\S]*on public\.user_blocks/i.test(correctedBlockSemantics)
    && !/create policy[\s\S]*on public\.user_blocks/i.test(correctedBlockSemantics),
  'Block visibility changes must not expose user_blocks rows',
);

console.log('Public-profile and company-search invariants passed.');
