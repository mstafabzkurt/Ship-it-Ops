// ─────────────────────────────────────────────────────────────────────────────
// GradientBackground — When the active theme is 'nebula', wraps children in a
// LinearGradient using the deep-space nebula colours.  For all other themes it
// renders a plain View with the theme's bgBase colour so the rest of the app
// is unaffected.
//
// Usage:
//   <GradientBackground style={styles.safeArea}>
//     {children}
//   </GradientBackground>
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../state/ThemeContext';
import { NEBULA_GRADIENT_COLORS } from '../theme/themes';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function GradientBackground({ children, style }: Props) {
  const { theme } = useTheme();

  if (theme.id === 'nebula') {
    return (
      <LinearGradient
        colors={NEBULA_GRADIENT_COLORS}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[{ flex: 1, backgroundColor: theme.colors.bgBase }, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: theme.colors.bgBase }, style]}>
      {children}
    </View>
  );
}
