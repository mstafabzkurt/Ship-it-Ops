import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import AssetIcon from '../../src/components/AssetIcon';
import CompanyNameStatus from '../../src/components/company/CompanyNameStatus';
import ProfileCosmetics from '../../src/components/profile/ProfileCosmetics';
import ProfileButton from '../../src/components/profile/ProfileButton';
import ProfileStatCard from '../../src/components/profile/ProfileStatCard';
import ProfileSummaryCard from '../../src/components/profile/ProfileSummaryCard';
import { getDashboardTokens, type DashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { useAuth } from '../../src/state/AuthContext';
import { useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';
import { THEME_METADATA } from '../../src/theme/themes';
import { useCompanyNameAvailability } from '../../src/hooks/useCompanyNameAvailability';
import type { CompanyNameAvailabilityStatus } from '../../src/services/companyName';
import { UI_ICON_ASSETS } from '../../src/config/iconAssets';
import { formatBudget } from '../../src/utils/format';
import { calculateSuccessRate } from '../../src/utils/ranking';
import { trackEvent } from '../../src/utils/telemetry';
import { INTEREST_AREA_OPTIONS, type InterestAreaId } from '../../src/utils/onboarding';
import { COMPANY_NAME_MAX_LENGTH } from '../../src/utils/companyNameValidation';

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
    ownedCosmeticIds,
    equipAvatar,
    equipAvatarFrame,
    equippedAvatar,
    equippedAvatarFrame,
    flushPlayerSave,
    selectedInterestAreas,
    setInterestAreas,
  } = useReputation();
  const { user, signOut } = useAuth();
  const { theme, themeId, setThemeId, resetTheme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const isWide = width >= 900;

  const totalQuestions = correctAnswers + wrongAnswers;
  const winRate = useMemo(
    () => calculateSuccessRate(correctAnswers, wrongAnswers).toFixed(2),
    [correctAnswers, wrongAnswers],
  );

  const [companyInput, setCompanyInput] = useState(companyName);
  const [companySaveFeedback, setCompanySaveFeedback] = useState<{
    status: CompanyNameAvailabilityStatus;
    message: string;
  } | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [interestInput, setInterestInput] = useState<InterestAreaId[]>(selectedInterestAreas);
  const [interestMessage, setInterestMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const companyAvailability = useCompanyNameAvailability(companyInput, {
    currentCompanyName: companyName,
  });
  const companyStatus = companySaveFeedback?.status ?? companyAvailability.status;
  const companyMessage = companySaveFeedback?.message ?? companyAvailability.message;

  useFocusEffect(useCallback(() => {
    void trackEvent('profile_opened');
  }, []));

  useEffect(() => {
    setCompanyInput(companyName);
  }, [companyName]);

  useEffect(() => {
    setInterestInput(selectedInterestAreas);
  }, [selectedInterestAreas]);

  const handleCompanyChange = (value: string) => {
    setCompanyInput(value);
    setCompanySaveFeedback(null);
  };

  const handleSaveCompany = async () => {
    if (!companyAvailability.canSave || isSavingCompany) {
      setCompanySaveFeedback({
        status: companyAvailability.status,
        message: companyAvailability.message,
      });
      return;
    }
    setIsSavingCompany(true);
    const result = await setCompanyName(companyAvailability.displayName);
    setIsSavingCompany(false);
    if (result.status !== 'saved') {
      setCompanySaveFeedback({ status: result.status, message: result.message });
      return;
    }

    setCompanyInput(result.displayName);
    companyAvailability.markSaved(result.displayName);
    setCompanySaveFeedback({ status: 'saved', message: 'Şirket adı kaydedildi.' });
    setShowToast(true);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastAnim, { toValue: 0, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(() => setShowToast(false));
  };

  const handleSaveInterests = () => {
    setInterestAreas(interestInput);
    setInterestMessage('İlgi alanları kaydedildi.');
    void trackEvent('interest_areas_selected', {
      selected_interest_areas: interestInput,
      selected_count: interestInput.length,
      source: 'profile',
    });
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

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setAccountError('');
    setIsSigningOut(true);
    await flushPlayerSave();
    const result = await signOut();

    if (!result.ok) {
      setAccountError(result.error.message);
      setIsSigningOut(false);
    }
    // A successful sign-out is routed to Login by the root protected stack.
  };

  return (
    <View style={styles.background}>
      <View pointerEvents="none" style={styles.topRule} />
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
              companyName={companyName}
              currentRank={currentRank}
              careerXp={careerXp}
              score={score}
              equippedAvatar={equippedAvatar}
              equippedAvatarFrame={equippedAvatarFrame}
            />
            <ProfileCosmetics ownedCosmeticIds={ownedCosmeticIds} avatar={equippedAvatar} frame={equippedAvatarFrame}
              onEquipAvatar={equipAvatar} onEquipFrame={equipAvatarFrame} />

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
                      accessibilityHint={`Şirket adını değiştirir. ${companyMessage}`}
                      value={companyInput}
                      onChangeText={handleCompanyChange}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => {
                        setInputFocused(false);
                      }}
                      placeholder="Şirket adını giriniz..."
                      placeholderTextColor={tokens.colors.textMuted}
                      autoCapitalize="words"
                      maxLength={COMPANY_NAME_MAX_LENGTH}
                      style={[
                        styles.textInput,
                        inputFocused && styles.textInputFocused,
                        (companyStatus === 'available' || companyStatus === 'saved') && styles.textInputAvailable,
                        (companyStatus === 'invalid' || companyStatus === 'unavailable' || companyStatus === 'error') && styles.textInputError,
                      ]}
                    />
                    <ProfileButton
                      disabled={!companyAvailability.canSave || isSavingCompany}
                      label={isSavingCompany ? 'Kaydediliyor...' : 'Kaydet'}
                      onPress={() => void handleSaveCompany()}
                      style={styles.saveButton}
                      variant={!companyAvailability.canSave || isSavingCompany ? 'disabled' : 'primary'}
                    />
                  </View>
                  <View style={styles.validationSlot}>
                    <CompanyNameStatus
                      message={companyMessage}
                      onRetry={() => {
                        setCompanySaveFeedback(null);
                        companyAvailability.retry();
                      }}
                      status={companyStatus}
                    />
                  </View>
                  <View style={styles.settingsDivider} />
                  <Text style={styles.inputLabel}>Görünüm</Text>
                  <Text style={styles.inputHint}>Ücretsiz operasyon alanını seç. Ücretli temaları Mağaza’dan yönetebilirsin.</Text>
                  <View style={styles.themePreferenceList}>
                    {(['default', 'daylight'] as const).map((id) => {
                      const selected = themeId === id;
                      const metadata = THEME_METADATA[id];
                      return (
                        <Pressable
                          key={id}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          accessibilityLabel={`${metadata.title}. ${metadata.description}`}
                          onPress={() => {
                            if (selected) return;
                            void setThemeId(id).then(() => {
                              void trackEvent('theme_equipped', { theme_id: id });
                            });
                          }}
                          style={({ pressed }) => [styles.themePreference, selected && styles.themePreferenceSelected, pressed && styles.pressed]}
                        >
                          <View style={[styles.themePreferenceIcon, selected && styles.themePreferenceIconSelected]}>
                            <Ionicons
                              accessibilityElementsHidden
                              importantForAccessibility="no-hide-descendants"
                              name={id === 'daylight' ? 'sunny-outline' : 'moon-outline'}
                              size={20}
                              color={selected ? tokens.colors.primary : tokens.colors.textMuted}
                            />
                          </View>
                          <View style={styles.themePreferenceCopy}>
                            <Text style={[styles.themePreferenceTitle, selected && styles.themePreferenceTitleSelected]}>{metadata.title}</Text>
                            <Text style={styles.themePreferenceDescription}>{metadata.description}</Text>
                          </View>
                          <Ionicons
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                            size={21}
                            color={selected ? tokens.colors.primary : tokens.colors.textMuted}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.settingsDivider} />
                  <Text style={styles.inputLabel}>İlgi Alanları</Text>
                  <Text style={styles.inputHint}>Gelecek içerik önerileri için bir veya daha fazla alan seçebilirsin.</Text>
                  <View style={styles.interestList}>
                    {INTEREST_AREA_OPTIONS.map((option) => {
                      const selected = interestInput.includes(option.id);
                      return (
                        <Pressable
                          key={option.id}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                          onPress={() => {
                            setInterestMessage('');
                            setInterestInput((current) => current.includes(option.id)
                              ? current.filter((id) => id !== option.id)
                              : [...current, option.id]);
                          }}
                          style={({ pressed }) => [styles.interestOption, selected && styles.interestOptionSelected, pressed && styles.pressed]}
                        >
                          <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name={option.icon} size={19} color={selected ? tokens.colors.primary : tokens.colors.textMuted} />
                          <Text style={[styles.interestOptionText, selected && styles.interestOptionTextSelected]}>{option.label}</Text>
                          <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={selected ? tokens.colors.primary : tokens.colors.textMuted} />
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.interestFooter}>
                    <Text accessibilityLiveRegion="polite" style={styles.validationHint}>{interestMessage}</Text>
                    <ProfileButton label="İlgi Alanlarını Kaydet" onPress={handleSaveInterests} style={styles.interestSaveButton} />
                  </View>
                </View>
              </View>

              <View style={[styles.secondaryColumn, isWide && styles.secondaryColumnWide]}>
                <SectionHeading eyebrow="HESAP" title="Oturum Bilgileri" styles={styles} compact />
                <View style={styles.settingsCard}>
                  <View style={styles.accountRow}>
                    <View style={styles.accountMark}><Ionicons name="shield-checkmark-outline" size={21} color={tokens.colors.secondary} /></View>
                    <View style={styles.accountCopy}>
                      <Text style={styles.accountEmail}>{user?.email || 'E-posta bilgisi bulunamadı'}</Text>
                      <View style={styles.accountStatusRow}>
                        <View style={styles.accountStatusDot} />
                        <Text style={styles.accountStatusText}>Oturum açık</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.accountDescription}>Çıkış yapmak bu cihazdaki Kariyer XP, İtibar, bütçe veya envanteri silmez.</Text>
                  {accountError ? (
                    <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.accountError}>{accountError}</Text>
                  ) : null}
                  <ProfileButton
                    label={isSigningOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
                    variant={isSigningOut ? 'disabled' : 'danger'}
                    disabled={isSigningOut}
                    onPress={() => void handleSignOut()}
                    style={styles.fullWidthButton}
                  />
                </View>

                {__DEV__ ? (
                  <>
                    <SectionHeading eyebrow="TEST / DEBUG" title="Geliştirici Araçları" styles={styles} compact />
                    <View style={styles.developerCard}>
                      <View style={styles.developerHeader}>
                        <View>
                          <Text style={styles.developerLabel}>ŞİRKET BÜTÇESİ</Text>
                          <View style={styles.developerBudgetRow}>
                            <AssetIcon source={UI_ICON_ASSETS.coin} fallbackName="wallet-outline" fallbackColor={tokens.colors.warning} size={22} />
                            <Text style={styles.developerBudget}>{formatBudget(budget)}</Text>
                          </View>
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
            <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name="checkmark-circle" size={19} color={tokens.colors.success} />
            <Text style={styles.toastText}>Şirket adı kaydedildi.</Text>
          </Animated.View>
        ) : null}
      </SafeAreaView>
    </View>
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
      <View>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionRule} />
    </View>
  );
}

function makeStyles(tokens: DashboardTokens) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    topRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, opacity: 0.5 },
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: tokens.layout.pageBottom },
    container: { width: '100%', maxWidth: tokens.layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: tokens.layout.pageGutter, paddingTop: tokens.layout.pageTop },
    containerWide: { paddingHorizontal: tokens.layout.pageGutterWide },
    pageHeader: { marginBottom: tokens.layout.isCompact ? 10 : 18 },
    eyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.secondary, marginBottom: 4 },
    headerTitle: { ...tokens.type.display, fontFamily: fonts.headingBold, color: colors.text },
    sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: tokens.layout.isCompact ? 20 : 32, marginBottom: tokens.layout.isCompact ? 9 : 13 },
    sectionHeadingCompact: { marginTop: tokens.layout.isCompact ? 16 : 24 },
    sectionEyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.textMuted, marginBottom: 2 },
    sectionTitle: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text },
    sectionRule: { flex: 1, height: 1, marginBottom: 5, backgroundColor: colors.dividerSubtle },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 8 : 12 },
    statGridItem: { width: '47%', flexGrow: 1 },
    statGridItemWide: { width: '23%' },
    settingsGrid: { gap: 0 },
    settingsGridWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 18 },
    primaryColumn: { minWidth: 0 },
    primaryColumnWide: { flex: 1 },
    secondaryColumn: { minWidth: 0 },
    secondaryColumnWide: { width: 370, flexShrink: 0 },
    settingsCard: { padding: tokens.layout.isCompact ? 13 : 17, borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    inputLabel: { ...tokens.type.body, fontFamily: fonts.bodySemiBold, color: colors.text },
    inputHint: { ...tokens.type.bodySmall, fontFamily: fonts.body, color: colors.textMuted, marginTop: 2, marginBottom: tokens.layout.isCompact ? 9 : 13 },
    companyInputRow: { flexDirection: 'row', alignItems: 'stretch', flexWrap: 'wrap', gap: 10 },
    textInput: { flex: 1, minWidth: 210, minHeight: tokens.control.height, paddingHorizontal: 14, paddingVertical: 11, borderRadius: radius.sm, backgroundColor: colors.secondarySurfaceRaised, borderWidth: 1, borderColor: colors.borderStrong, fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.text },
    textInputFocused: { borderColor: colors.primary },
    textInputAvailable: { borderColor: colors.success, backgroundColor: colors.successSoft },
    textInputError: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
    saveButton: { minWidth: 116 },
    validationSlot: { minHeight: 21, justifyContent: 'flex-end', marginTop: 7 },
    validationHint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    settingsDivider: { height: 1, marginVertical: 16, backgroundColor: colors.dividerSubtle },
    themePreferenceList: { gap: 8 },
    themePreference: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 11, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurfaceRaised },
    themePreferenceSelected: { borderColor: colors.selectionBorder, backgroundColor: colors.selectionBackground },
    themePreferenceIcon: { width: 38, height: 38, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.surfaceSoft },
    themePreferenceIconSelected: { backgroundColor: colors.primarySoft },
    themePreferenceCopy: { flex: 1, minWidth: 0 },
    themePreferenceTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, color: colors.text },
    themePreferenceTitleSelected: { color: colors.primary },
    themePreferenceDescription: { marginTop: 2, fontFamily: fonts.body, fontSize: 11, lineHeight: 16, color: colors.textMuted },
    interestList: { gap: 8 },
    interestOption: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurfaceRaised },
    interestOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    interestOptionText: { flex: 1, minWidth: 0, color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
    interestOptionTextSelected: { color: colors.primary },
    interestFooter: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
    interestSaveButton: { minWidth: 178 },
    pressed: { opacity: 0.72 },
    accountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: tokens.layout.isCompact ? 11 : 15 },
    accountMark: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySurfaceRaised, borderWidth: 1, borderColor: colors.borderSubtle },
    accountCopy: { flex: 1, minWidth: 0 },
    accountEmail: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20, color: colors.text, flexShrink: 1 },
    accountStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 3 },
    accountStatusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.secondary },
    accountStatusText: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: colors.secondary },
    accountDescription: { ...tokens.type.bodySmall, fontFamily: fonts.body, color: colors.textMuted, marginBottom: 12 },
    accountError: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: colors.danger, marginBottom: 10 },
    fullWidthButton: { width: '100%' },
    developerCard: { padding: tokens.layout.isCompact ? 14 : 18, borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle, borderLeftWidth: 3, borderLeftColor: colors.warning },
    developerHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    developerLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.65, color: colors.warning },
    developerBudgetRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    developerBudget: { fontFamily: fonts.monoBold, fontSize: 23, lineHeight: 29, color: colors.text },
    testPill: { minHeight: 29, justifyContent: 'center', paddingHorizontal: 9, borderRadius: radius.sm, backgroundColor: colors.secondarySurfaceRaised, borderWidth: 1, borderColor: colors.warning },
    testPillText: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.warning },
    developerDescription: { ...tokens.type.bodySmall, fontFamily: fonts.body, color: colors.textMuted, marginTop: 7, marginBottom: 11 },
    dangerDivider: { height: 1, backgroundColor: colors.dividerSubtle, marginVertical: 12 },
    toast: { position: 'absolute', left: tokens.layout.pageGutter, right: tokens.layout.pageGutter, bottom: tokens.layout.floatingInset, maxWidth: 620, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderRadius: radius.lg, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.secondary, ...shadow.raised },
    toastIcon: { fontFamily: fonts.bodySemiBold, fontSize: 16, lineHeight: 20, color: colors.secondary },
    toastText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19, color: colors.text },
  });
}
