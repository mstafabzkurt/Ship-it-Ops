import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Rank } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import RankProgressRail from '../RankProgressRail';
import { getDashboardTokens } from '../dashboard/dashboardTokens';
import RankIcon from '../rank/RankIcon';

interface ReputationSummaryCardProps {
  careerXp: number;
  reputation: number;
  currentRank: Rank;
  nextRank: Rank | null;
  progress: number;
  accentColor: string;
  accentSoftColor: string;
  rankIcon: React.ComponentProps<typeof Ionicons>['name'];
  reduceMotion: boolean;
  active: boolean;
}

export default function ReputationSummaryCard({
  careerXp, reputation, currentRank, nextRank, progress, accentColor, accentSoftColor, rankIcon, reduceMotion, active,
}: ReputationSummaryCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const progressPercent = Math.round(progress * 100);

  return (
    <View style={styles.card}>
      <View style={styles.accentRail} />
      <Text style={styles.terminalEyebrow}>CAREER TRACK</Text>
      <View style={styles.heroRow}>
        <View style={[styles.rankMark, { borderColor: accentColor }]} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.rankCore, { backgroundColor: accentSoftColor }]}>
            <RankIcon
              rank={currentRank}
              size={tokens.layout.isCompact ? 54 : 66}
              fallbackName={rankIcon}
              fallbackColor={accentColor}
            />
          </View>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>ŞU ANKİ RÜTBE</Text>
          <Text style={[styles.rankName, { color: accentColor }]}>{currentRank.name}</Text>
        </View>
      </View>

      <View style={styles.progressHeading}>
        <Text style={styles.progressLabel}>RÜTBE İLERLEMESİ</Text>
        <Text style={[styles.progressPercent, { color: accentColor }]}>{progressPercent}%</Text>
      </View>
      <RankProgressRail
        progress={progress}
        complete={!nextRank}
        reduceMotion={reduceMotion}
        active={active}
        accessibilityLabel={`${currentRank.name} rütbe ilerlemesi`}
        tokens={tokens}
      />
      <View style={styles.progressMeta}>
        <Text style={styles.progressMetaText}>{careerXp.toLocaleString('tr-TR')} Kariyer XP</Text>
        <Text style={styles.progressMetaText}>
          {nextRank ? `${nextRank.threshold.toLocaleString('tr-TR')} XP` : 'En üst rütbe'}
        </Text>
      </View>
      {nextRank ? (
        <View style={styles.nextRankRow}>
          <Text style={styles.nextRankLabel}>Sonraki Hedef</Text>
          <Text style={styles.nextRankName}>{nextRank.name}</Text>
        </View>
      ) : null}
      <View style={styles.scoreBlock}>
        <Text style={styles.scoreLabel}>İTİBAR · PERFORMANS</Text>
        <Text style={styles.scoreValue}>{reputation.toLocaleString('tr-TR')}</Text>
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: { position: 'relative', overflow: 'hidden', padding: tokens.layout.isCompact ? 16 : 24, borderRadius: radius.md, backgroundColor: colors.floatingSurface, borderWidth: 1, borderColor: colors.borderSubtle, ...shadow.card, shadowColor: colors.shadowNeutral, shadowOpacity: 0.18 },
    accentRail: { position: 'absolute', top: 0, left: 24, right: 24, height: 1, backgroundColor: colors.warning, opacity: 0.5 },
    terminalEyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.monoMedium, color: colors.warning, marginBottom: 16, letterSpacing: 1.4 },
    heroRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 10 : 14 },
    rankMark: { width: tokens.layout.isCompact ? 66 : 80, height: tokens.layout.isCompact ? 66 : 80, alignItems: 'center', justifyContent: 'center', borderRadius: 40, borderWidth: 1 },
    rankCore: { width: tokens.layout.isCompact ? 58 : 70, height: tokens.layout.isCompact ? 58 : 70, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
    heroCopy: { flex: 1, minWidth: tokens.layout.isCompact ? 150 : 180 },
    eyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.textMuted, marginBottom: 3 },
    rankName: { ...tokens.type.display, fontFamily: fonts.headingBold },
    scoreBlock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.dividerSubtle },
    scoreValue: { fontFamily: fonts.monoSemiBold, fontSize: 16, lineHeight: 22, color: colors.text },
    scoreLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.textMuted },
    progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: tokens.layout.isCompact ? 16 : 24 },
    progressLabel: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.textMuted },
    progressPercent: { fontFamily: fonts.monoBold, fontSize: 16, lineHeight: 21 },
    progressMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
    progressMetaText: { flexShrink: 1, fontFamily: fonts.monoMedium, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    nextRankRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: tokens.layout.isCompact ? 12 : 18, paddingTop: tokens.layout.isCompact ? 11 : 16, borderTopWidth: 1, borderTopColor: colors.dividerSubtle },
    nextRankLabel: { ...tokens.type.bodySmall, fontFamily: fonts.bodyMedium, color: colors.textMuted },
    nextRankName: { ...tokens.type.body, fontFamily: fonts.headingBold, color: colors.text },
  });
}
