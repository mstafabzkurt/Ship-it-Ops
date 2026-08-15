import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { dashboardType, getDashboardTokens } from '../dashboard/dashboardTokens';
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
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
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
      style={[styles.panel, { borderColor: toneColor, backgroundColor: toneBackground }]}
    >
      <View style={styles.outcomeHeader}>
        <View style={[styles.outcomeIcon, { borderColor: toneColor, backgroundColor: tokens.colors.surface }]}>
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
    <View style={[styles.impactCard, { borderColor: color }]}>
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
    panel: { padding: 20, gap: 16, borderWidth: 1, borderRadius: radius.lg, ...shadow.card },
    outcomeHeader: { flexDirection: 'row', alignItems: 'center', gap: 13 },
    outcomeIcon: {
      width: 54,
      height: 54,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      borderWidth: 1,
      ...shadow.card,
    },
    outcomeCopy: { flex: 1, minWidth: 0 },
    outcomeLabel: { ...dashboardType.eyebrow, fontFamily: fonts.bodySemiBold, marginBottom: 3 },
    feedback: { ...dashboardType.title, fontFamily: fonts.headingBold, color: colors.text },
    explanation: { ...dashboardType.bodySmall, fontFamily: fonts.body, color: colors.textMuted },
    impactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    impactCard: {
      flex: 1,
      flexBasis: 190,
      minWidth: 0,
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      padding: 12,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
    },
    impactIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
    impactCopy: { flex: 1, minWidth: 0 },
    impactLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.55, color: colors.textMuted },
    impactValue: { fontFamily: fonts.monoBold, fontSize: 19, lineHeight: 24, marginTop: 2 },
    bestAnswer: {
      padding: 15,
      gap: 9,
      borderWidth: 1,
      borderColor: colors.secondary,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
    },
    bestAnswerHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bestAnswerIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySoft },
    bestAnswerLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 15, color: colors.secondary, letterSpacing: 0.55 },
    bestAnswerText: { ...dashboardType.body, fontFamily: fonts.bodyMedium, color: colors.text },
    nextButton: { minWidth: 210, alignSelf: 'flex-start' },
  });
}
