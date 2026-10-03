import type { DashboardTokens } from '../components/dashboard/dashboardTokens';

export type ChatThemeId = 'default' | 'graphite' | 'indigo' | 'sage' | 'forest' | 'observatory';
export type ChatThemePalette = {
  canvas: string;
  gradient: readonly [string, string];
  own: string;
  other: string;
  border: string;
  text: string;
  muted: string;
  link: string;
  labelBackground: string;
};
export type ChatThemePreset = {
  id: ChatThemeId;
  name: string;
  kind: string;
  image?: 'forest' | 'observatory';
  palette?: ChatThemePalette;
};

const palette = (canvas: string, end: string, own: string, other: string, border: string, link: string): ChatThemePalette => ({
  canvas, gradient: [canvas, end], own, other, border, link,
  text: '#F4F3F8', muted: '#C5C9D5', labelBackground: '#111725',
});

export const CHAT_THEMES: readonly ChatThemePreset[] = [
  { id: 'default', name: 'Varsayılan', kind: 'Uygulama teması' },
  { id: 'graphite', name: 'Grafit', kind: 'Sade renk', palette: palette('#15191F', '#15191F', '#384354', '#242B35', '#596579', '#BBD9FF') },
  { id: 'indigo', name: 'Alacakaranlık', kind: 'Renk geçişi', palette: palette('#151429', '#252039', '#403462', '#292439', '#6D5A91', '#D9C8FF') },
  { id: 'sage', name: 'Adaçayı', kind: 'Renk geçişi', palette: palette('#111F20', '#1E3031', '#294B46', '#203333', '#50766D', '#B4E9D8') },
  { id: 'forest', name: 'Sisli Göl', kind: 'Fotoğraf', image: 'forest', palette: palette('#142535', '#142535', '#2C4A60', '#1C3040', '#587A91', '#BBDFFF') },
  { id: 'observatory', name: 'Gözlemevi', kind: 'İllüstrasyon', image: 'observatory', palette: palette('#21253E', '#21253E', '#454267', '#2B2D45', '#777298', '#DDD4FF') },
];

export function getChatTheme(value: string | null | undefined): ChatThemePreset {
  return CHAT_THEMES.find((item) => item.id === value) ?? CHAT_THEMES[0];
}

export function getChatThemePalette(preset: ChatThemePreset, colors: DashboardTokens['colors']): ChatThemePalette {
  return preset.palette ?? {
    canvas: colors.canvas, gradient: [colors.canvas, colors.canvas],
    own: colors.actionSubSurface, other: colors.secondarySurface, border: colors.selectionBorder,
    text: colors.text, muted: colors.textSecondary, link: colors.secondary, labelBackground: colors.canvas,
  };
}

// Viewer-first: a preference never changes another account or another conversation.
export function getChatThemeStorageKey(viewerId: string, peerId: string): string | null {
  if (!viewerId || !peerId) return null;
  return `@shipit_chat_theme_v1:${encodeURIComponent(viewerId)}:${encodeURIComponent(peerId)}`;
}
