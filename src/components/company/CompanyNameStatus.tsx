import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { CompanyNameAvailabilityStatus } from '../../services/companyName';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface CompanyNameStatusProps {
  status: CompanyNameAvailabilityStatus;
  message: string;
  onRetry?: () => void;
}

export default function CompanyNameStatus({ status, message, onRetry }: CompanyNameStatusProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  if (!message || status === 'idle') return null;

  const isPositive = status === 'available' || status === 'saved';
  const isChecking = status === 'checking';
  const isError = status === 'invalid' || status === 'unavailable' || status === 'error';

  return (
    <View accessibilityLiveRegion="polite" style={styles.row}>
      {isChecking ? (
        <ActivityIndicator accessibilityLabel="Şirket adı kontrol ediliyor" color={tokens.colors.info} size="small" />
      ) : (
        <Ionicons
          accessibilityElementsHidden
          color={isPositive ? tokens.colors.success : isError ? tokens.colors.danger : tokens.colors.textMuted}
          importantForAccessibility="no-hide-descendants"
          name={isPositive ? 'checkmark-circle' : 'alert-circle'}
          size={18}
        />
      )}
      <Text style={[styles.message, isPositive && styles.positive, isError && styles.error]}>{message}</Text>
      {status === 'error' && onRetry ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onRetry}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
        >
          <Text style={styles.retryText}>Tekrar kontrol et</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors } = tokens;
  return StyleSheet.create({
    row: { minHeight: 24, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
    message: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    positive: { color: colors.success },
    error: { color: colors.danger },
    retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
    retryText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.primary },
    pressed: { opacity: 0.68 },
  });
}
