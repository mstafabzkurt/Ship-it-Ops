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
const seedMigrationPath = path.join(root, 'supabase/migrations/20260910140000_seed_company_name_blocklist.sql');
assert.equal(fs.existsSync(seedMigrationPath), true, 'Expected the company-name blocklist seed migration');
const seedMigration = fs.readFileSync(seedMigrationPath, 'utf8');
const variantMigrationPath = path.join(root, 'supabase/migrations/20260910150000_improve_company_blocklist_variant_matching.sql');
assert.equal(fs.existsSync(variantMigrationPath), true, 'Expected the company-name variant-matching migration');
const variantMigration = fs.readFileSync(variantMigrationPath, 'utf8');
const embeddedMigrationPath = path.join(root, 'supabase/migrations/20260910160000_fix_embedded_severe_blocklist_matching.sql');
assert.equal(fs.existsSync(embeddedMigrationPath), true, 'Expected the embedded severe-term migration');
const embeddedMigration = fs.readFileSync(embeddedMigrationPath, 'utf8');
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
  if (rule.matchType === 'normalized_fuzzy_exact') {
    return moderated.replace(/(.)\1+/g, '$1') === normalizedTerm.replace(/(.)\1+/g, '$1');
  }
  if (rule.matchType === 'normalized_fuzzy_contains') {
    return moderated.replace(/(.)\1+/g, '$1').includes(normalizedTerm.replace(/(.)\1+/g, '$1'));
  }
  return moderated.includes(normalizedTerm);
}

assert.equal(matchesBlocklistRule('Bad Name', { term: 'bad name', matchType: 'exact', isActive: true }), true);
assert.equal(matchesBlocklistRule('Very Bad Name Labs', { term: 'bad name', matchType: 'contains', isActive: true }), true);
assert.equal(matchesBlocklistRule('S1K-T1R', { term: 'siktir', matchType: 'normalized_exact', isActive: true }), true);
assert.equal(matchesBlocklistRule('S1K-T1R Labs', { term: 'siktir', matchType: 'normalized_contains', isActive: true }), true);
assert.equal(matchesBlocklistRule('S1K-T1R', { term: 'siktir', matchType: 'normalized_exact', isActive: false }), false);

function parseSqlArrayForMatchType(matchType) {
  const escapedMatchType = matchType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const branch = seedMigration.match(new RegExp(
    `when normalized_term = any \\(array\\[([\\s\\S]*?)\\]\\) then '${escapedMatchType}'`,
  ));
  assert.ok(branch, `Expected a ${matchType} classification branch`);
  return new Set([...branch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]));
}

const exactSeedTerms = parseSqlArrayForMatchType('exact');
const normalizedContainsSeedTerms = parseSqlArrayForMatchType('normalized_contains');
const declaredMatchTypes = [
  ...seedMigration.matchAll(/then '(exact|contains|normalized_exact|normalized_contains)'/g),
  ...seedMigration.matchAll(/else '(exact|contains|normalized_exact|normalized_contains)'/g),
].map((match) => match[1]);
assert.ok(declaredMatchTypes.length > 0);
assert.ok(declaredMatchTypes.every((matchType) => ['exact', 'normalized_exact', 'normalized_contains'].includes(matchType)));
const sourceTerms = [...seedMigration.matchAll(/\$terms_\d+\$\r?\n([\s\S]*?)\r?\n\$terms_\d+\$/g)]
  .flatMap((match) => match[1].split(/\r?\n/))
  .map((term) => term.trim())
  .filter(Boolean);

assert.ok(sourceTerms.length > 0, 'Seed migration must contain source terms');
const seedRules = sourceTerms.map((term) => {
  const normalizedTerm = validation.normalizeCompanyNameModerationLookup(term);
  assert.notEqual(normalizedTerm, '', `Seed term must normalize to a non-empty value: ${term}`);
  const matchType = exactSeedTerms.has(normalizedTerm)
    ? 'exact'
    : normalizedContainsSeedTerms.has(normalizedTerm)
      ? 'normalized_contains'
      : 'normalized_exact';
  assert.ok(['exact', 'normalized_exact', 'normalized_contains'].includes(matchType));
  return { term, normalizedTerm, matchType, isActive: true };
});

const deduplicatedSeedKeys = new Set(seedRules.map((rule) => `${rule.normalizedTerm}:${rule.matchType}`));
assert.ok(deduplicatedSeedKeys.size < seedRules.length, 'Draft duplicates should collapse before insertion');
assert.match(seedMigration, /group by normalized_term, match_type/);
assert.match(seedMigration, /on conflict \(normalized_term, match_type\) do nothing/);
assert.match(seedMigration, /private\.company_name_moderation_lookup\(term\) as normalized_term/);
assert.match(seedMigration, /'block',\s*true,/);
assert.doesNotMatch(seedMigration, /then 'contains'/);

const severeUpgrades = [...variantMigration.matchAll(
  /\('([^']+)', '(normalized_(?:exact|contains))', '(normalized_fuzzy_(?:exact|contains))'\)/g,
)].map((match) => ({
  normalizedTerm: match[1],
  previousMatchType: match[2],
  fuzzyMatchType: match[3],
}));
assert.equal(severeUpgrades.length, 21, 'Expected the reviewed severe-term upgrade set');
assert.equal(new Set(severeUpgrades.map((upgrade) => upgrade.normalizedTerm)).size, severeUpgrades.length);
assert.ok(severeUpgrades.every((upgrade) => ['normalized_fuzzy_exact', 'normalized_fuzzy_contains'].includes(upgrade.fuzzyMatchType)));

const severeUpgradeByKey = new Map(
  severeUpgrades.map((upgrade) => [`${upgrade.normalizedTerm}:${upgrade.previousMatchType}`, upgrade.fuzzyMatchType]),
);
const variantSeedRules = seedRules.map((rule) => ({
  ...rule,
  matchType: severeUpgradeByKey.get(`${rule.normalizedTerm}:${rule.matchType}`) ?? rule.matchType,
}));

const embeddedSevereUpgrades = [...embeddedMigration.matchAll(
  /\('([^']+)', '(normalized_(?:exact|fuzzy_exact))'\)/g,
)].map((match) => ({ normalizedTerm: match[1], previousMatchType: match[2] }));
assert.equal(embeddedSevereUpgrades.length, 9, 'Expected only reviewed embedded-safe severe roots');
assert.equal(new Set(embeddedSevereUpgrades.map((upgrade) => upgrade.normalizedTerm)).size, embeddedSevereUpgrades.length);
assert.ok(embeddedSevereUpgrades.every((upgrade) => upgrade.previousMatchType !== 'exact'));

const embeddedUpgradeKeys = new Set(
  embeddedSevereUpgrades.map((upgrade) => `${upgrade.normalizedTerm}:${upgrade.previousMatchType}`),
);
const effectiveSeedRules = variantSeedRules.map((rule) => ({
  ...rule,
  matchType: embeddedUpgradeKeys.has(`${rule.normalizedTerm}:${rule.matchType}`)
    ? 'normalized_fuzzy_contains'
    : rule.matchType,
}));

assert.match(variantMigration, /match_type in \([\s\S]*'normalized_fuzzy_exact'[\s\S]*'normalized_fuzzy_contains'/);
assert.match(variantMigration, /create or replace function private\.company_name_moderation_fuzzy_lookup/);
assert.match(variantMigration, /create or replace function private\.company_name_is_blocked/);
assert.match(variantMigration, /blocked\.match_type = 'normalized_fuzzy_contains'[\s\S]*?like '%' \|\| private\.company_name_moderation_fuzzy_lookup/);
assert.match(variantMigration, /private\.company_name_is_blocked\(validation\.display_name, validation\.moderation_lookup\)/);
assert.match(variantMigration, /revoke all on function private\.company_name_is_blocked\(text, text\) from public, anon, authenticated/);
assert.ok(
  variantMigration.indexOf('if private.company_name_is_blocked') < variantMigration.indexOf('if not validation.valid'),
  'Severe obfuscations with otherwise-invalid separators should return the blocked result first',
);
assert.match(embeddedMigration, /set\s+match_type = 'normalized_fuzzy_contains'/);
assert.match(embeddedMigration, /and not exists \(/);
assert.ok(!embeddedSevereUpgrades.some((upgrade) => ['dalyarrak', 'pust'].includes(upgrade.normalizedTerm)));
assert.equal(
  effectiveSeedRules.find((rule) => rule.normalizedTerm === 'mal')?.matchType,
  'exact',
  'Ambiguous exact rows must stay exact',
);
assert.equal(
  effectiveSeedRules.find((rule) => rule.normalizedTerm === 'saksofon')?.matchType,
  'exact',
  'Collision-sensitive normalized rows must not become substring rules',
);
assert.equal(
  effectiveSeedRules.find((rule) => rule.normalizedTerm === 'abaza')?.matchType,
  'normalized_exact',
  'Ordinary normalized-exact rows must stay whole-name-only',
);
assert.equal(
  effectiveSeedRules.find((rule) => rule.normalizedTerm === 'pust')?.matchType,
  'normalized_fuzzy_exact',
  'Explicitly retained fuzzy-exact rows must remain whole-name-only',
);

for (const blockedVariant of [
  'yarrak',
  'yarrakk',
  'yarraakk',
  'yarrağı',
  'yarragi',
  'ömerinyarrağı',
  'omerinyarragi',
  'şirketinyarrağı',
  'y.a.r.r.a.k',
  'y a r r a k',
  'y@rrak',
  'y4rrak',
  'testyarrakcorp',
  'yarrakholding',
  'P.E.Z.E.V.E.N.N.K Holding',
]) {
  assert.equal(
    effectiveSeedRules.some((rule) => matchesBlocklistRule(blockedVariant, rule)),
    true,
    `${blockedVariant} should be blocked by severe-term variant matching`,
  );
}

for (const blockedName of ['S1K-T1R Holding', 'O.R.O.S.P.U. Labs', 'F-U-C-K Ventures', 'Pezevenk Digital']) {
  assert.equal(
    effectiveSeedRules.some((rule) => matchesBlocklistRule(blockedName, rule)),
    true,
    `${blockedName} should be blocked by a representative severe rule`,
  );
}

for (const cleanName of [
  'Yaren Teknoloji',
  'Yararlı Sistemler',
  'Şikayet Çözüm',
  'Göteborg Lojistik',
  'Epic Tasarım',
  'Ambar Teknoloji',
  'Ocak Yazılım',
  'Saksofon Atölyesi',
  'Anadolu Analiz',
]) {
  assert.equal(validation.validateCompanyName(cleanName).isValid, true, `${cleanName} should pass local validation`);
  assert.equal(
    effectiveSeedRules.some((rule) => matchesBlocklistRule(cleanName, rule)),
    false,
    `${cleanName} should not collide with a seeded blocklist rule`,
  );
}

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
assert.match(migration, /select \* into availability from public\.check_company_name_availability\(candidate\)/);
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
