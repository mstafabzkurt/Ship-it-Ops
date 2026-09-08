import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { ECONOMY_ICON_ASSETS } from '../../config/iconAssets';
import type { Rank } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { formatBudget } from '../../utils/format';
import RankProgressRail from '../RankProgressRail';
import AssetIcon from '../AssetIcon';
import RankIcon from '../rank/RankIcon';
import { getDashboardTokens } from './dashboardTokens';

interface CareerSummaryCardProps {
  budget: number;
  careerXp: number;
  uptimeStreak: number;
  currentRank: Rank;
  nextRank: Rank | null;
  progress: number;
  reduceMotion: boolean;
  active: boolean;
}

interface MetricProps {
  label: string;
  value: string;
  detail: string;
  tone: 'primary' | 'secondary' | 'warning';
  styles: ReturnType<typeof makeStyles>;
  separated?: boolean;
  icon?: {
    source: ImageSourcePropType;
    fallbackName: React.ComponentProps<typeof Ionicons>['name'];
    fallbackColor: string;
  };
}

function Metric({ label, value, detail, tone, styles, separated = false, icon }: MetricProps) {
  return (
    <View style={[styles.metric, separated && styles.metricSeparated]}>
      <View style={[styles.metricRail, styles[`${tone}Metric`]]} />
      <View style={styles.metricLabelRow}>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <View style={styles.metricValueRow}>
        {icon ? <AssetIcon source={icon.source} fallbackName={icon.fallbackName} fallbackColor={icon.fallbackColor} size={18} /> : null}
        <Text style={[styles.metricValue, styles[`${tone}Value`]]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
      </View>
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
  reduceMotion,
  active,
}: CareerSummaryCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const pct = Math.round(progress * 100);

  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.instrumentRail} />
      <View style={styles.titleRow}>
        <View style={styles.rankRing} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.rankCore}>
            <RankIcon rank={currentRank} size={tokens.layout.isCompact ? 48 : 56} fallbackColor={tokens.colors.warning} />
          </View>
        </View>
        <View style={styles.titleCopy}>
          <Text style={styles.eyebrow}>CAREER TRACK</Text>
          <Text style={styles.title}>{currentRank.name}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressBadgeValue}>{pct}%</Text>
          <Text style={styles.progressBadgeLabel}>İLERLEME</Text>
        </View>
      </View>

      <RankProgressRail
        progress={progress}
        complete={!nextRank}
        reduceMotion={reduceMotion}
        active={active}
        accessibilityLabel={`${currentRank.name} kariyer ilerlemesi`}
        tokens={tokens}
      />
      <View style={styles.progressMeta}>
        <Text style={styles.progressMetaText}>{careerXp.toLocaleString('tr-TR')} Kariyer XP</Text>
        <Text style={styles.progressMetaText}>
          {nextRank ? `Sonraki Hedef · ${nextRank.name}\n${nextRank.threshold.toLocaleString('tr-TR')} XP` : 'Maksimum rütbe'}
        </Text>
      </View>

      <View style={styles.metrics}>
        <Metric
          label="ŞİRKET BÜTÇESİ"
          value={formatBudget(budget)}
          detail="Müdahale kaynağı"
          tone="warning"
          styles={styles}
          icon={{ source: ECONOMY_ICON_ASSETS.coin, fallbackName: 'wallet-outline', fallbackColor: tokens.colors.warning }}
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
      backgroundColor: colors.floatingSurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...shadow.card,
      shadowColor: colors.shadowNeutral,
      shadowOpacity: 0.2,
    },
    instrumentRail: {
      position: 'absolute',
      top: 0,
      left: 22,
      right: 22,
      height: 1,
      backgroundColor: colors.warning,
      opacity: 0.5,
    },
    rankRing: { width: tokens.layout.isCompact ? 58 : 66, height: tokens.layout.isCompact ? 58 : 66, borderRadius: 34, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
    rankCore: { width: tokens.layout.isCompact ? 52 : 60, height: tokens.layout.isCompact ? 52 : 60, borderRadius: 30, backgroundColor: colors.warningSoft, alignItems: 'center', justifyContent: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.layout.isCompact ? 10 : 16 },
    titleCopy: { flex: 1, minWidth: 0 },
    eyebrow: {
      ...tokens.type.eyebrow,
      fontFamily: fonts.monoMedium,
      color: colors.warning,
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
    primaryMetric: { backgroundColor: colors.borderStrong },
    secondaryMetric: { backgroundColor: colors.secondary },
    warningMetric: { backgroundColor: colors.warning },
    metricLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 0 },
    metricValueRow: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 5 },
    metricLabel: { fontFamily: fonts.bodySemiBold, fontSize: tokens.layout.isNarrow ? 9 : 10, lineHeight: 14, letterSpacing: 0.45, color: colors.textMuted },
    metricValue: { ...tokens.type.metric, minWidth: 0, flexShrink: 1, fontFamily: fonts.monoBold, marginVertical: tokens.layout.isCompact ? 2 : 5 },
    primaryValue: { color: colors.text },
    secondaryValue: { color: colors.secondary },
    warningValue: { color: colors.warning, fontSize: tokens.layout.isNarrow ? 15 : tokens.layout.isCompact ? 16 : tokens.type.metric.fontSize },
    metricDetail: { fontFamily: fonts.bodyMedium, fontSize: tokens.layout.isCompact ? 11 : 12, lineHeight: tokens.layout.isCompact ? 15 : 17, color: colors.textMuted },
  });
}
