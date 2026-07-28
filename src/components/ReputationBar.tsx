import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import type { Rank } from '../state/ReputationContext';

interface ReputationBarProps {
  score: number;
  currentRank: Rank;
  nextRank: Rank | null;
  /** 0-1 arası ilerleme oranı — ReputationContext.rankProgress'ten gelir, burada tekrar hesaplanmaz. */
  progress: number;
}

// .rep-track / .rep-bar / .rep-fill / .rep-meta karşılığı — Dashboard'daki
// StatsPanel ve İtibar ekranı arasında paylaşılan tek kaynak.
export default function ReputationBar({ score, currentRank, nextRank, progress }: ReputationBarProps) {
  const pct = Math.round(progress * 100);

  return (
    <View>
      <Text style={styles.label}>İtibar — {currentRank.name}</Text>
      <View style={styles.barBg}>
        <LinearGradient
          colors={[colors.accentAlert, colors.accentPositive]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${pct}%` }]}
        />
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          <Text style={styles.metaBold}>{score.toLocaleString('tr-TR')}</Text>
          {nextRank ? ` / ${nextRank.threshold.toLocaleString('tr-TR')} puan` : ' — en üst rütbe'}
        </Text>
        {nextRank ? (
          <Text style={styles.metaText}>
            Sonraki: <Text style={styles.metaBold}>{nextRank.name}</Text>
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  barBg: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginTop: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  metaText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  metaBold: {
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
});
