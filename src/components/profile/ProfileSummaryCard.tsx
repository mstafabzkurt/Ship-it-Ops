import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { AvatarCosmetic, AvatarFrameCosmetic } from '../../config/cosmetics';
import type { Rank } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import CosmeticPreview from '../cosmetics/CosmeticPreview';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface ProfileSummaryCardProps {
  companyName: string;
  currentRank: Rank;
  careerXp: number;
  score: number;
  equippedAvatar: AvatarCosmetic;
  equippedAvatarFrame: AvatarFrameCosmetic;
}

export default function ProfileSummaryCard({
  companyName,
  currentRank,
  careerXp,
  score,
  equippedAvatar,
  equippedAvatarFrame,
}: ProfileSummaryCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.identityRail} />

      <View style={styles.avatarStage}>
        <CosmeticPreview
          avatar={equippedAvatar}
          frame={equippedAvatarFrame}
          variant="profile"
          accessibilityLabel={`${companyName} profili: ${equippedAvatar.name}, ${equippedAvatarFrame.name}`}
        />
      </View>

      <View style={styles.profileCopy}>
        <Text style={styles.eyebrow}>ŞİRKET PROFİLİ</Text>
        <Text style={styles.companyName}>{companyName}</Text>
        <View style={styles.rankLine}>
          <View style={styles.rankDot} />
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
      gap: tokens.layout.isCompact ? 12 : 18,
      padding: tokens.layout.isCompact ? 14 : 20,
      paddingLeft: tokens.layout.isCompact ? 17 : 23,
      borderRadius: radius.md,
      backgroundColor: colors.secondarySurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...shadow.card,
      shadowColor: colors.shadowNeutral,
      shadowOpacity: 0.16,
    },
    identityRail: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, backgroundColor: colors.primary },
    avatarStage: { position: 'relative', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    profileCopy: { flex: 1, minWidth: tokens.layout.isCompact ? 160 : 210 },
    eyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.secondary, marginBottom: 4 },
    companyName: { ...tokens.type.display, fontFamily: fonts.headingBold, color: colors.text, marginBottom: tokens.layout.isCompact ? 6 : 9 },
    rankLine: { alignSelf: 'flex-start', minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 7 },
    rankDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
    rankText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.primary, textTransform: 'uppercase' },
    progressMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 14 : 20 },
    careerBlock: { flexGrow: 1, minWidth: tokens.layout.isCompact ? 118 : 140, paddingLeft: tokens.layout.isCompact ? 11 : 15, borderLeftWidth: 1, borderLeftColor: colors.primary },
    reputationBlock: { flexGrow: 1, minWidth: tokens.layout.isCompact ? 118 : 140, paddingLeft: tokens.layout.isCompact ? 11 : 15, borderLeftWidth: 1, borderLeftColor: colors.warning },
    reputationLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.65, color: colors.textMuted },
    reputationValue: { fontFamily: fonts.monoBold, fontSize: tokens.layout.isCompact ? 22 : 27, lineHeight: tokens.layout.isCompact ? 27 : 33, color: colors.warning, marginTop: 1 },
    careerValue: { fontFamily: fonts.monoBold, fontSize: tokens.layout.isCompact ? 22 : 27, lineHeight: tokens.layout.isCompact ? 27 : 33, color: colors.primary, marginTop: 1 },
    reputationUnit: { fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 15, color: colors.textMuted },
  });
}
