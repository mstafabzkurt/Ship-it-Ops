import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Keyboard, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDashboardTokens } from '../dashboard/dashboardTokens';
import { useAuth } from '../../state/AuthContext';
import { useMessagingUnread } from '../../state/MessagingUnreadContext';
import { usePrivacyConsent } from '../../state/PrivacyConsentContext';
import { useReputation } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import {
  formatGlobalUnreadBadge,
  getMessagesShortcutAccessibilityLabel,
  shouldAnimateUnreadAttention,
  shouldShowGlobalMessagesShortcut,
} from '../../utils/globalMessaging';

const TAB_PATHS = new Set(['/', '/index', '/play', '/reputation', '/ranking', '/store', '/leaderboard']);

export default function GlobalMessagesShortcut() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { isLoaded, onboardingCompleted, tutorialCompleted } = useReputation();
  const { consent, isHydrated: isConsentHydrated, preferencesVisible } = usePrivacyConsent();
  const { unreadCount, hasLoaded } = useMessagingUnread();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  const pulse = useRef(new Animated.Value(1)).current;
  const previousUnreadRef = useRef<number | null>(null);
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const normalizedPath = pathname.replace(/^\/\(tabs\)/, '').replace(/\/$/, '') || '/';
  const aboveTabBar = TAB_PATHS.has(normalizedPath);
  const bottom = aboveTabBar
    ? tokens.layout.tabBarHeight + Math.max(insets.bottom, tokens.spacing.sm) + 12
    : Math.max(insets.bottom, tokens.spacing.sm) + 20;
  const visible = shouldShowGlobalMessagesShortcut({
    pathname,
    isAuthenticated,
    isPlayerReady: isLoaded,
    onboardingCompleted,
    tutorialCompleted,
    consentReady: isConsentHydrated && consent !== null && !preferencesVisible,
    keyboardVisible,
  });
  const badge = formatGlobalUnreadBadge(unreadCount);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduceMotion(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      previousUnreadRef.current = null;
      return undefined;
    }
    const shouldAnimate = shouldAnimateUnreadAttention(previousUnreadRef.current, unreadCount, reduceMotion, visible);
    previousUnreadRef.current = unreadCount;
    if (!shouldAnimate) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return undefined;
    }
    pulse.setValue(1);
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.08, duration: 150, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    return () => pulse.stopAnimation();
  }, [hasLoaded, pulse, reduceMotion, unreadCount, visible]);

  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={[styles.position, { bottom, right: Math.max(insets.right, tokens.layout.pageGutter) }]}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={getMessagesShortcutAccessibilityLabel(unreadCount)}
          hitSlop={8}
          onPress={() => router.push('/messages')}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Ionicons name="chatbubbles-outline" size={23} color={tokens.colors.secondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
          {badge ? (
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  return StyleSheet.create({
    position: { position: 'absolute', zIndex: 20, elevation: 12 },
    button: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.md, borderWidth: 1, borderColor: tokens.colors.borderStrong, backgroundColor: tokens.colors.surfaceRaised, ...tokens.shadow.raised },
    pressed: { backgroundColor: tokens.colors.surfacePressed, opacity: 0.82 },
    badge: { position: 'absolute', top: -7, right: -8, minWidth: 23, height: 23, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderRadius: tokens.radius.pill, borderWidth: 2, borderColor: tokens.colors.surfaceRaised, backgroundColor: tokens.colors.secondary },
    badgeText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, color: tokens.colors.foregroundOnAction },
  });
}
