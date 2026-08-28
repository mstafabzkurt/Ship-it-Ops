import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

export default function StoreComingSoon() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  return (
    <View style={styles.card}>
      <View style={styles.iconStage}>
        <View style={styles.avatarFrame}>
          <Ionicons name="person-outline" size={32} color={tokens.colors.primary} />
        </View>
        <View style={styles.sparkle}><Ionicons name="sparkles-outline" size={16} color={tokens.colors.warning} /></View>
      </View>
      <Text style={styles.eyebrow}>KOZMETİK</Text>
      <Text style={styles.title}>Yakında</Text>
      <Text style={styles.description}>
        Avatarlar, avatar çerçeveleri ve profil kozmetikleri için özelleştirme alanı hazırlanıyor.
      </Text>
      <View style={styles.notice}>
        <Text style={styles.noticeText}>Henüz satın alınabilir kozmetik bulunmuyor.</Text>
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: { position: 'relative', minHeight: tokens.layout.isCompact ? 240 : 300, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: tokens.layout.isCompact ? 18 : 28, borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle, ...shadow.card, shadowColor: colors.shadowNeutral, shadowOpacity: 0.12 },
    iconStage: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center', marginBottom: tokens.layout.isCompact ? 10 : 14 },
    avatarFrame: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
    sparkle: { position: 'absolute', top: 0, right: 0, width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.secondarySurfaceRaised, borderWidth: 1, borderColor: colors.warning },
    eyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.primary, marginBottom: 4 },
    title: { ...tokens.type.display, fontFamily: fonts.headingBold, color: colors.text, marginBottom: 6 },
    description: { ...tokens.type.body, maxWidth: 560, fontFamily: fonts.body, color: colors.textMuted, textAlign: 'center' },
    notice: { minHeight: 42, justifyContent: 'center', marginTop: tokens.layout.isCompact ? 14 : 20, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: colors.dividerSubtle },
    noticeText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.textMuted, textAlign: 'center' },
  });
}
