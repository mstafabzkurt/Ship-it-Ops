// Run with: node tests/run-typescript-invariant.cjs tests/game-session-ux-invariants.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { isCurrentGameSessionResult, isCompleteGameSession } = require('../src/utils/gameSession');
const { removeSessionResult, upsertSessionResult } = require('../src/utils/sessionReputation');

const gameText = fs.readFileSync('app/(tabs)/game.tsx', 'utf8');
const gameAst = ts.createSourceFile('game.tsx', gameText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
// Execute the actual handlers with small platform/state stubs, without a renderer dependency.
function handler(name, state) {
  let expression;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(gameAst) === name) {
      expression = node.initializer.arguments[0].getText(gameAst);
    }
    ts.forEachChild(node, visit);
  }
  visit(gameAst);
  assert.ok(expression, `Missing production handler ${name}`);
  const code = ts.transpileModule(`(() => { const action = ${expression}; return action; })();`, {
    compilerOptions: { target: ts.ScriptTarget.ES2020 },
  }).outputText;
  return vm.runInNewContext(code, state);
}

const result = (index, outcome = 'success') => ({
  questionId: `q${index}`, questionIndex: index, outcome, uptimeBefore: 3,
});
function session(results, reduceMotion = false) {
  const state = {
    outcomePendingRef: { current: false }, advancingRef: { current: false },
    incidentRef: { current: { id: results.at(-1)?.questionId ?? 'q1' } },
    currentResolvedResult: results.at(-1), sessionResultsRef: { current: results },
    sessionQuestionIdsRef: { current: results.map((entry) => entry.questionId) },
    incidentsRef: { current: [] }, SESSION_QUESTION_COUNT: 10,
    sessionCompletionRef: { current: null }, reduceMotion,
    isCurrentGameSessionResult, isCompleteGameSession,
    questionTransition: { stopAnimation() {}, setValue() {} },
    Animated: { timing: () => ({ start: (callback) => callback?.({ finished: true }) }) },
    Easing: { out: (value) => value, cubic: null },
    setJokerOverlayQueue(queue) { state.queue = queue; },
    stopTimer() {}, setIncident(value) { state.incident = value; }, setChoices() {},
    commitResolvedSession() { state.commits = (state.commits ?? 0) + 1; state.sessionCompletionRef.current = {}; },
    chooseIncident() {
      assert.equal(state.advancingRef.current, true);
      state.nextCalls = (state.nextCalls ?? 0) + 1;
      state.incidentRef.current = { id: `q${state.sessionQuestionIdsRef.current.length + 1}` };
    },
  };
  return state;
}

for (const reduceMotion of [false, true]) {
  for (const outcome of ['success', 'fail', 'partial', 'timeout']) {
    const state = session([result(1, outcome)], reduceMotion);
    const next = handler('handleNextScenario', state);
    next(); next();
    assert.equal(state.nextCalls, 1, 'Repeated Continue must not skip an unanswered question');
    assert.equal(state.advancingRef.current, false);
    assert.equal(state.queue.length, 0);
  }
}

const reverted = session([result(1, 'fail')]);
const oldNext = handler('handleNextScenario', reverted);
Object.assign(reverted, {
  canUseGitRevert: true, categoryId: 'web_programming', difficultyStar: 1, gitRevert: 1,
  resolvingRef: { current: true }, lifelineUseLocksRef: { current: new Set() },
  JOKER_DISPLAY: { gitRevert: { name: 'Rollback' } },
  sessionUptimeStreakRef: { current: 0 }, lostStreakRef: { current: 3 },
  selectedChoiceRef: { current: null }, activeChoice: { id: 'wrong' },
  queueJokerOverlay() {}, consumeGitRevert() {}, trackEvent() {},
  setSessionUptimeStreak() {}, setLostStreak() {}, setSessionResults() {},
  setIsReverted() {}, setRevertedChoiceId() {}, setActiveChoice() {},
  setSelectedChoice() {}, setTimedOut() {}, setIsAnswered() {}, startTimer() {},
  removeSessionResult,
});
handler('handleGitRevert', reverted)();
assert.equal(reverted.sessionResultsRef.current.length, 0);
assert.equal(reverted.resolvingRef.current, false);
oldNext();
assert.equal(reverted.nextCalls, undefined, 'Continue from the rolled-back result must be rejected');
const replacement = result(1);
reverted.sessionResultsRef.current = upsertSessionResult([], replacement);
oldNext();
assert.equal(reverted.nextCalls, undefined, 'Old result must stay invalid after re-answering the same question');
reverted.currentResolvedResult = replacement;
handler('handleNextScenario', reverted)();
assert.equal(reverted.nextCalls, 1, 'Continue after re-answering Rollback must progress');

const brokenTransition = session([result(1)]);
brokenTransition.chooseIncident = () => { throw new Error('transition interrupted'); };
assert.throws(handler('handleNextScenario', brokenTransition), /transition interrupted/);
assert.equal(brokenTransition.advancingRef.current, false, 'Failures must release the transition lock');

const finalState = session(Array.from({ length: 10 }, (_, index) => result(index + 1)));
handler('handleNextScenario', finalState)();
assert.equal(finalState.nextCalls, undefined, 'Question ten must never advance to eleven');
const complete = handler('handleCompleteSession', finalState);
const tenthResult = finalState.currentResolvedResult;
finalState.sessionResultsRef.current = removeSessionResult(finalState.sessionResultsRef.current, 'q10');
complete();
assert.equal(finalState.commits, undefined, 'Rollback on question ten must invalidate completion');
finalState.currentResolvedResult = result(10);
finalState.sessionResultsRef.current = upsertSessionResult(finalState.sessionResultsRef.current, finalState.currentResolvedResult);
assert.equal(isCurrentGameSessionResult('q10', tenthResult, finalState.sessionResultsRef.current), false);
const freshComplete = handler('handleCompleteSession', finalState);
freshComplete(); freshComplete();
assert.equal(finalState.commits, 1, 'Re-answering question ten must allow exactly one completion');
assert.equal(finalState.incidentRef.current, null);
assert.equal(finalState.advancingRef.current, false);

for (const throws of [false, true]) {
  const state = session(Array.from({ length: 10 }, (_, index) => result(index + 1)));
  state.commitResolvedSession = () => { if (throws) throw new Error('commit interrupted'); };
  const action = handler('handleCompleteSession', state);
  if (throws) assert.throws(action, /commit interrupted/); else action();
  assert.equal(state.advancingRef.current, false, 'Failed completion must allow retry');
}

const overlayText = fs.readFileSync('src/components/game/JokerUseOverlay.tsx', 'utf8');
const overlayCode = ts.transpileModule(overlayText, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
function overlay(reduceMotion, width) {
  const effects = [], timers = new Map(), animations = [], finished = [];
  const tokens = { colors: {}, radius: {}, shadow: { raised: {} }, layout: {}, spacing: {} };
  const animation = () => {
    const value = { start(callback) { value.callback = callback; }, stop() { value.stopped = true; } };
    animations.push(value);
    return value;
  };
  const native = {
    Animated: {
      Value: class { setValue(value) { this.value = value; } stopAnimation() {} },
      timing: animation, parallel: animation, sequence: animation, delay: animation,
    },
    Easing: { out: (value) => value, in: (value) => value, inOut: (value) => value, cubic: null, back() {} },
    StyleSheet: { create: (value) => value }, useWindowDimensions: () => ({ width }),
  };
  const context = {
    exports: {},
    setTimeout(callback, delay) { timers.set(callback, delay); return callback; },
    clearTimeout(id) { timers.delete(id); },
    require(id) {
      if (id === 'react') return { useEffect: (effect) => effects.push(effect), useMemo: (fn) => fn(), useRef: (value) => ({ current: value }) };
      if (id === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (id === 'react-native') return native;
      if (id.endsWith('ThemeContext')) return { useTheme: () => ({ theme: {} }) };
      if (id.endsWith('dashboardTokens')) return { getDashboardTokens: () => tokens, dashboardType: {} };
      if (id.endsWith('typography')) return { fonts: {} };
      return {};
    },
  };
  vm.runInNewContext(overlayCode, context);
  const tree = context.exports.default({ activation: { activationId: 7, name: 'Rollback', countBefore: 1 }, reduceMotion, onFinished: (id) => finished.push(id) });
  assert.equal(tree.props.pointerEvents, 'none', 'Even hidden joker feedback must ignore taps');
  const cleanup = effects[0]();
  return { timers, finished, cleanup, animation: animations.at(-1) };
}
for (const width of [390, 1200]) {
  for (const reduceMotion of [false, true]) {
    const normal = overlay(reduceMotion, width);
    normal.animation.callback({ finished: true });
    normal.animation.callback({ finished: true });
    assert.deepEqual(normal.finished, [7]);
    assert.equal(normal.timers.size, 0);
    const interrupted = overlay(reduceMotion, width);
    interrupted.animation.callback({ finished: false });
    assert.deepEqual(interrupted.finished, [7], 'Interrupted animations must release the overlay queue');
    const stalled = overlay(reduceMotion, width);
    const [fallback, delay] = [...stalled.timers][0];
    assert.ok(delay <= 2200);
    fallback(); stalled.animation.callback({ finished: true });
    assert.deepEqual(stalled.finished, [7], 'Missing animation callbacks must have bounded, once-only cleanup');
    const unmounted = overlay(reduceMotion, width);
    unmounted.cleanup(); unmounted.animation.callback({ finished: false });
    assert.deepEqual(unmounted.finished, []);
    assert.equal(unmounted.timers.size, 0);
    assert.equal(unmounted.animation.stopped, true, 'Unmount must also cancel sequence delays');
  }
}

const layout = fs.readFileSync('app/(tabs)/_layout.tsx', 'utf8');
assert.match(layout, /name="game"[\s\S]*?tabBarStyle: \{ display: 'none' \}/);
assert.equal((layout.match(/display: 'none'/g) ?? []).length, 1, 'Only the game route hides normal tabs');
assert.match(gameText, /isProcessing=\{isOutcomePending \|\| !isCompletionReady\}/, 'Joker animations must not disable Continue');
console.log('Game-session UX invariants passed.');
