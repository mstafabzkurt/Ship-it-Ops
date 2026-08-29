import { forwardRef, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  useWindowDimensions,
  View,
} from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface AuthFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  hint?: string;
  isPassword?: boolean;
  isPasswordVisible?: boolean;
  onTogglePasswordVisibility?: () => void;
}

const AuthField = forwardRef<TextInput, AuthFieldProps>(function AuthField({
  label,
  error,
  hint,
  isPassword = false,
  isPasswordVisible = false,
  onTogglePasswordVisibility,
  accessibilityHint,
  style,
  ...inputProps
}, ref) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          ref={ref}
          {...inputProps}
          accessibilityLabel={label}
          accessibilityHint={error || accessibilityHint || hint}
          placeholderTextColor={tokens.colors.textMuted}
          selectionColor={tokens.colors.secondary}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          secureTextEntry={isPassword && !isPasswordVisible}
          style={[
            styles.input,
            isPassword && styles.passwordInput,
            focused && styles.inputFocused,
            !!error && styles.inputError,
            style,
          ]}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
            accessibilityState={{ expanded: isPasswordVisible }}
            hitSlop={4}
            onPress={onTogglePasswordVisibility}
            style={({ pressed }) => [styles.visibilityButton, pressed && styles.visibilityPressed]}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={21}
              color={focused ? tokens.colors.secondary : tokens.colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.messageSlot}>
        {error ? (
          <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.errorText}>
            {error}
          </Text>
        ) : hint ? (
          <Text style={styles.hintText}>{hint}</Text>
        ) : null}
      </View>
    </View>
  );
});

export default AuthField;

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  return StyleSheet.create({
    fieldGroup: { width: '100%', gap: 7 },
    label: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 19, color: tokens.colors.text },
    inputWrap: { position: 'relative', width: '100%' },
    input: {
      width: '100%',
      minHeight: 52,
      paddingHorizontal: 15,
      paddingVertical: 13,
      borderRadius: tokens.radius.md,
      borderWidth: 1,
      borderColor: tokens.colors.borderStrong,
      backgroundColor: tokens.colors.secondarySurfaceRaised,
      color: tokens.colors.text,
      fontFamily: fonts.bodyMedium,
      fontSize: 16,
      lineHeight: 22,
    },
    passwordInput: { paddingRight: 58 },
    inputFocused: { borderWidth: 2, borderColor: tokens.colors.secondary, paddingHorizontal: 14, paddingVertical: 12 },
    inputError: { borderColor: tokens.colors.danger, backgroundColor: tokens.colors.dangerSoft },
    visibilityButton: {
      position: 'absolute',
      right: 2,
      top: 2,
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.radius.sm,
    },
    visibilityPressed: { backgroundColor: tokens.colors.primarySoft, opacity: 0.85 },
    messageSlot: { minHeight: 18 },
    hintText: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: tokens.colors.textMuted },
    errorText: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: tokens.colors.danger },
  });
}
