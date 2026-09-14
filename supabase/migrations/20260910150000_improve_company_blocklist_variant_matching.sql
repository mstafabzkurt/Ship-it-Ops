begin;

alter table public.company_name_blocklist
  drop constraint if exists company_name_blocklist_match_type;

alter table public.company_name_blocklist
  add constraint company_name_blocklist_match_type check (
    match_type in (
      'exact',
      'contains',
      'normalized_exact',
      'normalized_contains',
      'normalized_fuzzy_exact',
      'normalized_fuzzy_contains'
    )
  );

create or replace function private.company_name_moderation_fuzzy_lookup(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select regexp_replace(
    private.company_name_moderation_lookup(value),
    '(.)\1+',
    '\1',
    'g'
  );
$$;

create or replace function private.company_name_is_blocked(
  display_value text,
  moderation_value text
)
returns boolean
language sql
stable
strict
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_name_blocklist as blocked
    where blocked.is_active
      and blocked.severity = 'block'
      and (
        (blocked.match_type = 'exact'
          and private.company_name_casefold(display_value) = private.company_name_casefold(blocked.term))
        or (blocked.match_type = 'contains'
          and private.company_name_casefold(display_value) like '%' || private.company_name_casefold(blocked.term) || '%')
        or (blocked.match_type = 'normalized_exact'
          and moderation_value = blocked.normalized_term)
        or (blocked.match_type = 'normalized_contains'
          and moderation_value like '%' || blocked.normalized_term || '%')
        or (blocked.match_type = 'normalized_fuzzy_exact'
          and private.company_name_moderation_fuzzy_lookup(moderation_value)
            = private.company_name_moderation_fuzzy_lookup(blocked.normalized_term))
        or (blocked.match_type = 'normalized_fuzzy_contains'
          and private.company_name_moderation_fuzzy_lookup(moderation_value)
            like '%' || private.company_name_moderation_fuzzy_lookup(blocked.normalized_term) || '%')
      )
  );
$$;

-- Upgrade only reviewed, unambiguous severe terms. Whole-name fuzzy rules remain
-- whole-name-only where substring matching could collide with ordinary Turkish.
with severe_upgrades (normalized_term, previous_match_type, fuzzy_match_type) as (
  values
    ('amcik', 'normalized_contains', 'normalized_fuzzy_contains'),
    ('asshole', 'normalized_contains', 'normalized_fuzzy_contains'),
    ('fuck', 'normalized_contains', 'normalized_fuzzy_contains'),
    ('kahpe', 'normalized_contains', 'normalized_fuzzy_contains'),
    ('kaltak', 'normalized_contains', 'normalized_fuzzy_contains'),
    ('kurwa', 'normalized_contains', 'normalized_fuzzy_contains'),
    ('orospu', 'normalized_contains', 'normalized_fuzzy_contains'),
    ('pezevenk', 'normalized_contains', 'normalized_fuzzy_contains'),
    ('siktir', 'normalized_contains', 'normalized_fuzzy_contains'),
    ('whore', 'normalized_contains', 'normalized_fuzzy_contains'),
    ('yavsak', 'normalized_contains', 'normalized_fuzzy_contains'),
    ('dalyarrak', 'normalized_exact', 'normalized_fuzzy_exact'),
    ('fahise', 'normalized_exact', 'normalized_fuzzy_exact'),
    ('gavat', 'normalized_exact', 'normalized_fuzzy_exact'),
    ('godos', 'normalized_exact', 'normalized_fuzzy_exact'),
    ('ibne', 'normalized_exact', 'normalized_fuzzy_exact'),
    ('kancik', 'normalized_exact', 'normalized_fuzzy_exact'),
    ('pust', 'normalized_exact', 'normalized_fuzzy_exact'),
    ('serefsiz', 'normalized_exact', 'normalized_fuzzy_exact'),
    ('surtuk', 'normalized_exact', 'normalized_fuzzy_exact'),
    ('yarrak', 'normalized_exact', 'normalized_fuzzy_exact')
)
update public.company_name_blocklist as blocked
set
  match_type = severe_upgrades.fuzzy_match_type,
  note = concat_ws(
    '; ',
    nullif(blocked.note, ''),
    'Reviewed severe term: repeated-letter tolerant matching'
  )
from severe_upgrades
where blocked.normalized_term = severe_upgrades.normalized_term
  and blocked.match_type = severe_upgrades.previous_match_type
  and blocked.severity = 'block'
  and blocked.is_active
  and not exists (
    select 1
    from public.company_name_blocklist as existing
    where existing.normalized_term = blocked.normalized_term
      and existing.match_type = severe_upgrades.fuzzy_match_type
      and existing.id <> blocked.id
  );

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
begin
  if caller_id is null then
    return query select false, false, 'not_authenticated', 'Oturum doğrulanamadı.', null::text;
    return;
  end if;

  select * into validation from private.validate_company_name(candidate);
  if private.company_name_is_blocked(validation.display_name, validation.moderation_lookup) then
    return query select false, false, 'blocked', 'Bu şirket adı kullanılamaz.', null::text;
    return;
  end if;

  if not validation.valid then
    return query select false, false, validation.code, validation.message, null::text;
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

revoke all on function private.company_name_moderation_fuzzy_lookup(text) from public, anon, authenticated;
revoke all on function private.company_name_is_blocked(text, text) from public, anon, authenticated;
revoke all on function public.check_company_name_availability(text) from public, anon;
grant execute on function public.check_company_name_availability(text) to authenticated;

commit;
