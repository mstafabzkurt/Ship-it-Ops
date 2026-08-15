import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { dashboardType, getDashboardTokens } from './dashboardTokens';

interface ResourceDockProps {
  codeReview: number;
  gitRevert: number;
  serverScaleUp: number;
  snapshotBackup: number;
  onOpenGame: () => void;
}

const TOOL_COPY = [
  { key: 'codeReview', initials: 'CR', title: 'Code Review', detail: 'İki zayıf seçeneği eler' },
  { key: 'gitRevert', initials: 'GR', title: 'Git Revert', detail: 'Son kararı geri alır' },
  { key: 'serverScaleUp', initials: 'SU', title: 'Scale Up', detail: 'Müdahale süresini uzatır' },
  { key: 'snapshotBackup', initials: 'SB', title: 'Snapshot', detail: 'Kriz durumunu korur' },
] as const;

export default function ResourceDock({
  codeReview,
  gitRevert,
  serverScaleUp,
  snapshotBackup,
  onOpenGame,
}: ResourceDockProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [buttonFocused, setButtonFocused] = useState(false);
  const counts = { codeReview, gitRevert, serverScaleUp, snapshotBackup };

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>MÜDAHALE ARAÇLARI</Text>
          <Text style={styles.title}>Lifeline envanteri</Text>
        </View>
        <View style={styles.readyBadge}>
          <View style={styles.readyDot} />
          <Text style={styles.readyText}>HAZIR</Text>
        </View>
      </View>

      <View style={styles.tools}>
        {TOOL_COPY.map((tool, index) => (
          <View key={tool.key} style={styles.toolRow}>
            <View style={[styles.toolMark, index % 2 === 1 && styles.toolMarkAlt]}>
              <Text style={[styles.toolInitials, index % 2 === 1 && styles.toolInitialsAlt]}>{tool.initials}</Text>
            </View>
            <View style={styles.toolCopy}>
              <Text style={styles.toolTitle}>{tool.title}</Text>
              <Text style={styles.toolDetail}>{tool.detail}</Text>
            </View>
            <View style={styles.countBadge} accessibilityLabel={`${tool.title}, ${counts[tool.key]} adet`}>
              <Text style={styles.countPrefix}>×</Text>
              <Text style={styles.countValue}>{counts[tool.key]}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Lifeline araçlarını kullanmak için kriz ekranına git"
        onPress={onOpenGame}
        onFocus={() => setButtonFocused(true)}
        onBlur={() => setButtonFocused(false)}
        style={({ pressed }) => [styles.openButton, buttonFocused && styles.openButtonFocused, pressed && tokens.motion.pressed]}
      >
        <Text style={styles.openButtonText}>Kriz Ekranını Aç</Text>
        <Text style={styles.openButtonArrow} accessibilityElementsHidden>→</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: {
      padding: 18,
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.card,
    },
    headingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    headingCopy: { flex: 1 },
    eyebrow: { ...dashboardType.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.primary, marginBottom: 4 },
    title: { ...dashboardType.title, fontFamily: fonts.headingBold, color: colors.text },
    readyBadge: {
      minHeight: 30,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.secondarySoft,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    readyDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.secondary },
    readyText: { fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 0.5, color: colors.secondary },
    tools: { gap: 9, marginTop: 18 },
    toolRow: {
      minHeight: 66,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      padding: 9,
      paddingRight: 12,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toolMark: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    toolMarkAlt: { backgroundColor: colors.secondarySoft },
    toolInitials: { fontFamily: fonts.monoBold, fontSize: 13, color: colors.primary },
    toolInitialsAlt: { color: colors.secondary },
    toolCopy: { flex: 1, minWidth: 0 },
    toolTitle: { fontFamily: fonts.headingSemiBold, fontSize: 15, lineHeight: 20, color: colors.text },
    toolDetail: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    countBadge: {
      minWidth: 42,
      minHeight: 34,
      paddingHorizontal: 9,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.canvas,
      borderWidth: 1,
      borderColor: colors.border,
    },
    countPrefix: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.textMuted },
    countValue: { fontFamily: fonts.monoBold, fontSize: 16, color: colors.text },
    openButton: {
      minHeight: tokens.control.heightLarge,
      marginTop: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.surfaceHighlightStrong,
    },
    openButtonFocused: { borderColor: colors.text },
    openButtonText: { fontFamily: fonts.headingSemiBold, fontSize: 15, color: colors.onAccent },
    openButtonArrow: { fontFamily: fonts.headingBold, fontSize: 20, color: colors.onAccent },
  });
}
