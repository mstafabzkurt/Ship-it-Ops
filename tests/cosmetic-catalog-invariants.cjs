// Run: node tests/cosmetic-catalog-invariants.cjs
// Load the actual TS catalog/save utilities without a device or backend.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
require.extensions['.tsx'] = require.extensions['.ts'];
require.extensions['.png'] = (module, filename) => { module.exports = filename; };

const root = path.resolve(__dirname, '..');
const audit = JSON.parse(fs.readFileSync(path.join(root, 'assets/cosmetics/cosmetic-asset-audit.json'), 'utf8'));
const catalog = require('../src/config/cosmetics.ts');
const saves = require('../src/utils/playerSave.ts');
const selected = audit.firstReleaseSelection;
const added = catalog.COSMETIC_CATALOG.filter(item => item.assetPath?.startsWith('assets/cosmetics/raw/'));
// User-approved final curve intentionally replaces audit.suggestedPrice.
const expectedPrices = {
  avatar: { standard: 900, advanced: 1400, prestige: 2200, legendary: 3500 },
  avatar_frame: { standard: 1100, advanced: 1800, prestige: 3000, legendary: 4500 },
};
assert.equal(added.filter(item => item.type === 'avatar').length, 16);
assert.equal(added.filter(item => item.type === 'avatar_frame').length, 22);
assert.deepEqual(added.map(item => item.id).sort(), selected.map(item => item.assetId).sort());
assert.equal(new Set(catalog.COSMETIC_CATALOG.map(item => item.id)).size, catalog.COSMETIC_CATALOG.length);
assert.equal(new Set(added.map(item => item.assetPath)).size, 38);
for (const expected of selected) {
  const actual = catalog.getCosmeticById(expected.assetId);
  assert.equal(actual.name, expected.suggestedTurkishDisplayName);
  assert.equal(actual.type, expected.type);
  assert.equal(actual.category, expected.category);
  assert.equal(actual.rarity, expected.suggestedRarity);
  assert.equal(actual.price, expectedPrices[actual.type][actual.rarity]);
  assert.equal(actual.assetPath, expected.filePath);
  assert.equal(actual.visual.source, path.join(root, expected.filePath));
  assert.ok(fs.existsSync(actual.visual.source), `Missing asset: ${actual.id}`);
  assert.equal(audit.assets.find(item => item.id === actual.id).recommendation, 'KEEP');
  assert.ok(catalog.COSMETIC_CATEGORIES[actual.type].includes(actual.category));
}
const originalPrices = { avatar_default: 0, avatar_terminal: 2500, avatar_systems: 4000, avatar_frame_default: 0, avatar_frame_signal: 2000, avatar_frame_command: 3500 };
assert.equal(catalog.COSMETIC_CATALOG.length, 44);
for (const [id, price] of Object.entries(originalPrices)) assert.equal(catalog.getCosmeticById(id).price, price);

// Price is primary even across legacy/new items; missing rarity is standard.
const orderingCases = [
  { id: 'legendary', price: 900, rarity: 'legendary', name: 'A' },
  { id: 'advanced', price: 900, rarity: 'advanced', name: 'A' },
  { id: 'prestige', price: 900, rarity: 'prestige', name: 'A' },
  { id: 'standard_z', price: 900, rarity: 'standard', name: 'Zambak' },
  { id: 'legacy', price: 900, name: 'Çınar' },
  { id: 'standard_c', price: 900, rarity: 'standard', name: 'Ceviz' },
  { id: 'standard_i', price: 900, rarity: 'standard', name: 'Işık' },
  { id: 'standard_dotted_i', price: 900, rarity: 'standard', name: 'İnci' },
  { id: 'free', price: 0, rarity: 'legendary', name: 'Z' },
  { id: 'costlier', price: 1100, rarity: 'standard', name: 'A' },
];
assert.deepEqual([...orderingCases].sort(catalog.compareCosmeticsByPrice).map(item => item.id), [
  'free', 'standard_c', 'legacy', 'standard_i', 'standard_dotted_i', 'standard_z', 'advanced', 'prestige', 'legendary', 'costlier',
]);
assert.deepEqual(['b', 'a'].map(id => ({ id, price: 900, name: 'Aynı' })).sort(catalog.compareCosmeticsByPrice).map(item => item.id), ['a', 'b']);
const catalogOrder = catalog.COSMETIC_CATALOG.map(item => item.id);
for (const type of ['avatar', 'avatar_frame']) {
  for (const category of ['Tümü', ...catalog.COSMETIC_CATEGORIES[type]]) {
    const visible = catalog.COSMETIC_CATALOG.filter(item => item.type === type && (category === 'Tümü' || (item.category ?? 'Klasik') === category));
    const sorted = [...visible].sort(catalog.compareCosmeticsByPrice);
    for (let index = 1; index < sorted.length; index++) assert.ok(sorted[index - 1].price <= sorted[index].price, `${type}/${category}: ascending price`);
    const withOwnership = visible.map(item => ({ ...item, owned: true, equipped: true })).reverse().sort(catalog.compareCosmeticsByPrice);
    assert.deepEqual(withOwnership.map(item => item.id), sorted.map(item => item.id), 'Ownership and incoming order must not reorder ties');
  }
}
assert.deepEqual(catalog.COSMETIC_CATALOG.map(item => item.id), catalogOrder, 'Display sorting must not mutate the catalog');

// Purchase every selected asset, then equip each type and round-trip the actual save normalizer.
let save = { ...saves.createDefaultPlayerSave(), companyBudget: 1000000 };
for (const item of added) {
  const before = { ...save };
  const purchase = catalog.planCosmeticPurchase(save.companyBudget, save.ownedCosmeticIds, item.id);
  assert.equal(purchase.status, 'ok');
  save = saves.normalizePlayerSave({ ...save, companyBudget: purchase.budget, ownedCosmeticIds: purchase.ownedCosmeticIds });
  assert.equal(save.companyBudget, before.companyBudget - item.price);
  assert.equal(save.equippedAvatarId, before.equippedAvatarId, 'Purchase must not equip avatar');
  assert.equal(save.equippedAvatarFrameId, before.equippedAvatarFrameId, 'Purchase must not equip frame');
  assert.equal(catalog.planCosmeticPurchase(save.companyBudget, save.ownedCosmeticIds, item.id).status, 'already_owned');
  assert.equal(catalog.validateCosmeticEquip(save.ownedCosmeticIds, item.id, item.type).status, 'ok');
  const key = item.type === 'avatar' ? 'equippedAvatarId' : 'equippedAvatarFrameId';
  save = saves.normalizePlayerSave(JSON.parse(JSON.stringify({ ...save, [key]: item.id })));
  assert.equal(save[key], item.id, 'New IDs must survive save hydration');
  assert.ok(save.ownedCosmeticIds.includes(item.id));
}
const defaults = saves.createDefaultPlayerSave();
assert.deepEqual(defaults.ownedCosmeticIds, [...catalog.DEFAULT_OWNED_COSMETIC_IDS]);
for (const id of defaults.ownedCosmeticIds) assert.equal(catalog.getCosmeticById(id).price, 0);
assert.equal(catalog.planCosmeticPurchase(0, defaults.ownedCosmeticIds, added[0].id).status, 'insufficient_funds');
assert.equal(catalog.validateCosmeticEquip(defaults.ownedCosmeticIds, added[0].id, 'avatar').status, 'not_owned');
assert.equal(catalog.validateCosmeticEquip(save.ownedCosmeticIds, added[0].id, 'avatar_frame').status, 'type_mismatch');
assert.equal(saves.normalizePlayerSave({ ...defaults, equippedAvatarId: added[0].id }).equippedAvatarId, catalog.DEFAULT_AVATAR_ID);
assert.deepEqual(catalog.normalizeCosmeticPlayerState(['unknown'], 'unknown', added[0].id), {
  ownedCosmeticIds: [...catalog.DEFAULT_OWNED_COSMETIC_IDS], equippedAvatarId: catalog.DEFAULT_AVATAR_ID, equippedAvatarFrameId: catalog.DEFAULT_AVATAR_FRAME_ID,
});
assert.equal(save.ownedCosmeticIds.length, 40);
assert.deepEqual(Object.keys(save).sort(), Object.keys(defaults).sort(), 'Save shape must remain unchanged');
// Saves contain IDs, not historical prices: already-owned cosmetics remain owned
// when normalized after the price update, without a refund or extra charge.
const existingOwner = saves.normalizePlayerSave({ ...save, companyBudget: 123 });
assert.equal(existingOwner.companyBudget, 123);
assert.deepEqual(existingOwner.ownedCosmeticIds, save.ownedCosmeticIds);

// Render the actual shared preview and store/profile inventory cards. Only
// platform/theme/icon adapters are substituted; preview decisions are not mocked.
const Module = require('node:module');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const nativeWeb = {
  ...require('react-native-web'),
  // RN Web defers Image content until load; expose the chosen source in SSR.
  Image: ({ source }) => React.createElement('img', { src: typeof source === 'string' ? source : source.uri, alt: '' }),
};
const theme = require('../src/theme/themes.ts').defaultTheme;
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'react-native') return nativeWeb;
  if (request.endsWith('/state/ThemeContext')) return { useTheme: () => ({ theme }) };
  if (request === '@expo/vector-icons') return { Ionicons: ({ name }) => React.createElement('span', { 'data-icon': name }) };
  return originalLoad.call(this, request, parent, isMain);
};
try {
  const Preview = require('../src/components/cosmetics/CosmeticPreview.tsx').default;
  const Card = require('../src/components/store/CosmeticStoreCard.tsx').default;
  const Filters = require('../src/components/cosmetics/CosmeticFilters.tsx').default;
  const filterHtml = renderToStaticMarkup(React.createElement(Filters, { items: catalog.COSMETIC_CATALOG, type: 'avatar', category: 'Tümü', onTypeChange: () => {}, onCategoryChange: () => {} }));
  assert.equal((filterHtml.match(/aria-selected="true"/g) || []).length, 1, 'Primary type selection must be announced');
  assert.equal((filterHtml.match(/aria-pressed="true"/g) || []).length, 1, 'Secondary active filter must be announced');
  const avatar = added.find(item => item.type === 'avatar');
  const frame = added.find(item => item.type === 'avatar_frame');
  const imageCount = html => (html.match(/<img\b/g) || []).length;
  assert.equal(imageCount(renderToStaticMarkup(React.createElement(Preview, { mode: 'avatarOnly', avatar }))), 1);
  assert.equal(imageCount(renderToStaticMarkup(React.createElement(Preview, { mode: 'frameOnly', frame }))), 1);
  assert.equal(imageCount(renderToStaticMarkup(React.createElement(Preview, { mode: 'equippedCombo', avatar, frame }))), 2);
  assert.equal(imageCount(renderToStaticMarkup(React.createElement(Preview, { avatar, frame }))), 2, 'Legacy identity callers retain combo mode');
  const iconHtml = renderToStaticMarkup(React.createElement(Preview, { mode: 'avatarOnly', avatar: { ...avatar, visual: { kind: 'icon', reference: '' } } }));
  assert.ok(iconHtml.includes('person-outline'), 'Icon fallback remains available');
  for (const item of catalog.COSMETIC_CATALOG) {
    for (const ownershipOnly of [false, true]) {
      const html = renderToStaticMarkup(React.createElement(Card, { item, owned: ownershipOnly, ownershipOnly, equipped: false, canAfford: true, isProcessing: false, actionLocked: false, reduceMotion: true, onAction: () => {} }));
      assert.equal(imageCount(html), 1, `${item.id}: inventory/store preview must contain only its own asset`);
      assert.ok(html.includes(path.basename(item.visual.source)), `${item.id}: correct standalone asset`);
    }
  }
} finally { Module._load = originalLoad; }
console.log('PASS: 16 avatars + 22 frames; prices/IDs/paths/defaults; price/rarity/Turkish-name sorting and ownership stability; purchase/equip/save guards; standalone/combo previews and fallback.');
