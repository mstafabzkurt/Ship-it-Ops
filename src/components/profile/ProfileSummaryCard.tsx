import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { AvatarCosmetic, AvatarFrameCosmetic } from '../../config/cosmetics';
import type { Rank } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import CosmeticPreview from '../cosmetics/CosmeticPreview';
import { getDashboardTokens } from '../dashboard/dashboardTokens';
import RankIcon from '../rank/RankIcon';

interface ProfileSummaryCardProps {
  companyName: string;
  currentRank: Rank;
  equippedAvatar: AvatarCosmetic;
  equippedAvatarFrame: AvatarFrameCosmetic;
}

export default function ProfileSummaryCard({
  companyName,
  currentRank,
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
          mode="equippedCombo"
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
          <View style={styles.rankIconTile}>
            <RankIcon rank={currentRank} size={tokens.layout.isCompact ? 36 : 42} fallbackColor={tokens.colors.primary} />
          </View>
          <Text style={styles.rankText}>{currentRank.name}</Text>
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
    rankLine: { flexWrap: 'wrap', alignSelf: 'flex-start', minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8 },
    rankIconTile: { width: tokens.layout.isCompact ? 42 : 48, height: tokens.layout.isCompact ? 42 : 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySurfaceRaised, borderWidth: 1, borderColor: colors.borderSubtle },
    rankText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.primary, textTransform: 'uppercase' },
  });
}
