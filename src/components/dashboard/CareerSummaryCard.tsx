import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Rank } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { formatCurrency } from '../../utils/format';
import { dashboardType, getDashboardTokens } from './dashboardTokens';

interface CareerSummaryCardProps {
  budget: number;
  careerXp: number;
  reputation: number;
  uptimeStreak: number;
  correctAnswers: number;
  wrongAnswers: number;
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
}

function Metric({ label, value, detail, tone, styles }: MetricProps) {
  return (
    <View style={[styles.metric, styles[`${tone}Metric`]]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, styles[`${tone}Value`]]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.metricDetail} numberOfLines={1}>{detail}</Text>
    </View>
  );
}

export default function CareerSummaryCard({
  budget,
  careerXp,
  reputation,
  uptimeStreak,
  correctAnswers,
  wrongAnswers,
  currentRank,
  nextRank,
  progress,
}: CareerSummaryCardProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const pct = Math.round(progress * 100);
  const totalAnswers = correctAnswers + wrongAnswers;
  const successRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  return (
    <View style={styles.card}>
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
        <LinearGradient
          colors={[tokens.colors.primary, tokens.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${pct}%` }]}
        />
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
        />
        <Metric
          label="İTİBAR"
          value={reputation.toLocaleString('tr-TR')}
          detail="Performans puanı"
          tone="warning"
          styles={styles}
        />
        <Metric
          label="UPTIME SERİSİ"
          value={`${uptimeStreak}`}
          detail="Başarılı kriz"
          tone="secondary"
          styles={styles}
        />
        <Metric
          label="BAŞARI ORANI"
          value={`%${successRate}`}
          detail={totalAnswers > 0 ? `${correctAnswers}/${totalAnswers} doğru` : 'Henüz veri yok'}
          tone="secondary"
          styles={styles}
        />
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: {
      borderRadius: radius.xl,
      padding: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.raised,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
    titleCopy: { flex: 1, minWidth: 0 },
    eyebrow: {
      ...dashboardType.eyebrow,
      fontFamily: fonts.bodySemiBold,
      color: colors.secondary,
      marginBottom: 5,
    },
    title: { ...dashboardType.title, fontFamily: fonts.headingBold, color: colors.text },
    progressBadge: {
      minWidth: 76,
      paddingHorizontal: 11,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    progressBadgeValue: { fontFamily: fonts.monoBold, fontSize: 17, lineHeight: 21, color: colors.primary },
    progressBadgeLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 13, letterSpacing: 0.4, color: colors.textMuted },
    progressTrack: {
      height: 12,
      marginTop: 18,
      borderRadius: radius.pill,
      padding: 2,
      backgroundColor: colors.canvas,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: radius.pill, minWidth: 4 },
    progressMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
    progressMetaText: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
    metric: {
      flexGrow: 1,
      flexBasis: 140,
      minWidth: 130,
      minHeight: 112,
      padding: 14,
      borderRadius: radius.lg,
      borderWidth: 1,
      justifyContent: 'space-between',
    },
    primaryMetric: { backgroundColor: colors.primarySoft, borderColor: colors.borderStrong },
    secondaryMetric: { backgroundColor: colors.secondarySoft, borderColor: colors.borderStrong },
    warningMetric: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
    metricLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 15, letterSpacing: 0.55, color: colors.textMuted },
    metricValue: { ...dashboardType.metric, fontFamily: fonts.monoBold, marginVertical: 5 },
    primaryValue: { color: colors.primary },
    secondaryValue: { color: colors.secondary },
    warningValue: { color: colors.warning },
    metricDetail: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: colors.textMuted },
  });
}
