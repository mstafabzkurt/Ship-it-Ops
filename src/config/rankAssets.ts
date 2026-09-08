import type { ImageSourcePropType } from 'react-native';

import type { RankTier } from './progression';

/**
 * Canonical rank artwork keyed by the progression system's existing tiers.
 * Junior intentionally stays on its vector fallback until assets/rank/junior.png exists.
 */
export const RANK_ICON_ASSETS: Readonly<Record<RankTier, ImageSourcePropType | null>> = {
  junior: require('../../assets/rank/jr.png'),
  engineer: require('../../assets/rank/muh.png'),
  senior: require('../../assets/rank/senior.png'),
  lead: require('../../assets/rank/teamlead.png'),
  manager: require('../../assets/rank/manager.png'),
  director: require('../../assets/rank/director.png'),
  cto: require('../../assets/rank/cto.png'),
};
