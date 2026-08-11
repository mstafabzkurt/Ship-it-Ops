// ─────────────────────────────────────────────────────────────────────────────
// themes.ts — Merkezi tema tanımları.
//
// Her tema üç katmandan oluşur:
//   colors   → ColorToken eşleşmesi (bgBase, panel, accent* …)
//   geometry → borderRadius ve borderWidth gibi şekil değerleri
//   effects  → React Native shadow nesneleri (kart glow, panel glow vb.)
// ─────────────────────────────────────────────────────────────────────────────

import type { ViewStyle } from 'react-native';

// ── Color tokens ──────────────────────────────────────────────────────────────
export interface ThemeColors {
  bgBase: string;
  panel: string;
  panelAlt: string;
  border: string;
  accentAlert: string;
  accentDanger: string;
  accentPositive: string;
  textPrimary: string;
  textMuted: string;
  positiveBg: string;
  positiveBorder: string;
  dangerBg: string;
  dangerBorder: string;
  alertBg: string;
  alertBorder: string;
}

// ── Geometry tokens ───────────────────────────────────────────────────────────
export interface ThemeGeometry {
  /** Default card / panel border radius */
  borderRadius: number;
  /** Smaller radius for chips, badges, pills */
  borderRadiusSm: number;
  /** Larger radius for modals / hero cards */
  borderRadiusLg: number;
  /** Default border width for panels */
  borderWidth: number;
}

// ── Shadow / glow effect objects ──────────────────────────────────────────────
export interface ThemeEffects {
  /** Standard card drop shadow */
  cardShadow: Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'>;
  /** Heavier panel shadow */
  panelShadow: Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'>;
  /** Neon glow — positive / cyan */
  glowPositive: Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'>;
  /** Neon glow — danger / pink */
  glowDanger: Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'>;
  /** Neon glow — alert / yellow */
  glowAlert: Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'>;
}

// ── Full theme shape ──────────────────────────────────────────────────────────
export interface Theme {
  id: 'default' | 'cyberpunk' | 'hardware' | 'nebula';
  colors: ThemeColors;
  geometry: ThemeGeometry;
  effects: ThemeEffects;
}

/** Deep-space gradient stops used when theme.id === 'nebula' */
export const NEBULA_GRADIENT_COLORS = ['#0F0C29', '#302B63', '#24243E'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT THEME — Yumuşak koyu palet, yuvarlak köşeler, standart gölgeler
// ─────────────────────────────────────────────────────────────────────────────
export const defaultTheme: Theme = {
  id: 'default',
  colors: {
    bgBase: '#0B0F17',
    panel: '#151B27',
    panelAlt: '#1D2531',
    border: '#2A3341',
    accentAlert: '#F2A93B',
    accentDanger: '#E5484D',
    accentPositive: '#35C9A3',
    textPrimary: '#EDEFF3',
    textMuted: '#8A93A6',
    positiveBg: 'rgba(53,201,163,0.12)',
    positiveBorder: 'rgba(53,201,163,0.35)',
    dangerBg: 'rgba(229,72,77,0.14)',
    dangerBorder: 'rgba(229,72,77,0.4)',
    alertBg: 'rgba(242,169,59,0.10)',
    alertBorder: 'rgba(242,169,59,0.4)',
  },
  geometry: {
    borderRadius: 12,
    borderRadiusSm: 6,
    borderRadiusLg: 18,
    borderWidth: 1,
  },
  effects: {
    cardShadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    panelShadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 8,
    },
    glowPositive: {
      shadowColor: '#35C9A3',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    glowDanger: {
      shadowColor: '#E5484D',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    glowAlert: {
      shadowColor: '#F2A93B',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CYBERPUNK THEME — Neon ışıkları, sert köşeler, agresif glow efektleri
// ─────────────────────────────────────────────────────────────────────────────
export const cyberpunkTheme: Theme = {
  id: 'cyberpunk',
  colors: {
    bgBase: '#05070A',
    panel: '#0E131F',
    panelAlt: '#171E2E',
    border: '#1A2D3D',
    accentAlert: '#F3E600',
    accentDanger: '#FF007F',
    accentPositive: '#00E5FF',
    textPrimary: '#E0F7FA',
    textMuted: '#687B8C',
    positiveBg: 'rgba(0, 229, 255, 0.12)',
    positiveBorder: 'rgba(0, 229, 255, 0.35)',
    dangerBg: 'rgba(255, 0, 127, 0.14)',
    dangerBorder: 'rgba(255, 0, 127, 0.4)',
    alertBg: 'rgba(243, 230, 0, 0.10)',
    alertBorder: 'rgba(243, 230, 0, 0.4)',
  },
  geometry: {
    borderRadius: 2,
    borderRadiusSm: 2,
    borderRadiusLg: 4,
    borderWidth: 1.5,
  },
  effects: {
    cardShadow: {
      shadowColor: '#00E5FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 6,
    },
    panelShadow: {
      shadowColor: '#00E5FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
      elevation: 10,
    },
    glowPositive: {
      shadowColor: '#00E5FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 14,
      elevation: 10,
    },
    glowDanger: {
      shadowColor: '#FF007F',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 14,
      elevation: 10,
    },
    glowAlert: {
      shadowColor: '#F3E600',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 14,
      elevation: 10,
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HARDWARE THEME — Derin orman yeşili, taktik palet, sıfır border radius
// ─────────────────────────────────────────────────────────────────────────────
export const hardwareTheme: Theme = {
  id: 'hardware',
  colors: {
    bgBase: '#09100D',
    panel: '#121F18',
    panelAlt: '#1A2E24',
    border: '#2A4A38',
    accentAlert: '#FFB000',
    accentDanger: '#FF3333',
    accentPositive: '#00FF66',
    textPrimary: '#E8F5E9',
    textMuted: '#819CA9',
    positiveBg: 'rgba(0, 255, 102, 0.10)',
    positiveBorder: 'rgba(0, 255, 102, 0.32)',
    dangerBg: 'rgba(255, 51, 51, 0.12)',
    dangerBorder: 'rgba(255, 51, 51, 0.38)',
    alertBg: 'rgba(255, 176, 0, 0.10)',
    alertBorder: 'rgba(255, 176, 0, 0.38)',
  },
  geometry: {
    borderRadius: 0,
    borderRadiusSm: 0,
    borderRadiusLg: 0,
    borderWidth: 2,
  },
  effects: {
    cardShadow: {
      shadowColor: '#00FF66',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.10,
      shadowRadius: 8,
      elevation: 4,
    },
    panelShadow: {
      shadowColor: '#00FF66',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 8,
    },
    glowPositive: {
      shadowColor: '#00FF66',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.65,
      shadowRadius: 12,
      elevation: 8,
    },
    glowDanger: {
      shadowColor: '#FF3333',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.65,
      shadowRadius: 12,
      elevation: 8,
    },
    glowAlert: {
      shadowColor: '#FFB000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.65,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// NEBULA THEME — Derin uzay mora, premium pillow köşeler, magenta aksentler
// ─────────────────────────────────────────────────────────────────────────────
export const nebulaTheme: Theme = {
  id: 'nebula',
  colors: {
    bgBase: '#0F0C29',
    panel: '#1E1A45',
    panelAlt: '#26225A',
    border: '#413B7A',
    accentAlert: '#F7971E',
    accentDanger: '#E94057',
    accentPositive: '#A78BFA',
    textPrimary: '#F0EEFF',
    textMuted: '#9D97C8',
    positiveBg: 'rgba(167, 139, 250, 0.12)',
    positiveBorder: 'rgba(167, 139, 250, 0.38)',
    dangerBg: 'rgba(233, 64, 87, 0.14)',
    dangerBorder: 'rgba(233, 64, 87, 0.40)',
    alertBg: 'rgba(247, 151, 30, 0.10)',
    alertBorder: 'rgba(247, 151, 30, 0.40)',
  },
  geometry: {
    borderRadius: 16,
    borderRadiusSm: 10,
    borderRadiusLg: 24,
    borderWidth: 1,
  },
  effects: {
    cardShadow: {
      shadowColor: '#8A2387',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 12,
      elevation: 6,
    },
    panelShadow: {
      shadowColor: '#8A2387',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 22,
      elevation: 12,
    },
    glowPositive: {
      shadowColor: '#A78BFA',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.75,
      shadowRadius: 16,
      elevation: 12,
    },
    glowDanger: {
      shadowColor: '#E94057',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.75,
      shadowRadius: 16,
      elevation: 12,
    },
    glowAlert: {
      shadowColor: '#F7971E',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.75,
      shadowRadius: 16,
      elevation: 12,
    },
  },
};

// ── Theme registry ────────────────────────────────────────────────────────────
export const THEMES: Record<Theme['id'], Theme> = {
  default: defaultTheme,
  cyberpunk: cyberpunkTheme,
  hardware: hardwareTheme,
  nebula: nebulaTheme,
};
