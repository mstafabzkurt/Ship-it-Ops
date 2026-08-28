import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface GameAbilityButtonProps {
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  count: number;
  enabled: boolean;
  onPress: () => void;
}

export default function GameAbilityButton({ name, icon, count, enabled, onPress }: GameAbilityButtonProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const accent = useMemo(() => getAbilityAccent(name, tokens), [name, tokens]);
  const styles = useMemo(() => makeStyles(tokens, accent), [accent, tokens]);
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
        enabled && styles.abilityEnabled,
        !enabled && styles.abilityDisabled,
        hovered && enabled && styles.abilityHovered,
        focused && styles.abilityFocused,
        pressed && enabled && styles.abilityPressed,
      ]}
    >
      <View style={styles.iconSlot}>
        <Ionicons
          name={icon}
          size={tokens.layout.isCompact ? 20 : 22}
          color={accent.solid}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>
      <Text style={styles.name}>{name}</Text>
      <View style={styles.countBadge}>
        <Text style={styles.count}>×{count}</Text>
      </View>
    </Pressable>
  );
}

function getAbilityAccent(name: string, tokens: ReturnType<typeof getDashboardTokens>) {
  if (name === 'Git Revert' || name === 'Snapshot') {
    return { solid: tokens.colors.secondary, soft: tokens.colors.secondarySoft };
  }
  if (name === 'Scale Up') {
    return { solid: tokens.colors.warning, soft: tokens.colors.warningSoft };
  }
  return { solid: tokens.colors.primary, soft: tokens.colors.primarySoft };
}

function makeStyles(
  tokens: ReturnType<typeof getDashboardTokens>,
  accent: ReturnType<typeof getAbilityAccent>,
) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    ability: {
      width: '100%',
      minHeight: tokens.layout.isCompact ? 74 : 80,
      flexDirection: tokens.layout.isCompact ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: tokens.layout.isCompact ? 'center' : 'flex-start',
      gap: tokens.layout.isCompact ? 4 : 10,
      paddingHorizontal: tokens.layout.isCompact ? 4 : 10,
      paddingVertical: 7,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
      backgroundColor: 'transparent',
    },
    abilityEnabled: { borderBottomWidth: 2, borderBottomColor: accent.solid },
    abilityDisabled: { opacity: 0.34 },
    abilityHovered: {
      backgroundColor: accent.soft,
      borderColor: colors.borderSubtle,
    },
    abilityFocused: { borderColor: colors.text },
    abilityPressed: {
      backgroundColor: accent.soft,
      borderColor: colors.borderSubtle,
      transform: [{ scale: 0.98 }],
    },
    iconSlot: {
      width: tokens.layout.isCompact ? 38 : 42,
      height: tokens.layout.isCompact ? 38 : 42,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: accent.soft,
      borderWidth: 1,
      borderLeftWidth: 2,
      borderColor: colors.borderSubtle,
      borderLeftColor: accent.solid,
    },
    countBadge: {
      position: 'absolute',
      top: 5,
      right: 5,
      minWidth: 24,
      height: 20,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
      backgroundColor: colors.floatingSurfaceRaised,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    count: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 13, color: accent.solid },
    name: {
      width: '100%',
      fontFamily: fonts.bodySemiBold,
      fontSize: tokens.layout.isCompact ? 11 : 14,
      lineHeight: tokens.layout.isCompact ? 14 : 18,
      color: colors.text,
      textAlign: tokens.layout.isCompact ? 'center' : 'left',
    },
  });
}
