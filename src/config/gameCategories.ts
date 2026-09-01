import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export const QUESTIONS_PER_TIER = 20;
export const SESSION_QUESTION_COUNT = 10;

export type GameCategoryId = 'web_programming' | 'operating_systems' | 'database_systems';
export type DifficultyStar = 1 | 2 | 3;
export type OperationImpactTone = 'success' | 'partial' | 'fail' | 'timeout';

export interface GameOperationContext {
  title: string;
  subtitle: string;
  activeSubtitle: string;
  description: string;
  impact: Readonly<Record<OperationImpactTone, string>>;
}

export interface GameCategory {
  id: GameCategoryId;
  name: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  operation: GameOperationContext;
}

export const GAME_CATEGORIES: readonly GameCategory[] = [
  {
    id: 'web_programming',
    name: 'Web Programlama',
    description: 'HTTP, servlet/JSP, oturum yönetimi ve frontend-web soruları.',
    icon: 'code-slash-outline',
    operation: {
      title: 'Client & API Desk',
      subtitle: 'İstemci ve API karar hattı',
      activeSubtitle: 'İstemci ve web arayüzü kararı',
      description: 'Kullanıcı akışı, HTTP cevapları, oturum yönetimi ve web katmanı kararları.',
      impact: {
        success: 'Doğru karar, kullanıcı akışını ve web katmanı davranışını netleştirdi.',
        fail: 'Yanlış karar, istemci-sunucu akışında hatalı davranışa yol açabilir.',
        timeout: 'Karar gecikti; web akışı belirsiz durumda kaldı.',
        partial: 'Kısmi karar bazı web davranışlarını düzeltse de akış tamamen netleşmedi.',
      },
    },
  },
  {
    id: 'operating_systems',
    name: 'İşletim Sistemleri',
    description: 'Process, thread, senkronizasyon, bellek ve zamanlama soruları.',
    icon: 'hardware-chip-outline',
    operation: {
      title: 'Runtime Stability Desk',
      subtitle: 'Çalışma zamanı kararlılık hattı',
      activeSubtitle: 'Süreç ve kaynak yönetimi kararı',
      description: 'Process, thread, bellek, senkronizasyon ve zamanlama kararları.',
      impact: {
        success: 'Doğru karar, çalışma zamanı kararlılığını korudu.',
        fail: 'Yanlış karar, süreç veya kaynak yönetiminde kararsızlığa yol açabilir.',
        timeout: 'Karar gecikti; çalışma zamanı durumu belirsiz kaldı.',
        partial: 'Kısmi karar sistem kararlılığını tamamen garanti etmedi.',
      },
    },
  },
  {
    id: 'database_systems',
    name: 'Veritabanı Sistemleri',
    description: 'SQL, ilişkisel model, indeksler ve sorgu eniyileme.',
    icon: 'server-outline',
    operation: {
      title: 'Data Integrity Desk',
      subtitle: 'Veri bütünlüğü ve sorgu hattı',
      activeSubtitle: 'Veri ve sorgu hattı kararı',
      description: 'SQL, indeksler, normalizasyon, transaction ve sorgu maliyeti kararları.',
      impact: {
        success: 'Doğru karar, veri bütünlüğü ve sorgu maliyetini kontrol altında tuttu.',
        fail: 'Yanlış karar, veri tutarlılığı veya sorgu maliyeti tarafında sorun oluşturabilir.',
        timeout: 'Karar gecikti; veri hattı için güvenli seçim yapılamadı.',
        partial: 'Kısmi karar veri hattını tamamen güvenceye almadı.',
      },
    },
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
