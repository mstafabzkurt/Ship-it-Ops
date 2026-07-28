import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Rütbeler -------------------------------------------------------------
// Eşik puanları orijinal tasarımla birebir: 1.280 puan -> "Kıdemli Mühendis",
// sonraki rütbe 2.000 puanda "Takım Lideri".
export interface Rank {
  id: string;
  name: string;
  threshold: number;
}

export const RANKS: Rank[] = [
  { id: 'junior', name: 'Junior Mühendis', threshold: 0 },
  { id: 'engineer', name: 'Mühendis', threshold: 500 },
  { id: 'senior', name: 'Kıdemli Mühendis', threshold: 1000 },
  { id: 'lead', name: 'Takım Lideri', threshold: 2000 },
  { id: 'manager', name: 'Mühendislik Müdürü', threshold: 3500 },
  { id: 'cto', name: 'CTO', threshold: 5000 },
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
  { id: 'first-response', icon: '🧯', title: 'İlk Müdahale', description: 'İlk production krizini çözdün.', requiredScore: 0, rewardBudget: 1500 },
  { id: 'bug-hunter', icon: '🐛', title: 'Hata Avcısı', description: "5 bug'ı başarıyla avladın.", requiredScore: 300, rewardBudget: 3000 },
  { id: 'night-shift', icon: '🌙', title: 'Gece Nöbeti', description: 'Gece yarısı bir kesintiyi çözdün.', requiredScore: 600, rewardBudget: 5000 },
  { id: 'architect', icon: '🏗️', title: 'Mimar', description: 'Bir sistem tasarımı kararını doğru verdin.', requiredScore: 900, rewardBudget: 8000 },
  { id: 'senior-badge', icon: '🎖️', title: 'Kıdemli Mühendis', description: 'Kıdemli Mühendis rütbesine ulaştın.', requiredScore: 1000, rewardBudget: 15000 },
  { id: 'lead-badge', icon: '👑', title: 'Takım Lideri', description: 'Takım Lideri rütbesine ulaş.', requiredScore: 2000, rewardBudget: 30000 },
];

const STORAGE_KEYS = {
  score: '@shipit_score',
  budget: '@shipit_budget',
  companyName: '@shipit_company_name',
  techTokens: '@shipit_tech_tokens',
  inventory: '@shipit_inventory',
} as const;

const DEFAULT_SCORE = 1280; // dashboard-prototip.html içindeki başlangıç değeri
const DEFAULT_BUDGET = 48200; // "$48.200"
const DEFAULT_COMPANY_NAME = 'ShipIt Inc.';
const DEFAULT_TECH_TOKENS = 200; // Başlangıç TechToken miktarı

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
      } catch (error) {
        console.error('İtibar verisi yüklenirken hata:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

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
    scoreRef.current = DEFAULT_SCORE;
    budgetRef.current = DEFAULT_BUDGET;
    techTokensRef.current = DEFAULT_TECH_TOKENS;
    inventoryRef.current = [];
    setScore(DEFAULT_SCORE);
    setBudget(DEFAULT_BUDGET);
    setTechTokens(DEFAULT_TECH_TOKENS);
    setInventory([]);
    setPendingBadges([]);
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.score,
        STORAGE_KEYS.budget,
        STORAGE_KEYS.techTokens,
        STORAGE_KEYS.inventory,
      ]);
    } catch (error) {
      console.error('İlerleme sıfırlanırken hata:', error);
    }
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, budget, companyName, isLoaded, pendingBadges, techTokens, inventory]);

  return <ReputationContext.Provider value={value}>{children}</ReputationContext.Provider>;
}

export function useReputation() {
  const ctx = useContext(ReputationContext);
  if (!ctx) throw new Error('useReputation, ReputationProvider içinde kullanılmalı');
  return ctx;
}
