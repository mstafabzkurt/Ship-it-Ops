import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';

const TENSION_SECONDS = 180; // 03:00 — stres sayacı, ceza yok; sıfırda sessizce yeniden başlar.

interface IncidentCardProps {
  tag: string;
  title: string;
  description: string;
  /** true olduğunda kart "çözüldü" görünümüne geçer, geri sayım durur. */
  resolved?: boolean;
  onRespond?: () => void;
}

function formatTime(totalSeconds: number) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// .incident hero kart karşılığı — canlı geri sayım + kenarlık "glow" animasyonu.
// Geri sayım yalnızca tansiyon içindir: 03:00 → 00:00, ardından sessizce tekrar 03:00.
export default function IncidentCard({
  tag,
  title,
  description,
  resolved = false,
  onRespond,
}: IncidentCardProps) {
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
        <LinearGradient colors={[colors.positiveBg, 'rgba(21,27,39,0.9)']} style={styles.gradient}>
          <Text style={[styles.tag, { color: colors.accentPositive }]}>✅ Durum Kapandı</Text>
          <Text style={styles.title}>Şu an aktif bir kriz yok.</Text>
          <Text style={styles.desc}>Yeni bir olay geldiğinde burada görünecek.</Text>
        </LinearGradient>
      </View>
    );
  }

  const borderColor = glow.interpolate({
    inputRange: [0.5, 1],
    outputRange: ['rgba(242,169,59,0.4)', 'rgba(242,169,59,0.9)'],
  });

  return (
    <Animated.View style={[styles.wrapper, { borderColor }]}>
      <LinearGradient
        colors={['rgba(242,169,59,0.10)', 'rgba(21,27,39,0.9)']}
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

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  wrapperStatic: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
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
    borderRadius: 10,
  },
  btnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: '#1A1200',
  },
});
