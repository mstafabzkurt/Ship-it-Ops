# Beta playtest analytics

Ship It Ops records a small set of authenticated beta-playtest events in `public.playtest_events`. This is operational telemetry only; there is no client analytics dashboard and normal users cannot read the event table.

## Storage and access

Each row contains an generated UUID, the authenticated `user_id`, `event_name`, server-generated `event_time`, and JSON object `metadata`. Row-level security permits authenticated users to insert only rows whose `user_id` equals `auth.uid()`. There is no public or authenticated-user read policy. Analysis should be performed through an appropriately protected Supabase administration connection.

Unauthenticated clients skip remote telemetry. Insert and authentication errors never interrupt gameplay; development builds log them with `console.debug`, while production builds fail silently.

## Events

| Event | Metadata summary | Fired from |
| --- | --- | --- |
| `session_started` | Category, star, checkpoint index, target | A new or restarted 10-question session |
| `question_answered` | Category, star, question ID, result, applied deltas, remaining time | After an answer or timeout is applied |
| `joker_used` | Joker type, category, star, question ID | After a joker is consumed |
| `session_completed` | Category, star, final corrected counts/reputation, checkpoint result | When question 10 is completed |
| `checkpoint_passed` / `checkpoint_failed` | Category, star, checkpoint index, target, final reputation | Alongside completion for an active checkpoint |
| `tier_unlocked` | Category and unlocked star | When both prerequisite checkpoints unlock a tier |
| `store_opened` | Active store tab | Once each time the store receives focus |
| `store_tab_changed` | Selected tab | When the store tab changes |
| `joker_purchased` | Joker type, price, resulting inventory and budget | After a successful purchase |
| `cosmetic_purchased` | Item ID/type, rarity, price | After a successful purchase |
| `cosmetic_equipped` | Item ID/type and rarity | After a successful equip in Store or Profile |
| `theme_purchased` | Theme ID and price | After a successful purchase |
| `theme_equipped` | Theme ID | After a successful equip |
| `leaderboard_opened` | Empty metadata | When the leaderboard receives focus |
| `profile_opened` | Empty metadata | When Profile receives focus |
| `career_opened` / `badges_opened` | Empty metadata | When the Career screen/tab or Badges tab is opened |
| `daily_reward_claimed` | Streak count and budget reward | After a successful daily claim |

Git Revert does not mutate prior telemetry rows: those rows describe actions that occurred. The final `session_completed` and checkpoint event are produced from the current resolved-results list, so reverted results cannot remain in the final totals or be double-counted after re-answering.

## Privacy rules

- Never send email, person/company name, auth tokens, secrets, or full question text.
- Questions are identified only by `question_id`.
- The telemetry utility removes known private keys before insertion, including nested metadata.
- Do not expose cross-user event reads or an analytics/debug panel in the client.
- Keep metadata limited to gameplay and store measurements listed above.

## Example queries

Run these with protected administrative access, not from the application client.

### Sessions by category

```sql
select
  metadata->>'category_id' as category_id,
  count(*) as sessions
from playtest_events
where event_name = 'session_completed'
group by 1
order by sessions desc;
```

### Average performance by category/star

```sql
select
  metadata->>'category_id' as category_id,
  (metadata->>'difficulty_star')::int as difficulty_star,
  avg((metadata->>'session_correct_count')::numeric) as avg_correct,
  avg((metadata->>'session_reputation')::numeric) as avg_reputation
from playtest_events
where event_name = 'session_completed'
group by 1, 2
order by 1, 2;
```

### Joker purchases

```sql
select
  metadata->>'joker_type' as joker_type,
  count(*) as purchases
from playtest_events
where event_name = 'joker_purchased'
group by 1
order by purchases desc;
```

### Joker usage

```sql
select
  metadata->>'joker_type' as joker_type,
  count(*) as uses
from playtest_events
where event_name = 'joker_used'
group by 1
order by uses desc;
```

### Checkpoint pass/fail

```sql
select
  metadata->>'category_id' as category_id,
  (metadata->>'difficulty_star')::int as difficulty_star,
  event_name,
  count(*) as total
from playtest_events
where event_name in ('checkpoint_passed', 'checkpoint_failed')
group by 1, 2, 3
order by 1, 2, 3;
```

### Store engagement

```sql
select
  event_name,
  count(*) as total
from playtest_events
where event_name in (
  'store_opened',
  'cosmetic_purchased',
  'cosmetic_equipped',
  'theme_purchased',
  'theme_equipped',
  'joker_purchased'
)
group by 1
order by total desc;
```
