import type { ImageSourcePropType } from 'react-native';

import type { RankTier } from './progression';

/**
 * Canonical rank artwork keyed by progression tier. I, II and III share one image.
 */
export const RANK_ICON_ASSETS: Readonly<Record<RankTier, ImageSourcePropType | null>> = {
  junior: require('../../assets/rank/junior-v2-256.png'),
  engineer: require('../../assets/rank/engineer-v2-256.png'),
  senior: require('../../assets/rank/senior-v2-256.png'),
  lead: require('../../assets/rank/lead-v2-256.png'),
  manager: require('../../assets/rank/manager-v2-256.png'),
  director: require('../../assets/rank/director-v2-256.png'),
  cto: require('../../assets/rank/cto-v2-256.png'),
};
