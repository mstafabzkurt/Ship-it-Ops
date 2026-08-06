import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../state/ThemeContext';
import type { Theme } from '../theme/themes';
import { fonts, fontSizes } from '../theme/typography';

type Variant = 'positive' | 'crisis';

interface StatusPillProps {
  label: string;
  variant?: Variant;
  pulse?: boolean;
}

export default function StatusPill({ label, variant = 'positive', pulse = false }: StatusPillProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 700, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.ease, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, opacity]);

  const isCrisis = variant === 'crisis';
  const tint = isCrisis ? colors.accentDanger : colors.accentPositive;
  const bg = isCrisis ? colors.dangerBg : colors.positiveBg;
  const border = isCrisis ? colors.dangerBorder : colors.positiveBorder;

  // Inline styles since they depend on runtime values
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border }]}>
      <Animated.View style={[styles.dot, { backgroundColor: tint, opacity: pulse ? opacity : 1 }]} />
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
    </View>
  );
}

// StatusPill uses fully inline color styles — static sheet for structure only
const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
  },
});
