// Mağaza öğeleri — all purchases use the standard company budget.
// Tüm fiyat, açıklama ve kategori bilgisi tek yerden yönetilir.

import type { Theme } from '../theme/themes';

export type StoreCategory = 'office' | 'premium' | 'theme';

export interface StoreItem {
  id: string;
  category: StoreCategory;
  icon: string;
  title: string;
  description: string;
  /** Şirket bütçesi ($) */
  price: number;
  /**
   * Sadece 'theme' kategorisindeki öğeler için — ThemeContext'teki themeId değeri.
   * Equip edildiğinde setThemeId(themeIdKey) çağrılır.
   */
  themeIdKey?: Theme['id'];
}

// --- Kategori A: Ofis / Şirket Bütçesi --------------------------------
export const OFFICE_ITEMS: StoreItem[] = [
  {
    id: 'coffee_machine',
    category: 'office',
    icon: '☕',
    title: 'Premium Kahve Makinesi',
    description: 'Ekip verimliliğini %15 artırır. Tüm gece vardiyaları için zorunlu.',
    price: 5000,
  },
  {
    id: 'standing_desk',
    category: 'office',
    icon: '🪑',
    title: 'Ergonomik Ayaklı Masa',
    description: 'Uzun incident çözme seansları için bel dostu yükseklik ayarlı masa.',
    price: 8500,
  },
  {
    id: 'dual_monitor',
    category: 'office',
    icon: '🖥️',
    title: 'Çift Monitör Kurulumu',
    description: 'Log analizi ve kod incelemesi aynı anda. Prodüktivite x2.',
    price: 12000,
  },
  {
    id: 'server_rack',
    category: 'office',
    icon: '🗄️',
    title: 'Yerel Test Sunucusu',
    description: "Lokal test ortamı kur, production'a basmadan önce senaryoları dene.",
    price: 20000,
  },
  {
    id: 'office_plant',
    category: 'office',
    icon: '🪴',
    title: 'Ofis Bitkisi (Cactus)',
    description: 'Kod kalsın, kaktüs büyüsün. Motivasyon +5, bakım gerektirmez.',
    price: 1500,
  },
  {
    id: 'team_snacks',
    category: 'office',
    icon: '🍕',
    title: 'Haftalık Takım Atıştırmalıkları',
    description: 'Perşembe pizza öğle yemekleri. Takım morali tavan yapar.',
    price: 3000,
  },
  {
    id: 'whiteboard',
    category: 'office',
    icon: '📋',
    title: 'Dev Akıllı Beyaz Tahta',
    description: "Mimari diyagramlar ve incident post-mortem'ler için. 4K çözünürlük.",
    price: 9500,
  },
  {
    id: 'office_expansion',
    category: 'office',
    icon: '🏢',
    title: 'Ofis Genişletme',
    description: 'Yeni bir kat kirala, SRE takımına özel ops odası aç.',
    price: 35000,
  },
];

// --- Kategori B: Premium --------------------------------------------------
export const PREMIUM_ITEMS: StoreItem[] = [
  {
    id: 'profile_neon_ring',
    category: 'premium',
    icon: '✨',
    title: 'Neon Profil Halkası',
    description: "Avatar'ının etrafına animasyonlu neon halo efekti ekler.",
    price: 80,
  },
  {
    id: 'icon_flame',
    category: 'premium',
    icon: '🔥',
    title: 'Flame App Icon',
    description: 'Uygulamanın ana ikonu değişir. Ekranında alev var.',
    price: 60,
  },
  {
    id: 'icon_cto_crown',
    category: 'premium',
    icon: '👑',
    title: 'CTO Crown Icon',
    description: 'Taçlı ikon. Sadece gerçek liderler için özel koleksiyoner ürünü.',
    price: 150,
  },
  {
    id: 'badge_frame_gold',
    category: 'premium',
    icon: '🥇',
    title: 'Altın Rozet Çerçevesi',
    description: 'Tüm rozetlerin etrafına altın parıltılı animasyonlu çerçeve.',
    price: 100,
  },
  {
    id: 'nameplate_hologram',
    category: 'premium',
    icon: '🪩',
    title: 'Hologram İsim Plakası',
    description: 'Profilinde şirket adın holografik animasyonla görünür.',
    price: 120,
  },
];

// --- Kategori C: Temalar --------------------------------------------------
// 'themeIdKey' alanı hangi ThemeContext ID'sini etkinleştireceğini belirtir.
export const THEME_ITEMS: StoreItem[] = [
  {
    id: 'theme_cyberpunk',
    category: 'theme',
    icon: '⚡',
    title: 'Cyberpunk Tema',
    description: 'Siyaha yakın zemin ve keskin neon çizgiler.',
    price: 500,
    themeIdKey: 'cyberpunk',
  },
  {
    id: 'theme_hardware',
    category: 'theme',
    icon: '🖥️',
    title: 'Hardware Tema',
    description: 'Orman yeşili paneller ve köşeli hatlar.',
    price: 350,
    themeIdKey: 'hardware',
  },
  {
    id: 'theme_nebula',
    category: 'theme',
    icon: '🌌',
    title: 'Nebula Tema',
    description: 'Derin mor zemin ve geniş yuvarlak köşeler.',
    price: 800,
    themeIdKey: 'nebula',
  },
];

export const ALL_ITEMS: StoreItem[] = [...OFFICE_ITEMS, ...PREMIUM_ITEMS, ...THEME_ITEMS];
