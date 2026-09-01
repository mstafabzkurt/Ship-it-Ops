import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Badge } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from './dashboardTokens';

interface AchievementCardProps {
  badge: Badge | null;
}

export default function AchievementCard({ badge }: AchievementCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>SON BAŞARI</Text>
      {badge ? (
        <>
          <View style={styles.badgeRow}>
            <View style={styles.badgeMark} accessibilityLabel={`${badge.title} rozeti`}>
              <Ionicons name={badge.icon} size={25} color={tokens.colors.warning} />
            </View>
            <View style={styles.badgeCopy}>
              <Text style={styles.title}>{badge.title}</Text>
              <Text style={styles.description}>{badge.description}</Text>
            </View>
          </View>
          <View style={styles.rewardRow}>
            <View style={styles.earnedPill}>
              <Text style={styles.earnedText}>KAZANILDI</Text>
            </View>
            <Text style={styles.rewardValue}>{badge.progressText}</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyMark}>
            <Text style={styles.emptyMarkText}>01</Text>
          </View>
          <Text style={styles.title}>İlk rozetin hazır</Text>
          <Text style={styles.description}>Oturumları tamamla ve alan ilerlemeni geliştirerek koleksiyonu başlat.</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: {
      padding: tokens.layout.isCompact ? 14 : 18,
      borderRadius: radius.md,
      backgroundColor: colors.secondarySurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...shadow.card,
      shadowColor: colors.shadowNeutral,
      shadowOpacity: 0.18,
    },
    eyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.primary, marginBottom: tokens.layout.isCompact ? 10 : 14 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
    badgeMark: {
      width: 52,
      height: 52,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      overflow: 'hidden',
      backgroundColor: colors.warningSoft,
      borderWidth: 1,
      borderColor: colors.warning,
    },
    badgeCopy: { flex: 1, minWidth: 0 },
    title: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text },
    description: { ...tokens.type.bodySmall, fontFamily: fonts.body, color: colors.textMuted, marginTop: 3 },
    rewardRow: {
      minHeight: tokens.control.height,
      marginTop: 14,
      paddingTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: colors.dividerSubtle,
    },
    earnedPill: { paddingVertical: 4 },
    earnedText: { fontFamily: fonts.bodySemiBold, fontSize: 10, letterSpacing: 0.5, color: colors.secondary },
    rewardValue: { flexShrink: 1, fontFamily: fonts.monoSemiBold, fontSize: 12, color: colors.secondary },
    emptyState: { alignItems: 'flex-start' },
    emptyMark: {
      width: 56,
      height: 56,
      marginBottom: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 19,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    emptyMarkText: { fontFamily: fonts.monoBold, fontSize: 16, color: colors.primary },
  });
}
