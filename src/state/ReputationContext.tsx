import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  RECENT_QUESTION_HISTORY_LIMIT,
  RANKS,
  calculateProgressionOutcome,
  getRankForCareerXp,
  getRankProgress,
  resolveCareerXpMigration,
  type Rank,
} from '../config/progression';
import { appendRecentQuestionId } from '../utils/questionSelection';

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

const STORAGE_KEYS = {
  score: '@shipit_score',
  careerXp: '@shipit_career_xp',
  budget: '@shipit_budget',
  companyName: '@shipit_company_name',
  inventory: '@shipit_inventory',
  streakDays: '@shipit_streak_days',
  streakLastDate: '@shipit_streak_last_date',
  seenIds: '@shipit_seen_ids',
  correctAnswers: '@shipit_correct_answers',
  wrongAnswers: '@shipit_wrong_answers',
} as const;

// Streak day rewards (index = day number 0-6 = Mon-Sun)
export const STREAK_REWARDS = [200, 400, 600, 800, 1000, 1200, 1500] as const;

const DEFAULT_SCORE = 0;
const DEFAULT_CAREER_XP = 0;
const DEFAULT_BUDGET = 1000;
const DEFAULT_COMPANY_NAME = 'ShipIt Inc.';
const DEFAULT_LIFELINE_COUNT = 3;
const DEFAULT_UPTIME_STREAK = 0;
const DEFAULT_CORRECT_ANSWERS = 0;
const DEFAULT_WRONG_ANSWERS = 0;
const DEFAULT_SEEN_IDS: number[] = [];

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
}

const ReputationContext = createContext<ReputationContextValue | null>(null);

export function ReputationProvider({ children }: { children: React.ReactNode }) {
  const [score, setScore] = useState(DEFAULT_SCORE);
  const [careerXp, setCareerXp] = useState(DEFAULT_CAREER_XP);
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [companyName, setCompanyNameState] = useState(DEFAULT_COMPANY_NAME);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingBadges, setPendingBadges] = useState<Badge[]>([]);
  const [codeReview, setCodeReview] = useState(DEFAULT_LIFELINE_COUNT);
  const [gitRevert, setGitRevert] = useState(DEFAULT_LIFELINE_COUNT);
  const [serverScaleUp, setServerScaleUp] = useState(DEFAULT_LIFELINE_COUNT);
  const [snapshotBackup, setSnapshotBackup] = useState(DEFAULT_LIFELINE_COUNT);
  const [uptimeStreak, setUptimeStreak] = useState(DEFAULT_UPTIME_STREAK);
  const [inventory, setInventory] = useState<string[]>([]);
  const inventoryRef = useRef<string[]>([]);

  // User statistics & game incident state
  const [correctAnswers, setCorrectAnswers] = useState<number>(DEFAULT_CORRECT_ANSWERS);
  const [wrongAnswers, setWrongAnswers] = useState<number>(DEFAULT_WRONG_ANSWERS);
  const [seenIds, setSeenIds] = useState<number[]>(DEFAULT_SEEN_IDS);

  const seenIdsRef = useRef<number[]>(DEFAULT_SEEN_IDS);
  const correctAnswersRef = useRef<number>(DEFAULT_CORRECT_ANSWERS);
  const wrongAnswersRef = useRef<number>(DEFAULT_WRONG_ANSWERS);


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

  // Uygulama açıldığında tüm kalıcı verileri hafızadan çek
  useEffect(() => {
    const load = async () => {
      try {
        const results = await AsyncStorage.multiGet([
          STORAGE_KEYS.score,
          STORAGE_KEYS.careerXp,
          STORAGE_KEYS.budget,
          STORAGE_KEYS.companyName,
          STORAGE_KEYS.inventory,
          STORAGE_KEYS.streakDays,
          STORAGE_KEYS.streakLastDate,
          STORAGE_KEYS.seenIds,
          STORAGE_KEYS.correctAnswers,
          STORAGE_KEYS.wrongAnswers,
        ]);
        const storedMap = Object.fromEntries(results.map(([k, v]) => [k, v]));

        const storedScore = storedMap[STORAGE_KEYS.score];
        let loadedReputation = DEFAULT_SCORE;
        if (storedScore !== null && storedScore !== undefined) {
          const parsed = parseInt(storedScore, 10);
          if (!isNaN(parsed)) {
            loadedReputation = Math.max(0, parsed);
            scoreRef.current = loadedReputation;
            setScore(loadedReputation);
          }
        }
        const careerXpMigration = resolveCareerXpMigration(
          storedMap[STORAGE_KEYS.careerXp],
          storedScore,
        );
        careerXpRef.current = careerXpMigration.careerXp;
        setCareerXp(careerXpMigration.careerXp);
        if (careerXpMigration.shouldPersist) {
          // One-time backward-compatible migration preserves the rank implied
          // by the legacy reputation value without changing that reputation.
          await AsyncStorage.setItem(STORAGE_KEYS.careerXp, String(careerXpMigration.careerXp));
        }
        const storedBudget = storedMap[STORAGE_KEYS.budget];
        if (storedBudget !== null && storedBudget !== undefined) {
          const parsed = parseInt(storedBudget, 10);
          budgetRef.current = parsed;
          setBudget(parsed);
        }
        const storedCompanyName = storedMap[STORAGE_KEYS.companyName];
        if (storedCompanyName !== null && storedCompanyName !== undefined && storedCompanyName.trim()) {
          setCompanyNameState(storedCompanyName);
        }
        const storedInventory = storedMap[STORAGE_KEYS.inventory];
        if (storedInventory !== null && storedInventory !== undefined) {
          const parsed: string[] = JSON.parse(storedInventory);
          inventoryRef.current = parsed;
          setInventory(parsed);
        }
        const storedSeenIds = storedMap[STORAGE_KEYS.seenIds];
        if (storedSeenIds !== null && storedSeenIds !== undefined) {
          try {
            const parsed: number[] = JSON.parse(storedSeenIds);
            const recent = parsed.filter((id) => Number.isInteger(id)).slice(-RECENT_QUESTION_HISTORY_LIMIT);
            seenIdsRef.current = recent;
            setSeenIds(recent);
            if (recent.length !== parsed.length) {
              await AsyncStorage.setItem(STORAGE_KEYS.seenIds, JSON.stringify(recent));
            }
          } catch (_) { }
        }
        const storedCorrect = storedMap[STORAGE_KEYS.correctAnswers];
        if (storedCorrect !== null && storedCorrect !== undefined) {
          const parsed = parseInt(storedCorrect, 10);
          if (!isNaN(parsed)) {
            correctAnswersRef.current = parsed;
            setCorrectAnswers(parsed);
          }
        }
        const storedWrong = storedMap[STORAGE_KEYS.wrongAnswers];
        if (storedWrong !== null && storedWrong !== undefined) {
          const parsed = parseInt(storedWrong, 10);
          if (!isNaN(parsed)) {
            wrongAnswersRef.current = parsed;
            setWrongAnswers(parsed);
          }
        }
        const storedStreakDays = storedMap[STORAGE_KEYS.streakDays];
        if (storedStreakDays !== null && storedStreakDays !== undefined) {
          const parsed: boolean[] = JSON.parse(storedStreakDays);
          // If stored, check if we need to reset for a new week
          const storedLastDate = storedMap[STORAGE_KEYS.streakLastDate] ?? '';
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
          // Reset streak array if last date was from a different week (Monday)
          const lastDate = storedLastDate ? new Date(storedLastDate) : null;
          const isSameWeek = lastDate
            ? (() => {
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - dayOfWeek);
              startOfWeek.setHours(0, 0, 0, 0);
              return lastDate >= startOfWeek;
            })()
            : false;
          if (isSameWeek) {
            streakDaysRef.current = parsed;
            setStreakDays(parsed);
            setStreakLastDate(storedLastDate);
          } else {
            // New week — reset
            const fresh = [false, false, false, false, false, false, false];
            streakDaysRef.current = fresh;
            setStreakDays(fresh);
            setStreakLastDate('');
            try {
              await AsyncStorage.multiSet([
                [STORAGE_KEYS.streakDays, JSON.stringify(fresh)],
                [STORAGE_KEYS.streakLastDate, ''],
              ]);
            } catch (_) { }
          }
        }
      } catch (error) {
        console.error('İtibar verisi yüklenirken hata:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  const setCorrectAnswersHandler: React.Dispatch<React.SetStateAction<number>> = (action) => {
    setCorrectAnswers((prev) => {
      const nextVal = typeof action === 'function' ? action(prev) : action;
      correctAnswersRef.current = nextVal;
      AsyncStorage.setItem(STORAGE_KEYS.correctAnswers, String(nextVal)).catch((e) =>
        console.error('Doğru cevap sayısı kaydedilemedi:', e)
      );
      return nextVal;
    });
  };

  const setWrongAnswersHandler: React.Dispatch<React.SetStateAction<number>> = (action) => {
    setWrongAnswers((prev) => {
      const nextVal = typeof action === 'function' ? action(prev) : action;
      wrongAnswersRef.current = nextVal;
      AsyncStorage.setItem(STORAGE_KEYS.wrongAnswers, String(nextVal)).catch((e) =>
        console.error('Yanlış cevap sayısı kaydedilemedi:', e)
      );
      return nextVal;
    });
  };

  const setSeenIdsHandler: React.Dispatch<React.SetStateAction<number[]>> = (action) => {
    setSeenIds((prev) => {
      const requested = typeof action === 'function' ? action(prev) : action;
      const nextVal = requested.reduce<number[]>(
        (history, id) => appendRecentQuestionId(history, id, RECENT_QUESTION_HISTORY_LIMIT),
        [],
      );
      seenIdsRef.current = nextVal;
      AsyncStorage.setItem(STORAGE_KEYS.seenIds, JSON.stringify(nextVal)).catch((e) =>
        console.error('Görülen IDler kaydedilemedi:', e)
      );
      return nextVal;
    });
  };

  const clearSeenIds = async () => {
    const emptySeenIds: number[] = [];
    seenIdsRef.current = emptySeenIds;
    setSeenIds(emptySeenIds);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.seenIds, JSON.stringify(emptySeenIds));
    } catch (error) {
      console.error('Görülen soru IDleri temizlenemedi:', error);
    }
  };

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

    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.score, String(newScore)],
        [STORAGE_KEYS.careerXp, String(newCareerXp)],
        [STORAGE_KEYS.budget, String(newBudget)],
      ]);
    } catch (error) {
      console.error('İtibar verisi kaydedilirken hata:', error);
    }

    return earned;
  };

  const addScore = (amount: number) => applyDelta(0, amount, 0);
  const applyOutcome = (careerXpDelta: number, reputationDelta: number, budgetDelta: number) => (
    applyDelta(careerXpDelta, reputationDelta, budgetDelta)
  );
  const addBudget = (amount: number) => applyDelta(0, 0, amount);
  const dismissBadge = () => setPendingBadges((prev) => prev.slice(1));
  const consumeCodeReview = useCallback(() => {
    setCodeReview((count) => Math.max(0, count - 1));
  }, []);
  const consumeGitRevert = useCallback(() => {
    setGitRevert((count) => Math.max(0, count - 1));
  }, []);
  const consumeServerScaleUp = useCallback(() => {
    setServerScaleUp((count) => Math.max(0, count - 1));
  }, []);
  const consumeSnapshotBackup = useCallback(() => {
    setSnapshotBackup((count) => Math.max(0, count - 1));
  }, []);

  const resetProgress = async () => {
    // 1. Ref'leri sıfırla
    scoreRef.current = DEFAULT_SCORE;
    careerXpRef.current = DEFAULT_CAREER_XP;
    budgetRef.current = DEFAULT_BUDGET;
    inventoryRef.current = [];
    seenIdsRef.current = [];
    correctAnswersRef.current = DEFAULT_CORRECT_ANSWERS;
    wrongAnswersRef.current = DEFAULT_WRONG_ANSWERS;

    // 2. State'leri sıfırla
    setScore(DEFAULT_SCORE);
    setCareerXp(DEFAULT_CAREER_XP);
    setBudget(DEFAULT_BUDGET);
    setCodeReview(DEFAULT_LIFELINE_COUNT);
    setGitRevert(DEFAULT_LIFELINE_COUNT);
    setServerScaleUp(DEFAULT_LIFELINE_COUNT);
    setSnapshotBackup(DEFAULT_LIFELINE_COUNT);
    setUptimeStreak(DEFAULT_UPTIME_STREAK);
    setInventory([]);
    setPendingBadges([]);

    // 3. EKSİK OLANLARI BURAYA EKLE (Kendi değişken isimlerine göre düzelt)
    setCorrectAnswers(DEFAULT_CORRECT_ANSWERS);
    setWrongAnswers(DEFAULT_WRONG_ANSWERS);
    setSeenIds([]);

    try {
      // 3. AsyncStorage'dan tüm ilerlemeyi temizle
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.score,
        STORAGE_KEYS.careerXp,
        STORAGE_KEYS.budget,
        STORAGE_KEYS.inventory,
        STORAGE_KEYS.streakDays,
        STORAGE_KEYS.streakLastDate,
        STORAGE_KEYS.seenIds,
        STORAGE_KEYS.correctAnswers,
        STORAGE_KEYS.wrongAnswers,
        '@shipit_theme_id', // Reset active theme back to default
      ]);
      // Persist an explicit empty list so no stale seen IDs can be restored.
      await AsyncStorage.setItem(STORAGE_KEYS.seenIds, JSON.stringify([]));

      console.log('Tertemiz sıfırlandı!');
    } catch (error) {
      console.error('İlerleme sıfırlanırken hata:', error);
    }
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
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.streakDays, JSON.stringify(newDays)],
        [STORAGE_KEYS.streakLastDate, todayStr],
        [STORAGE_KEYS.budget, String(newBudget)],
      ]);
    } catch (e) {
      console.error('Streak kaydedilemedi:', e);
    }
    return reward;
  };

  const setCompanyName = async (name: string) => {
    const trimmed = name.trim() || DEFAULT_COMPANY_NAME;
    setCompanyNameState(trimmed);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.companyName, trimmed);
    } catch (error) {
      console.error('Şirket adı kaydedilirken hata:', error);
    }
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
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.budget, String(newBudget));
    } catch (e) {
      console.error('Bütçe kaydedilemedi:', e);
    }
    const newInventory = [...inventoryRef.current, itemId];
    inventoryRef.current = newInventory;
    setInventory(newInventory);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(newInventory));
    } catch (e) {
      console.error('Envanter kaydedilemedi:', e);
    }
    return 'ok';
  };

  const value = useMemo<ReputationContextValue>(() => {
    const { current, next } = getRankForCareerXp(careerXp);
    const badges = BADGES.map((badge) => ({ ...badge, earned: isBadgeEarned(badge, score, careerXp) }));
    const rankProgress = getRankProgress(careerXp, current, next);
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
      addScore,
      applyOutcome,
      addBudget,
      pendingBadges,
      dismissBadge,
      resetProgress,
      setCompanyName,
      purchaseItem,
      streakDays,
      todayIndex: dayIdx,
      streakCount: sc,
      claimStreakDay,
      correctAnswers,
      wrongAnswers,
      seenIds,
      setCorrectAnswers: setCorrectAnswersHandler,
      setWrongAnswers: setWrongAnswersHandler,
      setSeenIds: setSeenIdsHandler,
      clearSeenIds,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    score,
    careerXp,
    budget,
    companyName,
    isLoaded,
    pendingBadges,
    codeReview,
    gitRevert,
    serverScaleUp,
    snapshotBackup,
    uptimeStreak,
    inventory,
    streakDays,
    correctAnswers,
    wrongAnswers,
    seenIds,
  ]);

  return <ReputationContext.Provider value={value}>{children}</ReputationContext.Provider>;
}

export function useReputation() {
  const ctx = useContext(ReputationContext);
  if (!ctx) throw new Error('useReputation, ReputationProvider içinde kullanılmalı');
  return ctx;
}
