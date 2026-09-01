import type { ImageSourcePropType } from 'react-native';

export type CosmeticType = 'avatar' | 'avatar_frame';

export type CosmeticCategory = 'Klasik' | 'Pixel Operatörler' | 'Karanlık Kadro' | 'Renkli Kadro' | 'Özel Seri' | 'Elemental' | 'Arcane' | 'Metal' | 'Minimal' | 'Prestij';
export type CosmeticRarity = 'standard' | 'advanced' | 'prestige' | 'legendary';

// First-release prices supersede the audit's original price suggestions.
// Ownership remains keyed by ID; changing a price never resets a purchase.
export const FIRST_RELEASE_COSMETIC_PRICES = {
  avatar: { standard: 900, advanced: 1400, prestige: 2200, legendary: 3500 },
  avatar_frame: { standard: 1100, advanced: 1800, prestige: 3000, legendary: 4500 },
} as const satisfies Record<CosmeticType, Record<CosmeticRarity, number>>;

export const COSMETIC_CATEGORIES: Record<CosmeticType, readonly CosmeticCategory[]> = {
  avatar: ['Pixel Operatörler', 'Karanlık Kadro', 'Renkli Kadro', 'Özel Seri', 'Klasik'],
  avatar_frame: ['Elemental', 'Arcane', 'Metal', 'Minimal', 'Prestij', 'Klasik'],
};

export const COSMETIC_RARITY_LABELS: Record<CosmeticRarity, string> = {
  standard: 'Standart', advanced: 'Gelişmiş', prestige: 'Prestij', legendary: 'Efsanevi',
};

export interface CosmeticPreviewMetadata {
  pixelArt?: boolean;
  scale?: number;
  /** Maximum portrait scale inside this frame, relative to the preview stage. */
  portraitScale?: number;
}

export type CosmeticVisualReference =
  | { kind: 'icon'; reference: string }
  | { kind: 'asset'; source: ImageSourcePropType };

export interface CosmeticDefinition {
  id: string;
  type: CosmeticType;
  name: string;
  description: string;
  price: number;
  visual: CosmeticVisualReference;
  category: CosmeticCategory;
  rarity?: CosmeticRarity;
  assetPath?: string;
  preview?: CosmeticPreviewMetadata;
}

const COSMETIC_RARITY_ORDER: Record<CosmeticRarity, number> = {
  standard: 0, advanced: 1, prestige: 2, legendary: 3,
};

/** Display order only: ownership/equipment never affect a cosmetic's position. */
export function compareCosmeticsByPrice(
  a: Pick<CosmeticDefinition, 'id' | 'price' | 'rarity' | 'name'>,
  b: Pick<CosmeticDefinition, 'id' | 'price' | 'rarity' | 'name'>,
): number {
  return a.price - b.price
    || (COSMETIC_RARITY_ORDER[a.rarity ?? 'standard'] ?? 0) - (COSMETIC_RARITY_ORDER[b.rarity ?? 'standard'] ?? 0)
    || a.name.localeCompare(b.name, 'tr')
    || a.id.localeCompare(b.id, 'en');
}

export const COSMETIC_CATALOG = [
  {
    id: 'avatar_default',
    type: 'avatar',
    name: 'Varsayılan Operatör',
    category: 'Klasik',
    description: 'Standart Ship It Ops profil kimliği.',
    price: 0,
    visual: {
      kind: 'asset',
      source: require('../../assets/cosmetics/avatars/neon_siberi_teknik_operatör_avatarı.png'),
    },
  },
  {
    id: 'avatar_terminal',
    type: 'avatar',
    name: 'Terminal Operatörü',
    category: 'Klasik',
    description: 'Terminal odaklı geçici geliştirme avatarı.',
    price: 2_500,
    visual: {
      kind: 'asset',
      source: require('../../assets/cosmetics/avatars/fütüristik_neon_terminal_operatörü.png'),
    },
  },
  {
    id: 'avatar_systems',
    type: 'avatar',
    name: 'Sistem Mühendisi',
    category: 'Klasik',
    description: 'Sistem operasyonları için geçici geliştirme avatarı.',
    price: 4_000,
    visual: {
      kind: 'asset',
      source: require('../../assets/cosmetics/avatars/siberpunk_sistem_mühendisi_avatarı.png'),
    },
  },
  {
    id: 'avatar_frame_default',
    type: 'avatar_frame',
    name: 'Standart Çerçeve',
    category: 'Klasik',
    description: 'Varsayılan profil çerçevesi.',
    price: 0,
    visual: {
      kind: 'asset',
      source: require('../../assets/cosmetics/frames/neon_siberpunk_avatar_çerçevesi.png'),
    },
  },
  {
    id: 'avatar_frame_signal',
    type: 'avatar_frame',
    name: 'Sinyal Çerçevesi',
    category: 'Klasik',
    description: 'Operasyon sinyali temalı geçici çerçeve.',
    price: 2_000,
    visual: {
      kind: 'asset',
      source: require('../../assets/cosmetics/frames/neon_sibergerçeklik_avatar_çerçevesi.png'),
    },
  },
  {
    id: 'avatar_frame_command',
    type: 'avatar_frame',
    name: 'Komuta Çerçevesi',
    category: 'Klasik',
    description: 'Komuta paneli temalı geçici çerçeve.',
    price: 3_500,
    visual: {
      kind: 'asset',
      source: require('../../assets/cosmetics/frames/neon_siberpunk_komuta_çerçevesi.png'),
    },
  },
  // First release only: mirror cosmetic-asset-audit.json.firstReleaseSelection.
  {
    id: 'avatar_icon_01',
    type: 'avatar',
    name: 'Kızıl Nöbetçi',
    description: 'Karanlık Kadro koleksiyonundan piksel operatör portresi.',
    category: 'Karanlık Kadro',
    rarity: 'advanced',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.advanced,
    assetPath: 'assets/cosmetics/raw/avatars/Icon1.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon1.png') },
  },
  {
    id: 'avatar_icon_03',
    type: 'avatar',
    name: 'Turkuaz Kıvılcım',
    description: 'Renkli Kadro koleksiyonundan piksel operatör portresi.',
    category: 'Renkli Kadro',
    rarity: 'advanced',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.advanced,
    assetPath: 'assets/cosmetics/raw/avatars/Icon3.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon3.png') },
  },
  {
    id: 'avatar_icon_08',
    type: 'avatar',
    name: 'Kızıl Sakallı Usta',
    description: 'Pixel Operatörler koleksiyonundan piksel operatör portresi.',
    category: 'Pixel Operatörler',
    rarity: 'standard',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.standard,
    assetPath: 'assets/cosmetics/raw/avatars/Icon8.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon8.png') },
  },
  {
    id: 'avatar_icon_10',
    type: 'avatar',
    name: 'Pembe Rota',
    description: 'Renkli Kadro koleksiyonundan piksel operatör portresi.',
    category: 'Renkli Kadro',
    rarity: 'standard',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.standard,
    assetPath: 'assets/cosmetics/raw/avatars/Icon10.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon10.png') },
  },
  {
    id: 'avatar_icon_12',
    type: 'avatar',
    name: 'Menekşe Bilge',
    description: 'Karanlık Kadro koleksiyonundan piksel operatör portresi.',
    category: 'Karanlık Kadro',
    rarity: 'prestige',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.prestige,
    assetPath: 'assets/cosmetics/raw/avatars/Icon12.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon12.png') },
  },
  {
    id: 'avatar_icon_13',
    type: 'avatar',
    name: 'Limon Yeşili İzci',
    description: 'Renkli Kadro koleksiyonundan piksel operatör portresi.',
    category: 'Renkli Kadro',
    rarity: 'standard',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.standard,
    assetPath: 'assets/cosmetics/raw/avatars/Icon13.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon13.png') },
  },
  {
    id: 'avatar_icon_16',
    type: 'avatar',
    name: 'Gece Vardiyası',
    description: 'Karanlık Kadro koleksiyonundan piksel operatör portresi.',
    category: 'Karanlık Kadro',
    rarity: 'advanced',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.advanced,
    assetPath: 'assets/cosmetics/raw/avatars/Icon16.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon16.png') },
  },
  {
    id: 'avatar_icon_18',
    type: 'avatar',
    name: 'Bahar Elçisi',
    description: 'Özel Seri koleksiyonundan piksel operatör portresi.',
    category: 'Özel Seri',
    rarity: 'prestige',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.prestige,
    assetPath: 'assets/cosmetics/raw/avatars/Icon18.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon18.png') },
  },
  {
    id: 'avatar_icon_21',
    type: 'avatar',
    name: 'Bere Teknisyeni',
    description: 'Pixel Operatörler koleksiyonundan piksel operatör portresi.',
    category: 'Pixel Operatörler',
    rarity: 'standard',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.standard,
    assetPath: 'assets/cosmetics/raw/avatars/Icon21.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon21.png') },
  },
  {
    id: 'avatar_icon_23',
    type: 'avatar',
    name: 'Gümüş Topuz',
    description: 'Pixel Operatörler koleksiyonundan piksel operatör portresi.',
    category: 'Pixel Operatörler',
    rarity: 'standard',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.standard,
    assetPath: 'assets/cosmetics/raw/avatars/Icon23.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon23.png') },
  },
  {
    id: 'avatar_icon_25',
    type: 'avatar',
    name: 'Bakır Analist',
    description: 'Pixel Operatörler koleksiyonundan piksel operatör portresi.',
    category: 'Pixel Operatörler',
    rarity: 'standard',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.standard,
    assetPath: 'assets/cosmetics/raw/avatars/Icon25.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon25.png') },
  },
  {
    id: 'avatar_icon_28',
    type: 'avatar',
    name: 'Mor Gececi',
    description: 'Karanlık Kadro koleksiyonundan piksel operatör portresi.',
    category: 'Karanlık Kadro',
    rarity: 'advanced',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.advanced,
    assetPath: 'assets/cosmetics/raw/avatars/Icon28.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon28.png') },
  },
  {
    id: 'avatar_icon_29',
    type: 'avatar',
    name: 'Sinyal Tacı',
    description: 'Özel Seri koleksiyonundan piksel operatör portresi.',
    category: 'Özel Seri',
    rarity: 'legendary',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.legendary,
    assetPath: 'assets/cosmetics/raw/avatars/Icon29.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon29.png') },
  },
  {
    id: 'avatar_icon_30',
    type: 'avatar',
    name: 'Altın İkiz Topuz',
    description: 'Renkli Kadro koleksiyonundan piksel operatör portresi.',
    category: 'Renkli Kadro',
    rarity: 'prestige',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.prestige,
    assetPath: 'assets/cosmetics/raw/avatars/Icon30.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon30.png') },
  },
  {
    id: 'avatar_icon_34',
    type: 'avatar',
    name: 'Kızıl Örgü',
    description: 'Renkli Kadro koleksiyonundan piksel operatör portresi.',
    category: 'Renkli Kadro',
    rarity: 'advanced',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.advanced,
    assetPath: 'assets/cosmetics/raw/avatars/Icon34.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon34.png') },
  },
  {
    id: 'avatar_icon_37',
    type: 'avatar',
    name: 'Altın Bilge',
    description: 'Özel Seri koleksiyonundan piksel operatör portresi.',
    category: 'Özel Seri',
    rarity: 'prestige',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar.prestige,
    assetPath: 'assets/cosmetics/raw/avatars/Icon37.png',
    preview: { pixelArt: true, scale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/avatars/Icon37.png') },
  },
  {
    id: 'frame_01',
    type: 'avatar_frame',
    name: 'Turkuaz Mühür',
    description: 'Prestij koleksiyonundan piksel profil çerçevesi.',
    category: 'Prestij',
    rarity: 'prestige',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.prestige,
    assetPath: 'assets/cosmetics/raw/frames/01.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/01.png') },
  },
  {
    id: 'frame_04',
    type: 'avatar_frame',
    name: 'Yaprak Kapısı',
    description: 'Elemental koleksiyonundan piksel profil çerçevesi.',
    category: 'Elemental',
    rarity: 'advanced',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.advanced,
    assetPath: 'assets/cosmetics/raw/frames/04.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/04.png') },
  },
  {
    id: 'frame_06',
    type: 'avatar_frame',
    name: 'İnce Altın',
    description: 'Minimal koleksiyonundan piksel profil çerçevesi.',
    category: 'Minimal',
    rarity: 'standard',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.standard,
    assetPath: 'assets/cosmetics/raw/frames/06.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/06.png') },
  },
  {
    id: 'frame_07',
    type: 'avatar_frame',
    name: 'Astral Mekanizma',
    description: 'Arcane koleksiyonundan piksel profil çerçevesi.',
    category: 'Arcane',
    rarity: 'legendary',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.legendary,
    assetPath: 'assets/cosmetics/raw/frames/07.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/07.png') },
  },
  {
    id: 'frame_09',
    type: 'avatar_frame',
    name: 'Safir Defne',
    description: 'Prestij koleksiyonundan piksel profil çerçevesi.',
    category: 'Prestij',
    rarity: 'prestige',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.prestige,
    assetPath: 'assets/cosmetics/raw/frames/09.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/09.png') },
  },
  {
    id: 'frame_12',
    type: 'avatar_frame',
    name: 'Mor Akım',
    description: 'Arcane koleksiyonundan piksel profil çerçevesi.',
    category: 'Arcane',
    rarity: 'advanced',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.advanced,
    assetPath: 'assets/cosmetics/raw/frames/12.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/12.png') },
  },
  {
    id: 'frame_16',
    type: 'avatar_frame',
    name: 'Bakır Kuşak',
    description: 'Metal koleksiyonundan piksel profil çerçevesi.',
    category: 'Metal',
    rarity: 'standard',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.standard,
    assetPath: 'assets/cosmetics/raw/frames/16.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/16.png') },
  },
  {
    id: 'frame_21',
    type: 'avatar_frame',
    name: 'Pembe Kanat',
    description: 'Prestij koleksiyonundan piksel profil çerçevesi.',
    category: 'Prestij',
    rarity: 'advanced',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.advanced,
    assetPath: 'assets/cosmetics/raw/frames/21.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/21.png') },
  },
  {
    id: 'frame_22',
    type: 'avatar_frame',
    name: 'Bakır Köşe',
    description: 'Minimal koleksiyonundan piksel profil çerçevesi.',
    category: 'Minimal',
    rarity: 'standard',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.standard,
    assetPath: 'assets/cosmetics/raw/frames/22.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/22.png') },
  },
  {
    id: 'frame_24',
    type: 'avatar_frame',
    name: 'Oyma Bakır',
    description: 'Metal koleksiyonundan piksel profil çerçevesi.',
    category: 'Metal',
    rarity: 'standard',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.standard,
    assetPath: 'assets/cosmetics/raw/frames/24.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/24.png') },
  },
  {
    id: 'frame_28',
    type: 'avatar_frame',
    name: 'Orman Ejderi',
    description: 'Elemental koleksiyonundan piksel profil çerçevesi.',
    category: 'Elemental',
    rarity: 'advanced',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.advanced,
    assetPath: 'assets/cosmetics/raw/frames/28.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/28.png') },
  },
  {
    id: 'frame_30',
    type: 'avatar_frame',
    name: 'Çift İz',
    description: 'Minimal koleksiyonundan piksel profil çerçevesi.',
    category: 'Minimal',
    rarity: 'standard',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.standard,
    assetPath: 'assets/cosmetics/raw/frames/30.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/30.png') },
  },
  {
    id: 'frame_33',
    type: 'avatar_frame',
    name: 'Ametist Mühür',
    description: 'Arcane koleksiyonundan piksel profil çerçevesi.',
    category: 'Arcane',
    rarity: 'prestige',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.prestige,
    assetPath: 'assets/cosmetics/raw/frames/33.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/33.png') },
  },
  {
    id: 'frame_38',
    type: 'avatar_frame',
    name: 'Çelik İz',
    description: 'Minimal koleksiyonundan piksel profil çerçevesi.',
    category: 'Minimal',
    rarity: 'standard',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.standard,
    assetPath: 'assets/cosmetics/raw/frames/38.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/38.png') },
  },
  {
    id: 'frame_40',
    type: 'avatar_frame',
    name: 'Buz Ejderi',
    description: 'Elemental koleksiyonundan piksel profil çerçevesi.',
    category: 'Elemental',
    rarity: 'legendary',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.legendary,
    assetPath: 'assets/cosmetics/raw/frames/40.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/40.png') },
  },
  {
    id: 'frame_48',
    type: 'avatar_frame',
    name: 'Gül Büyüsü',
    description: 'Arcane koleksiyonundan piksel profil çerçevesi.',
    category: 'Arcane',
    rarity: 'advanced',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.advanced,
    assetPath: 'assets/cosmetics/raw/frames/48.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/48.png') },
  },
  {
    id: 'frame_52',
    type: 'avatar_frame',
    name: 'Gri Defne',
    description: 'Metal koleksiyonundan piksel profil çerçevesi.',
    category: 'Metal',
    rarity: 'advanced',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.advanced,
    assetPath: 'assets/cosmetics/raw/frames/52.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/52.png') },
  },
  {
    id: 'frame_60',
    type: 'avatar_frame',
    name: 'Gümüş Geçit',
    description: 'Metal koleksiyonundan piksel profil çerçevesi.',
    category: 'Metal',
    rarity: 'prestige',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.prestige,
    assetPath: 'assets/cosmetics/raw/frames/60.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/60.png') },
  },
  {
    id: 'frame_93',
    type: 'avatar_frame',
    name: 'Altın Çiçek',
    description: 'Elemental koleksiyonundan piksel profil çerçevesi.',
    category: 'Elemental',
    rarity: 'advanced',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.advanced,
    assetPath: 'assets/cosmetics/raw/frames/93.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/93.png') },
  },
  {
    id: 'frame_95',
    type: 'avatar_frame',
    name: 'Ametist Yörünge',
    description: 'Arcane koleksiyonundan piksel profil çerçevesi.',
    category: 'Arcane',
    rarity: 'advanced',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.advanced,
    assetPath: 'assets/cosmetics/raw/frames/95.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/95.png') },
  },
  {
    id: 'frame_98',
    type: 'avatar_frame',
    name: 'Hasat Tacı',
    description: 'Prestij koleksiyonundan piksel profil çerçevesi.',
    category: 'Prestij',
    rarity: 'prestige',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.prestige,
    assetPath: 'assets/cosmetics/raw/frames/98.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/98.png') },
  },
  {
    id: 'frame_100',
    type: 'avatar_frame',
    name: 'Kor Kuşak',
    description: 'Elemental koleksiyonundan piksel profil çerçevesi.',
    category: 'Elemental',
    rarity: 'advanced',
    price: FIRST_RELEASE_COSMETIC_PRICES.avatar_frame.advanced,
    assetPath: 'assets/cosmetics/raw/frames/100.png',
    preview: { pixelArt: true, scale: 1.08, portraitScale: 0.64 },
    visual: { kind: 'asset', source: require('../../assets/cosmetics/raw/frames/100.png') },
  },
] as const satisfies readonly CosmeticDefinition[];

export type CosmeticCatalogItem = (typeof COSMETIC_CATALOG)[number];
export type CosmeticId = CosmeticCatalogItem['id'];
export type AvatarCosmetic = Extract<CosmeticCatalogItem, { type: 'avatar' }>;
export type AvatarCosmeticId = AvatarCosmetic['id'];
export type AvatarFrameCosmetic = Extract<CosmeticCatalogItem, { type: 'avatar_frame' }>;
export type AvatarFrameCosmeticId = AvatarFrameCosmetic['id'];
export type CosmeticForType<T extends CosmeticType> = Extract<CosmeticCatalogItem, { type: T }>;

export const DEFAULT_AVATAR_ID: AvatarCosmeticId = 'avatar_default';
export const DEFAULT_AVATAR_FRAME_ID: AvatarFrameCosmeticId = 'avatar_frame_default';
export const DEFAULT_OWNED_COSMETIC_IDS: readonly CosmeticId[] = [
  DEFAULT_AVATAR_ID,
  DEFAULT_AVATAR_FRAME_ID,
];

const COSMETIC_BY_ID = new Map<CosmeticId, CosmeticCatalogItem>(
  COSMETIC_CATALOG.map((item) => [item.id, item]),
);

export function isCosmeticId(value: unknown): value is CosmeticId {
  return typeof value === 'string' && COSMETIC_BY_ID.has(value as CosmeticId);
}

export function getCosmeticById(id: CosmeticId): CosmeticCatalogItem {
  return COSMETIC_BY_ID.get(id)!;
}

export function normalizeOwnedCosmeticIds(value: unknown): CosmeticId[] {
  const requestedIds = Array.isArray(value) ? value.filter(isCosmeticId) : [];
  const ownedIds = new Set<CosmeticId>([...requestedIds, ...DEFAULT_OWNED_COSMETIC_IDS]);
  return COSMETIC_CATALOG.filter((item) => ownedIds.has(item.id)).map((item) => item.id);
}

export interface CosmeticPlayerState {
  ownedCosmeticIds: CosmeticId[];
  equippedAvatarId: AvatarCosmeticId;
  equippedAvatarFrameId: AvatarFrameCosmeticId;
}

export function normalizeCosmeticPlayerState(
  ownedValue: unknown,
  equippedAvatarValue: unknown,
  equippedAvatarFrameValue: unknown,
): CosmeticPlayerState {
  const ownedCosmeticIds = normalizeOwnedCosmeticIds(ownedValue);
  const ownedIds = new Set<CosmeticId>(ownedCosmeticIds);
  const avatar = isCosmeticId(equippedAvatarValue)
    ? getCosmeticById(equippedAvatarValue)
    : null;
  const frame = isCosmeticId(equippedAvatarFrameValue)
    ? getCosmeticById(equippedAvatarFrameValue)
    : null;

  return {
    ownedCosmeticIds,
    equippedAvatarId: avatar?.type === 'avatar' && ownedIds.has(avatar.id)
      ? avatar.id
      : DEFAULT_AVATAR_ID,
    equippedAvatarFrameId: frame?.type === 'avatar_frame' && ownedIds.has(frame.id)
      ? frame.id
      : DEFAULT_AVATAR_FRAME_ID,
  };
}

export type CosmeticPurchasePlan =
  | { status: 'already_owned' }
  | { status: 'insufficient_funds' }
  | { status: 'ok'; budget: number; ownedCosmeticIds: CosmeticId[] };

export function planCosmeticPurchase(
  budget: number,
  ownedCosmeticIds: readonly CosmeticId[],
  cosmeticId: CosmeticId,
): CosmeticPurchasePlan {
  if (ownedCosmeticIds.includes(cosmeticId)) return { status: 'already_owned' };

  const cosmetic = getCosmeticById(cosmeticId);
  if (budget < cosmetic.price) return { status: 'insufficient_funds' };

  return {
    status: 'ok',
    budget: budget - cosmetic.price,
    ownedCosmeticIds: normalizeOwnedCosmeticIds([...ownedCosmeticIds, cosmeticId]),
  };
}

export type CosmeticEquipValidation<T extends CosmeticType> =
  | { status: 'not_owned' }
  | { status: 'type_mismatch' }
  | { status: 'ok'; cosmetic: CosmeticForType<T> };

export function validateCosmeticEquip<T extends CosmeticType>(
  ownedCosmeticIds: readonly CosmeticId[],
  cosmeticId: CosmeticId,
  expectedType: T,
): CosmeticEquipValidation<T> {
  const cosmetic = getCosmeticById(cosmeticId);
  if (cosmetic.type !== expectedType) return { status: 'type_mismatch' };
  if (!ownedCosmeticIds.includes(cosmeticId)) return { status: 'not_owned' };
  return { status: 'ok', cosmetic: cosmetic as CosmeticForType<T> };
}
