import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReputation } from '../../src/state/ReputationContext';
import {
  pickRandomIncident,
  type GameIncident,
  type IncidentChoice,
} from '../../src/data/incidents';
import { colors } from '../../src/theme/colors';
import { fonts, fontSizes } from '../../src/theme/typography';

const FEEDBACK_DURATION_MS = 1300;

function formatScoreDelta(delta: number): string {
  return `${delta >= 0 ? '+' : ''}${delta}`;
}

function FloatingScore({ scoreDelta, onComplete }: { scoreDelta: number; onComplete: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: FEEDBACK_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onComplete();
    });
  }, [anim, scoreDelta, onComplete]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, -40],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.12, 0.75, 1],
    outputRange: [0, 1, 1, 0],
  });

  const isPositive = scoreDelta >= 0;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.floatingScore, { opacity, transform: [{ translateY }] }]}
    >
      <Text
        style={[
          styles.floatingScoreText,
          { color: isPositive ? colors.accentPositive : colors.accentDanger },
        ]}
      >
        {formatScoreDelta(scoreDelta)}
      </Text>
    </Animated.View>
  );
}

function ChoiceButton({
  choice,
  disabled,
  showFloatingScore,
  onFloatComplete,
  onPress,
}: {
  choice: IncidentChoice;
  disabled: boolean;
  showFloatingScore: number | null;
  onFloatComplete: () => void;
  onPress: () => void;
}) {
  return (
    <View style={styles.choiceWrap}>
      {showFloatingScore !== null ? (
        <FloatingScore scoreDelta={showFloatingScore} onComplete={onFloatComplete} />
      ) : null}
      <Pressable
        style={({ pressed }) => [
          styles.choiceBtn,
          pressed && !disabled && styles.choiceBtnPressed,
          disabled && styles.choiceBtnDisabled,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={styles.choiceLabel}>{choice.label}</Text>
      </Pressable>
    </View>
  );
}

export default function GameScreen() {
  const router = useRouter();
  const { applyOutcome } = useReputation();
  const [incident, setIncident] = useState<GameIncident>(() => pickRandomIncident());
  const [activeChoiceId, setActiveChoiceId] = useState<string | null>(null);
  const [floatingScore, setFloatingScore] = useState<number | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const isResolvingRef = useRef(false);

  const handleFloatComplete = useCallback(() => {
    setIncident((prev) => pickRandomIncident(prev.id));
    setActiveChoiceId(null);
    setFloatingScore(null);
    setIsResolving(false);
    isResolvingRef.current = false;
  }, []);

  const handleChoice = useCallback(
    async (choice: IncidentChoice) => {
      if (isResolvingRef.current) return;
      isResolvingRef.current = true;
      setIsResolving(true);
      setActiveChoiceId(choice.id);
      setFloatingScore(choice.scoreDelta);

      await applyOutcome(choice.scoreDelta, choice.budgetDelta);
    },
    [applyOutcome],
  );

  const handleExit = useCallback(() => {
    router.replace('/(tabs)/');
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={({ pressed }) => [styles.exitBtn, pressed && styles.exitBtnPressed]}
            onPress={handleExit}
            accessibilityLabel="Çıkış"
            accessibilityRole="button"
          >
            <Text style={styles.exitIcon}>✕</Text>
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.header}>Kriz Müdahalesi</Text>
            <Text style={styles.subheader}>Her karar bütçe ve itibarını etkiler.</Text>
          </View>
        </View>

        <View style={styles.incidentCard}>
          <LinearGradient
            colors={[colors.alertBg, 'rgba(21,27,39,0.95)']}
            style={styles.incidentGradient}
          >
            <Text style={styles.tag}>{incident.tag}</Text>
            <Text style={styles.title}>{incident.title}</Text>
            <Text style={styles.description}>{incident.description}</Text>
          </LinearGradient>
        </View>

        <Text style={styles.sectionLabel}>Müdahale Seçenekleri</Text>
        <View style={styles.choices}>
          {incident.choices.map((choice) => (
            <ChoiceButton
              key={choice.id}
              choice={choice}
              disabled={isResolving}
              showFloatingScore={activeChoiceId === choice.id ? floatingScore : null}
              onFloatComplete={handleFloatComplete}
              onPress={() => handleChoice(choice)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 14,
    gap: 12,
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  exitBtnPressed: {
    backgroundColor: colors.panelAlt,
  },
  exitIcon: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.textMuted,
    lineHeight: 18,
  },
  headerText: {
    flex: 1,
  },
  header: {
    fontFamily: fonts.headingSemiBold,
    fontSize: fontSizes['3xl'],
    color: colors.textPrimary,
  },
  subheader: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textMuted,
    marginTop: 4,
  },
  incidentCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.alertBorder,
    overflow: 'hidden',
  },
  incidentGradient: {
    padding: 18,
  },
  tag: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.accentAlert,
    marginBottom: 10,
  },
  title: {
    fontFamily: fonts.headingSemiBold,
    fontSize: fontSizes['2xl'],
    lineHeight: 23,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    lineHeight: 19,
    color: colors.textMuted,
  },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 10,
  },
  choices: {
    marginHorizontal: 20,
    gap: 10,
  },
  choiceWrap: {
    position: 'relative',
    overflow: 'visible',
  },
  floatingScore: {
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  floatingScoreText: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes['3xl'],
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  choiceBtn: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  choiceBtnPressed: {
    backgroundColor: colors.panelAlt,
  },
  choiceBtnDisabled: {
    opacity: 0.55,
  },
  choiceLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    lineHeight: 19,
  },
});
