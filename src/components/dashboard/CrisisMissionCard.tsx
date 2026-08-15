import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { dashboardType, getDashboardTokens } from './dashboardTokens';

interface CrisisMissionCardProps {
  tag: string;
  title: string;
  description: string;
  durationSeconds: number;
  onRespond: () => void;
}

function formatTime(totalSeconds: number) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function CrisisMissionCard({ tag, title, description, durationSeconds, onRespond }: CrisisMissionCardProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [seconds, setSeconds] = useState(durationSeconds);
  const [buttonFocused, setButtonFocused] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((value) => (value <= 1 ? durationSeconds : value - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [durationSeconds]);

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[tokens.colors.dangerSoft, tokens.colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.topRow}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>AKTİF KRİZ</Text>
          </View>
          <View style={styles.timer} accessibilityLabel={`${formatTime(seconds)} kalan süre`}>
            <Text style={styles.timerValue}>{formatTime(seconds)}</Text>
            <Text style={styles.timerLabel}>KALAN</Text>
          </View>
        </View>

        <Text style={styles.tag}>{tag}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.footer}>
          <View style={styles.impact}>
            <Text style={styles.impactLabel}>ÖNCELİK</Text>
            <Text style={styles.impactValue}>Production · Kritik</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aktif krize müdahale et"
            onPress={onRespond}
            onFocus={() => setButtonFocused(true)}
            onBlur={() => setButtonFocused(false)}
            style={({ pressed }) => [styles.button, buttonFocused && styles.buttonFocused, pressed && tokens.motion.pressed]}
          >
            <Text style={styles.buttonText}>Müdahale Et</Text>
            <View style={styles.buttonArrow} accessibilityElementsHidden>
              <Text style={styles.buttonArrowText}>→</Text>
            </View>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: {
      borderRadius: radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: colors.surface,
      ...shadow.raised,
    },
    gradient: { padding: 20 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      minHeight: 32,
      paddingHorizontal: 11,
      borderRadius: radius.pill,
      backgroundColor: colors.dangerSoft,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
    liveText: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.danger },
    timer: {
      minWidth: 76,
      alignItems: 'flex-end',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: radius.md,
      backgroundColor: colors.canvas,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timerValue: { fontFamily: fonts.monoBold, fontSize: 18, lineHeight: 22, color: colors.warning },
    timerLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, letterSpacing: 0.6, color: colors.textMuted },
    tag: { ...dashboardType.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.warning, marginTop: 18, marginBottom: 8 },
    title: { ...dashboardType.display, fontFamily: fonts.headingBold, color: colors.text, maxWidth: 680 },
    description: { ...dashboardType.body, fontFamily: fonts.body, color: colors.textMuted, marginTop: 10, maxWidth: 720 },
    footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginTop: 22 },
    impact: { gap: 2 },
    impactLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 0.6, color: colors.textMuted },
    impactValue: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20, color: colors.danger },
    button: {
      minHeight: tokens.control.heightLarge,
      minWidth: 176,
      paddingLeft: 18,
      paddingRight: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 14,
      borderRadius: radius.md,
      backgroundColor: colors.warning,
      borderWidth: 1,
      borderColor: colors.surfaceHighlightStrong,
      shadowColor: colors.warning,
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.24,
      shadowRadius: 12,
      elevation: 6,
    },
    buttonText: { fontFamily: fonts.headingBold, fontSize: 16, lineHeight: 20, color: colors.onAccent },
    buttonFocused: { borderColor: colors.text },
    buttonArrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.surfaceHighlight },
    buttonArrowText: { fontFamily: fonts.headingBold, fontSize: 20, color: colors.onAccent },
  });
}
