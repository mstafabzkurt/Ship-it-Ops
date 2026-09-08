import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
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
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
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
        hovered && !disabled && !busy && (secondary ? styles.buttonSecondaryHovered : styles.buttonHovered),
        focused && styles.buttonFocused,
        pressed && !disabled && !busy && (secondary ? styles.buttonSecondaryPressed : styles.buttonPressed),
        pressed && !disabled && !busy && tokens.motion.pressed,
        (disabled || busy) && styles.buttonDisabled,
        style,
      ]}
    >
      <Text style={[styles.label, secondary && styles.labelSecondary, (disabled || busy) && styles.labelDisabled]}>{label}</Text>
      {busy ? (
        <ActivityIndicator
          size="small"
          color={secondary
            ? tokens.colors.text
            : tokens.effects.decorativeOpacity === 0
              ? tokens.colors.disabledForeground
              : tokens.colors.foregroundOnAction}
        />
      ) : (
        <Text style={[styles.arrow, secondary && styles.labelSecondary, disabled && styles.labelDisabled]} accessibilityElementsHidden>→</Text>
      )}
    </Pressable>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;
  const isCalmLightTheme = tokens.effects.decorativeOpacity === 0;
  return StyleSheet.create({
    button: {
      minHeight: tokens.control.heightLarge,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      borderRadius: radius.md,
      backgroundColor: colors.action,
      opacity: 0.92,
      borderWidth: 1,
      borderColor: isCalmLightTheme ? colors.actionFocus : colors.surfaceHighlightStrong,
      shadowColor: colors.action,
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.12,
      shadowRadius: 9,
      elevation: 3,
    },
    buttonSecondary: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.borderStrong,
      opacity: 1,
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonHovered: { backgroundColor: colors.actionHover, borderColor: isCalmLightTheme ? colors.actionFocus : colors.selectionBorder },
    buttonSecondaryHovered: { backgroundColor: colors.surfaceHover, borderColor: colors.borderStrong },
    buttonFocused: { borderColor: colors.actionFocus, borderWidth: 2 },
    buttonPressed: { backgroundColor: colors.actionPressed },
    buttonSecondaryPressed: { backgroundColor: colors.surfacePressed },
    buttonDisabled: isCalmLightTheme
      ? { opacity: 1, backgroundColor: colors.disabledBackground, borderColor: colors.disabledBorder, shadowOpacity: 0, elevation: 0 }
      : { opacity: 0.58, shadowOpacity: 0, elevation: 0 },
    label: { fontFamily: fonts.headingBold, fontSize: 16, lineHeight: 20, color: colors.foregroundOnAction },
    labelSecondary: { color: colors.text },
    labelDisabled: { color: isCalmLightTheme ? colors.disabledForeground : colors.foregroundOnAction },
    arrow: { fontFamily: fonts.headingBold, fontSize: 20, lineHeight: 22, color: colors.foregroundOnAction },
  });
}
