import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STREAK_REWARDS } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { dashboardType, getDashboardTokens } from './dashboardTokens';

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

interface StreakCardProps {
  days: boolean[];
  todayIndex: number;
  streakCount: number;
  onClaim: () => void;
}

export default function StreakCard({ days, todayIndex, streakCount, onClaim }: StreakCardProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const todayClaimed = days[todayIndex] === true;
  const [buttonFocused, setButtonFocused] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>GÜNLÜK SERİ</Text>
          <Text style={styles.title}>{streakCount > 0 ? `${streakCount} günlük akış` : 'Seriyi bugün başlat'}</Text>
        </View>
        <View style={styles.rewardChip}>
          <Text style={styles.rewardChipLabel}>BUGÜN</Text>
          <Text style={styles.rewardChipValue}>+${STREAK_REWARDS[todayIndex].toLocaleString('tr-TR')}</Text>
        </View>
      </View>

      <View style={styles.days}>
        {DAY_LABELS.map((label, index) => {
          const claimed = days[index] === true;
          const isToday = index === todayIndex;
          const isFuture = index > todayIndex;
          const stateLabel = claimed ? 'Alındı' : isToday ? 'Bugün' : isFuture ? 'Yakında' : 'Kaçırıldı';
          return (
            <View key={label} style={styles.day} accessibilityLabel={`${label}, ${stateLabel}, ${STREAK_REWARDS[index]} dolar`}>
              {index < DAY_LABELS.length - 1 ? (
                <View style={[styles.connector, claimed && index < todayIndex && styles.connectorDone]} />
              ) : null}
              <View style={[
                styles.dayCircle,
                claimed && styles.dayCircleDone,
                isToday && !claimed && styles.dayCircleToday,
                isFuture && styles.dayCircleFuture,
              ]}>
                <Text style={[
                  styles.dayInitial,
                  claimed && styles.dayInitialDone,
                  isToday && !claimed && styles.dayInitialToday,
                ]}>
                  {claimed ? '✓' : label.charAt(0)}
                </Text>
              </View>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{label}</Text>
              <Text style={styles.dayState}>{stateLabel}</Text>
            </View>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={todayClaimed ? 'Bugünkü günlük seri ödülü tamamlandı' : 'Bugünkü günlük seri ödülünü al'}
        onPress={onClaim}
        onFocus={() => setButtonFocused(true)}
        onBlur={() => setButtonFocused(false)}
        style={({ pressed }) => [
          styles.claimButton,
          todayClaimed && styles.claimButtonDone,
          buttonFocused && styles.claimButtonFocused,
          pressed && tokens.motion.pressed,
        ]}
      >
        <Text style={[styles.claimButtonText, todayClaimed && styles.claimButtonTextDone]}>
          {todayClaimed ? 'Bugünün ödülü alındı' : 'Bugünü Tamamla'}
        </Text>
        <Text style={[styles.claimButtonMeta, todayClaimed && styles.claimButtonTextDone]}>
          +${STREAK_REWARDS[todayIndex].toLocaleString('tr-TR')}
        </Text>
      </Pressable>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: {
      padding: 18,
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.card,
    },
    headingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
    eyebrow: { ...dashboardType.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.secondary, marginBottom: 4 },
    title: { ...dashboardType.title, fontFamily: fonts.headingBold, color: colors.text },
    rewardChip: {
      alignItems: 'flex-end',
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: radius.md,
      backgroundColor: colors.warningSoft,
      borderWidth: 1,
      borderColor: colors.warning,
    },
    rewardChipLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, letterSpacing: 0.55, color: colors.textMuted },
    rewardChipValue: { fontFamily: fonts.monoBold, fontSize: 14, lineHeight: 19, color: colors.warning },
    days: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 20 },
    day: { flex: 1, alignItems: 'center', position: 'relative', minWidth: 0 },
    connector: { position: 'absolute', top: 17, left: '61%', right: '-39%', height: 3, borderRadius: radius.pill, backgroundColor: colors.canvas, zIndex: 0 },
    connectorDone: { backgroundColor: colors.secondary },
    dayCircle: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 13,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 1,
    },
    dayCircleDone: { backgroundColor: colors.secondarySoft, borderColor: colors.secondary },
    dayCircleToday: { backgroundColor: colors.warningSoft, borderColor: colors.warning, borderWidth: 2 },
    dayCircleFuture: { opacity: 0.45 },
    dayInitial: { fontFamily: fonts.monoBold, fontSize: 12, color: colors.textMuted },
    dayInitialDone: { color: colors.secondary },
    dayInitialToday: { color: colors.warning },
    dayLabel: { marginTop: 7, fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.textMuted },
    dayLabelToday: { color: colors.warning },
    dayState: { marginTop: 2, fontFamily: fonts.body, fontSize: 10, lineHeight: 13, color: colors.textMuted },
    claimButton: {
      minHeight: tokens.control.heightLarge,
      marginTop: 18,
      paddingHorizontal: 17,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: radius.md,
      backgroundColor: colors.warning,
      borderWidth: 1,
      borderColor: colors.surfaceHighlightStrong,
    },
    claimButtonDone: { backgroundColor: colors.secondarySoft, borderColor: colors.secondary },
    claimButtonFocused: { borderColor: colors.text },
    claimButtonText: { fontFamily: fonts.headingSemiBold, fontSize: 15, color: colors.onAccent },
    claimButtonMeta: { fontFamily: fonts.monoBold, fontSize: 14, color: colors.onAccent },
    claimButtonTextDone: { color: colors.secondary },
  });
}
