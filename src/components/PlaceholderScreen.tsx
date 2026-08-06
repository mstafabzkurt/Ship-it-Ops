import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../state/ThemeContext';
import type { Theme } from '../theme/themes';
import { fonts, fontSizes } from '../theme/typography';

interface PlaceholderScreenProps {
  icon: string;
  title: string;
  subtitle: string;
}

export default function PlaceholderScreen({ icon, title, subtitle }: PlaceholderScreenProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.center}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  const { colors } = theme;
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bgBase,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    icon: {
      fontSize: 40,
      marginBottom: 12,
    },
    title: {
      fontFamily: fonts.headingSemiBold,
      fontSize: fontSizes['2xl'],
      color: colors.textPrimary,
      marginBottom: 6,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: fontSizes.md,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 19,
    },
  });
}
