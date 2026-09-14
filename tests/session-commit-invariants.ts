import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getCategoryReward } from '../src/config/categoryRewards';
import { SESSION_QUESTION_COUNT } from '../src/config/gameCategories';
import {
  completeOperationSession,
  createDefaultCategoryProgress,
  getTotalCategoryLeaderboardScore,
  isTierUnlocked,
} from '../src/utils/categoryProgress';
import {
  deriveGameSessionTotals,
  canUseRollbackOnResult,
  isCompleteGameSession,
  planCompletedGameSession,
  type GameSessionPermanentState,
  type GameSessionResult,
} from '../src/utils/gameSession';
import { formatSessionMetric } from '../src/utils/format';
import { getRankingScoreForOutcome, normalizeRankingOutcomeStats, type RankingOutcome } from '../src/utils/ranking';
import { removeSessionResult, upsertSessionResult } from '../src/utils/sessionReputation';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const createPermanentState = (): GameSessionPermanentState => ({
  careerXp: 1_000,
  reputation: 200,
  budget: 10_000,
  correctAnswers: 12,
  wrongAnswers: 8,
  rankingOutcomeStats: normalizeRankingOutcomeStats(null),
  categoryProgress: createDefaultCategoryProgress(),
  uptimeStreak: 0,
});

function createResult(
  index: number,
  outcome: RankingOutcome,
  uptimeBefore = 0,
  isRepeatCorrect = false,
): GameSessionResult {
  const rewardOutcome = outcome === 'partial' ? 'fail' : outcome;
  const reward = getCategoryReward(1, rewardOutcome, isRepeatCorrect);
  const isCorrect = outcome === 'success';
  return {
    questionId: `session-question-${index}`,
    questionIndex: index,
    questionTitle: `Soru ${index}`,
    selectedAnswer: outcome === 'timeout' ? null : `Yanıt ${index}`,
    correctAnswer: `Doğru ${index}`,
    outcome,
    isCorrect,
    isRepeatCorrect: isCorrect && isRepeatCorrect,
    careerXpDelta: reward.careerXpDelta,
    reputationDelta: reward.reputationDelta,
    budgetDelta: reward.budgetDelta,
    milestoneBudgetDelta: 0,
    leaderboardDelta: getRankingScoreForOutcome(outcome, isRepeatCorrect),
    uptimeBefore,
    uptimeAfter: isCorrect ? uptimeBefore + 1 : outcome === 'timeout' ? uptimeBefore : 0,
    resolvedAt: `2026-09-02T10:${String(index).padStart(2, '0')}:00.000Z`,
  };
}

const permanentBeforeAnswer = createPermanentState();
const permanentSignature = JSON.stringify(permanentBeforeAnswer);
const correctTemporaryResults = upsertSessionResult([], createResult(1, 'success'));
assert(JSON.stringify(permanentBeforeAnswer) === permanentSignature, 'Answering must not mutate permanent XP, reputation, budget, stats, ranking, or category progress');
assert(deriveGameSessionTotals(correctTemporaryResults).careerXpDelta === 100, 'Result panel must retain the temporary per-question Career XP delta');
assert(deriveGameSessionTotals(correctTemporaryResults).reputationDelta === 10, 'Qualification must derive from temporary session reputation');
assert(deriveGameSessionTotals(correctTemporaryResults).budgetDelta === 300, 'Result panel must retain the temporary per-question budget delta');
assert(correctTemporaryResults[0].leaderboardDelta === 100, 'A first-time correct answer must award 100 leaderboard points');
const repeatedCorrectResult = createResult(1, 'success', 0, true);
assert(
  repeatedCorrectResult.careerXpDelta === 35
    && repeatedCorrectResult.reputationDelta === 4
    && repeatedCorrectResult.budgetDelta === 105,
  'A repeated correct question must use the configured rounded XP, reputation, and budget scales',
);
assert(createResult(1, 'fail', 0, true).reputationDelta === -10, 'A repeated wrong answer must keep its full penalty');
assert(createResult(1, 'timeout', 0, true).reputationDelta === -15, 'A repeated timeout must keep its full penalty');
assert(repeatedCorrectResult.leaderboardDelta === 25, 'A repeated correct answer must award 25 leaderboard points');
assert(createResult(1, 'partial', 0, true).leaderboardDelta === 15, 'A repeated legacy partial answer must award 15 leaderboard points');
assert(createResult(1, 'fail', 0, true).leaderboardDelta === 0, 'A wrong answer must award no leaderboard points');
assert(createResult(1, 'timeout', 0, true).leaderboardDelta === 0, 'A timeout must award no leaderboard points');
assert(!canUseRollbackOnResult(2, correctTemporaryResults[0]), 'A correct answer must not allow Rollback use');
const inventoryBeforeRejectedRollback = 2;
const rejectedRollbackResults = canUseRollbackOnResult(inventoryBeforeRejectedRollback, correctTemporaryResults[0])
  ? removeSessionResult(correctTemporaryResults, 'session-question-1')
  : correctTemporaryResults;
const inventoryAfterRejectedRollback = canUseRollbackOnResult(inventoryBeforeRejectedRollback, correctTemporaryResults[0])
  ? inventoryBeforeRejectedRollback - 1
  : inventoryBeforeRejectedRollback;
assert(rejectedRollbackResults === correctTemporaryResults, 'Pressing Rollback after a correct answer must leave the correct result recorded');
assert(inventoryAfterRejectedRollback === inventoryBeforeRejectedRollback, 'Pressing Rollback after a correct answer must not consume inventory');

let temporaryResults = upsertSessionResult([], createResult(1, 'fail'));
assert(canUseRollbackOnResult(1, temporaryResults[0]), 'A wrong answer must allow Rollback when inventory exists');
assert(!canUseRollbackOnResult(0, temporaryResults[0]), 'Rollback must remain unavailable without inventory');
temporaryResults = removeSessionResult(temporaryResults, 'session-question-1');
assert(deriveGameSessionTotals(temporaryResults).reputationDelta === 0, 'Rollback must remove the temporary result delta');
temporaryResults = upsertSessionResult(temporaryResults, createResult(1, 'fail'));
temporaryResults = upsertSessionResult(temporaryResults, createResult(1, 'success'));
assert(temporaryResults.length === 1, 'Re-answering a reverted question must upsert exactly once');
assert(deriveGameSessionTotals(temporaryResults).reputationDelta === 10, 'Re-answering must count only the final temporary result');
assert(canUseRollbackOnResult(1, createResult(1, 'timeout')), 'A timeout must allow Rollback when inventory exists');
assert(canUseRollbackOnResult(1, createResult(1, 'partial')), 'A legacy partial answer must allow Rollback when inventory exists');
assert(!canUseRollbackOnResult(1, undefined), 'Rollback availability must clear after its result is removed');
assert(formatSessionMetric(475, 'Kariyer XP') === '475 Kariyer XP', 'Positive completion metrics must read without an awkward sign');
assert(formatSessionMetric(-40, 'İtibar') === '40 İtibar kaybı', 'Negative completion reputation must use clear loss wording');
assert(formatSessionMetric(-100, 'Şirket Bütçesi') === '100 Şirket Bütçesi kaybı', 'Negative completion budget must use clear loss wording');

const incompleteResults = Array.from({ length: 9 }, (_, index) => createResult(index + 1, 'success'));
const incompletePermanentState = createPermanentState();
const incompletePlan = planCompletedGameSession({
  permanentState: incompletePermanentState,
  session: {
    categoryId: 'web_programming',
    star: 1,
    checkpointId: 1,
    initialUptimeStreak: 0,
    results: incompleteResults,
  },
});
assert(incompletePlan === null, 'Incomplete manual/browser/mobile abandon must commit nothing');
assert(incompletePermanentState.categoryProgress.web_programming[1].solvedCorrectQuestionIds.length === 0, 'Abandoned sessions must not persist correctly solved question IDs');

const failedResults = Array.from({ length: SESSION_QUESTION_COUNT }, (_, index) => (
  createResult(index + 1, index < 2 ? 'success' : 'fail')
));
const failedPlan = planCompletedGameSession({
  permanentState: createPermanentState(),
  session: {
    categoryId: 'operating_systems',
    star: 1,
    checkpointId: 1,
    initialUptimeStreak: 0,
    results: failedResults,
  },
});
assert(failedPlan, 'A complete failed-checkpoint session must still produce a commit plan');
assert(failedPlan.totals.reputationDelta === -60 && !failedPlan.completion.passed, 'A 2/10 Kolay session must commit its penalties and fail the checkpoint');
assert(failedPlan.permanentState.careerXp > 1_000, 'Completed failed-checkpoint sessions must still commit Career XP');
assert(failedPlan.permanentState.categoryProgress.operating_systems[1].attemptedQuestionIds.length === 10, 'Completed sessions must commit all category attempts once');
assert(failedPlan.permanentState.categoryProgress.web_programming[1].attemptedQuestionIds.length === 0, 'Session commit must remain category-scoped');

const passedResults = Array.from({ length: SESSION_QUESTION_COUNT }, (_, index) => (
  createResult(index + 1, index < 7 ? 'success' : 'fail')
));
const passedPlan = planCompletedGameSession({
  permanentState: createPermanentState(),
  session: {
    categoryId: 'web_programming',
    star: 1,
    checkpointId: 1,
    initialUptimeStreak: 0,
    results: passedResults,
  },
});
assert(passedPlan?.totals.reputationDelta === 40 && passedPlan.completion.passed, 'A complete +40 Kolay session must pass and commit');
assert(passedPlan.permanentState.correctAnswers === 19 && passedPlan.permanentState.wrongAnswers === 11, 'Answer totals must commit once at completion');
assert(passedPlan.permanentState.rankingOutcomeStats.successCount === 7, 'Ranking outcomes must commit once at completion');
assert(passedPlan.permanentState.categoryProgress.web_programming[1].solvedCorrectQuestionIds.length === 7, 'Completed sessions must persist stable IDs only for correctly solved questions');
assert(getTotalCategoryLeaderboardScore(passedPlan.permanentState.categoryProgress) === 700, 'All-time leaderboard progress must use final completed-session result points');

const repeatedCorrectResults = Array.from({ length: SESSION_QUESTION_COUNT }, (_, index) => (
  createResult(index + 1, 'success', index, true)
));
const repeatedCorrectPlan = planCompletedGameSession({
  permanentState: createPermanentState(),
  session: {
    categoryId: 'web_programming',
    star: 1,
    checkpointId: 1,
    initialUptimeStreak: 0,
    results: repeatedCorrectResults,
  },
});
assert(repeatedCorrectPlan?.totals.repeatCorrectCount === 10, 'Completion totals must count repeated correct questions');
assert(
  repeatedCorrectPlan?.totals.careerXpDelta === 350
    && repeatedCorrectPlan.totals.reputationDelta === 40
    && repeatedCorrectPlan.totals.budgetDelta === 1_050,
  'A repeated-correct session must total the scaled per-question rewards',
);
assert(repeatedCorrectPlan.completion.passed, 'Checkpoint qualification must use the scaled +40 session reputation');
assert(repeatedCorrectPlan.totals.leaderboardDelta === 250, 'A repeated-correct session event must total 25 leaderboard points per final result');
assert(getTotalCategoryLeaderboardScore(repeatedCorrectPlan.permanentState.categoryProgress) === 250, 'All-time leaderboard progress must persist the same scaled completed-session total');

let postRollbackResults = Array.from({ length: SESSION_QUESTION_COUNT }, (_, index) => createResult(index + 1, 'success'));
postRollbackResults = removeSessionResult(postRollbackResults, 'session-question-10');
assert(!isCompleteGameSession(postRollbackResults), 'Removing the tenth result with Rollback must make the session incomplete');
postRollbackResults = upsertSessionResult(postRollbackResults, createResult(10, 'fail'));
assert(isCompleteGameSession(postRollbackResults), 'Re-answering after Rollback must restore completion without an eleventh result');
assert(postRollbackResults.length === SESSION_QUESTION_COUNT, 'Rollback and re-answer must not create duplicate session entries');

const onePassedCheckpoint = completeOperationSession(
  createDefaultCategoryProgress(),
  'web_programming',
  1,
  1,
  40,
  '2026-09-02T11:00:00.000Z',
).progress;
const unlockPlan = planCompletedGameSession({
  permanentState: { ...createPermanentState(), categoryProgress: onePassedCheckpoint },
  session: {
    categoryId: 'web_programming',
    star: 1,
    checkpointId: 2,
    initialUptimeStreak: 0,
    results: passedResults,
  },
});
assert(unlockPlan?.completion.newlyUnlockedTier === 2, 'The second passed checkpoint must unlock the next tier');
assert(unlockPlan && isTierUnlocked(unlockPlan.permanentState.categoryProgress, 'web_programming', 2), 'Both passed checkpoints must unlock Orta');

const root = process.cwd();
const gameSource = readFileSync(resolve(root, 'app/(tabs)/game.tsx'), 'utf8');
const playSource = readFileSync(resolve(root, 'app/(tabs)/play.tsx'), 'utf8');
const resultPanelSource = readFileSync(resolve(root, 'src/components/game/GameResultPanel.tsx'), 'utf8');
const abilityButtonSource = readFileSync(resolve(root, 'src/components/game/GameAbilityButton.tsx'), 'utf8');
assert(!/contextActionsRef\.current\.(applyOutcome|recordCategoryQuestionAnswer|recordRankingOutcome|setCorrectAnswers|setWrongAnswers)/.test(gameSource), 'Question handlers must not call permanent mutation APIs');
assert(gameSource.includes('sessionCommittedRef.current = true'), 'Completion must set an exactly-once guard before committing');
assert(gameSource.includes('getRankingScoreForOutcome(choiceOutcome, isRepeatCorrect)'), 'Resolved answers must derive leaderboard points from the shared repeat-aware helper');
const timeoutHandlerSource = gameSource.slice(gameSource.indexOf('const resolveTimeout'), gameSource.indexOf('const startTimer'));
const answerHandlerSource = gameSource.slice(gameSource.indexOf('const handleChoice'), gameSource.indexOf('const handleSelectChoice'));
const completionHandlerSource = gameSource.slice(gameSource.indexOf('const handleCompleteSession'), gameSource.indexOf('const handleNextScenario'));
const nextHandlerSource = gameSource.slice(gameSource.indexOf('const handleNextScenario'), gameSource.indexOf('const handleExit'));
assert(!timeoutHandlerSource.includes('commitResolvedSession(') && !answerHandlerSource.includes('commitResolvedSession('), 'Resolving the tenth answer must leave completion to the CTA');
assert(
  completionHandlerSource.includes('isCompleteGameSession(sessionResultsRef.current)')
    && completionHandlerSource.includes('commitResolvedSession(sessionResultsRef.current)'),
  'The enabled completion CTA must commit the complete ten-result accumulator directly',
);
assert(nextHandlerSource.includes('sessionQuestionIdsRef.current.length >= SESSION_QUESTION_COUNT) return'), 'The next-question handler must never request an eleventh question');
assert((gameSource.match(/commitResolvedSession\(sessionResultsRef\.current\)/g) ?? []).length === 1, 'Only the completion CTA path may request the completed-session commit');
assert(gameSource.includes('isProcessing={isOutcomePending || !isCompletionReady}'), 'The tenth-result CTA must become enabled after the result accumulator is complete');
assert(gameSource.includes('onNext={isFinalQuestion ? handleCompleteSession : handleNextScenario}'), 'The tenth-result CTA must be wired to the dedicated completion handler');
assert(gameSource.includes('&& canUseRollbackOnResult(gitRevert, currentResolvedResult)') && gameSource.includes('const shouldPulseGitRevert = canUseGitRevert;'), 'Rollback use and pulse readiness must both require inventory and reject correct answers');
assert(/id: 'gitRevert'[\s\S]{0,300}enabled: canUseGitRevert/.test(gameSource), 'The Rollback HUD control must use the guarded availability rule');
assert(abilityButtonSource.includes('disabled={!enabled}') && abilityButtonSource.includes('accessibilityState={{ disabled: !enabled }}'), 'Unavailable Rollback must be natively disabled and announced as disabled');
const rollbackHandlerSource = gameSource.slice(gameSource.indexOf('const handleGitRevert'), gameSource.indexOf('const handleSnapshotBackup'));
assert(
  rollbackHandlerSource.indexOf('if (!canUseGitRevert') < rollbackHandlerSource.indexOf('consumeGitRevert()'),
  'Rejected Rollback presses must return before consuming inventory',
);
assert(!gameSource.includes('completeRewardIcon') && !gameSource.includes('ECONOMY_ICON_ASSETS.coin'), 'The combined completion reward summary must not use a misleading coin icon');
assert(gameSource.includes("formatSessionMetric(sessionTotals.reputationDelta, 'İtibar')"), 'The completion reward summary must use clear reputation wording');
assert((gameSource.match(/trackEvent\('session_completed'/g) ?? []).length === 1, 'session_completed must have exactly one guarded emission path');
assert((gameSource.match(/trackEvent\('session_abandoned'/g) ?? []).length === 1, 'session_abandoned must have exactly one guarded emission path');
assert(gameSource.includes('sessionAbandonedRef.current || sessionCommittedRef.current'), 'Abandon telemetry must be guarded against duplicate or completed sessions');
assert(gameSource.includes("completion.passed ? 'checkpoint_passed' : 'checkpoint_failed'"), 'Checkpoint telemetry must live on the completion path');
assert(gameSource.includes("window.addEventListener('beforeunload'"), 'Incomplete desktop sessions must install beforeunload protection');
assert(gameSource.includes("AppState.addEventListener('change'"), 'Mobile backgrounding must abandon the temporary session without a popup');
assert(!gameSource.includes('rewardLabel=') && !gameSource.includes('OTURUM ETKİSİ'), 'Simplified result panel must not restore the removed session-impact label');
assert(!resultPanelSource.includes('ETKİ') && !resultPanelSource.includes('operationImpact'), 'Text-heavy operation impact copy must be removed');
assert(!resultPanelSource.includes('result.subtitle'), 'Result subtitles must be removed');
assert(resultPanelSource.includes('Tekrar soru · azaltılmış ödül'), 'Correct repeat results must show the compact reduced-reward label');
assert(gameSource.includes('Bu oturumda tekrar sorular azaltılmış ödülle sayıldı.'), 'Completion must explain when repeated questions affected rewards');
assert(playSource.includes("trackEvent('locked_tier_tapped'"), 'Locked tier taps must emit telemetry');
assert(playSource.includes('showLockedTierFeedback(category.id, tier.star'), 'Locked tier taps must show feedback instead of navigating');
assert(playSource.includes('source={UI_ICON_ASSETS.info}'), 'The repeat-reward explanation must use the shared info asset');
assert(playSource.includes('Tekrar soru ödülleri hakkında bilgi'), 'The repeat-reward info trigger must have an accessible label');
assert(playSource.includes('Tekrar soru ödülleri</Text>'), 'The user-triggered popup must have the requested title');
assert(
  playSource.includes('Daha önce doğru çözdüğün sorular tekrar geldiğinde oynanabilir kalır, ancak Kariyer XP, İtibar ve Şirket Bütçesi ödülleri azaltılır.'),
  'The popup must explain which rewards are reduced',
);
assert(playSource.includes('Yıldız kademesi hedefleri de bu azaltılmış İtibar değerleriyle hesaplanır.'), 'The popup must explain scaled checkpoint qualification');
assert(playSource.includes('Sıralama puanı da tekrar doğru cevaplarda azaltılır.'), 'The repeat-reward popup must explain scaled leaderboard points');
assert(playSource.includes('<Text style={styles.infoModalActionText}>Anladım</Text>'), 'The popup must provide the requested acknowledgement action');

console.log('Session-end commit invariants passed.');
