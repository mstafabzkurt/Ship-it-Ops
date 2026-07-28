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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReputation, getCompanyInitial } from '../../src/state/ReputationContext';
import { colors } from '../../src/theme/colors';
import { fonts, fontSizes } from '../../src/theme/typography';

export default function ProfileScreen() {
  const { companyName, setCompanyName, currentRank, score, resetProgress } = useReputation();

  // --- 1. User Statistics State (Placeholder variables ready for global state) ---
  const [totalQuestions, setTotalQuestions] = useState<number>(45);
  const [correctAnswers, setCorrectAnswers] = useState<number>(36);
  const [wrongAnswers, setWrongAnswers] = useState<number>(9);

  // Dynamic Win Rate calculation: (Correct / Total) * 100, formatted to 2 decimal places
  const winRate = useMemo(() => {
    if (totalQuestions <= 0) return '0.00';
    const rate = (correctAnswers / totalQuestions) * 100;
    return rate.toFixed(2);
  }, [correctAnswers, totalQuestions]);

  // --- 2. Company Settings State ---
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

    // Trigger visual success cue / Toast
    setShowToast(true);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowToast(false);
    });
  };

  // --- 3. General Preferences State ---
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const initialLetter = getCompanyInitial(companyName);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title */}
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

        {/* --- Section 1: User Statistics Cards --- */}
        <Text style={styles.sectionLabel}>Kullanıcı İstatistikleri</Text>
        <View style={styles.statsGrid}>
          {/* Total Questions Solved */}
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Text style={styles.statIcon}>🎯</Text>
            </View>
            <Text style={styles.statValue}>{totalQuestions}</Text>
            <Text style={styles.statTitle}>Toplam Çözülen</Text>
          </View>

          {/* Correct Answers */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, styles.correctIconWrap]}>
              <Text style={styles.statIcon}>✅</Text>
            </View>
            <Text style={[styles.statValue, styles.correctValue]}>{correctAnswers}</Text>
            <Text style={styles.statTitle}>Doğru Sayısı</Text>
          </View>

          {/* Wrong Answers */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, styles.wrongIconWrap]}>
              <Text style={styles.statIcon}>❌</Text>
            </View>
            <Text style={[styles.statValue, styles.wrongValue]}>{wrongAnswers}</Text>
            <Text style={styles.statTitle}>Yanlış Sayısı</Text>
          </View>

          {/* Win Rate */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, styles.winRateIconWrap]}>
              <Text style={styles.statIcon}>🏆</Text>
            </View>
            <Text style={[styles.statValue, styles.winRateValue]}>%{winRate}</Text>
            <Text style={styles.statTitle}>Kazanma Oranı (Win Rate)</Text>
          </View>
        </View>

        {/* --- Section 2: Company Settings --- */}
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

        {/* --- Section 3: General Preferences --- */}
        <Text style={styles.sectionLabel}>Genel Tercihler</Text>
        <View style={styles.cardSection}>
          {/* Sound Toggle */}
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

          {/* Dark / Light Theme Toggle */}
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

        {/* Quick Reset Option */}
        <TouchableOpacity style={styles.resetButton} onPress={resetProgress} activeOpacity={0.7}>
          <Text style={styles.resetButtonText}>İlerlemeyi Varsayılana Sıfırla</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Success Cue / Toast Notification */}
      {showToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  headerTitle: {
    fontFamily: fonts.headingSemiBold,
    fontSize: fontSizes['3xl'],
    color: colors.textPrimary,
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 16,
  },
  /* User Profile Card */
  userCard: {
    marginHorizontal: 20,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.panelAlt,
    borderWidth: 2,
    borderColor: colors.accentPositive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes['3xl'],
    color: colors.accentPositive,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontFamily: fonts.headingSemiBold,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
  },
  rankBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.positiveBg,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    color: colors.accentPositive,
    textTransform: 'uppercase',
  },
  scoreText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },

  /* Section Labels */
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

  /* Statistics 2x2 Grid */
  statsGrid: {
    marginHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.panelAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  correctIconWrap: {
    backgroundColor: colors.positiveBg,
  },
  wrongIconWrap: {
    backgroundColor: colors.dangerBg,
  },
  winRateIconWrap: {
    backgroundColor: colors.alertBg,
  },
  statIcon: {
    fontSize: 16,
  },
  statValue: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
  },
  correctValue: {
    color: colors.accentPositive,
  },
  wrongValue: {
    color: colors.accentDanger,
  },
  winRateValue: {
    color: colors.accentAlert,
  },
  statTitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },

  /* Card Container for Inputs and Preferences */
  cardSection: {
    marginHorizontal: 20,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
  },
  inputLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: 8,
  },
  companyInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.accentPositive,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: '#0B0F17',
  },

  /* Preference Rows */
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  preferenceTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  preferenceTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  preferenceSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },

  /* Reset Button */
  resetButton: {
    marginHorizontal: 20,
    marginTop: 28,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
  },
  resetButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.accentDanger,
  },

  /* Toast Notification */
  toastContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.accentPositive,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastIcon: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.accentPositive,
  },
  toastText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
});
