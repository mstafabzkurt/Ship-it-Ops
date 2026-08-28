import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import type { Rank } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface ReputationSummaryCardProps {
  careerXp: number;
  reputation: number;
  currentRank: Rank;
  nextRank: Rank | null;
  progress: number;
  accentColor: string;
  accentSoftColor: string;
  rankIcon: React.ComponentProps<typeof Ionicons>['name'];
}

export default function ReputationSummaryCard({
  careerXp, reputation, currentRank, nextRank, progress, accentColor, accentSoftColor, rankIcon,
}: ReputationSummaryCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const progressPercent = Math.round(progress * 100);

  return (
    <View style={styles.card}>
      <View style={[styles.accentRail, { backgroundColor: accentColor }]} />
      <View style={styles.heroRow}>
        <View style={[styles.rankMark, { backgroundColor: accentSoftColor, borderColor: accentColor }]}>
          <Ionicons name={rankIcon} size={tokens.layout.isCompact ? 23 : 27} color={accentColor} />
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
    card: { position: 'relative', overflow: 'hidden', padding: tokens.layout.isCompact ? 14 : 20, paddingLeft: tokens.layout.isCompact ? 17 : 23, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, ...shadow.card, shadowColor: colors.shadowNeutral, shadowOpacity: 0.18 },
    accentRail: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 3 },
    heroRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 10 : 14 },
    rankMark: { width: tokens.layout.isCompact ? 48 : 56, height: tokens.layout.isCompact ? 48 : 56, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1 },
    heroCopy: { flex: 1, minWidth: tokens.layout.isCompact ? 150 : 180 },
    eyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.textMuted, marginBottom: 3 },
    rankName: { ...tokens.type.display, fontFamily: fonts.headingBold },
    scoreBlock: { flexGrow: tokens.layout.isCompact ? 1 : 0, minWidth: tokens.layout.isCompact ? 130 : 150, paddingLeft: tokens.layout.isCompact ? 12 : 16, borderLeftWidth: 1, borderLeftColor: colors.dividerSubtle },
    scoreValue: { fontFamily: fonts.monoBold, fontSize: tokens.layout.isCompact ? 21 : 25, lineHeight: tokens.layout.isCompact ? 26 : 31, color: colors.warning },
    scoreLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.textMuted },
    progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: tokens.layout.isCompact ? 16 : 24 },
    progressLabel: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.textMuted },
    progressPercent: { fontFamily: fonts.monoBold, fontSize: 16, lineHeight: 21 },
    progressTrack: { height: 9, marginTop: 9, padding: 2, overflow: 'hidden', borderRadius: radius.pill, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.borderSubtle },
    progressFill: { height: '100%', minWidth: 6, borderRadius: radius.pill },
    progressMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
    progressMetaText: { flexShrink: 1, fontFamily: fonts.monoMedium, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    nextRankRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: tokens.layout.isCompact ? 12 : 18, paddingTop: tokens.layout.isCompact ? 11 : 16, borderTopWidth: 1, borderTopColor: colors.dividerSubtle },
    nextRankLabel: { ...tokens.type.bodySmall, fontFamily: fonts.bodyMedium, color: colors.textMuted },
    nextRankName: { ...tokens.type.body, fontFamily: fonts.headingBold, color: colors.text },
  });
}
