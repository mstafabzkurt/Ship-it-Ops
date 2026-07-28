import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { useReputation } from '../state/ReputationContext';

const VISIBLE_MS = 3000;

// Rozet kazanıldığında ekranın altında beliren global bildirim.
// app/_layout.tsx içinde, Stack'in dışında (tüm sekmelerin üstünde) render edilir,
// böylece kullanıcı hangi sekmede olursa olsun rozetini görür.
export default function BadgeToast() {
  const { pendingBadges, dismissBadge } = useReputation();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 100,
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.accentPositive,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
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
});
