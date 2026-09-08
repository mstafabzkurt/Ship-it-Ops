import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GUIDED_TOUR_STEPS, getGuidedTourStepForPathname } from '../../config/guidedTour';
import { useAuth } from '../../state/AuthContext';
import { useReputation } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { shouldShowTutorial, TUTORIAL_STEP_COUNT } from '../../utils/onboarding';
import { trackEvent } from '../../utils/telemetry';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

export default function GuidedProductTour() {
  const { user } = useAuth();
  const { completeTutorial, onboardingCompleted, tutorialCompleted } = useReputation();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [tourStep, setTourStep] = useState(0);
  const [hasEnteredTour, setHasEnteredTour] = useState(false);
  const [focusedControl, setFocusedControl] = useState<'skip' | 'back' | 'next' | null>(null);
  const tutorialStarted = useRef(false);
  const isActiveGameSession = pathname === '/game' || pathname.endsWith('/game');
  const showTour = Boolean(user) && shouldShowTutorial(onboardingCompleted, tutorialCompleted, isActiveGameSession);
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens, width), [tokens, width]);
  const step = GUIDED_TOUR_STEPS[tourStep];
  const isLastStep = tourStep === TUTORIAL_STEP_COUNT - 1;

  useEffect(() => {
    if (!showTour || tutorialStarted.current) return;
    tutorialStarted.current = true;
    setTourStep(0);
    setHasEnteredTour(false);
    void trackEvent('tutorial_started', { step_count: TUTORIAL_STEP_COUNT });
    router.replace(GUIDED_TOUR_STEPS[0].route);
  }, [router, showTour]);

  useEffect(() => {
    if (!showTour || !tutorialStarted.current) return;
    const routeStep = getGuidedTourStepForPathname(pathname);
    if (!hasEnteredTour) {
      if (routeStep === 0) setHasEnteredTour(true);
      return;
    }
    if (routeStep >= 0 && routeStep !== tourStep) setTourStep(routeStep);
  }, [hasEnteredTour, pathname, showTour, tourStep]);

  const navigateToStep = (targetStep: number) => {
    if (targetStep < 0 || targetStep >= TUTORIAL_STEP_COUNT) return;
    try {
      router.replace(GUIDED_TOUR_STEPS[targetStep].route);
    } catch {
      // Keep the current explanation stable; Skip remains available.
    }
  };

  const handleSkip = () => {
    void trackEvent('tutorial_skipped', {
      step_count: TUTORIAL_STEP_COUNT,
      skipped_at_step: tourStep + 1,
    });
    completeTutorial();
  };

  const handleFinish = () => {
    void trackEvent('tutorial_completed', { step_count: TUTORIAL_STEP_COUNT });
    completeTutorial();
  };

  if (!showTour) return null;

  return (
    <View accessibilityViewIsModal style={styles.overlayRoot}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="auto"
        style={styles.scrim}
      />
      <SafeAreaView edges={['bottom']} pointerEvents="box-none" style={styles.safeArea}>
        <View style={styles.card}>
          <View style={styles.technicalRail} />
          <View style={styles.header}>
            <View style={styles.stepMeta}>
              <Text style={styles.eyebrow}>ÜRÜN TURU</Text>
              <Text accessibilityLiveRegion="polite" style={styles.stepLabel}>
                ADIM {tourStep + 1} / {TUTORIAL_STEP_COUNT}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Tanıtım turunu atla"
              accessibilityRole="button"
              hitSlop={8}
              onBlur={() => setFocusedControl(null)}
              onFocus={() => setFocusedControl('skip')}
              onPress={handleSkip}
              style={({ pressed }) => [styles.skipButton, focusedControl === 'skip' && styles.buttonFocused, pressed && styles.buttonPressed]}
            >
              <Text style={styles.skipText}>Atla</Text>
            </Pressable>
          </View>

          <View style={styles.contentRow}>
            <View style={styles.iconTile}>
              <Ionicons
                accessibilityElementsHidden
                color={tokens.colors.primary}
                importantForAccessibility="no-hide-descendants"
                name={step.icon}
                size={26}
              />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.body}>{step.body}</Text>
            </View>
          </View>

          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 1, max: TUTORIAL_STEP_COUNT, now: tourStep + 1 }}
            style={styles.progressTrack}
          >
            <View style={[styles.progressFill, { width: `${((tourStep + 1) / TUTORIAL_STEP_COUNT) * 100}%` }]} />
          </View>

          <View style={styles.footer}>
            {tourStep > 0 ? (
              <Pressable
                accessibilityRole="button"
                onBlur={() => setFocusedControl(null)}
                onFocus={() => setFocusedControl('back')}
                onPress={() => navigateToStep(tourStep - 1)}
                style={({ pressed }) => [styles.backButton, focusedControl === 'back' && styles.buttonFocused, pressed && styles.buttonPressed]}
              >
                <Ionicons
                  accessibilityElementsHidden
                  color={tokens.colors.text}
                  importantForAccessibility="no-hide-descendants"
                  name="arrow-back"
                  size={17}
                />
                <Text style={styles.backButtonText}>Geri</Text>
              </Pressable>
            ) : <View />}
            <Pressable
              accessibilityRole="button"
              onBlur={() => setFocusedControl(null)}
              onFocus={() => setFocusedControl('next')}
              onPress={isLastStep ? handleFinish : () => navigateToStep(tourStep + 1)}
              style={({ pressed }) => [styles.nextButton, focusedControl === 'next' && styles.buttonFocused, pressed && styles.nextButtonPressed]}
            >
              <Text style={styles.nextButtonText}>{isLastStep ? 'Turu Bitir' : 'Sonraki'}</Text>
              <Ionicons
                accessibilityElementsHidden
                color={tokens.colors.foregroundOnAction}
                importantForAccessibility="no-hide-descendants"
                name={isLastStep ? 'checkmark' : 'arrow-forward'}
                size={18}
              />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(
  tokens: ReturnType<typeof getDashboardTokens>,
  width: number,
) {
  const { colors, radius } = tokens;
  const desktop = width >= 700;
  const tabClearance = tokens.layout.tabBarHeight + tokens.spacing.sm;

  return StyleSheet.create({
    overlayRoot: { ...StyleSheet.absoluteFillObject, zIndex: 1000 },
    scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlayScrim, opacity: 0.68 },
    safeArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: desktop ? tokens.spacing.lg : tokens.layout.pageGutter,
      paddingBottom: tabClearance,
    },
    card: {
      width: '100%',
      maxWidth: desktop ? 480 : 520,
      overflow: 'hidden',
      borderRadius: desktop ? radius.lg : radius.md,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.floatingSurface,
      ...tokens.shadow.raised,
      shadowColor: colors.shadowNeutral,
    },
    technicalRail: { height: 3, backgroundColor: colors.primary },
    header: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingLeft: tokens.layout.cardPadding,
      paddingRight: tokens.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerSubtle,
    },
    stepMeta: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
    eyebrow: { color: colors.primary, fontFamily: fonts.monoSemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.9 },
    stepLabel: { color: colors.textMuted, fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.55 },
    skipButton: { minWidth: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderWidth: 1, borderColor: 'transparent', borderRadius: radius.sm },
    skipText: { color: colors.textMuted, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: tokens.layout.isNarrow ? 11 : 14,
      padding: tokens.layout.cardPadding,
    },
    iconTile: { width: 48, height: 48, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.primarySoft },
    copy: { flex: 1, minWidth: 0 },
    title: { color: colors.text, fontFamily: fonts.headingBold, fontSize: tokens.layout.isCompact ? 19 : 21, lineHeight: tokens.layout.isCompact ? 25 : 27 },
    body: { marginTop: 5, color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
    progressTrack: { height: 3, backgroundColor: colors.progressTrack },
    progressFill: { height: 3, backgroundColor: colors.secondary },
    footer: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: tokens.layout.cardPadding, paddingVertical: tokens.spacing.sm, backgroundColor: colors.floatingSurfaceRaised },
    backButton: { minWidth: 88, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.secondarySurface },
    backButtonText: { color: colors.text, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
    nextButton: { minWidth: tokens.layout.isNarrow ? 132 : 148, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 16, borderRadius: radius.sm, borderWidth: 1, borderColor: 'transparent', backgroundColor: colors.action },
    nextButtonText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 19 },
    buttonPressed: { opacity: 0.72 },
    buttonFocused: { borderColor: colors.actionFocus },
    nextButtonPressed: tokens.motion.pressed,
  });
}
