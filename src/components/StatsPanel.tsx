import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import ReputationBar from './ReputationBar';
import { useReputation } from '../state/ReputationContext';
import { formatCurrency, formatScore } from '../utils/format';

interface StatItemProps {
  label: string;
  value: string;
  delta: string;
  direction: 'up' | 'down';
}

function StatItem({ label, value, delta, direction }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statDelta, { color: direction === 'up' ? colors.accentPositive : colors.accentDanger }]}>
        {direction === 'up' ? '▲ ' : '▼ '}
        {delta}
      </Text>
    </View>
  );
}

interface StatsPanelProps {
  budgetDeltaLabel?: string;
  scoreDeltaLabel?: string;
}

// .stats panel karşılığı (bütçe / TechToken / skor / itibar bar).
// Bütçe, TechToken, skor ve itibar verisinin hepsi artık tek kaynaktan: ReputationContext.
export default function StatsPanel({ budgetDeltaLabel = 'son olay', scoreDeltaLabel = 'güncel' }: StatsPanelProps) {
  const { score, budget, techTokens, currentRank, nextRank, rankProgress } = useReputation();

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <StatItem label="Şirket Bütçesi" value={formatCurrency(budget)} delta={budgetDeltaLabel} direction="down" />
        <StatItem label="Bugünkü Skor"   value={formatScore(score)}     delta={scoreDeltaLabel}  direction="up"   />
      </View>

      {/* TechToken balance chip */}
      <View style={styles.ttRow}>
        <Text style={styles.ttIcon}>🪙</Text>
        <Text style={styles.ttLabel}>TechToken</Text>
        <Text style={styles.ttValue}>{techTokens} tt</Text>
      </View>

      <View style={styles.repTrack}>
        <ReputationBar score={score} currentRank={currentRank} nextRank={nextRank} progress={rankProgress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    paddingBottom: 14,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  statValue: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes['4xl'],
    color: colors.textPrimary,
  },
  statDelta: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.base,
    marginTop: 3,
  },
  repTrack: {
    marginTop: 2,
  },
  ttRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(242,169,59,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(242,169,59,0.35)',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  ttIcon: {
    fontSize: 16,
  },
  ttLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    flex: 1,
  },
  ttValue: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.lg,
    color: colors.accentAlert,
  },
});
