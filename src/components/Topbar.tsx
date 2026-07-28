import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import StatusPill from './StatusPill';
import { getCompanyInitial, useReputation } from '../state/ReputationContext';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';

interface TopbarProps {
  statusLabel: string;
  statusVariant: 'positive' | 'crisis';
}

// .topbar (.brand + .status-pill) karşılığı — logo ve şirket adı ReputationContext'ten gelir.
export default function Topbar({ statusLabel, statusVariant }: TopbarProps) {
  const { companyName } = useReputation();
  const brandInitial = getCompanyInitial(companyName);

  return (
    <View style={styles.topbar}>
      <View style={styles.brand}>
        <LinearGradient colors={[colors.accentPositive, '#1f9d82']} style={styles.brandMark}>
          <Text style={styles.brandMarkText}>{brandInitial}</Text>
        </LinearGradient>
        <Text style={styles.brandName}>{companyName}</Text>
      </View>
      <StatusPill label={statusLabel} variant={statusVariant} pulse={statusVariant === 'crisis'} />
    </View>
  );
}

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
    color: '#06120F',
  },
  brandName: {
    fontFamily: fonts.headingSemiBold,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
  },
});
