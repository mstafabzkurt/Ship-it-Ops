import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';

interface PlaceholderScreenProps {
  icon: string;
  title: string;
  subtitle: string;
}

// Henüz tasarımı gelmeyen sekmeler için ortak "yakında" ekranı.
// (Dashboard/index.tsx dışındaki 4 sekme bu bileşeni kullanır.)
export default function PlaceholderScreen({ icon, title, subtitle }: PlaceholderScreenProps) {
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

const styles = StyleSheet.create({
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
