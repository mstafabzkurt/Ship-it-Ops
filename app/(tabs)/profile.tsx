import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProfileButton from '../../src/components/profile/ProfileButton';
import ProfileStatCard from '../../src/components/profile/ProfileStatCard';
import ProfileSummaryCard from '../../src/components/profile/ProfileSummaryCard';
import { dashboardType, getDashboardTokens, type DashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { getCompanyInitial, useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';
import { formatCurrency } from '../../src/utils/format';

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const {
    companyName,
    setCompanyName,
    currentRank,
    careerXp,
    score,
    budget,
    addBudget,
    resetProgress,
    correctAnswers,
    wrongAnswers,
  } = useReputation();
  const { theme, resetTheme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const isWide = width >= 900;

  const totalQuestions = correctAnswers + wrongAnswers;
  const winRate = useMemo(() => {
    if (totalQuestions <= 0) return '0.00';
    return ((correctAnswers / totalQuestions) * 100).toFixed(2);
  }, [correctAnswers, totalQuestions]);

  const [companyInput, setCompanyInput] = useState(companyName);
  const [companyError, setCompanyError] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setCompanyInput(companyName);
  }, [companyName]);

  const validateCompany = () => {
    const isEmpty = !companyInput.trim();
    setCompanyError(isEmpty ? 'Şirket adı boş bırakılamaz.' : '');
    return !isEmpty;
  };

  const handleCompanyChange = (value: string) => {
    setCompanyInput(value);
    if (value.trim()) setCompanyError('');
  };

  const handleSaveCompany = async () => {
    const trimmed = companyInput.trim();
    if (!validateCompany()) {
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
    ]).start(() => setShowToast(false));
  };

  const handleResetProgress = async () => {
    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm('Tüm Kariyer XP, İtibar, bütçe, yakın soru geçmişi ve kullanıcı istatistikleri sıfırlanacak. Emin misiniz?');
      if (isConfirmed) {
        await Promise.all([resetProgress(), resetTheme()]);
        window.alert('Bilgi: Tüm ilerleme ve istatistikler sıfırlandı.');
      }
    } else {
      Alert.alert(
        'İlerlemeyi Sıfırla',
        'Tüm Kariyer XP, İtibar, bütçe, yakın soru geçmişi ve kullanıcı istatistikleri sıfırlanacak. Emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Sıfırla',
            style: 'destructive',
            onPress: async () => {
              await Promise.all([resetProgress(), resetTheme()]);
              Alert.alert('Bilgi', 'Tüm ilerleme ve istatistikler sıfırlandı.');
            },
          },
        ],
      );
    }
  };

  const handleAddDebugBudget = () => {
    void addBudget(10_000);
  };

  return (
    <LinearGradient
      colors={[tokens.colors.canvasGlow, tokens.colors.canvas, tokens.colors.canvas]}
      locations={[0, 0.34, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <View pointerEvents="none" style={styles.orbPrimary} />
      <View pointerEvents="none" style={styles.orbSecondary} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.container, isWide && styles.containerWide]}>
            <View style={styles.pageHeader}>
              <Text style={styles.eyebrow}>OYUNCU VE ŞİRKET</Text>
              <Text style={styles.headerTitle}>Kullanıcı Profili</Text>
            </View>

            <ProfileSummaryCard
              initial={getCompanyInitial(companyName)}
              companyName={companyName}
              currentRank={currentRank}
              careerXp={careerXp}
              score={score}
            />

            <SectionHeading eyebrow="PERFORMANS" title="Kullanıcı İstatistikleri" styles={styles} />
            <View style={styles.statsGrid}>
              <View style={[styles.statGridItem, isWide && styles.statGridItemWide]}>
                <ProfileStatCard mark="Σ" label="Toplam Çözülen" value={`${totalQuestions}`} tone="neutral" />
              </View>
              <View style={[styles.statGridItem, isWide && styles.statGridItemWide]}>
                <ProfileStatCard mark="✓" label="Doğru Sayısı" value={`${correctAnswers}`} tone="positive" />
              </View>
              <View style={[styles.statGridItem, isWide && styles.statGridItemWide]}>
                <ProfileStatCard mark="×" label="Yanlış Sayısı" value={`${wrongAnswers}`} tone="negative" />
              </View>
              <View style={[styles.statGridItem, isWide && styles.statGridItemWide]}>
                <ProfileStatCard mark="%" label="Kazanma Oranı" value={`%${winRate}`} tone="warning" />
              </View>
            </View>

            <View style={[styles.settingsGrid, isWide && styles.settingsGridWide]}>
              <View style={[styles.primaryColumn, isWide && styles.primaryColumnWide]}>
                <SectionHeading eyebrow="PROFİL" title="Şirket Ayarları" styles={styles} compact />
                <View style={styles.settingsCard}>
                  <Text style={styles.inputLabel}>Şirket Adı</Text>
                  <Text style={styles.inputHint}>Ana sayfa ve profil boyunca görünen şirket adın.</Text>
                  <View style={styles.companyInputRow}>
                    <TextInput
                      accessibilityLabel="Şirket adı"
                      accessibilityHint="Şirket adını değiştirir"
                      value={companyInput}
                      onChangeText={handleCompanyChange}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => {
                        setInputFocused(false);
                        validateCompany();
                      }}
                      placeholder="Şirket adını giriniz..."
                      placeholderTextColor={tokens.colors.textMuted}
                      autoCapitalize="words"
                      style={[
                        styles.textInput,
                        inputFocused && styles.textInputFocused,
                        !!companyError && styles.textInputError,
                      ]}
                    />
                    <ProfileButton label="Kaydet" onPress={() => void handleSaveCompany()} style={styles.saveButton} />
                  </View>
                  <View style={styles.validationSlot}>
                    {companyError ? (
                      <Text accessibilityLiveRegion="polite" style={styles.validationError}>{companyError}</Text>
                    ) : (
                      <Text style={styles.validationHint}>Değişiklikler cihazında kalıcı olarak saklanır.</Text>
                    )}
                  </View>
                </View>

                <SectionHeading eyebrow="AYARLAR" title="Genel Tercihler" styles={styles} compact />
                <View style={styles.settingsCard}>
                  <View style={styles.preferenceRow}>
                    <View style={styles.preferenceMark}><Text style={styles.preferenceMarkText}>♪</Text></View>
                    <View style={styles.preferenceCopy}>
                      <Text style={styles.preferenceTitle}>Ses Efektleri</Text>
                      <Text style={styles.preferenceDescription}>Uygulama içi ses ve bildirim tonları</Text>
                    </View>
                    <Switch
                      accessibilityLabel="Ses Efektleri"
                      value={soundEnabled}
                      onValueChange={setSoundEnabled}
                      trackColor={{ false: tokens.colors.borderStrong, true: tokens.colors.secondary }}
                      thumbColor={tokens.colors.text}
                    />
                  </View>
                </View>
              </View>

              <View style={[styles.secondaryColumn, isWide && styles.secondaryColumnWide]}>
                <SectionHeading eyebrow="GELECEK" title="Hesap" styles={styles} compact />
                <View style={styles.settingsCard}>
                  <View style={styles.accountRow}>
                    <View style={styles.accountMark}><Text style={styles.accountMarkText}>→</Text></View>
                    <View style={styles.accountCopy}>
                      <Text style={styles.preferenceTitle}>Çıkış Yap</Text>
                      <Text style={styles.preferenceDescription}>Kimlik doğrulama henüz kullanılmıyor.</Text>
                    </View>
                  </View>
                  <ProfileButton label="Çıkış Yap — Kullanılamıyor" variant="disabled" disabled style={styles.fullWidthButton} />
                </View>

                {__DEV__ ? (
                  <>
                    <SectionHeading eyebrow="TEST / DEBUG" title="Geliştirici Araçları" styles={styles} compact />
                    <View style={styles.developerCard}>
                      <View style={styles.developerHeader}>
                        <View>
                          <Text style={styles.developerLabel}>ŞİRKET BÜTÇESİ</Text>
                          <Text style={styles.developerBudget}>{formatCurrency(budget)}</Text>
                        </View>
                        <View style={styles.testPill}><Text style={styles.testPillText}>TEST</Text></View>
                      </View>
                      <Text style={styles.developerDescription}>Bu kontroller yalnızca geliştirme ve test amacıyla kullanılır.</Text>
                      <ProfileButton label="10.000 Bütçe Ekle" variant="warning" onPress={handleAddDebugBudget} style={styles.fullWidthButton} />
                      <View style={styles.dangerDivider} />
                      <ProfileButton
                        label="İlerlemeyi Varsayılana Sıfırla"
                        variant="danger"
                        onPress={() => void handleResetProgress()}
                        style={styles.fullWidthButton}
                      />
                    </View>
                  </>
                ) : null}
              </View>
            </View>
          </View>
        </ScrollView>

        {showToast ? (
          <Animated.View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            pointerEvents="none"
            style={[
              styles.toast,
              {
                opacity: toastAnim,
                transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              },
            ]}
          >
            <Text style={styles.toastIcon}>✓</Text>
            <Text style={styles.toastText}>Şirket adı başarıyla güncellendi!</Text>
          </Animated.View>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

function SectionHeading({
  eyebrow,
  title,
  styles,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  styles: ReturnType<typeof makeStyles>;
  compact?: boolean;
}) {
  return (
    <View style={[styles.sectionHeading, compact && styles.sectionHeadingCompact]}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function makeStyles(tokens: DashboardTokens) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    orbPrimary: { position: 'absolute', width: 300, height: 300, top: -175, right: -105, borderRadius: 150, backgroundColor: colors.primarySoft, opacity: 0.7 },
    orbSecondary: { position: 'absolute', width: 250, height: 250, top: 640, left: -180, borderRadius: 125, backgroundColor: colors.secondarySoft, opacity: 0.4 },
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: tokens.layout.pageBottom },
    container: { width: '100%', maxWidth: tokens.layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: tokens.layout.pageGutter, paddingTop: tokens.layout.pageTop },
    containerWide: { paddingHorizontal: tokens.layout.pageGutterWide },
    pageHeader: { marginBottom: 18 },
    eyebrow: { ...dashboardType.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.secondary, marginBottom: 5 },
    headerTitle: { ...dashboardType.display, fontFamily: fonts.headingBold, color: colors.text },
    sectionHeading: { marginTop: 32, marginBottom: 13 },
    sectionHeadingCompact: { marginTop: 24 },
    sectionEyebrow: { ...dashboardType.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.textMuted, marginBottom: 3 },
    sectionTitle: { ...dashboardType.title, fontFamily: fonts.headingBold, color: colors.text },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statGridItem: { width: '47%', flexGrow: 1 },
    statGridItemWide: { width: '23%' },
    settingsGrid: { gap: 0 },
    settingsGridWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 18 },
    primaryColumn: { minWidth: 0 },
    primaryColumnWide: { flex: 1 },
    secondaryColumn: { minWidth: 0 },
    secondaryColumnWide: { width: 370, flexShrink: 0 },
    settingsCard: { padding: 18, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadow.card },
    inputLabel: { ...dashboardType.body, fontFamily: fonts.bodySemiBold, color: colors.text },
    inputHint: { ...dashboardType.bodySmall, fontFamily: fonts.body, color: colors.textMuted, marginTop: 2, marginBottom: 13 },
    companyInputRow: { flexDirection: 'row', alignItems: 'stretch', flexWrap: 'wrap', gap: 10 },
    textInput: { flex: 1, minWidth: 210, minHeight: tokens.control.height, paddingHorizontal: 14, paddingVertical: 11, borderRadius: radius.md, backgroundColor: colors.surfaceRaised, borderWidth: 2, borderColor: colors.border, fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.text },
    textInputFocused: { borderColor: colors.primary },
    textInputError: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
    saveButton: { minWidth: 116 },
    validationSlot: { minHeight: 21, justifyContent: 'flex-end', marginTop: 7 },
    validationError: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: colors.danger },
    validationHint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    preferenceRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12 },
    preferenceMark: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.secondarySoft, borderWidth: 1, borderColor: colors.secondary },
    preferenceMarkText: { fontFamily: fonts.headingBold, fontSize: 20, lineHeight: 24, color: colors.secondary },
    preferenceCopy: { flex: 1, minWidth: 0 },
    preferenceTitle: { ...dashboardType.body, fontFamily: fonts.bodySemiBold, color: colors.text },
    preferenceDescription: { ...dashboardType.bodySmall, fontFamily: fonts.body, color: colors.textMuted, marginTop: 2 },
    accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
    accountMark: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderStrong },
    accountMarkText: { fontFamily: fonts.headingBold, fontSize: 19, lineHeight: 23, color: colors.textMuted },
    accountCopy: { flex: 1, minWidth: 0 },
    fullWidthButton: { width: '100%' },
    developerCard: { padding: 18, borderRadius: radius.lg, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warning, ...shadow.card },
    developerHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    developerLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.65, color: colors.warning },
    developerBudget: { fontFamily: fonts.monoBold, fontSize: 23, lineHeight: 29, color: colors.text, marginTop: 2 },
    testPill: { minHeight: 29, justifyContent: 'center', paddingHorizontal: 9, borderRadius: radius.pill, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.warning },
    testPillText: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.warning },
    developerDescription: { ...dashboardType.bodySmall, fontFamily: fonts.body, color: colors.textMuted, marginTop: 9, marginBottom: 15 },
    dangerDivider: { height: 1, backgroundColor: colors.borderStrong, marginVertical: 12 },
    toast: { position: 'absolute', left: tokens.layout.pageGutter, right: tokens.layout.pageGutter, bottom: tokens.layout.floatingInset, maxWidth: 620, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderRadius: radius.lg, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.secondary, ...shadow.raised },
    toastIcon: { fontFamily: fonts.bodySemiBold, fontSize: 16, lineHeight: 20, color: colors.secondary },
    toastText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19, color: colors.text },
  });
}
