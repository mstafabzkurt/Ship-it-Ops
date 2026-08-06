import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRoom } from '../../src/state/RoomContext';
import { useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import type { Theme } from '../../src/theme/themes';
import { fonts, fontSizes } from '../../src/theme/typography';

const ROOM_IMAGES = [
  require('../../assets/rooms/oda0.png'),
  require('../../assets/rooms/oda1.png'),
  require('../../assets/rooms/oda2.png'),
  require('../../assets/rooms/oda3.png'),
  require('../../assets/rooms/oda4.png'),
  require('../../assets/rooms/oda5.png'),
  require('../../assets/rooms/oda6.png'),
  require('../../assets/rooms/oda7.png'),
  require('../../assets/rooms/oda8.png'),
  require('../../assets/rooms/oda9.png'),
  require('../../assets/rooms/oda10.png'),
  require('../../assets/rooms/oda11.png'),
  require('../../assets/rooms/oda12.png'),
  require('../../assets/rooms/oda13.png'),
  require('../../assets/rooms/oda14.png'),
  require('../../assets/rooms/oda15.png'),
  require('../../assets/rooms/oda16.png'),
  require('../../assets/rooms/odabonus.png'),
];

export default function RoomScreen() {
  const { roomLevel } = useRoom();
  const { budget } = useReputation();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { width: screenWidth } = useWindowDimensions();

  const imageWidth = screenWidth - 32;
  const imageHeight = (300 / 360) * imageWidth;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🛏️ Mühendis Odası</Text>
          <Text style={styles.headerSub}>Kendi alanını yaratmaya başla</Text>
        </View>
        <View style={styles.balanceChip}>
          <Text style={styles.balanceIcon}>💰</Text>
          <Text style={styles.balanceValue}>${budget.toLocaleString('tr-TR')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
          <Image source={ROOM_IMAGES[roomLevel]} style={styles.roomImage} resizeMode="contain" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  const { colors, geometry, effects } = theme;
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bgBase },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
    headerLeft: { flex: 1, marginRight: 12 },
    headerTitle: { fontFamily: fonts.headingBold, fontSize: fontSizes['3xl'], color: colors.textPrimary },
    headerSub: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
    balanceChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: colors.positiveBg, borderWidth: geometry.borderWidth,
      borderColor: colors.positiveBorder, borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 7,
      ...effects.glowPositive,
    },
    balanceIcon: { fontSize: 14 },
    balanceValue: { fontFamily: fonts.monoBold, fontSize: fontSizes.md, color: colors.accentPositive },
    scroll: { flex: 1 },
    scrollContent: { alignItems: 'center', gap: 24, paddingTop: 16, paddingBottom: 40 },
    imageContainer: {
      borderRadius: geometry.borderRadius,
      overflow: 'hidden',
      backgroundColor: colors.bgBase,
      borderWidth: geometry.borderWidth,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...effects.panelShadow,
    },
    roomImage: { width: '100%', height: '100%' },
  });
}