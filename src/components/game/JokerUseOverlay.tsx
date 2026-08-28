import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { dashboardType, getDashboardTokens } from '../dashboard/dashboardTokens';

export interface JokerUseActivation {
  activationId: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  name: string;
  countBefore: number;
}

interface JokerUseOverlayProps {
  activation: JokerUseActivation;
  reduceMotion: boolean;
  onFinished: (activationId: number) => void;
}

export default function JokerUseOverlay({ activation, reduceMotion, onFinished }: JokerUseOverlayProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const accent = useMemo(() => getJokerAccent(activation.name, tokens), [activation.name, tokens]);
  const styles = useMemo(() => makeStyles(tokens, accent), [accent, tokens]);
  const opacity = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(reduceMotion ? 1 : 0.85)).current;
  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : 12)).current;
  const beforeCountOpacity = useRef(new Animated.Value(1)).current;
  const beforeCountScale = useRef(new Animated.Value(1)).current;
  const arrowOpacity = useRef(new Animated.Value(0)).current;
  const afterCountOpacity = useRef(new Animated.Value(0)).current;
  const afterCountScale = useRef(new Animated.Value(reduceMotion ? 1 : 0.72)).current;
  const afterCountTranslateY = useRef(new Animated.Value(reduceMotion ? 0 : 16)).current;
  const countAfter = Math.max(0, activation.countBefore - 1);

  useEffect(() => {
    let mounted = true;
    opacity.setValue(0);
    backdropOpacity.setValue(0);
    cardScale.setValue(reduceMotion ? 1 : 0.85);
    translateY.setValue(reduceMotion ? 0 : 12);
    beforeCountOpacity.setValue(1);
    beforeCountScale.setValue(1);
    arrowOpacity.setValue(0);
    afterCountOpacity.setValue(0);
    afterCountScale.setValue(reduceMotion ? 1 : 0.72);
    afterCountTranslateY.setValue(reduceMotion ? 0 : 16);

    const entrance = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: reduceMotion ? 180 : 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0.42,
        duration: reduceMotion ? 180 : 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: reduceMotion ? 0 : 240,
        easing: Easing.out(Easing.back(1.25)),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: reduceMotion ? 0 : 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    entrance.start(({ finished }) => {
      if (!finished || !mounted) return;

      const decrement = Animated.parallel([
        Animated.timing(beforeCountOpacity, {
          toValue: 0.58,
          duration: reduceMotion ? 220 : 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(beforeCountScale, {
          toValue: reduceMotion ? 1 : 0.92,
          duration: reduceMotion ? 0 : 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(arrowOpacity, {
          toValue: 1,
          duration: reduceMotion ? 220 : 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(afterCountOpacity, {
          toValue: 1,
          duration: reduceMotion ? 220 : 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(afterCountTranslateY, {
          toValue: 0,
          duration: reduceMotion ? 0 : 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        reduceMotion
          ? Animated.delay(220)
          : Animated.sequence([
              Animated.timing(afterCountScale, {
                toValue: 1.18,
                duration: 150,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(afterCountScale, {
                toValue: 1,
                duration: 170,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
              }),
            ]),
      ]);

      const exit = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: reduceMotion ? 260 : 340,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: reduceMotion ? 260 : 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: reduceMotion ? 0 : -22,
          duration: reduceMotion ? 0 : 340,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: reduceMotion ? 1 : 0.96,
          duration: reduceMotion ? 0 : 340,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

      Animated.sequence([
        Animated.delay(reduceMotion ? 300 : 360),
        decrement,
        Animated.delay(300),
        exit,
      ]).start(({ finished: exitFinished }) => {
        if (exitFinished && mounted) onFinished(activation.activationId);
      });
    });

    return () => {
      mounted = false;
      opacity.stopAnimation();
      backdropOpacity.stopAnimation();
      cardScale.stopAnimation();
      translateY.stopAnimation();
      beforeCountOpacity.stopAnimation();
      beforeCountScale.stopAnimation();
      arrowOpacity.stopAnimation();
      afterCountOpacity.stopAnimation();
      afterCountScale.stopAnimation();
      afterCountTranslateY.stopAnimation();
    };
  }, [
    activation.activationId,
    afterCountOpacity,
    afterCountScale,
    afterCountTranslateY,
    arrowOpacity,
    backdropOpacity,
    beforeCountOpacity,
    beforeCountScale,
    cardScale,
    onFinished,
    opacity,
    reduceMotion,
    translateY,
  ]);

  return (
    <View pointerEvents="none" style={styles.layer}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      <Animated.View
        accessible
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${activation.name} kullanıldı. ${activation.countBefore} adetten ${countAfter} adede düştü.`}
        style={[styles.card, { opacity, transform: [{ translateY }, { scale: cardScale }] }]}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={styles.innerEdge}
        />
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={styles.accentRail}
        />

        <View style={styles.activationHeader}>
          <View style={styles.iconSlot}>
            <Ionicons
              name={activation.icon}
              size={38}
              color={accent.solid}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          </View>

          <View style={styles.copy}>
            <Text style={styles.eyebrow}>JOKER KULLANILDI</Text>
            <Text style={styles.name}>{activation.name}</Text>
          </View>
        </View>

        <View style={styles.quantityBlock}>
          <Text style={styles.quantityLabel}>ADET</Text>
          <View style={styles.quantityRow}>
            <Animated.View style={[styles.countBadge, styles.countBadgeBefore, { opacity: beforeCountOpacity, transform: [{ scale: beforeCountScale }] }]}>
              <Text style={styles.count}>×{activation.countBefore}</Text>
            </Animated.View>

            <Animated.Text style={[styles.arrow, { opacity: arrowOpacity }]}>→</Animated.Text>

            <Animated.View
              style={[
                styles.countBadge,
                styles.countBadgeAfter,
                { opacity: afterCountOpacity, transform: [{ translateY: afterCountTranslateY }, { scale: afterCountScale }] },
              ]}
            >
              <Text style={[styles.count, styles.countAfter]}>×{countAfter}</Text>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function getJokerAccent(name: string, tokens: ReturnType<typeof getDashboardTokens>) {
  if (name === 'Git Revert' || name === 'Snapshot') {
    return { solid: tokens.colors.secondary, soft: tokens.colors.secondarySoft };
  }
  if (name === 'Scale Up') {
    return { solid: tokens.colors.warning, soft: tokens.colors.warningSoft };
  }
  return { solid: tokens.colors.primary, soft: tokens.colors.primarySoft };
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>, accent: ReturnType<typeof getJokerAccent>) {
  const { colors, radius, shadow } = tokens;

  return StyleSheet.create({
    layer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      elevation: 100,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tokens.layout.pageGutter,
      paddingVertical: tokens.spacing.xl,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.shadowNeutral,
    },
    card: {
      width: '100%',
      maxWidth: 430,
      overflow: 'hidden',
      alignItems: 'stretch',
      justifyContent: 'center',
      gap: tokens.layout.isCompact ? 13 : 16,
      paddingHorizontal: tokens.layout.isCompact ? 16 : 20,
      paddingVertical: tokens.layout.isCompact ? 16 : 20,
      borderRadius: radius.md,
      backgroundColor: colors.floatingSurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      shadowColor: colors.shadowNeutral,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.5,
      shadowRadius: 28,
      elevation: Math.max(Number(shadow.raised.elevation ?? 10), 12),
    },
    innerEdge: {
      position: 'absolute',
      top: 0,
      left: tokens.layout.isCompact ? 16 : 20,
      right: tokens.layout.isCompact ? 16 : 20,
      height: 1,
      backgroundColor: colors.surfaceHighlight,
    },
    accentRail: {
      position: 'absolute',
      top: tokens.layout.isCompact ? 16 : 20,
      bottom: tokens.layout.isCompact ? 16 : 20,
      left: 0,
      width: 2,
      backgroundColor: accent.solid,
    },
    activationHeader: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.layout.isCompact ? 11 : 14,
    },
    iconSlot: {
      width: tokens.layout.isCompact ? 58 : 68,
      height: tokens.layout.isCompact ? 58 : 68,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: accent.soft,
      borderLeftWidth: 2,
      borderLeftColor: accent.solid,
    },
    copy: { flex: 1, minWidth: 0, alignItems: 'flex-start', gap: 2 },
    eyebrow: {
      ...dashboardType.eyebrow,
      fontFamily: fonts.monoBold,
      color: accent.solid,
      textAlign: 'left',
    },
    name: {
      ...dashboardType.display,
      fontFamily: fonts.headingBold,
      color: colors.text,
      textAlign: 'left',
    },
    quantityBlock: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.dividerSubtle,
    },
    quantityLabel: {
      ...dashboardType.eyebrow,
      fontFamily: fonts.monoBold,
      color: colors.textMuted,
    },
    quantityRow: {
      flexShrink: 1,
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
    },
    countBadge: {
      minWidth: tokens.layout.isCompact ? 66 : 76,
      height: tokens.layout.isCompact ? 46 : 50,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      borderRadius: radius.sm,
      borderWidth: 1,
    },
    countBadgeBefore: {
      backgroundColor: colors.floatingSurfaceRaised,
      borderColor: colors.borderSubtle,
    },
    countBadgeAfter: {
      backgroundColor: accent.solid,
      borderColor: colors.surfaceHighlightStrong,
      shadowColor: accent.solid,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 5,
    },
    arrow: {
      width: 22,
      fontFamily: fonts.headingBold,
      fontSize: 22,
      lineHeight: 26,
      color: accent.solid,
      textAlign: 'center',
    },
    count: {
      fontFamily: fonts.monoBold,
      fontSize: 23,
      lineHeight: 28,
      color: colors.text,
    },
    countAfter: { color: colors.onAccent },
  });
}
