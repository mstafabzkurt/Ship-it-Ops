import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import StatusPill from './StatusPill';
import { getCompanyInitial, useReputation } from '../state/ReputationContext';
import { useTheme } from '../state/ThemeContext';
import { fonts, fontSizes } from '../theme/typography';

interface TopbarProps {
  statusLabel: string;
  statusVariant: 'positive' | 'crisis';
}

export default function Topbar({ statusLabel, statusVariant }: TopbarProps) {
  const { companyName } = useReputation();
  const { theme } = useTheme();
  const { colors } = theme;
  const brandInitial = getCompanyInitial(companyName);

  return (
    <View style={styles.topbar}>
      <View style={styles.brand}>
        <LinearGradient colors={[colors.accentPositive, colors.accentPositive + '99']} style={styles.brandMark}>
          <Text style={styles.brandMarkText}>{brandInitial}</Text>
        </LinearGradient>
        <Text style={[styles.brandName, { color: colors.textPrimary }]}>{companyName}</Text>
      </View>
      <StatusPill label={statusLabel} variant={statusVariant} pulse={statusVariant === 'crisis'} />
    </View>
  );
}

// Structural-only styles — colors applied inline
const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xl,
    color: '#060D10',
  },
  brandName: {
    fontFamily: fonts.headingSemiBold,
    fontSize: fontSizes['2xl'],
  },
});
