import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { Rank } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { formatCurrency } from '../../utils/format';
import { getDashboardTokens } from './dashboardTokens';

interface CareerSummaryCardProps {
  budget: number;
  careerXp: number;
  uptimeStreak: number;
  currentRank: Rank;
  nextRank: Rank | null;
  progress: number;
}

interface MetricProps {
  label: string;
  value: string;
  detail: string;
  tone: 'primary' | 'secondary' | 'warning';
  styles: ReturnType<typeof makeStyles>;
  separated?: boolean;
}

function Metric({ label, value, detail, tone, styles, separated = false }: MetricProps) {
  return (
    <View style={[styles.metric, separated && styles.metricSeparated]}>
      <View style={[styles.metricRail, styles[`${tone}Metric`]]} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, styles[`${tone}Value`]]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.metricDetail} numberOfLines={2}>{detail}</Text>
    </View>
  );
}

export default function CareerSummaryCard({
  budget,
  careerXp,
  uptimeStreak,
  currentRank,
  nextRank,
  progress,
}: CareerSummaryCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const pct = Math.round(progress * 100);

  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.instrumentRail}>
        <View style={styles.instrumentNode} />
        <View style={styles.instrumentLine} />
        <View style={styles.instrumentNode} />
      </View>
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text style={styles.eyebrow}>KARİYER İLERLEMESİ</Text>
          <Text style={styles.title}>{currentRank.name}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressBadgeValue}>{pct}%</Text>
          <Text style={styles.progressBadgeLabel}>TAMAMLANDI</Text>
        </View>
      </View>

      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityLabel={`${currentRank.name} kariyer ilerlemesi`}
        accessibilityValue={{ min: 0, max: 100, now: pct }}
      >
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <View style={styles.progressMeta}>
        <Text style={styles.progressMetaText}>{careerXp.toLocaleString('tr-TR')} Kariyer XP</Text>
        <Text style={styles.progressMetaText}>
          {nextRank ? `${nextRank.threshold.toLocaleString('tr-TR')} XP · ${nextRank.name}` : 'Maksimum rütbe'}
        </Text>
      </View>

      <View style={styles.metrics}>
        <Metric
          label="ŞİRKET BÜTÇESİ"
          value={formatCurrency(budget)}
          detail="Müdahale kaynağı"
          tone="warning"
          styles={styles}
        />
        <Metric
          label="KARİYER XP"
          value={careerXp.toLocaleString('tr-TR')}
          detail="Kalıcı ilerleme"
          tone="primary"
          styles={styles}
          separated
        />
        <Metric
          label="UPTIME SERİSİ"
          value={`${uptimeStreak}`}
          detail="Başarılı kriz"
          tone="secondary"
          styles={styles}
          separated
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
      borderRadius: radius.md,
      padding: tokens.layout.cardPadding,
      paddingTop: tokens.layout.cardPadding + 8,
      backgroundColor: colors.secondarySurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...shadow.card,
      shadowColor: colors.shadowNeutral,
      shadowOpacity: 0.2,
    },
    instrumentRail: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      backgroundColor: colors.floatingSurfaceRaised,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerSubtle,
    },
    instrumentNode: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.secondary },
    instrumentLine: { flex: 1, height: 1, backgroundColor: colors.dividerSubtle },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.layout.isCompact ? 10 : 16 },
    titleCopy: { flex: 1, minWidth: 0 },
    eyebrow: {
      ...tokens.type.eyebrow,
      fontFamily: fonts.bodySemiBold,
      color: colors.secondary,
      marginBottom: 5,
    },
    title: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text },
    progressBadge: {
      minWidth: tokens.layout.isCompact ? 68 : 76,
      paddingLeft: 11,
      alignItems: 'flex-end',
      borderLeftWidth: 1,
      borderLeftColor: colors.dividerSubtle,
    },
    progressBadgeValue: { fontFamily: fonts.monoBold, fontSize: 17, lineHeight: 21, color: colors.warning },
    progressBadgeLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 13, letterSpacing: 0.4, color: colors.textMuted },
    progressTrack: {
      height: 6,
      marginTop: tokens.layout.isCompact ? 12 : 18,
      borderRadius: radius.pill,
      backgroundColor: colors.dividerSubtle,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: radius.pill, minWidth: 4, backgroundColor: colors.warning },
    progressMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
    progressMetaText: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: tokens.layout.isCompact ? 11 : 12, lineHeight: tokens.layout.isCompact ? 15 : 17, color: colors.textMuted },
    metrics: {
      flexDirection: 'row',
      overflow: 'hidden',
      marginTop: tokens.layout.isCompact ? 12 : 18,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.dividerSubtle,
      backgroundColor: colors.secondarySurfaceRaised,
    },
    metric: {
      position: 'relative',
      flex: 1,
      minWidth: 0,
      minHeight: tokens.layout.isCompact ? 78 : 92,
      padding: tokens.layout.isCompact ? 9 : 12,
      justifyContent: 'space-between',
    },
    metricSeparated: { borderLeftWidth: 1, borderLeftColor: colors.dividerSubtle },
    metricRail: { position: 'absolute', top: 0, left: 9, right: 9, height: 2 },
    primaryMetric: { backgroundColor: colors.primary },
    secondaryMetric: { backgroundColor: colors.secondary },
    warningMetric: { backgroundColor: colors.warning },
    metricLabel: { fontFamily: fonts.bodySemiBold, fontSize: tokens.layout.isNarrow ? 9 : 10, lineHeight: 14, letterSpacing: 0.45, color: colors.textMuted },
    metricValue: { ...tokens.type.metric, fontFamily: fonts.monoBold, marginVertical: tokens.layout.isCompact ? 2 : 5 },
    primaryValue: { color: colors.primary },
    secondaryValue: { color: colors.secondary },
    warningValue: { color: colors.warning, fontSize: tokens.layout.isCompact ? 16 : tokens.type.metric.fontSize },
    metricDetail: { fontFamily: fonts.bodyMedium, fontSize: tokens.layout.isCompact ? 11 : 12, lineHeight: tokens.layout.isCompact ? 15 : 17, color: colors.textMuted },
  });
}
