import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface GameActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  busy?: boolean;
}

export default function GameActionButton({
  label,
  onPress,
  variant = 'primary',
  style,
  disabled = false,
  busy = false,
}: GameActionButtonProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const secondary = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        hovered && !disabled && !busy && styles.buttonHovered,
        focused && styles.buttonFocused,
        pressed && !disabled && !busy && tokens.motion.pressed,
        (disabled || busy) && styles.buttonDisabled,
        style,
      ]}
    >
      <Text style={[styles.label, secondary && styles.labelSecondary]}>{label}</Text>
      {busy ? (
        <ActivityIndicator size="small" color={secondary ? tokens.colors.text : tokens.colors.onAccent} />
      ) : (
        <Text style={[styles.arrow, secondary && styles.labelSecondary]} accessibilityElementsHidden>→</Text>
      )}
    </Pressable>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    button: {
      minHeight: tokens.control.heightLarge,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      borderRadius: radius.md,
      backgroundColor: colors.warning,
      borderWidth: 1,
      borderColor: colors.surfaceHighlightStrong,
      shadowColor: colors.warning,
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 5,
    },
    buttonSecondary: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.borderStrong,
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonHovered: { borderColor: colors.text },
    buttonFocused: { borderColor: colors.text },
    buttonDisabled: { opacity: 0.58, shadowOpacity: 0, elevation: 0 },
    label: { fontFamily: fonts.headingBold, fontSize: 16, lineHeight: 20, color: colors.onAccent },
    labelSecondary: { color: colors.text },
    arrow: { fontFamily: fonts.headingBold, fontSize: 20, lineHeight: 22, color: colors.onAccent },
  });
}
