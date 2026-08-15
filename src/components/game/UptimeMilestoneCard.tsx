import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface UptimeMilestoneCardProps {
  currentUptime: number;
  nextMilestone: number | null;
  milestoneReached: boolean;
}

export default function UptimeMilestoneCard({
  currentUptime,
  nextMilestone,
  milestoneReached,
}: UptimeMilestoneCardProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  const progress = nextMilestone === null
    ? 1
    : Math.min(1, Math.max(0, currentUptime / nextMilestone));
  const progressPercent = Math.round(progress * 100);
  const progressWidth = `${progressPercent}%` as `${number}%`;
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
            <Text style={styles.metricLabel}>UPTIME</Text>
            <Text style={[styles.currentValue, milestoneReached && styles.currentValueReached]}>
              {currentUptime.toLocaleString('tr-TR')}
            </Text>
          </View>
        </View>

        <View style={[styles.targetBox, milestoneReached && styles.targetBoxReached]}>
          <Text style={styles.targetLabel}>SONRAKİ HEDEF</Text>
          <Text style={[styles.targetValue, milestoneReached && styles.targetValueReached]}>{nextTargetLabel}</Text>
        </View>
      </View>

      {milestoneReached ? (
        <View style={styles.reachedPill}>
          <Ionicons
            name="sparkles"
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
      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityLabel={milestoneReached
          ? `Uptime ${currentUptime}, dönüm noktası tamamlandı. Sonraki hedef ${nextTargetLabel}`
          : `Uptime ${currentUptime}. Sonraki hedef ${nextTargetLabel}`}
        accessibilityValue={{ min: 0, max: progressMax, now: progressNow, text: progressValueLabel }}
      >
        <View
          style={[
            styles.progressFill,
            milestoneReached && styles.progressFillReached,
            { width: progressWidth },
          ]}
        />
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;

  return StyleSheet.create({
    card: {
      overflow: 'hidden',
      padding: 14,
      borderRadius: radius.lg,
      backgroundColor: colors.warningSoft,
      borderWidth: 1,
      borderColor: colors.warning,
    },
    cardReached: {
      backgroundColor: colors.secondarySoft,
      borderColor: colors.secondary,
      ...shadow.card,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
    },
    currentGroup: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    iconSlot: {
      width: 52,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.warning,
      ...shadow.card,
    },
    iconSlotReached: { borderColor: colors.secondary },
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
      borderColor: colors.surfaceRaised,
    },
    currentCopy: { minWidth: 62 },
    metricLabel: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 11,
      lineHeight: 15,
      letterSpacing: 0.7,
      color: colors.textMuted,
    },
    currentValue: {
      fontFamily: fonts.monoBold,
      fontSize: 27,
      lineHeight: 31,
      color: colors.warning,
    },
    currentValueReached: { color: colors.secondary },
    targetBox: {
      minWidth: 112,
      minHeight: 52,
      justifyContent: 'center',
      paddingHorizontal: 12,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    targetBoxReached: { borderColor: colors.secondary },
    targetLabel: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 10,
      lineHeight: 14,
      letterSpacing: 0.55,
      color: colors.textMuted,
    },
    targetValue: { fontFamily: fonts.monoBold, fontSize: 18, lineHeight: 23, color: colors.warning },
    targetValueReached: { color: colors.secondary },
    reachedPill: {
      alignSelf: 'flex-start',
      minHeight: 28,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
      paddingHorizontal: 9,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.secondary,
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
      marginTop: 13,
      marginBottom: 7,
    },
    progressLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 16, color: colors.textMuted },
    progressValue: { fontFamily: fonts.monoSemiBold, fontSize: 11, lineHeight: 16, color: colors.text },
    progressTrack: {
      height: 12,
      overflow: 'hidden',
      padding: 2,
      borderRadius: radius.pill,
      backgroundColor: colors.canvas,
      borderWidth: 1,
      borderColor: colors.border,
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
