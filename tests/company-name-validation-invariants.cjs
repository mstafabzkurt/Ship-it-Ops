// Run: node tests/company-name-validation-invariants.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const root = path.resolve(__dirname, '..');
const validation = require('../src/utils/companyNameValidation.ts');
const migrationPath = path.join(root, 'supabase/migrations/20260907120000_create_company_name_identity.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');
const onboarding = fs.readFileSync(path.join(root, 'src/components/onboarding/OnboardingExperience.tsx'), 'utf8');
const profile = fs.readFileSync(path.join(root, 'app/(tabs)/profile.tsx'), 'utf8');
const context = fs.readFileSync(path.join(root, 'src/state/ReputationContext.tsx'), 'utf8');
const availabilityHook = fs.readFileSync(path.join(root, 'src/hooks/useCompanyNameAvailability.ts'), 'utf8');
const progression = fs.readFileSync(path.join(root, 'src/config/progression.ts'), 'utf8');

assert.equal(validation.normalizeCompanyNameDisplay('  Mustafa   Corp  '), 'Mustafa Corp');

const equivalentNames = ['Mustafa Corp', 'mustafa-corp', 'MUSTAFA_CORP', 'Mustafa.Corp'];
assert.equal(new Set(equivalentNames.map(validation.normalizeCompanyNameUniqueLookup)).size, 1);
assert.equal(validation.normalizeCompanyNameUniqueLookup('IŞIK Teknoloji'), validation.normalizeCompanyNameUniqueLookup('ışık-teknoloji'));

for (const name of ['Çığır Teknoloji', 'Anka Labs', 'Anka-Labs', 'Anka.Labs', 'Anka_Labs', 'Stüdyo 42']) {
  assert.equal(validation.validateCompanyName(name).isValid, true, `${name} should be valid`);
}

for (const [name, code] of [
  ['ab', 'too_short'],
  ['x'.repeat(33), 'too_long'],
  ['123456', 'numeric_only'],
  ['https://example.com', 'url_or_email'],
  ['example.com', 'url_or_email'],
  ['operator@example.com', 'url_or_email'],
  ['+90 555 123 4567', 'phone_number'],
  ['@operator', 'handle_or_hashtag'],
  ['#startup', 'handle_or_hashtag'],
  ['Neon 🚀', 'invalid_characters'],
  ['Neon\u200BStack', 'invalid_characters'],
  ['._-', 'invalid_characters'],
  ['AAAAA Stack', 'excessive_repetition'],
  ['admin', 'reserved'],
  ['ship-it-ops', 'reserved'],
  ['sh1p-it-ops', 'reserved'],
  ['kullanıcı', 'reserved'],
]) {
  assert.equal(validation.validateCompanyName(name).code, code, `${name} should fail as ${code}`);
}

assert.equal(validation.normalizeCompanyNameModerationLookup('S1K-T1R'), 'siktir');

function matchesBlocklistRule(candidate, rule) {
  if (!rule.isActive) return false;
  const display = validation.normalizeCompanyNameDisplay(candidate).toLowerCase();
  const rawTerm = validation.normalizeCompanyNameDisplay(rule.term).toLowerCase();
  const moderated = validation.normalizeCompanyNameModerationLookup(candidate);
  const normalizedTerm = validation.normalizeCompanyNameModerationLookup(rule.term);
  if (rule.matchType === 'exact') return display === rawTerm;
  if (rule.matchType === 'contains') return display.includes(rawTerm);
  if (rule.matchType === 'normalized_exact') return moderated === normalizedTerm;
  return moderated.includes(normalizedTerm);
}

assert.equal(matchesBlocklistRule('Bad Name', { term: 'bad name', matchType: 'exact', isActive: true }), true);
assert.equal(matchesBlocklistRule('Very Bad Name Labs', { term: 'bad name', matchType: 'contains', isActive: true }), true);
assert.equal(matchesBlocklistRule('S1K-T1R', { term: 'siktir', matchType: 'normalized_exact', isActive: true }), true);
assert.equal(matchesBlocklistRule('S1K-T1R Labs', { term: 'siktir', matchType: 'normalized_contains', isActive: true }), true);
assert.equal(matchesBlocklistRule('S1K-T1R', { term: 'siktir', matchType: 'normalized_exact', isActive: false }), false);

// Database authority, privacy, editable moderation, and race handling.
assert.match(migration, /create table if not exists public\.company_name_identities/);
assert.match(migration, /create unique index if not exists company_name_identities_lookup_unique_idx/);
assert.match(migration, /where company_name_lookup is not null and company_name_lookup <> ''/);
assert.match(migration, /create table if not exists public\.company_name_blocklist/);
assert.match(migration, /blocked\.is_active/);
assert.match(migration, /blocked\.match_type = 'exact'/);
assert.match(migration, /blocked\.match_type = 'contains'/);
assert.match(migration, /blocked\.match_type = 'normalized_exact'/);
assert.match(migration, /blocked\.match_type = 'normalized_contains'/);
assert.match(migration, /create or replace function public\.check_company_name_availability/);
assert.match(migration, /identity\.user_id <> caller_id/);
assert.match(migration, /create or replace function public\.set_company_name/);
assert.match(migration, /when unique_violation then/);
assert.match(migration, /'race_conflict'/);
assert.match(migration, /security definer/g);
assert.match(migration, /revoke all on table public\.company_name_blocklist from public, anon, authenticated/);
assert.doesNotMatch(migration, /grant select on table public\.company_name_blocklist/);

// Both product surfaces use the same stale-safe availability gate and final RPC-backed context path.
for (const source of [onboarding, profile]) {
  assert.match(source, /useCompanyNameAvailability/);
  assert.match(source, /companyAvailability\.canSave/);
}
assert.match(onboarding, /disabled=\{companyStepBlocked \|\| isSavingCompany\}/);
assert.match(onboarding, /const result = await completeOnboarding/);
assert.match(profile, /disabled=\{!companyAvailability\.canSave \|\| isSavingCompany\}/);
assert.match(profile, /const result = await setCompanyName/);
assert.match(context, /const companyResult = await persistCompanyName/);
assert.match(context, /if \(companyResult\.status !== 'saved'\) return companyResult/);
assert.match(availabilityHook, /debounceMs = 500/);
assert.match(availabilityHook, /requestGeneration\.current !== generation/);
assert.match(availabilityHook, /status === 'available' && checkedInput === currentInput/);

// Guard representative progression constants against this account-validation feature changing gameplay.
assert.match(progression, /id: 'engineer-i', name: 'Mühendis I', threshold: 2000/);
assert.match(progression, /id: 'senior-i', name: 'Kıdemli Mühendis I', threshold: 7000/);

console.log('Company-name normalization, moderation, availability, security, and UI gate invariants passed.');
