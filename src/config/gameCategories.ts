import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export const QUESTIONS_PER_TIER = 20;
export const SESSION_QUESTION_COUNT = 10;

export type GameCategoryId =
  | 'web_programming'
  | 'operating_systems'
  | 'database_systems'
  | 'algorithm'
  | 'data_structures'
  | 'java'
  | 'programming_2'
  | 'object_oriented_programming'
  | 'computer_networks'
  | 'computer_architecture'
  | 'microprocessors'
  | 'graph_theory'
  | 'automata_theory'
  | 'software_engineering'
  | 'engineering_economics';
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
  order: number;
  name: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  operation: GameOperationContext;
}

type CourseCategoryInput = Omit<GameCategory, 'operation'> & {
  operation: Omit<GameOperationContext, 'impact'>;
};

function createCourseCategory(input: CourseCategoryInput): GameCategory {
  return {
    ...input,
    operation: {
      ...input.operation,
      impact: {
        success: 'Doğru karar, teknik değerlendirmeyi güvenli bir sonuca bağladı.',
        fail: 'Yanlış karar, teknik değerlendirmede hatalı bir sonuca yol açabilir.',
        timeout: 'Karar gecikti; teknik değerlendirme için güvenli seçim yapılamadı.',
        partial: 'Kısmi karar, teknik değerlendirmeyi tamamen güvenceye almadı.',
      },
    },
  };
}

export const GAME_CATEGORIES: readonly GameCategory[] = [
  {
    id: 'web_programming',
    order: 1,
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
    order: 2,
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
    order: 3,
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
  createCourseCategory({
    id: 'algorithm',
    order: 4,
    name: 'Algoritma',
    description: 'Algoritma analizi, sıralama, arama ve problem çözme soruları.',
    icon: 'git-compare-outline',
    operation: {
      title: 'Algorithm Strategy Desk',
      subtitle: 'Algoritma ve çözüm hattı',
      activeSubtitle: 'Algoritma çözümü kararı',
      description: 'Algoritma analizi, sıralama, arama ve problem çözme kararları.',
    },
  }),
  createCourseCategory({
    id: 'data_structures',
    order: 5,
    name: 'Veri Yapıları',
    description: 'Diziler, listeler, yığınlar, kuyruklar, ağaçlar ve hash yapıları.',
    icon: 'layers-outline',
    operation: {
      title: 'Data Structure Desk',
      subtitle: 'Veri yapısı seçim hattı',
      activeSubtitle: 'Veri yapısı kararı',
      description: 'Veri organizasyonu, erişim maliyeti ve yapı seçimi kararları.',
    },
  }),
  createCourseCategory({
    id: 'java',
    order: 6,
    name: 'Java',
    description: 'Java dili, sınıflar, istisnalar, koleksiyonlar ve çalışma mantığı.',
    icon: 'cafe-outline',
    operation: {
      title: 'Java Runtime Desk',
      subtitle: 'Java çalışma hattı',
      activeSubtitle: 'Java uygulama kararı',
      description: 'Java dili, sınıflar, koleksiyonlar ve çalışma zamanı kararları.',
    },
  }),
  createCourseCategory({
    id: 'programming_2',
    order: 7,
    name: 'Programlamaya Giriş 2',
    description: 'Fonksiyonlar, diziler, dosyalar ve temel programlama akışı.',
    icon: 'terminal-outline',
    operation: {
      title: 'Programming Foundations Desk',
      subtitle: 'Programlama temelleri hattı',
      activeSubtitle: 'Programlama akışı kararı',
      description: 'Fonksiyon, dizi, dosya ve temel program akışı kararları.',
    },
  }),
  createCourseCategory({
    id: 'object_oriented_programming',
    order: 8,
    name: 'Nesne Yönelimli Programlama',
    description: 'Sınıf, nesne, kalıtım, polimorfizm ve kapsülleme.',
    icon: 'cube-outline',
    operation: {
      title: 'Object Design Desk',
      subtitle: 'Nesne tasarımı hattı',
      activeSubtitle: 'Nesne modeli kararı',
      description: 'Sınıf, nesne, kalıtım, polimorfizm ve kapsülleme kararları.',
    },
  }),
  createCourseCategory({
    id: 'computer_networks',
    order: 9,
    name: 'Bilgisayar Ağları',
    description: 'Ağ katmanları, protokoller, IP, yönlendirme ve iletişim.',
    icon: 'git-network-outline',
    operation: {
      title: 'Network Operations Desk',
      subtitle: 'Ağ ve iletişim hattı',
      activeSubtitle: 'Ağ iletişimi kararı',
      description: 'Ağ katmanları, protokoller, adresleme ve yönlendirme kararları.',
    },
  }),
  createCourseCategory({
    id: 'computer_architecture',
    order: 10,
    name: 'Bilgisayar Mimarisi',
    description: 'İşlemci, bellek, komutlar, veri yolu ve mimari kararları.',
    icon: 'hardware-chip-outline',
    operation: {
      title: 'Architecture Control Desk',
      subtitle: 'Donanım mimarisi hattı',
      activeSubtitle: 'Mimari tasarım kararı',
      description: 'İşlemci, bellek, komut ve veri yolu mimarisi kararları.',
    },
  }),
  createCourseCategory({
    id: 'microprocessors',
    order: 11,
    name: 'Mikroişlemciler',
    description: 'Mikroişlemci yapısı, assembly, kesmeler ve donanım etkileşimi.',
    icon: 'hardware-chip-outline',
    operation: {
      title: 'Processor Interface Desk',
      subtitle: 'Mikroişlemci kontrol hattı',
      activeSubtitle: 'İşlemci etkileşimi kararı',
      description: 'Mikroişlemci, assembly, kesme ve donanım etkileşimi kararları.',
    },
  }),
  createCourseCategory({
    id: 'graph_theory',
    order: 12,
    name: 'Çizge Kuramı',
    description: 'Graf yapıları, yollar, ağaçlar, bağlantılılık ve temel algoritmalar.',
    icon: 'share-social-outline',
    operation: {
      title: 'Graph Analysis Desk',
      subtitle: 'Çizge analiz hattı',
      activeSubtitle: 'Çizge çözümü kararı',
      description: 'Graf yapıları, yollar, ağaçlar ve bağlantılılık kararları.',
    },
  }),
  createCourseCategory({
    id: 'automata_theory',
    order: 13,
    name: 'Özdevinirler',
    description: 'Sonlu otomata, düzenli diller, gramerler ve hesaplama modelleri.',
    icon: 'repeat-outline',
    operation: {
      title: 'Computation Model Desk',
      subtitle: 'Hesaplama modeli hattı',
      activeSubtitle: 'Otomata modeli kararı',
      description: 'Sonlu otomata, düzenli dil, gramer ve hesaplama modeli kararları.',
    },
  }),
  createCourseCategory({
    id: 'software_engineering',
    order: 14,
    name: 'Yazılım Mühendisliği',
    description: 'Gereksinim, tasarım, test, süreç ve proje yönetimi.',
    icon: 'construct-outline',
    operation: {
      title: 'Delivery Process Desk',
      subtitle: 'Yazılım teslimat hattı',
      activeSubtitle: 'Yazılım süreci kararı',
      description: 'Gereksinim, tasarım, test, süreç ve proje yönetimi kararları.',
    },
  }),
  createCourseCategory({
    id: 'engineering_economics',
    order: 15,
    name: 'Mühendislik Ekonomisi',
    description: 'Maliyet, faiz, bugünkü değer, amortisman ve karar analizi.',
    icon: 'calculator-outline',
    operation: {
      title: 'Investment Decision Desk',
      subtitle: 'Ekonomik karar hattı',
      activeSubtitle: 'Ekonomik analiz kararı',
      description: 'Maliyet, faiz, bugünkü değer, amortisman ve yatırım kararları.',
    },
  }),
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

function getFirstRouteParam(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

export function resolveGameCategoryId(value: unknown): GameCategoryId {
  const candidate = getFirstRouteParam(value);
  return isGameCategoryId(candidate) ? candidate : GAME_CATEGORIES[0].id;
}

export function resolveDifficultyStar(value: unknown): DifficultyStar {
  return parseDifficultyStar(getFirstRouteParam(value)) ?? DIFFICULTY_STARS[0];
}

export function buildGameSessionRoute(categoryId: GameCategoryId, star: DifficultyStar): string {
  return `/(tabs)/game?category=${categoryId}&star=${star}`;
}

export function getGameCategory(id: GameCategoryId): GameCategory {
  return GAME_CATEGORIES.find((category) => category.id === id) ?? GAME_CATEGORIES[0];
}
