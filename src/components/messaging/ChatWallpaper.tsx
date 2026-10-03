import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import type { ChatThemePalette, ChatThemePreset } from '../../utils/chatThemes';

const IMAGES = {
  forest: require('../../../assets/chat-themes/forest-lake.png'),
  observatory: require('../../../assets/chat-themes/observatory.png'),
};

export default function ChatWallpaper({ preset, palette }: { preset: ChatThemePreset; palette: ChatThemePalette }) {
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { backgroundColor: palette.canvas }]}>
      {preset.image ? <>
        <Image source={IMAGES[preset.image]} resizeMode="cover" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10, 15, 26, 0.38)' }]} />
      </> : <LinearGradient colors={palette.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
    </View>
  );
}
