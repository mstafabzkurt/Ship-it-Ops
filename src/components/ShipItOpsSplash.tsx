import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../state/ThemeContext';
import { fonts } from '../theme/typography';
import { getDashboardTokens } from './dashboard/dashboardTokens';

export default function ShipItOpsSplash({ fontsLoaded = true, status = 'Operasyon ortamı hazırlanıyor...', loading = true, children }: {
  fontsLoaded?: boolean;
  status?: string;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.tile}>
          <View style={styles.terminalBar}><View style={styles.terminalDot} /><View style={styles.terminalLine} /></View>
          <Text style={[styles.monogram, fontsLoaded && { fontFamily: fonts.monoBold }]}>SIO</Text>
          <View style={styles.deployStem} /><View style={styles.deployArrow} />
        </View>
        <Text style={[styles.title, fontsLoaded && { fontFamily: fonts.headingBold }]}>Ship It Ops</Text>
        <Text accessibilityLiveRegion="polite" style={[styles.subtitle, fontsLoaded && { fontFamily: fonts.body }]}>{status}</Text>
        {loading ? (
          <View accessibilityRole="progressbar" accessibilityLabel="Operasyon ortamı yükleniyor" accessibilityState={{ busy: true }} style={styles.indicator}>
            {[0, 1, 2].map(index => <View key={index} style={[styles.segment, index === 0 && styles.segmentActive]} />)}
          </View>
        ) : null}
        {children}
      </View>
    </SafeAreaView>
  );
}

function makeStyles({ colors, radius }: ReturnType<typeof getDashboardTokens>) {
  return StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },
    content: { width: '100%', maxWidth: 520, padding: 24, alignItems: 'center', gap: 14 },
    tile: { width: 112, height: 112, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.secondarySurface, marginBottom: 8, padding: 15 },
    terminalBar: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    terminalDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary },
    terminalLine: { height: 1, width: 42, backgroundColor: colors.borderStrong },
    monogram: { fontSize: 29, letterSpacing: -1, color: colors.text, marginTop: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    deployStem: { position: 'absolute', width: 2, height: 17, right: 16, bottom: 14, backgroundColor: colors.primary },
    deployArrow: { position: 'absolute', width: 9, height: 9, right: 12.5, bottom: 23, borderTopWidth: 2, borderLeftWidth: 2, borderColor: colors.primary, transform: [{ rotate: '45deg' }] },
    title: { fontSize: 26, color: colors.text },
    subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center', color: colors.textMuted },
    indicator: { flexDirection: 'row', gap: 5, marginTop: 8 },
    segment: { width: 20, height: 3, borderRadius: 2, backgroundColor: colors.borderStrong },
    segmentActive: { backgroundColor: colors.primary },
  });
}
