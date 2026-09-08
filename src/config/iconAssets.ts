import type { ImageSourcePropType } from 'react-native';

import type { JokerId } from './jokerEconomy';

export const JOKER_ICON_ASSETS: Record<JokerId, ImageSourcePropType> = {
  codeReview: require('../../assets/icons/debuglens.png'),
  gitRevert: require('../../assets/icons/rollback.png'),
  serverScaleUp: require('../../assets/icons/overclock.png'),
  snapshotBackup: require('../../assets/icons/snapshot.png'),
};

export const UI_ICON_ASSETS = {
  correctAnswer: require('../../assets/icons/correctanswer.png'),
  wrongAnswer: require('../../assets/icons/wronganswer.png'),
  flame: require('../../assets/icons/flame.png'),
  xpUp: require('../../assets/icons/xpup.png'),
  xpLoss: require('../../assets/icons/xploss.png'),
  info: require('../../assets/icons/info.png'),
  coin: require('../../assets/icons/coin.png'),
} as const satisfies Record<string, ImageSourcePropType>;

export const ECONOMY_ICON_ASSETS = {
  coin: UI_ICON_ASSETS.coin,
} as const satisfies Record<string, ImageSourcePropType>;
