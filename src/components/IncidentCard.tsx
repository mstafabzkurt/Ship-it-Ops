import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../state/ThemeContext';
import type { Theme } from '../theme/themes';
import { fonts, fontSizes } from '../theme/typography';

const TENSION_SECONDS = 180;

interface IncidentCardProps {
  tag: string;
  title: string;
  description: string;
  resolved?: boolean;
  onRespond?: () => void;
}

function formatTime(totalSeconds: number) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function IncidentCard({
  tag,
  title,
  description,
  resolved = false,
  onRespond,
}: IncidentCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  const [seconds, setSeconds] = useState(TENSION_SECONDS);
  const glow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (resolved) return;
    const interval = setInterval(() => {
      setSeconds((prev) => (prev <= 1 ? TENSION_SECONDS : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resolved]);

  useEffect(() => {
    if (resolved) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1100, easing: Easing.ease, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0.5, duration: 1100, easing: Easing.ease, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glow, resolved]);

  if (resolved) {
    return (
      <View style={[styles.wrapperStatic, { borderColor: colors.positiveBorder }]}>
        <LinearGradient colors={[colors.positiveBg, colors.bgBase + 'E6']} style={styles.gradient}>
          <Text style={[styles.tag, { color: colors.accentPositive }]}>✅ Durum Kapandı</Text>
          <Text style={styles.title}>Şu an aktif bir kriz yok.</Text>
          <Text style={styles.desc}>Yeni bir olay geldiğinde burada görünecek.</Text>
        </LinearGradient>
      </View>
    );
  }

  const borderColor = glow.interpolate({
    inputRange: [0.5, 1],
    outputRange: [colors.alertBorder, colors.accentAlert + 'E6'],
  });

  return (
    <Animated.View style={[styles.wrapper, { borderColor }]}>
      <LinearGradient
        colors={[colors.alertBg, colors.bgBase + 'F2']}
        style={styles.gradient}
      >
        <Text style={styles.tag}>{tag}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>

        <View style={styles.footer}>
          <View>
            <Text style={styles.timer}>{formatTime(seconds)}</Text>
            <Text style={styles.timerLabel}>kalan süre</Text>
          </View>
          <Pressable style={styles.btn} onPress={onRespond}>
            <Text style={styles.btnText}>Müdahale Et →</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function makeStyles(theme: Theme) {
  const { colors, geometry, effects } = theme;
  return StyleSheet.create({
    wrapper: {
      borderRadius: geometry.borderRadiusLg,
      borderWidth: geometry.borderWidth,
      overflow: 'hidden',
      ...effects.glowAlert,
    },
    wrapperStatic: {
      borderRadius: geometry.borderRadiusLg,
      borderWidth: geometry.borderWidth,
      overflow: 'hidden',
      ...effects.glowPositive,
    },
    gradient: {
      padding: 18,
    },
    tag: {
      fontFamily: fonts.bodySemiBold,
      fontSize: fontSizes.sm,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.accentAlert,
      marginBottom: 10,
    },
    title: {
      fontFamily: fonts.headingSemiBold,
      fontSize: fontSizes['2xl'],
      lineHeight: 23,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    desc: {
      fontFamily: fonts.body,
      fontSize: fontSizes.md,
      lineHeight: 19,
      color: colors.textMuted,
      marginBottom: 14,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    timer: {
      fontFamily: fonts.monoBold,
      fontSize: fontSizes['3xl'],
      color: colors.accentAlert,
    },
    timerLabel: {
      fontFamily: fonts.body,
      fontSize: fontSizes.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    btn: {
      backgroundColor: colors.accentAlert,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: geometry.borderRadiusSm,
    },
    btnText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: fontSizes.md,
      color: '#0A0800',
    },
  });
}
