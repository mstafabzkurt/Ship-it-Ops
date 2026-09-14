// Run: node tests/onboarding-invariants.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
require.extensions['.tsx'] = require.extensions['.ts'];
require.extensions['.png'] = (module, filename) => { module.exports = filename; };

const root = path.resolve(__dirname, '..');
const onboarding = require('../src/utils/onboarding.ts');
const saves = require('../src/utils/playerSave.ts');
const cosmetics = require('../src/config/cosmetics.ts');
const themes = require('../src/theme/themes.ts');

assert.equal(onboarding.ONBOARDING_STEP_COUNT, 7);

// 1. A clean authenticated save remains eligible for onboarding.
const fresh = saves.createDefaultPlayerSave();
assert.equal(fresh.onboardingCompleted, false);
assert.equal(fresh.tutorialCompleted, false);

// 2. Pre-v3 users with a company name or meaningful progress are never forced back through first-run UX.
for (const legacy of [
  { companyName: 'Legacy Stack' },
  { careerXp: 10 },
  { companyBudget: 900 },
  { correctAnswers: 1 },
]) {
  const normalized = saves.normalizePlayerSave({ ...fresh, ...legacy, saveVersion: 2, onboardingCompleted: false, tutorialCompleted: false });
  assert.equal(normalized.onboardingCompleted, true);
  assert.equal(normalized.tutorialCompleted, true);
}
const newPlayerAfterFirstSession = saves.normalizePlayerSave({
  ...fresh,
  saveVersion: 3,
  onboardingCompleted: true,
  tutorialCompleted: false,
  careerXp: 100,
});
assert.equal(newPlayerAfterFirstSession.tutorialCompleted, false, 'A v3 player must retain a postponed tutorial after first progress');

// 3. Explicit skip uses safe defaults and survives a save round trip.
const skippedSelection = onboarding.createSkippedOnboardingSelection();
const skipped = saves.normalizePlayerSave({
  ...fresh,
  companyName: skippedSelection.companyName,
  equippedAvatarId: skippedSelection.avatarId,
  equippedAvatarFrameId: skippedSelection.avatarFrameId,
  selectedInterestAreas: skippedSelection.selectedInterestAreas,
  onboardingCompleted: true,
});
assert.equal(skipped.onboardingCompleted, true);
assert.equal(skipped.companyName, 'ShipIt Inc.');
assert.equal(skipped.equippedAvatarId, cosmetics.DEFAULT_AVATAR_ID);
assert.equal(skipped.equippedAvatarFrameId, cosmetics.DEFAULT_AVATAR_FRAME_ID);
assert.deepEqual(skipped.selectedInterestAreas, []);

// 4. Company names use the shared strict validator.
assert.deepEqual(onboarding.validateOnboardingCompanyName('  Neon Stack  '), { valid: true, value: 'Neon Stack' });
assert.equal(onboarding.validateOnboardingCompanyName('   ').valid, false);
assert.equal(onboarding.validateOnboardingCompanyName('x'.repeat(80)).valid, false);

// 5-6. Starter pickers expose only free cosmetics that this account owns.
const allIds = cosmetics.COSMETIC_CATALOG.map((item) => item.id);
const starterAvatars = onboarding.getStarterAvatars(allIds);
const starterFrames = onboarding.getStarterFrames(allIds);
assert.ok(starterAvatars.length > 0);
assert.ok(starterFrames.length > 0);
assert.ok(starterAvatars.every((item) => item.type === 'avatar' && item.price === 0 && allIds.includes(item.id)));
assert.ok(starterFrames.every((item) => item.type === 'avatar_frame' && item.price === 0 && allIds.includes(item.id)));
assert.ok(!starterAvatars.some((item) => item.id === 'avatar_terminal'));
assert.ok(!starterFrames.some((item) => item.id === 'avatar_frame_signal'));

// 7. Selected starter avatar/frame IDs persist through the actual player-save normalizer.
const selectedCosmetics = saves.normalizePlayerSave({
  ...fresh,
  onboardingCompleted: true,
  equippedAvatarId: starterAvatars[0].id,
  equippedAvatarFrameId: starterFrames[0].id,
});
assert.equal(selectedCosmetics.equippedAvatarId, starterAvatars[0].id);
assert.equal(selectedCosmetics.equippedAvatarFrameId, starterFrames[0].id);

// 8. Interests are deduplicated, invalid values are discarded, and the result persists.
const interested = saves.normalizePlayerSave({
  ...fresh,
  onboardingCompleted: true,
  selectedInterestAreas: ['web_programming', 'web_programming', 'invalid', 'database_systems'],
});
assert.deepEqual(interested.selectedInterestAreas, ['web_programming', 'database_systems']);
assert.equal(onboarding.INTEREST_AREA_OPTIONS.length, 15, 'Onboarding must expose the full course catalog');
assert.deepEqual(
  onboarding.INTEREST_AREA_OPTIONS.slice(0, 3).map((option) => option.id),
  ['web_programming', 'operating_systems', 'database_systems'],
  'Onboarding must preserve the original interest-area IDs and order',
);
const newInterests = saves.normalizePlayerSave({
  ...fresh,
  onboardingCompleted: true,
  selectedInterestAreas: ['algorithm', 'software_engineering', 'engineering_economics'],
});
assert.deepEqual(
  newInterests.selectedInterestAreas,
  ['algorithm', 'software_engineering', 'engineering_economics'],
  'New course interests must survive player-save normalization',
);

// 9. Tutorial becomes eligible immediately after onboarding.
assert.equal(onboarding.shouldShowTutorial(true, false, false), true);

// 10-11. Skip and completion share the durable tutorial-completed flag and never re-open.
const tutorialDone = saves.normalizePlayerSave({ ...fresh, onboardingCompleted: true, tutorialCompleted: true });
assert.equal(tutorialDone.tutorialCompleted, true);
assert.equal(onboarding.shouldShowTutorial(tutorialDone.onboardingCompleted, tutorialDone.tutorialCompleted, false), false);

// 12. An active game suppresses the tutorial without marking it complete.
assert.equal(onboarding.shouldShowTutorial(true, false, true), false);

// 13. Account-scoped hydration prevents old account state from becoming visible.
assert.equal(saves.isAuthenticatedSaveVisible('new-user', 'old-user'), false);
const rootLayout = fs.readFileSync(path.join(root, 'app/_layout.tsx'), 'utf8');
assert.match(rootLayout, /<OnboardingExperience key=\{`onboarding-\$\{user\.id\}`\}/);
assert.match(rootLayout, /<GuidedProductTour key=\{`tour-\$\{user\.id\}`\}/);

// 14. A save cannot be persisted until active and hydrated account IDs match.
assert.equal(saves.canPersistAccountSave('new-user', 'new-user', null), false);
assert.equal(saves.canPersistCloudSave('new-user', 'new-user', 'new-user', false), false);

// 15. The panel width contract cannot overflow a 360px viewport.
assert.equal(onboarding.getOnboardingPanelWidth(360), 360);
assert.ok(onboarding.getOnboardingPanelWidth(360) <= 360);
assert.equal(onboarding.getOnboardingPanelWidth(1280), 640);

// Guard onboarding copy and keep tutorial coverage in its dedicated guided-tour invariant.
const experience = fs.readFileSync(path.join(root, 'src/components/onboarding/OnboardingExperience.tsx'), 'utf8');
for (const copy of [
  "Ship It Ops'a hoş geldin",
  'Şirketini kur',
  'Operasyon alanını seç',
  'Bu temayla devam et',
  'Operatör avatarını seç',
  'Avatar çerçeveni seç',
  'İlgi alanlarını seç',
  'Hazırsın',
  'Soruları cevapla, doğru kararlarınla kariyer basamaklarını tek tek tırman.',
  'Oturum hedeflerini geçerek yeni kademeleri aç; kazandığın bütçeyle jokerler ve kozmetiklerle kendi tarzını ortaya çıkar.',
  'Sistemi Başlat',
]) assert.ok(experience.includes(copy), `Missing onboarding/tutorial copy: ${copy}`);
assert.ok(
  experience.indexOf('Şirketini kur') < experience.indexOf('Operasyon alanını seç')
    && experience.indexOf('Operasyon alanını seç') < experience.indexOf('Operatör avatarını seç'),
  'Theme selection must appear after company name and before avatar selection',
);
assert.match(experience, /await setThemeId\(themeDraft\)/);
assert.equal(themes.THEME_METADATA.daylight.builtIn, true);
assert.equal(themes.THEME_METADATA.default.title, 'Klasik · Koyu');
assert.equal(themes.THEME_METADATA.daylight.title, 'Daylight Ops · Açık');
assert.match(experience, /THEME_METADATA\[id\]/);
for (const removedCopy of [
  'Yalnızca hesabına ücretsiz tanımlanan başlangıç avatarları gösterilir.',
  'Yalnızca hesabına ücretsiz tanımlanan başlangıç çerçeveleri gösterilir.',
]) assert.ok(!experience.includes(removedCopy), `Removed onboarding helper copy is still present: ${removedCopy}`);
for (const eventName of [
  'onboarding_started',
  'onboarding_completed',
  'onboarding_skipped',
  'interest_areas_selected',
]) assert.ok(experience.includes(eventName), `Missing telemetry event: ${eventName}`);
assert.ok(!experience.includes('TutorialStep'));

const service = fs.readFileSync(path.join(root, 'src/services/playerSave.ts'), 'utf8');
for (const field of ['onboarding_completed', 'tutorial_completed', 'selected_interest_areas']) {
  assert.ok(service.includes(field), `Player-save service must map ${field}`);
}

console.log('Onboarding invariants passed (15 acceptance cases).');
