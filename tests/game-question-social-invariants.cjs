const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function callbackSource(file, name) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) {
      callback = node.initializer.arguments[0].getText(ast);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert(callback, `${name} callback must exist`);
  return { source, callback };
}

function action(callback, context) {
  const script = ts.transpileModule(`(${callback})`, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
  }).outputText;
  return vm.runInNewContext(script, context);
}

const game = callbackSource('app/(tabs)/game.tsx', 'handleToggleQuestionFavorite');
const sheet = callbackSource('src/components/social/QuestionShareSheet.tsx', 'handleSend');
const gameSource = game.source;
const sheetSource = sheet.source;

function favoriteHarness(initial, mutation) {
  const question = { id: 'Web_Programming-1_01' };
  const state = { favorite: initial, pending: false, feedback: '' };
  const context = {
    incidentRef: { current: question },
    user: { id: '00000000-0000-4000-8000-000000000001' },
    favoriteStateLoaded: true,
    favoriteMutationLockRef: { current: false },
    favoriteMutationIdRef: { current: 0 },
    isQuestionFavorite: initial,
    setFavoritePending: (value) => { state.pending = value; },
    setQuestionSocialFeedback: (value) => { state.feedback = value; },
    setIsQuestionFavorite: (value) => { state.favorite = value; },
    setQuestionFavorite: mutation,
  };
  return { state, context, toggle: action(game.callback, context) };
}

(async () => {
  let finishSave;
  const save = new Promise((resolve) => { finishSave = resolve; });
  const saved = favoriteHarness(false, (userId, id, favorite) => {
    assert.equal(userId, '00000000-0000-4000-8000-000000000001');
    assert.equal(id, 'Web_Programming-1_01', 'Gameplay must persist the exact active question ID');
    assert.equal(favorite, true);
    return save;
  });
  const saveAction = saved.toggle();
  assert.equal(saved.state.favorite, true, 'Optimistic UI must show the pending favorite');
  assert.equal(saved.state.pending, true);
  finishSave(true);
  await saveAction;
  assert.equal(saved.state.favorite, true);
  assert.equal(saved.state.pending, false);
  assert.equal(saved.state.feedback, 'Soru favorilere eklendi.');

  const failed = favoriteHarness(false, async () => { throw new Error('write failed'); });
  await failed.toggle();
  assert.equal(failed.state.favorite, false, 'Failed persistence must roll back the star');
  assert.equal(failed.state.feedback, 'Favori durumu güncellenemedi.');

  const removed = favoriteHarness(true, async (_userId, _id, favorite) => {
    assert.equal(favorite, false);
    return false;
  });
  await removed.toggle();
  assert.equal(removed.state.favorite, false, 'Second press must remove the persisted favorite');

  assert.match(gameSource, /if \(!isAnswered\) stopTimer\(\)/);
  assert.match(gameSource, /if \(!isAnswered && timeLeftRef\.current > 0\) startTimer\(false\)/);
  assert.match(gameSource, /<QuestionShareSheet[\s\S]*questionId=\{incident\.id\}/);
  assert.doesNotMatch(gameSource.match(/<QuestionShareSheet[\s\S]*?\/>/)?.[0] ?? '', /allowInboxDelivery/, 'Gameplay picker must use direct delivery');
  assert.match(sheetSource, /allowInboxDelivery = false/);
  assert.match(sheetSource, /allowInboxDelivery && !sentCompanyName/, 'Gameplay must not show destination tabs');
  assert.match(sheetSource, /listFriends\(user\.id\)/);
  const friendsSource = fs.readFileSync('src/services/friends.ts', 'utf8');
  assert.match(friendsSource, /listFriends\(currentUserId: string\)[\s\S]*\.eq\('status', 'accepted'\)/);

  let finishSend;
  const send = new Promise((resolve) => { finishSend = resolve; });
  const sendCalls = [];
  const sentState = { sending: null, company: '', status: 'ready' };
  const sendContext = {
    questionId: 'Web_Programming-1_01',
    effectiveDeliveryMode: 'message',
    sendLockRef: { current: false },
    setSendingUserId: (value) => { sentState.sending = value; },
    setSentCompanyName: (value) => { sentState.company = value; },
    setStatus: (value) => { sentState.status = value; },
    onSent: () => undefined,
    sendQuestionToDirectMessage: (userId, id) => { sendCalls.push([userId, id]); return send; },
    shareQuestionWithFriend: () => { throw new Error('Gameplay must not use the standalone inbox RPC'); },
  };
  const sendQuestion = action(sheet.callback, sendContext);
  const friend = { userId: '00000000-0000-4000-8000-000000000002', profile: { companyName: 'Friend Inc.' } };
  const firstSend = sendQuestion(friend);
  await sendQuestion(friend);
  assert.deepEqual(sendCalls, [[friend.userId, 'Web_Programming-1_01']], 'Duplicate taps must send once through DM');
  finishSend({});
  await firstSend;
  assert.equal(sentState.company, 'Friend Inc.');
  assert.equal(sentState.sending, null);
  assert.doesNotMatch(game.callback, /commitGameSession|setSelectedChoice|consume.*Joker|setTimeLeft/);
  console.log('Gameplay favorite and direct question-share invariants passed.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
