import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { getCompanyInitial } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from './dashboardTokens';

interface DashboardHeaderProps {
  companyName: string;
  level: number;
}

export default function DashboardHeader({ companyName, level }: DashboardHeaderProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
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

      <View style={styles.levelChip}>
        <Text style={styles.levelLabel}>SEVİYE</Text>
        <Text style={styles.levelValue}>{level}</Text>
      </View>

      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.headerRail}
      >
        <View style={styles.railNode} />
        <View style={styles.railLine} />
        <View style={styles.railNode} />
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    header: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: tokens.layout.isCompact ? 10 : 16,
      flexWrap: 'wrap',
      paddingBottom: tokens.layout.isCompact ? 11 : 14,
    },
    identity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: tokens.layout.isCompact ? 9 : 12 },
    identityCopy: { flexShrink: 1 },
    mark: {
      width: tokens.layout.isCompact ? 46 : 52,
      height: tokens.layout.isCompact ? 46 : 52,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondarySurfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      overflow: 'hidden',
      ...shadow.card,
      shadowColor: colors.shadowNeutral,
      shadowOpacity: 0.18,
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
    markText: { fontFamily: fonts.headingBold, fontSize: 24, color: colors.text },
    eyebrow: {
      ...tokens.type.eyebrow,
      fontFamily: fonts.monoSemiBold,
      color: colors.secondary,
      marginBottom: 2,
    },
    companyName: {
      fontFamily: fonts.headingBold,
      fontSize: tokens.layout.isCompact ? 19 : 22,
      lineHeight: tokens.layout.isCompact ? 24 : 28,
      color: colors.text,
      maxWidth: 260,
    },
    levelChip: {
      minWidth: tokens.layout.isCompact ? 60 : 66,
      minHeight: tokens.control.heightLarge,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderLeftWidth: 1,
      borderLeftColor: colors.dividerSubtle,
    },
    levelLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 0.55, color: colors.textMuted },
    levelValue: { fontFamily: fonts.monoBold, fontSize: 18, lineHeight: 22, color: colors.primary },
    headerRail: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    railNode: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.secondary },
    railLine: { flex: 1, height: 1, backgroundColor: colors.dividerSubtle },
  });
}
