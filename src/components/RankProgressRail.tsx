import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { DashboardTokens } from './dashboard/dashboardTokens';
import ProgressSweep from './ProgressSweep';

interface RankProgressRailProps {
  progress: number;
  complete: boolean;
  reduceMotion: boolean;
  active: boolean;
  accessibilityLabel: string;
  tokens: DashboardTokens;
}

/** Attained rank → progress toward the next rank. Display only; thresholds stay in progression. */
export default function RankProgressRail({ progress, complete, reduceMotion, active, accessibilityLabel, tokens }: RankProgressRailProps) {
  const { colors } = tokens;
  return (
    <View style={styles.row}>
      <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.node, { borderColor: colors.warning, backgroundColor: colors.warningSoft }]}>
        <Ionicons name="checkmark" size={14} color={colors.warning} />
      </View>
      <ProgressSweep
        value={progress}
        reduceMotion={reduceMotion}
        active={active}
        accessibilityLabel={accessibilityLabel}
        trackStyle={[styles.track, { backgroundColor: colors.floatingSurfaceRaised, borderColor: colors.borderSubtle }]}
        fillStyle={[styles.fill, { backgroundColor: colors.warning }]}
        sweepColor={colors.text}
      >
        <View style={[styles.fillTip, { backgroundColor: colors.text }]} />
      </ProgressSweep>
      <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.node, { borderColor: complete ? colors.warning : colors.borderStrong, backgroundColor: complete ? colors.warningSoft : colors.floatingSurfaceRaised }]}>
        <Ionicons name={complete ? 'checkmark' : 'lock-closed-outline'} size={12} color={complete ? colors.warning : colors.textMuted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  node: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  track: { flex: 1, height: 8, borderRadius: 4, borderWidth: 1, overflow: 'hidden' },
  fill: { borderRadius: 3 },
  fillTip: { position: 'absolute', top: 0, bottom: 0, right: 0, width: 2, opacity: 0.6 },
});
