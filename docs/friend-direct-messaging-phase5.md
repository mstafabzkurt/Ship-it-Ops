# Phase 5 — Friend-only direct messaging

## Architecture

- `direct_conversations` stores one canonical row for each unordered user pair.
- `direct_messages` stores only text or a `game_incidents.id` reference. It never snapshots question content, answers, company names, or avatars.
- `direct_conversation_state` stores a private conversation-level `last_read_at` cursor per participant. It supports unread totals without exposing message-level read receipts.
- `user_blocks` is independent from friendship. Either direction disables new messages while preserving the friendship row and all history.
- `user_reports` is private moderation intake. A report does not block, ban, or delete automatically.

All sensitive mutations use security-definer RPCs with an empty `search_path`. The caller always comes from `auth.uid()`. Direct table writes are not granted to authenticated clients.

## Sending rules

Text and DM question shares require a current accepted friendship and no block in either direction. Removing a friendship or adding a block disables new sends but participants may still read their existing conversation. Text is trimmed and limited to 1000 characters. Question shares store only the question ID and rapid repeats are idempotent for five minutes.

Rate checks are serialized per sender with a transaction advisory lock and cap persisted sends at 10 per 10 seconds and 60 per minute.

## Reads, pagination, and realtime

Conversation and message RLS is participant-only and deliberately does not depend on current friendship or block state. History pages use a stable `(created_at, id)` cursor, return at most 50 messages, and render oldest to newest.

The migration conditionally adds `public.direct_messages` to the existing `supabase_realtime` publication. The active chat subscribes only to its conversation, deduplicates server responses and realtime echoes by message ID, and removes the channel on blur/unmount.

After deployment, confirm the table is published:

```sql
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename = 'direct_messages';
```

If the migration role could not alter publications, enable `public.direct_messages` once in Supabase Dashboard → Database → Publications → `supabase_realtime`. Do not enable reports, blocks, or conversation-state tables.

## Question sharing transition

The existing `question_shares` table and Paylaşılan Sorular inbox remain unchanged. The friend picker now defaults to a DM question card and includes a `Paylaşılanlara` delivery option for the standalone inbox. Existing records are not migrated or deleted. The standalone inbox can be deprecated in a later, separately planned phase.

## Manual deployment

1. Review `supabase/migrations/20260917200000_create_friend_direct_messaging.sql`.
2. Apply it through the normal Supabase migration pipeline; this repository does not apply it automatically.
3. Confirm every RPC is executable only by `authenticated` and all five tables have RLS enabled.
4. Run the publication query above.
5. Deploy the application only after the migration succeeds.

## Two-user QA

1. With accepted friends A and B, open B from Friends or Public Profile and tap `Mesaj Gönder`.
2. Send text from A; verify B receives it in realtime with one rendered copy.
3. Leave B outside the chat; verify Messages/Profile shows unread, then opening the chat clears it.
4. Confirm A never receives a seen/read state.
5. Reply from B, load older pages, and verify deterministic ordering.
6. Send a question from Game, Favorites, or Question Detail using `Mesajlara`; open its compact card and confirm the read-only detail does not affect the game session.
7. Repeat with `Paylaşılanlara` and confirm the legacy inbox still works.
8. Remove friendship: history remains, composer disables, and the neutral Turkish status appears.
9. Restore friendship if the test environment supports it; sending becomes eligible again.
10. Block from A: both directions stop, history remains, and B receives only a neutral disabled state. Unblock and verify eligibility returns only if friendship is still accepted.
11. Submit each report reason and optional details; confirm success without an automatic block.
12. Exercise the 1000-character limit and both database rate windows.
13. Verify realtime in two tabs/devices, navigation cleanup, 390px keyboard behavior, long wrapping, no horizontal overflow, dark theme, and Daylight Ops.

## Deferred

Group chat, attachments, voice/video, typing and presence, seen/read receipts, editing, reactions, forwarding, push notifications, disappearing messages, search, threads, GIFs, and stickers remain out of scope.
