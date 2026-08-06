import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Animated,
  Easing,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReputation, getCompanyInitial } from '../../src/state/ReputationContext';
import { useRoom } from '../../src/state/RoomContext';
import { useTheme } from '../../src/state/ThemeContext';
import type { Theme } from '../../src/theme/themes';
import { fonts, fontSizes } from '../../src/theme/typography';

export default function ProfileScreen() {
  const {
    companyName,
    setCompanyName,
    currentRank,
    score,
    resetProgress,
    correctAnswers,
    wrongAnswers,
  } = useReputation();

  const { resetRoom } = useRoom();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Dynamic calculations
  const totalQuestions = correctAnswers + wrongAnswers;
  const winRate = useMemo(() => {
    if (totalQuestions <= 0) return '0.00';
    return ((correctAnswers / totalQuestions) * 100).toFixed(2);
  }, [correctAnswers, totalQuestions]);

  const [companyInput, setCompanyInput] = useState<string>(companyName);
  const [showToast, setShowToast] = useState<boolean>(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setCompanyInput(companyName);
  }, [companyName]);

  const handleSaveCompany = async () => {
    const trimmed = companyInput.trim();
    if (!trimmed) {
      Alert.alert('Uyarı', 'Şirket adı boş bırakılamaz.');
      return;
    }
    await setCompanyName(trimmed);
    setShowToast(true);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastAnim, { toValue: 0, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(() => { setShowToast(false); });
  };

  const handleResetProgress = async () => {
    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm('Tüm puanlar, bütçe, görülen senaryolar ve kullanıcı istatistikleri sıfırlanacak. Emin misiniz?');
      if (isConfirmed) {
        await Promise.all([resetProgress(), resetRoom()]);
        window.alert('Bilgi: Tüm ilerleme ve istatistikler sıfırlandı.');
      }
    } else {
      Alert.alert(
        'İlerlemeyi Sıfırla',
        'Tüm puanlar, bütçe, görülen senaryolar ve kullanıcı istatistikleri sıfırlanacak. Emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Sıfırla',
            style: 'destructive',
            onPress: async () => {
              await Promise.all([resetProgress(), resetRoom()]);
              Alert.alert('Bilgi', 'Tüm ilerleme ve istatistikler sıfırlandı.');
            },
          },
        ]
      );
    }
  };

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const initialLetter = getCompanyInitial(companyName);
  const { colors } = theme;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.headerTitle}>Kullanıcı Profili</Text>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initialLetter}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{companyName}</Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>{currentRank.name}</Text>
            </View>
            <Text style={styles.scoreText}>{score.toLocaleString('tr-TR')} İtibar Puanı</Text>
          </View>
        </View>

        {/* Stats */}
        <Text style={styles.sectionLabel}>Kullanıcı İstatistikleri</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}><Text style={styles.statIcon}>🎯</Text></View>
            <Text style={styles.statValue}>{totalQuestions}</Text>
            <Text style={styles.statTitle}>Toplam Çözülen</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, styles.correctIconWrap]}><Text style={styles.statIcon}>✅</Text></View>
            <Text style={[styles.statValue, styles.correctValue]}>{correctAnswers}</Text>
            <Text style={styles.statTitle}>Doğru Sayısı</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, styles.wrongIconWrap]}><Text style={styles.statIcon}>❌</Text></View>
            <Text style={[styles.statValue, styles.wrongValue]}>{wrongAnswers}</Text>
            <Text style={styles.statTitle}>Yanlış Sayısı</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, styles.winRateIconWrap]}><Text style={styles.statIcon}>🏆</Text></View>
            <Text style={[styles.statValue, styles.winRateValue]}>%{winRate}</Text>
            <Text style={styles.statTitle}>Kazanma Oranı (Win Rate)</Text>
          </View>
        </View>

        {/* Company Settings */}
        <Text style={styles.sectionLabel}>Şirket Ayarları</Text>
        <View style={styles.cardSection}>
          <Text style={styles.inputLabel}>Şirket Adı</Text>
          <View style={styles.companyInputRow}>
            <TextInput
              style={styles.textInput}
              value={companyInput}
              onChangeText={setCompanyInput}
              placeholder="Şirket adını giriniz..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveCompany} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* General Preferences */}
        <Text style={styles.sectionLabel}>Genel Tercihler</Text>
        <View style={styles.cardSection}>
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextWrap}>
              <Text style={styles.preferenceTitle}>Ses Efektleri</Text>
              <Text style={styles.preferenceSub}>Uygulama içi ses ve bildirim tonları</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: colors.border, true: colors.accentPositive }}
              thumbColor={colors.textPrimary}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextWrap}>
              <Text style={styles.preferenceTitle}>Karanlık Tema (Dark Mode)</Text>
              <Text style={styles.preferenceSub}>
                {isDarkMode ? 'Karanlık tema aktif' : 'Aydınlık tema aktif'}
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: colors.border, true: colors.accentPositive }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </View>

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetButton} onPress={handleResetProgress} activeOpacity={0.7}>
          <Text style={styles.resetButtonText}>İlerlemeyi Varsayılana Sıfırla</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Toast */}
      {showToast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <Text style={styles.toastIcon}>✓</Text>
          <Text style={styles.toastText}>Şirket adı başarıyla güncellendi!</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  const { colors, geometry, effects } = theme;
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bgBase },
    scroll: { flex: 1 },
    content: { paddingBottom: 40 },
    headerTitle: {
      fontFamily: fonts.headingSemiBold,
      fontSize: fontSizes['3xl'],
      color: colors.textPrimary,
      marginHorizontal: 20,
      marginTop: 18,
      marginBottom: 16,
    },
    userCard: {
      marginHorizontal: 20,
      backgroundColor: colors.panel,
      borderWidth: geometry.borderWidth,
      borderColor: colors.border,
      borderRadius: geometry.borderRadius,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      ...effects.cardShadow,
    },
    avatarWrap: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.panelAlt,
      borderWidth: geometry.borderWidth,
      borderColor: colors.accentPositive,
      alignItems: 'center',
      justifyContent: 'center',
      ...effects.glowPositive,
    },
    avatarText: {
      fontFamily: fonts.headingBold,
      fontSize: fontSizes['3xl'],
      color: colors.accentPositive,
    },
    userInfo: { flex: 1, gap: 4 },
    userName: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes['2xl'], color: colors.textPrimary },
    rankBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.positiveBg,
      borderWidth: geometry.borderWidth,
      borderColor: colors.positiveBorder,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: geometry.borderRadiusSm,
    },
    rankBadgeText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: fontSizes.xs,
      color: colors.accentPositive,
      textTransform: 'uppercase',
    },
    scoreText: { fontFamily: fonts.mono, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
    sectionLabel: {
      fontFamily: fonts.bodySemiBold,
      fontSize: fontSizes.base,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
      marginHorizontal: 20,
      marginTop: 24,
      marginBottom: 10,
    },
    statsGrid: { marginHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: {
      flexBasis: '48%',
      flexGrow: 1,
      backgroundColor: colors.panel,
      borderWidth: geometry.borderWidth,
      borderColor: colors.border,
      borderRadius: geometry.borderRadius,
      padding: 14,
      gap: 6,
      ...effects.cardShadow,
    },
    statIconWrap: {
      width: 34,
      height: 34,
      borderRadius: geometry.borderRadiusSm,
      backgroundColor: colors.panelAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    correctIconWrap: { backgroundColor: colors.positiveBg },
    wrongIconWrap: { backgroundColor: colors.dangerBg },
    winRateIconWrap: { backgroundColor: colors.alertBg },
    statIcon: { fontSize: 16 },
    statValue: { fontFamily: fonts.monoBold, fontSize: fontSizes['2xl'], color: colors.textPrimary },
    correctValue: { color: colors.accentPositive },
    wrongValue: { color: colors.accentDanger },
    winRateValue: { color: colors.accentAlert },
    statTitle: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.textMuted },
    cardSection: {
      marginHorizontal: 20,
      backgroundColor: colors.panel,
      borderWidth: geometry.borderWidth,
      borderColor: colors.border,
      borderRadius: geometry.borderRadius,
      padding: 16,
      ...effects.cardShadow,
    },
    inputLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, color: colors.textMuted, marginBottom: 8 },
    companyInputRow: { flexDirection: 'row', gap: 10 },
    textInput: {
      flex: 1,
      backgroundColor: colors.panelAlt,
      borderWidth: geometry.borderWidth,
      borderColor: colors.border,
      borderRadius: geometry.borderRadiusSm,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontFamily: fonts.bodyMedium,
      fontSize: fontSizes.md,
      color: colors.textPrimary,
    },
    saveButton: {
      backgroundColor: colors.accentPositive,
      borderRadius: geometry.borderRadiusSm,
      paddingHorizontal: 16,
      justifyContent: 'center',
      alignItems: 'center',
      ...effects.glowPositive,
    },
    saveButtonText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: '#060D10' },
    preferenceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
    preferenceTextWrap: { flex: 1, paddingRight: 10 },
    preferenceTitle: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: colors.textPrimary },
    preferenceSub: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
    resetButton: {
      marginHorizontal: 20,
      marginTop: 28,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: geometry.borderRadius,
      borderWidth: geometry.borderWidth,
      borderColor: colors.dangerBorder,
      backgroundColor: colors.panel,
      ...effects.glowDanger,
    },
    resetButtonText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.accentDanger },
    toastContainer: {
      position: 'absolute',
      bottom: 30,
      left: 20,
      right: 20,
      backgroundColor: colors.panelAlt,
      borderWidth: geometry.borderWidth,
      borderColor: colors.accentPositive,
      borderRadius: geometry.borderRadius,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      ...effects.glowPositive,
    },
    toastIcon: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.lg, color: colors.accentPositive },
    toastText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.md, color: colors.textPrimary },
  });
}
