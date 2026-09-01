import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';
import ProgressSweep from '../ProgressSweep';

interface UptimeMilestoneCardProps {
  currentUptime: number;
  nextMilestone: number | null;
  milestoneReached: boolean;
  reduceMotion: boolean;
}

export default function UptimeMilestoneCard({
  currentUptime,
  nextMilestone,
  milestoneReached,
  reduceMotion,
}: UptimeMilestoneCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  const progress = nextMilestone === null
    ? 1
    : Math.min(1, Math.max(0, currentUptime / nextMilestone));
  const progressMax = nextMilestone ?? Math.max(currentUptime, 1);
  const progressNow = nextMilestone === null ? progressMax : Math.min(currentUptime, progressMax);
  const nextTargetLabel = nextMilestone?.toLocaleString('tr-TR') ?? 'Maks.';
  const progressValueLabel = nextMilestone === null
    ? 'Tüm hedefler tamamlandı'
    : `${currentUptime.toLocaleString('tr-TR')} / ${nextMilestone.toLocaleString('tr-TR')}`;
  const progressLabel = nextMilestone === null ? 'Hedef durumu' : 'Sonraki hedefe ilerleme';

  return (
    <View style={[styles.card, milestoneReached && styles.cardReached]}>
      <View style={styles.topRow}>
        <View style={styles.currentGroup}>
          <View style={[styles.iconSlot, milestoneReached && styles.iconSlotReached]}>
            <Ionicons
              name="flame"
              size={27}
              color={milestoneReached ? tokens.colors.secondary : tokens.colors.warning}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
            {milestoneReached ? (
              <View style={styles.reachedMark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Ionicons name="checkmark" size={11} color={tokens.colors.onAccent} />
              </View>
            ) : null}
          </View>

          <View style={styles.currentCopy}>
            <Text style={styles.metricLabel}>UPTIME TRACK</Text>
            <Text style={[styles.currentValue, milestoneReached && styles.currentValueReached]}>
              {currentUptime.toLocaleString('tr-TR')}
            </Text>
          </View>
        </View>

        <View style={styles.instrumentDivider} />

        <View style={styles.targetGroup}>
          <Text style={styles.targetLabel}>SONRAKİ HEDEF</Text>
          <Text style={[styles.targetValue, milestoneReached && styles.targetValueReached]}>{nextTargetLabel}</Text>
        </View>
      </View>

      {milestoneReached ? (
        <View style={styles.reachedPill}>
          <Ionicons
            name="checkmark-circle-outline"
            size={13}
            color={tokens.colors.secondary}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
          <Text style={styles.reachedText}>DÖNÜM NOKTASI TAMAMLANDI</Text>
        </View>
      ) : null}

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{progressLabel}</Text>
        <Text style={styles.progressValue}>{progressValueLabel}</Text>
      </View>
      <ProgressSweep
        value={progress}
        reduceMotion={reduceMotion}
        trackStyle={styles.progressTrack}
        fillStyle={[styles.progressFill, milestoneReached && styles.progressFillReached]}
        sweepColor={tokens.colors.text}
        accessibilityLabel={milestoneReached
          ? `Uptime ${currentUptime}, dönüm noktası tamamlandı. Sonraki hedef ${nextTargetLabel}`
          : `Uptime ${currentUptime}. Sonraki hedef ${nextTargetLabel}`}
        accessibilityValue={{ min: 0, max: progressMax, now: progressNow, text: progressValueLabel }}
      />
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;

  return StyleSheet.create({
    card: {
      overflow: 'hidden',
      padding: tokens.layout.isCompact ? 12 : 16,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.floatingSurface,
    },
    cardReached: {
      borderColor: colors.secondary,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: tokens.layout.isCompact ? 8 : 12,
    },
    currentGroup: { flexDirection: 'row', alignItems: 'center', gap: tokens.layout.isCompact ? 8 : 11 },
    iconSlot: {
      width: tokens.layout.isCompact ? 44 : 50,
      height: tokens.layout.isCompact ? 44 : 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.warning,
      backgroundColor: colors.warningSoft,
    },
    iconSlotReached: { backgroundColor: colors.secondarySoft },
    reachedMark: {
      position: 'absolute',
      top: -5,
      right: -5,
      width: 21,
      height: 21,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      backgroundColor: colors.secondary,
      borderWidth: 2,
      borderColor: colors.secondarySurface,
    },
    currentCopy: { minWidth: 62 },
    metricLabel: {
      fontFamily: fonts.monoMedium,
      fontSize: 10,
      lineHeight: 15,
      letterSpacing: 0.7,
      color: colors.textMuted,
    },
    currentValue: {
      fontFamily: fonts.monoBold,
      fontSize: tokens.layout.isCompact ? 23 : 29,
      lineHeight: tokens.layout.isCompact ? 27 : 33,
      color: colors.warning,
    },
    currentValueReached: { color: colors.secondary },
    instrumentDivider: {
      width: 1,
      alignSelf: 'stretch',
      backgroundColor: colors.dividerSubtle,
    },
    targetGroup: {
      minWidth: tokens.layout.isCompact ? 72 : 88,
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    targetLabel: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 10,
      lineHeight: 14,
      letterSpacing: 0.55,
      color: colors.textMuted,
    },
    targetValue: { fontFamily: fonts.monoBold, fontSize: tokens.layout.isCompact ? 16 : 18, lineHeight: tokens.layout.isCompact ? 20 : 23, color: colors.warning },
    targetValueReached: { color: colors.secondary },
    reachedPill: {
      alignSelf: 'flex-start',
      minHeight: 28,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      paddingHorizontal: 7,
      backgroundColor: 'transparent',
    },
    reachedText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 10,
      lineHeight: 14,
      letterSpacing: 0.45,
      color: colors.secondary,
    },
    progressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: tokens.layout.isCompact ? 7 : 10,
      marginBottom: 5,
    },
    progressLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 16, color: colors.textMuted },
    progressValue: { fontFamily: fonts.monoSemiBold, fontSize: 11, lineHeight: 16, color: colors.text },
    progressTrack: {
      height: 7,
      overflow: 'hidden',
      borderRadius: radius.pill,
      backgroundColor: colors.dividerSubtle,
    },
    progressFill: {
      minWidth: 0,
      height: '100%',
      borderRadius: radius.pill,
      backgroundColor: colors.warning,
    },
    progressFillReached: { backgroundColor: colors.secondary },
  });
}
