import {
  GAME_CATEGORIES,
  isGameCategoryId,
  type GameCategoryId,
} from '../config/gameCategories';
import {
  COSMETIC_CATALOG,
  DEFAULT_AVATAR_FRAME_ID,
  DEFAULT_AVATAR_ID,
  type AvatarCosmetic,
  type AvatarCosmeticId,
  type AvatarFrameCosmetic,
  type AvatarFrameCosmeticId,
  type CosmeticId,
} from '../config/cosmetics';
import { DEFAULT_COMPANY_NAME } from '../config/company';
import {
  COMPANY_NAME_MAX_LENGTH,
  validateCompanyName,
} from './companyNameValidation';

export const ONBOARDING_STEP_COUNT = 7;
export const TUTORIAL_STEP_COUNT = 6;
export const MAX_ONBOARDING_COMPANY_NAME_LENGTH = COMPANY_NAME_MAX_LENGTH;

export type InterestAreaId = GameCategoryId;

export interface OnboardingProfileSelection {
  companyName: string;
  avatarId: AvatarCosmeticId;
  avatarFrameId: AvatarFrameCosmeticId;
  selectedInterestAreas: InterestAreaId[];
}

export const INTEREST_AREA_OPTIONS = GAME_CATEGORIES.map(({ id, name, icon }) => ({
  id,
  label: name,
  icon,
}));

export function normalizeInterestAreas(value: unknown): InterestAreaId[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(isGameCategoryId))];
}

export function getStarterAvatars(ownedCosmeticIds: readonly CosmeticId[]): AvatarCosmetic[] {
  return COSMETIC_CATALOG.filter((item): item is AvatarCosmetic => (
    item.type === 'avatar' && item.price === 0 && ownedCosmeticIds.includes(item.id)
  ));
}

export function getStarterFrames(ownedCosmeticIds: readonly CosmeticId[]): AvatarFrameCosmetic[] {
  return COSMETIC_CATALOG.filter((item): item is AvatarFrameCosmetic => (
    item.type === 'avatar_frame' && item.price === 0 && ownedCosmeticIds.includes(item.id)
  ));
}

export function createSkippedOnboardingSelection(): OnboardingProfileSelection {
  return {
    companyName: DEFAULT_COMPANY_NAME,
    avatarId: DEFAULT_AVATAR_ID,
    avatarFrameId: DEFAULT_AVATAR_FRAME_ID,
    selectedInterestAreas: [],
  };
}

export function getOnboardingPanelWidth(viewportWidth: number): number {
  const horizontalInset = viewportWidth >= 700 ? 48 : 0;
  return Math.min(640, Math.max(0, viewportWidth - horizontalInset));
}

export type CompanyNameValidation =
  | { valid: true; value: string }
  | { valid: false; value: ''; message: string };

export function validateOnboardingCompanyName(value: string): CompanyNameValidation {
  const validation = validateCompanyName(value);
  return validation.isValid
    ? { valid: true, value: validation.displayName }
    : { valid: false, value: '', message: validation.message };
}

export function shouldShowTutorial(
  onboardingCompleted: boolean,
  tutorialCompleted: boolean,
  isActiveGameSession: boolean,
): boolean {
  return onboardingCompleted && !tutorialCompleted && !isActiveGameSession;
}
