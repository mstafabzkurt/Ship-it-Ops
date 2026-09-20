const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadCallback(file, name) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) callback = node.initializer.arguments[0].getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert(callback, `${name} callback must exist`);
  const script = ts.transpileModule(`(${callback})`, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
  }).outputText;
  return { source, script };
}

function harness(loader, primary, secondary, initialEntries = []) {
  const userId = '00000000-0000-4000-8000-000000000001';
  const state = { entries: initialEntries, status: 'ready', actionError: '', sendersLoaded: false };
  const context = {
    user: { id: userId },
    requestIdRef: { current: 0 },
    entriesOwnerRef: { current: userId },
    setEntries: (value) => { state.entries = typeof value === 'function' ? value(state.entries) : value; },
    setStatus: (value) => { state.status = value; },
    setSendersLoaded: (value) => { state.sendersLoaded = value; },
    setActionError: (value) => { state.actionError = value; },
    listFavoriteQuestions: primary,
    listReceivedQuestionShares: primary,
    fetchSharedQuestionSenderProfiles: secondary,
  };
  return { state, load: vm.runInNewContext(loader.script, context) };
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

(async () => {
  const favorite = loadCallback('app/favorite-questions.tsx', 'loadFavorites');
  const shared = loadCallback('app/shared-questions.tsx', 'loadShares');
  const entry = { favorite: { questionId: 'text_question_1' }, question: { id: 'text_question_1' } };

  const empty = harness(favorite, async () => []);
  empty.load();
  await tick();
  assert.equal(empty.state.status, 'ready');
  assert.equal(empty.state.entries.length, 0, 'Empty state follows a successful zero-row query');

  const failed = harness(favorite, async () => { throw new Error('database unavailable'); });
  failed.load();
  await tick();
  assert.equal(failed.state.status, 'error', 'Initial database failure must not look like no records');

  const stale = harness(favorite, async () => { throw new Error('refresh unavailable'); }, undefined, [entry]);
  stale.load();
  await tick();
  assert.equal(stale.state.status, 'error');
  assert.equal(stale.state.entries[0], entry, 'Failed refresh must retain already-loaded favorites');
  assert.match(favorite.source, /status === 'error' && entries\.length > 0/, 'Retained rows need a visible refresh warning');

  const share = { share: { id: 'share_1', senderId: 'sender_1' }, question: { id: 'text_question_1' }, sender: null };
  let finishProfiles;
  const pendingProfiles = new Promise((resolve) => { finishProfiles = resolve; });
  const inbox = harness(shared, async () => [share], async () => pendingProfiles);
  inbox.load();
  await tick();
  assert.equal(inbox.state.status, 'ready', 'Question rows must render before profile lookup finishes');
  assert.equal(inbox.state.entries[0].question.id, 'text_question_1');
  assert.equal(inbox.state.entries[0].sender, null);
  assert.equal(inbox.state.sendersLoaded, false);
  finishProfiles(new Map([['sender_1', { companyName: 'Sender Inc.' }]]));
  await tick();
  assert.equal(inbox.state.entries[0].sender.companyName, 'Sender Inc.');
  assert.equal(inbox.state.sendersLoaded, true);

  const missingProfile = harness(shared, async () => [share], async () => { throw new Error('profile unavailable'); });
  missingProfile.load();
  await tick();
  assert.equal(missingProfile.state.status, 'ready');
  assert.equal(missingProfile.state.entries[0].question.id, 'text_question_1');
  assert.equal(missingProfile.state.entries[0].sender, null);
  assert.equal(missingProfile.state.sendersLoaded, true);

  const failedInbox = harness(shared, async () => { throw new Error('shares unavailable'); });
  failedInbox.load();
  await tick();
  assert.equal(failedInbox.state.status, 'error');
  assert.match(shared.source, /status === 'error' && entries\.length > 0/, 'Inbox refresh failures need a visible warning');
  console.log('Favorite and shared-question list loading invariants passed.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
