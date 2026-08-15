import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

type ButtonVariant = 'primary' | 'warning' | 'danger' | 'disabled';

interface ProfileButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function ProfileButton({ label, onPress, variant = 'primary', disabled = false, style }: ProfileButtonProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isDisabled = disabled || variant === 'disabled';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.button,
        styles[`${variant}Button`],
        hovered && !isDisabled && styles.hovered,
        focused && styles.focused,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    button: { minHeight: tokens.control.height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent' },
    primaryButton: { backgroundColor: colors.secondary },
    warningButton: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
    dangerButton: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
    disabledButton: { backgroundColor: colors.surfaceSoft, borderColor: colors.border, opacity: 0.48 },
    hovered: { transform: [{ translateY: -1 }], ...shadow.card },
    focused: { borderColor: colors.text },
    pressed: { transform: [{ scale: 0.98 }] },
    label: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, textAlign: 'center' },
    primaryLabel: { color: colors.onAccent },
    warningLabel: { color: colors.warning },
    dangerLabel: { color: colors.danger },
    disabledLabel: { color: colors.textMuted },
  });
}
