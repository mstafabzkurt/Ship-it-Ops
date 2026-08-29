import { getCategoryChoiceOutcome, getCategoryReward } from '../src/config/categoryRewards';
import { DIFFICULTY_STARS, GAME_CATEGORIES, QUESTIONS_PER_TIER } from '../src/config/gameCategories';
import { getJokerPrice, planJokerPurchase, type JokerInventory } from '../src/config/jokerEconomy';
import { RANKS } from '../src/config/progression';
import {
  createDefaultCategoryProgress,
  getTierAttemptedCount,
  isTierUnlocked,
  normalizeCategoryProgress,
  recordCategoryAttempt,
  selectCategoryQuestion,
} from '../src/utils/categoryProgress';
import { isValidCategoryQuestion, type CategoryQuestionRow } from '../src/utils/categoryQuestions';
import { calculateRankingScore } from '../src/utils/ranking';

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
assert(isTierUnlocked(progress, 'web_programming', 2), 'Star 2 must unlock after 20 unique attempts');
progress = recordCategoryAttempt(progress, 'web_programming', 1, 20, true);
assert(getTierAttemptedCount(progress, 'web_programming', 1) === 20, 'Replay must not inflate unique progress');

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
