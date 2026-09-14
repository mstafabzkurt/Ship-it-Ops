import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Badge } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { ECONOMY_ICON_ASSETS } from '../../config/iconAssets';
import { getDashboardTokens } from '../dashboard/dashboardTokens';
import AssetIcon from '../AssetIcon';
import ProgressSweep from '../ProgressSweep';

interface AchievementCardProps {
  badge: Badge & { earned: boolean };
  reduceMotion: boolean;
  active: boolean;
  isNew?: boolean;
}

export default function AchievementCard({ badge, reduceMotion, active, isNew = false }: AchievementCardProps) {
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
    <View style={[styles.card, badge.earned ? styles.cardEarned : styles.cardLocked, isNew && styles.cardNew]}>
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
          <View style={styles.titleRow}>
            <Text style={[styles.title, !badge.earned && styles.textLocked]}>{badge.title}</Text>
            {isNew ? (
              <View style={styles.newChip}>
                <Text style={styles.newChipText}>Yeni</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.description, !badge.earned && styles.textLocked]}>{badge.description}</Text>
        </View>
      </View>

      <View style={styles.rewardRow}>
        <AssetIcon
          source={ECONOMY_ICON_ASSETS.coin}
          fallbackName="wallet-outline"
          fallbackColor={tokens.colors.budget}
          size={18}
        />
        <Text style={styles.rewardText}>Ödül: +{badge.budgetReward.toLocaleString('tr-TR')} Şirket Bütçesi</Text>
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
          accessibilityLabel={`${badge.title}, ${isNew ? 'yeni rozet, ' : ''}${badge.earned ? 'kazanıldı' : 'kilitli'}, ödül ${badge.budgetReward.toLocaleString('tr-TR')} Şirket Bütçesi, ilerleme ${badge.progressText}`}
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
    cardNew: { borderColor: colors.warning, backgroundColor: colors.warningSoft, shadowColor: colors.warning, shadowOpacity: 0.28, shadowRadius: 12, elevation: 8 },
    stateRail: { position: 'absolute', top: 0, left: 16, right: 16, height: 1 },
    stateRailEarned: { backgroundColor: colors.warning },
    stateRailLocked: { backgroundColor: colors.borderStrong },
    topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    iconMark: { width: 48, height: 48, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 24, borderWidth: 1 },
    iconMarkEarned: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
    iconMarkLocked: { backgroundColor: colors.secondarySurfaceRaised, borderColor: colors.borderSubtle },
    recordCopy: { flex: 1, minWidth: 0 },
    titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginBottom: 3 },
    newChip: { minHeight: 22, justifyContent: 'center', paddingHorizontal: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.warning, backgroundColor: colors.warningSoft },
    newChipText: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, color: colors.warning },
    stateLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 28 },
    stateText: { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 15 },
    stateTextEarned: { color: colors.warning },
    stateTextLocked: { color: colors.textMuted },
    title: { flexShrink: 1, fontFamily: fonts.headingBold, fontSize: 16, lineHeight: 21, color: colors.text },
    description: { ...tokens.type.bodySmall, fontFamily: fonts.body, color: colors.textMuted },
    textLocked: { color: colors.textMuted },
    rewardRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: tokens.layout.isCompact ? 9 : 11 },
    rewardText: { flex: 1, fontFamily: fonts.monoSemiBold, fontSize: 11, lineHeight: 16, color: colors.budget },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: tokens.layout.isCompact ? 10 : 13, paddingTop: tokens.layout.isCompact ? 9 : 11, borderTopWidth: 1, borderTopColor: colors.dividerSubtle },
    progressTrack: { height: 4, marginTop: 8, borderRadius: 2, backgroundColor: colors.borderSubtle, overflow: 'hidden' },
    progressFill: { backgroundColor: colors.textMuted, opacity: 0.65, borderRadius: 2 },
    progressFillEarned: { backgroundColor: colors.warning, opacity: 1 },
    progressText: { fontFamily: fonts.monoSemiBold, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    progressTextEarned: { color: colors.warning },
  });
}
