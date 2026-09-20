# Public profiles Phase 1

Migration (apply manually in Supabase):

`supabase/migrations/20260917120000_create_public_profiles.sql`

The migration creates the authenticated-readable `public.public_profiles` projection, its RLS policies, a Turkish-aware prefix-search RPC, and a trigger that synchronizes only safe fields after relevant `player_saves` inserts or updates. It also adds the private `player_saves.completed_sessions` counter. It does not expose raw saves or change leaderboard scoring.

## Post-migration verification SQL

Run these read-only checks in the Supabase SQL editor:

```sql
-- RLS must be enabled and forced off is acceptable because table owners maintain migrations.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'public_profiles';

-- Expected policies: authenticated SELECT; own-row INSERT; own-row UPDATE.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'public_profiles'
order by cmd, policyname;

-- anon should have no grants; authenticated should have SELECT/INSERT/UPDATE only.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'public_profiles'
order by grantee, privilege_type;

-- Confirm the company-name prefix index and primary key.
select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'public_profiles'
order by indexname;

-- Backfill/sync count. Compare with player_saves if every save should have projected.
select
  (select count(*) from public.public_profiles) as public_profile_count,
  (select count(*) from public.player_saves) as player_save_count;
```

To verify that User A cannot update User B, replace both UUIDs with two real auth users. The update must report `UPDATE 0`; the transaction rolls back either way:

```sql
begin;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"USER_A_UUID","role":"authenticated"}',
  true
);

update public.public_profiles
set career_rank = career_rank
where user_id = 'USER_B_UUID';

rollback;
```

Optional authenticated smoke checks:

```sql
-- Search returns at most ten rows and never returns the caller.
select * from public.search_public_profiles('Ko', 10);

-- The projection must contain only the safe public columns.
select user_id, company_name, avatar_id, avatar_frame_id, career_rank,
       career_xp, reputation, success_rate, completed_sessions,
       selected_badge_ids, updated_at
from public.public_profiles
limit 5;
```
