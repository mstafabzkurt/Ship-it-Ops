import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { Rank } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { dashboardType, getDashboardTokens } from '../dashboard/dashboardTokens';

interface ReputationSummaryCardProps {
  careerXp: number;
  reputation: number;
  currentRank: Rank;
  nextRank: Rank | null;
  progress: number;
  accentColor: string;
  accentSoftColor: string;
  rankIcon: string;
}

export default function ReputationSummaryCard({
  careerXp, reputation, currentRank, nextRank, progress, accentColor, accentSoftColor, rankIcon,
}: ReputationSummaryCardProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const progressPercent = Math.round(progress * 100);

  return (
    <View style={[styles.card, { borderColor: accentColor }]}>
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: accentSoftColor }]} />
      <View style={styles.heroRow}>
        <View style={[styles.rankMark, { backgroundColor: accentSoftColor, borderColor: accentColor }]}>
          <Text style={styles.rankIcon} accessibilityElementsHidden>{rankIcon}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>ŞU ANKİ RÜTBE</Text>
          <Text style={[styles.rankName, { color: accentColor }]}>{currentRank.name}</Text>
        </View>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreValue}>{reputation.toLocaleString('tr-TR')}</Text>
          <Text style={styles.scoreLabel}>İTİBAR PUANI</Text>
        </View>
      </View>

      <View style={styles.progressHeading}>
        <Text style={styles.progressLabel}>RÜTBE İLERLEMESİ</Text>
        <Text style={[styles.progressPercent, { color: accentColor }]}>{progressPercent}%</Text>
      </View>
      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityLabel={`${currentRank.name} rütbe ilerlemesi`}
        accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
      >
        <LinearGradient
          colors={[tokens.colors.primary, tokens.colors.secondary]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${progressPercent}%` }]}
        />
      </View>
      <View style={styles.progressMeta}>
        <Text style={styles.progressMetaText}>{careerXp.toLocaleString('tr-TR')} Kariyer XP</Text>
        <Text style={styles.progressMetaText}>
          {nextRank ? `${nextRank.threshold.toLocaleString('tr-TR')} XP` : 'En üst rütbe'}
        </Text>
      </View>
      {nextRank ? (
        <View style={styles.nextRankRow}>
          <Text style={styles.nextRankLabel}>Sonraki</Text>
          <Text style={styles.nextRankName}>{nextRank.name}</Text>
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: { position: 'relative', overflow: 'hidden', padding: 22, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, ...shadow.raised },
    glow: { position: 'absolute', width: 230, height: 230, top: -125, right: -80, borderRadius: 115, opacity: 0.8 },
    heroRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 14 },
    rankMark: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 24, borderWidth: 1, ...shadow.card },
    rankIcon: { fontSize: 32, lineHeight: 40 },
    heroCopy: { flex: 1, minWidth: 180 },
    eyebrow: { ...dashboardType.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.textMuted, marginBottom: 4 },
    rankName: { ...dashboardType.display, fontFamily: fonts.headingBold },
    scoreBlock: { minWidth: 150, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.lg, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderStrong },
    scoreValue: { fontFamily: fonts.monoBold, fontSize: 25, lineHeight: 31, color: colors.warning },
    scoreLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.textMuted },
    progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 },
    progressLabel: { ...dashboardType.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.textMuted },
    progressPercent: { fontFamily: fonts.monoBold, fontSize: 16, lineHeight: 21 },
    progressTrack: { height: 18, marginTop: 9, padding: 3, overflow: 'hidden', borderRadius: radius.pill, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.borderStrong },
    progressFill: { height: '100%', minWidth: 6, borderRadius: radius.pill },
    progressMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
    progressMetaText: { flexShrink: 1, fontFamily: fonts.monoMedium, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    nextRankRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
    nextRankLabel: { ...dashboardType.bodySmall, fontFamily: fonts.bodyMedium, color: colors.textMuted },
    nextRankName: { ...dashboardType.body, fontFamily: fonts.headingBold, color: colors.text },
  });
}
