// Exercise the detail screen's real load callback with controlled service results.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('app/question-detail/[questionId].tsx', 'utf8');
const ast = ts.createSourceFile('question-detail.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let loadCallback;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'loadQuestion') {
    loadCallback = node.initializer.arguments[0].getText(ast);
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert(loadCallback, 'Detail screen load callback must exist');
const script = ts.transpileModule(`const loadQuestion = ${loadCallback}; loadQuestion();`, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
}).outputText;

function runLoad(questionId, questionPromise, favoritePromise) {
  const state = { status: 'loading', question: null, favorite: false, favoriteLoading: false };
  const calls = [];
  const requestIdRef = { current: 0 };
  const context = {
    questionId,
    user: { id: '00000000-0000-4000-8000-000000000001' },
    requestIdRef,
    setStatus: (value) => { state.status = value; },
    setQuestion: (value) => { state.question = value; },
    setFavorite: (value) => { state.favorite = value; },
    setFavoriteLoading: (value) => { state.favoriteLoading = value; },
    fetchArchivedQuestion: (id) => { calls.push(['question', id]); return questionPromise; },
    getQuestionFavoriteState: (userId, id) => { calls.push(['favorite', userId, id]); return favoritePromise; },
  };
  vm.runInNewContext(script, context);
  return { state, calls, requestIdRef };
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

(async () => {
  const id = 'Web_Programming-1_01';
  const question = { id, title: 'Which response is safe?' };
  let finishFavorite;
  const pendingFavorite = new Promise((resolve) => { finishFavorite = resolve; });
  const dm = runLoad(id, Promise.resolve(question), pendingFavorite);
  await tick();
  assert.deepEqual(dm.calls[0], ['question', id], 'DM text question ID must reach the detail query unchanged');
  assert.deepEqual(dm.calls[1], ['favorite', '00000000-0000-4000-8000-000000000001', id]);
  assert.equal(dm.state.status, 'ready', 'A pending favorite request must not delay the question');
  assert.equal(dm.state.question, question);
  assert.equal(dm.state.favoriteLoading, true, 'Favorite action stays disabled until its state is known');
  finishFavorite(true);
  await tick();
  assert.equal(dm.state.favorite, true);
  assert.equal(dm.state.favoriteLoading, false);

  for (const sourceName of ['standalone share', 'favorite']) {
    const entry = runLoad(id, Promise.resolve(question), Promise.reject(new Error('favorite unavailable')));
    await tick();
    assert.equal(entry.state.status, 'ready', `${sourceName} must open when favorite state fails`);
    assert.equal(entry.state.favoriteLoading, false);
    assert.equal(entry.state.favorite, false);
  }

  const nonexistent = runLoad(id, Promise.resolve(null), Promise.resolve(false));
  await tick();
  assert.equal(nonexistent.state.status, 'missing', 'Nonexistent questions show the safe missing state');

  const unavailable = runLoad(id, Promise.reject(new Error('question unavailable')), Promise.resolve(false));
  await tick();
  assert.equal(unavailable.state.status, 'error', 'Question query errors show the safe error state');

  const missingId = runLoad(undefined, Promise.resolve(question), Promise.resolve(false));
  assert.equal(missingId.state.status, 'missing');
  assert.equal(missingId.calls.length, 0, 'A missing route ID must not query either service');

  let finishOldQuestion;
  const oldQuestion = new Promise((resolve) => { finishOldQuestion = resolve; });
  const stale = runLoad('older_question', oldQuestion, Promise.resolve(true));
  stale.requestIdRef.current += 1;
  finishOldQuestion(question);
  await tick();
  assert.equal(stale.state.status, 'loading', 'An older route response must not replace the current detail');
  assert.equal(stale.state.favorite, false, 'An older favorite response must not replace the current state');

  assert.doesNotMatch(source, /useReputation|commitGameSession|setSelectedChoice|question_answered/);
  console.log('Question detail routing, loading, and read-only invariants passed.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
