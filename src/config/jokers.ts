import type { JokerId } from './jokerEconomy';

export interface JokerDisplayDefinition {
  name: string;
  description: string;
}

export const JOKER_DISPLAY: Record<JokerId, JokerDisplayDefinition> = {
  codeReview: {
    name: 'Debug Lens',
    description: 'İki hatalı seçeneği eler.',
  },
  gitRevert: {
    name: 'Rollback',
    description: 'Son kararı geri alır.',
  },
  serverScaleUp: {
    name: 'Overclock',
    description: 'Bu soru için süre kazandırır.',
  },
  snapshotBackup: {
    name: 'Snapshot',
    description: 'Kaybedilen seriyi geri getirir.',
  },
};
