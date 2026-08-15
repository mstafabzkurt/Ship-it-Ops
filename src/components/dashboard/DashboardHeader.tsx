import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getCompanyInitial, type Rank } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { dashboardType, getDashboardTokens } from './dashboardTokens';

interface DashboardHeaderProps {
  companyName: string;
  currentRank: Rank;
  level: number;
}

export default function DashboardHeader({ companyName, currentRank, level }: DashboardHeaderProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  return (
    <View style={styles.header}>
      <View style={styles.identity}>
        <View style={styles.mark} accessibilityElementsHidden>
          <View style={styles.markHighlight} />
          <Text style={styles.markText}>{getCompanyInitial(companyName)}</Text>
        </View>
        <View style={styles.identityCopy}>
          <Text style={styles.eyebrow}>SHIP IT OPS</Text>
          <Text style={styles.companyName} numberOfLines={1}>{companyName}</Text>
        </View>
      </View>

      <View style={styles.statusCluster}>
        <View style={styles.levelChip}>
          <Text style={styles.levelLabel}>SEVİYE</Text>
          <Text style={styles.levelValue}>{level}</Text>
        </View>
        <View style={styles.crisisChip} accessibilityLabel="Kriz modu aktif">
          <View style={styles.crisisDot} />
          <View>
            <Text style={styles.crisisLabel}>KRİZ MODU</Text>
            <Text style={styles.rankName} numberOfLines={1}>{currentRank.name}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
    },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
    identityCopy: { flexShrink: 1 },
    mark: {
      width: 52,
      height: 52,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.surfaceHighlightStrong,
      overflow: 'hidden',
      ...shadow.card,
    },
    markHighlight: {
      position: 'absolute',
      top: 5,
      left: 7,
      right: 7,
      height: 12,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceHighlight,
    },
    markText: { fontFamily: fonts.headingBold, fontSize: 24, color: colors.onAccent },
    eyebrow: {
      ...dashboardType.eyebrow,
      fontFamily: fonts.monoSemiBold,
      color: colors.secondary,
      marginBottom: 2,
    },
    companyName: {
      fontFamily: fonts.headingBold,
      fontSize: 22,
      lineHeight: 28,
      color: colors.text,
      maxWidth: 260,
    },
    statusCluster: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
    levelChip: {
      minWidth: 66,
      minHeight: tokens.control.heightLarge,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    levelLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 0.55, color: colors.textMuted },
    levelValue: { fontFamily: fonts.monoBold, fontSize: 18, lineHeight: 22, color: colors.primary },
    crisisChip: {
      minHeight: tokens.control.heightLarge,
      maxWidth: 180,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: radius.md,
      backgroundColor: colors.dangerSoft,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    crisisDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.danger },
    crisisLabel: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 0.45, color: colors.danger },
    rankName: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16, color: colors.text },
  });
}
