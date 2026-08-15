import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { dashboardType, getDashboardTokens } from '../dashboard/dashboardTokens';

export default function StoreComingSoon() {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.orbOne} />
      <View pointerEvents="none" style={styles.orbTwo} />
      <View style={styles.iconStage}>
        <View style={styles.avatarFrame}>
          <Text style={styles.avatarIcon}>👤</Text>
        </View>
        <View style={styles.sparkle}><Text style={styles.sparkleText}>✨</Text></View>
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
    card: { position: 'relative', minHeight: 430, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: 28, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadow.raised },
    orbOne: { position: 'absolute', width: 230, height: 230, top: -130, right: -80, borderRadius: 115, backgroundColor: colors.primarySoft, opacity: 0.72 },
    orbTwo: { position: 'absolute', width: 180, height: 180, bottom: -115, left: -65, borderRadius: 90, backgroundColor: colors.secondarySoft, opacity: 0.56 },
    iconStage: { width: 126, height: 126, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    avatarFrame: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center', borderRadius: 38, backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: colors.primary, ...shadow.raised },
    avatarIcon: { fontSize: 48, lineHeight: 58, opacity: 0.84 },
    sparkle: { position: 'absolute', top: 2, right: 2, width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warning },
    sparkleText: { fontSize: 20, lineHeight: 26 },
    eyebrow: { ...dashboardType.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.primary, marginBottom: 5 },
    title: { ...dashboardType.display, fontFamily: fonts.headingBold, color: colors.text, marginBottom: 8 },
    description: { ...dashboardType.body, maxWidth: 560, fontFamily: fonts.body, color: colors.textMuted, textAlign: 'center' },
    notice: { minHeight: 42, justifyContent: 'center', marginTop: 20, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderStrong },
    noticeText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.textMuted, textAlign: 'center' },
  });
}
