import { strict as assert } from 'node:assert';
import { getCategoryReward } from '../src/config/categoryRewards';
import { SESSION_QUESTION_COUNT } from '../src/config/gameCategories';
import { getCosmeticById, planCosmeticPurchase } from '../src/config/cosmetics';
import { getJokerPrice, planJokerPurchase } from '../src/config/jokerEconomy';
import { calculateProgressionOutcome } from '../src/config/progression';
import { planBadgeRewardGrants } from '../src/utils/badgeRewards';
import { clampBudget } from '../src/utils/budget';
import { createDefaultCategoryProgress } from '../src/utils/categoryProgress';
import { formatBudget, formatSessionMetric } from '../src/utils/format';
import { planCompletedGameSession, type GameSessionResult } from '../src/utils/gameSession';
import { buildLegacyPlayerSave, buildPlayerSaveSnapshot, createDefaultJokerInventory, normalizePlayerSave } from '../src/utils/playerSave';
import { normalizeRankingOutcomeStats } from '../src/utils/ranking';

for (const outcome of ['fail', 'timeout'] as const) {
  const reward = getCategoryReward(1, outcome);
  assert(reward.budgetDelta < 0, 'Budget penalties must remain negative');
  const results: GameSessionResult[] = Array.from({ length: SESSION_QUESTION_COUNT }, (_, index) => ({
    questionId: `budget-question-${index}`,
    questionIndex: index,
    questionTitle: 'Budget regression fixture',
    selectedAnswer: null,
    correctAnswer: 'Correct',
    outcome,
    isCorrect: false,
    isRepeatCorrect: false,
    ...reward,
    milestoneBudgetDelta: 0,
    leaderboardDelta: 0,
    uptimeBefore: 0,
    uptimeAfter: 0,
    resolvedAt: '2026-09-15T00:00:00.000Z',
  }));
  for (const initialBudget of [-500, 0, 50]) {
    const plan = planCompletedGameSession({
      permanentState: {
        careerXp: 1_000,
        reputation: 500,
        budget: initialBudget,
        correctAnswers: 0,
        wrongAnswers: 0,
        completedSessions: 0,
        rankingOutcomeStats: normalizeRankingOutcomeStats(null),
        categoryProgress: createDefaultCategoryProgress(),
        uptimeStreak: 0,
      },
      session: { categoryId: 'web_programming', star: 1, checkpointId: 1, initialUptimeStreak: 0, results },
    });
    assert(plan);
    assert.equal(plan.permanentState.budget, 0);
    assert.equal(plan.totals.budgetDelta, SESSION_QUESTION_COUNT * reward.budgetDelta);
    let expected = { careerXp: 1_000, reputation: 500 };
    for (const result of results) {
      expected = calculateProgressionOutcome(expected.careerXp, expected.reputation, result.careerXpDelta, result.reputationDelta);
    }
    assert.equal(plan.permanentState.careerXp, expected.careerXp);
    assert.equal(plan.permanentState.reputation, expected.reputation);
    const snapshot = buildPlayerSaveSnapshot({
      careerXp: plan.permanentState.careerXp,
      reputation: plan.permanentState.reputation,
      companyBudget: plan.permanentState.budget,
    });
    assert.equal(normalizePlayerSave(JSON.parse(JSON.stringify(snapshot))).companyBudget, 0);
  }
}

assert.equal(clampBudget(-1), 0);
assert.equal(clampBudget(12.5), 12.5);
assert.equal(formatBudget(-500), '0');
assert.equal(formatBudget(1_000), '1.000');
assert.equal(formatSessionMetric(-150, 'Şirket Bütçesi'), '150 Şirket Bütçesi kaybı');
assert.equal(normalizePlayerSave({ companyBudget: '-500' }).companyBudget, 0);
assert.equal(buildLegacyPlayerSave({ '@shipit_budget': '-500' }).companyBudget, 0);
assert.equal(buildPlayerSaveSnapshot({ companyBudget: -500 }).companyBudget, 0);

const grant = (budget: number) => planBadgeRewardGrants({
  budget,
  badges: [{ id: 'first_correct', earned: true, budgetReward: 300 }],
  claimedBadgeRewardIds: [],
  unseenBadgeIds: [],
});
assert.equal(grant(-1_000).budget, 0, 'Outcome updates must clamp after badge rewards');
assert.equal(grant(0).budget, 300);
assert.equal(grant(-1_000).budgetRewardTotal, 300, 'Badge reward values must stay unchanged');

const inventory = createDefaultJokerInventory();
const jokerPrice = getJokerPrice('codeReview', 'junior');
assert.equal(planJokerPurchase(0, inventory, 'codeReview', 'junior').status, 'insufficient_funds');
assert.equal(planJokerPurchase(jokerPrice - 1, inventory, 'codeReview', 'junior').status, 'insufficient_funds');
const jokerPurchase = planJokerPurchase(jokerPrice, inventory, 'codeReview', 'junior');
assert.equal(jokerPurchase.status, 'ok');
if (jokerPurchase.status === 'ok') assert.equal(jokerPurchase.budget, 0);
const cosmetic = getCosmeticById('avatar_terminal');
assert.equal(planCosmeticPurchase(0, [], cosmetic.id).status, 'insufficient_funds');
assert.equal(planCosmeticPurchase(cosmetic.price - 1, [], cosmetic.id).status, 'insufficient_funds');
const cosmeticPurchase = planCosmeticPurchase(cosmetic.price, [], cosmetic.id);
assert.equal(cosmeticPurchase.status, 'ok');
if (cosmeticPurchase.status === 'ok') assert.equal(cosmeticPurchase.budget, 0);

console.log('Budget clamp invariants passed.');
