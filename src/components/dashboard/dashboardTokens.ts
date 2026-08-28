import type { TextStyle, ViewStyle } from 'react-native';
import type { Theme } from '../../theme/themes';

export interface DashboardTokens {
  colors: {
    canvas: string;
    canvasGlow: string;
    surface: string;
    surfaceRaised: string;
    surfaceSoft: string;
    secondarySurface: string;
    secondarySurfaceRaised: string;
    floatingSurface: string;
    floatingSurfaceRaised: string;
    border: string;
    borderStrong: string;
    borderSubtle: string;
    dividerSubtle: string;
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
    shadowNeutral: string;
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
    isCompact: boolean;
    isNarrow: boolean;
    contentMaxWidth: number;
    gameMaxWidth: number;
    pageGutter: number;
    pageGutterWide: number;
    pageTop: number;
    pageBottom: number;
    sectionGap: number;
    floatingInset: number;
    tabBarHeight: number;
    cardPadding: number;
    cardPaddingTight: number;
  };
  type: {
    eyebrow: TextStyle;
    body: TextStyle;
    bodySmall: TextStyle;
    title: TextStyle;
    display: TextStyle;
    metric: TextStyle;
    question: TextStyle;
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

export function getDashboardTokens(theme: Theme, viewportWidth = 1024): DashboardTokens {
  const defaultClay = theme.id === 'default';
  const isCompact = viewportWidth < 600;
  const isNarrow = viewportWidth < 380;
  const canvas = defaultClay ? '#111229' : theme.colors.bgBase;
  const surface = defaultClay ? '#1A1C3D' : theme.colors.panel;
  const surfaceRaised = defaultClay ? '#242750' : theme.colors.panelAlt;
  const textMuted = defaultClay ? '#BBBBD3' : theme.colors.textMuted;
  const secondarySurfaceBase = defaultClay
    ? mixHex(canvas, '#070B12', 0.52)
    : mixHex(surface, canvas, 0.42);
  const secondarySurfaceRaisedBase = defaultClay
    ? mixHex(surfaceRaised, '#0B111B', 0.66)
    : mixHex(surfaceRaised, canvas, 0.34);
  const floatingSurfaceBase = defaultClay
    ? mixHex(canvas, '#070B12', 0.72)
    : mixHex(surfaceRaised, canvas, 0.62);
  const floatingSurfaceRaisedBase = defaultClay
    ? mixHex(surfaceRaised, '#0B111B', 0.78)
    : mixHex(surfaceRaised, canvas, 0.44);

  return {
    colors: {
      canvas,
      canvasGlow: defaultClay ? '#252052' : theme.colors.panelAlt,
      surface,
      surfaceRaised,
      surfaceSoft: defaultClay ? '#202247' : theme.colors.panelAlt,
      secondarySurface: withAlpha(secondarySurfaceBase, 0.94),
      secondarySurfaceRaised: withAlpha(secondarySurfaceRaisedBase, 0.92),
      floatingSurface: withAlpha(floatingSurfaceBase, 0.96),
      floatingSurfaceRaised: withAlpha(floatingSurfaceRaisedBase, 0.92),
      border: defaultClay ? 'rgba(218, 216, 255, 0.13)' : theme.colors.border,
      borderStrong: defaultClay ? 'rgba(218, 216, 255, 0.24)' : theme.colors.positiveBorder,
      borderSubtle: withAlpha(textMuted, 0.16),
      dividerSubtle: withAlpha(textMuted, 0.11),
      primary: defaultClay ? '#8B7CF6' : theme.colors.accentPositive,
      primarySoft: defaultClay ? 'rgba(139, 124, 246, 0.18)' : theme.colors.positiveBg,
      secondary: defaultClay ? '#49D7C5' : theme.colors.accentPositive,
      secondarySoft: defaultClay ? 'rgba(73, 215, 197, 0.15)' : theme.colors.positiveBg,
      warning: defaultClay ? '#FFC857' : theme.colors.accentAlert,
      warningSoft: defaultClay ? 'rgba(255, 200, 87, 0.15)' : theme.colors.alertBg,
      danger: defaultClay ? '#FF7185' : theme.colors.accentDanger,
      dangerSoft: defaultClay ? 'rgba(255, 113, 133, 0.16)' : theme.colors.dangerBg,
      text: defaultClay ? '#F8F7FF' : theme.colors.textPrimary,
      textMuted,
      onAccent: defaultClay ? '#251B05' : theme.colors.bgBase,
      surfaceHighlight: defaultClay ? 'rgba(255, 255, 255, 0.16)' : theme.colors.positiveBg,
      surfaceHighlightStrong: defaultClay ? 'rgba(255, 255, 255, 0.32)' : theme.colors.positiveBorder,
      shadowNeutral: mixHex(canvas, '#000000', defaultClay ? 0.86 : 0.72),
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
      isCompact,
      isNarrow,
      contentMaxWidth: 1180,
      gameMaxWidth: 1280,
      pageGutter: isNarrow ? 12 : 16,
      pageGutterWide: 24,
      pageTop: isCompact ? 10 : 18,
      pageBottom: isCompact ? 28 : 48,
      sectionGap: isCompact ? 12 : 18,
      floatingInset: isCompact ? 12 : 20,
      tabBarHeight: isCompact ? 64 : 72,
      cardPadding: isCompact ? 14 : 20,
      cardPaddingTight: isCompact ? 12 : 16,
    },
    type: {
      eyebrow: isCompact
        ? { fontSize: 10, lineHeight: 14, letterSpacing: 0.65 }
        : dashboardType.eyebrow,
      body: isCompact ? { fontSize: 15, lineHeight: 22 } : dashboardType.body,
      bodySmall: isCompact ? { fontSize: 13, lineHeight: 18 } : dashboardType.bodySmall,
      title: isCompact ? { fontSize: 18, lineHeight: 23 } : dashboardType.title,
      display: isCompact ? { fontSize: 24, lineHeight: 30 } : dashboardType.display,
      metric: isCompact ? { fontSize: 20, lineHeight: 25 } : dashboardType.metric,
      question: isCompact
        ? { fontSize: isNarrow ? 20 : 21, lineHeight: isNarrow ? 27 : 28 }
        : { fontSize: 28, lineHeight: 37 },
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

function withAlpha(color: string, alpha: number) {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (!match) return color;
  const [, red, green, blue] = match;
  return `rgba(${parseInt(red, 16)}, ${parseInt(green, 16)}, ${parseInt(blue, 16)}, ${alpha})`;
}

function mixHex(base: string, overlay: string, overlayWeight: number) {
  const baseMatch = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(base);
  const overlayMatch = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(overlay);
  if (!baseMatch || !overlayMatch) return base;

  const channel = (index: number) => {
    const baseValue = parseInt(baseMatch[index], 16);
    const overlayValue = parseInt(overlayMatch[index], 16);
    return Math.round(baseValue * (1 - overlayWeight) + overlayValue * overlayWeight)
      .toString(16)
      .padStart(2, '0');
  };

  return `#${channel(1)}${channel(2)}${channel(3)}`;
}
