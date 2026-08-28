import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from './dashboardTokens';

interface CompanyGrowthCTAProps {
  onPress: () => void;
}

export default function CompanyGrowthCTA({ onPress }: CompanyGrowthCTAProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Şirketi Büyüt. Yeni krizlere müdahale et, kariyer XP ve kaynak kazan."
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.button,
        focused && styles.buttonFocused,
        pressed && tokens.motion.pressed,
      ]}
    >
      <View pointerEvents="none" style={styles.actionRail} />
      <View style={styles.iconSlot} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="rocket" size={tokens.layout.isCompact ? 22 : 25} style={styles.icon} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Şirketi Büyüt</Text>
        <Text style={styles.description}>Yeni krizlere müdahale et, kariyer XP ve kaynak kazan.</Text>
      </View>
      <View style={styles.arrowSlot} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="arrow-forward" size={19} style={styles.arrow} />
      </View>
    </Pressable>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    button: {
      minHeight: tokens.layout.isCompact ? 76 : 88,
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.layout.isCompact ? 10 : 14,
      paddingHorizontal: tokens.layout.isCompact ? 12 : 16,
      paddingVertical: tokens.layout.isCompact ? 10 : 13,
      overflow: 'hidden',
      borderRadius: radius.md,
      backgroundColor: colors.secondarySurfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      shadowColor: colors.shadowNeutral,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 14,
      elevation: 7,
      ...shadow.card,
    },
    actionRail: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, backgroundColor: colors.primary },
    buttonFocused: { borderColor: colors.text, borderWidth: 2 },
    iconSlot: {
      width: tokens.layout.isCompact ? 44 : 50,
      height: tokens.layout.isCompact ? 44 : 50,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderLeftWidth: 2,
      borderLeftColor: colors.primary,
    },
    icon: { color: colors.primary },
    copy: { flex: 1, minWidth: 0 },
    title: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text },
    description: {
      fontFamily: fonts.bodyMedium,
      fontSize: tokens.layout.isCompact ? 12 : 14,
      lineHeight: tokens.layout.isCompact ? 17 : 20,
      color: colors.textMuted,
      marginTop: 2,
    },
    arrowSlot: {
      width: 34,
      height: 34,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
    },
    arrow: { color: colors.onAccent },
  });
}
