import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { getCosmeticById, type AvatarCosmetic, type AvatarFrameCosmetic } from '../../config/cosmetics';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import type { PublicProfile } from '../../utils/publicProfile';
import CosmeticPreview from '../cosmetics/CosmeticPreview';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface SocialProfileRowProps {
  profile: PublicProfile | null;
  onOpen?: () => void;
  actions?: React.ReactNode;
}

export default function SocialProfileRow({ profile, onOpen, actions }: SocialProfileRowProps) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const avatar = profile ? getCosmeticById(profile.avatarId) as AvatarCosmetic : null;
  const frame = profile ? getCosmeticById(profile.avatarFrameId) as AvatarFrameCosmetic : null;
  const canOpen = Boolean(profile && onOpen);

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole={canOpen ? 'button' : undefined}
        accessibilityLabel={profile
          ? `${profile.companyName}, ${profile.careerRank}. Herkese açık profili aç.`
          : 'Şirket profili kullanılamıyor'}
        accessibilityState={{ disabled: !canOpen }}
        disabled={!canOpen}
        onPress={onOpen}
        style={({ pressed }) => [styles.profileArea, pressed && styles.pressed]}
      >
        {profile && avatar && frame ? (
          <CosmeticPreview
            avatar={avatar}
            frame={frame}
            mode="equippedCombo"
            size={58}
            accessibilityLabel={`${profile.companyName} avatarı`}
          />
        ) : (
          <View style={styles.fallbackAvatar}>
            <Ionicons name="person-outline" size={24} color={tokens.colors.textMuted} />
          </View>
        )}
        <View style={styles.copy}>
          <Text numberOfLines={2} style={styles.companyName}>
            {profile?.companyName ?? 'Şirket profili kullanılamıyor'}
          </Text>
          <Text numberOfLines={1} style={styles.rank}>
            {profile?.careerRank ?? 'Profil bilgisi bulunamadı'}
          </Text>
          {profile ? (
            <Text style={styles.xp}>{profile.careerXp.toLocaleString('tr-TR')} Kariyer XP</Text>
          ) : null}
        </View>
        {canOpen ? (
          <Ionicons
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            name="chevron-forward"
            size={20}
            color={tokens.colors.textMuted}
          />
        ) : null}
      </Pressable>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    card: {
      overflow: 'hidden',
      borderRadius: radius.md,
      backgroundColor: colors.secondarySurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    profileArea: {
      minHeight: 82,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      padding: 11,
    },
    pressed: { opacity: 0.78, backgroundColor: colors.surfacePressed },
    fallbackAvatar: {
      width: 58,
      height: 58,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    copy: { flex: 1, minWidth: 0 },
    companyName: { color: colors.text, fontFamily: fonts.headingBold, fontSize: 16, lineHeight: 21 },
    rank: { marginTop: 2, color: colors.primary, fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17 },
    xp: { marginTop: 2, color: colors.textMuted, fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 16 },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      padding: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.dividerSubtle,
      backgroundColor: colors.secondarySurfaceRaised,
    },
  });
}
