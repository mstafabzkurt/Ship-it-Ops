import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Rank } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

export interface RankTierVisual {
  label: string;
  emoji: string;
  color: string;
  softColor: string;
}

interface RankTierCardProps {
  ranks: Rank[];
  careerXp: number;
  currentRank: Rank;
  visual: RankTierVisual;
}

export default function RankTierCard({ ranks, careerXp, currentRank, visual }: RankTierCardProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const containsCurrentRank = ranks.some((rank) => rank.id === currentRank.id);

  return (
    <View style={[styles.card, containsCurrentRank && { borderColor: visual.color, backgroundColor: visual.softColor }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.tierIcon, { backgroundColor: visual.softColor, borderColor: visual.color }]}>
          <Text style={styles.tierEmoji} accessibilityElementsHidden>{visual.emoji}</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.tierLabel, containsCurrentRank && { color: visual.color }]}>{visual.label}</Text>
          <Text style={styles.tierRange}>
            {ranks[0].threshold.toLocaleString('tr-TR')}–{ranks[ranks.length - 1].threshold.toLocaleString('tr-TR')} XP
          </Text>
        </View>
      </View>

      <View style={styles.milestones}>
        {ranks.map((rank, index) => {
          const reached = careerXp >= rank.threshold;
          const isCurrent = rank.id === currentRank.id;
          return (
            <View key={rank.id} style={styles.milestoneRow}>
              <View style={styles.rail}>
                {index > 0 ? <View style={[styles.connectorTop, reached && { backgroundColor: visual.color }]} /> : null}
                <View
                  style={[
                    styles.milestoneDot,
                    reached && { borderColor: visual.color, backgroundColor: visual.color },
                    isCurrent && styles.milestoneDotCurrent,
                  ]}
                >
                  <Text style={styles.milestoneSymbol}>{isCurrent ? '•' : reached ? '✓' : ''}</Text>
                </View>
                {index < ranks.length - 1 ? (
                  <View style={[styles.connectorBottom, careerXp >= ranks[index + 1].threshold && { backgroundColor: visual.color }]} />
                ) : null}
              </View>

              <View style={[styles.milestoneContent, isCurrent && { backgroundColor: visual.softColor, borderColor: visual.color }]}>
                <View style={styles.rankCopy}>
                  <Text style={[styles.rankName, isCurrent && { color: visual.color }]}>{rank.name}</Text>
                  <Text style={styles.rankThreshold}>{rank.threshold.toLocaleString('tr-TR')} Kariyer XP</Text>
                </View>
                {isCurrent ? (
                  <View style={[styles.currentPill, { backgroundColor: visual.softColor, borderColor: visual.color }]}>
                    <Text style={[styles.currentPillText, { color: visual.color }]}>Şu an</Text>
                  </View>
                ) : !reached ? (
                  <Text style={styles.lockMark} accessibilityLabel="Kilitli">🔒</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: { minHeight: 300, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadow.card },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14 },
    tierIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 17, borderWidth: 1 },
    tierEmoji: { fontSize: 22, lineHeight: 28 },
    headerCopy: { flex: 1, minWidth: 0 },
    tierLabel: { fontFamily: fonts.headingBold, fontSize: 17, lineHeight: 22, color: colors.text },
    tierRange: { fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 16, color: colors.textMuted, marginTop: 2 },
    milestones: { gap: 0 },
    milestoneRow: { minHeight: 68, flexDirection: 'row' },
    rail: { width: 30, alignItems: 'center' },
    connectorTop: { position: 'absolute', top: 0, width: 3, height: 18, backgroundColor: colors.borderStrong },
    connectorBottom: { position: 'absolute', top: 34, bottom: 0, width: 3, backgroundColor: colors.borderStrong },
    milestoneDot: { position: 'absolute', top: 17, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.surfaceRaised, borderWidth: 2, borderColor: colors.borderStrong, zIndex: 1 },
    milestoneDotCurrent: { width: 24, height: 24, top: 15, borderRadius: 12, borderWidth: 3 },
    milestoneSymbol: { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 14, color: colors.onAccent },
    milestoneContent: { flex: 1, minWidth: 0, minHeight: 56, marginBottom: 12, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent' },
    rankCopy: { flex: 1, minWidth: 0 },
    rankName: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 19, color: colors.text },
    rankThreshold: { fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 16, color: colors.textMuted, marginTop: 1 },
    currentPill: { minHeight: 28, justifyContent: 'center', paddingHorizontal: 9, borderRadius: radius.pill, borderWidth: 1 },
    currentPillText: { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 15, textTransform: 'uppercase' },
    lockMark: { fontSize: 13, lineHeight: 18, opacity: 0.58 },
  });
}
