import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../state/ThemeContext';
import type { Theme } from '../theme/themes';
import { fonts, fontSizes } from '../theme/typography';
import { useReputation } from '../state/ReputationContext';

const VISIBLE_MS = 3000;

export default function BadgeToast() {
  const { pendingBadges, dismissBadge } = useReputation();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const badge = pendingBadges[0];
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!badge) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    const timeout = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => dismissBadge());
    }, VISIBLE_MS);
    return () => clearTimeout(timeout);
  }, [badge?.id]);

  if (!badge) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        },
      ]}
    >
      <Text style={styles.icon}>{badge.icon}</Text>
      <View style={styles.textWrap}>
        <Text style={styles.title}>Yeni rozet: {badge.title}</Text>
        <Text style={styles.desc}>{badge.description}</Text>
        {badge.rewardBudget && (
          <Text style={styles.rewardToastText}>
            +{badge.rewardBudget.toLocaleString('tr-TR')} Bütçe Eklendi!
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

function makeStyles(theme: Theme) {
  const { colors, geometry, effects } = theme;
  return StyleSheet.create({
    toast: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: 100,
      backgroundColor: colors.panelAlt,
      borderWidth: geometry.borderWidth,
      borderColor: colors.accentPositive,
      borderRadius: geometry.borderRadius,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      ...effects.glowPositive,
    },
    icon: {
      fontSize: 24,
    },
    textWrap: {
      flex: 1,
    },
    title: {
      fontFamily: fonts.bodySemiBold,
      fontSize: fontSizes.md,
      color: colors.textPrimary,
    },
    desc: {
      fontFamily: fonts.body,
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      marginTop: 2,
    },
    rewardToastText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: fontSizes.sm,
      color: colors.accentPositive,
      marginTop: 4,
    },
  });
}