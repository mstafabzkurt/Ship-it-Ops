import type { ImageSourcePropType } from 'react-native';

export type CosmeticType = 'avatar' | 'avatar_frame';

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
}

export const COSMETIC_CATALOG = [
  {
    id: 'avatar_default',
    type: 'avatar',
    name: 'Varsayılan Operatör',
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
    description: 'Komuta paneli temalı geçici çerçeve.',
    price: 3_500,
    visual: {
      kind: 'asset',
      source: require('../../assets/cosmetics/frames/neon_siberpunk_komuta_çerçevesi.png'),
    },
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
