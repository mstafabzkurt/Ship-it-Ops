import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  getDirectMessageCursor,
  getDirectMessagePreview,
  mergeDirectMessageEntries,
  serializeDirectConversationContext,
  serializeDirectConversationSummary,
  serializeDirectMessage,
  uniqueDirectConversationSummaries,
  type DirectMessageEntry,
} from '../src/utils/directMessaging';
import { getComposerEnterAction, runDirectMessageSendOnce } from '../src/utils/directMessageComposer';
import {
  formatGlobalUnreadBadge,
  getMessagesShortcutAccessibilityLabel,
  shouldAnimateUnreadAttention,
  shouldShowGlobalMessagesShortcut,
} from '../src/utils/globalMessaging';

const root = process.cwd();
const migration = readFileSync(resolve(root, 'supabase/migrations/20260917200000_create_friend_direct_messaging.sql'), 'utf8');
const ambiguityRepair = readFileSync(resolve(root, 'supabase/migrations/20260919170000_fix_direct_conversation_plpgsql_ambiguity.sql'), 'utf8');
const service = readFileSync(resolve(root, 'src/services/directMessaging.ts'), 'utf8');
const messagesScreen = readFileSync(resolve(root, 'app/messages/index.tsx'), 'utf8');
const conversationScreen = readFileSync(resolve(root, 'app/messages/[userId].tsx'), 'utf8');
const profileScreen = readFileSync(resolve(root, 'app/(tabs)/profile.tsx'), 'utf8');
const friendsScreen = readFileSync(resolve(root, 'app/friends.tsx'), 'utf8');
const publicProfileScreen = readFileSync(resolve(root, 'app/public-profile/[userId].tsx'), 'utf8');
const shareSheet = readFileSync(resolve(root, 'src/components/social/QuestionShareSheet.tsx'), 'utf8');
const questionDetail = readFileSync(resolve(root, 'app/question-detail/[questionId].tsx'), 'utf8');
const rootLayout = readFileSync(resolve(root, 'app/_layout.tsx'), 'utf8');
const unreadProvider = readFileSync(resolve(root, 'src/state/MessagingUnreadContext.tsx'), 'utf8');
const shortcut = readFileSync(resolve(root, 'src/components/messaging/GlobalMessagesShortcut.tsx'), 'utf8');
const tabsLayout = readFileSync(resolve(root, 'app/(tabs)/_layout.tsx'), 'utf8');

const functionDefinitions = (sql: string) => [...sql.matchAll(/create or replace function\s+([a-z_]+\.[a-z_]+)\s*\([\s\S]*?\$\$;/gi)]
  .map((match) => ({ name: match[1].toLowerCase(), body: match[0] }));
const originalFunctions = functionDefinitions(migration);
const repairFunctions = functionDefinitions(ambiguityRepair);
assert.deepEqual(repairFunctions.map((item) => item.name), ['private.require_direct_message_conversation'], 'Repair must replace only the affected helper');
assert.doesNotMatch(ambiguityRepair, /#variable_conflict|plpgsql\.variable_conflict/i, 'Repair must resolve names explicitly');
assert.match(ambiguityRepair, /security definer\s+set search_path = ''/i);
assert.match(ambiguityRepair, /revoke all on function private\.require_direct_message_conversation\(uuid, uuid\)\s+from public, anon, authenticated/i);
assert.match(ambiguityRepair, /returning conversation\.id into resolved_conversation_id/i);
assert.match(ambiguityRepair, /on conflict on constraint direct_conversation_state_pkey do nothing/i);
assert.match(ambiguityRepair, /relationship\.status = 'accepted'/);
assert.match(ambiguityRepair, /block\.blocker_id = actor_id[\s\S]*block\.blocker_id = target_user_id/);

const plpgsqlVariableNames = (body: string) => {
  const declarations = body.match(/\bdeclare\s+([\s\S]*?)\bbegin\b/i)?.[1] ?? '';
  const returnColumns = body.match(/\breturns table\s*\(([\s\S]*?)\)\s*language/i)?.[1] ?? '';
  return new Set([
    ...[...declarations.matchAll(/^\s*([a-z_][a-z_0-9]*)\s+(?:uuid|integer|bigint|boolean|text|timestamptz|public\.)/gim)].map((match) => match[1].toLowerCase()),
    ...[...returnColumns.matchAll(/^\s*([a-z_][a-z_0-9]*)\s+/gim)].map((match) => match[1].toLowerCase()),
  ]);
};
const ambiguousSqlNames = (body: string) => {
  const variables = plpgsqlVariableNames(body);
  const conflictNames = [...body.matchAll(/\bon conflict\s*\(([^)]+)\)/gi)]
    .flatMap((match) => match[1].split(',').map((name) => name.trim().toLowerCase()));
  const returningNames = [...body.matchAll(/\breturning\s+([a-z_][a-z_0-9]*)\s+into\b/gi)]
    .map((match) => match[1].toLowerCase());
  const barePredicateNames = [...body.matchAll(/\b(?:where|order by)\s+([a-z_][a-z_0-9]*)\b(?!\s*\.)/gi)]
    .map((match) => match[1].toLowerCase());
  return [...conflictNames, ...returningNames, ...barePredicateNames].filter((name) => variables.has(name));
};
const originalHelper = originalFunctions.find((item) => item.name === 'private.require_direct_message_conversation');
assert(originalHelper);
assert.deepEqual(ambiguousSqlNames(originalHelper.body), ['conversation_id'], 'Regression test must identify the applied migration failure');
const effectiveFunctions = new Map(originalFunctions.map((item) => [item.name, item.body]));
for (const item of repairFunctions) effectiveFunctions.set(item.name, item.body);
for (const name of [
  'private.require_direct_message_conversation',
  'public.get_or_create_direct_conversation',
  'public.get_direct_conversation_context',
  'public.list_direct_messages',
  'public.list_direct_conversations',
  'public.get_direct_message_unread_total',
  'public.mark_conversation_read',
  'public.send_direct_message',
  'public.send_question_to_direct_message',
  'public.block_user',
  'public.unblock_user',
  'public.report_user_or_message',
]) {
  const body = effectiveFunctions.get(name);
  assert(body, `Missing audited messaging RPC: ${name}`);
  assert.deepEqual(ambiguousSqlNames(body), [], `${name} must not have bare SQL identifiers colliding with PL/pgSQL variables`);
}

const userA = '00000000-0000-4000-8000-000000000001';
const userB = '00000000-0000-4000-8000-000000000002';
const conversationId = '00000000-0000-4000-8000-000000000010';
const messageOneId = '00000000-0000-4000-8000-000000000011';
const messageTwoId = '00000000-0000-4000-8000-000000000012';

const textMessage = serializeDirectMessage({
  id: messageOneId,
  conversation_id: conversationId,
  sender_id: userA,
  message_type: 'text',
  body: 'Merhaba',
  question_id: null,
  created_at: '2026-09-17T12:00:00.000Z',
  email: 'private@example.com',
} as never);
assert(textMessage);
assert.deepEqual(Object.keys(textMessage).sort(), ['body', 'conversationId', 'createdAt', 'id', 'messageType', 'questionId', 'senderId'].sort(), 'Message serializer must allowlist only client-safe fields');
assert.equal(serializeDirectMessage({ ...textMessage, message_type: 'system' } as never), null, 'Unknown message types must be rejected');
assert.equal(serializeDirectMessage({ id: messageOneId, conversation_id: conversationId, sender_id: userA, message_type: 'text', body: '', created_at: 'x' }), null, 'Empty text must be rejected');
assert.equal(serializeDirectMessage({ id: messageOneId, conversation_id: conversationId, sender_id: userA, message_type: 'text', body: 'x'.repeat(1001), created_at: 'x' }), null, 'Text over 1000 chars must be rejected');
assert.equal(serializeDirectMessage({ id: messageOneId, conversation_id: conversationId, sender_id: userA, message_type: 'question_share', question_id: null, created_at: 'x' }), null, 'Question shares require a question reference');

const questionMessage = serializeDirectMessage({
  id: messageTwoId,
  conversation_id: conversationId,
  sender_id: userB,
  message_type: 'question_share',
  body: null,
  question_id: 'web_programming_1_01',
  created_at: '2026-09-17T12:00:01.000Z',
});
assert(questionMessage);
assert.equal(getDirectMessagePreview(questionMessage), 'Bir soru paylaştı');
assert.deepEqual(getDirectMessageCursor(textMessage), { createdAt: textMessage.createdAt, id: textMessage.id });

const entries: DirectMessageEntry[] = [
  { message: questionMessage, question: null },
  { message: textMessage, question: null },
  { message: questionMessage, question: null },
];
const merged = mergeDirectMessageEntries([], entries);
assert.deepEqual(merged.map((entry) => entry.message.id), [messageOneId, messageTwoId], 'Realtime and send responses must dedupe by persisted ID and sort stably');
assert.deepEqual(serializeDirectConversationContext({ conversation_id: conversationId, can_send: true, is_friend: true, blocked_by_viewer: false }), {
  conversationId,
  canSend: true,
  isFriend: true,
  blockedByViewer: false,
});
const summary = serializeDirectConversationSummary({
  conversation_id: conversationId,
  other_user_id: userB,
  conversation_updated_at: textMessage.createdAt,
  last_message_id: textMessage.id,
  last_message_sender_id: textMessage.senderId,
  last_message_type: textMessage.messageType,
  last_message_body: textMessage.body,
  last_message_question_id: null,
  last_message_created_at: textMessage.createdAt,
  unread_count: '3',
});
assert(summary && summary.unreadCount === 3);
const olderConversation = { ...summary, profile: null };
const secondConversationId = '00000000-0000-4000-8000-000000000020';
const updatedConversation = {
  ...olderConversation,
  updatedAt: questionMessage.createdAt,
  lastMessage: questionMessage,
  unreadCount: 4,
};
const otherConversation = {
  ...olderConversation,
  conversationId: secondConversationId,
  otherUserId: userA,
};
const beforeRefresh = [otherConversation, olderConversation];
assert.deepEqual(beforeRefresh.map((conversation) => conversation.conversationId), [secondConversationId, conversationId]);
assert.equal(getDirectMessagePreview(beforeRefresh[1].lastMessage), 'Merhaba');
const serverRefresh = uniqueDirectConversationSummaries([
  updatedConversation,
  otherConversation,
  updatedConversation,
]);
assert.deepEqual(serverRefresh.map((conversation) => conversation.conversationId), [conversationId, secondConversationId], 'A refresh must preserve server order and avoid duplicate rows');
assert.equal(getDirectMessagePreview(serverRefresh[0].lastMessage), 'Bir soru paylaştı', 'Question-share preview must survive list refresh');
assert.equal(serverRefresh[0].updatedAt, questionMessage.createdAt, 'The refreshed row must use the server timestamp');
assert.equal(serverRefresh[0].unreadCount, 4, 'The refreshed row must use the server unread count');

// Canonical one-pair conversation and strict payload constraints.
assert.match(migration, /constraint direct_conversations_canonical_pair check \(user_low_id < user_high_id\)/);
assert.match(migration, /unique \(user_low_id, user_high_id\)/);
assert.match(migration, /least\(actor_id, target_user_id\), greatest\(actor_id, target_user_id\)/);
assert.match(migration, /message_type in \('text', 'question_share'\)/);
assert.match(migration, /char_length\(body\) between 1 and 1000/);
assert.match(migration, /message_type = 'question_share'[\s\S]*body is null[\s\S]*question_id is not null/);
const messageColumns = migration.match(/create table public\.direct_messages \(([\s\S]*?)\);/)?.[1] ?? '';
assert.doesNotMatch(messageColumns, /question_text|company_name|avatar|answer|optimal_text/, 'Messages must not snapshot profiles, answers, or question text');

// Only accepted friends can create/send; removed/pending/rejected pairs cannot.
assert.match(migration, /private\.require_direct_message_conversation[\s\S]*relationship\.status = 'accepted'/);
assert.doesNotMatch(migration.match(/private\.require_direct_message_conversation[\s\S]*?\$\$;/)?.[0] ?? '', /relationship\.status in \('pending'|'rejected'/);
for (const rpc of ['get_or_create_direct_conversation', 'send_direct_message', 'send_question_to_direct_message']) {
  assert.match(migration, new RegExp(`public\\.${rpc}[\\s\\S]*private\\.require_direct_message_conversation`), `${rpc} must enforce current friendship and block eligibility`);
}
assert.match(migration, /target_user_id is null or target_user_id = actor_id/, 'Self messaging must be rejected');
assert.doesNotMatch(migration, /send_direct_message\([^)]*sender_id|send_question_to_direct_message\([^)]*sender_id/, 'Sender identity must never come from client input');
assert.match(migration, /caller_id uuid := \(select auth\.uid\(\)\)/, 'Mutations derive identity from auth.uid()');

// History remains participant-readable without friendship or block predicates.
assert.match(migration, /Participants can read direct conversations[\s\S]*auth\.uid\(\)\) = user_low_id[\s\S]*auth\.uid\(\)\) = user_high_id/);
const messageReadPolicy = migration.match(/create policy "Participants can read direct messages"[\s\S]*?\);/)?.[0] ?? '';
assert.match(messageReadPolicy, /conversation\.user_low_id[\s\S]*conversation\.user_high_id/);
assert.doesNotMatch(messageReadPolicy, /friend_relationships|user_blocks/, 'Removing friendship or blocking must not erase history access');
assert.match(migration, /alter table public\.direct_conversations enable row level security/);
assert.match(migration, /alter table public\.direct_messages enable row level security/);
assert.doesNotMatch(migration, /grant (insert|update|delete).*direct_messages.*authenticated/i, 'Message writes must remain RPC-only');
assert.doesNotMatch(migration, /to anon/, 'Anonymous roles must receive no messaging grants');

// Blocks deny both directions but stay separate from friendship/history.
assert.match(migration, /block\.blocker_id = actor_id and block\.blocked_user_id = target_user_id[\s\S]*block\.blocker_id = target_user_id and block\.blocked_user_id = actor_id/);
assert.match(migration, /create table public\.user_blocks[\s\S]*primary key \(blocker_id, blocked_user_id\)/);
assert.doesNotMatch(migration.match(/create or replace function public\.block_user[\s\S]*?\$\$;/)?.[0] ?? '', /delete from public\.friend_relationships/, 'Blocking must not silently delete friendship');
assert.match(migration, /delete from public\.user_blocks as block[\s\S]*block\.blocker_id = caller_id/);

// Reports are private, fixed-reason, trimmed, bounded, and non-automatic.
assert.match(migration, /reason in \('spam', 'harassment', 'inappropriate', 'other'\)/);
assert.match(migration, /char_length\(details\) between 1 and 500/);
assert.match(migration, /user_reports intentionally has no SELECT policy/);
assert.doesNotMatch(migration, /grant select[^;]*on public\.user_reports/is);
const reportFunction = migration.match(/create or replace function public\.report_user_or_message[\s\S]*?\$\$;/)?.[0] ?? '';
assert.doesNotMatch(reportFunction, /delete from public\.direct_messages|insert into public\.user_blocks/, 'Reporting must not auto-delete or auto-block');

// Server-side rate limiting and rapid question-share idempotency.
assert.match(migration, /pg_advisory_xact_lock/, 'Concurrent sends must serialize their rate check per sender');
assert.match(migration, /created_at >= now\(\) - interval '10 seconds'[\s\S]*sent_in_ten_seconds >= 10/);
assert.match(migration, /created_at >= now\(\) - interval '1 minute'[\s\S]*sent_in_minute >= 60/);
assert.match(migration, /message\.question_id = normalized_question_id[\s\S]*now\(\) - interval '5 minutes'/);

// Private unread cursor, caller-only mark-read, and no sender-facing receipt.
assert.match(migration, /primary key \(conversation_id, user_id\)/);
assert.match(migration, /Users can read only their own conversation cursor[\s\S]*auth\.uid\(\)\) = user_id/);
assert.match(migration, /mark_conversation_read[\s\S]*state\.user_id = caller_id|values \(target_conversation_id, caller_id/);
assert.doesNotMatch(service, /last_read_at|direct_conversation_state/, 'Client services must not expose another participant cursor');
assert.match(migration, /message\.sender_id <> caller_id[\s\S]*message\.created_at > state\.last_read_at/);

// Stable cursor pagination, bounded queries, realtime cleanup, and dedupe.
assert.match(migration, /\(message\.created_at, message\.id\) < \(before_created_at, before_message_id\)/);
assert.match(migration, /order by message\.created_at desc, message\.id desc[\s\S]*limit safe_limit/);
assert.match(migration, /least\(greatest\(coalesce\(requested_limit, 40\), 1\), 50\)/);
assert.match(service, /event: 'INSERT'[\s\S]*table: 'direct_messages'[\s\S]*filter: `conversation_id=eq\.\$\{conversationId\}`/);
assert.match(service, /void supabase\.removeChannel\(channel\)/, 'Realtime subscription must unsubscribe');
assert.match(conversationScreen, /mergeDirectMessageEntries\(current, \[entry\]\)/, 'Realtime echo and send response must share ID dedupe');
assert.match(migration, /alter publication supabase_realtime add table public\.direct_messages/);

// Routes, entry points, disabled states, question cards, and no game mutation.
for (const route of ['messages/index', 'messages/[userId]']) {
  assert.equal(rootLayout.includes(`<Stack.Screen name="${route}" />`), true, `Missing protected route: ${route}`);
}
assert.match(profileScreen, /useMessagingUnread/);
assert.match(profileScreen, /title="Mesajlar"/);
assert.match(profileScreen, /badgeCount > 99 \? '99\+' : badgeCount/, 'Profile unread badge must use the same 99+ ceiling');
assert.match(friendsScreen, /Mesaj Gönder/);
assert.match(publicProfileScreen, /Mesaj Gönder/);
assert.match(messagesScreen, /Bir soru paylaştı|useFocusEffect/);
assert.match(conversationScreen, /KeyboardAvoidingView/);
assert.match(conversationScreen, /Artık arkadaş değilsiniz\. Bu konuşmaya yeni mesaj gönderemezsin\./);
assert.match(conversationScreen, /Bu kullanıcıyla şu anda mesajlaşamazsın\./);
assert.match(conversationScreen, /Kullanıcıyı Engelle/);
assert.match(conversationScreen, /Şikayet Et/);
assert.match(shareSheet, /sendQuestionToDirectMessage/);
assert.match(shareSheet, /shareQuestionWithFriend/, 'Standalone question shares must remain supported');
assert.match(questionDetail, /source === 'message'/);
assert.doesNotMatch(questionDetail, /useReputation|commitGameSession|setSelectedChoice|question_answered/, 'Opening a DM question must not mutate game state');

// Global unread count is always fetched from the authenticated RPC; Realtime
// only invalidates it. The existing conversation channel remains separate.
assert.match(unreadProvider, /getDirectMessageUnreadTotal\(\)/, 'Hydrated account mount must fetch the authoritative unread total');
assert.match(unreadProvider, /subscribeToIncomingDirectMessages\(userId, \(\) => scheduleRefresh\(true\)/, 'Incoming Realtime inserts must invalidate unread and list data through the existing channel');
assert.match(unreadProvider, /REALTIME_REFRESH_DEBOUNCE_MS = 180/);
assert.match(unreadProvider, /status === 'SUBSCRIBED'[\s\S]*scheduleRefresh\(true\)/, 'Channel join/reconnect must reconcile missed list events');
assert.match(unreadProvider, /if \(listInvalidationPending\)[\s\S]*setIncomingMessageVersion\(\(version\) => version \+ 1\)/, 'A burst must produce one debounced list invalidation');
assert.match(unreadProvider, /activeUserIdRef\.current !== userId[\s\S]*requestSequence !== requestSequenceRef\.current/, 'Old-account or stale RPC results must be discarded');
assert.match(unreadProvider, /activeUserIdRef\.current = null;[\s\S]*unsubscribe\(\)/, 'Logout/account switch must invalidate work and remove the channel');
assert.doesNotMatch(unreadProvider, /setInterval|setUnreadCount\(\(current\)\s*=>\s*current\s*\+/, 'Unread must not poll or use an invented local counter');
assert.match(service, /subscribeToIncomingDirectMessages[\s\S]*event: 'INSERT', schema: 'public', table: 'direct_messages'/);
assert.match(service, /subscribeToIncomingDirectMessages[\s\S]*payload\.new\.sender_id === userId[\s\S]*onIncoming\(\)/);
assert.match(service, /subscribeToIncomingDirectMessages[\s\S]*supabase\.removeChannel\(channel\)/, 'Global channel must be cleaned up');
assert.match(rootLayout, /ReputationProvider key=\{user\?\.id \?\? 'signed-out'\}[\s\S]*MessagingUnreadProvider/, 'Unread provider must live inside the auth-keyed boundary');
assert.match(rootLayout, /<GlobalMessagesShortcut \/>/);
assert.match(conversationScreen, /markConversationRead\(conversationId\)[\s\S]*refreshUnread\(\)/, 'Reading a chat must reconcile global unread');
assert.match(conversationScreen, /subscribeToDirectMessages\(conversationId/, 'Active-chat Realtime must remain intact');
assert.doesNotMatch(tabsLayout, /<Tabs\.Screen\s+name="messages"/, 'Messages must not become another tab');
assert.match(messagesScreen, /useMessagingUnread\(\)[\s\S]*incomingMessageVersion/, 'Messages screen must observe global incoming-message invalidations');
assert.match(messagesScreen, /useEffect\(\(\) => \{[\s\S]*handledIncomingVersionRef\.current = incomingMessageVersion;[\s\S]*load\(true\)/, 'Focused realtime invalidation must refetch the conversation list');
assert.match(messagesScreen, /if \(!background\) setStatus\('loading'\)/, 'Background refresh must keep visible rows out of the loading state');
assert.match(messagesScreen, /setConversations\(uniqueDirectConversationSummaries\(result\)\)/, 'Server list must replace rows and remain authoritative');
assert.match(messagesScreen, /activeUserIdRef\.current !== userId[\s\S]*setConversations\(uniqueDirectConversationSummaries/, 'Old-account RPC results must be ignored');
assert.match(messagesScreen, /focusedRef\.current = false;[\s\S]*activeUserIdRef\.current = null;[\s\S]*requestIdRef\.current \+= 1/, 'Blur and unmount must invalidate pending list work');
assert.doesNotMatch(messagesScreen, /subscribeToIncomingDirectMessages|\.channel\(/, 'Messages screen must not create a second global Realtime channel');

const visibleBase = {
  pathname: '/', isAuthenticated: true, isPlayerReady: true,
  onboardingCompleted: true, tutorialCompleted: true, consentReady: true, keyboardVisible: false,
};
assert(shouldShowGlobalMessagesShortcut(visibleBase), 'Home must show the shortcut');
for (const pathname of ['/play', '/ranking', '/store', '/friends', '/company-search']) {
  assert(shouldShowGlobalMessagesShortcut({ ...visibleBase, pathname }), `${pathname} must show the shortcut`);
}
for (const pathname of ['/game', '/(tabs)/game', '/messages', '/messages/index', '/messages/00000000-0000-4000-8000-000000000002', '/profile', '/question-detail/example']) {
  assert(!shouldShowGlobalMessagesShortcut({ ...visibleBase, pathname }), `${pathname} must hide the shortcut`);
}
assert(!shouldShowGlobalMessagesShortcut({ ...visibleBase, isAuthenticated: false }), 'Auth flow must hide the shortcut');
assert(!shouldShowGlobalMessagesShortcut({ ...visibleBase, isPlayerReady: false }), 'Hydration must hide the shortcut');
assert(!shouldShowGlobalMessagesShortcut({ ...visibleBase, consentReady: false }), 'Consent overlay must hide the shortcut');
assert(!shouldShowGlobalMessagesShortcut({ ...visibleBase, keyboardVisible: true }), 'Keyboard must hide the shortcut');
assert.equal(formatGlobalUnreadBadge(0), null);
assert.equal(formatGlobalUnreadBadge(1), '1');
assert.equal(formatGlobalUnreadBadge(99), '99');
assert.equal(formatGlobalUnreadBadge(100), '99+');
assert.equal(getMessagesShortcutAccessibilityLabel(0), 'Mesajlar');
assert.equal(getMessagesShortcutAccessibilityLabel(3), 'Mesajlar, 3 okunmamış mesaj');
assert(shouldAnimateUnreadAttention(0, 1, false, true));
assert(!shouldAnimateUnreadAttention(null, 3, false, true), 'Initial unread load must not pulse');
assert(!shouldAnimateUnreadAttention(0, 1, true, true), 'Reduced motion must disable the pulse');
assert(!shouldAnimateUnreadAttention(0, 1, false, false), 'Hidden shortcut must not pulse');
assert.match(shortcut, /AccessibilityInfo\.isReduceMotionEnabled\(\)/);
assert.match(shortcut, /onPress=\{\(\) => router\.push\('\/messages'\)\}/);
assert.match(shortcut, /tokens\.layout\.tabBarHeight \+ Math\.max\(insets\.bottom/, 'Tab routes must position the shortcut above navigation');

// Web keyboard submission uses the same send path as the button. Native input
// behavior, IME confirmation, and Shift+Enter remain under the platform input.
const composerKey = { isWeb: true, key: 'Enter', body: 'Merhaba', canSend: true, inFlight: false };
assert.equal(getComposerEnterAction(composerKey), 'send');
assert.equal(getComposerEnterAction({ ...composerKey, shiftKey: true }), 'native');
assert.equal(getComposerEnterAction({ ...composerKey, body: ' \n\t ' }), 'ignore');
assert.equal(getComposerEnterAction({ ...composerKey, canSend: false }), 'ignore');
assert.equal(getComposerEnterAction({ ...composerKey, isComposing: true }), 'native');
assert.equal(getComposerEnterAction({ ...composerKey, keyCode: 229 }), 'native');
assert.equal(getComposerEnterAction({ ...composerKey, inFlight: true }), 'ignore');
assert.equal(getComposerEnterAction({ ...composerKey, key: 'a' }), 'native');
assert.equal(getComposerEnterAction({ ...composerKey, isWeb: false }), 'native');
assert.match(conversationScreen, /onKeyPress=\{\(event\) => \{[\s\S]*getComposerEnterAction\([\s\S]*event\.preventDefault\(\);[\s\S]*if \(action === 'send'\) void send\(\)/);
assert.match(conversationScreen, /onPress=\{\(\) => void send\(\)\}/, 'Send button and Enter must share send()');
assert.match(conversationScreen, /runDirectMessageSendOnce\(sendInFlightRef/, 'send() must use the synchronous ref guard');
assert.match(conversationScreen, /maxLength=\{1000\}[\s\S]*multiline/, 'Composer must keep multiline input and the 1000-character limit');
assert.doesNotMatch(conversationScreen, /onSubmitEditing=|\.blur\(\)/, 'Web Enter must not blur the composer or override native submit behavior');

void (async () => {
  const gate = { current: false };
  let releaseFirst: () => void = () => undefined;
  const firstPending = new Promise<void>((resolve) => { releaseFirst = resolve; });
  let persisted = 0;
  const first = runDirectMessageSendOnce(gate, async () => {
    persisted += 1;
    await firstPending;
  });
  assert.equal(gate.current, true, 'First send must lock synchronously');
  await runDirectMessageSendOnce(gate, async () => { persisted += 1; });
  assert.equal(persisted, 1, 'Repeated Enter/button sends must not persist twice');
  releaseFirst();
  await first;
  assert.equal(gate.current, false, 'Successful send must release the lock');
  await assert.rejects(runDirectMessageSendOnce(gate, async () => { throw new Error('network'); }));
  assert.equal(gate.current, false, 'Failed send must release the lock');
  await runDirectMessageSendOnce(gate, async () => { persisted += 1; });
  assert.equal(persisted, 2, 'Retry after failure must remain possible');
  console.log('Direct messaging, global unread, composer keyboard, account isolation, route visibility, and UI invariants passed.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
