import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { JOKER_ICON_ASSETS } from '../../config/iconAssets';
import { JOKER_DISPLAY } from '../../config/jokers';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import AssetIcon from '../AssetIcon';
import { getDashboardTokens } from './dashboardTokens';

interface ResourceDockProps {
  codeReview: number;
  gitRevert: number;
  serverScaleUp: number;
  snapshotBackup: number;
}

const TOOL_COPY = [
  { key: 'codeReview', iconSource: JOKER_ICON_ASSETS.codeReview, fallbackIcon: 'scan-outline', ...JOKER_DISPLAY.codeReview },
  { key: 'gitRevert', iconSource: JOKER_ICON_ASSETS.gitRevert, fallbackIcon: 'arrow-undo-outline', ...JOKER_DISPLAY.gitRevert },
  { key: 'serverScaleUp', iconSource: JOKER_ICON_ASSETS.serverScaleUp, fallbackIcon: 'flash-outline', ...JOKER_DISPLAY.serverScaleUp },
  { key: 'snapshotBackup', iconSource: JOKER_ICON_ASSETS.snapshotBackup, fallbackIcon: 'camera-outline', ...JOKER_DISPLAY.snapshotBackup },
] as const;

export default function ResourceDock({
  codeReview,
  gitRevert,
  serverScaleUp,
  snapshotBackup,
}: ResourceDockProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const counts = { codeReview, gitRevert, serverScaleUp, snapshotBackup };

  return (
    <View style={styles.card}>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.consoleRail}
      >
        <View style={styles.consoleNode} />
        <View style={styles.consoleLine} />
        <View style={styles.consoleNode} />
      </View>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>MÜDAHALE ARAÇLARI</Text>
          <Text style={styles.title}>Teknik Destek Paketi</Text>
          <Text style={styles.availability}>Mağazadan alınabilir</Text>
        </View>
        <View style={styles.readyBadge}>
          <View style={styles.readyDot} />
          <Text style={styles.readyText}>HAZIR</Text>
        </View>
      </View>

      <View style={styles.tools}>
        {TOOL_COPY.map((tool, index) => (
          <View key={tool.key} style={[styles.toolRow, index > 0 && styles.toolRowSeparated]}>
            <View style={[styles.toolMark, index % 2 === 1 && styles.toolMarkAlt]}>
              <AssetIcon
                source={tool.iconSource}
                fallbackName={tool.fallbackIcon}
                fallbackColor={index % 2 === 1 ? tokens.colors.secondary : tokens.colors.primary}
                size={30}
              />
            </View>
            <View style={styles.toolCopy}>
              <Text style={styles.toolTitle}>{tool.name}</Text>
              <Text style={styles.toolDetail}>{tool.description}</Text>
            </View>
            <View style={styles.countBadge} accessibilityLabel={`${tool.name}, ${counts[tool.key]} adet`}>
              <Text style={styles.countPrefix}>×</Text>
              <Text style={styles.countValue}>{counts[tool.key]}</Text>
            </View>
          </View>
        ))}
      </View>

    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: {
      overflow: 'hidden',
      padding: tokens.layout.isCompact ? 14 : 18,
      paddingTop: tokens.layout.isCompact ? 24 : 28,
      borderRadius: radius.md,
      backgroundColor: colors.secondarySurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...shadow.card,
      shadowColor: colors.shadowNeutral,
      shadowOpacity: tokens.effects.decorativeOpacity === 0 ? 0.06 : 0.2,
    },
    consoleRail: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      backgroundColor: colors.floatingSurfaceRaised,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerSubtle,
      opacity: tokens.effects.decorativeOpacity,
    },
    consoleNode: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.secondary },
    consoleLine: { flex: 1, height: 1, backgroundColor: colors.dividerSubtle },
    headingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    headingCopy: { flex: 1 },
    eyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.primary, marginBottom: 3 },
    title: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text },
    availability: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.textMuted, marginTop: 2 },
    readyBadge: {
      minHeight: 30,
      paddingHorizontal: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    readyDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.secondary },
    readyText: { fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 0.5, color: colors.secondary },
    tools: { marginTop: tokens.layout.isCompact ? 10 : 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.dividerSubtle },
    toolRow: {
      minHeight: tokens.layout.isCompact ? 54 : 60,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      paddingVertical: 7,
      paddingHorizontal: 4,
    },
    toolRowSeparated: { borderTopWidth: 1, borderTopColor: colors.dividerSubtle },
    toolMark: {
      width: 38,
      height: 38,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderLeftWidth: 2,
      borderLeftColor: colors.primary,
    },
    toolMarkAlt: { backgroundColor: colors.secondarySoft, borderLeftColor: colors.secondary },
    toolCopy: { flex: 1, minWidth: 0 },
    toolTitle: { fontFamily: fonts.headingSemiBold, fontSize: 15, lineHeight: 20, color: colors.text },
    toolDetail: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    countBadge: {
      minWidth: 38,
      minHeight: 32,
      paddingHorizontal: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderLeftWidth: 1,
      borderLeftColor: colors.dividerSubtle,
    },
    countPrefix: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.textMuted },
    countValue: { fontFamily: fonts.monoBold, fontSize: 16, color: colors.text },
  });
}
