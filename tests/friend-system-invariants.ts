import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  createFriendConnection,
  getFriendRelationshipDirection,
  getFriendshipStatusLabel,
  getOtherRelationshipUserId,
  serializeFriendRelationship,
  serializeSocialProfileStats,
} from '../src/utils/friends';

const userA = '00000000-0000-4000-8000-000000000001';
const userB = '00000000-0000-4000-8000-000000000002';
const relationshipId = '00000000-0000-4000-8000-000000000010';
const pending = serializeFriendRelationship({
  id: relationshipId,
  requester_id: userA,
  addressee_id: userB,
  status: 'pending',
  created_at: '2026-09-17T12:00:00.000Z',
  updated_at: '2026-09-17T12:00:00.000Z',
  email: 'private@example.com',
  player_saves: { private: true },
} as never);

assert(pending, 'A valid relationship row must serialize');
assert.equal(getOtherRelationshipUserId(pending, userA), userB);
assert.equal(getOtherRelationshipUserId(pending, userB), userA);
assert.equal(getFriendRelationshipDirection(pending, userA), 'outgoing');
assert.equal(getFriendRelationshipDirection(pending, userB), 'incoming');
assert.equal(getFriendRelationshipDirection({ ...pending, status: 'accepted' }, userA), 'accepted');
assert.equal(getFriendRelationshipDirection({ ...pending, status: 'accepted' }, userB), 'accepted');
assert.equal(getFriendRelationshipDirection({ ...pending, status: 'rejected' }, userB), 'rejected');
assert.equal(createFriendConnection(pending, userA, null)?.profile, null, 'A missing public profile must remain a safe null fallback');
assert.equal(serializeFriendRelationship({ ...pending, status: 'blocked' } as never), null, 'Unknown relationship states must be rejected');
assert.deepEqual(Object.keys(pending).sort(), [
  'addresseeId',
  'createdAt',
  'id',
  'requesterId',
  'status',
  'updatedAt',
].sort(), 'Private database fields must not enter relationship payloads');
assert.deepEqual(
  serializeSocialProfileStats({ friend_count: '24', mutual_friend_count: 3 }),
  { friendCount: 24, mutualFriendCount: 3 },
  'Social profile aggregates must serialize numeric RPC values safely',
);
assert.equal(getFriendshipStatusLabel('outgoing'), 'İstek Gönderildi');
assert.equal(getFriendshipStatusLabel('incoming'), 'Sana arkadaşlık isteği gönderdi');
assert.equal(getFriendshipStatusLabel('accepted'), 'Arkadaşsınız');
assert.equal(getFriendshipStatusLabel('rejected'), null);
assert.equal(getFriendshipStatusLabel(null), null);

const root = process.cwd();
const migration = readFileSync(resolve(root, 'supabase/migrations/20260917170000_create_friend_relationships.sql'), 'utf8');
const socialStatsMigration = readFileSync(resolve(root, 'supabase/migrations/20260917180000_create_social_profile_stats.sql'), 'utf8');
const service = readFileSync(resolve(root, 'src/services/friends.ts'), 'utf8');
const publicProfileScreen = readFileSync(resolve(root, 'app/public-profile/[userId].tsx'), 'utf8');
const friendsScreen = readFileSync(resolve(root, 'app/friends.tsx'), 'utf8');
const requestsScreen = readFileSync(resolve(root, 'app/friend-requests.tsx'), 'utf8');
const profileScreen = readFileSync(resolve(root, 'app/(tabs)/profile.tsx'), 'utf8');

// Canonical data model and abuse constraints.
assert.match(migration, /requester_id uuid not null references auth\.users\(id\) on delete cascade/);
assert.match(migration, /addressee_id uuid not null references auth\.users\(id\) on delete cascade/);
assert.match(migration, /pair_low_id uuid generated always as \(least\(requester_id, addressee_id\)\) stored/);
assert.match(migration, /pair_high_id uuid generated always as \(greatest\(requester_id, addressee_id\)\) stored/);
assert.match(migration, /unique \(pair_low_id, pair_high_id\)/, 'Only one logical relationship may exist per pair');
assert.match(migration, /check \(requester_id <> addressee_id\)/, 'Self relationships must be rejected by the table');
assert.match(migration, /if target_user_id = caller_id then/, 'Self requests must be rejected by the RPC');
assert.match(migration, /status in \('pending', 'accepted', 'rejected'\)/);
assert.match(migration, /friend_relationships_requester_status_idx[\s\S]*\(requester_id, status, updated_at desc\)/);
assert.match(migration, /friend_relationships_addressee_status_idx[\s\S]*\(addressee_id, status, updated_at desc\)/);
assert.match(migration, /friend_relationships_status_idx[\s\S]*\(status\)/);

// Duplicate and reverse requests use the same locked canonical row.
assert.match(migration, /where relation\.pair_low_id = least\(caller_id, target_user_id\)[\s\S]*for update/);
assert.match(migration, /when unique_violation then/, 'Concurrent duplicate inserts must retry safely');
assert.match(migration, /relationship\.status = 'pending'[\s\S]*relationship\.addressee_id = caller_id[\s\S]*relationship\.requester_id = target_user_id[\s\S]*set status = 'accepted'/, 'A reverse pending request must auto-accept the existing row');
assert.match(migration, /relationship\.status = 'rejected'[\s\S]*requester_id = caller_id[\s\S]*addressee_id = target_user_id[\s\S]*status = 'pending'/, 'A later request must reopen a rejected pair');

// Mutation authority is derived from auth.uid(), never from an arbitrary requester input.
assert.match(migration, /create or replace function public\.send_friend_request\(target_user_id uuid\)/);
assert.match(migration, /caller_id uuid := \(select auth\.uid\(\)\)/g);
assert.doesNotMatch(migration, /send_friend_request\([^)]*requester_id/);
assert.match(migration, /if relationship\.addressee_id <> caller_id then[\s\S]*Only the addressee may respond/);
assert.match(migration, /normalized_action not in \('accept', 'reject'\)/);
assert.match(migration, /relation\.status = 'accepted'[\s\S]*delete from public\.friend_relationships/, 'Either participant may remove the canonical accepted pair');

// RLS and grants expose rows only to their participants.
assert.match(migration, /alter table public\.friend_relationships enable row level security/);
assert.match(migration, /for select[\s\S]*to authenticated[\s\S]*auth\.uid\(\)\) = requester_id[\s\S]*auth\.uid\(\)\) = addressee_id/);
assert.match(migration, /revoke all on table public\.friend_relationships from public, anon, authenticated/);
assert.match(migration, /grant select \(id, requester_id, addressee_id, status, created_at, updated_at\)[\s\S]*on public\.friend_relationships to authenticated/);
assert.doesNotMatch(migration, /grant (insert|update|delete).*friend_relationships.*authenticated/i);
for (const functionName of ['send_friend_request(uuid)', 'respond_friend_request(uuid, text)', 'remove_friend(uuid)']) {
  assert.equal(migration.includes(`revoke all on function public.${functionName} from public, anon, authenticated`), true);
  assert.equal(migration.includes(`grant execute on function public.${functionName} to authenticated`), true);
}
assert.equal((migration.match(/security definer/g) ?? []).length >= 4, true);
assert.equal((migration.match(/set search_path = ''/g) ?? []).length >= 4, true);

// Social stats expose accepted aggregate counts without weakening relationship RLS.
assert.match(socialStatsMigration, /create or replace function public\.get_social_profile_stats\(target_user_id uuid\)/);
assert.match(socialStatsMigration, /returns table \(\s*friend_count bigint,\s*mutual_friend_count bigint\s*\)/);
assert.match(socialStatsMigration, /viewer_id uuid := \(select auth\.uid\(\)\)/, 'Viewer identity must come from auth.uid()');
assert.match(socialStatsMigration, /if viewer_id is null then[\s\S]*Authentication required/);
assert.doesNotMatch(socialStatsMigration, /viewer_user_id|current_user_id/, 'The RPC must not accept an arbitrary viewer UUID');
assert.equal((socialStatsMigration.match(/relationship\.status = 'accepted'/g) ?? []).length, 2, 'Both target and viewer sets must include accepted relationships only');
assert.doesNotMatch(socialStatsMigration, /relationship\.status = '(pending|rejected)'/, 'Pending and rejected rows must never contribute to counts');
assert.equal((socialStatsMigration.match(/select distinct/g) ?? []).length, 2, 'Canonical friend sets must still defend against duplicate counting');
assert.match(socialStatsMigration, /count\(distinct target_friend\.friend_id\)::bigint as friend_count/);
assert.match(socialStatsMigration, /left join viewer_friends as viewer_friend[\s\S]*viewer_friend\.friend_id = target_friend\.friend_id/, 'Mutual friends must be the intersection of accepted friend sets');
assert.match(socialStatsMigration, /when viewer_id = target_user_id then 0::bigint/, 'Self-profile mutual count must be zero');
assert.match(socialStatsMigration, /security definer[\s\S]*set search_path = ''/);
assert.match(socialStatsMigration, /revoke all on function public\.get_social_profile_stats\(uuid\) from public, anon, authenticated/);
assert.match(socialStatsMigration, /grant execute on function public\.get_social_profile_stats\(uuid\) to authenticated/);
const socialStatsReturnColumns = socialStatsMigration.match(/returns table \(([\s\S]*?)\)\s*language/)?.[1] ?? '';
assert.match(socialStatsReturnColumns, /^\s*friend_count bigint,\s*mutual_friend_count bigint\s*$/);
assert.doesNotMatch(socialStatsReturnColumns, /requester_id|addressee_id|status|email/, 'The social-stats RPC must expose aggregate columns only');

// Read models join only against the explicit public-profile allowlist.
assert.match(service, /\.from\('public_profiles'\)/);
assert.match(service, /\.select\(PUBLIC_PROFILE_SELECT\)/);
assert.doesNotMatch(service, /player_saves|email|auth_metadata|raw_user_meta_data/);
assert.match(service, /supabase\.rpc\('get_social_profile_stats', \{\s*target_user_id: userId/);
for (const screen of [publicProfileScreen, friendsScreen, requestsScreen]) {
  assert.doesNotMatch(screen, /player_saves|email|auth_metadata|raw_user_meta_data/);
}
assert.match(publicProfileScreen, /profile\.userId !== currentUserId \? \(/, 'A user must not see friend actions on their own profile');
assert.match(publicProfileScreen, /!isOwnProfile \? \(/, 'A self-profile must hide the mutual-friend metric');
for (const label of ['Arkadaş Ekle', 'Kabul Et', 'Reddet', 'Arkadaşlıktan Çıkar']) {
  assert.equal(publicProfileScreen.includes(label), true, `Missing friendship action label: ${label}`);
}
assert.match(publicProfileScreen, /getFriendshipStatusLabel\(direction\)/, 'Friendship status labels must use the tested mapping');
assert.match(friendsScreen, /profile=\{item\.profile\}/, 'Friends UI must tolerate its nullable safe public profile');
assert.match(requestsScreen, /profile=\{item\.profile\}/, 'Request UI must tolerate its nullable safe public profile');
assert.match(requestsScreen, /disabled=\{isActing\}/, 'Request actions must disable duplicate presses');
assert.match(profileScreen, /countIncomingFriendRequests/);
assert.match(profileScreen, /router\.push\('\/friends'\)/);
assert.match(profileScreen, /router\.push\('\/friend-requests'\)/);

console.log('Friend-system data, security, service, and UI invariants passed.');
