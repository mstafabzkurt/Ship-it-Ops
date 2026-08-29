import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  RECENT_QUESTION_HISTORY_LIMIT,
  RANKS,
  calculateProgressionOutcome,
  getRankForCareerXp,
  getRankProgress,
  type Rank,
} from '../config/progression';
import {
  planJokerPurchase,
  type JokerId,
  type JokerInventory as LifelineInventory,
} from '../config/jokerEconomy';
import {
  DEFAULT_AVATAR_FRAME_ID,
  DEFAULT_AVATAR_ID,
  DEFAULT_OWNED_COSMETIC_IDS,
  getCosmeticById,
  normalizeCosmeticPlayerState,
  planCosmeticPurchase,
  validateCosmeticEquip,
  type AvatarCosmetic,
  type AvatarCosmeticId,
  type AvatarFrameCosmetic,
  type AvatarFrameCosmeticId,
  type CosmeticCatalogItem,
  type CosmeticId,
  type CosmeticType,
} from '../config/cosmetics';
import { DEFAULT_COMPANY_NAME, normalizeCompanyName } from '../config/company';
import {
  claimAndLoadLegacySave,
  createMyPlayerSave,
  fetchMyPlayerSave,
  getPlayerSaveErrorMessage,
  loadAccountSaveCache,
  upsertMyPlayerSave,
  writeAccountSaveCache,
} from '../services/playerSave';
import { appendRecentQuestionId } from '../utils/questionSelection';
import {
  calculateRankingScore,
  normalizeRankingOutcomeStats,
  recordRankingOutcome as advanceRankingOutcomeStats,
  type RankingOutcome,
  type RankingOutcomeStats,
} from '../utils/ranking';
import {
  buildPlayerSaveSnapshot,
  createDefaultJokerInventory,
  createDefaultPlayerSave,
  normalizePlayerSaveForCurrentWeek,
  PLAYER_SAVE_VERSION,
  type PlayerSaveSnapshot,
} from '../utils/playerSave';
import {
  createDefaultCategoryProgress,
  recordCategoryAttempt,
  type CategoryProgress,
} from '../utils/categoryProgress';
import type { DifficultyStar, GameCategoryId } from '../config/gameCategories';
import type { CategoryQuestionId } from '../utils/categoryQuestions';
import { useAuth } from './AuthContext';

export { RANKS } from '../config/progression';
export type { Rank } from '../config/progression';

// --- Rozetler ---------------------------------------------------------------
export interface Badge {
  id: string;
  icon: string;
  title: string;
  description: string;
  requiredScore: number;
  requirementType?: 'reputation' | 'careerXp';
  rewardBudget: number;
}

export const BADGES: Badge[] = [
  // ── Erken aşama (0 – 749) ────────────────────────────────────────────────
  { id: 'first-response', icon: '🧯', title: 'İlk Müdahale', description: 'İlk production krizini çözdün. Hoş geldin!', requiredScore: 0, rewardBudget: 1500 },
  { id: 'hello-world', icon: '👋', title: 'Merhaba Dünya', description: 'İlk 200 itibar puanını kazandın.', requiredScore: 200, rewardBudget: 2000 },
  { id: 'bug-hunter', icon: '🐛', title: 'Hata Avcısı', description: "5 bug'ı başarıyla izole edip çözdün.", requiredScore: 450, rewardBudget: 3500 },
  { id: 'night-shift', icon: '🌙', title: 'Gece Nöbeti', description: 'Gece yarısı acil bir kesintiyi yönettın.', requiredScore: 750, rewardBudget: 5000 },
  // ── Orta aşama (1.000 – 3.999) ───────────────────────────────────────────
  { id: 'architect', icon: '🏗️', title: 'Mimar', description: 'Kritik bir sistem tasarım kararını doğru verdin.', requiredScore: 1000, rewardBudget: 8000 },
  { id: 'postmortem-pro', icon: '📋', title: 'Post-Mortem Ustası', description: 'Bir incident sonrası eksiksiz post-mortem raporu yazdın.', requiredScore: 1400, rewardBudget: 6000 },
  { id: 'oncall-hero', icon: '📟', title: 'On-Call Kahraman', description: 'Hafta sonu on-call vardiyasında 3 alarmı çözdün.', requiredScore: 2000, rewardBudget: 12000 },
  { id: 'refactor-king', icon: '♻️', title: 'Refactor Kralı', description: 'Teknik borcu azaltan kapsamlı bir refactor tamamladın.', requiredScore: 2600, rewardBudget: 10000 },
  { id: 'ci-cd-wizard', icon: '⚙️', title: 'CI/CD Sihirbazı', description: 'Deployment süresini yarıya indiren bir pipeline kurdun.', requiredScore: 3200, rewardBudget: 14000 },
  // ── İleri aşama (4.000 – 9.999) ──────────────────────────────────────────
  { id: 'lead-badge', icon: '🎖️', title: 'Takım Lideri', description: 'Takım Lideri rütbesine ulaştın. Ekip seni izliyor.', requiredScore: 4300, requirementType: 'careerXp', rewardBudget: 25000 },
  { id: 'mentor', icon: '🎓', title: 'Mentor', description: 'Bir junior mühendise 10 PR review yaptın.', requiredScore: 5000, rewardBudget: 20000 },
  { id: 'sre-guardian', icon: '🛡️', title: 'SRE Bekçisi', description: "99.9% uptime'ı 3 ay üst üste korudun.", requiredScore: 6000, rewardBudget: 30000 },
  { id: 'platform-builder', icon: '🔧', title: 'Platform Mimarı', description: 'Tüm takımın kullandığı dahili bir araç geliştirdin.', requiredScore: 7500, rewardBudget: 40000 },
  // ── Efsane (10.000+) ──────────────────────────────────────────────────────
  { id: 'director-badge', icon: '🌟', title: 'Direktör', description: 'Direktör rütbesine ulaştın. Şirket stratejisini şekillendiriyorsun.', requiredScore: 11200, requirementType: 'careerXp', rewardBudget: 60000 },
  { id: 'chaos-engineer', icon: '🌪️', title: 'Kaos Mühendisi', description: 'Chaos Engineering senaryosu tasarlayıp uyguladın.', requiredScore: 14000, rewardBudget: 75000 },
  { id: 'cto-badge', icon: '👑', title: 'CTO', description: 'Teknoloji vizyonunu tüm şirkete mal ettin. Efsane.', requiredScore: 16000, requirementType: 'careerXp', rewardBudget: 100000 },
];

// Streak day rewards (index = day number 0-6 = Mon-Sun)
export const STREAK_REWARDS = [200, 400, 600, 800, 1000, 1200, 1500] as const;

const DEFAULT_SCORE = 0;
const DEFAULT_CAREER_XP = 0;
const DEFAULT_BUDGET = 1000;
const DEFAULT_LIFELINE_COUNT = 3;
const DEFAULT_UPTIME_STREAK = 0;
const DEFAULT_CORRECT_ANSWERS = 0;
const DEFAULT_WRONG_ANSWERS = 0;
const DEFAULT_SEEN_IDS: number[] = [];

export type JokerPurchaseResult = 'ok' | 'insufficient_funds' | 'busy' | 'persistence_error';
export type CosmeticPurchaseResult = 'ok' | 'already_owned' | 'insufficient_funds' | 'busy' | 'persistence_error';
export type CosmeticEquipResult = 'ok' | 'not_owned' | 'type_mismatch' | 'busy' | 'persistence_error';

export type PlayerSaveStatus = 'idle' | 'loading' | 'migrating' | 'ready' | 'saving' | 'error';

export function getCompanyInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'S';
}

export function isBadgeEarned(badge: Badge, reputation: number, careerXp: number): boolean {
  return badge.requirementType === 'careerXp'
    ? careerXp >= badge.requiredScore
    : reputation >= badge.requiredScore;
}

// --- Türetilmiş yardımcılar ---------------------------------------------------
/** @deprecated Rank is now derived from permanent Career XP. */
export const getRankForScore = getRankForCareerXp;

// --- Context -------------------------------------------------------------
interface ReputationContextValue {
  /** Reputation / İtibar. Kept as score for backward-compatible consumers. */
  score: number;
  reputation: number;
  /** Permanent, non-decreasing career progression. */
  careerXp: number;
  budget: number;
  companyName: string;
  isLoaded: boolean;
  saveStatus: PlayerSaveStatus;
  saveError: string | null;
  retrySaveInitialization: () => void;
  retryPlayerSave: () => void;
  flushPlayerSave: () => Promise<void>;
  currentRank: Rank;
  nextRank: Rank | null;
  rankProgress: number; // 0-1 arası, ekranın kendi hesap yapmasına gerek yok
  badges: (Badge & { earned: boolean })[];
  codeReview: number;
  gitRevert: number;
  serverScaleUp: number;
  snapshotBackup: number;
  uptimeStreak: number;
  consumeCodeReview: () => void;
  consumeGitRevert: () => void;
  consumeServerScaleUp: () => void;
  consumeSnapshotBackup: () => void;
  setUptimeStreak: React.Dispatch<React.SetStateAction<number>>;
  setCodeReview: React.Dispatch<React.SetStateAction<number>>;
  setGitRevert: React.Dispatch<React.SetStateAction<number>>;
  setServerScaleUp: React.Dispatch<React.SetStateAction<number>>;
  setSnapshotBackup: React.Dispatch<React.SetStateAction<number>>;
  /** Satın alınan öğelerin ID listesi */
  inventory: string[];
  ownedCosmeticIds: CosmeticId[];
  equippedAvatarId: AvatarCosmeticId;
  equippedAvatarFrameId: AvatarFrameCosmeticId;
  equippedAvatar: AvatarCosmetic;
  equippedAvatarFrame: AvatarFrameCosmetic;
  purchaseCosmetic: (cosmeticId: CosmeticId) => Promise<CosmeticPurchaseResult>;
  equipAvatar: (cosmeticId: CosmeticId) => Promise<CosmeticEquipResult>;
  equipAvatarFrame: (cosmeticId: CosmeticId) => Promise<CosmeticEquipResult>;
  isCosmeticOwned: (cosmeticId: CosmeticId) => boolean;
  getEquippedCosmetic: (type: CosmeticType) => CosmeticCatalogItem;
  /** Sadece skoru değiştirir, o çağrıda yeni kazanılan rozetleri döner. */
  addScore: (amount: number) => Promise<Badge[]>;
  /** Bir kriz sonucunda Career XP, İtibar ve bütçeyi atomik olarak günceller. */
  applyOutcome: (careerXpDelta: number, reputationDelta: number, budgetDelta: number) => Promise<Badge[]>;
  /** Bütçeyi skor veya rozet durumunu değiştirmeden günceller. */
  addBudget: (amount: number) => Promise<Badge[]>;
  /** Yeni kazanılan ama henüz kullanıcıya gösterilmemiş rozetler (toast kuyruğu). */
  pendingBadges: Badge[];
  dismissBadge: () => void;
  /** Skoru ve bütçeyi varsayılana döndürür, hafızadan da siler. Profil ekranındaki "İlerlemeyi Sıfırla" için. */
  resetProgress: () => Promise<void>;
  /** Şirket adını günceller ve kalıcı olarak saklar (Profil ekranı vb. için). */
  setCompanyName: (name: string) => Promise<void>;
  /**
   * Bir mağaza öğesini satın alır.
   * @param itemId   Satın alınacak öğenin ID'si
   * @param price    Öğenin fiyatı
   * @returns 'ok' | 'insufficient_funds' | 'already_owned'
   */
  purchaseItem: (itemId: string, price: number) => Promise<'ok' | 'insufficient_funds' | 'already_owned'>;
  /** Tek bir joker satın alır; fiyatı merkezî Joker ekonomi yapılandırmasından okur. */
  purchaseJoker: (jokerId: JokerId) => Promise<JokerPurchaseResult>;
  /** 7-slot boolean array Mon–Sun. true = completed/claimed for current week */
  streakDays: boolean[];
  /** 0=Mon … 6=Sun, based on today */
  todayIndex: number;
  /** Count of consecutive claimed days ending today */
  streakCount: number;
  /** Claim today's streak reward. Returns budget reward amount or 0 if already claimed. */
  claimStreakDay: () => Promise<number>;
  /** Kullanıcının doğru cevapladığı soru sayısı */
  correctAnswers: number;
  /** Kullanıcının yanlış cevapladığı soru sayısı */
  wrongAnswers: number;
  /** Global leaderboard'dan bağımsız, yerel kriz karar puanı. */
  rankingScore: number;
  /** Success/partial ayrımını ve güvenli legacy başlangıç kredisini tutar. */
  rankingOutcomeStats: RankingOutcomeStats;
  /** Sonucu leaderboard istatistiklerine kaydeder; ödül/progression değiştirmez. */
  recordRankingOutcome: (outcome: RankingOutcome) => void;
  /** Kullanıcının gördüğü soru ID'leri */
  seenIds: number[];
  /** Doğru cevap sayısını günceller */
  setCorrectAnswers: React.Dispatch<React.SetStateAction<number>>;
  /** Yanlış cevap sayısını günceller */
  setWrongAnswers: React.Dispatch<React.SetStateAction<number>>;
  /** Görülen soru ID'lerini günceller */
  setSeenIds: React.Dispatch<React.SetStateAction<number[]>>;
  /** Görülen soru ID'lerini hem state/ref hem de kalıcı depolamada temizler. */
  clearSeenIds: () => Promise<void>;
  categoryProgress: CategoryProgress;
  recordCategoryQuestionAnswer: (
    categoryId: GameCategoryId,
    star: DifficultyStar,
    questionId: CategoryQuestionId,
    correct: boolean,
  ) => void;
}

const ReputationContext = createContext<ReputationContextValue | null>(null);

export function ReputationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [score, setScore] = useState(DEFAULT_SCORE);
  const [careerXp, setCareerXp] = useState(DEFAULT_CAREER_XP);
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [companyName, setCompanyNameState] = useState(DEFAULT_COMPANY_NAME);
  const [saveStatus, setSaveStatus] = useState<PlayerSaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [initializationAttempt, setInitializationAttempt] = useState(0);
  const [pendingBadges, setPendingBadges] = useState<Badge[]>([]);
  const [codeReview, setCodeReviewState] = useState(DEFAULT_LIFELINE_COUNT);
  const [gitRevert, setGitRevertState] = useState(DEFAULT_LIFELINE_COUNT);
  const [serverScaleUp, setServerScaleUpState] = useState(DEFAULT_LIFELINE_COUNT);
  const [snapshotBackup, setSnapshotBackupState] = useState(DEFAULT_LIFELINE_COUNT);
  const [uptimeStreak, setUptimeStreak] = useState(DEFAULT_UPTIME_STREAK);
  const [inventory, setInventory] = useState<string[]>([]);
  const inventoryRef = useRef<string[]>([]);
  const lifelineInventoryRef = useRef<LifelineInventory>(createDefaultJokerInventory());
  const economyTransactionLockRef = useRef(false);
  const cosmeticEquipLockRef = useRef(false);
  const [ownedCosmeticIds, setOwnedCosmeticIds] = useState<CosmeticId[]>(() => [...DEFAULT_OWNED_COSMETIC_IDS]);
  const [equippedAvatarId, setEquippedAvatarId] = useState<AvatarCosmeticId>(DEFAULT_AVATAR_ID);
  const [equippedAvatarFrameId, setEquippedAvatarFrameId] = useState<AvatarFrameCosmeticId>(DEFAULT_AVATAR_FRAME_ID);
  const ownedCosmeticIdsRef = useRef<CosmeticId[]>([...DEFAULT_OWNED_COSMETIC_IDS]);
  const equippedAvatarIdRef = useRef<AvatarCosmeticId>(DEFAULT_AVATAR_ID);
  const equippedAvatarFrameIdRef = useRef<AvatarFrameCosmeticId>(DEFAULT_AVATAR_FRAME_ID);

  // User statistics & game incident state
  const [correctAnswers, setCorrectAnswers] = useState<number>(DEFAULT_CORRECT_ANSWERS);
  const [wrongAnswers, setWrongAnswers] = useState<number>(DEFAULT_WRONG_ANSWERS);
  const [rankingOutcomeStats, setRankingOutcomeStats] = useState<RankingOutcomeStats>(() => (
    normalizeRankingOutcomeStats(null)
  ));
  const [seenIds, setSeenIds] = useState<number[]>(DEFAULT_SEEN_IDS);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress>(() => createDefaultCategoryProgress());

  const seenIdsRef = useRef<number[]>(DEFAULT_SEEN_IDS);
  const rankingOutcomeStatsRef = useRef<RankingOutcomeStats>(normalizeRankingOutcomeStats(null));
  const categoryProgressRef = useRef<CategoryProgress>(createDefaultCategoryProgress());


  // Streak: 7-slot bool array (Mon-Sun) + last claimed date string (YYYY-MM-DD)
  const [streakDays, setStreakDays] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [streakLastDate, setStreakLastDate] = useState<string>('');
  const streakDaysRef = useRef<boolean[]>([false, false, false, false, false, false, false]);

  // todayIndex: 0=Mon … 6=Sun (JS getDay: 0=Sun, so adjust)
  const todayJsDay = new Date().getDay();
  const todayIndex = todayJsDay === 0 ? 6 : todayJsDay - 1;

  // streakCount = how many consecutive days back from today are claimed
  const streakCount = (() => {
    let count = 0;
    for (let i = todayIndex; i >= 0; i--) {
      if (streakDays[i]) count++;
      else break;
    }
    return count;
  })();

  // score/budget'in "şu anki" değerini ref'te tutuyoruz; addScore/applyOutcome
  // arka arkaya (aynı render arasında) çağrılsa bile state'in henüz commit
  // edilmemiş olmasından kaynaklanan stale-closure riski olmadan doğru
  // eski değeri okuyup rozet farkını buradan hesaplıyoruz.
  const scoreRef = useRef(score);
  const careerXpRef = useRef(careerXp);
  const budgetRef = useRef(budget);
  const hydratedUserIdRef = useRef<string | null>(null);
  const initializationIdRef = useRef(0);
  const lastPersistedSignatureRef = useRef('');
  const lastAttemptedSignatureRef = useRef('');
  const cloudBaselineReadyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const latestSaveRef = useRef<PlayerSaveSnapshot>(createDefaultPlayerSave());

  const hydrateRuntime = useCallback((input: PlayerSaveSnapshot) => {
    const save = buildPlayerSaveSnapshot(input);
    scoreRef.current = save.reputation;
    careerXpRef.current = save.careerXp;
    budgetRef.current = save.companyBudget;
    inventoryRef.current = save.ownedItemIds;
    lifelineInventoryRef.current = save.jokerInventory;
    ownedCosmeticIdsRef.current = save.ownedCosmeticIds;
    equippedAvatarIdRef.current = save.equippedAvatarId;
    equippedAvatarFrameIdRef.current = save.equippedAvatarFrameId;
    rankingOutcomeStatsRef.current = save.rankingOutcomeStats;
    seenIdsRef.current = save.recentQuestionIds;
    streakDaysRef.current = save.streakDays;
    categoryProgressRef.current = save.categoryProgress;

    setScore(save.reputation);
    setCareerXp(save.careerXp);
    setBudget(save.companyBudget);
    setCompanyNameState(save.companyName);
    setInventory(save.ownedItemIds);
    setCodeReviewState(save.jokerInventory.codeReview);
    setGitRevertState(save.jokerInventory.gitRevert);
    setServerScaleUpState(save.jokerInventory.serverScaleUp);
    setSnapshotBackupState(save.jokerInventory.snapshotBackup);
    setOwnedCosmeticIds(save.ownedCosmeticIds);
    setEquippedAvatarId(save.equippedAvatarId);
    setEquippedAvatarFrameId(save.equippedAvatarFrameId);
    setCorrectAnswers(save.correctAnswers);
    setWrongAnswers(save.wrongAnswers);
    setRankingOutcomeStats(save.rankingOutcomeStats);
    setSeenIds(save.recentQuestionIds);
    setStreakDays(save.streakDays);
    setStreakLastDate(save.streakLastDate ?? '');
    setCategoryProgress(save.categoryProgress);
    setPendingBadges([]);
  }, []);

  const clearRuntimeForAccountBoundary = useCallback(() => {
    hydrateRuntime(createDefaultPlayerSave());
    setUptimeStreak(DEFAULT_UPTIME_STREAK);
  }, [hydrateRuntime]);

  const retrySaveInitialization = useCallback(() => {
    setInitializationAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    const userId = user?.id ?? null;
    const initializationId = initializationIdRef.current + 1;
    initializationIdRef.current = initializationId;
    hydratedUserIdRef.current = null;
    setHydratedUserId(null);
    setSaveError(null);
    lastPersistedSignatureRef.current = '';
    lastAttemptedSignatureRef.current = '';
    cloudBaselineReadyRef.current = false;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    clearRuntimeForAccountBoundary();

    if (!userId) {
      setSaveStatus('idle');
      return undefined;
    }

    setSaveStatus('loading');

    const initialize = async () => {
      try {
        let save = await fetchMyPlayerSave(userId);
        if (initializationIdRef.current !== initializationId) return;

        if (!save) {
          setSaveStatus('migrating');
          const accountCache = await loadAccountSaveCache(userId).catch(() => null);
          if (accountCache) await claimAndLoadLegacySave(userId);
          const legacySave = accountCache ? null : await claimAndLoadLegacySave(userId);
          save = normalizePlayerSaveForCurrentWeek(accountCache ?? legacySave ?? createDefaultPlayerSave());
          try {
            await createMyPlayerSave(userId, save);
          } catch (createError) {
            const concurrentSave = await fetchMyPlayerSave(userId).catch(() => null);
            if (!concurrentSave) throw createError;
            save = concurrentSave;
          }
        }

        if (initializationIdRef.current !== initializationId) return;
        cloudBaselineReadyRef.current = true;
        const sourceSignature = JSON.stringify(buildPlayerSaveSnapshot(save));
        const normalized = normalizePlayerSaveForCurrentWeek(save);
        hydrateRuntime(normalized);
        latestSaveRef.current = normalized;
        lastPersistedSignatureRef.current = sourceSignature;
        hydratedUserIdRef.current = userId;
        setHydratedUserId(userId);
        setSaveStatus('ready');
        void writeAccountSaveCache(userId, normalized).catch((error) => {
          if (__DEV__) console.warn('[PlayerSave] Hesap yedeği yazılamadı.', error);
        });
      } catch (error) {
        if (initializationIdRef.current !== initializationId) return;
        const cached = await loadAccountSaveCache(userId).catch(() => null);
        if (initializationIdRef.current !== initializationId) return;
        if (cached) {
          const normalizedCache = normalizePlayerSaveForCurrentWeek(cached);
          hydrateRuntime(normalizedCache);
          latestSaveRef.current = normalizedCache;
          lastPersistedSignatureRef.current = JSON.stringify(cached);
          hydratedUserIdRef.current = userId;
          setHydratedUserId(userId);
        }
        cloudBaselineReadyRef.current = false;
        setSaveError(getPlayerSaveErrorMessage(error));
        setSaveStatus('error');
      }
    };

    void initialize();
    return () => {
      initializationIdRef.current += 1;
    };
  }, [clearRuntimeForAccountBoundary, hydrateRuntime, initializationAttempt, user?.id]);

  const saveSnapshot = useMemo(() => buildPlayerSaveSnapshot({
    saveVersion: PLAYER_SAVE_VERSION,
    careerXp,
    reputation: score,
    companyBudget: budget,
    companyName,
    correctAnswers,
    wrongAnswers,
    rankingOutcomeStats,
    jokerInventory: { codeReview, gitRevert, serverScaleUp, snapshotBackup },
    ownedItemIds: inventory,
    ownedCosmeticIds,
    equippedAvatarId,
    equippedAvatarFrameId,
    streakDays,
    streakLastDate: streakLastDate || null,
    recentQuestionIds: seenIds,
    categoryProgress,
  }), [
    budget,
    careerXp,
    codeReview,
    companyName,
    equippedAvatarFrameId,
    equippedAvatarId,
    gitRevert,
    inventory,
    ownedCosmeticIds,
    rankingOutcomeStats,
    score,
    seenIds,
    serverScaleUp,
    snapshotBackup,
    streakDays,
    streakLastDate,
    correctAnswers,
    wrongAnswers,
    categoryProgress,
  ]);
  latestSaveRef.current = saveSnapshot;

  const isLoaded = Boolean(
    user?.id
    && hydratedUserId === user.id
    && (saveStatus === 'ready' || saveStatus === 'saving' || saveStatus === 'error'),
  );

  const queuePlayerSave = useCallback((userId: string, snapshot: PlayerSaveSnapshot) => {
    const signature = JSON.stringify(snapshot);
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      if (hydratedUserIdRef.current !== userId) return;
      lastAttemptedSignatureRef.current = signature;
      setSaveStatus('saving');
      setSaveError(null);

      try {
        await writeAccountSaveCache(userId, snapshot);
      } catch (error) {
        if (__DEV__) console.warn('[PlayerSave] Hesap yedeği yazılamadı.', error);
      }

      if (!cloudBaselineReadyRef.current) {
        setSaveError('Bulut kayıt doğrulanamadı. Hesap yedeğin bu cihazda korunuyor; bağlantıyı yenileyip tekrar dene.');
        setSaveStatus('error');
        return;
      }

      try {
        await upsertMyPlayerSave(userId, snapshot);
        if (hydratedUserIdRef.current !== userId) return;
        lastPersistedSignatureRef.current = signature;
        setSaveStatus('ready');
      } catch (error) {
        if (hydratedUserIdRef.current !== userId) return;
        setSaveError(getPlayerSaveErrorMessage(error));
        setSaveStatus('error');
      }
    });
    return saveQueueRef.current;
  }, []);

  useEffect(() => {
    const userId = user?.id;
    if (!userId || !isLoaded || hydratedUserId !== userId) return undefined;
    const signature = JSON.stringify(saveSnapshot);
    if (lastPersistedSignatureRef.current === signature) return undefined;
    if (lastAttemptedSignatureRef.current === signature) return undefined;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void queuePlayerSave(userId, saveSnapshot);
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [hydratedUserId, isLoaded, queuePlayerSave, saveSnapshot, user?.id]);

  const flushPlayerSave = useCallback(async () => {
    const userId = user?.id;
    if (!userId || hydratedUserIdRef.current !== userId) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const snapshot = latestSaveRef.current;
    if (lastPersistedSignatureRef.current !== JSON.stringify(snapshot)) {
      await queuePlayerSave(userId, snapshot);
    } else {
      await saveQueueRef.current;
    }
  }, [queuePlayerSave, user?.id]);

  const retryPlayerSave = useCallback(() => {
    if (cloudBaselineReadyRef.current) {
      lastAttemptedSignatureRef.current = '';
      void flushPlayerSave();
      return;
    }
    const userId = user?.id;
    if (!userId) return;
    void writeAccountSaveCache(userId, latestSaveRef.current)
      .catch(() => undefined)
      .finally(retrySaveInitialization);
  }, [flushPlayerSave, retrySaveInitialization, user?.id]);

  const setCorrectAnswersHandler: React.Dispatch<React.SetStateAction<number>> = (action) => {
    setCorrectAnswers((prev) => {
      const nextVal = typeof action === 'function' ? action(prev) : action;
      return nextVal;
    });
  };

  const setWrongAnswersHandler: React.Dispatch<React.SetStateAction<number>> = (action) => {
    setWrongAnswers((prev) => {
      const nextVal = typeof action === 'function' ? action(prev) : action;
      return nextVal;
    });
  };

  const recordRankingOutcomeHandler = useCallback((outcome: RankingOutcome) => {
    const current = rankingOutcomeStatsRef.current;
    const next = advanceRankingOutcomeStats(current, outcome);
    if (next === current) return;

    rankingOutcomeStatsRef.current = next;
    setRankingOutcomeStats(next);
  }, []);

  const setSeenIdsHandler: React.Dispatch<React.SetStateAction<number[]>> = (action) => {
    setSeenIds((prev) => {
      const requested = typeof action === 'function' ? action(prev) : action;
      const nextVal = requested.reduce<number[]>(
        (history, id) => appendRecentQuestionId(history, id, RECENT_QUESTION_HISTORY_LIMIT),
        [],
      );
      seenIdsRef.current = nextVal;
      return nextVal;
    });
  };

  const clearSeenIds = async () => {
    const emptySeenIds: number[] = [];
    seenIdsRef.current = emptySeenIds;
    setSeenIds(emptySeenIds);
  };

  const recordCategoryQuestionAnswer = useCallback((
    categoryId: GameCategoryId,
    star: DifficultyStar,
    questionId: CategoryQuestionId,
    correct: boolean,
  ) => {
    const next = recordCategoryAttempt(categoryProgressRef.current, categoryId, star, questionId, correct);
    categoryProgressRef.current = next;
    setCategoryProgress(next);
  }, []);

  const applyDelta = async (careerXpDelta: number, reputationDelta: number, budgetDelta: number): Promise<Badge[]> => {
    const oldScore = scoreRef.current;
    const oldCareerXp = careerXpRef.current;
    const progression = calculateProgressionOutcome(oldCareerXp, oldScore, careerXpDelta, reputationDelta);
    const newScore = progression.reputation;
    const newCareerXp = progression.careerXp;
    let newBudget = budgetRef.current + budgetDelta;

    const earned = BADGES.filter((badge) => (
      !isBadgeEarned(badge, oldScore, oldCareerXp)
      && isBadgeEarned(badge, newScore, newCareerXp)
    ));

    // YENİ EKLENDİ: Eğer rozet kazanıldıysa, ödül bütçesini de ana bütçeye ekle
    if (earned.length > 0) {
      const totalReward = earned.reduce((sum, badge) => sum + badge.rewardBudget, 0);
      newBudget += totalReward;
      setPendingBadges((prev) => [...prev, ...earned]);
    }

    scoreRef.current = newScore;
    careerXpRef.current = newCareerXp;
    budgetRef.current = newBudget;
    setScore(newScore);
    setCareerXp(newCareerXp);
    setBudget(newBudget);

    return earned;
  };

  const addScore = (amount: number) => applyDelta(0, amount, 0);
  const applyOutcome = (careerXpDelta: number, reputationDelta: number, budgetDelta: number) => (
    applyDelta(careerXpDelta, reputationDelta, budgetDelta)
  );
  const addBudget = (amount: number) => applyDelta(0, 0, amount);
  const dismissBadge = () => setPendingBadges((prev) => prev.slice(1));

  const updateLifelineCount = useCallback((jokerId: JokerId, action: React.SetStateAction<number>) => {
    const current = lifelineInventoryRef.current[jokerId];
    const requested = typeof action === 'function' ? action(current) : action;
    const nextCount = Math.max(0, Math.floor(requested));
    const nextInventory = { ...lifelineInventoryRef.current, [jokerId]: nextCount };
    lifelineInventoryRef.current = nextInventory;

    if (jokerId === 'codeReview') setCodeReviewState(nextCount);
    if (jokerId === 'gitRevert') setGitRevertState(nextCount);
    if (jokerId === 'serverScaleUp') setServerScaleUpState(nextCount);
    if (jokerId === 'snapshotBackup') setSnapshotBackupState(nextCount);

  }, []);

  const setCodeReview = useCallback<React.Dispatch<React.SetStateAction<number>>>(
    (action) => updateLifelineCount('codeReview', action),
    [updateLifelineCount],
  );
  const setGitRevert = useCallback<React.Dispatch<React.SetStateAction<number>>>(
    (action) => updateLifelineCount('gitRevert', action),
    [updateLifelineCount],
  );
  const setServerScaleUp = useCallback<React.Dispatch<React.SetStateAction<number>>>(
    (action) => updateLifelineCount('serverScaleUp', action),
    [updateLifelineCount],
  );
  const setSnapshotBackup = useCallback<React.Dispatch<React.SetStateAction<number>>>(
    (action) => updateLifelineCount('snapshotBackup', action),
    [updateLifelineCount],
  );

  const consumeCodeReview = useCallback(() => {
    setCodeReview((count) => Math.max(0, count - 1));
  }, [setCodeReview]);
  const consumeGitRevert = useCallback(() => {
    setGitRevert((count) => Math.max(0, count - 1));
  }, [setGitRevert]);
  const consumeServerScaleUp = useCallback(() => {
    setServerScaleUp((count) => Math.max(0, count - 1));
  }, [setServerScaleUp]);
  const consumeSnapshotBackup = useCallback(() => {
    setSnapshotBackup((count) => Math.max(0, count - 1));
  }, [setSnapshotBackup]);

  const resetProgress = async () => {
    // 1. Ref'leri sıfırla
    scoreRef.current = DEFAULT_SCORE;
    careerXpRef.current = DEFAULT_CAREER_XP;
    budgetRef.current = DEFAULT_BUDGET;
    inventoryRef.current = [];
    lifelineInventoryRef.current = createDefaultJokerInventory();
    seenIdsRef.current = [];
    rankingOutcomeStatsRef.current = normalizeRankingOutcomeStats(null);
    streakDaysRef.current = [false, false, false, false, false, false, false];
    categoryProgressRef.current = createDefaultCategoryProgress();

    // 2. State'leri sıfırla
    setScore(DEFAULT_SCORE);
    setCareerXp(DEFAULT_CAREER_XP);
    setBudget(DEFAULT_BUDGET);
    setCodeReviewState(DEFAULT_LIFELINE_COUNT);
    setGitRevertState(DEFAULT_LIFELINE_COUNT);
    setServerScaleUpState(DEFAULT_LIFELINE_COUNT);
    setSnapshotBackupState(DEFAULT_LIFELINE_COUNT);
    setUptimeStreak(DEFAULT_UPTIME_STREAK);
    setInventory([]);
    setPendingBadges([]);

    // 3. EKSİK OLANLARI BURAYA EKLE (Kendi değişken isimlerine göre düzelt)
    setCorrectAnswers(DEFAULT_CORRECT_ANSWERS);
    setWrongAnswers(DEFAULT_WRONG_ANSWERS);
    setRankingOutcomeStats(normalizeRankingOutcomeStats(null));
    setSeenIds([]);
    setStreakDays([false, false, false, false, false, false, false]);
    setStreakLastDate('');
    setCategoryProgress(createDefaultCategoryProgress());
  };

  const claimStreakDay = async (): Promise<number> => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;
    // Already claimed today
    if (streakDaysRef.current[dayIdx] || streakLastDate === todayStr) return 0;
    const newDays = [...streakDaysRef.current] as boolean[];
    newDays[dayIdx] = true;
    streakDaysRef.current = newDays;
    setStreakDays(newDays);
    setStreakLastDate(todayStr);
    const reward = STREAK_REWARDS[dayIdx];
    const newBudget = budgetRef.current + reward;
    budgetRef.current = newBudget;
    setBudget(newBudget);
    return reward;
  };

  const setCompanyName = async (name: string) => {
    const normalized = normalizeCompanyName(name);
    setCompanyNameState(normalized);
  };

  const purchaseItem = async (
    itemId: string,
    price: number,
  ): Promise<'ok' | 'insufficient_funds' | 'already_owned'> => {
    if (inventoryRef.current.includes(itemId)) return 'already_owned';
    if (budgetRef.current < price) return 'insufficient_funds';
    const newBudget = budgetRef.current - price;
    budgetRef.current = newBudget;
    setBudget(newBudget);
    const newInventory = [...inventoryRef.current, itemId];
    inventoryRef.current = newInventory;
    setInventory(newInventory);
    return 'ok';
  };

  const purchaseJoker = async (jokerId: JokerId): Promise<JokerPurchaseResult> => {
    if (economyTransactionLockRef.current) return 'busy';
    economyTransactionLockRef.current = true;

    try {
      const rankTier = getRankForCareerXp(careerXpRef.current).current.tier;
      const purchase = planJokerPurchase(budgetRef.current, lifelineInventoryRef.current, jokerId, rankTier);
      if (purchase.status === 'insufficient_funds') return purchase.status;

      budgetRef.current = purchase.budget;
      lifelineInventoryRef.current = purchase.inventory;
      setBudget(purchase.budget);
      setCodeReviewState(purchase.inventory.codeReview);
      setGitRevertState(purchase.inventory.gitRevert);
      setServerScaleUpState(purchase.inventory.serverScaleUp);
      setSnapshotBackupState(purchase.inventory.snapshotBackup);
      return 'ok';
    } finally {
      economyTransactionLockRef.current = false;
    }
  };

  const purchaseCosmetic = async (cosmeticId: CosmeticId): Promise<CosmeticPurchaseResult> => {
    if (economyTransactionLockRef.current) return 'busy';
    economyTransactionLockRef.current = true;

    try {
      const purchase = planCosmeticPurchase(budgetRef.current, ownedCosmeticIdsRef.current, cosmeticId);
      if (purchase.status !== 'ok') return purchase.status;

      budgetRef.current = purchase.budget;
      ownedCosmeticIdsRef.current = purchase.ownedCosmeticIds;
      setBudget(purchase.budget);
      setOwnedCosmeticIds(purchase.ownedCosmeticIds);
      return 'ok';
    } finally {
      economyTransactionLockRef.current = false;
    }
  };

  const equipAvatar = async (cosmeticId: CosmeticId): Promise<CosmeticEquipResult> => {
    if (cosmeticEquipLockRef.current) return 'busy';
    cosmeticEquipLockRef.current = true;

    try {
      const validation = validateCosmeticEquip(ownedCosmeticIdsRef.current, cosmeticId, 'avatar');
      if (validation.status !== 'ok') return validation.status;

      equippedAvatarIdRef.current = validation.cosmetic.id;
      setEquippedAvatarId(validation.cosmetic.id);
      return 'ok';
    } finally {
      cosmeticEquipLockRef.current = false;
    }
  };

  const equipAvatarFrame = async (cosmeticId: CosmeticId): Promise<CosmeticEquipResult> => {
    if (cosmeticEquipLockRef.current) return 'busy';
    cosmeticEquipLockRef.current = true;

    try {
      const validation = validateCosmeticEquip(ownedCosmeticIdsRef.current, cosmeticId, 'avatar_frame');
      if (validation.status !== 'ok') return validation.status;

      equippedAvatarFrameIdRef.current = validation.cosmetic.id;
      setEquippedAvatarFrameId(validation.cosmetic.id);
      return 'ok';
    } finally {
      cosmeticEquipLockRef.current = false;
    }
  };

  const isCosmeticOwned = useCallback(
    (cosmeticId: CosmeticId) => ownedCosmeticIdsRef.current.includes(cosmeticId),
    [],
  );

  const getEquippedCosmetic = useCallback((type: CosmeticType): CosmeticCatalogItem => (
    getCosmeticById(type === 'avatar' ? equippedAvatarIdRef.current : equippedAvatarFrameIdRef.current)
  ), []);

  const value = useMemo<ReputationContextValue>(() => {
    const { current, next } = getRankForCareerXp(careerXp);
    const badges = BADGES.map((badge) => ({ ...badge, earned: isBadgeEarned(badge, score, careerXp) }));
    const rankProgress = getRankProgress(careerXp, current, next);
    const rankingScore = calculateRankingScore(rankingOutcomeStats);
    const dayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    let sc = 0;
    for (let i = dayIdx; i >= 0; i--) {
      if (streakDays[i]) sc++;
      else break;
    }
    return {
      score,
      reputation: score,
      careerXp,
      budget,
      companyName,
      isLoaded,
      saveStatus,
      saveError,
      retrySaveInitialization,
      retryPlayerSave,
      flushPlayerSave,
      currentRank: current,
      nextRank: next,
      rankProgress,
      badges,
      codeReview,
      gitRevert,
      serverScaleUp,
      snapshotBackup,
      uptimeStreak,
      consumeCodeReview,
      consumeGitRevert,
      consumeServerScaleUp,
      consumeSnapshotBackup,
      setUptimeStreak,
      setCodeReview,
      setGitRevert,
      setServerScaleUp,
      setSnapshotBackup,
      inventory,
      ownedCosmeticIds,
      equippedAvatarId,
      equippedAvatarFrameId,
      equippedAvatar: getCosmeticById(equippedAvatarId) as AvatarCosmetic,
      equippedAvatarFrame: getCosmeticById(equippedAvatarFrameId) as AvatarFrameCosmetic,
      purchaseCosmetic,
      equipAvatar,
      equipAvatarFrame,
      isCosmeticOwned,
      getEquippedCosmetic,
      addScore,
      applyOutcome,
      addBudget,
      pendingBadges,
      dismissBadge,
      resetProgress,
      setCompanyName,
      purchaseItem,
      purchaseJoker,
      streakDays,
      todayIndex: dayIdx,
      streakCount: sc,
      claimStreakDay,
      correctAnswers,
      wrongAnswers,
      rankingScore,
      rankingOutcomeStats,
      recordRankingOutcome: recordRankingOutcomeHandler,
      seenIds,
      setCorrectAnswers: setCorrectAnswersHandler,
      setWrongAnswers: setWrongAnswersHandler,
      setSeenIds: setSeenIdsHandler,
      clearSeenIds,
      categoryProgress,
      recordCategoryQuestionAnswer,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    score,
    careerXp,
    budget,
    companyName,
    isLoaded,
    saveStatus,
    saveError,
    pendingBadges,
    codeReview,
    gitRevert,
    serverScaleUp,
    snapshotBackup,
    uptimeStreak,
    inventory,
    ownedCosmeticIds,
    equippedAvatarId,
    equippedAvatarFrameId,
    streakDays,
    correctAnswers,
    wrongAnswers,
    rankingOutcomeStats,
    seenIds,
    categoryProgress,
  ]);

  return <ReputationContext.Provider value={value}>{children}</ReputationContext.Provider>;
}

export function useReputation() {
  const ctx = useContext(ReputationContext);
  if (!ctx) throw new Error('useReputation, ReputationProvider içinde kullanılmalı');
  return ctx;
}
