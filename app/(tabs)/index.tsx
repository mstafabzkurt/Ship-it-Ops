import React, { useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import Topbar from '../../src/components/Topbar';
import StatsPanel from '../../src/components/StatsPanel';
import IncidentCard from '../../src/components/IncidentCard';
import { CURRENT_INCIDENT } from '../../src/data/incidents';
import { useReputation, STREAK_REWARDS } from '../../src/state/ReputationContext';
import { colors } from '../../src/theme/colors';
import { fonts, fontSizes } from '../../src/theme/typography';

// Turkish day names Mon–Sun
const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

// ──────────────────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const {
    badges,
    streakDays,
    todayIndex,
    streakCount,
    claimStreakDay,
  } = useReputation();

  // Toast for streak claim
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToastMsg(msg);
    setToastVisible(true);
    toastAnim.setValue(0);
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.back(1.1)),
      useNativeDriver: true,
    }).start();
    toastTimeout.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => setToastVisible(false));
    }, 2800);
  };

  const handleClaimStreak = async () => {
    const reward = await claimStreakDay();
    if (reward > 0) {
      showToast(`🔥 Günlük ödül alındı! +$${reward.toLocaleString('tr-TR')} bütçe`);
    } else {
      showToast('✅ Bu günü zaten tamamladın!');
    }
  };

  // Most recently earned badge
  const earnedBadges = badges.filter((b) => b.earned);
  const lastBadge = earnedBadges.length > 0 ? earnedBadges[earnedBadges.length - 1] : null;

  const todayClaimed = streakDays[todayIndex] === true;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Topbar ─────────────────────────────────────────────────────── */}
        <Topbar statusLabel="Kriz Modu" statusVariant="crisis" />

        {/* ── Stats Panel (budget + tt + rep bar) ─────────────────────── */}
        <View style={styles.section}>
          <StatsPanel />
        </View>

        {/* ── Active Crisis ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <IncidentCard
            tag={CURRENT_INCIDENT.tag}
            title={CURRENT_INCIDENT.title}
            description={CURRENT_INCIDENT.description}
            onRespond={() => router.push('/(tabs)/game')}
          />
        </View>

        {/* ── Daily Streak Bar ─────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>
          🔥 Günlük Seri{streakCount > 0 ? ` · ${streakCount} Gün` : ''}
        </Text>
        <View style={styles.streakCard}>
          {/* Day Pills */}
          <View style={styles.streakRow}>
            {DAY_LABELS.map((label, idx) => {
              const isPast = idx < todayIndex;
              const isToday = idx === todayIndex;
              const isFuture = idx > todayIndex;
              const claimed = streakDays[idx] === true;
              const reward = STREAK_REWARDS[idx];

              return (
                <View key={label} style={styles.dayPillWrap}>
                  {/* Connector line */}
                  {idx < 6 && (
                    <View
                      style={[
                        styles.connector,
                        claimed && idx < todayIndex && styles.connectorDone,
                      ]}
                    />
                  )}

                  {/* Circle */}
                  <View
                    style={[
                      styles.dayCircle,
                      claimed && styles.dayCircleDone,
                      isToday && !claimed && styles.dayCircleToday,
                      isFuture && styles.dayCircleFuture,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayCircleText,
                        claimed && styles.dayCircleTextDone,
                        isToday && !claimed && styles.dayCircleTextToday,
                        isFuture && styles.dayCircleTextFuture,
                      ]}
                    >
                      {claimed ? '✓' : isFuture ? '🔒' : label[0]}
                    </Text>
                  </View>

                  {/* Label + Reward */}
                  <Text
                    style={[
                      styles.dayLabel,
                      isToday && styles.dayLabelToday,
                      isFuture && styles.dayLabelFuture,
                    ]}
                  >
                    {label}
                  </Text>
                  <Text
                    style={[
                      styles.dayReward,
                      claimed && styles.dayRewardDone,
                      isToday && !claimed && styles.dayRewardToday,
                    ]}
                  >
                    +${reward}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Claim button */}
          <TouchableOpacity
            style={[styles.claimButton, todayClaimed && styles.claimButtonDone]}
            onPress={handleClaimStreak}
            activeOpacity={0.78}
          >
            <Text style={[styles.claimButtonText, todayClaimed && styles.claimButtonTextDone]}>
              {todayClaimed
                ? `✓ Bugün tamamlandı · +$${STREAK_REWARDS[todayIndex].toLocaleString('tr-TR')}`
                : `🔥 Bugünü Tamamla · +$${STREAK_REWARDS[todayIndex].toLocaleString('tr-TR')} Kazan`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Last Earned Badge ────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>🏅 Son Kazanılan Rozet</Text>
        {lastBadge ? (
          <View style={styles.badgeWidget}>
            <View style={styles.badgeIconWrap}>
              <Text style={styles.badgeIcon}>{lastBadge.icon}</Text>
            </View>
            <View style={styles.badgeInfo}>
              <Text style={styles.badgeTitle}>{lastBadge.title}</Text>
              <Text style={styles.badgeDesc} numberOfLines={2}>
                {lastBadge.description}
              </Text>
              <View style={styles.badgeEarnedRow}>
                <View style={styles.earnedBadgePill}>
                  <Text style={styles.earnedBadgePillText}>✓ Kazanıldı</Text>
                </View>
                <Text style={styles.badgeReward}>
                  🎁 +${lastBadge.rewardBudget.toLocaleString('tr-TR')}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.badgePlaceholder}>
            <Text style={styles.badgePlaceholderIcon}>🏆</Text>
            <Text style={styles.badgePlaceholderTitle}>
              İlk rozetin seni bekliyor!
            </Text>
            <Text style={styles.badgePlaceholderSub}>
              Kriz senaryolarını çözerek itibar puanı kazan ve rozetlerin kilidini aç.
            </Text>
          </View>
        )}

        {/* Bottom breathing room */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Toast */}
      {toastVisible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 36,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 14,
  },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
  },

  // ── Streak ──────────────────────────────────────────────────────────────────
  streakCard: {
    marginHorizontal: 20,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
  },
  dayPillWrap: {
    alignItems: 'center',
    flex: 1,
    gap: 5,
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    top: 14,
    left: '55%',
    right: '-55%',
    height: 2,
    backgroundColor: colors.border,
    zIndex: 0,
  },
  connectorDone: {
    backgroundColor: colors.accentPositive,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.panelAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dayCircleDone: {
    backgroundColor: colors.positiveBg,
    borderColor: colors.accentPositive,
  },
  dayCircleToday: {
    backgroundColor: 'rgba(242,169,59,0.12)',
    borderColor: colors.accentAlert,
    borderWidth: 2,
  },
  dayCircleFuture: {
    opacity: 0.4,
  },
  dayCircleText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
  },
  dayCircleTextDone: {
    color: colors.accentPositive,
    fontSize: 12,
  },
  dayCircleTextToday: {
    color: colors.accentAlert,
    fontSize: 11,
  },
  dayCircleTextFuture: {
    color: colors.textMuted,
    fontSize: 10,
  },
  dayLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  dayLabelToday: {
    color: colors.accentAlert,
    fontFamily: fonts.bodySemiBold,
  },
  dayLabelFuture: {
    opacity: 0.4,
  },
  dayReward: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textMuted,
  },
  dayRewardDone: {
    color: colors.accentPositive,
  },
  dayRewardToday: {
    color: colors.accentAlert,
    fontFamily: fonts.monoSemiBold,
  },
  claimButton: {
    backgroundColor: colors.accentAlert,
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
  },
  claimButtonDone: {
    backgroundColor: colors.positiveBg,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
  },
  claimButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.bgBase,
  },
  claimButtonTextDone: {
    color: colors.accentPositive,
  },

  // ── Last Badge Widget ────────────────────────────────────────────────────────
  badgeWidget: {
    marginHorizontal: 20,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  badgeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.positiveBg,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeIcon: {
    fontSize: 26,
  },
  badgeInfo: {
    flex: 1,
    gap: 4,
  },
  badgeTitle: {
    fontFamily: fonts.headingSemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  badgeDesc: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  badgeEarnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  earnedBadgePill: {
    backgroundColor: colors.positiveBg,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  earnedBadgePillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    color: colors.accentPositive,
  },
  badgeReward: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  badgePlaceholder: {
    marginHorizontal: 20,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    gap: 8,
  },
  badgePlaceholderIcon: {
    fontSize: 32,
    opacity: 0.4,
  },
  badgePlaceholderTitle: {
    fontFamily: fonts.headingSemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  badgePlaceholderSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },

  // ── Toast ────────────────────────────────────────────────────────────────────
  toast: {
    position: 'absolute',
    bottom: 28,
    left: 20,
    right: 20,
    backgroundColor: colors.panelAlt,
    borderWidth: 1.5,
    borderColor: colors.accentPositive,
    borderRadius: 13,
    paddingVertical: 13,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  toastText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.accentPositive,
  },
});
