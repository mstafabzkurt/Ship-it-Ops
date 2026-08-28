import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';
import GameActionButton from './GameActionButton';

export type GameResultTone = 'success' | 'partial' | 'fail' | 'timeout';

interface GameResultPanelProps {
  tone: GameResultTone;
  feedback: string;
  explanation: string;
  careerXpDelta: number;
  reputationDelta: number;
  budgetDelta: number;
  bestAnswer?: string;
  isProcessing: boolean;
  onNext: () => void;
  nextLabel?: string;
}

const RESULT_COPY: Record<GameResultTone, { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  success: { label: 'BAŞARILI MÜDAHALE', icon: 'checkmark-circle' },
  partial: { label: 'KISMİ BAŞARI', icon: 'alert-circle' },
  fail: { label: 'MÜDAHALE BAŞARISIZ', icon: 'close-circle' },
  timeout: { label: 'SÜRE DOLDU', icon: 'timer' },
};

function formatSignedValue(value: number) {
  return `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString('tr-TR')}`;
}

function formatSignedBudget(value: number) {
  return `${value >= 0 ? '+' : '−'}$${Math.abs(value).toLocaleString('tr-TR')}`;
}

export default function GameResultPanel({
  tone,
  feedback,
  explanation,
  careerXpDelta,
  reputationDelta,
  budgetDelta,
  bestAnswer,
  isProcessing,
  onNext,
  nextLabel = 'Sonraki Soru',
}: GameResultPanelProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const result = RESULT_COPY[tone];
  const toneColor = tone === 'success'
    ? tokens.colors.secondary
    : tone === 'partial'
      ? tokens.colors.warning
      : tokens.colors.danger;
  const toneBackground = tone === 'success'
    ? tokens.colors.secondarySoft
    : tone === 'partial'
      ? tokens.colors.warningSoft
      : tokens.colors.dangerSoft;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={styles.panel}
    >
      <View pointerEvents="none" style={[styles.resultRail, { backgroundColor: toneColor }]} />
      <View style={styles.outcomeHeader}>
        <View style={[styles.outcomeIcon, { backgroundColor: toneBackground }]}>
          <Ionicons
            name={result.icon}
            size={28}
            color={toneColor}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </View>
        <View style={styles.outcomeCopy}>
          <Text style={[styles.outcomeLabel, { color: toneColor }]}>{result.label}</Text>
          <Text style={styles.feedback}>{feedback}</Text>
        </View>
      </View>

      <Text style={styles.explanation}>{explanation}</Text>

      <View style={styles.impactGrid}>
        <ImpactCard
          label="KARİYER XP"
          value={formatSignedValue(careerXpDelta)}
          delta={careerXpDelta}
          styles={styles}
          tokens={tokens}
        />
        <ImpactCard
          label="İTİBAR"
          value={formatSignedValue(reputationDelta)}
          delta={reputationDelta}
          styles={styles}
          tokens={tokens}
        />
        <ImpactCard
          label="ŞİRKET BÜTÇESİ"
          value={formatSignedBudget(budgetDelta)}
          delta={budgetDelta}
          styles={styles}
          tokens={tokens}
        />
      </View>

      {bestAnswer ? (
        <View style={styles.bestAnswer}>
          <View style={styles.bestAnswerHeading}>
            <View style={styles.bestAnswerIcon}>
              <Ionicons
                name="bulb"
                size={17}
                color={tokens.colors.secondary}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
            </View>
            <Text style={styles.bestAnswerLabel}>EN İYİ CEVAP</Text>
          </View>
          <Text style={styles.bestAnswerText}>{bestAnswer}</Text>
        </View>
      ) : null}

      <GameActionButton
        label={nextLabel}
        onPress={onNext}
        disabled={isProcessing}
        busy={isProcessing}
        style={styles.nextButton}
      />
    </View>
  );
}

function ImpactCard({
  label,
  value,
  delta,
  styles,
  tokens,
}: {
  label: string;
  value: string;
  delta: number;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  const positive = delta >= 0;
  const color = positive ? tokens.colors.secondary : tokens.colors.danger;

  return (
    <View style={[styles.impactCard, { borderLeftColor: color }]}>
      <View style={[styles.impactIcon, { backgroundColor: positive ? tokens.colors.secondarySoft : tokens.colors.dangerSoft }]}>
        <Ionicons
          name={positive ? 'trending-up' : 'trending-down'}
          size={17}
          color={color}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>
      <View style={styles.impactCopy}>
        <Text style={styles.impactLabel}>{label}</Text>
        <Text style={[styles.impactValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;

  return StyleSheet.create({
    panel: {
      position: 'relative',
      overflow: 'hidden',
      padding: tokens.layout.isCompact ? 14 : 20,
      paddingLeft: tokens.layout.isCompact ? 17 : 23,
      gap: tokens.layout.isCompact ? 11 : 16,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      ...shadow.card,
      shadowColor: colors.shadowNeutral,
      shadowOpacity: 0.2,
    },
    resultRail: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 3 },
    outcomeHeader: { flexDirection: 'row', alignItems: 'center', gap: tokens.layout.isCompact ? 10 : 13 },
    outcomeIcon: {
      width: tokens.layout.isCompact ? 46 : 54,
      height: tokens.layout.isCompact ? 46 : 54,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
    },
    outcomeCopy: { flex: 1, minWidth: 0 },
    outcomeLabel: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, marginBottom: 2 },
    feedback: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text },
    explanation: { ...tokens.type.bodySmall, fontFamily: fonts.body, color: colors.textMuted },
    impactGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      overflow: 'hidden',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.dividerSubtle,
      backgroundColor: colors.secondarySurfaceRaised,
    },
    impactCard: {
      flex: 1,
      flexBasis: tokens.layout.isCompact ? 132 : 190,
      minWidth: 0,
      minHeight: tokens.layout.isCompact ? 62 : 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      padding: tokens.layout.isCompact ? 9 : 12,
      backgroundColor: 'transparent',
      borderLeftWidth: 2,
    },
    impactIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
    impactCopy: { flex: 1, minWidth: 0 },
    impactLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.55, color: colors.textMuted },
    impactValue: { fontFamily: fonts.monoBold, fontSize: 19, lineHeight: 24, marginTop: 2 },
    bestAnswer: {
      paddingTop: tokens.layout.isCompact ? 10 : 13,
      gap: tokens.layout.isCompact ? 7 : 9,
      borderTopWidth: 1,
      borderTopColor: colors.dividerSubtle,
    },
    bestAnswerHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bestAnswerIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySoft },
    bestAnswerLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 15, color: colors.secondary, letterSpacing: 0.55 },
    bestAnswerText: { ...tokens.type.body, fontFamily: fonts.bodyMedium, color: colors.text },
    nextButton: { minWidth: tokens.layout.isCompact ? 0 : 210, width: tokens.layout.isCompact ? '100%' : undefined, alignSelf: 'flex-start' },
  });
}
