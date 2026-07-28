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
} as const;

const DEFAULT_SCORE = 1280; // dashboard-prototip.html içindeki başlangıç değeri
const DEFAULT_BUDGET = 48200; // "$48.200"
const DEFAULT_COMPANY_NAME = 'ShipIt Inc.';

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
}

const ReputationContext = createContext<ReputationContextValue | null>(null);

export function ReputationProvider({ children }: { children: React.ReactNode }) {
  const [score, setScore] = useState(DEFAULT_SCORE);
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [companyName, setCompanyNameState] = useState(DEFAULT_COMPANY_NAME);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingBadges, setPendingBadges] = useState<Badge[]>([]);

  // score/budget'in "şu anki" değerini ref'te tutuyoruz; addScore/applyOutcome
  // arka arkaya (aynı render arasında) çağrılsa bile state'in henüz commit
  // edilmemiş olmasından kaynaklanan stale-closure riski olmadan doğru
  // eski değeri okuyup rozet farkını buradan hesaplıyoruz.
  const scoreRef = useRef(score);
  const budgetRef = useRef(budget);

  // Uygulama açıldığında skoru ve bütçeyi hafızadan çek
  useEffect(() => {
    const load = async () => {
      try {
        const [[, storedScore], [, storedBudget], [, storedCompanyName]] = await AsyncStorage.multiGet([
          STORAGE_KEYS.score,
          STORAGE_KEYS.budget,
          STORAGE_KEYS.companyName,
        ]);
        if (storedScore !== null) {
          const parsed = parseInt(storedScore, 10);
          scoreRef.current = parsed;
          setScore(parsed);
        }
        if (storedBudget !== null) {
          const parsed = parseInt(storedBudget, 10);
          budgetRef.current = parsed;
          setBudget(parsed);
        }
        if (storedCompanyName !== null && storedCompanyName.trim()) {
          setCompanyNameState(storedCompanyName);
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
    setScore(DEFAULT_SCORE);
    setBudget(DEFAULT_BUDGET);
    setPendingBadges([]);
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.score, STORAGE_KEYS.budget]);
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
      addScore,
      applyOutcome,
      pendingBadges,
      dismissBadge,
      resetProgress,
      setCompanyName,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, budget, companyName, isLoaded, pendingBadges]);

  return <ReputationContext.Provider value={value}>{children}</ReputationContext.Provider>;
}

export function useReputation() {
  const ctx = useContext(ReputationContext);
  if (!ctx) throw new Error('useReputation, ReputationProvider içinde kullanılmalı');
  return ctx;
}
