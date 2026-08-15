import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../state/ThemeContext';
import type { Theme } from '../theme/themes';
import { fonts, fontSizes } from '../theme/typography';
import ReputationBar from './ReputationBar';
import { useReputation } from '../state/ReputationContext';
import { formatCurrency, formatScore } from '../utils/format';

interface StatItemProps {
  label: string;
  value: string;
  delta: string;
  direction: 'up' | 'down';
  accentPositive: string;
  accentDanger: string;
}

function StatItem({ label, value, delta, direction, accentPositive, accentDanger }: StatItemProps) {
  const deltaColor = direction === 'up' ? accentPositive : accentDanger;
  return (
    <View style={statItemStyles.statItem}>
      <Text style={statItemStyles.statLabel}>{label}</Text>
      <Text style={statItemStyles.statValue}>{value}</Text>
      <Text style={[statItemStyles.statDelta, { color: deltaColor }]}>
        {direction === 'up' ? '▲ ' : '▼ '}
        {delta}
      </Text>
    </View>
  );
}

// Static styles for StatItem — only colors passed as props
const statItemStyles = StyleSheet.create({
  statItem: { flex: 1 },
  statLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: '#687B8C',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  statValue: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes['4xl'],
    color: '#E0F7FA',
  },
  statDelta: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.base,
    marginTop: 3,
  },
});

interface StatsPanelProps {
  budgetDeltaLabel?: string;
  scoreDeltaLabel?: string;
}

export default function StatsPanel({ budgetDeltaLabel = 'son olay', scoreDeltaLabel = 'güncel' }: StatsPanelProps) {
  const { careerXp, score, budget, currentRank, nextRank, rankProgress } = useReputation();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <StatItem
          label="Şirket Bütçesi"
          value={formatCurrency(budget)}
          delta={budgetDeltaLabel}
          direction="down"
          accentPositive={colors.accentPositive}
          accentDanger={colors.accentDanger}
        />
        <StatItem
          label="İtibar"
          value={formatScore(score)}
          delta={scoreDeltaLabel}
          direction="up"
          accentPositive={colors.accentPositive}
          accentDanger={colors.accentDanger}
        />
      </View>

      <View style={styles.repTrack}>
        <ReputationBar careerXp={careerXp} currentRank={currentRank} nextRank={nextRank} progress={rankProgress} />
      </View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  const { colors, geometry, effects } = theme;
  return StyleSheet.create({
    card: {
      backgroundColor: colors.panel,
      borderWidth: geometry.borderWidth,
      borderColor: colors.border,
      borderRadius: geometry.borderRadius,
      padding: 18,
      paddingBottom: 14,
      gap: 14,
      ...effects.cardShadow,
    },
    row: {
      flexDirection: 'row',
      gap: 14,
    },
    repTrack: {
      marginTop: 2,
    },
  });
}
