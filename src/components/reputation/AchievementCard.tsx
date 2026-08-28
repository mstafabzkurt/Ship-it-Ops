import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Badge } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface AchievementCardProps {
  badge: Badge & { earned: boolean };
}

export default function AchievementCard({ badge }: AchievementCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  return (
    <View style={[styles.card, badge.earned ? styles.cardEarned : styles.cardLocked]}>
      <View style={[styles.stateRail, badge.earned ? styles.stateRailEarned : styles.stateRailLocked]} />
      <View style={styles.topRow}>
        <View style={[styles.iconMark, badge.earned ? styles.iconMarkEarned : styles.iconMarkLocked]}>
          <Text style={[styles.icon, !badge.earned && styles.iconLocked]} accessibilityElementsHidden>{badge.icon}</Text>
        </View>
        <View style={styles.recordCopy}>
          <Text style={[styles.title, !badge.earned && styles.textLocked]}>{badge.title}</Text>
          <Text style={[styles.description, !badge.earned && styles.textLocked]}>{badge.description}</Text>
        </View>
        <View style={styles.stateLabel}>
          <Ionicons name={badge.earned ? 'checkmark-circle-outline' : 'lock-closed-outline'} size={15} color={badge.earned ? tokens.colors.secondary : tokens.colors.textMuted} />
          <Text style={[styles.stateText, badge.earned ? styles.stateTextEarned : styles.stateTextLocked]}>{badge.earned ? 'Kazanıldı' : 'Kilitli'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.rewardLine}>
          <Ionicons name="gift-outline" size={14} color={badge.earned ? tokens.colors.warning : tokens.colors.textMuted} />
          <Text style={[styles.rewardText, badge.earned && styles.rewardTextEarned]}>+{badge.rewardBudget.toLocaleString('tr-TR')} Bütçe</Text>
        </View>
        {!badge.earned ? (
          <Text style={styles.requirementText}>{badge.requiredScore.toLocaleString('tr-TR')} {badge.requirementType === 'careerXp' ? 'Kariyer XP' : 'İtibar'} gerekli</Text>
        ) : null}
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: { position: 'relative', overflow: 'hidden', minHeight: tokens.layout.isCompact ? 0 : 160, padding: tokens.layout.isCompact ? 12 : 15, paddingLeft: tokens.layout.isCompact ? 15 : 18, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, ...shadow.card, shadowColor: colors.shadowNeutral, shadowOpacity: 0.12 },
    cardEarned: { backgroundColor: colors.secondarySurfaceRaised },
    cardLocked: { backgroundColor: colors.secondarySurface },
    stateRail: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 2 },
    stateRailEarned: { backgroundColor: colors.secondary },
    stateRailLocked: { backgroundColor: colors.borderStrong },
    topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    iconMark: { width: 44, height: 44, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1 },
    iconMarkEarned: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
    iconMarkLocked: { backgroundColor: colors.secondarySurfaceRaised, borderColor: colors.borderSubtle },
    icon: { fontSize: 23, lineHeight: 29 },
    iconLocked: { opacity: 0.5 },
    recordCopy: { flex: 1, minWidth: 0 },
    stateLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 28 },
    stateText: { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 15 },
    stateTextEarned: { color: colors.secondary },
    stateTextLocked: { color: colors.textMuted },
    title: { fontFamily: fonts.headingBold, fontSize: 16, lineHeight: 21, color: colors.text, marginBottom: 3 },
    description: { ...tokens.type.bodySmall, fontFamily: fonts.body, color: colors.textMuted },
    textLocked: { opacity: 0.72 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: tokens.layout.isCompact ? 10 : 13, paddingTop: tokens.layout.isCompact ? 9 : 11, borderTopWidth: 1, borderTopColor: colors.dividerSubtle },
    rewardLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rewardText: { fontFamily: fonts.monoSemiBold, fontSize: 11, lineHeight: 16, color: colors.textMuted },
    rewardTextEarned: { color: colors.warning },
    requirementText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.warning },
  });
}
