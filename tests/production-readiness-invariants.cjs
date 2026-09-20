// Run: npm run test:production-readiness
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
const saves = require('../src/utils/playerSave.ts');
const { getWebOAuthRedirectUrl } = require('../src/auth/oauthRedirect.ts');

const oldGenericProgress = saves.normalizePlayerSave({
  careerXp: 8_000,
  reputation: 900,
  companyBudget: 75_000,
  categoryProgress: {
    web_programming: {
      1: { attemptedQuestionIds: ['legacy-question'], correctCount: 1, incorrectCount: 0 },
    },
  },
});
const newAccount = saves.selectAuthenticatedSaveSource(null, null);
assert.equal(newAccount.source, 'clean_default');
assert.equal(newAccount.save.careerXp, 0, 'A new account must not inherit generic local Career XP');
assert.equal(newAccount.save.reputation, 0, 'A new account must not inherit generic local reputation');
assert.equal(newAccount.save.companyBudget, 1_000, 'A new account must start with the clean default budget');
assert.notDeepEqual(newAccount.save, oldGenericProgress, 'Generic guest progress must not become a new account save');
assert.equal(
  newAccount.save.categoryProgress.web_programming[1].attemptedQuestionIds.length,
  0,
  'Missing authenticated checkpoint/save data must not borrow old local category progress',
);

const accountACache = saves.normalizePlayerSave({ careerXp: 120, reputation: 35, companyBudget: 2_400 });
const accountACloud = saves.normalizePlayerSave({ careerXp: 420, reputation: 90, companyBudget: 6_000 });
const cachedAccount = saves.selectAuthenticatedSaveSource(null, accountACache);
assert.equal(cachedAccount.source, 'account_cache');
assert.equal(cachedAccount.save.careerXp, 120, 'Only the matching user-scoped cache may initialize a missing cloud row');
const cloudAccount = saves.selectAuthenticatedSaveSource(accountACloud, accountACache);
assert.equal(cloudAccount.source, 'cloud');
assert.equal(cloudAccount.save.careerXp, 420, 'An existing cloud save must win over device state');
const accountBCloud = saves.normalizePlayerSave({ careerXp: 17, reputation: 4, companyBudget: 1_250 });
const switchedAccount = saves.selectAuthenticatedSaveSource(accountBCloud, null);
assert.equal(switchedAccount.save.careerXp, 17, 'User B must hydrate from B cloud state');
assert.notEqual(switchedAccount.save.companyBudget, accountACloud.companyBudget, 'User B must not inherit A budget');
const returnedAccount = saves.selectAuthenticatedSaveSource(accountACloud, accountACache);
assert.equal(returnedAccount.save.careerXp, 420, 'Signing back into A must restore A cloud state');

assert(saves.isAuthenticatedSaveVisible('user-a', 'user-a'), 'A hydrated active user may see its save');
assert(!saves.isAuthenticatedSaveVisible('user-b', 'user-a'), 'User A state must be hidden after switching to user B');
assert(!saves.isAuthenticatedSaveVisible(null, 'user-a'), 'Authenticated state must be hidden after logout');
assert(!saves.canPersistCloudSave('user-a', 'user-a', null, true), 'Cloud writes require completed hydration');
assert(!saves.canPersistCloudSave('user-a', 'user-a', 'user-a', false), 'Cloud writes require a verified cloud baseline');
assert(!saves.canPersistCloudSave('user-a', 'user-b', 'user-b', true), 'A queued user A write must stop after switching to user B');
assert(saves.canPersistCloudSave('user-a', 'user-a', 'user-a', true), 'The active hydrated user may write after baseline verification');
assert(!saves.canPersistAccountSave('user-a', 'user-b', 'user-b'), 'User A cache writes must stop after an account switch');
assert.notEqual(
  saves.createAccountSaveCacheKey('user-a'),
  saves.createAccountSaveCacheKey('user-b'),
  'User-scoped local save keys must not collide',
);

const contextSource = fs.readFileSync(path.join(root, 'src/state/ReputationContext.tsx'), 'utf8');
assert(!contextSource.includes('claimAndLoadLegacySave'), 'Authenticated hydration must not claim generic legacy saves');
assert(contextSource.includes('clearRuntimeForAccountBoundary();'), 'Account changes must clear hydrated player runtime');
assert(contextSource.includes('activeUserIdRef.current = null;'), 'Unmounted account saves must stop queued writes');

const authSource = fs.readFileSync(path.join(root, 'src/state/AuthContext.tsx'), 'utf8');
assert(authSource.includes("supabase.auth.signOut({ scope: 'local' })"), 'Logout must call Supabase signOut for the current session');
assert(authSource.includes("event === 'SIGNED_OUT'"), 'An in-flight signOut error must not prematurely clear UI auth state');
assert(authSource.includes('await recoverFailedSignOut();'), 'A failed signOut must attempt to retain or restore the session');
assert(/if \(error\) \{[\s\S]*?return \{ ok: false,[\s\S]*?setSession\(null\)/.test(authSource), 'Only successful signOut may commit the normal auth clear');
assert(authSource.includes("setSignOutNotice('Çıkış tamamlanamadı."), 'Unrecoverable signOut errors must remain visible on the auth screen');
const loginSource = fs.readFileSync(path.join(root, 'app/(auth)/login.tsx'), 'utf8');
assert(loginSource.includes('actionError || signOutNotice'), 'Login must surface unrecoverable signOut feedback');

const layoutSource = fs.readFileSync(path.join(root, 'app/_layout.tsx'), 'utf8');
assert(layoutSource.includes("key={user?.id ?? 'signed-out'}"), 'Player, leaderboard, and route runtime must remount per auth identity');
assert(layoutSource.indexOf('<ThemeProvider>') < layoutSource.indexOf('<AccountScopedApp'), 'Theme must survive account switches');
assert(layoutSource.indexOf('<PrivacyConsentProvider>') < layoutSource.indexOf('<AccountScopedApp'), 'Device consent must survive account switches');
assert(layoutSource.includes('<Stack.Protected guard={!isAuthenticated}>'), 'Logout must route into the unauthenticated stack');

const profileSource = fs.readFileSync(path.join(root, 'app/(tabs)/profile.tsx'), 'utf8');
assert(profileSource.includes('>Çıkış Yap</Text>'), 'Production Profile must expose a visible logout action');
assert(profileSource.includes('Bu hesaptan çıkış yapmak istediğine emin misin?'), 'Logout must require the specified confirmation');
assert(profileSource.indexOf('await flushPlayerSave();') < profileSource.indexOf('const result = await signOut();'), 'Logout must finish the current save queue before signing out');
assert(profileSource.includes('if (logoutPendingRef.current) return;'), 'Duplicate logout presses must be ignored');
assert(profileSource.includes("setLogoutError('Çıkış yapılamadı. Tekrar dene.');"), 'Logout failure must show Turkish error feedback');

assert.equal(
  getWebOAuthRedirectUrl('https://ship-it-ops.vercel.app'),
  'https://ship-it-ops.vercel.app/',
  'Production Google OAuth must return to the deploy origin root',
);
assert.equal(
  getWebOAuthRedirectUrl('http://localhost:8081/play'),
  'http://localhost:8081/',
  'Local web OAuth must derive its return URL from the current origin',
);

const vercelConfig = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
assert.deepEqual(
  vercelConfig.rewrites,
  [{ source: '/(.*)', destination: '/index.html' }],
  'Vercel must route direct SPA paths to the exported index document',
);
for (const route of ['index', 'play', 'game', 'reputation', 'store', 'profile', 'leaderboard']) {
  assert(fs.existsSync(path.join(root, 'app', '(tabs)', `${route}.tsx`)), `Expected route /${route} must exist`);
}
const tabsLayout = fs.readFileSync(path.join(root, 'app', '(tabs)', '_layout.tsx'), 'utf8');
assert(
  /name="leaderboard"[\s\S]*?href:\s*null/.test(tabsLayout),
  'The /leaderboard compatibility route must remain hidden from the tab bar',
);

const exportedIndex = path.join(root, 'dist', 'index.html');
if (fs.existsSync(exportedIndex)) {
  const html = fs.readFileSync(exportedIndex, 'utf8');
  const assetPaths = [...html.matchAll(/(?:src|href)="(\/_expo\/[^"?#]+)/g)].map((match) => match[1]);
  assert(assetPaths.length > 0, 'The Expo export must reference at least one static asset');
  for (const assetPath of assetPaths) {
    assert(
      fs.existsSync(path.join(root, 'dist', ...assetPath.split('/').filter(Boolean))),
      `Exported static asset must exist: ${assetPath}`,
    );
  }
}

console.log('Production auth, save-isolation, hydration, and route invariants passed.');
