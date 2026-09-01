import { getCategoryChoiceOutcome, getCategoryReward } from '../src/config/categoryRewards';
import { ACHIEVEMENTS } from '../src/config/achievements';
import { DIFFICULTY_STARS, GAME_CATEGORIES, QUESTIONS_PER_TIER } from '../src/config/gameCategories';
import { getOperationImpact } from '../src/config/operationImpact';
import { getJokerPrice, planJokerPurchase, type JokerInventory } from '../src/config/jokerEconomy';
import { RANKS } from '../src/config/progression';
import {
  completeOperationSession,
  createDefaultCategoryProgress,
  formatSignedReputation,
  getCategoryAttemptedCount,
  getCategoryPassedOperationCount,
  getCurrentOperationCheckpoint,
  getOperationReputationProgress,
  getOperationReputationTarget,
  getPassedOperationCount,
  getTierAttemptedCount,
  isTierUnlocked,
  normalizeCategoryProgress,
  recordCategoryAttempt,
  revertCategoryAttemptOutcome,
  selectCategoryQuestion,
} from '../src/utils/categoryProgress';
import { deriveAchievements } from '../src/utils/achievements';
import { isValidCategoryQuestion, type CategoryQuestionRow } from '../src/utils/categoryQuestions';
import { calculateRankingScore, recordRankingOutcome, revertRankingOutcome } from '../src/utils/ranking';
import { deriveSessionReputation, removeSessionResult, upsertSessionResult } from '../src/utils/sessionReputation';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const expectedRewards = {
  1: { success: [100, 10, 300], fail: [25, -10, -100], timeout: [15, -15, -150] },
  2: { success: [125, 12, 400], fail: [30, -10, -125], timeout: [20, -15, -175] },
  3: { success: [150, 15, 500], fail: [35, -10, -150], timeout: [25, -15, -200] },
} as const;

for (const star of [1, 2, 3] as const) {
  for (const outcome of ['success', 'fail', 'timeout'] as const) {
    const reward = getCategoryReward(star, outcome);
    const expected = expectedRewards[star][outcome];
    assert(reward.careerXpDelta === expected[0], `Star ${star} ${outcome} XP mismatch`);
    assert(reward.reputationDelta === expected[1], `Star ${star} ${outcome} reputation mismatch`);
    assert(reward.budgetDelta === expected[2], `Star ${star} ${outcome} budget mismatch`);
  }
}

assert(getCategoryChoiceOutcome('optimal') === 'success', 'optimal_text must resolve success');
assert(getCategoryChoiceOutcome('acceptable') === 'fail', 'acceptable_text must be a fail distractor');
assert(getCategoryChoiceOutcome('wrong') === 'fail', 'wrong_text must resolve fail');
assert(getCategoryChoiceOutcome('fatal') === 'fail', 'fatal_text must resolve fail');

assert(
  GAME_CATEGORIES.map((category) => category.id).join(',') === 'web_programming,operating_systems,database_systems',
  'Active category IDs must match the Phase 7 catalog',
);
const databaseCategory = GAME_CATEGORIES.find((category) => category.id === 'database_systems');
assert(databaseCategory?.name === 'Veritabanı Sistemleri', 'Database category label mismatch');
assert(DIFFICULTY_STARS.length === 3, 'Database category must use the shared three-star ladder');
assert(
  GAME_CATEGORIES.map((category) => category.operation.title).join(',') === 'Client & API Desk,Runtime Stability Desk,Data Integrity Desk',
  'Each active category must expose its operation desk identity',
);
assert(
  GAME_CATEGORIES.every((category) => ['success', 'partial', 'fail', 'timeout'].every((tone) => (
    category.operation.impact[tone as keyof typeof category.operation.impact].length > 0
  ))),
  'Each operation desk must define impact copy for every result tone',
);
assert(
  GAME_CATEGORIES.map((category) => category.operation.activeSubtitle).join(',')
    === 'İstemci ve web arayüzü kararı,Süreç ve kaynak yönetimi kararı,Veri ve sorgu hattı kararı',
  'Each operation desk must expose compact active gameplay copy',
);

const impactCases = [
  {
    categoryId: 'web_programming',
    tag: 'HTML',
    title: 'Bir tablo hücresinde colspan hangi davranışı sağlar?',
    resultStatus: 'fail',
    expected: 'Yanlış seçim, tablo düzeninin beklenen sütun/satır yapısını bozabilir.',
  },
  {
    categoryId: 'web_programming',
    tag: 'HTML',
    title: '<a href="/docs" target="_blank"> bağlantısı nasıl açılır?',
    resultStatus: 'success',
    expected: 'Doğru seçim, bağlantının hedef davranışını netleştirdi.',
  },
  {
    categoryId: 'web_programming',
    tag: 'HTTP',
    title: '404 durum kodu neyi ifade eder?',
    resultStatus: 'timeout',
    expected: 'Karar gecikti; HTTP cevabı için güvenli seçim yapılamadı.',
  },
  {
    categoryId: 'web_programming',
    tag: 'Oturum',
    title: 'Cookie ile session ilişkisi nedir?',
    resultStatus: 'partial',
    expected: 'Kısmi karar oturum akışını tamamen güvenceye almadı.',
  },
  {
    categoryId: 'web_programming',
    tag: 'CSS',
    title: 'Hover selector hangi durumda uygulanır?',
    resultStatus: 'success',
    expected: 'Doğru seçim, arayüz stilinin beklenen şekilde uygulanmasını sağladı.',
  },
  {
    categoryId: 'web_programming',
    tag: 'Servlet/JSP',
    title: 'RequestDispatcher forward işlemi ne yapar?',
    resultStatus: 'fail',
    expected: 'Yanlış karar, istek yönlendirme veya sunucu cevabında hatalı akış oluşturabilir.',
  },
  {
    categoryId: 'operating_systems',
    tag: 'Process',
    title: 'Context switch sırasında hangi süreç durumu değişir?',
    resultStatus: 'success',
    expected: 'Doğru karar, süreç/iş parçacığı yönetimini dengede tuttu.',
  },
  {
    categoryId: 'operating_systems',
    tag: 'Memory',
    title: 'Bellekte virtual paging nasıl çalışır?',
    resultStatus: 'fail',
    expected: 'Yanlış karar, bellek kullanımı veya adresleme tarafında sorun oluşturabilir.',
  },
  {
    categoryId: 'operating_systems',
    tag: 'Synchronization',
    title: 'Mutex hangi race riskini azaltır?',
    resultStatus: 'timeout',
    expected: 'Karar gecikti; eşzamanlı çalışma riski belirsiz kaldı.',
  },
  {
    categoryId: 'operating_systems',
    tag: 'Scheduling',
    title: 'Round Robin CPU zamanlaması nasıl çalışır?',
    resultStatus: 'partial',
    expected: 'Kısmi karar zamanlama davranışını tamamen netleştirmedi.',
  },
  {
    categoryId: 'database_systems',
    tag: 'SQL',
    title: 'SELECT sorgusunda WHERE neyi filtreler?',
    resultStatus: 'success',
    expected: 'Doğru karar, sorgu sonucunu beklenen veriyle hizaladı.',
  },
  {
    categoryId: 'database_systems',
    tag: 'Index',
    title: 'Clustered index sorgu maliyetini nasıl etkiler?',
    resultStatus: 'fail',
    expected: 'Yanlış karar, sorgu maliyetini artırabilir veya erişim yolunu bozabilir.',
  },
  {
    categoryId: 'database_systems',
    tag: 'Normalization',
    title: '3NF hangi bağımlılık sorununu giderir?',
    resultStatus: 'timeout',
    expected: 'Karar gecikti; veri modeli için güvenli seçim yapılamadı.',
  },
  {
    categoryId: 'database_systems',
    tag: 'Transaction',
    title: 'ROLLBACK veri bütünlüğünü nasıl korur?',
    resultStatus: 'partial',
    expected: 'Kısmi karar veri bütünlüğünü tamamen garanti etmedi.',
  },
] as const;

for (const impactCase of impactCases) {
  assert(getOperationImpact(impactCase) === impactCase.expected, `Operation impact mismatch for ${impactCase.title}`);
}

assert(
  getOperationImpact({
    categoryId: 'database_systems',
    tag: null,
    title: undefined,
    resultStatus: 'fail',
  }) === databaseCategory?.operation.impact.fail,
  'Missing impact metadata must safely use the category fallback',
);

assert(getJokerPrice('serverScaleUp', 'junior') === 200, 'Junior Scale Up price mismatch');
assert(getJokerPrice('codeReview', 'engineer') === 300, 'Engineer Code Review price mismatch');
assert(getJokerPrice('snapshotBackup', 'senior') === 420, 'Senior Snapshot price mismatch');
assert(getJokerPrice('gitRevert', 'cto') === 880, 'CTO Git Revert price mismatch');

const inventory: JokerInventory = { serverScaleUp: 0, codeReview: 0, snapshotBackup: 0, gitRevert: 0 };
const purchase = planJokerPurchase(1_000, inventory, 'gitRevert', 'cto');
assert(purchase.status === 'ok' && purchase.budget === 120 && purchase.inventory.gitRevert === 1, 'Purchase must use displayed rank price');

assert(
  RANKS.map((rank) => rank.threshold).join(',') === '0,500,1200,2000,3200,4800,7000,9500,12500,16000,20000,24500,29500,35000,41000,47500,54500,62000,70000,79000,89000',
  'Career threshold table mismatch',
);

let progress = createDefaultCategoryProgress();
assert(isTierUnlocked(progress, 'web_programming', 1), 'Star 1 must start unlocked');
assert(!isTierUnlocked(progress, 'web_programming', 2), 'Star 2 must start locked');
for (let id = 1; id <= QUESTIONS_PER_TIER; id += 1) {
  progress = recordCategoryAttempt(progress, 'web_programming', 1, id, id % 2 === 0);
}
assert(getTierAttemptedCount(progress, 'web_programming', 1) === 20, 'Unique attempted count must reach 20');
assert(getCategoryAttemptedCount(progress, 'web_programming') === 20, 'Category progress must sum the three tier counts');
assert(!isTierUnlocked(progress, 'web_programming', 2), 'Star 2 must remain locked when only attempts exist');
progress = recordCategoryAttempt(progress, 'web_programming', 1, 20, true);
assert(getTierAttemptedCount(progress, 'web_programming', 1) === 20, 'Replay must not inflate unique progress');

assert(getOperationReputationTarget(1) === 40, 'Kolay operation target must be +40');
assert(getOperationReputationTarget(2) === 50, 'Orta operation target must be +50');
assert(getOperationReputationTarget(3) === 60, 'Zor mastery operation target must be +60');

const getSessionNet = (star: 1 | 2 | 3, correct: number, wrong: number, timeout = 0) => (
  correct * getCategoryReward(star, 'success').reputationDelta
  + wrong * getCategoryReward(star, 'fail').reputationDelta
  + timeout * getCategoryReward(star, 'timeout').reputationDelta
);
assert(getSessionNet(1, 2, 0) === 20 && getOperationReputationProgress(20, 40) === 0.5, 'Two Kolay correct answers must show half of the +40 target');
assert(getSessionNet(1, 7, 3) === 40, 'Seven Kolay correct and three wrong answers must reach +40');
assert(getSessionNet(1, 6, 4) === 20, 'Six Kolay correct and four wrong answers must miss +40');
assert(getSessionNet(2, 7, 3) === 54, 'Seven Orta correct and three wrong answers must pass +50');
assert(getSessionNet(3, 6, 4) === 50, 'Six Zor correct and four wrong answers must miss +60');
assert(getSessionNet(3, 7, 3) === 75, 'Seven Zor correct and three wrong answers must pass +60');

type TestSessionResult = { questionId: number; reputationDelta: number };
let sessionResults: TestSessionResult[] = [];
sessionResults = upsertSessionResult(sessionResults, { questionId: 1, reputationDelta: 10 });
sessionResults = upsertSessionResult(sessionResults, { questionId: 2, reputationDelta: 10 });
sessionResults = upsertSessionResult(sessionResults, { questionId: 3, reputationDelta: -10 });
assert(deriveSessionReputation(sessionResults) === 10, 'A wrong answer must reduce derived session reputation');
sessionResults = removeSessionResult(sessionResults, 3);
assert(deriveSessionReputation(sessionResults) === 20, 'Git Revert must remove a wrong answer penalty');
sessionResults = upsertSessionResult(sessionResults, { questionId: 3, reputationDelta: 10 });
assert(deriveSessionReputation(sessionResults) === 30, 'Re-answering after Git Revert must apply the replacement result once');
sessionResults = upsertSessionResult(sessionResults, { questionId: 3, reputationDelta: 10 });
assert(deriveSessionReputation(sessionResults) === 30, 'Upserting the same resolved question must not double-count reputation');
sessionResults = removeSessionResult(sessionResults, 3);
assert(deriveSessionReputation(sessionResults) === 20, 'Git Revert must also remove a correct answer reward');
sessionResults = upsertSessionResult(sessionResults, { questionId: 3, reputationDelta: -15 });
assert(deriveSessionReputation(sessionResults) === 5, 'A timeout must apply its exact session penalty');
sessionResults = removeSessionResult(sessionResults, 3);
assert(deriveSessionReputation(sessionResults) === 20, 'Git Revert must restore a reverted timeout penalty');
const correctedPostRevertCompletion = completeOperationSession(
  createDefaultCategoryProgress(),
  'web_programming',
  1,
  1,
  deriveSessionReputation(sessionResults),
  '2026-09-01T07:50:00.000Z',
);
assert(!correctedPostRevertCompletion.passed && correctedPostRevertCompletion.progress.web_programming[1].operationCheckpoints[1].bestReputation === 20, 'Checkpoint completion must use corrected post-revert session reputation');

let revertedAnswerProgress = recordCategoryAttempt(createDefaultCategoryProgress(), 'web_programming', 1, 'reverted-question', true);
revertedAnswerProgress = revertCategoryAttemptOutcome(revertedAnswerProgress, 'web_programming', 1, true);
assert(getTierAttemptedCount(revertedAnswerProgress, 'web_programming', 1) === 1, 'Git Revert must keep the question visible as attempted');
assert(revertedAnswerProgress.web_programming[1].correctCount === 0, 'Git Revert must remove the reverted category answer result');
const emptyRankingStats = { successCount: 0, partialCount: 0, failCount: 0, timeoutCount: 0, legacyPositiveCount: 0 };
for (const outcome of ['success', 'partial', 'fail', 'timeout'] as const) {
  const rankingAfterAnswer = recordRankingOutcome(emptyRankingStats, outcome);
  const rankingAfterRevert = revertRankingOutcome(rankingAfterAnswer, outcome);
  assert(
    JSON.stringify(rankingAfterRevert) === JSON.stringify(emptyRankingStats),
    `Git Revert must remove the reverted ${outcome} ranking outcome`,
  );
}

assert(getCurrentOperationCheckpoint(progress, 'web_programming', 1) === 1, 'First unpassed session must target Operation 1');

let completion = completeOperationSession(progress, 'web_programming', 1, 1, -60, '2026-09-01T08:00:00.000Z');
progress = completion.progress;
assert(!completion.passed && progress.web_programming[1].operationCheckpoints[1].bestReputation === -60, 'Failed checkpoint must retain a negative best result');
completion = completeOperationSession(progress, 'web_programming', 1, 1, 20, '2026-09-01T08:10:00.000Z');
progress = completion.progress;
assert(!completion.passed && progress.web_programming[1].operationCheckpoints[1].bestReputation === 20, 'A +20 Kolay retry must improve best reputation but still fail');
completion = completeOperationSession(progress, 'web_programming', 1, 1, 10, '2026-09-01T08:15:00.000Z');
progress = completion.progress;
assert(progress.web_programming[1].operationCheckpoints[1].bestReputation === 20, 'bestReputation must update only when the retry score is higher');
completion = completeOperationSession(progress, 'web_programming', 1, 1, 40, '2026-09-01T08:20:00.000Z');
progress = completion.progress;
assert(completion.passed && getPassedOperationCount(progress, 'web_programming', 1) === 1, 'One Kolay checkpoint must pass at +40');
assert(!isTierUnlocked(progress, 'web_programming', 2), 'One Kolay checkpoint must not unlock Orta');
assert(getCurrentOperationCheckpoint(progress, 'web_programming', 1) === 2, 'After Operation 1 passes, the next session must target Operation 2');

completion = completeOperationSession(progress, 'web_programming', 1, 1, -10, '2026-09-01T08:30:00.000Z');
progress = completion.progress;
assert(progress.web_programming[1].operationCheckpoints[1].passed, 'A passed checkpoint must not become unpassed after a worse replay');
assert(progress.web_programming[1].operationCheckpoints[1].bestReputation === 40, 'A worse replay must not lower best reputation');

completion = completeOperationSession(progress, 'web_programming', 1, 2, 40, '2026-09-01T08:40:00.000Z');
progress = completion.progress;
assert(isTierUnlocked(progress, 'web_programming', 2), 'Both Kolay checkpoints at or above +40 must unlock Orta');
assert(completion.newlyUnlockedTier === 2, 'The completion that passes Kolay Operation 2 must report the Orta unlock');
assert(getCurrentOperationCheckpoint(progress, 'web_programming', 1) === null, 'A fully qualified tier must replay without assigning another checkpoint');

for (let id = 1; id <= QUESTIONS_PER_TIER; id += 1) {
  progress = recordCategoryAttempt(progress, 'web_programming', 2, `medium-${id}`, true);
}
assert(getTierAttemptedCount(progress, 'web_programming', 2) === 20, 'Orta attempts must remain independently visible');
assert(!isTierUnlocked(progress, 'web_programming', 3), 'Zor must remain locked when Orta only has attempts');
completion = completeOperationSession(progress, 'web_programming', 2, 1, 32, '2026-09-01T09:00:00.000Z');
progress = completion.progress;
assert(!completion.passed && !isTierUnlocked(progress, 'web_programming', 3), 'An Orta score below +50 must fail');
completion = completeOperationSession(progress, 'web_programming', 2, 1, 54, '2026-09-01T09:10:00.000Z');
progress = completion.progress;
assert(!isTierUnlocked(progress, 'web_programming', 3), 'One passed Orta checkpoint must not unlock Zor');
completion = completeOperationSession(progress, 'web_programming', 2, 2, 50, '2026-09-01T09:20:00.000Z');
progress = completion.progress;
assert(isTierUnlocked(progress, 'web_programming', 3), 'Both Orta checkpoints at or above +50 must unlock Zor');

const legacyAttemptProgress = normalizeCategoryProgress({
  web_programming: {
    1: { attemptedQuestionIds: Array.from({ length: 20 }, (_, index) => `legacy-${index}`), correctCount: 20, incorrectCount: 0 },
  },
});
assert(getTierAttemptedCount(legacyAttemptProgress, 'web_programming', 1) === 20, 'Old saves must preserve attempted progress');
assert(!isTierUnlocked(legacyAttemptProgress, 'web_programming', 2), 'Missing legacy checkpoint data must not unlock Orta');
const restoredCheckpointProgress = normalizeCategoryProgress({
  web_programming: {
    1: {
      attemptedQuestionIds: [],
      correctCount: 0,
      incorrectCount: 0,
      operationCheckpoints: {
        1: { bestReputation: 25, passed: true, attempted: true, completedAt: '2026-09-01T08:40:00.000Z' },
        2: { bestReputation: -10, passed: false, attempted: true },
      },
    },
  },
});
assert(restoredCheckpointProgress.web_programming[1].operationCheckpoints[1].passed, 'Passed checkpoint state must survive save normalization');
assert(restoredCheckpointProgress.web_programming[1].operationCheckpoints[1].bestReputation === 25, 'Grandfathered pass state must not rewrite its historical best reputation');
assert(restoredCheckpointProgress.web_programming[1].operationCheckpoints[2].bestReputation === -10, 'Failed checkpoint best reputation must survive save normalization');
assert(getOperationReputationProgress(-60, 40) === 0, 'Negative session reputation must clamp visual progress to zero');
assert(formatSignedReputation(-60) === '-60', 'Negative session reputation text must preserve its sign');
assert(getOperationReputationProgress(75, 60) === 1, 'Session reputation above target must clamp visual progress to one');

assert(ACHIEVEMENTS.length === 19, 'B2 visible achievement catalog must contain 19 badges');
assert(new Set(ACHIEVEMENTS.map((achievement) => achievement.id)).size === ACHIEVEMENTS.length, 'Achievement IDs must be unique');
assert(
  ACHIEVEMENTS.every((achievement) => /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(achievement.id)),
  'Achievement IDs must use stable English snake_case',
);
assert(
  ACHIEVEMENTS.every((achievement) => !/kriz|vardiya|operasyon|incident|müdahale/i.test(`${achievement.title} ${achievement.description}`)),
  'Visible achievement copy must use the current question/session terminology',
);

let achievementProgress = progress;
let derivedAchievements = deriveAchievements({
  careerXp: 0,
  correctAnswers: 10,
  wrongAnswers: 0,
  categoryProgress: achievementProgress,
});
assert(derivedAchievements.find((badge) => badge.id === 'first_session')?.earned, 'Ten answers must earn İlk Oturum');
assert(derivedAchievements.find((badge) => badge.id === 'first_correct')?.earned, 'A correct answer must earn İlk Doğru');
assert(derivedAchievements.find((badge) => badge.id === 'web_easy_complete')?.earned, 'Web Kolay 20/20 must earn Web Temeli');
assert(derivedAchievements.find((badge) => badge.id === 'first_medium_unlock')?.earned, 'Two passed Kolay operations must earn Orta Kademe');
assert(getCategoryPassedOperationCount(achievementProgress, 'web_programming') === 4, 'Kolay and Orta qualification must count as 4/6 operations');
assert(derivedAchievements.find((badge) => badge.id === 'web_mastery')?.progressText === '4/6 operasyon geçti', 'Category mastery progress must count passed operations');
assert(!derivedAchievements.find((badge) => badge.id === 'web_mastery')?.earned, 'Attempts alone in Zor must not earn mastery');

for (const star of [2, 3] as const) {
  for (let id = 1; id <= QUESTIONS_PER_TIER; id += 1) {
    achievementProgress = recordCategoryAttempt(achievementProgress, 'web_programming', star, `web-${star}-${id}`, true);
  }
}
completion = completeOperationSession(achievementProgress, 'web_programming', 3, 1, 50, '2026-09-01T10:00:00.000Z');
achievementProgress = completion.progress;
assert(!completion.passed && !completion.masteryCompleted, 'A +50 Zor result must fail the +60 mastery target');
completion = completeOperationSession(achievementProgress, 'web_programming', 3, 1, 75, '2026-09-01T10:05:00.000Z');
achievementProgress = completion.progress;
assert(completion.passed && !completion.masteryCompleted, 'One +75 Zor mastery checkpoint must pass without completing category mastery');
completion = completeOperationSession(achievementProgress, 'web_programming', 3, 2, 60, '2026-09-01T10:10:00.000Z');
achievementProgress = completion.progress;
assert(completion.masteryCompleted, 'Both Zor checkpoints at or above +60 must complete mastery qualification');
derivedAchievements = deriveAchievements({
  careerXp: 0,
  correctAnswers: 50,
  wrongAnswers: 10,
  categoryProgress: achievementProgress,
});
assert(getCategoryAttemptedCount(achievementProgress, 'web_programming') === 60, 'Web category progress must reach 60/60');
assert(derivedAchievements.find((badge) => badge.id === 'web_mastery')?.earned, 'All six checkpoints must earn Web Hakimiyeti');
assert(derivedAchievements.find((badge) => badge.id === 'first_hard_unlock')?.earned, 'Two passed Orta operations must earn Zor Kademe');
assert(!derivedAchievements.find((badge) => badge.id === 'full_coverage')?.earned, 'One mastered category must not earn Tam Kapsama');

const questions = Array.from({ length: 20 }, (_, index) => ({ id: index + 1 }));
const selected = selectCategoryQuestion(questions, [1, 2], Array.from({ length: 19 }, (_, index) => index + 1), () => 0);
assert(selected?.id === 20, 'Selection must prefer the last unseen question');
assert(selectCategoryQuestion(questions, questions.map((question) => question.id), [], () => 0) === null, 'Session must not repeat a question');

const uuidQuestions = Array.from({ length: 20 }, (_, index) => ({ id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}` }));
const uuidSessionIds: string[] = [];
while (uuidSessionIds.length < 10) {
  const next = selectCategoryQuestion(uuidQuestions, uuidSessionIds, [], () => 0);
  assert(next, 'UUID session must supply 10 questions');
  uuidSessionIds.push(next.id);
}
assert(uuidSessionIds.length === 10 && new Set(uuidSessionIds).size === 10, 'UUID session must contain 10 unique questions');

const normalizedUuidProgress = normalizeCategoryProgress({
  operating_systems: {
    1: { attemptedQuestionIds: uuidSessionIds, correctCount: 4, incorrectCount: 6 },
  },
});
assert(normalizedUuidProgress.operating_systems[1].attemptedQuestionIds.length === 10, 'UUID attempts must survive save normalization');

const validQuestion: CategoryQuestionRow = {
  id: '1edaf37e-f968-4b17-8bf1-f07792ff073b',
  rank_level: null,
  category_id: 'web_programming',
  difficulty_star: 1,
  tag: 'HTTP',
  title: 'Doğru durum kodu hangisidir?',
  optimal_text: '200',
  acceptable_text: '201',
  wrong_text: '404',
  fatal_text: '500',
};
assert(isValidCategoryQuestion(validQuestion, 'web_programming', 1), 'Exactly four distinct choices must be accepted');
assert(isValidCategoryQuestion({ ...validQuestion, id: 42 }, 'web_programming', 1), 'Legacy numeric IDs must remain accepted');
assert(!isValidCategoryQuestion({ ...validQuestion, category_id: null }, 'web_programming', 1), 'Legacy rows must be excluded');
assert(!isValidCategoryQuestion({ ...validQuestion, wrong_text: '200' }, 'web_programming', 1), 'Duplicate choices must be rejected');

const databaseStarOneRows: CategoryQuestionRow[] = Array.from({ length: QUESTIONS_PER_TIER }, (_, index) => ({
  ...validQuestion,
  id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  category_id: 'database_systems',
  difficulty_star: 1,
  rank_level: 1,
  tag: 'Veritabanı Sistemleri',
  title: `Veritabanı sorusu ${index + 1}`,
  optimal_text: `Doğru ${index + 1}`,
  acceptable_text: `Çeldirici A ${index + 1}`,
  wrong_text: `Çeldirici B ${index + 1}`,
  fatal_text: `Çeldirici C ${index + 1}`,
}));
assert(
  databaseStarOneRows.filter((row) => isValidCategoryQuestion(row, 'database_systems', 1)).length === QUESTIONS_PER_TIER,
  'Database star content must count through the shared validator',
);

const normalizedRemovedCategoryProgress = normalizeCategoryProgress({
  system_programming: {
    1: { attemptedQuestionIds: ['legacy-system-question'], correctCount: 1, incorrectCount: 0 },
  },
});
assert(
  !Object.prototype.hasOwnProperty.call(normalizedRemovedCategoryProgress, 'system_programming'),
  'Removed category progress must be ignored safely',
);
assert(
  normalizedRemovedCategoryProgress.database_systems[1].attemptedQuestionIds.length === 0,
  'Database progress must start at zero instead of inheriting removed category progress',
);

assert(calculateRankingScore({ successCount: 2, partialCount: 1, failCount: 8, timeoutCount: 9, legacyPositiveCount: 0 }) === 250, 'Leaderboard scoring must remain 100/50/0/0');

console.log('Phase 7 focused invariants passed.');
