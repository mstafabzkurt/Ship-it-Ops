import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

export default function AuthNotice({ message, tone = 'error' }: { message: string; tone?: 'error' | 'info' }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const isError = tone === 'error';

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={isError ? 'alert' : undefined}
      style={[styles.notice, isError ? styles.errorNotice : styles.infoNotice]}
    >
      <Ionicons
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        name={isError ? 'alert-circle-outline' : 'information-circle-outline'}
        size={20}
        color={isError ? tokens.colors.danger : tokens.colors.secondary}
      />
      <Text style={[styles.message, isError ? styles.errorText : styles.infoText]}>{message}</Text>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  return StyleSheet.create({
    notice: {
      width: '100%',
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingHorizontal: 13,
      paddingVertical: 12,
      borderRadius: tokens.radius.sm,
      borderWidth: 1,
    },
    errorNotice: { backgroundColor: tokens.colors.dangerSoft, borderColor: tokens.colors.danger },
    infoNotice: { backgroundColor: tokens.colors.secondarySoft, borderColor: tokens.colors.secondary },
    message: { flex: 1, minWidth: 0, fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19 },
    errorText: { color: tokens.colors.danger },
    infoText: { color: tokens.colors.text },
  });
}
