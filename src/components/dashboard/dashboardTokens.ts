import type { TextStyle, ViewStyle } from 'react-native';
import type { Theme } from '../../theme/themes';

export interface DashboardTokens {
  colors: {
    canvas: string;
    canvasGlow: string;
    surface: string;
    surfaceRaised: string;
    surfaceSoft: string;
    border: string;
    borderStrong: string;
    primary: string;
    primarySoft: string;
    secondary: string;
    secondarySoft: string;
    warning: string;
    warningSoft: string;
    danger: string;
    dangerSoft: string;
    text: string;
    textMuted: string;
    onAccent: string;
    surfaceHighlight: string;
    surfaceHighlightStrong: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  layout: {
    contentMaxWidth: number;
    gameMaxWidth: number;
    pageGutter: number;
    pageGutterWide: number;
    pageTop: number;
    pageBottom: number;
    sectionGap: number;
    floatingInset: number;
    tabBarHeight: number;
  };
  control: {
    height: number;
    heightLarge: number;
  };
  shadow: {
    card: ViewStyle;
    raised: ViewStyle;
  };
  motion: {
    pressed: ViewStyle;
  };
}

export function getDashboardTokens(theme: Theme): DashboardTokens {
  const defaultClay = theme.id === 'default';

  return {
    colors: {
      canvas: defaultClay ? '#111229' : theme.colors.bgBase,
      canvasGlow: defaultClay ? '#252052' : theme.colors.panelAlt,
      surface: defaultClay ? '#1A1C3D' : theme.colors.panel,
      surfaceRaised: defaultClay ? '#242750' : theme.colors.panelAlt,
      surfaceSoft: defaultClay ? '#202247' : theme.colors.panelAlt,
      border: defaultClay ? 'rgba(218, 216, 255, 0.13)' : theme.colors.border,
      borderStrong: defaultClay ? 'rgba(218, 216, 255, 0.24)' : theme.colors.positiveBorder,
      primary: defaultClay ? '#8B7CF6' : theme.colors.accentPositive,
      primarySoft: defaultClay ? 'rgba(139, 124, 246, 0.18)' : theme.colors.positiveBg,
      secondary: defaultClay ? '#49D7C5' : theme.colors.accentPositive,
      secondarySoft: defaultClay ? 'rgba(73, 215, 197, 0.15)' : theme.colors.positiveBg,
      warning: defaultClay ? '#FFC857' : theme.colors.accentAlert,
      warningSoft: defaultClay ? 'rgba(255, 200, 87, 0.15)' : theme.colors.alertBg,
      danger: defaultClay ? '#FF7185' : theme.colors.accentDanger,
      dangerSoft: defaultClay ? 'rgba(255, 113, 133, 0.16)' : theme.colors.dangerBg,
      text: defaultClay ? '#F8F7FF' : theme.colors.textPrimary,
      textMuted: defaultClay ? '#BBBBD3' : theme.colors.textMuted,
      onAccent: defaultClay ? '#251B05' : theme.colors.bgBase,
      surfaceHighlight: defaultClay ? 'rgba(255, 255, 255, 0.16)' : theme.colors.positiveBg,
      surfaceHighlightStrong: defaultClay ? 'rgba(255, 255, 255, 0.32)' : theme.colors.positiveBorder,
    },
    radius: defaultClay
      ? { sm: 12, md: 18, lg: 24, xl: 30, pill: 999 }
      : {
          sm: theme.geometry.borderRadiusSm,
          md: theme.geometry.borderRadius,
          lg: theme.geometry.borderRadiusLg,
          xl: theme.geometry.borderRadiusLg,
          pill: theme.geometry.borderRadiusSm,
        },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    layout: {
      contentMaxWidth: 1180,
      gameMaxWidth: 1280,
      pageGutter: 16,
      pageGutterWide: 24,
      pageTop: 18,
      pageBottom: 48,
      sectionGap: 18,
      floatingInset: 20,
      tabBarHeight: 78,
    },
    control: { height: 48, heightLarge: 52 },
    shadow: {
      card: defaultClay
        ? {
            shadowColor: '#050510',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.26,
            shadowRadius: 14,
            elevation: 6,
          }
        : theme.effects.cardShadow,
      raised: defaultClay
        ? {
            shadowColor: '#09091A',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.34,
            shadowRadius: 22,
            elevation: 10,
          }
        : theme.effects.panelShadow,
    },
    motion: {
      pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
    },
  };
}

export const dashboardType = {
  eyebrow: { fontSize: 12, lineHeight: 16, letterSpacing: 0.8 } satisfies TextStyle,
  body: { fontSize: 16, lineHeight: 24 } satisfies TextStyle,
  bodySmall: { fontSize: 14, lineHeight: 20 } satisfies TextStyle,
  title: { fontSize: 20, lineHeight: 26 } satisfies TextStyle,
  display: { fontSize: 28, lineHeight: 34 } satisfies TextStyle,
  metric: { fontSize: 22, lineHeight: 28 } satisfies TextStyle,
};
