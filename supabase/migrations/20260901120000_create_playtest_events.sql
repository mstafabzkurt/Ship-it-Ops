begin;

create table if not exists public.playtest_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  event_time timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,

  constraint playtest_events_name_not_blank check (char_length(btrim(event_name)) > 0),
  constraint playtest_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists playtest_events_event_time_idx
  on public.playtest_events (event_time);
create index if not exists playtest_events_user_id_idx
  on public.playtest_events (user_id);
create index if not exists playtest_events_event_name_idx
  on public.playtest_events (event_name);

comment on table public.playtest_events is
  'Private, insert-only beta playtest telemetry for authenticated Ship It Ops users.';

alter table public.playtest_events enable row level security;

revoke all on table public.playtest_events from public, anon;
revoke select, update, delete, truncate, references, trigger on table public.playtest_events from authenticated;
grant insert on table public.playtest_events to authenticated;

drop policy if exists "Authenticated users can insert their own playtest events" on public.playtest_events;
create policy "Authenticated users can insert their own playtest events"
on public.playtest_events
for insert
to authenticated
with check ((select auth.uid()) = user_id);

commit;
