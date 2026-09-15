// Exercise the actual onboarding render/event handlers with local context and hook stubs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relativePath, dependencies = {}) {
  const filename = path.join(__dirname, '..', relativePath);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

const validation = load('src/utils/companyNameValidation.ts');
const suggestions = load('src/utils/companyNameSuggestions.ts', { './companyNameValidation': validation });
const source = fs.readFileSync(path.join(__dirname, '../src/components/onboarding/OnboardingExperience.tsx'), 'utf8');
assert.ok(source.indexOf('<View style={styles.footer}>') < source.indexOf('</ScrollView>'), 'CTA must remain inside the scroll content');
assert.doesNotMatch(source, /100vh/);

async function run() {
  const states = [];
  let cursor = 0;
  let viewport = { width: 390, height: 844, top: 0 };
  let availability = { status: 'invalid', message: 'Şirket adı boş bırakılamaz.', checkedInput: '' };
  let saved = 0;
  let retries = 0;
  const react = {
    useEffect() {}, useMemo: (fn) => fn(), useRef: (current) => ({ current }),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], (value) => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
  };
  const jsx = (type, props) => ({ type, props });
  const native = Object.fromEntries(['KeyboardAvoidingView', 'Modal', 'Pressable', 'ScrollView', 'Text', 'TextInput', 'View'].map((name) => [name, name]));
  Object.assign(native, { Platform: { OS: 'web' }, StyleSheet: { create: (styles) => styles } });
  const tokens = {
    colors: {}, radius: {}, shadow: { raised: {} }, motion: { pressed: {} }, effects: {},
    layout: { pageGutter: 16, isNarrow: true },
  };
  const Component = load('src/components/onboarding/OnboardingExperience.tsx', {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'react-native': native,
    '@expo/vector-icons': { Ionicons: 'Icon' },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '../company/CompanyNameStatus': { __esModule: true, default: 'CompanyNameStatus' },
    '../../hooks/useCompanyNameAvailability': { useCompanyNameAvailability: (draft) => ({
      ...availability, validation: validation.validateCompanyName(draft), displayName: draft,
      canSave: availability.status === 'available' && availability.checkedInput === draft,
      retry: () => { retries++; },
    }) },
    '../../hooks/useOnboardingViewport': { useOnboardingViewport: () => viewport },
    '../../state/AuthContext': { useAuth: () => ({ user: { id: 'fixture' } }) },
    '../../state/ReputationContext': { useReputation: () => ({
      ownedCosmeticIds: [], selectedInterestAreas: [], onboardingCompleted: false,
      completeOnboarding: async () => { saved++; return { status: 'saved' }; }, skipOnboarding() {},
    }) },
    '../../state/ThemeContext': { useTheme: () => ({ theme: {}, themeId: 'default', setThemeId() {} }) },
    '../../theme/themes': { THEMES: {}, THEME_METADATA: {} }, '../../theme/typography': { fonts: {} },
    '../../utils/onboarding': {
      getStarterAvatars: () => [], getStarterFrames: () => [], ONBOARDING_STEP_COUNT: 7,
      getOnboardingPanelWidth: (width) => Math.min(width, 640),
    },
    '../../utils/companyNameValidation': validation, '../../utils/companyNameSuggestions': suggestions,
    '../../utils/telemetry': { trackEvent() {} }, '../cosmetics/CosmeticPreview': {},
    '../dashboard/dashboardTokens': { getDashboardTokens: () => tokens },
  }).default;
  function render() { cursor = 0; return Component(); }
  function find(tree, predicate) {
    if (!tree || typeof tree !== 'object') return;
    if (predicate(tree)) return tree;
    for (const child of [tree.props?.children].flat(Infinity)) {
      const result = find(child, predicate);
      if (result) return result;
    }
  }
  const byType = (tree, type) => find(tree, (node) => node.type === type);
  const continueButton = (tree) => find(tree, (node) => node.type === 'Pressable' && 'busy' in (node.props.accessibilityState ?? {}));
  const feedback = (tree) => byType(tree, 'CompanyNameStatus').props;

  let tree = render();
  await continueButton(tree).props.onPress();
  tree = render();
  assert.equal(byType(tree, 'TextInput').props.value, '', 'Initial draft stays empty');
  assert.equal(feedback(tree).status, 'idle');
  assert.equal(feedback(tree).message, '');
  assert.ok(!byType(tree, 'TextInput').props.onFocus, 'Focus must not mark validation touched');
  assert.ok(!byType(tree, 'TextInput').props.accessibilityHint.includes('boş bırakılamaz'));
  assert.equal(continueButton(tree).props.disabled, false, 'Empty attempts can request feedback');
  await continueButton(tree).props.onPress();
  tree = render();
  assert.equal(feedback(tree).status, 'invalid');
  assert.match(feedback(tree).message, /boş bırakılamaz/);
  assert.ok(byType(tree, 'TextInput'), 'An empty attempt never advances');
  assert.equal(saved, 0);

  find(tree, (node) => node.props?.accessibilityLabel === 'Rastgele şirket adı seç').props.onPress();
  tree = render();
  const draft = byType(tree, 'TextInput').props.value;
  assert.ok(validation.validateCompanyName(draft).isValid);
  assert.equal(feedback(tree).status, 'checking', 'Dice clears stale empty feedback immediately');
  assert.equal(continueButton(tree).props.disabled, true, 'A suggestion still requires availability');
  await byType(tree, 'TextInput').props.onSubmitEditing();
  tree = render();
  assert.equal(feedback(tree).status, 'checking');
  assert.ok(!feedback(tree).message.includes('boş bırakılamaz'), 'Keyboard submit must not revive stale empty feedback');
  for (const status of ['checking', 'unavailable', 'error']) {
    availability = { status, message: `fixture ${status}`, checkedInput: draft };
    tree = render();
    assert.equal(feedback(tree).status, status);
    assert.equal(continueButton(tree).props.disabled, true);
  }
  feedback(tree).onRetry();
  assert.equal(retries, 1);

  for (const width of [360, 390, 430, 1280]) {
    viewport = { width, height: width < 700 ? 360 : 390, top: 100 };
    tree = render();
    assert.equal(byType(tree, 'TextInput').props.value, draft, 'Viewport changes preserve the draft');
    const safeArea = byType(tree, 'SafeAreaView').props.style;
    assert.equal(safeArea.height, viewport.height);
    assert.equal(safeArea.top, 100);
    assert.equal(byType(tree, 'Modal').props.transparent, true);
    const scroll = byType(tree, 'ScrollView').props;
    assert.equal(scroll.keyboardShouldPersistTaps, 'handled');
    assert.equal(scroll.contentContainerStyle[1]?.flexGrow, width < 700 ? 0 : undefined);
    assert.equal(byType(tree, 'TextInput').props.style[0].fontSize, 16);
  }
  byType(tree, 'TextInput').props.onChangeText('');
  tree = render();
  byType(tree, 'TextInput').props.onBlur();
  tree = render();
  assert.match(feedback(tree).message, /boş bırakılamaz/);
  byType(tree, 'TextInput').props.onChangeText(draft);
  availability = { status: 'available', message: 'Bu şirket adı alınabilir.', checkedInput: draft };
  tree = render();
  assert.equal(continueButton(tree).props.disabled, false);
  await byType(tree, 'TextInput').props.onSubmitEditing();
  tree = render();
  assert.ok(!byType(tree, 'TextInput'), 'A checked available name advances normally');
  assert.equal(saved, 0, 'The company step does not save early');
  states.length = 0;
  availability = { status: 'invalid', message: 'Şirket adı boş bırakılamaz.', checkedInput: '' };
  tree = render();
  await continueButton(tree).props.onPress();
  tree = render();
  assert.equal(feedback(tree).status, 'idle');
  byType(tree, 'TextInput').props.onBlur();
  tree = render();
  assert.match(feedback(tree).message, /boş bırakılamaz/, 'A first blur can reveal the empty error without submission');
  console.log('Onboarding company-input checks passed: initial feedback, empty submit/blur, dice, availability/retry, viewport draft stability, CTA scroll placement.');
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
