import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Badge } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { dashboardType, getDashboardTokens } from '../dashboard/dashboardTokens';

interface AchievementCardProps {
  badge: Badge & { earned: boolean };
}

export default function AchievementCard({ badge }: AchievementCardProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  return (
    <View style={[styles.card, badge.earned ? styles.cardEarned : styles.cardLocked]}>
      <View style={styles.topRow}>
        <View style={[styles.iconMark, badge.earned ? styles.iconMarkEarned : styles.iconMarkLocked]}>
          <View pointerEvents="none" style={styles.iconShine} />
          <Text style={[styles.icon, !badge.earned && styles.iconLocked]} accessibilityElementsHidden>{badge.icon}</Text>
        </View>
        <View style={[styles.statePill, badge.earned ? styles.statePillEarned : styles.statePillLocked]}>
          <Text style={[styles.stateText, badge.earned ? styles.stateTextEarned : styles.stateTextLocked]}>
            {badge.earned ? '✓ Kazanıldı' : '🔒 Kilitli'}
          </Text>
        </View>
      </View>

      <Text style={[styles.title, !badge.earned && styles.textLocked]}>{badge.title}</Text>
      <Text style={[styles.description, !badge.earned && styles.textLocked]}>{badge.description}</Text>

      <View style={styles.cardFooter}>
        <View style={[styles.rewardPill, badge.earned && styles.rewardPillEarned]}>
          <Text style={[styles.rewardText, badge.earned && styles.rewardTextEarned]}>
            🎁 +{badge.rewardBudget.toLocaleString('tr-TR')} Bütçe
          </Text>
        </View>
        {!badge.earned ? (
          <Text style={styles.requirementText}>
            🔒 {badge.requiredScore.toLocaleString('tr-TR')} {badge.requirementType === 'careerXp' ? 'Kariyer XP' : 'İtibar'} gerekli
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: { minHeight: 245, padding: 17, borderRadius: radius.lg, borderWidth: 1, ...shadow.card },
    cardEarned: { backgroundColor: colors.secondarySoft, borderColor: colors.secondary },
    cardLocked: { backgroundColor: colors.surface, borderColor: colors.border },
    topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
    iconMark: { width: 64, height: 64, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1 },
    iconMarkEarned: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
    iconMarkLocked: { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong },
    iconShine: { position: 'absolute', width: 46, height: 18, top: 5, left: 7, borderRadius: 20, backgroundColor: colors.surfaceHighlight, transform: [{ rotate: '-12deg' }] },
    icon: { fontSize: 30, lineHeight: 38 },
    iconLocked: { opacity: 0.5 },
    statePill: { minHeight: 30, justifyContent: 'center', paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: 1 },
    statePillEarned: { backgroundColor: colors.secondarySoft, borderColor: colors.secondary },
    statePillLocked: { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
    stateText: { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 15 },
    stateTextEarned: { color: colors.secondary },
    stateTextLocked: { color: colors.textMuted },
    title: { ...dashboardType.title, fontFamily: fonts.headingBold, color: colors.text, marginBottom: 6 },
    description: { ...dashboardType.body, flexGrow: 1, fontFamily: fonts.body, color: colors.textMuted },
    textLocked: { opacity: 0.72 },
    cardFooter: { gap: 9, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
    rewardPill: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center', paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.border },
    rewardPillEarned: { borderColor: colors.warning },
    rewardText: { fontFamily: fonts.monoSemiBold, fontSize: 11, lineHeight: 16, color: colors.textMuted },
    rewardTextEarned: { color: colors.warning },
    requirementText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.warning },
  });
}
