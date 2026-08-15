import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { dashboardType, getDashboardTokens } from '../dashboard/dashboardTokens';

export interface JokerUseActivation {
  activationId: number;
  icon: string;
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
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
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
        <View style={styles.iconSlot}>
          <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {activation.icon}
          </Text>
        </View>

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>JOKER KULLANILDI</Text>
          <Text style={styles.name}>{activation.name}</Text>
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
      backgroundColor: colors.canvas,
    },
    card: {
      width: '100%',
      maxWidth: 460,
      minHeight: 300,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      paddingHorizontal: 24,
      paddingVertical: 28,
      borderRadius: radius.xl,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 2,
      borderColor: accent.solid,
      shadowColor: accent.solid,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.38,
      shadowRadius: 28,
      elevation: Math.max(Number(shadow.raised.elevation ?? 10), 12),
    },
    iconSlot: {
      width: 104,
      height: 104,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.xl,
      backgroundColor: accent.soft,
      borderWidth: 2,
      borderColor: accent.solid,
      shadowColor: accent.solid,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.32,
      shadowRadius: 18,
      elevation: 8,
    },
    icon: { fontSize: 52, lineHeight: 64 },
    copy: { width: '100%', alignItems: 'center', gap: 2 },
    eyebrow: {
      ...dashboardType.eyebrow,
      fontFamily: fonts.monoBold,
      color: accent.solid,
      textAlign: 'center',
    },
    name: {
      ...dashboardType.display,
      fontFamily: fonts.headingBold,
      color: colors.text,
      textAlign: 'center',
    },
    quantityBlock: {
      width: '100%',
      alignItems: 'center',
      gap: 8,
      marginTop: 2,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.borderStrong,
    },
    quantityLabel: {
      ...dashboardType.eyebrow,
      fontFamily: fonts.monoBold,
      color: colors.textMuted,
    },
    quantityRow: {
      width: '100%',
      minHeight: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    countBadge: {
      minWidth: 96,
      height: 58,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      borderRadius: radius.lg,
      borderWidth: 2,
    },
    countBadgeBefore: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.borderStrong,
    },
    countBadgeAfter: {
      backgroundColor: accent.solid,
      borderColor: colors.surfaceHighlightStrong,
      shadowColor: accent.solid,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    arrow: {
      width: 28,
      fontFamily: fonts.headingBold,
      fontSize: 28,
      lineHeight: 32,
      color: accent.solid,
      textAlign: 'center',
    },
    count: {
      fontFamily: fonts.monoBold,
      fontSize: 27,
      lineHeight: 32,
      color: colors.text,
    },
    countAfter: { color: colors.onAccent },
  });
}
