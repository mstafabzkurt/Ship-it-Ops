import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { LeaderboardEntry } from '../../services/leaderboard';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { resolveLeaderboardCosmetics } from '../../utils/leaderboardCosmetics';
import CosmeticPreview from '../cosmetics/CosmeticPreview';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  position: number | null;
  isCurrentUser: boolean;
  compact: boolean;
  isLast?: boolean;
  standalone?: boolean;
}

function LeaderboardRow({
  entry,
  position,
  isCurrentUser,
  compact,
  isLast = false,
  standalone = false,
}: LeaderboardRowProps) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const cosmetics = useMemo(
    () => resolveLeaderboardCosmetics(entry.avatarId, entry.avatarFrameId),
    [entry.avatarFrameId, entry.avatarId],
  );
  const positionLabel = position === null ? 'Konum bekleniyor' : `${position}. sıra`;
  const accessibilityLabel = [
    positionLabel,
    entry.companyName,
    entry.careerRank,
    `${entry.rankingScore} sıralama puanı`,
    `yüzde ${entry.successRate.toFixed(2)} başarı oranı`,
    `${entry.successCount} başarılı kriz`,
    isCurrentUser ? 'senin profilin' : '',
  ].filter(Boolean).join(', ');

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.row,
        compact && styles.rowCompact,
        isCurrentUser && styles.currentRow,
        isLast && styles.lastRow,
        standalone && styles.standaloneRow,
      ]}
    >
      <Text style={[styles.position, compact && styles.positionCompact]}>
        {position ?? '—'}
      </Text>

      <CosmeticPreview
        avatar={cosmetics.avatar}
        frame={cosmetics.frame}
        size={compact ? 48 : 54}
      />

      <View style={styles.identity}>
        <View style={styles.nameLine}>
          <Text numberOfLines={2} style={styles.companyName}>{entry.companyName}</Text>
          {isCurrentUser ? (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>SEN</Text>
            </View>
          ) : null}
        </View>
        {compact ? (
          <>
            <Text numberOfLines={2} style={styles.mobileRank}>{entry.careerRank}</Text>
            <View style={styles.mobileStats}>
              <Text style={styles.mobileStat}>%{entry.successRate.toFixed(2)} başarı</Text>
              <View style={styles.statDot} />
              <Text style={styles.mobileStat}>{entry.successCount} başarılı kriz</Text>
            </View>
          </>
        ) : null}
      </View>

      {!compact ? (
        <>
          <Text style={styles.rank}>{entry.careerRank}</Text>
          <Text style={styles.stat}>%{entry.successRate.toFixed(2)}</Text>
          <Text style={styles.count}>{entry.successCount.toLocaleString('tr-TR')}</Text>
        </>
      ) : null}

      <View style={[styles.score, compact && styles.scoreCompact]}>
        <Text style={styles.scoreValue}>{entry.rankingScore.toLocaleString('tr-TR')}</Text>
        <Text style={styles.scoreLabel}>PUAN</Text>
      </View>
    </View>
  );
}

export default memo(LeaderboardRow);

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    row: {
      minHeight: 78,
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: tokens.layout.cardPaddingTight,
      paddingVertical: 10,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.dividerSubtle,
      backgroundColor: colors.secondarySurface,
    },
    rowCompact: { minHeight: 82, gap: 8, paddingHorizontal: 10, paddingVertical: 9 },
    currentRow: {
      borderLeftWidth: 3,
      borderLeftColor: colors.secondary,
      backgroundColor: colors.secondarySurfaceRaised,
    },
    lastRow: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
    standaloneRow: { borderTopWidth: 1, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
    position: {
      width: 34,
      flexShrink: 0,
      fontFamily: fonts.monoBold,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textMuted,
      textAlign: 'center',
    },
    positionCompact: { width: 22, fontSize: 12 },
    identity: { flex: 1, minWidth: 0 },
    nameLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    companyName: { flexShrink: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 19, color: colors.text },
    youBadge: {
      flexShrink: 0,
      minHeight: 20,
      justifyContent: 'center',
      paddingHorizontal: 7,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.secondary,
      backgroundColor: colors.secondarySoft,
    },
    youBadgeText: { fontFamily: fonts.monoSemiBold, fontSize: 8, lineHeight: 11, letterSpacing: 0.5, color: colors.secondary },
    mobileRank: { marginTop: 2, fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 15, color: colors.textMuted },
    mobileStats: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 3 },
    mobileStat: { fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 13, color: colors.textMuted },
    statDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.secondary },
    rank: { width: 150, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: colors.textMuted, textAlign: 'right' },
    stat: { width: 82, fontFamily: fonts.monoSemiBold, fontSize: 12, lineHeight: 17, color: colors.text, textAlign: 'right' },
    count: { width: 72, fontFamily: fonts.monoSemiBold, fontSize: 12, lineHeight: 17, color: colors.text, textAlign: 'right' },
    score: { width: 90, alignItems: 'flex-end' },
    scoreCompact: { width: 58 },
    scoreValue: { fontFamily: fonts.monoBold, fontSize: 16, lineHeight: 21, color: colors.warning },
    scoreLabel: { marginTop: 1, fontFamily: fonts.monoMedium, fontSize: 8, lineHeight: 11, letterSpacing: 0.5, color: colors.textMuted },
  });
}
