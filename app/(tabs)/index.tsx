import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import AchievementCard from '../../src/components/dashboard/AchievementCard';
import CareerSummaryCard from '../../src/components/dashboard/CareerSummaryCard';
import CrisisMissionCard from '../../src/components/dashboard/CrisisMissionCard';
import DashboardHeader from '../../src/components/dashboard/DashboardHeader';
import ResourceDock from '../../src/components/dashboard/ResourceDock';
import StreakCard from '../../src/components/dashboard/StreakCard';
import { getDashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { CURRENT_INCIDENT } from '../../src/data/incidents';
import { RANKS, useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const {
    badges,
    budget,
    careerXp,
    codeReview,
    companyName,
    correctAnswers,
    currentRank,
    gitRevert,
    nextRank,
    rankProgress,
    score,
    serverScaleUp,
    snapshotBackup,
    streakCount,
    streakDays,
    todayIndex,
    uptimeStreak,
    wrongAnswers,
    claimStreakDay,
  } = useReputation();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const isWide = width >= 900;

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const toastAnimation = useRef(new Animated.Value(0)).current;
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      subscription.remove();
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, []);

  const showToast = (message: string) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToastMessage(message);
    setToastVisible(true);
    if (reduceMotion) {
      toastAnimation.setValue(1);
      toastTimeout.current = setTimeout(() => setToastVisible(false), 2800);
      return;
    }
    toastAnimation.setValue(0);
    Animated.timing(toastAnimation, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.back(1.05)),
      useNativeDriver: true,
    }).start();
    toastTimeout.current = setTimeout(() => {
      Animated.timing(toastAnimation, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => setToastVisible(false));
    }, 2800);
  };

  const handleClaimStreak = async () => {
    const reward = await claimStreakDay();
    showToast(
      reward > 0
        ? `Günlük ödül alındı · +$${reward.toLocaleString('tr-TR')} bütçe`
        : 'Bugünün ödülü zaten alındı.',
    );
  };

  const earnedBadges = badges.filter((badge) => badge.earned);
  const lastBadge = earnedBadges.length > 0 ? earnedBadges[earnedBadges.length - 1] : null;
  const currentLevel = Math.max(1, RANKS.findIndex((rank) => rank.id === currentRank.id) + 1);

  return (
    <LinearGradient
      colors={[tokens.colors.canvasGlow, tokens.colors.canvas, tokens.colors.canvas]}
      locations={[0, 0.36, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <View style={styles.orbOne} pointerEvents="none" />
      <View style={styles.orbTwo} pointerEvents="none" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <DashboardHeader companyName={companyName} currentRank={currentRank} level={currentLevel} />

            <CareerSummaryCard
              budget={budget}
              careerXp={careerXp}
              reputation={score}
              uptimeStreak={uptimeStreak}
              correctAnswers={correctAnswers}
              wrongAnswers={wrongAnswers}
              currentRank={currentRank}
              nextRank={nextRank}
              progress={rankProgress}
            />

            <View style={[styles.dashboardGrid, isWide && styles.dashboardGridWide]}>
              <View style={[styles.primaryColumn, isWide && styles.primaryColumnWide]}>
                <CrisisMissionCard
                  tag={CURRENT_INCIDENT.tag}
                  title={CURRENT_INCIDENT.title}
                  description={CURRENT_INCIDENT.description}
                  durationSeconds={CURRENT_INCIDENT.durationSeconds}
                  onRespond={() => router.push('/(tabs)/game')}
                />
                <StreakCard
                  days={streakDays}
                  todayIndex={todayIndex}
                  streakCount={streakCount}
                  onClaim={handleClaimStreak}
                />
              </View>

              <View style={[styles.secondaryColumn, isWide && styles.secondaryColumnWide]}>
                <ResourceDock
                  codeReview={codeReview}
                  gitRevert={gitRevert}
                  serverScaleUp={serverScaleUp}
                  snapshotBackup={snapshotBackup}
                  onOpenGame={() => router.push('/(tabs)/game')}
                />
                <AchievementCard badge={lastBadge} />
              </View>
            </View>

            <Text style={styles.footerNote}>
              Her karar bütçeni, itibarını ve kariyer yolunu etkiler.
            </Text>
          </View>
        </ScrollView>

        {toastVisible ? (
          <Animated.View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            pointerEvents="none"
            style={[
              styles.toast,
              {
                opacity: toastAnimation,
                transform: [
                  { translateY: toastAnimation.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                ],
              },
            ]}
          >
            <View style={styles.toastMark}><Text style={styles.toastMarkText}>✓</Text></View>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    safeArea: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: tokens.layout.pageBottom },
    container: {
      width: '100%',
      maxWidth: tokens.layout.contentMaxWidth,
      alignSelf: 'center',
      paddingHorizontal: tokens.layout.pageGutter,
      paddingTop: tokens.layout.pageTop,
      gap: tokens.layout.sectionGap,
    },
    orbOne: {
      position: 'absolute',
      width: 240,
      height: 240,
      top: -110,
      right: -90,
      borderRadius: 120,
      backgroundColor: colors.primarySoft,
      opacity: 0.6,
    },
    orbTwo: {
      position: 'absolute',
      width: 180,
      height: 180,
      top: 420,
      left: -120,
      borderRadius: 90,
      backgroundColor: colors.secondarySoft,
      opacity: 0.45,
    },
    dashboardGrid: { gap: tokens.layout.sectionGap },
    dashboardGridWide: { flexDirection: 'row', alignItems: 'flex-start' },
    primaryColumn: { gap: tokens.layout.sectionGap },
    primaryColumnWide: { flex: 1.55 },
    secondaryColumn: { gap: tokens.layout.sectionGap },
    secondaryColumnWide: { flex: 0.85 },
    footerNote: {
      alignSelf: 'center',
      maxWidth: 520,
      paddingHorizontal: 20,
      paddingTop: 4,
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
      color: colors.textMuted,
    },
    toast: {
      position: 'absolute',
      left: tokens.layout.pageGutter,
      right: tokens.layout.pageGutter,
      bottom: tokens.layout.floatingInset,
      maxWidth: 520,
      minHeight: 58,
      alignSelf: 'center',
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.secondary,
      ...shadow.raised,
    },
    toastMark: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: colors.secondarySoft,
      borderWidth: 1,
      borderColor: colors.secondary,
    },
    toastMarkText: { fontFamily: fonts.headingBold, fontSize: 17, color: colors.secondary },
    toastText: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20, color: colors.text },
  });
}
