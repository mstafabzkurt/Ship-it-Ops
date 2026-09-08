begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.company_name_casefold(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select lower(translate(value, 'IİĞÜŞÖÇ', 'ıiğüşöç'));
$$;

create or replace function private.company_name_display(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select regexp_replace(btrim(value), '[[:space:]]+', ' ', 'g');
$$;

create or replace function private.company_name_unique_lookup(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select regexp_replace(
    private.company_name_casefold(private.company_name_display(value)),
    '[[:space:]_.-]+',
    '',
    'g'
  );
$$;

create or replace function private.company_name_moderation_lookup(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select regexp_replace(
    regexp_replace(
      translate(
        private.company_name_casefold(private.company_name_display(value)),
        'çğıöşü01345@',
        'cgiosuoieasa'
      ),
      '[^a-z0-9]',
      '',
      'g'
    ),
    '(.)\1{2,}',
    '\1\1',
    'g'
  );
$$;

create or replace function private.validate_company_name(candidate text)
returns table (
  valid boolean,
  code text,
  message text,
  display_name text,
  unique_lookup text,
  moderation_lookup text
)
language plpgsql
immutable
set search_path = ''
as $$
declare
  display_value text := private.company_name_display(coalesce(candidate, ''));
  unique_value text := private.company_name_unique_lookup(coalesce(candidate, ''));
  moderation_value text := private.company_name_moderation_lookup(coalesce(candidate, ''));
  digit_count integer := char_length(regexp_replace(display_value, '[^0-9]', '', 'g'));
begin
  if display_value = '' then
    return query select false, 'empty', 'Şirket adı boş bırakılamaz.', display_value, unique_value, moderation_value;
  elsif candidate ~ '[[:cntrl:]]' then
    return query select false, 'invalid_characters', 'Şirket adında geçersiz karakter var.', display_value, unique_value, moderation_value;
  elsif char_length(display_value) < 3 then
    return query select false, 'too_short', 'Şirket adı en az 3 karakter olmalı.', display_value, unique_value, moderation_value;
  elsif char_length(display_value) > 32 then
    return query select false, 'too_long', 'Şirket adı en fazla 32 karakter olabilir.', display_value, unique_value, moderation_value;
  elsif display_value ~* '(https?://|www\.)'
    or display_value ~* '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}'
    or display_value ~* '(^|[[:space:]])[a-z0-9-]+\.(com|net|org|io|co|com\.tr|net\.tr|org\.tr|dev|app|tech|xyz)(/|[[:space:]]|$)' then
    return query select false, 'url_or_email', 'Şirket adı bağlantı, e-posta veya telefon numarası içeremez.', display_value, unique_value, moderation_value;
  elsif display_value ~ '[@#]' then
    return query select false, 'handle_or_hashtag', 'Şirket adı kullanıcı etiketi veya hashtag içeremez.', display_value, unique_value, moderation_value;
  elsif digit_count >= 7 and display_value ~ '^[0-9+().[:space:]-]+$' then
    return query select false, 'phone_number', 'Şirket adı bağlantı, e-posta veya telefon numarası içeremez.', display_value, unique_value, moderation_value;
  elsif display_value !~ '^[A-Za-z0-9ÇĞİÖŞÜçğıöşü ._-]+$' then
    return query select false, 'invalid_characters', 'Şirket adında geçersiz karakter var.', display_value, unique_value, moderation_value;
  elsif unique_value = '' then
    return query select false, 'invalid_characters', 'Şirket adında geçersiz karakter var.', display_value, unique_value, moderation_value;
  elsif unique_value ~ '^[0-9]+$' then
    return query select false, 'numeric_only', 'Şirket adı yalnızca rakamlardan oluşamaz.', display_value, unique_value, moderation_value;
  elsif private.company_name_casefold(display_value) ~ '(.)\1{4,}' then
    return query select false, 'excessive_repetition', 'Şirket adında aşırı tekrarlanan karakterler var.', display_value, unique_value, moderation_value;
  elsif moderation_value = any (array[
    'admin', 'administrator', 'root', 'system', 'support', 'moderator', 'mod',
    'shipitops', 'shipitinc', 'null', 'undefined', 'deleteduser', 'anonymous',
    'kullanici', 'misafir', 'guest', 'test'
  ]) then
    return query select false, 'reserved', 'Bu şirket adı kullanılamaz.', display_value, unique_value, moderation_value;
  else
    return query select true, 'valid', '', display_value, unique_value, moderation_value;
  end if;
end;
$$;

create table if not exists public.company_name_identities (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name_display text,
  company_name_lookup text,
  company_name_moderation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint company_name_identity_all_or_none check (
    (company_name_display is null and company_name_lookup is null and company_name_moderation is null)
    or
    (company_name_display is not null and company_name_lookup is not null and company_name_moderation is not null)
  ),
  constraint company_name_identity_display_length check (
    company_name_display is null or char_length(company_name_display) between 3 and 32
  ),
  constraint company_name_identity_display_trimmed check (
    company_name_display is null or company_name_display = btrim(company_name_display)
  ),
  constraint company_name_identity_lookup_format check (
    company_name_lookup is null or company_name_lookup ~ '^[a-z0-9çğıöşü]+$'
  ),
  constraint company_name_identity_moderation_format check (
    company_name_moderation is null or company_name_moderation ~ '^[a-z0-9]+$'
  )
);

comment on table public.company_name_identities is
  'Private account-owned company identity. New or changed names are claimed only through security-definer RPCs.';
comment on column public.company_name_identities.company_name_lookup is
  'Separator-insensitive lookup key used by the database unique index.';
comment on column public.company_name_identities.company_name_moderation is
  'Diacritic/leet/separator-folded value used by secure blocklist matching.';

create table if not exists public.company_name_blocklist (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  normalized_term text not null,
  match_type text not null,
  severity text not null default 'block',
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint company_name_blocklist_term_present check (btrim(term) <> ''),
  constraint company_name_blocklist_normalized_present check (btrim(normalized_term) <> ''),
  constraint company_name_blocklist_match_type check (
    match_type in ('exact', 'contains', 'normalized_exact', 'normalized_contains')
  ),
  constraint company_name_blocklist_severity check (severity in ('block'))
);

comment on table public.company_name_blocklist is
  'Editable moderation terms. Normal clients cannot read this table; secure RPCs reveal only a validation outcome.';

create unique index if not exists company_name_blocklist_term_match_unique_idx
  on public.company_name_blocklist (normalized_term, match_type);

create or replace function private.set_company_name_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.normalize_company_name_blocklist_term()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.term = btrim(new.term);
  new.normalized_term = private.company_name_moderation_lookup(new.term);
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists company_name_identities_set_updated_at on public.company_name_identities;
create trigger company_name_identities_set_updated_at
before update on public.company_name_identities
for each row execute function private.set_company_name_updated_at();

drop trigger if exists company_name_blocklist_normalize on public.company_name_blocklist;
create trigger company_name_blocklist_normalize
before insert or update on public.company_name_blocklist
for each row execute function private.normalize_company_name_blocklist_term();

insert into public.company_name_blocklist (term, normalized_term, match_type, note)
values
  ('fuck', 'fuck', 'normalized_contains', 'Initial cross-language profanity seed'),
  ('siktir', 'siktir', 'normalized_contains', 'Initial Turkish profanity seed'),
  ('orospu', 'orospu', 'normalized_contains', 'Initial Turkish abusive-language seed')
on conflict do nothing;

with legacy_candidates as (
  select
    save.user_id,
    validation.display_name,
    validation.unique_lookup,
    validation.moderation_lookup,
    row_number() over (
      partition by validation.unique_lookup
      order by save.updated_at asc, save.user_id asc
    ) as duplicate_rank
  from public.player_saves as save
  cross join lateral private.validate_company_name(save.company_name) as validation
  where validation.valid
    and save.company_name <> 'ShipIt Inc.'
    and not exists (
      select 1
      from public.company_name_blocklist as blocked
      where blocked.is_active
        and blocked.severity = 'block'
        and (
          (blocked.match_type = 'exact' and private.company_name_casefold(validation.display_name) = private.company_name_casefold(blocked.term))
          or (blocked.match_type = 'contains' and private.company_name_casefold(validation.display_name) like '%' || private.company_name_casefold(blocked.term) || '%')
          or (blocked.match_type = 'normalized_exact' and validation.moderation_lookup = blocked.normalized_term)
          or (blocked.match_type = 'normalized_contains' and validation.moderation_lookup like '%' || blocked.normalized_term || '%')
        )
    )
)
insert into public.company_name_identities (
  user_id,
  company_name_display,
  company_name_lookup,
  company_name_moderation
)
select user_id, display_name, unique_lookup, moderation_lookup
from legacy_candidates
where duplicate_rank = 1
on conflict do nothing;

create unique index if not exists company_name_identities_lookup_unique_idx
  on public.company_name_identities (company_name_lookup)
  where company_name_lookup is not null and company_name_lookup <> '';

alter table public.company_name_identities enable row level security;
alter table public.company_name_blocklist enable row level security;

revoke all on table public.company_name_identities from public, anon, authenticated;
grant select on table public.company_name_identities to authenticated;
revoke all on table public.company_name_blocklist from public, anon, authenticated;

drop policy if exists "Users can read their own company identity" on public.company_name_identities;
create policy "Users can read their own company identity"
on public.company_name_identities
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.check_company_name_availability(candidate text)
returns table (
  available boolean,
  valid boolean,
  code text,
  message text,
  normalized_lookup text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  validation record;
  is_blocked boolean;
begin
  if caller_id is null then
    return query select false, false, 'not_authenticated', 'Oturum doğrulanamadı.', null::text;
    return;
  end if;

  select * into validation from private.validate_company_name(candidate);
  if not validation.valid then
    return query select false, false, validation.code, validation.message, null::text;
    return;
  end if;

  select exists (
    select 1
    from public.company_name_blocklist as blocked
    where blocked.is_active
      and blocked.severity = 'block'
      and (
        (blocked.match_type = 'exact' and private.company_name_casefold(validation.display_name) = private.company_name_casefold(blocked.term))
        or (blocked.match_type = 'contains' and private.company_name_casefold(validation.display_name) like '%' || private.company_name_casefold(blocked.term) || '%')
        or (blocked.match_type = 'normalized_exact' and validation.moderation_lookup = blocked.normalized_term)
        or (blocked.match_type = 'normalized_contains' and validation.moderation_lookup like '%' || blocked.normalized_term || '%')
      )
  ) into is_blocked;

  if is_blocked then
    return query select false, false, 'blocked', 'Bu şirket adı kullanılamaz.', null::text;
    return;
  end if;

  if exists (
    select 1
    from public.company_name_identities as identity
    where identity.company_name_lookup = validation.unique_lookup
      and identity.user_id <> caller_id
  ) then
    return query select false, true, 'unavailable', 'Bu şirket adı zaten var.', validation.unique_lookup;
    return;
  end if;

  return query select true, true, 'available', 'Bu şirket adı alınabilir.', validation.unique_lookup;
end;
$$;

create or replace function public.set_company_name(candidate text)
returns table (
  success boolean,
  valid boolean,
  code text,
  message text,
  company_name_display text,
  normalized_lookup text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  availability record;
  validation record;
begin
  if caller_id is null then
    return query select false, false, 'not_authenticated', 'Oturum doğrulanamadı.', null::text, null::text;
    return;
  end if;

  select * into validation from private.validate_company_name(candidate);
  select * into availability from public.check_company_name_availability(candidate);
  if not availability.available then
    return query select false, availability.valid, availability.code, availability.message, null::text, availability.normalized_lookup;
    return;
  end if;

  insert into public.company_name_identities (
    user_id,
    company_name_display,
    company_name_lookup,
    company_name_moderation
  ) values (
    caller_id,
    validation.display_name,
    validation.unique_lookup,
    validation.moderation_lookup
  )
  on conflict (user_id) do update set
    company_name_display = excluded.company_name_display,
    company_name_lookup = excluded.company_name_lookup,
    company_name_moderation = excluded.company_name_moderation;

  update public.player_saves
  set company_name = validation.display_name
  where user_id = caller_id;

  update public.leaderboard_profiles
  set company_name = validation.display_name
  where user_id = caller_id;

  return query select true, true, 'saved', 'Şirket adı kaydedildi.', validation.display_name, validation.unique_lookup;
exception
  when unique_violation then
    return query select false, true, 'race_conflict', 'Bu şirket adı az önce alınmış. Başka bir isim dene.', null::text, validation.unique_lookup;
end;
$$;

revoke all on function private.company_name_casefold(text) from public, anon, authenticated;
revoke all on function private.company_name_display(text) from public, anon, authenticated;
revoke all on function private.company_name_unique_lookup(text) from public, anon, authenticated;
revoke all on function private.company_name_moderation_lookup(text) from public, anon, authenticated;
revoke all on function private.validate_company_name(text) from public, anon, authenticated;
revoke all on function private.set_company_name_updated_at() from public, anon, authenticated;
revoke all on function private.normalize_company_name_blocklist_term() from public, anon, authenticated;
revoke all on function public.check_company_name_availability(text) from public, anon;
revoke all on function public.set_company_name(text) from public, anon;
grant execute on function public.check_company_name_availability(text) to authenticated;
grant execute on function public.set_company_name(text) to authenticated;

commit;
