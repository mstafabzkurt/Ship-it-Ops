import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  REPEAT_QUESTION_REWARD_SCALE,
  getCategoryChoiceOutcome,
  getCategoryReward,
} from '../src/config/categoryRewards';
import { ACHIEVEMENTS } from '../src/config/achievements';
import {
  DIFFICULTY_STARS,
  GAME_CATEGORIES,
  QUESTIONS_PER_TIER,
  buildGameSessionRoute,
  resolveGameCategoryId,
} from '../src/config/gameCategories';
import { getOperationImpact } from '../src/config/operationImpact';
import {
  JOKER_BASE_PRICES,
  JOKER_STORE_ORDER,
  getJokerPrice,
  planJokerPurchase,
  type JokerInventory,
} from '../src/config/jokerEconomy';
import { JOKER_DISPLAY } from '../src/config/jokers';
import { RANKS } from '../src/config/progression';
import {
  completeOperationSession,
  createDefaultCategoryProgress,
  formatSignedReputation,
  getCategoryAttemptedCount,
  getCategoryPassedOperationCount,
  getCategoryTierProgress,
  getCurrentOperationCheckpoint,
  getOperationReputationProgress,
  getOperationReputationTarget,
  getPassedOperationCount,
  getTierAttemptedCount,
  getTotalCategoryLeaderboardScore,
  isTierUnlocked,
  normalizeCategoryProgress,
  recordCategoryAttempt,
  revertCategoryAttemptOutcome,
  selectCategoryQuestion,
} from '../src/utils/categoryProgress';
import { deriveAchievements } from '../src/utils/achievements';
import {
  filterCategoryQuestions,
  hasEnoughCategoryQuestions,
  isValidCategoryQuestion,
  type CategoryQuestionRow,
} from '../src/utils/categoryQuestions';
import {
  REPEAT_RANKING_SCORE_BY_OUTCOME,
  calculateRankingScore,
  getRankingScoreForOutcome,
  recordRankingOutcome,
  revertRankingOutcome,
} from '../src/utils/ranking';
import { canUseRollbackOnResult } from '../src/utils/gameSession';
import { normalizePlayerSave } from '../src/utils/playerSave';
import { deriveSessionReputation, removeSessionResult, upsertSessionResult } from '../src/utils/sessionReputation';
import { sanitizeTelemetryMetadata } from '../src/utils/telemetryCore';

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

assert(getRankingScoreForOutcome('success') === 100, 'A first-time correct answer must award 100 leaderboard points');
assert(getRankingScoreForOutcome('success', true) === 25, 'A repeated correct answer must award 25 leaderboard points');
assert(getRankingScoreForOutcome('partial', true) === 15, 'A repeated legacy partial answer must award 15 leaderboard points');
assert(REPEAT_RANKING_SCORE_BY_OUTCOME.fail === 0, 'Repeated wrong answers must award no leaderboard points');
assert(REPEAT_RANKING_SCORE_BY_OUTCOME.timeout === 0, 'Repeated timeouts must award no leaderboard points');

assert(REPEAT_QUESTION_REWARD_SCALE.careerXp === 0.35, 'Repeated correct answers must award 35% Career XP');
assert(REPEAT_QUESTION_REWARD_SCALE.reputation === 0.4, 'Repeated correct answers must award 40% reputation');
assert(REPEAT_QUESTION_REWARD_SCALE.budget === 0.35, 'Repeated correct answers must award 35% budget');
const expectedRepeatRewards = {
  1: [35, 4, 105],
  2: [44, 5, 140],
  3: [53, 6, 175],
} as const;
for (const star of [1, 2, 3] as const) {
  const repeatReward = getCategoryReward(star, 'success', true);
  const expected = expectedRepeatRewards[star];
  assert(repeatReward.careerXpDelta === expected[0], `Star ${star} repeated success XP must use rounded 35% scaling`);
  assert(repeatReward.reputationDelta === expected[1], `Star ${star} repeated success reputation must use rounded 40% scaling`);
  assert(repeatReward.budgetDelta === expected[2], `Star ${star} repeated success budget must use rounded 35% scaling`);
  for (const outcome of ['fail', 'timeout'] as const) {
    assert(
      JSON.stringify(getCategoryReward(star, outcome, true)) === JSON.stringify(getCategoryReward(star, outcome)),
      `Star ${star} ${outcome} penalties must not be scaled for repeated questions`,
    );
  }
}

assert(getCategoryChoiceOutcome('optimal') === 'success', 'optimal_text must resolve success');
assert(getCategoryChoiceOutcome('acceptable') === 'fail', 'acceptable_text must be a fail distractor');
assert(getCategoryChoiceOutcome('wrong') === 'fail', 'wrong_text must resolve fail');
assert(getCategoryChoiceOutcome('fatal') === 'fail', 'fatal_text must resolve fail');

const expectedCategoryCatalog = [
  ['web_programming', 'Web Programlama'],
  ['operating_systems', 'İşletim Sistemleri'],
  ['database_systems', 'Veritabanı Sistemleri'],
  ['algorithm', 'Algoritma'],
  ['data_structures', 'Veri Yapıları'],
  ['java', 'Java'],
  ['programming_2', 'Programlamaya Giriş 2'],
  ['object_oriented_programming', 'Nesne Yönelimli Programlama'],
  ['computer_networks', 'Bilgisayar Ağları'],
  ['computer_architecture', 'Bilgisayar Mimarisi'],
  ['microprocessors', 'Mikroişlemciler'],
  ['graph_theory', 'Çizge Kuramı'],
  ['automata_theory', 'Özdevinirler'],
  ['software_engineering', 'Yazılım Mühendisliği'],
  ['engineering_economics', 'Mühendislik Ekonomisi'],
] as const;
assert(GAME_CATEGORIES.length === 15, 'The gameplay catalog must expose 15 course categories');
assert(
  JSON.stringify(GAME_CATEGORIES.map(({ id, name }) => [id, name])) === JSON.stringify(expectedCategoryCatalog),
  'Category IDs, Turkish labels, and stable order must match the 15-category catalog',
);
assert(
  GAME_CATEGORIES.slice(0, 3).map((category) => category.id).join(',')
    === 'web_programming,operating_systems,database_systems',
  'The original three category IDs and their order must remain unchanged',
);
assert(
  GAME_CATEGORIES.every((category, index) => category.order === index + 1),
  'Category order values must be unique and sequential',
);
assert(
  GAME_CATEGORIES.every((category) => category.description.trim().length > 0),
  'Every category must expose concise Turkish card copy',
);
assert(buildGameSessionRoute('web_programming', 1) === '/(tabs)/game?category=web_programming&star=1', 'Web card route must include its category ID');
assert(buildGameSessionRoute('operating_systems', 1) === '/(tabs)/game?category=operating_systems&star=1', 'Operating Systems card route must include its category ID');
assert(buildGameSessionRoute('database_systems', 1) === '/(tabs)/game?category=database_systems&star=1', 'Database Systems card route must include its category ID');
assert(buildGameSessionRoute('engineering_economics', 3) === '/(tabs)/game?category=engineering_economics&star=3', 'New category routes must preserve their stable category ID');
assert(
  expectedCategoryCatalog.every(([id]) => resolveGameCategoryId(id) === id),
  'Every registered category ID must resolve without fallback',
);
assert(resolveGameCategoryId('operating_systems') === 'operating_systems', 'Operating Systems route param must resolve without fallback');
assert(resolveGameCategoryId('database_systems') === 'database_systems', 'Database Systems route param must resolve without fallback');
assert(resolveGameCategoryId(['operating_systems']) === 'operating_systems', 'Array route params must preserve a valid category ID');
assert(resolveGameCategoryId('invalid_category') === 'web_programming', 'Invalid category route params must safely fallback to Web');
const databaseCategory = GAME_CATEGORIES.find((category) => category.id === 'database_systems');
assert(databaseCategory?.name === 'Veritabanı Sistemleri', 'Database category label mismatch');
assert(DIFFICULTY_STARS.length === 3, 'Database category must use the shared three-star ladder');
assert(
  GAME_CATEGORIES.slice(0, 3).map((category) => category.operation.title).join(',')
    === 'Client & API Desk,Runtime Stability Desk,Data Integrity Desk',
  'The original operation desk identities must remain unchanged',
);
assert(
  GAME_CATEGORIES.every((category) => category.operation.title.length > 0),
  'Each active category must expose its operation desk identity',
);
assert(
  GAME_CATEGORIES.every((category) => ['success', 'partial', 'fail', 'timeout'].every((tone) => (
    category.operation.impact[tone as keyof typeof category.operation.impact].length > 0
  ))),
  'Each operation desk must define impact copy for every result tone',
);
assert(
  GAME_CATEGORIES.slice(0, 3).map((category) => category.operation.activeSubtitle).join(',')
    === 'İstemci ve web arayüzü kararı,Süreç ve kaynak yönetimi kararı,Veri ve sorgu hattı kararı',
  'The original operation desks must preserve their compact active gameplay copy',
);
assert(GAME_CATEGORIES.every((category) => category.operation.activeSubtitle.length > 0), 'New operation desks must expose compact active gameplay copy');
assert(!hasEnoughCategoryQuestions(0), 'An empty category must not start a broken session');
assert(!hasEnoughCategoryQuestions(QUESTIONS_PER_TIER - 1), 'A partially populated tier must remain unavailable');
assert(hasEnoughCategoryQuestions(QUESTIONS_PER_TIER), 'A complete tier must remain playable');
assert(hasEnoughCategoryQuestions(QUESTIONS_PER_TIER + 1), 'A tier with extra valid questions must remain playable');
assert(
  sanitizeTelemetryMetadata({ category_id: 'engineering_economics' }).category_id === 'engineering_economics',
  'Telemetry metadata must preserve newly registered category IDs',
);
assert(
  GAME_CATEGORIES.every((category) => /^[a-z0-9_]{1,64}$/.test(category.id)),
  'Every category ID must fit the existing leaderboard metadata constraint',
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

assert(getJokerPrice('serverScaleUp', 'junior') === 200, 'Junior Overclock price mismatch');
assert(getJokerPrice('codeReview', 'engineer') === 300, 'Engineer Debug Lens price mismatch');
assert(getJokerPrice('snapshotBackup', 'senior') === 420, 'Senior Snapshot price mismatch');
assert(getJokerPrice('gitRevert', 'cto') === 880, 'CTO Rollback price mismatch');

assert(JOKER_DISPLAY.codeReview.name === 'Debug Lens', 'codeReview display label must be Debug Lens');
assert(JOKER_DISPLAY.gitRevert.name === 'Rollback', 'gitRevert display label must be Rollback');
assert(JOKER_DISPLAY.serverScaleUp.name === 'Overclock', 'serverScaleUp display label must be Overclock');
assert(JOKER_DISPLAY.snapshotBackup.name === 'Snapshot', 'snapshotBackup display label must remain Snapshot');
assert(JOKER_DISPLAY.codeReview.description === 'İki hatalı seçeneği eler.', 'Debug Lens description mismatch');
assert(JOKER_DISPLAY.gitRevert.description === 'Son kararı geri alır.', 'Rollback description mismatch');
assert(JOKER_DISPLAY.serverScaleUp.description === 'Bu soru için süre kazandırır.', 'Overclock description mismatch');
assert(
  JOKER_DISPLAY.snapshotBackup.description === 'Kaybedilen seriyi geri getirir.',
  'Snapshot description must accurately describe its uptime restore effect',
);
assert(
  JOKER_STORE_ORDER.join(',') === 'serverScaleUp,codeReview,snapshotBackup,gitRevert',
  'Internal joker IDs and store order must remain stable',
);
assert(
  JSON.stringify(JOKER_BASE_PRICES) === JSON.stringify({ serverScaleUp: 200, codeReview: 250, snapshotBackup: 300, gitRevert: 400 }),
  'Joker base prices must remain unchanged',
);
const repositoryRoot = process.cwd();
const dashboardResourceSource = readFileSync(resolve(repositoryRoot, 'src/components/dashboard/ResourceDock.tsx'), 'utf8');
const gameSource = readFileSync(resolve(repositoryRoot, 'app/(tabs)/game.tsx'), 'utf8');
const playSource = readFileSync(resolve(repositoryRoot, 'app/(tabs)/play.tsx'), 'utf8');
const leaderboardEventMigrationSource = readFileSync(
  resolve(repositoryRoot, 'supabase/migrations/20260903100000_create_leaderboard_score_events.sql'),
  'utf8',
);
const storeSource = readFileSync(resolve(repositoryRoot, 'app/(tabs)/store.tsx'), 'utf8');
const resultPanelSource = readFileSync(resolve(repositoryRoot, 'src/components/game/GameResultPanel.tsx'), 'utf8');
const iconAssetsSource = readFileSync(resolve(repositoryRoot, 'src/config/iconAssets.ts'), 'utf8');
const assetIconSource = readFileSync(resolve(repositoryRoot, 'src/components/AssetIcon.tsx'), 'utf8');
const playerSaveSource = readFileSync(resolve(repositoryRoot, 'src/utils/playerSave.ts'), 'utf8');
assert(dashboardResourceSource.includes('Teknik Destek Paketi'), 'Dashboard must render Teknik Destek Paketi');
assert(dashboardResourceSource.includes('Mağazadan alınabilir'), 'Dashboard must mention store availability');
assert(!dashboardResourceSource.includes('Pressable'), 'Dashboard joker card must not render a purchase CTA');
assert(!dashboardResourceSource.includes('onPress'), 'Dashboard joker card must not expose a purchase action');
assert(
  [
    'debuglens.png',
    'rollback.png',
    'overclock.png',
    'snapshot.png',
    'correctanswer.png',
    'wronganswer.png',
    'flame.png',
    'xpup.png',
    'xploss.png',
    'info.png',
    'coin.png',
  ].every((asset) => iconAssetsSource.includes(asset)),
  'Joker, feedback, streak, info, XP, and economy assets must remain registered in the central icon map',
);
assert(dashboardResourceSource.includes('JOKER_ICON_ASSETS'), 'Dashboard joker cards must use the registered joker assets');
assert(storeSource.includes('JOKER_ICON_ASSETS') && storeSource.includes('ECONOMY_ICON_ASSETS.coin'), 'Store must use registered joker and coin assets');
assert(gameSource.includes('JOKER_ICON_ASSETS'), 'Game HUD must use registered joker assets');
assert(
  playSource.includes('hasEnoughCategoryQuestions(contentCount)')
    && gameSource.includes('hasEnoughCategoryQuestions(loadedIncidents.length)'),
  'Hub and direct game routes must share the safe minimum-content gate',
);
assert(
  leaderboardEventMigrationSource.includes("category_id ~ '^[a-z0-9_]{1,64}$'"),
  'Leaderboard event metadata must retain its category-ID-compatible schema constraint',
);
assert(!gameSource.includes('ECONOMY_ICON_ASSETS.coin'), 'The combined completion reward summary must not imply that every metric is budget');
assert(resultPanelSource.includes('ECONOMY_ICON_ASSETS.coin'), 'Per-question budget result must use the registered coin asset');
assert(
  resultPanelSource.includes('UI_ICON_ASSETS.correctAnswer')
    && resultPanelSource.includes('UI_ICON_ASSETS.wrongAnswer')
    && resultPanelSource.includes('UI_ICON_ASSETS.xpUp')
    && resultPanelSource.includes('UI_ICON_ASSETS.xpLoss'),
  'Question results and Career XP deltas must use the registered feedback assets',
);
assert(!resultPanelSource.includes("'}$${Math.abs(value)"), 'Per-question budget results must not render a dollar prefix');
assert(assetIconSource.includes('onError') && assetIconSource.includes('fallbackName'), 'Asset icons must retain a runtime vector fallback');
assert(playerSaveSource.includes("jokerInventory: '@shipit_lifeline_inventory'"), 'Legacy joker inventory storage key must remain stable');
assert(
  ['codeReview: 3', 'gitRevert: 3', 'serverScaleUp: 3', 'snapshotBackup: 3'].every((entry) => playerSaveSource.includes(entry)),
  'Inventory persistence keys and defaults must remain stable',
);
assert(gameSource.includes('slice(0, 2)'), 'Debug Lens must continue eliminating two incorrect choices');
assert(gameSource.includes('timeLeftRef.current + 15'), 'Overclock must continue adding 15 seconds');
assert(gameSource.includes('removeSessionResult(sessionResultsRef.current, currentIncident.id)'), 'Rollback must continue removing the last resolved decision');
assert(gameSource.includes('const restoredStreak = currentResult.uptimeBefore'), 'Snapshot must continue restoring the lost uptime streak');

const inventory: JokerInventory = { serverScaleUp: 0, codeReview: 0, snapshotBackup: 0, gitRevert: 0 };
const purchase = planJokerPurchase(1_000, inventory, 'gitRevert', 'cto');
assert(purchase.status === 'ok' && purchase.budget === 120 && purchase.inventory.gitRevert === 1, 'Purchase must use displayed rank price');

assert(
  RANKS.map((rank) => rank.threshold).join(',') === '0,500,1200,2000,3200,4800,7000,9500,12500,16000,20000,24500,29500,35000,41000,47500,54500,62000,70000,79000,89000',
  'Career threshold table mismatch',
);

let progress = createDefaultCategoryProgress();
assert(
  GAME_CATEGORIES.every((category) => DIFFICULTY_STARS.every((star) => (
    progress[category.id][star].attemptedQuestionIds.length === 0
    && progress[category.id][star].solvedCorrectQuestionIds.length === 0
  ))),
  'Every category must receive safe empty progress and repeat-question state',
);
const newCategorySolvedProgress = recordCategoryAttempt(
  progress,
  'algorithm',
  1,
  'algorithm-repeat-state',
  true,
  true,
);
assert(
  newCategorySolvedProgress.algorithm[1].solvedCorrectQuestionIds.includes('algorithm-repeat-state'),
  'Repeat-question solved state must work for newly registered categories',
);
const legacyThreeCategoryProgress = {
  web_programming: {
    1: { attemptedQuestionIds: ['legacy-web-question'], correctCount: 1, incorrectCount: 0 },
  },
  operating_systems: {},
  database_systems: {},
};
const legacyProgressBeforeRead = JSON.stringify(legacyThreeCategoryProgress);
assert(getTierAttemptedCount(legacyThreeCategoryProgress, 'algorithm', 1) === 0, 'A missing category must read as zero attempts');
assert(getTierAttemptedCount(legacyThreeCategoryProgress, 'web_programming', 2) === 0, 'A missing difficulty key must read as zero attempts');
assert(getCategoryAttemptedCount(legacyThreeCategoryProgress, 'web_programming') === 1, 'A legacy three-category save must retain existing attempts');
const emptyNewCategoryTier = getCategoryTierProgress(legacyThreeCategoryProgress, 'algorithm', 1);
assert(
  emptyNewCategoryTier.attemptedQuestionIds.length === 0
    && emptyNewCategoryTier.solvedCorrectQuestionIds.length === 0
    && emptyNewCategoryTier.operationCheckpoints[1].attempted === false
    && emptyNewCategoryTier.operationCheckpoints[2].passed === false,
  'A newly rendered category must receive safe, empty read defaults',
);
assert(JSON.stringify(legacyThreeCategoryProgress) === legacyProgressBeforeRead, 'Safe progress reads must not mutate legacy save data');
assert(isTierUnlocked(progress, 'web_programming', 1), 'Star 1 must start unlocked');
assert(!isTierUnlocked(progress, 'web_programming', 2), 'Star 2 must start locked');
for (let id = 1; id <= QUESTIONS_PER_TIER; id += 1) {
  progress = recordCategoryAttempt(progress, 'web_programming', 1, id, id % 2 === 0);
}
assert(getTierAttemptedCount(progress, 'web_programming', 1) === 20, 'Unique attempted count must reach 20');
assert(getCategoryAttemptedCount(progress, 'web_programming') === 20, 'Category progress must sum the three tier counts');
assert(!isTierUnlocked(progress, 'web_programming', 2), 'Star 2 must remain locked when only attempts exist');
assert(progress.web_programming[1].solvedCorrectQuestionIds.length === 0, 'Attempts outside a completed session must not mark questions as permanently solved');
progress = recordCategoryAttempt(progress, 'web_programming', 1, 20, true);
assert(getTierAttemptedCount(progress, 'web_programming', 1) === 20, 'Replay must not inflate unique progress');
const completedCorrectProgress = recordCategoryAttempt(
  createDefaultCategoryProgress(),
  'web_programming',
  1,
  'completed-correct',
  true,
  true,
);
assert(completedCorrectProgress.web_programming[1].solvedCorrectQuestionIds.includes('completed-correct'), 'A correct answer in a completed session must persist its stable question ID');
const completedWrongProgress = recordCategoryAttempt(
  createDefaultCategoryProgress(),
  'web_programming',
  1,
  'completed-wrong',
  false,
  true,
);
assert(completedWrongProgress.web_programming[1].solvedCorrectQuestionIds.length === 0, 'Wrong answers must remain eligible for full first-correct rewards');

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
assert(deriveSessionReputation(sessionResults) === 20, 'Rollback must remove a wrong answer penalty');
sessionResults = upsertSessionResult(sessionResults, { questionId: 3, reputationDelta: 10 });
assert(deriveSessionReputation(sessionResults) === 30, 'Re-answering after Rollback must apply the replacement result once');
sessionResults = upsertSessionResult(sessionResults, { questionId: 3, reputationDelta: 10 });
assert(deriveSessionReputation(sessionResults) === 30, 'Upserting the same resolved question must not double-count reputation');
assert(!canUseRollbackOnResult(1, { outcome: 'success' }), 'Rollback must reject a correct answer');
// Reset the focused result to exercise the timeout rollback path independently.
sessionResults = removeSessionResult(sessionResults, 3);
sessionResults = upsertSessionResult(sessionResults, { questionId: 3, reputationDelta: -15 });
assert(deriveSessionReputation(sessionResults) === 5, 'A timeout must apply its exact session penalty');
sessionResults = removeSessionResult(sessionResults, 3);
assert(deriveSessionReputation(sessionResults) === 20, 'Rollback must restore a reverted timeout penalty');
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
assert(getTierAttemptedCount(revertedAnswerProgress, 'web_programming', 1) === 1, 'Rollback must keep the question visible as attempted');
assert(revertedAnswerProgress.web_programming[1].correctCount === 0, 'Rollback must remove the reverted category answer result');
const emptyRankingStats = { successCount: 0, partialCount: 0, failCount: 0, timeoutCount: 0, legacyPositiveCount: 0 };
for (const outcome of ['success', 'partial', 'fail', 'timeout'] as const) {
  const rankingAfterAnswer = recordRankingOutcome(emptyRankingStats, outcome);
  const rankingAfterRevert = revertRankingOutcome(rankingAfterAnswer, outcome);
  assert(
    JSON.stringify(rankingAfterRevert) === JSON.stringify(emptyRankingStats),
    `Rollback must remove the reverted ${outcome} ranking outcome`,
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
assert(legacyAttemptProgress.web_programming[1].solvedCorrectQuestionIds.length === 0, 'Old saves without solved IDs must normalize safely');
assert(!isTierUnlocked(legacyAttemptProgress, 'web_programming', 2), 'Missing legacy checkpoint data must not unlock Orta');
const normalizedSolvedProgress = normalizeCategoryProgress({
  web_programming: {
    1: {
      attemptedQuestionIds: ['solved-1'],
      solvedCorrectQuestionIds: ['solved-1', 'solved-1', 'solved-2'],
      correctCount: 2,
      incorrectCount: 0,
    },
  },
});
assert(
  normalizedSolvedProgress.web_programming[1].solvedCorrectQuestionIds.join(',') === 'solved-1,solved-2',
  'Persisted solved IDs must survive normalization without duplicates',
);
const legacyLeaderboardSave = normalizePlayerSave({
  saveVersion: 4,
  correctAnswers: 3,
  rankingOutcomeStats: {
    successCount: 2,
    partialCount: 1,
    failCount: 0,
    timeoutCount: 0,
    legacyPositiveCount: 0,
  },
  categoryProgress: {
    web_programming: {
      1: { attemptedQuestionIds: [], correctCount: 0, incorrectCount: 0 },
    },
  },
});
assert(
  getTotalCategoryLeaderboardScore(legacyLeaderboardSave.categoryProgress) === 250,
  'Existing saves must retain their historical all-time leaderboard score when repeat-aware totals are initialized',
);
const repeatAwareLeaderboardSave = normalizePlayerSave({
  ...legacyLeaderboardSave,
  categoryProgress: {
    ...legacyLeaderboardSave.categoryProgress,
    web_programming: {
      ...legacyLeaderboardSave.categoryProgress.web_programming,
      1: {
        ...legacyLeaderboardSave.categoryProgress.web_programming[1],
        leaderboardScore: 125,
      },
    },
  },
});
assert(
  getTotalCategoryLeaderboardScore(repeatAwareLeaderboardSave.categoryProgress) === 125,
  'Persisted repeat-aware all-time score must not be replaced by legacy outcome-count reconstruction',
);
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
assert(
  derivedAchievements.find((badge) => badge.id === 'full_coverage')?.progressText === '6/90 operasyon geçti',
  'Tam Kapsama must require all six qualifications across all 15 categories',
);
assert(!derivedAchievements.find((badge) => badge.id === 'all_medium_unlocked')?.earned, 'New empty categories must prevent accidental global tier achievements');

const questions = Array.from({ length: 20 }, (_, index) => ({ id: index + 1 }));
const selected = selectCategoryQuestion(questions, [1, 2], Array.from({ length: 19 }, (_, index) => index + 1), () => 0);
assert(selected?.id === 20, 'Selection must prefer the last question not previously solved correctly');
assert(selectCategoryQuestion(questions, questions.map((question) => question.id), [], () => 0) === null, 'Session must not repeat a question');
const retryPriorityQuestions = [{ id: 'solved-a' }, { id: 'wrong-before' }, { id: 'solved-b' }];
assert(
  selectCategoryQuestion(retryPriorityQuestions, [], ['solved-a', 'solved-b'], () => 0)?.id === 'wrong-before',
  'A previously wrong question must be prioritized until it is correctly solved in a completed session',
);
assert(
  selectCategoryQuestion(retryPriorityQuestions, [], retryPriorityQuestions.map((question) => question.id), () => 0)?.id === 'solved-a',
  'Solved questions must remain playable after the unseen-correct pool is exhausted',
);

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
for (const [categoryId] of expectedCategoryCatalog.slice(3)) {
  const categoryQuestion = { ...validQuestion, category_id: categoryId };
  assert(
    filterCategoryQuestions([categoryQuestion], categoryId, 1).length === 1,
    `${categoryId} must be accepted by shared question filtering`,
  );
}

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

const mixedCategoryRows: CategoryQuestionRow[] = [
  validQuestion,
  { ...validQuestion, id: 'os-route-question', category_id: 'operating_systems', tag: 'Process', title: 'OS sorusu' },
  { ...validQuestion, id: 'db-route-question', category_id: 'database_systems', tag: 'SQL', title: 'DB sorusu' },
];
const resolvedOperatingSystemQuestions = filterCategoryQuestions(
  mixedCategoryRows,
  resolveGameCategoryId('operating_systems'),
  1,
);
assert(
  resolvedOperatingSystemQuestions.length === 1 && resolvedOperatingSystemQuestions[0].category_id === 'operating_systems',
  'Question filtering must use the resolved route category and exclude Web/Database rows',
);

let scopedCategoryProgress = createDefaultCategoryProgress();
scopedCategoryProgress = recordCategoryAttempt(scopedCategoryProgress, 'operating_systems', 1, 'os-only-question', true);
const scopedCompletion = completeOperationSession(
  scopedCategoryProgress,
  'database_systems',
  1,
  1,
  40,
  '2026-09-02T10:00:00.000Z',
);
assert(scopedCompletion.progress.operating_systems[1].attemptedQuestionIds.length === 1, 'OS attempts must stay in OS progress');
assert(scopedCompletion.progress.database_systems[1].operationCheckpoints[1].passed, 'Database checkpoint must write to Database progress');
assert(scopedCompletion.progress.web_programming[1].attemptedQuestionIds.length === 0, 'Non-Web sessions must not write attempts to Web progress');
assert(!scopedCompletion.progress.web_programming[1].operationCheckpoints[1].attempted, 'Non-Web checkpoints must not write to Web progress');

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
