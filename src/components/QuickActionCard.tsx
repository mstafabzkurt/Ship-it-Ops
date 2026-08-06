import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../state/ThemeContext';
import type { Theme } from '../theme/themes';
import { fonts, fontSizes } from '../theme/typography';

interface QuickActionCardProps {
  icon: string;
  title: string;
  subtitle: string;
  locked?: boolean;
  lockText?: string;
  onPress?: () => void;
}

export default function QuickActionCard({
  icon,
  title,
  subtitle,
  locked = false,
  lockText,
  onPress,
}: QuickActionCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Pressable
      style={[styles.card, locked && styles.cardLocked]}
      onPress={locked ? undefined : onPress}
      disabled={locked}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {locked && lockText ? <Text style={styles.lockBadge}>🔒 {lockText}</Text> : null}
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  const { colors, geometry, effects } = theme;
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.panel,
      borderWidth: geometry.borderWidth,
      borderColor: colors.border,
      borderRadius: geometry.borderRadius,
      padding: 14,
      minWidth: '47%',
      ...effects.cardShadow,
    },
    cardLocked: {
      opacity: 0.5,
    },
    icon: {
      fontSize: 20,
      marginBottom: 8,
    },
    title: {
      fontFamily: fonts.headingSemiBold,
      fontSize: fontSizes.lg,
      color: colors.textPrimary,
      marginBottom: 3,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      lineHeight: 15,
    },
    lockBadge: {
      fontFamily: fonts.body,
      fontSize: fontSizes.xs,
      color: colors.accentAlert,
      marginTop: 6,
    },
  });
}
