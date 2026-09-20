# Question Favorites and Friend Sharing

## Current model

- `question_favorites` stores only `(user_id, question_id, created_at)` and is owner-only through RLS.
- `question_shares` stores sender, recipient, question reference, creation time, and recipient-owned `opened_at` state.
- Question content remains in `game_incidents`; social tables never copy titles, answers, or free-text messages.
- Shares are created only through `share_question_with_friend`, which derives the sender from `auth.uid()` and requires an accepted canonical friendship.
- Opening an inbox item uses `mark_question_share_opened`; senders cannot query recipient opened state, so this is not a read-receipt feature.

## Query shape

- Favorite list: one favorite-reference query plus one batched `game_incidents` query.
- Received inbox: one share query plus a batched question lookup. Sender profiles load afterward so a profile failure cannot hide a valid question.
- Active game: one favorite-state lookup for the current question; it never fetches the full favorite collection.

## Direct-message integration

Gameplay and Favori Sorular send through a `direct_messages` question-share reference. The archive detail screen retains the explicit `Paylaşılanlara` option for the standalone `question_shares` inbox. A DM share does not create a standalone inbox record; the two stores remain separate and keep question content in `game_incidents`.

## Deployment

Review and apply `supabase/migrations/20260917190000_create_question_favorites_and_shares.sql` through the normal Supabase migration workflow. The application routes should be deployed only after the database migration is available.
