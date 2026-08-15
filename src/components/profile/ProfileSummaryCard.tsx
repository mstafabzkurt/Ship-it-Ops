import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Rank } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { dashboardType, getDashboardTokens } from '../dashboard/dashboardTokens';

interface ProfileSummaryCardProps {
  initial: string;
  companyName: string;
  currentRank: Rank;
  careerXp: number;
  score: number;
}

export default function ProfileSummaryCard({ initial, companyName, currentRank, careerXp, score }: ProfileSummaryCardProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.glowPrimary} />
      <View pointerEvents="none" style={styles.glowSecondary} />

      <View style={styles.avatarStage} accessibilityLabel={`${companyName} profil avatarı`}>
        <View style={styles.avatarFrame}>
          <View style={styles.avatarSlot}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        </View>
        <View style={styles.frameAnchor} pointerEvents="none" />
      </View>

      <View style={styles.profileCopy}>
        <Text style={styles.eyebrow}>ŞİRKET PROFİLİ</Text>
        <Text style={styles.companyName}>{companyName}</Text>
        <View style={styles.rankPill}>
          <Text style={styles.rankText}>{currentRank.name}</Text>
        </View>
      </View>

      <View style={styles.progressMetrics}>
        <View style={styles.careerBlock}>
          <Text style={styles.reputationLabel}>KARİYER XP</Text>
          <Text style={styles.careerValue}>{careerXp.toLocaleString('tr-TR')}</Text>
          <Text style={styles.reputationUnit}>kalıcı ilerleme</Text>
        </View>
        <View style={styles.reputationBlock}>
          <Text style={styles.reputationLabel}>İTİBAR</Text>
          <Text style={styles.reputationValue}>{score.toLocaleString('tr-TR')}</Text>
          <Text style={styles.reputationUnit}>performans puanı</Text>
        </View>
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: {
      position: 'relative',
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 18,
      padding: 22,
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      ...shadow.raised,
    },
    glowPrimary: { position: 'absolute', width: 240, height: 240, top: -145, right: -70, borderRadius: 120, backgroundColor: colors.primarySoft, opacity: 0.8 },
    glowSecondary: { position: 'absolute', width: 150, height: 150, bottom: -105, left: 20, borderRadius: 75, backgroundColor: colors.secondarySoft, opacity: 0.55 },
    avatarStage: { position: 'relative', width: 112, height: 112, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    avatarFrame: { width: 108, height: 108, alignItems: 'center', justifyContent: 'center', borderRadius: 38, backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: colors.primary, ...shadow.raised },
    avatarSlot: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 31, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderStrong },
    avatarInitial: { fontFamily: fonts.headingBold, fontSize: 39, lineHeight: 47, color: colors.secondary },
    frameAnchor: { position: 'absolute', right: 0, bottom: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.warning, borderWidth: 3, borderColor: colors.surface },
    profileCopy: { flex: 1, minWidth: 210 },
    eyebrow: { ...dashboardType.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.secondary, marginBottom: 5 },
    companyName: { ...dashboardType.display, fontFamily: fonts.headingBold, color: colors.text, marginBottom: 9 },
    rankPill: { alignSelf: 'flex-start', minHeight: 34, justifyContent: 'center', paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
    rankText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.primary, textTransform: 'uppercase' },
    progressMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    careerBlock: { minWidth: 150, paddingHorizontal: 17, paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
    reputationBlock: { minWidth: 150, paddingHorizontal: 17, paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warning },
    reputationLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.65, color: colors.textMuted },
    reputationValue: { fontFamily: fonts.monoBold, fontSize: 27, lineHeight: 33, color: colors.warning, marginTop: 2 },
    careerValue: { fontFamily: fonts.monoBold, fontSize: 27, lineHeight: 33, color: colors.primary, marginTop: 2 },
    reputationUnit: { fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 15, color: colors.textMuted },
  });
}
