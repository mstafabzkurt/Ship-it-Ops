import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';
import GameActionButton from './GameActionButton';

export type GameResultTone = 'success' | 'partial' | 'fail' | 'timeout';

interface GameResultPanelProps {
  tone: GameResultTone;
  careerXpDelta: number;
  reputationDelta: number;
  budgetDelta: number;
  impactText: string;
  bestAnswer?: string;
  isProcessing: boolean;
  onNext: () => void;
  nextLabel?: string;
  rewardLabel?: string;
  reduceMotion: boolean;
}

const RESULT_COPY: Record<GameResultTone, { label: string; subtitle: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  success: { label: 'Doğru Cevap', subtitle: 'Doğru seçeneği onayladın.', icon: 'checkmark-circle' },
  partial: { label: 'Kısmi Doğru', subtitle: 'Bu cevap kısmen doğru olarak değerlendirildi.', icon: 'alert-circle' },
  fail: { label: 'Yanlış Cevap', subtitle: 'Doğru cevabı inceleyip sonraki soruya geçebilirsin.', icon: 'close-circle' },
  timeout: { label: 'Süre Doldu', subtitle: 'Bu soru için cevap onaylanmadı.', icon: 'timer' },
};

function formatSignedValue(value: number) {
  return `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString('tr-TR')}`;
}

function formatSignedBudget(value: number) {
  return `${value >= 0 ? '+' : '−'}$${Math.abs(value).toLocaleString('tr-TR')}`;
}

export default function GameResultPanel({
  tone,
  careerXpDelta,
  reputationDelta,
  budgetDelta,
  impactText,
  bestAnswer,
  isProcessing,
  onNext,
  nextLabel = 'Sonraki Soru',
  rewardLabel,
  reduceMotion,
}: GameResultPanelProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const result = RESULT_COPY[tone];
  const animationValues = useRef({
    shell: new Animated.Value(reduceMotion ? 1 : 0),
    rail: new Animated.Value(reduceMotion ? 1 : 0),
    verdict: new Animated.Value(reduceMotion ? 1 : 0),
    flash: new Animated.Value(0),
    metrics: [
      new Animated.Value(reduceMotion ? 1 : 0),
      new Animated.Value(reduceMotion ? 1 : 0),
      new Animated.Value(reduceMotion ? 1 : 0),
    ],
    bestAnswer: new Animated.Value(reduceMotion ? 1 : 0),
    cta: new Animated.Value(reduceMotion ? 1 : 0),
  }).current;
  const toneColor = tone === 'success'
    ? tokens.colors.secondary
    : tone === 'partial'
      ? tokens.colors.primary
      : tone === 'timeout'
        ? tokens.colors.warning
        : tokens.colors.danger;
  const toneBackground = tone === 'success'
    ? tokens.colors.secondarySoft
    : tone === 'partial'
      ? tokens.colors.primarySoft
      : tone === 'timeout'
        ? tokens.colors.warningSoft
        : tokens.colors.dangerSoft;
  const shellTranslateY = animationValues.shell.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const railScaleY = animationValues.rail.interpolate({ inputRange: [0, 1], outputRange: [0.12, 1] });
  const sweepScaleX = animationValues.rail.interpolate({ inputRange: [0, 1], outputRange: [0.16, 1] });
  const sweepOpacity = animationValues.rail.interpolate({
    inputRange: [0, 0.18, 0.8, 1],
    outputRange: [0, 0.72, 0.32, 0],
  });
  const verdictScale = animationValues.verdict.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  const verdictTranslateY = animationValues.verdict.interpolate({ inputRange: [0, 1], outputRange: [4, 0] });
  const flashOpacity = animationValues.flash.interpolate({
    inputRange: [0, 0.55, 1.4, 2],
    outputRange: [0, 0.72, 0.3, 0],
  });
  const flashScaleX = animationValues.flash.interpolate({ inputRange: [0, 2], outputRange: [0.78, 1.04] });
  const bestAnswerTranslateY = animationValues.bestAnswer.interpolate({ inputRange: [0, 1], outputRange: [6, 0] });
  const ctaTranslateY = animationValues.cta.interpolate({ inputRange: [0, 1], outputRange: [4, 0] });

  useEffect(() => {
    const values = [
      animationValues.shell,
      animationValues.rail,
      animationValues.verdict,
      animationValues.flash,
      ...animationValues.metrics,
      animationValues.bestAnswer,
      animationValues.cta,
    ];
    values.forEach((value) => value.stopAnimation());

    if (reduceMotion) {
      animationValues.shell.setValue(1);
      animationValues.rail.setValue(1);
      animationValues.verdict.setValue(1);
      animationValues.flash.setValue(0);
      animationValues.metrics.forEach((value) => value.setValue(1));
      animationValues.bestAnswer.setValue(1);
      animationValues.cta.setValue(1);
      return;
    }

    animationValues.shell.setValue(0);
    animationValues.rail.setValue(0);
    animationValues.verdict.setValue(0);
    animationValues.flash.setValue(0);
    animationValues.metrics.forEach((value) => value.setValue(0));
    animationValues.bestAnswer.setValue(bestAnswer ? 0 : 1);
    animationValues.cta.setValue(0);

    const metricCascade = animationValues.metrics.map((value) => Animated.timing(value, {
      toValue: 1,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }));
    const animation = Animated.parallel([
      Animated.timing(animationValues.shell, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(20),
        Animated.timing(animationValues.rail, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(35),
        Animated.timing(animationValues.verdict, {
          toValue: 1,
          duration: 165,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(45),
        Animated.timing(animationValues.flash, {
          toValue: 2,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(155),
        Animated.stagger(55, metricCascade),
      ]),
      ...(bestAnswer ? [Animated.sequence([
        Animated.delay(340),
        Animated.timing(animationValues.bestAnswer, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])] : []),
      Animated.sequence([
        Animated.delay(bestAnswer ? 455 : 420),
        Animated.timing(animationValues.cta, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);
    animation.start();
    return () => animation.stop();
  }, [animationValues, bestAnswer, reduceMotion, tone]);

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.panel, { opacity: animationValues.shell, transform: [{ translateY: shellTranslateY }] }]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.resultRail, { backgroundColor: toneColor, opacity: animationValues.rail, transform: [{ scaleY: railScaleY }] }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.energySweep, { backgroundColor: toneColor, opacity: sweepOpacity, transform: [{ scaleX: sweepScaleX }] }]}
      />
      <View style={styles.outcomeHeader}>
        <Animated.View
          pointerEvents="none"
          style={[styles.statusFlash, { backgroundColor: toneBackground, opacity: flashOpacity, transform: [{ scaleX: flashScaleX }] }]}
        />
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
          <Animated.Text
            style={[
              styles.outcomeLabel,
              { color: toneColor, opacity: animationValues.verdict, transform: [{ translateY: verdictTranslateY }, { scale: verdictScale }] },
            ]}
          >
            {result.label}
          </Animated.Text>
          <Text style={styles.feedback}>{result.subtitle}</Text>
        </View>
      </View>

      <View style={styles.resultDetails}>
        <View style={[styles.operationImpact, { borderLeftColor: toneColor }]}>
          <Text style={styles.operationImpactLabel}>ETKİ</Text>
          <Text style={styles.operationImpactText}>{impactText}</Text>
        </View>
        {rewardLabel ? <Text style={styles.rewardLabel}>{rewardLabel}</Text> : null}
        <View style={styles.impactGrid}>
          <ImpactCard
            label="Kariyer XP"
            value={formatSignedValue(careerXpDelta)}
            delta={careerXpDelta}
            progress={animationValues.metrics[0]}
            styles={styles}
            tokens={tokens}
          />
          <ImpactCard
            label="İtibar"
            value={formatSignedValue(reputationDelta)}
            delta={reputationDelta}
            progress={animationValues.metrics[1]}
            styles={styles}
            tokens={tokens}
          />
          <ImpactCard
            label="Şirket Bütçesi"
            value={formatSignedBudget(budgetDelta)}
            delta={budgetDelta}
            progress={animationValues.metrics[2]}
            styles={styles}
            tokens={tokens}
          />
        </View>

        {bestAnswer ? (
          <Animated.View
            style={[
              styles.bestAnswer,
              { opacity: animationValues.bestAnswer, transform: [{ translateY: bestAnswerTranslateY }] },
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[styles.bestAnswerRail, { transform: [{ scaleY: animationValues.bestAnswer }] }]}
            />
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
              <Text style={styles.bestAnswerLabel}>DOĞRU CEVAP</Text>
            </View>
            <Text style={styles.bestAnswerText}>{bestAnswer}</Text>
          </Animated.View>
        ) : null}

        <Animated.View style={{ opacity: animationValues.cta, transform: [{ translateY: ctaTranslateY }] }}>
          <GameActionButton
            label={nextLabel}
            onPress={onNext}
            disabled={isProcessing}
            busy={isProcessing}
            style={styles.nextButton}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function ImpactCard({
  label,
  value,
  delta,
  progress,
  styles,
  tokens,
}: {
  label: string;
  value: string;
  delta: number;
  progress: Animated.Value;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  const positive = delta >= 0;
  const color = positive ? tokens.colors.secondary : tokens.colors.danger;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  return (
    <Animated.View style={[styles.impactCard, { borderLeftColor: color, opacity: progress, transform: [{ translateY }] }]}>
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
    </Animated.View>
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
    energySweep: { position: 'absolute', top: 0, left: 12, right: 12, height: 1 },
    outcomeHeader: {
      position: 'relative',
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.layout.isCompact ? 10 : 13,
      borderRadius: radius.sm,
    },
    statusFlash: { ...StyleSheet.absoluteFillObject, borderRadius: radius.sm },
    outcomeIcon: {
      width: tokens.layout.isCompact ? 46 : 54,
      height: tokens.layout.isCompact ? 46 : 54,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
    },
    outcomeCopy: { flex: 1, minWidth: 0 },
    outcomeLabel: { ...tokens.type.title, fontFamily: fonts.headingBold, marginBottom: 2 },
    feedback: { ...tokens.type.bodySmall, fontFamily: fonts.bodyMedium, color: colors.textMuted },
    resultDetails: { gap: tokens.layout.isCompact ? 11 : 16 },
    operationImpact: {
      gap: 3,
      paddingLeft: tokens.layout.isCompact ? 10 : 12,
      borderLeftWidth: 2,
    },
    operationImpactLabel: {
      ...tokens.type.eyebrow,
      fontFamily: fonts.bodySemiBold,
      color: colors.textMuted,
    },
    operationImpactText: {
      ...tokens.type.bodySmall,
      fontFamily: fonts.bodyMedium,
      color: colors.text,
    },
    rewardLabel: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.textMuted },
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
      flexBasis: tokens.layout.isCompact ? 88 : 190,
      minWidth: 0,
      minHeight: tokens.layout.isCompact ? 78 : 72,
      flexDirection: tokens.layout.isCompact ? 'column' : 'row',
      alignItems: tokens.layout.isCompact ? 'flex-start' : 'center',
      justifyContent: 'center',
      gap: tokens.layout.isCompact ? 5 : 11,
      padding: tokens.layout.isCompact ? 8 : 12,
      backgroundColor: 'transparent',
      borderLeftWidth: 2,
    },
    impactIcon: { width: tokens.layout.isCompact ? 28 : 36, height: tokens.layout.isCompact ? 28 : 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
    impactCopy: { flex: 1, minWidth: 0 },
    impactLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.55, color: colors.textMuted },
    impactValue: { fontFamily: fonts.monoBold, fontSize: tokens.layout.isCompact ? 17 : 19, lineHeight: tokens.layout.isCompact ? 21 : 24, marginTop: 2 },
    bestAnswer: {
      position: 'relative',
      overflow: 'hidden',
      padding: tokens.layout.isCompact ? 10 : 13,
      paddingLeft: tokens.layout.isCompact ? 13 : 16,
      gap: tokens.layout.isCompact ? 7 : 9,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radius.sm,
      backgroundColor: colors.secondarySurfaceRaised,
    },
    bestAnswerRail: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 2, backgroundColor: colors.secondary },
    bestAnswerHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bestAnswerIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySoft },
    bestAnswerLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 15, color: colors.secondary, letterSpacing: 0.55 },
    bestAnswerText: { ...tokens.type.body, fontFamily: fonts.bodyMedium, color: colors.text },
    nextButton: { minWidth: tokens.layout.isCompact ? 0 : 210, width: tokens.layout.isCompact ? '100%' : undefined, alignSelf: 'flex-start' },
  });
}
