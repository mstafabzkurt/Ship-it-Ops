import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../state/ThemeContext';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

export default function GameBackdrop({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  return (
    <LinearGradient
      colors={[tokens.colors.canvasGlow, tokens.colors.canvas, tokens.colors.canvas]}
      locations={[0, 0.34, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <View pointerEvents="none" style={styles.orbPrimary} />
      <View pointerEvents="none" style={styles.orbSecondary} />
      {children}
    </LinearGradient>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: tokens.colors.canvas },
    orbPrimary: {
      position: 'absolute',
      width: 260,
      height: 260,
      top: -130,
      right: -90,
      borderRadius: 130,
      backgroundColor: tokens.colors.primarySoft,
      opacity: 0.62,
    },
    orbSecondary: {
      position: 'absolute',
      width: 220,
      height: 220,
      bottom: 80,
      left: -150,
      borderRadius: 110,
      backgroundColor: tokens.colors.secondarySoft,
      opacity: 0.42,
    },
  });
}
