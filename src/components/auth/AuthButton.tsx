import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
}

export default function AuthButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  accessibilityHint,
}: AuthButtonProps) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.primary : styles.secondary,
        hovered && !isDisabled && styles.hovered,
        focused && styles.focused,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            accessibilityElementsHidden
            color={variant === 'primary' ? tokens.colors.onAccent : tokens.colors.secondary}
            size="small"
          />
        ) : icon}
        <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel]}>
          {loading ? 'İşlem sürüyor…' : label}
        </Text>
      </View>
    </Pressable>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  return StyleSheet.create({
    button: {
      minHeight: 52,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
      borderRadius: tokens.radius.md,
      borderWidth: 2,
    },
    primary: { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary },
    secondary: { backgroundColor: tokens.colors.secondarySurfaceRaised, borderColor: tokens.colors.borderStrong },
    focused: { borderColor: tokens.colors.text },
    hovered: { borderColor: tokens.colors.secondary },
    pressed: tokens.motion.pressed,
    disabled: { opacity: 0.5 },
    content: { minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    label: { flexShrink: 1, fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 20, textAlign: 'center' },
    primaryLabel: { color: tokens.colors.onAccent },
    secondaryLabel: { color: tokens.colors.text },
  });
}
