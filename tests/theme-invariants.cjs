// Run: node tests/theme-invariants.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const root = path.resolve(__dirname, '..');
const themes = require('../src/theme/themes.ts');
const { getDashboardTokens } = require('../src/components/dashboard/dashboardTokens.ts');
const store = require('../src/data/storeItems.ts');

assert.equal(themes.defaultTheme.id, 'default');
assert.equal(themes.THEMES.default, themes.defaultTheme);
assert.equal(themes.daylightTheme.id, 'daylight');
assert.equal(themes.THEMES.daylight, themes.daylightTheme);
assert.equal(themes.daylightTheme.mode, 'light');
assert.equal(themes.THEME_METADATA.daylight.title, 'Daylight Ops · Açık');
assert.equal(themes.THEME_METADATA.daylight.builtIn, true);
assert.ok(themes.BUILT_IN_THEME_IDS.includes('default'));
assert.ok(themes.BUILT_IN_THEME_IDS.includes('daylight'));

assert.deepEqual(
  {
    canvas: themes.daylightTheme.semantic.canvas,
    surface: themes.daylightTheme.semantic.surface,
    primary: themes.daylightTheme.semantic.action,
    info: themes.daylightTheme.semantic.info,
    success: themes.daylightTheme.semantic.success,
    danger: themes.daylightTheme.semantic.danger,
    onAction: themes.daylightTheme.semantic.foregroundOnAction,
  },
  {
    canvas: '#F7F4EF',
    surface: '#FFFDFA',
    primary: '#2F6B4F',
    info: '#35677B',
    success: '#286448',
    danger: '#A44249',
    onAction: '#FFFFFF',
  },
);

const defaultTokens = getDashboardTokens(themes.defaultTheme, 390);
assert.deepEqual(
  {
    actionSubSurface: defaultTokens.colors.actionSubSurface,
    actionSubSurfaceForeground: defaultTokens.colors.actionSubSurfaceForeground,
    questionSurface: defaultTokens.colors.gameQuestionSurface,
    questionHeaderSurface: defaultTokens.colors.gameQuestionHeaderSurface,
    supportSurface: defaultTokens.colors.gameSupportSurface,
    supportRaisedSurface: defaultTokens.colors.gameSupportRaisedSurface,
    answerSurface: defaultTokens.colors.gameAnswerSurface,
    answerHover: defaultTokens.colors.gameAnswerHover,
    answerPressed: defaultTokens.colors.gameAnswerPressed,
    selectionBackground: defaultTokens.colors.gameSelectionBackground,
    selectionBorder: defaultTokens.colors.gameSelectionBorder,
    structure: defaultTokens.colors.gameStructureAccent,
    label: defaultTokens.colors.gameLabelAccent,
    divider: defaultTokens.colors.gameDivider,
    progress: defaultTokens.colors.gameProgress,
    urgency: defaultTokens.colors.gameUrgency,
    timerBoost: defaultTokens.colors.gameTimerBoost,
  },
  {
    actionSubSurface: defaultTokens.colors.surfaceHighlight,
    actionSubSurfaceForeground: defaultTokens.colors.onAccent,
    questionSurface: defaultTokens.colors.surface,
    questionHeaderSurface: defaultTokens.colors.secondarySurfaceRaised,
    supportSurface: defaultTokens.colors.secondarySurface,
    supportRaisedSurface: defaultTokens.colors.secondarySurfaceRaised,
    answerSurface: defaultTokens.colors.surface,
    answerHover: defaultTokens.colors.surfaceHover,
    answerPressed: defaultTokens.colors.surfacePressed,
    selectionBackground: defaultTokens.colors.primarySoft,
    selectionBorder: defaultTokens.colors.selectionBorder,
    structure: defaultTokens.colors.decision,
    label: defaultTokens.colors.secondary,
    divider: defaultTokens.colors.dividerSubtle,
    progress: defaultTokens.colors.reputation,
    urgency: defaultTokens.colors.warning,
    timerBoost: defaultTokens.colors.info,
  },
  'Default theme must preserve the pre-polish gameplay mappings',
);

assert.deepEqual(
  {
    actionHover: themes.daylightTheme.semantic.actionHover,
    actionPressed: themes.daylightTheme.semantic.actionPressed,
    actionSubSurface: themes.daylightTheme.semantic.actionSubSurface,
    actionSubSurfaceForeground: themes.daylightTheme.semantic.actionSubSurfaceForeground,
    questionSurface: themes.daylightTheme.semantic.gameQuestionSurface,
    questionHeaderSurface: themes.daylightTheme.semantic.gameQuestionHeaderSurface,
    supportSurface: themes.daylightTheme.semantic.gameSupportSurface,
    answerHover: themes.daylightTheme.semantic.gameAnswerHover,
    selection: themes.daylightTheme.semantic.gameSelectionBorder,
    structure: themes.daylightTheme.semantic.gameStructureAccent,
    divider: themes.daylightTheme.semantic.gameDivider,
    progress: themes.daylightTheme.semantic.gameProgress,
    urgency: themes.daylightTheme.semantic.gameUrgency,
  },
  {
    actionHover: '#285D45',
    actionPressed: '#214F3B',
    actionSubSurface: '#F5ECDD',
    actionSubSurfaceForeground: '#514632',
    questionSurface: '#FBF6ED',
    questionHeaderSurface: '#F1E9DC',
    supportSurface: '#EEE6DA',
    answerHover: '#EFF3EA',
    selection: '#2F6B4F',
    structure: '#6B5A45',
    divider: '#948167',
    progress: '#2F6B4F',
    urgency: '#9B4A13',
  },
);

const expectedPaidThemes = {
  theme_cyberpunk: { themeIdKey: 'cyberpunk', price: 500 },
  theme_hardware: { themeIdKey: 'hardware', price: 350 },
  theme_nebula: { themeIdKey: 'nebula', price: 800 },
};
assert.equal(store.THEME_ITEMS.length, 3);
for (const item of store.THEME_ITEMS) {
  assert.deepEqual(
    { themeIdKey: item.themeIdKey, price: item.price },
    expectedPaidThemes[item.id],
    `${item.id} must preserve its paid ownership and price contract`,
  );
  assert.equal(themes.THEME_METADATA[item.themeIdKey].builtIn, false);
}

const contextSource = fs.readFileSync(path.join(root, 'src/state/ThemeContext.tsx'), 'utf8');
const onboardingSource = fs.readFileSync(path.join(root, 'src/components/onboarding/OnboardingExperience.tsx'), 'utf8');
const storeSource = fs.readFileSync(path.join(root, 'app/(tabs)/store.tsx'), 'utf8');
assert.ok(contextSource.includes("const THEME_STORAGE_KEY = '@shipit_theme_id'"));
assert.match(onboardingSource, /await setThemeId\(themeDraft\)/);
assert.ok(!onboardingSource.includes('purchaseItem'));
assert.match(storeSource, /handleEquipBuiltIn\('daylight'\)/);
assert.match(storeSource, /owned\s*\n\s*active=\{themeId === 'daylight'\}/);

console.log('Daylight theme invariants passed: stable ID, semantic palette, free paths, and paid theme contracts.');
