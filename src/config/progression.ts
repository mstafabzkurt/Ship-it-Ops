export type RankTier = 'junior' | 'engineer' | 'senior' | 'lead' | 'manager' | 'director' | 'cto';

export interface Rank {
  id: string;
  name: string;
  /** Permanent Career XP required to reach this rank. */
  threshold: number;
  tier: RankTier;
}

/**
 * Career ladder thresholds. At the initial outcome balance this makes success
 * meaningfully faster than failure while every completed crisis still advances.
 */
export const RANKS: Rank[] = [
  { id: 'junior-i', name: 'Junior Mühendis I', threshold: 0, tier: 'junior' },
  { id: 'junior-ii', name: 'Junior Mühendis II', threshold: 200, tier: 'junior' },
  { id: 'junior-iii', name: 'Junior Mühendis III', threshold: 450, tier: 'junior' },
  { id: 'engineer-i', name: 'Mühendis I', threshold: 800, tier: 'engineer' },
  { id: 'engineer-ii', name: 'Mühendis II', threshold: 1200, tier: 'engineer' },
  { id: 'engineer-iii', name: 'Mühendis III', threshold: 1650, tier: 'engineer' },
  { id: 'senior-i', name: 'Kıdemli Mühendis I', threshold: 2200, tier: 'senior' },
  { id: 'senior-ii', name: 'Kıdemli Mühendis II', threshold: 2800, tier: 'senior' },
  { id: 'senior-iii', name: 'Kıdemli Mühendis III', threshold: 3500, tier: 'senior' },
  { id: 'lead-i', name: 'Takım Lideri I', threshold: 4300, tier: 'lead' },
  { id: 'lead-ii', name: 'Takım Lideri II', threshold: 5200, tier: 'lead' },
  { id: 'lead-iii', name: 'Takım Lideri III', threshold: 6200, tier: 'lead' },
  { id: 'manager-i', name: 'Müh. Müdürü I', threshold: 7300, tier: 'manager' },
  { id: 'manager-ii', name: 'Müh. Müdürü II', threshold: 8500, tier: 'manager' },
  { id: 'manager-iii', name: 'Müh. Müdürü III', threshold: 9800, tier: 'manager' },
  { id: 'director-i', name: 'Direktör I', threshold: 11200, tier: 'director' },
  { id: 'director-ii', name: 'Direktör II', threshold: 12700, tier: 'director' },
  { id: 'director-iii', name: 'Direktör III', threshold: 14300, tier: 'director' },
  { id: 'cto-i', name: 'CTO I', threshold: 16000, tier: 'cto' },
  { id: 'cto-ii', name: 'CTO II', threshold: 17800, tier: 'cto' },
  { id: 'cto-iii', name: 'CTO III', threshold: 19700, tier: 'cto' },
];

export const SESSION_CRISIS_COUNT = 10;
export const RECENT_QUESTION_HISTORY_LIMIT = 15;

function parseStoredProgress(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

export function resolveCareerXpMigration(
  storedCareerXp: string | null | undefined,
  storedLegacyReputation: string | null | undefined,
): { careerXp: number; shouldPersist: boolean } {
  const existingCareerXp = parseStoredProgress(storedCareerXp);
  if (existingCareerXp !== null) return { careerXp: existingCareerXp, shouldPersist: false };
  return {
    careerXp: parseStoredProgress(storedLegacyReputation) ?? 0,
    shouldPersist: true,
  };
}

export function calculateProgressionOutcome(
  currentCareerXp: number,
  currentReputation: number,
  careerXpDelta: number,
  reputationDelta: number,
): { careerXp: number; reputation: number } {
  return {
    careerXp: Math.max(0, currentCareerXp) + Math.max(0, careerXpDelta),
    reputation: Math.max(0, currentReputation + reputationDelta),
  };
}

export function getRankForCareerXp(careerXp: number): { current: Rank; next: Rank | null } {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (careerXp >= rank.threshold) current = rank;
  }
  const currentIndex = RANKS.findIndex((rank) => rank.id === current.id);
  return {
    current,
    next: currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null,
  };
}

export function getRankProgress(careerXp: number, current: Rank, next: Rank | null): number {
  if (!next) return 1;
  const span = next.threshold - current.threshold;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (careerXp - current.threshold) / span));
}
