import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface AuthScreenShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export default function AuthScreenShell({ eyebrow, title, description, children }: AuthScreenShellProps) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const isWide = width >= 860;

  return (
    <LinearGradient
      colors={[tokens.colors.canvas, tokens.colors.canvasGlow, tokens.colors.canvas]}
      locations={[0, 0.48, 1]}
      style={styles.background}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={8}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.frame, isWide && styles.frameWide]}>
              <View style={[styles.brandPanel, isWide && styles.brandPanelWide]}>
                <View style={styles.scanRule} />
                <View style={styles.nodeRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.nodeLabel}>ACCESS NODE // ONLINE</Text>
                </View>
                <View style={styles.brandMark}>
                  <Ionicons
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    name="terminal-outline"
                    size={27}
                    color={tokens.colors.secondary}
                  />
                </View>
                <Text accessibilityRole="header" style={styles.brandTitle}>Ship It Ops</Text>
                <Text style={styles.brandCopy}>
                  Operasyon kararlarını yönet, krizleri çöz ve mühendislik kariyerini büyüt.
                </Text>
                <View style={styles.brandRule} />
                <Text style={styles.brandFootnote}>OPERATOR ACCESS / SECURE CHANNEL</Text>
              </View>

              <View style={[styles.formPanel, isWide && styles.formPanelWide]}>
                <Text style={styles.eyebrow}>{eyebrow}</Text>
                <Text accessibilityRole="header" style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
                <View style={styles.formContent}>{children}</View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const compact = tokens.layout.isCompact;
  return StyleSheet.create({
    background: { flex: 1 },
    safeArea: { flex: 1 },
    keyboardView: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tokens.layout.pageGutter,
      paddingVertical: compact ? 14 : 28,
    },
    frame: {
      width: '100%',
      maxWidth: 520,
      overflow: 'hidden',
      borderRadius: tokens.radius.lg,
      borderWidth: 1,
      borderColor: tokens.colors.borderStrong,
      backgroundColor: tokens.colors.secondarySurface,
      ...(Platform.OS === 'web'
        ? { boxShadow: '0 18px 44px rgba(5, 5, 16, 0.34)' }
        : tokens.shadow.raised),
    },
    frameWide: { maxWidth: 940, minHeight: 610, flexDirection: 'row' },
    brandPanel: {
      position: 'relative',
      overflow: 'hidden',
      paddingHorizontal: compact ? 20 : 28,
      paddingTop: compact ? 20 : 30,
      paddingBottom: compact ? 18 : 26,
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.borderSubtle,
      backgroundColor: tokens.colors.secondarySurfaceRaised,
    },
    brandPanelWide: {
      width: '42%',
      justifyContent: 'center',
      paddingHorizontal: 38,
      paddingVertical: 46,
      borderBottomWidth: 0,
      borderRightWidth: 1,
      borderRightColor: tokens.colors.borderSubtle,
    },
    scanRule: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: 3,
      backgroundColor: tokens.colors.primary,
      opacity: 0.8,
      pointerEvents: 'none',
    },
    nodeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: compact ? 15 : 24 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: tokens.colors.secondary },
    nodeLabel: { flexShrink: 1, fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.8, color: tokens.colors.textMuted },
    brandMark: {
      width: compact ? 48 : 56,
      height: compact ? 48 : 56,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: compact ? 12 : 18,
      borderRadius: tokens.radius.md,
      borderWidth: 1,
      borderColor: tokens.colors.secondary,
      backgroundColor: tokens.colors.secondarySoft,
    },
    brandTitle: { fontFamily: fonts.headingBold, fontSize: compact ? 26 : 34, lineHeight: compact ? 31 : 40, color: tokens.colors.text },
    brandCopy: { maxWidth: 330, marginTop: 9, fontFamily: fonts.body, fontSize: compact ? 14 : 16, lineHeight: compact ? 21 : 24, color: tokens.colors.textMuted },
    brandRule: { width: 72, height: 1, marginTop: compact ? 16 : 28, marginBottom: 10, backgroundColor: tokens.colors.primary },
    brandFootnote: { fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 13, letterSpacing: 0.75, color: tokens.colors.textMuted },
    formPanel: { paddingHorizontal: compact ? 20 : 30, paddingVertical: compact ? 22 : 32 },
    formPanelWide: { flex: 1, minWidth: 0, justifyContent: 'center', paddingHorizontal: 52, paddingVertical: 46 },
    eyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.monoSemiBold, color: tokens.colors.secondary, marginBottom: 6 },
    title: { fontFamily: fonts.headingBold, fontSize: compact ? 24 : 30, lineHeight: compact ? 30 : 37, color: tokens.colors.text },
    description: { marginTop: 8, fontFamily: fonts.body, fontSize: compact ? 14 : 15, lineHeight: compact ? 21 : 23, color: tokens.colors.textMuted },
    formContent: { width: '100%', marginTop: compact ? 22 : 28 },
  });
}
