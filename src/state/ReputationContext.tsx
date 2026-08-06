import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Rütbeler -------------------------------------------------------------
// 21 aşamalı kademeli sistem: her ana rütbenin I/II/III alt kademeleri var.
export interface Rank {
  id: string;
  name: string;
  threshold: number;
  /** Ana rütbe grubu (ikon/renk seçimi için) */
  tier: 'junior' | 'engineer' | 'senior' | 'lead' | 'manager' | 'director' | 'cto';
}

export const RANKS: Rank[] = [
  // --- Junior Mühendis (0 – 200) ---
  { id: 'junior-i', name: 'Junior Mühendis I', threshold: 0, tier: 'junior' },
  { id: 'junior-ii', name: 'Junior Mühendis II', threshold: 100, tier: 'junior' },
  { id: 'junior-iii', name: 'Junior Mühendis III', threshold: 200, tier: 'junior' },
  // --- Mühendis (300 – 700) ---
  { id: 'engineer-i', name: 'Mühendis I', threshold: 300, tier: 'engineer' },
  { id: 'engineer-ii', name: 'Mühendis II', threshold: 500, tier: 'engineer' },
  { id: 'engineer-iii', name: 'Mühendis III', threshold: 700, tier: 'engineer' },
  // --- Kıdemli Mühendis (1000 – 1600) ---
  { id: 'senior-i', name: 'Kıdemli Mühendis I', threshold: 1000, tier: 'senior' },
  { id: 'senior-ii', name: 'Kıdemli Mühendis II', threshold: 1300, tier: 'senior' },
  { id: 'senior-iii', name: 'Kıdemli Mühendis III', threshold: 1600, tier: 'senior' },
  // --- Takım Lideri (2000 – 2800) ---
  { id: 'lead-i', name: 'Takım Lideri I', threshold: 2000, tier: 'lead' },
  { id: 'lead-ii', name: 'Takım Lideri II', threshold: 2400, tier: 'lead' },
  { id: 'lead-iii', name: 'Takım Lideri III', threshold: 2800, tier: 'lead' },
  // --- Mühendislik Müdürü (3300 – 4300) ---
  { id: 'manager-i', name: 'Müh. Müdürü I', threshold: 3300, tier: 'manager' },
  { id: 'manager-ii', name: 'Müh. Müdürü II', threshold: 3800, tier: 'manager' },
  { id: 'manager-iii', name: 'Müh. Müdürü III', threshold: 4300, tier: 'manager' },
  // --- Direktör (4900 – 6100) ---
  { id: 'director-i', name: 'Direktör I', threshold: 4900, tier: 'director' },
  { id: 'director-ii', name: 'Direktör II', threshold: 5500, tier: 'director' },
  { id: 'director-iii', name: 'Direktör III', threshold: 6100, tier: 'director' },
  // --- CTO (6800 – 8200+) ---
  { id: 'cto-i', name: 'CTO I', threshold: 6800, tier: 'cto' },
  { id: 'cto-ii', name: 'CTO II', threshold: 7500, tier: 'cto' },
  { id: 'cto-iii', name: 'CTO III', threshold: 8200, tier: 'cto' },
];

// --- Rozetler ---------------------------------------------------------------
export interface Badge {
  id: string;
  icon: string;
  title: string;
  description: string;
  requiredScore: number;
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
  { id: 'lead-badge', icon: '🎖️', title: 'Takım Lideri', description: 'Takım Lideri rütbesine ulaştın. Ekip seni izliyor.', requiredScore: 4000, rewardBudget: 25000 },
  { id: 'mentor', icon: '🎓', title: 'Mentor', description: 'Bir junior mühendise 10 PR review yaptın.', requiredScore: 5000, rewardBudget: 20000 },
  { id: 'sre-guardian', icon: '🛡️', title: 'SRE Bekçisi', description: "99.9% uptime'ı 3 ay üst üste korudun.", requiredScore: 6000, rewardBudget: 30000 },
  { id: 'platform-builder', icon: '🔧', title: 'Platform Mimarı', description: 'Tüm takımın kullandığı dahili bir araç geliştirdin.', requiredScore: 7500, rewardBudget: 40000 },
  // ── Efsane (10.000+) ──────────────────────────────────────────────────────
  { id: 'director-badge', icon: '🌟', title: 'Direktör', description: 'Direktör rütbesine ulaştın. Şirket stratejisini şekillendiriyorsun.', requiredScore: 10000, rewardBudget: 60000 },
  { id: 'chaos-engineer', icon: '🌪️', title: 'Kaos Mühendisi', description: 'Chaos Engineering senaryosu tasarlayıp uyguladın.', requiredScore: 14000, rewardBudget: 75000 },
  { id: 'cto-badge', icon: '👑', title: 'CTO', description: 'Teknoloji vizyonunu tüm şirkete mal ettin. Efsane.', requiredScore: 15000, rewardBudget: 100000 },
];

const STORAGE_KEYS = {
  score: '@shipit_score',
  budget: '@shipit_budget',
  companyName: '@shipit_company_name',
  techTokens: '@shipit_tech_tokens',
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
const DEFAULT_BUDGET = 1000;
const DEFAULT_COMPANY_NAME = 'ShipIt Inc.';
const DEFAULT_TECH_TOKENS = 0;
const DEFAULT_CORRECT_ANSWERS = 0;
const DEFAULT_WRONG_ANSWERS = 0;
const DEFAULT_SEEN_IDS: number[] = [];

export function getCompanyInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'S';
}

// --- Türetilmiş yardımcılar ---------------------------------------------------
export function getRankForScore(score: number): { current: Rank; next: Rank | null } {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (score >= rank.threshold) current = rank;
  }
  const currentIndex = RANKS.findIndex((r) => r.id === current.id);
  const next = currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;
  return { current, next };
}

function getRankProgress(score: number, current: Rank, next: Rank | null): number {
  if (!next) return 1;
  const span = next.threshold - current.threshold;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (score - current.threshold) / span));
}

// --- Context -------------------------------------------------------------
interface ReputationContextValue {
  score: number;
  budget: number;
  companyName: string;
  isLoaded: boolean;
  currentRank: Rank;
  nextRank: Rank | null;
  rankProgress: number; // 0-1 arası, ekranın kendi hesap yapmasına gerek yok
  badges: (Badge & { earned: boolean })[];
  /** Premium para birimi: TechToken (tt) */
  techTokens: number;
  /** Satın alınan öğelerin ID listesi */
  inventory: string[];
  /** Sadece skoru değiştirir, o çağrıda yeni kazanılan rozetleri döner. */
  addScore: (amount: number) => Promise<Badge[]>;
  /** Bir senaryo/olay sonucunda hem skoru hem bütçeyi tek çağrıda günceller. */
  applyOutcome: (scoreDelta: number, budgetDelta: number) => Promise<Badge[]>;
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
   * @param currency 'budget' → şirket bütçesi, 'tt' → TechToken
   * @param price    Öğenin fiyatı
   * @returns 'ok' | 'insufficient_funds' | 'already_owned'
   */
  purchaseItem: (itemId: string, currency: 'budget' | 'tt', price: number) => Promise<'ok' | 'insufficient_funds' | 'already_owned'>;
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
}

const ReputationContext = createContext<ReputationContextValue | null>(null);

export function ReputationProvider({ children }: { children: React.ReactNode }) {
  const [score, setScore] = useState(DEFAULT_SCORE);
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [companyName, setCompanyNameState] = useState(DEFAULT_COMPANY_NAME);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingBadges, setPendingBadges] = useState<Badge[]>([]);
  const [techTokens, setTechTokens] = useState(DEFAULT_TECH_TOKENS);
  const [inventory, setInventory] = useState<string[]>([]);
  const techTokensRef = useRef(DEFAULT_TECH_TOKENS);
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
  const budgetRef = useRef(budget);

  // Uygulama açıldığında tüm kalıcı verileri hafızadan çek
  useEffect(() => {
    const load = async () => {
      try {
        const results = await AsyncStorage.multiGet([
          STORAGE_KEYS.score,
          STORAGE_KEYS.budget,
          STORAGE_KEYS.companyName,
          STORAGE_KEYS.techTokens,
          STORAGE_KEYS.inventory,
          STORAGE_KEYS.streakDays,
          STORAGE_KEYS.streakLastDate,
          STORAGE_KEYS.seenIds,
          STORAGE_KEYS.correctAnswers,
          STORAGE_KEYS.wrongAnswers,
        ]);
        const storedMap = Object.fromEntries(results.map(([k, v]) => [k, v]));

        const storedScore = storedMap[STORAGE_KEYS.score];
        if (storedScore !== null && storedScore !== undefined) {
          const parsed = parseInt(storedScore, 10);
          scoreRef.current = parsed;
          setScore(parsed);
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
        const storedTechTokens = storedMap[STORAGE_KEYS.techTokens];
        if (storedTechTokens !== null && storedTechTokens !== undefined) {
          const parsed = parseInt(storedTechTokens, 10);
          techTokensRef.current = parsed;
          setTechTokens(parsed);
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
            seenIdsRef.current = parsed;
            setSeenIds(parsed);
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
      const nextVal = typeof action === 'function' ? action(prev) : action;
      seenIdsRef.current = nextVal;
      AsyncStorage.setItem(STORAGE_KEYS.seenIds, JSON.stringify(nextVal)).catch((e) =>
        console.error('Görülen IDler kaydedilemedi:', e)
      );
      return nextVal;
    });
  };

  const applyDelta = async (scoreDelta: number, budgetDelta: number): Promise<Badge[]> => {
    const oldScore = scoreRef.current;
    const newScore = Math.max(0, oldScore + scoreDelta);
    let newBudget = budgetRef.current + budgetDelta;

    // YENİ KAZANILAN ROZETLERİ BUL
    const earned = BADGES.filter((b) => oldScore < b.requiredScore && newScore >= b.requiredScore);

    // YENİ EKLENDİ: Eğer rozet kazanıldıysa, ödül bütçesini de ana bütçeye ekle
    if (earned.length > 0) {
      const totalReward = earned.reduce((sum, badge) => sum + badge.rewardBudget, 0);
      newBudget += totalReward;
      setPendingBadges((prev) => [...prev, ...earned]);
    }

    scoreRef.current = newScore;
    budgetRef.current = newBudget;
    setScore(newScore);
    setBudget(newBudget);

    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.score, String(newScore)],
        [STORAGE_KEYS.budget, String(newBudget)],
      ]);
    } catch (error) {
      console.error('İtibar verisi kaydedilirken hata:', error);
    }

    return earned;
  };

  const addScore = (amount: number) => applyDelta(amount, 0);
  const applyOutcome = (scoreDelta: number, budgetDelta: number) => applyDelta(scoreDelta, budgetDelta);
  const dismissBadge = () => setPendingBadges((prev) => prev.slice(1));

  const resetProgress = async () => {
    // 1. Ref'leri sıfırla
    scoreRef.current = DEFAULT_SCORE;
    budgetRef.current = DEFAULT_BUDGET;
    techTokensRef.current = DEFAULT_TECH_TOKENS;
    inventoryRef.current = [];
    seenIdsRef.current = DEFAULT_SEEN_IDS;
    correctAnswersRef.current = DEFAULT_CORRECT_ANSWERS;
    wrongAnswersRef.current = DEFAULT_WRONG_ANSWERS;

    // 2. State'leri sıfırla
    setScore(DEFAULT_SCORE);
    setBudget(DEFAULT_BUDGET);
    setTechTokens(DEFAULT_TECH_TOKENS);
    setInventory([]);
    setPendingBadges([]);

    // 3. EKSİK OLANLARI BURAYA EKLE (Kendi değişken isimlerine göre düzelt)
    setCorrectAnswers(DEFAULT_CORRECT_ANSWERS);
    setWrongAnswers(DEFAULT_WRONG_ANSWERS);
    setSeenIds(DEFAULT_SEEN_IDS);

    try {
      // 3. AsyncStorage'dan tüm ilerlemeyi temizle
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.score,
        STORAGE_KEYS.budget,
        STORAGE_KEYS.techTokens,
        STORAGE_KEYS.inventory,
        STORAGE_KEYS.streakDays,
        STORAGE_KEYS.streakLastDate,
        STORAGE_KEYS.seenIds,

        STORAGE_KEYS.correctAnswers,
        STORAGE_KEYS.wrongAnswers,
      ]);

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
    currency: 'budget' | 'tt',
    price: number,
  ): Promise<'ok' | 'insufficient_funds' | 'already_owned'> => {
    if (inventoryRef.current.includes(itemId)) return 'already_owned';
    if (currency === 'budget') {
      if (budgetRef.current < price) return 'insufficient_funds';
      const newBudget = budgetRef.current - price;
      budgetRef.current = newBudget;
      setBudget(newBudget);
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.budget, String(newBudget));
      } catch (e) {
        console.error('Bütçe kaydedilemedi:', e);
      }
    } else {
      if (techTokensRef.current < price) return 'insufficient_funds';
      const newTt = techTokensRef.current - price;
      techTokensRef.current = newTt;
      setTechTokens(newTt);
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.techTokens, String(newTt));
      } catch (e) {
        console.error('TechToken kaydedilemedi:', e);
      }
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
    const { current, next } = getRankForScore(score);
    const badges = BADGES.map((b) => ({ ...b, earned: score >= b.requiredScore }));
    const rankProgress = getRankProgress(score, current, next);
    const dayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    let sc = 0;
    for (let i = dayIdx; i >= 0; i--) {
      if (streakDays[i]) sc++;
      else break;
    }
    return {
      score,
      budget,
      companyName,
      isLoaded,
      currentRank: current,
      nextRank: next,
      rankProgress,
      badges,
      techTokens,
      inventory,
      addScore,
      applyOutcome,
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    score,
    budget,
    companyName,
    isLoaded,
    pendingBadges,
    techTokens,
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
