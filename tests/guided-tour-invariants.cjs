// Run: node tests/guided-tour-invariants.cjs
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
require.extensions['.png'] = (module, filename) => { module.exports = filename; };

const root = path.resolve(__dirname, '..');
const tourConfig = require('../src/config/guidedTour.ts');
const onboarding = require('../src/utils/onboarding.ts');
const tourSource = fs.readFileSync(path.join(root, 'src/components/onboarding/GuidedProductTour.tsx'), 'utf8');
const onboardingSource = fs.readFileSync(path.join(root, 'src/components/onboarding/OnboardingExperience.tsx'), 'utf8');
const rootLayout = fs.readFileSync(path.join(root, 'app/_layout.tsx'), 'utf8');

assert.equal(tourConfig.GUIDED_TOUR_STEPS.length, onboarding.TUTORIAL_STEP_COUNT);
assert.deepEqual(
  tourConfig.GUIDED_TOUR_STEPS.map(({ route, title }) => [route, title]),
  [
    ['/', 'Ana Sayfa'],
    ['/play', 'Oyun Merkezi'],
    ['/reputation', 'Kariyer'],
    ['/ranking', 'Sıralama'],
    ['/store', 'Mağaza'],
    ['/profile', 'Profil'],
  ],
  'The guided tour must follow the real tab order and start on Home',
);

assert.equal(tourConfig.getGuidedTourStepForPathname('/'), 0);
assert.equal(tourConfig.getGuidedTourStepForPathname('/index'), 0);
assert.equal(tourConfig.getGuidedTourStepForPathname('/game'), -1);

assert.ok(!onboardingSource.includes('TUTORIAL_STEPS'), 'The old standalone tutorial steps must be removed from onboarding');
assert.ok(!onboardingSource.includes('TutorialStep'), 'The old standalone tutorial card renderer must be removed');
assert.ok(tourSource.includes('StyleSheet.absoluteFillObject'), 'The guided tour must overlay the live app');
assert.ok(!tourSource.includes('<Modal'), 'The guided tour must not replace the live screen with a modal');
assert.ok(tourSource.includes('router.replace(GUIDED_TOUR_STEPS[0].route)'), 'Post-onboarding tour must enter on Home');
assert.ok(tourSource.includes('router.replace(GUIDED_TOUR_STEPS[targetStep].route)'), 'Next and Back must navigate to the matching tab');
assert.match(tourSource, /const handleSkip = \(\) => \{[\s\S]*?completeTutorial\(\);[\s\S]*?\};/);
assert.match(tourSource, /const handleFinish = \(\) => \{[\s\S]*?completeTutorial\(\);[\s\S]*?\};/);
assert.ok(tourSource.includes("pathname === '/game'"), 'Active game sessions must suppress the tour overlay');
assert.ok(tourSource.includes('getGuidedTourStepForPathname(pathname)'), 'Manual tab navigation must synchronize the tour step');
assert.ok(tourSource.includes("'tutorial_started'") && tourSource.includes("'tutorial_completed'") && tourSource.includes("'tutorial_skipped'"), 'Existing tutorial telemetry names must be preserved');
assert.ok(rootLayout.includes('<GuidedProductTour key={`tour-${user.id}`} />'), 'The tour must reset when the authenticated account changes');
assert.ok(rootLayout.includes('<OnboardingExperience key={`onboarding-${user.id}`} />'), 'Onboarding must remain account-scoped and separate');

assert.equal(onboarding.shouldShowTutorial(true, false, false), true);
assert.equal(onboarding.shouldShowTutorial(true, true, false), false, 'Completed users must not see the tour again');
assert.equal(onboarding.shouldShowTutorial(true, false, true), false, 'Active gameplay must remain unblocked');
assert.equal(onboarding.shouldShowTutorial(false, false, false), false, 'Onboarding and tutorial completion must remain separate concepts');

console.log('Guided product tour invariants passed.');
