import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Badge } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';
import ProgressSweep from '../ProgressSweep';

interface AchievementCardProps {
  badge: Badge & { earned: boolean };
  reduceMotion: boolean;
  active: boolean;
}

export default function AchievementCard({ badge, reduceMotion, active }: AchievementCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  // The existing derived text is the source of truth. This ratio is visual only;
  // it never determines whether a badge is earned or grants a reward.
  const progressParts = /^([\d.]+)\/([\d.]+)(?:\s|$)/.exec(badge.progressText);
  const target = progressParts ? Number(progressParts[2].replace(/\./g, '')) : 0;
  const visualProgress = progressParts && target > 0
    ? Math.min(1, Math.max(0, Number(progressParts[1].replace(/\./g, '')) / target))
    : null;

  return (
    <View style={[styles.card, badge.earned ? styles.cardEarned : styles.cardLocked]}>
      <View style={[styles.stateRail, badge.earned ? styles.stateRailEarned : styles.stateRailLocked]} />
      <View style={styles.topRow}>
        <View
          aria-hidden accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.iconMark, badge.earned ? styles.iconMarkEarned : styles.iconMarkLocked]}
        >
          <Ionicons
            name={badge.icon}
            size={22}
            color={badge.earned ? tokens.colors.warning : tokens.colors.textMuted}
          />
        </View>
        <View style={styles.recordCopy}>
          <Text style={[styles.title, !badge.earned && styles.textLocked]}>{badge.title}</Text>
          <Text style={[styles.description, !badge.earned && styles.textLocked]}>{badge.description}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.stateLabel}>
          <Ionicons name={badge.earned ? 'checkmark-circle-outline' : 'lock-closed-outline'} size={15} color={badge.earned ? tokens.colors.warning : tokens.colors.textMuted} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
          <Text style={[styles.stateText, badge.earned ? styles.stateTextEarned : styles.stateTextLocked]}>{badge.earned ? 'Kazanıldı' : 'Kilitli'}</Text>
        </View>
        <Text style={[styles.progressText, badge.earned && styles.progressTextEarned]}>{badge.progressText}</Text>
      </View>
      {visualProgress !== null ? (
        <ProgressSweep
          value={visualProgress}
          reduceMotion={reduceMotion}
          active={active}
          accessibilityLabel={`${badge.title}, ${badge.earned ? 'kazanıldı' : 'kilitli'}, ilerleme ${badge.progressText}`}
          trackStyle={styles.progressTrack}
          fillStyle={[styles.progressFill, badge.earned && styles.progressFillEarned]}
          sweepColor={tokens.colors.text}
        />
      ) : null}
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: { position: 'relative', overflow: 'hidden', minHeight: tokens.layout.isCompact ? 0 : 160, padding: tokens.layout.isCompact ? 12 : 15, paddingLeft: tokens.layout.isCompact ? 15 : 18, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, ...shadow.card, shadowColor: colors.shadowNeutral, shadowOpacity: 0.12 },
    cardEarned: { backgroundColor: colors.floatingSurfaceRaised },
    cardLocked: { backgroundColor: colors.floatingSurface },
    stateRail: { position: 'absolute', top: 0, left: 16, right: 16, height: 1 },
    stateRailEarned: { backgroundColor: colors.warning },
    stateRailLocked: { backgroundColor: colors.borderStrong },
    topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    iconMark: { width: 48, height: 48, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 24, borderWidth: 1 },
    iconMarkEarned: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
    iconMarkLocked: { backgroundColor: colors.secondarySurfaceRaised, borderColor: colors.borderSubtle },
    recordCopy: { flex: 1, minWidth: 0 },
    stateLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 28 },
    stateText: { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 15 },
    stateTextEarned: { color: colors.warning },
    stateTextLocked: { color: colors.textMuted },
    title: { fontFamily: fonts.headingBold, fontSize: 16, lineHeight: 21, color: colors.text, marginBottom: 3 },
    description: { ...tokens.type.bodySmall, fontFamily: fonts.body, color: colors.textMuted },
    textLocked: { color: colors.textMuted },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: tokens.layout.isCompact ? 10 : 13, paddingTop: tokens.layout.isCompact ? 9 : 11, borderTopWidth: 1, borderTopColor: colors.dividerSubtle },
    progressTrack: { height: 4, marginTop: 8, borderRadius: 2, backgroundColor: colors.borderSubtle, overflow: 'hidden' },
    progressFill: { backgroundColor: colors.textMuted, opacity: 0.65, borderRadius: 2 },
    progressFillEarned: { backgroundColor: colors.warning, opacity: 1 },
    progressText: { fontFamily: fonts.monoSemiBold, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    progressTextEarned: { color: colors.warning },
  });
}
