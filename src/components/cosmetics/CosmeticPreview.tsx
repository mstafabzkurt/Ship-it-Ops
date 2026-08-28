import React, { useMemo } from 'react';
import {
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type {
  AvatarCosmetic,
  AvatarFrameCosmetic,
  CosmeticType,
  CosmeticVisualReference,
} from '../../config/cosmetics';
import { useTheme } from '../../state/ThemeContext';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface CosmeticPreviewProps {
  avatar: AvatarCosmetic;
  frame: AvatarFrameCosmetic;
  size?: number;
  variant?: CosmeticPreviewVariant;
  accessibilityLabel?: string;
}

type CosmeticPreviewVariant = 'compact' | 'store' | 'profile';

const PREVIEW_METRICS: Record<
  CosmeticPreviewVariant,
  {
    compactSize: number;
    regularSize: number;
    avatarViewportScale: number;
    avatarScale: number;
    avatarOffsetYScale: number;
    frameScale: number;
  }
> = {
  compact: {
    compactSize: 82,
    regularSize: 94,
    avatarViewportScale: 0.76,
    avatarScale: 0.86,
    avatarOffsetYScale: 0.025,
    frameScale: 1,
  },
  store: {
    compactSize: 96,
    regularSize: 108,
    avatarViewportScale: 0.8,
    avatarScale: 0.96,
    avatarOffsetYScale: 0.03,
    frameScale: 0.96,
  },
  profile: {
    compactSize: 100,
    regularSize: 120,
    avatarViewportScale: 0.8,
    avatarScale: 1,
    avatarOffsetYScale: 0.04,
    frameScale: 0.96,
  },
};

interface VisualGlyphProps {
  visual: CosmeticVisualReference;
  type: CosmeticType;
  size: number;
  color: string;
}

function VisualGlyph({ visual, type, size, color }: VisualGlyphProps) {
  if (visual.kind === 'asset') {
    return (
      <Image
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        source={visual.source}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    );
  }

  const fallbackName = type === 'avatar' ? 'person-outline' : 'scan-outline';
  const iconName = visual.reference || fallbackName;
  return (
    <Ionicons
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      name={iconName as React.ComponentProps<typeof Ionicons>['name']}
      size={size}
      color={color}
    />
  );
}

export default function CosmeticPreview({
  avatar,
  frame,
  size,
  variant = 'compact',
  accessibilityLabel,
}: CosmeticPreviewProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const metrics = PREVIEW_METRICS[variant];
  const resolvedSize = size ?? (tokens.layout.isCompact ? metrics.compactSize : metrics.regularSize);
  const avatarViewportSize = Math.round(resolvedSize * metrics.avatarViewportScale);
  const innerSize = Math.round(resolvedSize * 0.72);
  const avatarAssetSize = Math.round(resolvedSize * metrics.avatarScale);
  const avatarOffsetY = Math.round(resolvedSize * metrics.avatarOffsetYScale);
  const frameAssetSize = Math.round(resolvedSize * metrics.frameScale);

  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.stage,
        variant === 'profile' && styles.profileStage,
        { width: resolvedSize, height: resolvedSize },
      ]}
    >
      <View pointerEvents="none" style={styles.avatarLayer}>
        <View
          style={[
            styles.avatarViewport,
            {
              width: avatarViewportSize,
              height: avatarViewportSize,
              borderRadius: Math.round(avatarViewportSize * 0.2),
            },
          ]}
        >
          {avatar.visual.kind === 'asset' ? (
            <View style={{ transform: [{ translateY: avatarOffsetY }] }}>
              <VisualGlyph
                visual={avatar.visual}
                type="avatar"
                size={avatarAssetSize}
                color={tokens.colors.secondary}
              />
            </View>
          ) : (
            <View style={[styles.avatarPlate, { width: innerSize, height: innerSize }]}>
              <VisualGlyph
                visual={avatar.visual}
                type="avatar"
                size={Math.round(resolvedSize * 0.38)}
                color={tokens.colors.secondary}
              />
            </View>
          )}
        </View>
      </View>
      <View pointerEvents="none" style={styles.frameLayer}>
        <VisualGlyph
          visual={frame.visual}
          type="avatar_frame"
          size={frame.visual.kind === 'asset' ? frameAssetSize : Math.round(resolvedSize * 0.92)}
          color={tokens.colors.primary}
        />
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    stage: {
      position: 'relative',
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileStage: {
      overflow: 'hidden',
    },
    avatarLayer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarViewport: {
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarPlate: {
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: radius.md,
      backgroundColor: colors.secondarySurfaceRaised,
      borderWidth: 1,
      borderColor: colors.dividerSubtle,
    },
    frameLayer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
