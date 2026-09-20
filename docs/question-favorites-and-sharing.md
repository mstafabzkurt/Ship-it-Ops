# Question Favorites and Friend Sharing

## Current model

- `question_favorites` stores only `(user_id, question_id, created_at)` and is owner-only through RLS.
- `question_shares` stores sender, recipient, question reference, creation time, and recipient-owned `opened_at` state.
- Question content remains in `game_incidents`; social tables never copy titles, answers, or free-text messages.
- Shares are created only through `share_question_with_friend`, which derives the sender from `auth.uid()` and requires an accepted canonical friendship.
- Opening an inbox item uses `mark_question_share_opened`; senders cannot query recipient opened state, so this is not a read-receipt feature.

## Query shape

- Favorite list: one favorite-reference query plus one batched `game_incidents` query.
- Received inbox: one share query plus parallel batched question and public-profile queries.
- Active game: one favorite-state lookup for the current question; it never fetches the full favorite collection.

## Future direct-message integration

`question_shares` can remain a standalone inbox when direct messages are introduced. A future message model may reference the existing share row, or use a typed message such as `message_type = 'question_share'` with a `question_id`/`question_share_id` reference. The current table does not need to become a chat table, and no free-text message should be added to it during that migration.

## Deployment

Review and apply `supabase/migrations/20260917190000_create_question_favorites_and_shares.sql` through the normal Supabase migration workflow. The application routes should be deployed only after the database migration is available.
