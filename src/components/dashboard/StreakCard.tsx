import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

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
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const displayDays = useMemo(() => getDisplayDays(days, todayIndex), [days, todayIndex]);
  const todayClaimed = days[todayIndex] === true;
  const todayReward = STREAK_REWARDS[todayIndex];
  const [open, setOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [triggerFocused, setTriggerFocused] = useState(false);
  const [claimFocused, setClaimFocused] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${streakCount} günlük seri. Yedi günlük takvimi aç.`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        onFocus={() => setTriggerFocused(true)}
        onBlur={() => setTriggerFocused(false)}
        style={({ pressed }) => [
          styles.trigger,
          triggerFocused && styles.triggerFocused,
          pressed && tokens.motion.pressed,
        ]}
      >
        <View style={styles.triggerIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="calendar" size={22} style={styles.triggerIconGlyph} />
        </View>
        <View style={styles.triggerCopy}>
          <Text style={styles.triggerEyebrow}>GÜNLÜK SERİ</Text>
          <Text style={styles.triggerTitle}>{streakCount} Günlük Seri</Text>
        </View>
        <View style={[styles.todayStatus, todayClaimed && styles.todayStatusClaimed]}>
          <Text style={styles.todayStatusIcon}>{todayClaimed ? '🔥' : '🎁'}</Text>
          <Text style={[styles.todayStatusText, todayClaimed && styles.todayStatusTextClaimed]}>
            {todayClaimed ? 'ALINDI' : 'HAZIR'}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          style={styles.triggerChevron}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </Pressable>

      <Modal
        animationType={reduceMotion ? 'none' : 'fade'}
        transparent
        visible={open}
        presentationStyle="overFullScreen"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Günlük seri takvimini kapat"
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
          />

          <View style={styles.panel} accessibilityViewIsModal>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              pointerEvents="none"
              style={styles.panelInnerEdge}
            />
            <View style={styles.panelHeader}>
              <View style={styles.panelHeaderCopy}>
                <Text style={styles.panelEyebrow}>7 günlük görünüm</Text>
                <Text style={styles.panelTitle}>{streakCount} Günlük Seri</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Günlük seri takvimini kapat"
                hitSlop={8}
                onPress={() => setOpen(false)}
                style={({ pressed }) => [styles.closeButton, pressed && tokens.motion.pressed]}
              >
                <Ionicons name="close" size={21} style={styles.closeIcon} />
              </Pressable>
            </View>

            <View style={styles.daysRow}>
              {displayDays.map((day, index) => (
                <View
                  key={day.key}
                  accessibilityLabel={getDayAccessibilityLabel(day)}
                  style={[
                    styles.dayCard,
                    index < displayDays.length - 1 && styles.dayDivider,
                    styles[`${day.state}Day`],
                    day.isToday && styles.currentDay,
                  ]}
                >
                  <Text style={[styles.dayLabel, day.isToday && styles.currentDayLabel]}>{day.label}</Text>
                  <Text style={styles.dayIcon}>{getDayIcon(day.state)}</Text>
                  {day.state !== 'claimed' ? (
                    <Text style={[styles.dayReward, styles[`${day.state}Reward`]]} numberOfLines={1} adjustsFontSizeToFit>
                      +${day.reward.toLocaleString('tr-TR')}
                    </Text>
                  ) : null}
                </View>
              ))}
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
                    claimFocused && styles.claimButtonFocused,
                    pressed && tokens.motion.pressed,
                  ]}
                >
                  <Text style={styles.claimButtonText}>Ödülü Al</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function getDayIcon(state: StreakDayState) {
  if (state === 'claimed') return '🔥';
  if (state === 'today') return '🎁';
  if (state === 'missed') return '✕';
  return '⏳';
}

function getDayAccessibilityLabel(day: DisplayDay) {
  if (day.state === 'claimed') return `${day.label}, alındı`;
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
    triggerIcon: {
      width: 40,
      height: 40,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: colors.warningSoft,
    },
    triggerIconGlyph: { color: colors.secondary },
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
    todayStatusIcon: { fontSize: 14, lineHeight: 18 },
    todayStatusText: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, color: colors.warning },
    todayStatusTextClaimed: { color: colors.secondary },
    triggerChevron: { color: colors.textMuted },
    modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: tokens.layout.pageGutter, backgroundColor: modalScrim },
    panel: {
      width: '100%',
      maxWidth: 540,
      overflow: 'hidden',
      padding: tokens.layout.isCompact ? 14 : 17,
      borderRadius: radius.lg,
      backgroundColor: colors.floatingSurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
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
      backgroundColor: withAlpha(colors.text, 0.2),
    },
    panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    panelHeaderCopy: { flex: 1, minWidth: 0 },
    panelEyebrow: {
      fontFamily: fonts.bodyMedium,
      fontSize: 11,
      lineHeight: 15,
      letterSpacing: 0.15,
      color: colors.textMuted,
      marginBottom: 2,
    },
    panelTitle: {
      fontFamily: fonts.headingBold,
      fontSize: tokens.layout.isCompact ? 18 : 20,
      lineHeight: tokens.layout.isCompact ? 23 : 26,
      color: colors.text,
    },
    closeButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: colors.floatingSurfaceRaised,
      borderWidth: 1,
      borderColor: colors.dividerSubtle,
    },
    closeIcon: { color: colors.textMuted },
    daysRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginTop: tokens.layout.isCompact ? 13 : 18,
      paddingVertical: tokens.layout.isCompact ? 2 : 4,
    },
    dayCard: {
      flex: 1,
      minWidth: 0,
      minHeight: tokens.layout.isCompact ? 76 : 88,
      alignItems: 'center',
      paddingHorizontal: tokens.layout.isNarrow ? 2 : 5,
      paddingVertical: tokens.layout.isCompact ? 6 : 8,
      borderRadius: radius.sm,
    },
    dayDivider: { borderRightWidth: 1, borderRightColor: colors.dividerSubtle },
    claimedDay: { opacity: 0.8 },
    todayDay: { backgroundColor: withAlpha(colors.warning, 0.09) },
    missedDay: { opacity: 0.68 },
    upcomingDay: { opacity: 0.5 },
    currentDay: {
      opacity: 1,
      backgroundColor: withAlpha(colors.warning, 0.1),
      borderWidth: 1,
      borderColor: withAlpha(colors.warning, 0.48),
    },
    dayLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, color: colors.textMuted },
    currentDayLabel: { color: colors.warning },
    dayIcon: { fontSize: tokens.layout.isCompact ? 17 : 19, lineHeight: tokens.layout.isCompact ? 22 : 24, marginTop: 4 },
    dayReward: {
      width: '100%',
      fontFamily: fonts.monoSemiBold,
      fontSize: tokens.layout.isNarrow ? 8 : 9,
      lineHeight: 13,
      textAlign: 'center',
      marginTop: 3,
    },
    todayReward: { color: colors.warning },
    missedReward: { color: colors.danger },
    upcomingReward: { color: colors.textMuted },
    claimedReward: { color: colors.secondary },
    rewardFooter: {
      minHeight: tokens.layout.isCompact ? 58 : 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      marginTop: tokens.layout.isCompact ? 10 : 14,
      paddingTop: tokens.layout.isCompact ? 10 : 13,
      borderTopWidth: 1,
      borderTopColor: colors.dividerSubtle,
    },
    rewardFooterCopy: { flex: 1, minWidth: 0 },
    rewardFooterLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.55, color: colors.textMuted },
    rewardFooterValue: { fontFamily: fonts.monoBold, fontSize: tokens.layout.isCompact ? 13 : 15, lineHeight: tokens.layout.isCompact ? 18 : 20, color: colors.warning, marginTop: 2 },
    rewardFooterValueClaimed: { color: colors.secondary },
    claimButton: {
      minHeight: tokens.control.height,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tokens.layout.isCompact ? 13 : 17,
      borderRadius: radius.md,
      backgroundColor: withAlpha(colors.warning, 0.13),
      borderWidth: 1,
      borderColor: withAlpha(colors.warning, 0.52),
    },
    claimButtonFocused: { borderColor: colors.text },
    claimButtonText: { fontFamily: fonts.headingSemiBold, fontSize: 13, lineHeight: 18, color: colors.warning },
  });
}
