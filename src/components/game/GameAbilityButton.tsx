import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface GameAbilityButtonProps {
  name: string;
  icon: string;
  count: number;
  enabled: boolean;
  onPress: () => void;
}

export default function GameAbilityButton({ name, icon, count, enabled, onPress }: GameAbilityButtonProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${count} adet kaldı`}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.ability,
        !enabled && styles.abilityDisabled,
        hovered && enabled && styles.abilityHovered,
        focused && styles.abilityFocused,
        pressed && enabled && styles.abilityPressed,
      ]}
    >
      <View style={styles.iconSlot}>
        <Text style={styles.icon} accessibilityElementsHidden>{icon}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.count}>×{count}</Text>
        </View>
      </View>
      <Text style={styles.name}>{name}</Text>
    </Pressable>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    ability: {
      width: '100%',
      minHeight: 124,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 12,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceRaised,
      shadowColor: colors.canvas,
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.28,
      shadowRadius: 11,
      elevation: 5,
    },
    abilityDisabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
    abilityHovered: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
      transform: [{ translateY: -2 }],
    },
    abilityFocused: { borderColor: colors.text, borderWidth: 2 },
    abilityPressed: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
      transform: [{ translateY: 2 }, { scale: 0.985 }],
      shadowOpacity: 0.12,
      elevation: 2,
    },
    iconSlot: {
      width: 70,
      height: 70,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 35,
      backgroundColor: colors.primarySoft,
      borderWidth: 2,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
      elevation: 6,
    },
    icon: { fontSize: 31, lineHeight: 38 },
    countBadge: {
      position: 'absolute',
      top: -5,
      right: -7,
      minWidth: 31,
      height: 28,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      backgroundColor: colors.danger,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    count: { fontFamily: fonts.monoBold, fontSize: 12, lineHeight: 16, color: colors.onAccent },
    name: {
      width: '100%',
      fontFamily: fonts.bodySemiBold,
      fontSize: 14,
      lineHeight: 18,
      color: colors.text,
      textAlign: 'center',
    },
  });
}
