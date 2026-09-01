import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STREAK_REWARDS } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from './dashboardTokens';

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;
const DAY_OFFSETS = [-3, -2, -1, 0, 1, 2, 3] as const;

type StreakDayState = 'claimed' | 'today' | 'missed' | 'upcoming';

interface StreakCardProps {
  days: boolean[];
  todayIndex: number;
  streakCount: number;
  onClaim: () => void;
}

interface DisplayDay {
  key: string;
  label: string;
  reward: number;
  state: StreakDayState;
  isToday: boolean;
}

function getDisplayDays(days: boolean[], todayIndex: number): DisplayDay[] {
  return DAY_OFFSETS.map((offset) => {
    const index = (todayIndex + offset + DAY_LABELS.length) % DAY_LABELS.length;
    const isToday = offset === 0;
    const state: StreakDayState = isToday
      ? days[index] ? 'claimed' : 'today'
      : offset < 0
        ? days[index] ? 'claimed' : 'missed'
        : 'upcoming';

    return {
      key: `${offset}-${index}`,
      label: DAY_LABELS[index],
      reward: STREAK_REWARDS[index],
      state,
      isToday,
    };
  });
}

export default function StreakCard({ days, todayIndex, streakCount, onClaim }: StreakCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const displayDays = useMemo(() => getDisplayDays(days, todayIndex), [days, todayIndex]);
  const todayClaimed = days[todayIndex] === true;
  const todayReward = STREAK_REWARDS[todayIndex];
  const [open, setOpen] = useState(false);
  // Stay still until the platform preference has resolved.
  const [reduceMotion, setReduceMotion] = useState(true);
  const [triggerFocused, setTriggerFocused] = useState(false);
  const [claimFocused, setClaimFocused] = useState(false);
  const [closeFocused, setCloseFocused] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const panelProgress = useRef(new Animated.Value(0)).current;
  const sequenceProgress = useRef(new Animated.Value(0)).current;
  const exitProgress = useRef(new Animated.Value(0)).current;
  const activeAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const closingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const updateReducedMotion = (enabled: boolean) => {
      if (!mounted) return;
      if (enabled && closingRef.current) {
        activeAnimationRef.current?.stop();
        closingRef.current = false;
        setOpen(false);
      }
      setReduceMotion(enabled);
    };
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      updateReducedMotion(enabled);
    }).catch(() => { /* Keep motion disabled if the preference is unavailable. */ });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', updateReducedMotion);
    return () => {
      mounted = false;
      subscription.remove();
      activeAnimationRef.current?.stop();
    };
  }, []);

  useLayoutEffect(() => {
    activeAnimationRef.current?.stop();
    backdropOpacity.stopAnimation();
    panelProgress.stopAnimation();
    sequenceProgress.stopAnimation();
    exitProgress.stopAnimation();

    if (!open) {
      backdropOpacity.setValue(0);
      panelProgress.setValue(0);
      sequenceProgress.setValue(0);
      exitProgress.setValue(0);
      closingRef.current = false;
      return;
    }
    if (closingRef.current) return;
    if (reduceMotion) {
      backdropOpacity.setValue(1);
      panelProgress.setValue(1);
      sequenceProgress.setValue(1);
      exitProgress.setValue(0);
      return;
    }

    backdropOpacity.setValue(0);
    panelProgress.setValue(0);
    sequenceProgress.setValue(0);
    exitProgress.setValue(0);
    const animation = Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 160,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(panelProgress, {
        toValue: 1,
        duration: 260,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(40),
        Animated.timing(sequenceProgress, {
          toValue: 1,
          duration: 540,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    ]);
    activeAnimationRef.current = animation;
    animation.start();
    return () => {
      animation.stop();
      if (activeAnimationRef.current === animation) activeAnimationRef.current = null;
    };
  }, [backdropOpacity, exitProgress, open, panelProgress, reduceMotion, sequenceProgress]);

  const handleOpen = useCallback(() => {
    closingRef.current = false;
    setCloseFocused(false);
    setClaimFocused(false);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    if (!open || closingRef.current) return;
    activeAnimationRef.current?.stop();

    if (reduceMotion) {
      setOpen(false);
      return;
    }

    closingRef.current = true;
    exitProgress.setValue(0);
    const animation = Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 130,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(exitProgress, {
        toValue: 1,
        duration: 145,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    activeAnimationRef.current = animation;
    animation.start(({ finished }) => {
      activeAnimationRef.current = null;
      closingRef.current = false;
      if (finished) setOpen(false);
    });
  }, [backdropOpacity, exitProgress, open, reduceMotion]);

  const panelTranslateY = panelProgress.interpolate({ inputRange: [0, 1], outputRange: [32, 0] });
  const panelScale = panelProgress.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] });
  const exitTranslateY = exitProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });
  const exitOpacity = exitProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const panelOpacity = Animated.multiply(panelProgress, exitOpacity);
  const railScaleX = sequenceProgress.interpolate({
    inputRange: [0, 0.62, 1],
    outputRange: [0.08, 1, 1],
  });
  const railTranslateX = sequenceProgress.interpolate({
    inputRange: [0, 0.62, 1],
    outputRange: [-48, 0, 0],
  });
  const railOpacity = sequenceProgress.interpolate({
    inputRange: [0, 0.08, 0.54, 0.68, 1],
    outputRange: [0, 0.72, 0.42, 0, 0],
  });
  const headerProgress = sequenceProgress.interpolate({
    inputRange: [0, 0.08, 0.42, 1],
    outputRange: [0, 0, 1, 1],
  });
  const headerTranslateY = headerProgress.interpolate({ inputRange: [0, 1], outputRange: [6, 0] });
  const footerProgress = sequenceProgress.interpolate({
    inputRange: [0, 0.72, 1],
    outputRange: [0, 0, 1],
  });
  const footerTranslateY = footerProgress.interpolate({ inputRange: [0, 1], outputRange: [4, 0] });
  const currentDayScale = sequenceProgress.interpolate({
    inputRange: [0, 0.47, 0.58, 0.7, 0.82, 1],
    outputRange: [1, 1, 0.985, 1.018, 1, 1],
  });
  const currentDayWashOpacity = sequenceProgress.interpolate({
    inputRange: [0, 0.5, 0.64, 0.8, 1],
    outputRange: [0, 0, 0.72, 0, 0],
  });
  const pressedStyle = reduceMotion ? styles.pressedStill : tokens.motion.pressed;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${streakCount} günlük seri. Yedi günlük takvimi aç.`}
        accessibilityState={{ expanded: open }}
        onPress={handleOpen}
        onFocus={() => setTriggerFocused(true)}
        onBlur={() => setTriggerFocused(false)}
        style={({ pressed }) => [
          styles.trigger,
          triggerFocused && styles.triggerFocused,
          pressed && pressedStyle,
        ]}
      >
        <View style={styles.triggerIcon} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="flame" size={24} style={styles.triggerIconGlyph} />
        </View>
        <View style={styles.triggerCopy}>
          <Text style={styles.triggerEyebrow}>DAILY STREAK</Text>
          <Text style={styles.triggerTitle}>{streakCount} günlük seri</Text>
        </View>
        <View style={[styles.todayStatus, todayClaimed && styles.todayStatusClaimed]}>
          <Ionicons
            name={todayClaimed ? 'checkmark-circle' : 'gift-outline'}
            size={15}
            color={todayClaimed ? tokens.colors.secondary : tokens.colors.warning}
            aria-hidden accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
          <Text style={[styles.todayStatusText, todayClaimed && styles.todayStatusTextClaimed]}>
            {todayClaimed ? 'ALINDI' : 'HAZIR'}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          style={styles.triggerChevron}
          aria-hidden accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </Pressable>

      <Modal
        animationType="none"
        transparent
        visible={open}
        presentationStyle="overFullScreen"
        onRequestClose={handleClose}
      >
        <View style={[
          styles.modalRoot,
          {
            paddingTop: Math.max(insets.top, tokens.layout.pageGutter),
            paddingBottom: Math.max(insets.bottom, tokens.layout.pageGutter),
            paddingLeft: Math.max(insets.left, tokens.layout.pageGutter),
            paddingRight: Math.max(insets.right, tokens.layout.pageGutter),
          },
        ]}>
          <Animated.View
            pointerEvents="none"
            style={[styles.modalBackdrop, { opacity: backdropOpacity }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Günlük seri takvimini kapat"
            focusable={false}
            tabIndex={-1}
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
          />

          <Animated.View
            style={[
              styles.panel,
              {
                opacity: panelOpacity,
                transform: [{ translateY: panelTranslateY }, { translateY: exitTranslateY }, { scale: panelScale }],
              },
            ]}
            accessibilityViewIsModal
            onAccessibilityEscape={handleClose}
          >
            <View
              aria-hidden accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              pointerEvents="none"
              style={styles.panelInnerEdge}
            />
            <Animated.View
              aria-hidden accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              pointerEvents="none"
              style={[
                styles.terminalRail,
                { opacity: railOpacity, transform: [{ translateX: railTranslateX }, { scaleX: railScaleX }] },
              ]}
            />
            <View style={styles.panelHeader}>
              <Animated.View
                style={[styles.panelHeaderCopy, { opacity: headerProgress, transform: [{ translateY: headerTranslateY }] }]}
              >
                <View style={styles.eyebrowRow}>
                  <View style={styles.eyebrowMark} />
                  <Text style={styles.panelEyebrow} accessibilityRole="header">DAILY STREAK</Text>
                </View>
              </Animated.View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Günlük seri takvimini kapat"
                hitSlop={8}
                onPress={handleClose}
                onFocus={() => setCloseFocused(true)}
                onBlur={() => setCloseFocused(false)}
                style={({ pressed }) => [styles.closeButton, closeFocused && styles.controlFocused, pressed && pressedStyle]}
              >
                <Ionicons name="close" size={21} style={styles.closeIcon} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
              </Pressable>
            </View>

            <ScrollView style={styles.panelScroll} contentContainerStyle={styles.panelContent} bounces={false}>
              <Animated.View style={[styles.hero, { opacity: headerProgress, transform: [{ translateY: headerTranslateY }] }]}>
                <View style={styles.flameModule} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
                  <View style={styles.flameHalo} />
                  <View style={styles.flameRing} />
                  <View style={styles.flameCore}>
                    <LinearGradient
                      colors={[withAlpha(tokens.colors.warning, 0.16), withAlpha(tokens.colors.warning, 0.02)]}
                      style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="flame" size={tokens.layout.isCompact ? 66 : 74} color={tokens.colors.warning} />
                  </View>
                  <View style={[styles.ringTick, styles.ringTickTop]} />
                  <View style={[styles.ringTick, styles.ringTickBottom]} />
                </View>
                <View accessible accessibilityLabel={`${streakCount} günlük seri`} accessibilityLiveRegion="polite" style={styles.streakSummary}>
                  <Text style={styles.streakNumber}>{streakCount}</Text>
                  <Text style={styles.streakLabel}>{streakCount} günlük seri</Text>
                </View>
              </Animated.View>

              <View style={styles.weekHeader}>
                <Text style={styles.weekLabel}>7 GÜNLÜK GÖRÜNÜM</Text>
                <Text style={styles.weekHint}>Günlük ritmin</Text>
              </View>
              <View style={styles.daysRow}>
                {displayDays.map((day, index) => {
                  const revealStart = 0.22 + index * 0.07;
                  const revealEnd = Math.min(0.98, revealStart + 0.28);
                  const dayProgress = sequenceProgress.interpolate({
                    inputRange: [0, revealStart, revealEnd, 1],
                    outputRange: [0, 0, 1, 1],
                  });
                  const dayTranslateY = dayProgress.interpolate({ inputRange: [0, 1], outputRange: [6, 0] });
                  return (
                    <Animated.View
                      key={day.key}
                      accessible
                      accessibilityLabel={getDayAccessibilityLabel(day)}
                      style={[
                        styles.dayCard,
                        {
                          opacity: dayProgress,
                          transform: [{ translateY: dayTranslateY }],
                        },
                      ]}
                    >
                      <Text style={[styles.dayLabel, day.isToday && styles.currentDayLabel]}>{day.label}</Text>
                      <Animated.View style={[
                        styles.dayCircle,
                        styles[`${day.state}Day`],
                        day.isToday && styles.currentDay,
                        { transform: [{ scale: day.isToday ? currentDayScale : 1 }] },
                      ]}>
                        {day.isToday ? (
                          <Animated.View
                            pointerEvents="none"
                            aria-hidden accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                            style={[styles.currentDayWash, { opacity: currentDayWashOpacity }]}
                          />
                        ) : null}
                        <Ionicons
                          name={getDayIcon(day.state)}
                          size={day.state === 'claimed' ? 20 : 16}
                          color={day.isToday || day.state === 'claimed' ? tokens.colors.warning : tokens.colors.textMuted}
                          aria-hidden accessibilityElementsHidden
                          importantForAccessibility="no-hide-descendants"
                        />
                      </Animated.View>
                      <Text style={[styles.dayCaption, day.isToday && styles.currentDayLabel]}>
                        {day.isToday ? 'Bugün' : day.state === 'claimed' ? 'Alındı' : day.state === 'missed' ? 'Kaçtı' : '—'}
                      </Text>
                    </Animated.View>
                  );
                })}
              </View>

              <Animated.View style={{ opacity: footerProgress, transform: [{ translateY: footerTranslateY }] }}>
                <View style={styles.statusFooter} accessibilityLiveRegion="polite">
                  <View style={styles.statusHeading}>
                    <Ionicons name={streakCount > 0 ? 'pulse' : 'flame-outline'} size={16} color={tokens.colors.warning} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
                    <Text style={styles.statusTitle}>{streakCount > 0 ? 'Seri aktif' : 'Ritmi başlat'}</Text>
                  </View>
                  <Text style={styles.statusMessage}>{todayClaimed ? 'Ritmi koru. Yarın tekrar gel.' : 'Bugünkü ödülün hazır. Ritmi yakala.'}</Text>
                </View>
                <View style={styles.rewardFooter}>
                  <View style={styles.rewardFooterCopy}>
                    <Text style={styles.rewardFooterLabel}>{todayClaimed ? 'BUGÜN' : 'BUGÜNKÜ ÖDÜL'}</Text>
                    <Text style={[styles.rewardFooterValue, todayClaimed && styles.rewardFooterValueClaimed]}>
                      {todayClaimed ? 'Ödül alındı' : `+${todayReward.toLocaleString('tr-TR')} Şirket Bütçesi`}
                    </Text>
                  </View>
                  {!todayClaimed ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Bugünkü ${todayReward.toLocaleString('tr-TR')} şirket bütçesi ödülünü al`}
                      onPress={onClaim}
                      onFocus={() => setClaimFocused(true)}
                      onBlur={() => setClaimFocused(false)}
                      style={({ pressed }) => [
                        styles.claimButton,
                        claimFocused && styles.controlFocused,
                        pressed && pressedStyle,
                      ]}
                    >
                      <Text style={styles.claimButtonText}>Ödülü Al</Text>
                      <Ionicons name="arrow-forward" size={16} color={tokens.colors.warning} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
                    </Pressable>
                  ) : <Ionicons name="checkmark-circle-outline" size={24} color={tokens.colors.secondary} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />}
                </View>
              </Animated.View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

function getDayIcon(state: StreakDayState) {
  if (state === 'claimed') return 'checkmark';
  if (state === 'today') return 'flame';
  if (state === 'missed') return 'close';
  return 'remove';
}

function getDayAccessibilityLabel(day: DisplayDay) {
  if (day.state === 'claimed') return `${day.label}, ${day.isToday ? 'bugün, ' : ''}alındı`;
  if (day.state === 'today') return `${day.label}, bugün, ${day.reward} şirket bütçesi alınabilir`;
  if (day.state === 'missed') return `${day.label}, kaçırıldı, ${day.reward} şirket bütçesi`;
  return `${day.label}, yaklaşan, ${day.reward} şirket bütçesi`;
}

function withAlpha(color: string, alpha: number) {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (!match) return color;
  const [, red, green, blue] = match;
  return `rgba(${parseInt(red, 16)}, ${parseInt(green, 16)}, ${parseInt(blue, 16)}, ${alpha})`;
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  const modalScrim = withAlpha(colors.canvas, 0.82);
  return StyleSheet.create({
    trigger: {
      minHeight: tokens.layout.isCompact ? 58 : 64,
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.layout.isCompact ? 8 : 11,
      paddingHorizontal: tokens.layout.isCompact ? 11 : 14,
      paddingVertical: 8,
      borderRadius: radius.md,
      backgroundColor: colors.secondarySurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderLeftWidth: 2,
      borderLeftColor: colors.warning,
    },
    triggerFocused: { borderColor: colors.text, borderWidth: 2 },
    pressedStill: { opacity: 0.88 },
    triggerIcon: {
      width: 40,
      height: 40,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      backgroundColor: colors.warningSoft,
    },
    triggerIconGlyph: { color: colors.warning },
    triggerCopy: { flex: 1, minWidth: 0 },
    triggerEyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.textMuted, marginBottom: 1 },
    triggerTitle: { fontFamily: fonts.headingBold, fontSize: tokens.layout.isCompact ? 16 : 18, lineHeight: tokens.layout.isCompact ? 20 : 23, color: colors.text },
    todayStatus: {
      minHeight: 32,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: tokens.layout.isNarrow ? 4 : 6,
    },
    todayStatusClaimed: { opacity: 0.84 },
    todayStatusText: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, color: colors.warning },
    todayStatusTextClaimed: { color: colors.secondary },
    triggerChevron: { color: colors.textMuted },
    modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: tokens.layout.pageGutter },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: modalScrim },
    panel: {
      width: '100%',
      maxWidth: 440,
      maxHeight: '100%',
      flexShrink: 1,
      overflow: 'hidden',
      borderRadius: radius.lg,
      backgroundColor: colors.floatingSurface,
      borderWidth: 1,
      borderColor: withAlpha(colors.warning, 0.22),
      ...shadow.raised,
      shadowColor: colors.shadowNeutral,
      shadowOpacity: 0.48,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 16 },
      elevation: 14,
    },
    panelInnerEdge: {
      position: 'absolute',
      top: 0,
      left: tokens.layout.isCompact ? 20 : 28,
      right: tokens.layout.isCompact ? 20 : 28,
      height: 1,
      backgroundColor: withAlpha(colors.warning, 0.4),
    },
    terminalRail: {
      position: 'absolute',
      top: 0,
      left: tokens.layout.isCompact ? 18 : 26,
      right: tokens.layout.isCompact ? 18 : 26,
      height: 2,
      backgroundColor: colors.warning,
    },
    panelHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      paddingLeft: tokens.layout.isCompact ? 20 : 24, paddingRight: 10, paddingTop: 8,
    },
    panelHeaderCopy: { flex: 1, minWidth: 0 },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eyebrowMark: { width: 4, height: 12, borderRadius: 2, backgroundColor: colors.warning },
    panelEyebrow: {
      fontFamily: fonts.monoSemiBold,
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 1.6,
      color: colors.warning,
    },
    closeButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    closeIcon: { color: colors.textMuted },
    controlFocused: { borderColor: colors.text },
    panelScroll: { flexShrink: 1 },
    panelContent: { paddingHorizontal: tokens.layout.isCompact ? 16 : 24, paddingBottom: tokens.layout.isCompact ? 18 : 24 },
    hero: { alignItems: 'center', paddingTop: 4, paddingBottom: tokens.layout.isCompact ? 24 : 28 },
    flameModule: {
      width: tokens.layout.isCompact ? 140 : 160,
      height: tokens.layout.isCompact ? 140 : 160,
      alignItems: 'center', justifyContent: 'center',
    },
    flameHalo: {
      ...StyleSheet.absoluteFillObject, borderRadius: 80,
      backgroundColor: withAlpha(colors.warning, 0.025),
      shadowColor: colors.warning, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.16, shadowRadius: 28,
    },
    flameRing: {
      position: 'absolute', top: 10, bottom: 10, left: 10, right: 10,
      borderRadius: 80, borderWidth: 1, borderColor: withAlpha(colors.warning, 0.17),
    },
    flameCore: {
      width: tokens.layout.isCompact ? 98 : 112,
      height: tokens.layout.isCompact ? 98 : 112,
      borderRadius: 60, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.floatingSurface,
      borderWidth: 1, borderColor: withAlpha(colors.warning, 0.26),
    },
    ringTick: { position: 'absolute', width: 14, height: 2, borderRadius: 1, backgroundColor: withAlpha(colors.warning, 0.6) },
    ringTickTop: { top: 10 },
    ringTickBottom: { bottom: 10 },
    streakSummary: { alignItems: 'center', width: '100%' },
    streakNumber: {
      fontFamily: fonts.headingBold, fontSize: tokens.layout.isCompact ? 64 : 72,
      lineHeight: tokens.layout.isCompact ? 72 : 80, color: colors.warning,
      fontVariant: ['tabular-nums'], textAlign: 'center',
    },
    streakLabel: { fontFamily: fonts.headingMedium, fontSize: 18, lineHeight: 25, color: colors.text, textAlign: 'center' },
    weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    weekLabel: { fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 16, letterSpacing: 0.8, color: colors.textMuted },
    weekHint: { fontFamily: fonts.body, fontSize: 11, lineHeight: 16, color: colors.textMuted },
    daysRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: tokens.layout.isNarrow ? 3 : 6,
      marginTop: 14,
    },
    dayCard: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
    },
    dayCircle: {
      width: '100%', maxWidth: 42, aspectRatio: 1, borderRadius: 24,
      alignItems: 'center', justifyContent: 'center', marginVertical: 7,
      borderWidth: 1, borderColor: colors.borderSubtle,
    },
    claimedDay: { backgroundColor: withAlpha(colors.warning, 0.12), borderColor: withAlpha(colors.warning, 0.32) },
    todayDay: { backgroundColor: withAlpha(colors.warning, 0.09) },
    missedDay: { backgroundColor: colors.floatingSurfaceRaised },
    upcomingDay: { backgroundColor: colors.secondarySurface },
    currentDay: {
      overflow: 'hidden',
      backgroundColor: withAlpha(colors.warning, 0.18),
      borderColor: colors.warning,
      shadowColor: colors.warning, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 8,
    },
    currentDayWash: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.warningSoft },
    dayLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 16, color: colors.textMuted, textAlign: 'center' },
    currentDayLabel: { color: colors.warning },
    dayCaption: { fontFamily: fonts.bodyMedium, fontSize: 10, lineHeight: 15, color: colors.textMuted, textAlign: 'center' },
    statusFooter: { alignItems: 'center', paddingVertical: 20, gap: 5 },
    statusHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusTitle: { fontFamily: fonts.headingSemiBold, fontSize: 14, lineHeight: 20, color: colors.text },
    statusMessage: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.textMuted, textAlign: 'center' },
    rewardFooter: {
      minHeight: tokens.layout.isCompact ? 58 : 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.dividerSubtle,
    },
    rewardFooterCopy: { flex: 1, minWidth: 0 },
    rewardFooterLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.55, color: colors.textMuted },
    rewardFooterValue: { fontFamily: fonts.monoBold, fontSize: tokens.layout.isCompact ? 13 : 15, lineHeight: tokens.layout.isCompact ? 18 : 20, color: colors.warning, marginTop: 2 },
    rewardFooterValueClaimed: { color: colors.secondary },
    claimButton: {
      minHeight: tokens.control.height,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tokens.layout.isCompact ? 13 : 17,
      borderRadius: radius.sm,
      backgroundColor: withAlpha(colors.warning, 0.13),
      borderWidth: 1,
      borderColor: withAlpha(colors.warning, 0.52),
    },
    claimButtonText: { fontFamily: fonts.headingSemiBold, fontSize: 13, lineHeight: 18, color: colors.warning },
  });
}
