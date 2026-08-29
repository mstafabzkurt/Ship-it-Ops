import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export const QUESTIONS_PER_TIER = 20;
export const SESSION_QUESTION_COUNT = 10;

export type GameCategoryId = 'web_programming' | 'operating_systems' | 'database_systems';
export type DifficultyStar = 1 | 2 | 3;

export interface GameCategory {
  id: GameCategoryId;
  name: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
}

export const GAME_CATEGORIES: readonly GameCategory[] = [
  {
    id: 'web_programming',
    name: 'Web Programlama',
    description: 'İstemci, sunucu, HTTP ve modern web operasyonları.',
    icon: 'code-slash-outline',
  },
  {
    id: 'operating_systems',
    name: 'İşletim Sistemleri',
    description: 'Süreçler, bellek, eşzamanlılık ve kaynak yönetimi.',
    icon: 'hardware-chip-outline',
  },
  {
    id: 'database_systems',
    name: 'Veritabanı Sistemleri',
    description: 'SQL, ilişkisel model, indeksler ve sorgu eniyileme.',
    icon: 'server-outline',
  },
] as const;

export const DIFFICULTY_STARS: readonly DifficultyStar[] = [1, 2, 3];

export const DIFFICULTY_LABELS: Record<DifficultyStar, string> = {
  1: 'Kolay',
  2: 'Orta',
  3: 'Zor',
};

export function isGameCategoryId(value: unknown): value is GameCategoryId {
  return GAME_CATEGORIES.some((category) => category.id === value);
}

export function parseDifficultyStar(value: unknown): DifficultyStar | null {
  const parsed = Number(value);
  return parsed === 1 || parsed === 2 || parsed === 3 ? parsed : null;
}

export function getGameCategory(id: GameCategoryId): GameCategory {
  return GAME_CATEGORIES.find((category) => category.id === id) ?? GAME_CATEGORIES[0];
}
