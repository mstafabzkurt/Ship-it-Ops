import type { JokerId } from './jokerEconomy';

export interface JokerDisplayDefinition {
  name: string;
  description: string;
}

export const JOKER_DISPLAY: Record<JokerId, JokerDisplayDefinition> = {
  codeReview: {
    name: 'Debug Lens',
    description: 'İki yanlış seçeneği eler.',
  },
  gitRevert: {
    name: 'Rollback',
    description: 'Yanlış karar veya süre aşımından sonra soruyu yeniden denemeni sağlar.',
  },
  serverScaleUp: {
    name: 'Overclock',
    description: 'Bu soruya 15 saniye ekler.',
  },
  snapshotBackup: {
    name: 'Snapshot',
    description: 'Yanlış yanıttan sonra kaybettiğin Uptime serisini geri getirir.',
  },
};
