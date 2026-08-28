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
      colors={[tokens.colors.secondarySurface, tokens.colors.canvas, tokens.colors.canvas]}
      locations={[0, 0.28, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <View pointerEvents="none" style={styles.gridLineVertical} />
      <View pointerEvents="none" style={styles.gridLineHorizontal} />
      {children}
    </LinearGradient>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: tokens.colors.canvas },
    gridLineVertical: {
      position: 'absolute',
      width: 1,
      top: 0,
      bottom: 0,
      right: '12%',
      backgroundColor: tokens.colors.dividerSubtle,
      opacity: 0.34,
    },
    gridLineHorizontal: {
      position: 'absolute',
      height: 1,
      top: 116,
      left: 0,
      right: 0,
      backgroundColor: tokens.colors.dividerSubtle,
      opacity: 0.28,
    },
  });
}
