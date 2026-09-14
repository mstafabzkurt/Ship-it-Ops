begin;

-- normalized_fuzzy_contains already performs substring matching after the shared
-- moderation lookup and repeated-letter collapse. The remaining gap was row
-- classification: these reviewed severe roots were still whole-name rules.
-- Keep collision-sensitive terms such as short abbreviations and ambiguous slang
-- out of this upgrade; embedded fuzzy matching is intentionally opt-in.
with embedded_safe_severe_terms (normalized_term, previous_match_type) as (
  values
    ('fahise', 'normalized_fuzzy_exact'),
    ('gavat', 'normalized_fuzzy_exact'),
    ('godos', 'normalized_fuzzy_exact'),
    ('ibne', 'normalized_fuzzy_exact'),
    ('kancik', 'normalized_fuzzy_exact'),
    ('serefsiz', 'normalized_fuzzy_exact'),
    ('surtuk', 'normalized_fuzzy_exact'),
    ('yarrak', 'normalized_fuzzy_exact'),
    -- Turkish consonant softening turns the final k into ğ/g in possessive forms.
    -- The seed already has this normalized form, so promote it without adding a row.
    ('yarragi', 'normalized_exact')
)
update public.company_name_blocklist as blocked
set
  match_type = 'normalized_fuzzy_contains',
  note = concat_ws(
    '; ',
    nullif(blocked.note, ''),
    'Reviewed severe root: embedded repeated-letter tolerant matching'
  )
from embedded_safe_severe_terms
where blocked.normalized_term = embedded_safe_severe_terms.normalized_term
  and blocked.match_type = embedded_safe_severe_terms.previous_match_type
  and blocked.severity = 'block'
  and blocked.is_active
  and not exists (
    select 1
    from public.company_name_blocklist as existing
    where existing.normalized_term = blocked.normalized_term
      and existing.match_type = 'normalized_fuzzy_contains'
      and existing.id <> blocked.id
  );

commit;
