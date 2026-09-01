import { ACHIEVEMENTS, type AchievementDefinition, type AchievementId } from '../config/achievements';
import { GAME_CATEGORIES, QUESTIONS_PER_TIER, type GameCategoryId } from '../config/gameCategories';
import { RANKS } from '../config/progression';
import {
  getCategoryAttemptedCount,
  getCategoryPassedOperationCount,
  getTierAttemptedCount,
  getTotalPassedOperationCount,
  isTierUnlocked,
  type CategoryProgress,
} from './categoryProgress';

export interface AchievementSnapshot {
  careerXp: number;
  correctAnswers: number;
  wrongAnswers: number;
  categoryProgress: CategoryProgress;
}

export interface DerivedAchievement extends AchievementDefinition {
  earned: boolean;
  progressText: string;
  rewardBudget: 0;
}

interface AchievementState {
  earned: boolean;
  progressText: string;
}

const formatProgress = (current: number, target: number, suffix: string): string => (
  `${Math.min(current, target).toLocaleString('tr-TR')}/${target.toLocaleString('tr-TR')} ${suffix}`
);

export function deriveAchievements(snapshot: AchievementSnapshot): DerivedAchievement[] {
  const totalAnswers = Math.max(0, snapshot.correctAnswers) + Math.max(0, snapshot.wrongAnswers);
  const completedSessions = Math.floor(totalAnswers / 10);
  const categoryTotals = Object.fromEntries(GAME_CATEGORIES.map((category) => [
    category.id,
    getCategoryAttemptedCount(snapshot.categoryProgress, category.id),
  ])) as Record<GameCategoryId, number>;
  const mediumUnlocked = GAME_CATEGORIES.filter((category) => isTierUnlocked(snapshot.categoryProgress, category.id, 2)).length;
  const hardUnlocked = GAME_CATEGORIES.filter((category) => isTierUnlocked(snapshot.categoryProgress, category.id, 3)).length;
  const categoryOperationTotals = Object.fromEntries(GAME_CATEGORIES.map((category) => [
    category.id,
    getCategoryPassedOperationCount(snapshot.categoryProgress, category.id),
  ])) as Record<GameCategoryId, number>;
  const passedOperationTotal = getTotalPassedOperationCount(snapshot.categoryProgress);
  const balancedCategories = GAME_CATEGORIES.filter((category) => categoryTotals[category.id] >= 20).length;
  const advancedCategories = GAME_CATEGORIES.filter((category) => categoryTotals[category.id] >= 40).length;
  const leadThreshold = RANKS.find((rank) => rank.tier === 'lead')?.threshold ?? Number.MAX_SAFE_INTEGER;
  const ctoThreshold = RANKS.find((rank) => rank.tier === 'cto')?.threshold ?? Number.MAX_SAFE_INTEGER;

  const getState = (id: AchievementId): AchievementState => {
    switch (id) {
      case 'first_session':
        return { earned: completedSessions >= 1, progressText: formatProgress(totalAnswers, 10, 'soru') };
      case 'first_correct':
        return { earned: snapshot.correctAnswers >= 1, progressText: formatProgress(snapshot.correctAnswers, 1, 'doğru') };
      case 'comeback_session':
        return { earned: completedSessions >= 5, progressText: formatProgress(completedSessions, 5, 'oturum') };
      case 'first_medium_unlock':
        return { earned: mediumUnlocked >= 1, progressText: formatProgress(mediumUnlocked, 1, 'alan') };
      case 'first_hard_unlock':
        return { earned: hardUnlocked >= 1, progressText: formatProgress(hardUnlocked, 1, 'alan') };
      case 'all_medium_unlocked':
        return { earned: mediumUnlocked === GAME_CATEGORIES.length, progressText: formatProgress(mediumUnlocked, GAME_CATEGORIES.length, 'alan') };
      case 'all_hard_unlocked':
        return { earned: hardUnlocked === GAME_CATEGORIES.length, progressText: formatProgress(hardUnlocked, GAME_CATEGORIES.length, 'alan') };
      case 'web_easy_complete': {
        const progress = getTierAttemptedCount(snapshot.categoryProgress, 'web_programming', 1);
        return { earned: progress >= QUESTIONS_PER_TIER, progressText: formatProgress(progress, QUESTIONS_PER_TIER, 'soru') };
      }
      case 'os_easy_complete': {
        const progress = getTierAttemptedCount(snapshot.categoryProgress, 'operating_systems', 1);
        return { earned: progress >= QUESTIONS_PER_TIER, progressText: formatProgress(progress, QUESTIONS_PER_TIER, 'soru') };
      }
      case 'db_easy_complete': {
        const progress = getTierAttemptedCount(snapshot.categoryProgress, 'database_systems', 1);
        return { earned: progress >= QUESTIONS_PER_TIER, progressText: formatProgress(progress, QUESTIONS_PER_TIER, 'soru') };
      }
      case 'web_mastery':
        return { earned: categoryOperationTotals.web_programming >= 6, progressText: formatProgress(categoryOperationTotals.web_programming, 6, 'operasyon geçti') };
      case 'os_mastery':
        return { earned: categoryOperationTotals.operating_systems >= 6, progressText: formatProgress(categoryOperationTotals.operating_systems, 6, 'operasyon geçti') };
      case 'db_mastery':
        return { earned: categoryOperationTotals.database_systems >= 6, progressText: formatProgress(categoryOperationTotals.database_systems, 6, 'operasyon geçti') };
      case 'full_coverage':
        return { earned: passedOperationTotal >= 18, progressText: formatProgress(passedOperationTotal, 18, 'operasyon geçti') };
      case 'hundred_correct':
        return { earned: snapshot.correctAnswers >= 100, progressText: formatProgress(snapshot.correctAnswers, 100, 'doğru') };
      case 'balanced_operator':
        return { earned: balancedCategories === GAME_CATEGORIES.length, progressText: formatProgress(balancedCategories, GAME_CATEGORIES.length, 'alan') };
      case 'advanced_operator':
        return { earned: advancedCategories === GAME_CATEGORIES.length, progressText: formatProgress(advancedCategories, GAME_CATEGORIES.length, 'alan') };
      case 'team_lead_rank':
        return { earned: snapshot.careerXp >= leadThreshold, progressText: formatProgress(snapshot.careerXp, leadThreshold, 'XP') };
      case 'cto_rank':
        return { earned: snapshot.careerXp >= ctoThreshold, progressText: formatProgress(snapshot.careerXp, ctoThreshold, 'XP') };
    }
  };

  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    ...getState(achievement.id),
    rewardBudget: 0,
  }));
}
