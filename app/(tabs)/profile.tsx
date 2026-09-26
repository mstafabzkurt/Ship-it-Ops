import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
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
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import CompanyNameStatus from '../../src/components/company/CompanyNameStatus';
import ProfileButton from '../../src/components/profile/ProfileButton';
import ProfileSupport from '../../src/components/profile/ProfileSupport';
import ProfileSummaryCard from '../../src/components/profile/ProfileSummaryCard';
import { getDashboardTokens, type DashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { useAuth } from '../../src/state/AuthContext';
import { useMessagingUnread } from '../../src/state/MessagingUnreadContext';
import { useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';
import { useCompanyNameAvailability } from '../../src/hooks/useCompanyNameAvailability';
import type { CompanyNameAvailabilityStatus } from '../../src/services/companyName';
import { countIncomingFriendRequests } from '../../src/services/friends';
import { trackEvent } from '../../src/utils/telemetry';
import { INTEREST_AREA_OPTIONS, type InterestAreaId } from '../../src/utils/onboarding';
import { COMPANY_NAME_MAX_LENGTH } from '../../src/utils/companyNameValidation';

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const {
    companyName,
    setCompanyName,
    currentRank,
    addBudget,
    resetProgress,
    flushPlayerSave,
    equippedAvatar,
    equippedAvatarFrame,
    selectedInterestAreas,
    setInterestAreas,
  } = useReputation();
  const { user, signOut } = useAuth();
  const { unreadCount: unreadMessageCount } = useMessagingUnread();
  const { theme, resetTheme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const isWide = width >= 900;

  const [companyInput, setCompanyInput] = useState(companyName);
  const [companySaveFeedback, setCompanySaveFeedback] = useState<{
    status: CompanyNameAvailabilityStatus;
    message: string;
  } | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [interestModalVisible, setInterestModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const logoutPendingRef = useRef(false);
  const [interestInput, setInterestInput] = useState<InterestAreaId[]>(selectedInterestAreas);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [incomingRequestCount, setIncomingRequestCount] = useState(0);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const companyAvailability = useCompanyNameAvailability(companyInput, {
    currentCompanyName: companyName,
  });
  const companyStatus = companySaveFeedback?.status ?? companyAvailability.status;
  const companyMessage = companySaveFeedback?.message ?? companyAvailability.message;

  useFocusEffect(useCallback(() => {
    let isActive = true;
    void trackEvent('profile_opened');
    if (user?.id) {
      void countIncomingFriendRequests(user.id).then((count) => {
        if (!isActive) return;
        setIncomingRequestCount(count);
      }).catch(() => {
        if (isActive) setIncomingRequestCount(0);
      });
    }
    return () => { isActive = false; };
  }, [user?.id]));

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

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    toastAnim.stopAnimation();
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastAnim, { toValue: 0, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(() => setShowToast(false));
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
    showSuccessToast('Şirket adı kaydedildi.');
  };

  const handleSaveInterests = () => {
    setInterestAreas(interestInput);
    void trackEvent('interest_areas_selected', {
      selected_interest_areas: interestInput,
      selected_count: interestInput.length,
      source: 'profile',
    });
    setInterestModalVisible(false);
    showSuccessToast('İlgi alanı tercihleri kaydedildi.');
  };

  const openInterestModal = () => {
    setInterestInput(selectedInterestAreas);
    setInterestModalVisible(true);
  };

  const closeInterestModal = () => {
    setInterestInput(selectedInterestAreas);
    setInterestModalVisible(false);
  };

  const openLogoutModal = () => {
    if (logoutPendingRef.current) return;
    setLogoutError('');
    setLogoutModalVisible(true);
  };

  const closeLogoutModal = () => {
    if (!logoutPendingRef.current) setLogoutModalVisible(false);
  };

  const handleConfirmLogout = async () => {
    if (logoutPendingRef.current) return;
    logoutPendingRef.current = true;
    setIsLoggingOut(true);
    setLogoutError('');
    try {
      await flushPlayerSave();
      const result = await signOut();
      if (!result.ok) {
        setLogoutError('Çıkış yapılamadı. Tekrar dene.');
        return;
      }
      setLogoutModalVisible(false);
    } catch {
      setLogoutError('Çıkış yapılamadı. Tekrar dene.');
    } finally {
      logoutPendingRef.current = false;
      setIsLoggingOut(false);
    }
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
            <ProfileSummaryCard
              companyName={companyName}
              currentRank={currentRank}
              equippedAvatar={equippedAvatar}
              equippedAvatarFrame={equippedAvatarFrame}
            />

            <SectionHeading title="Bağlantılar ve Arşiv" styles={styles} compact />
            <View style={styles.socialGroup}>
              <SocialEntry
                accessibilityLabel="Şirket Ara. Başka oyuncuların herkese açık şirket profillerini bul."
                icon="search"
                onPress={() => router.push('/company-search')}
                subtitle="Herkese açık şirket profillerini bul"
                title="Şirket Ara"
                styles={styles}
                tokens={tokens}
              />
              <SocialEntry
                accessibilityLabel="Arkadaşlar listesini aç"
                icon="people-outline"
                onPress={() => router.push('/friends')}
                subtitle="Bağlantılarını görüntüle"
                title="Arkadaşlar"
                styles={styles}
                tokens={tokens}
              />
              <SocialEntry
                accessibilityLabel={incomingRequestCount > 0
                  ? `Gelen İstekler. ${incomingRequestCount} bekleyen arkadaşlık isteği var.`
                  : 'Gelen İstekler. Bekleyen arkadaşlık isteği yok.'}
                badgeCount={incomingRequestCount}
                icon="mail-unread-outline"
                onPress={() => router.push('/friend-requests')}
                subtitle="Bekleyen istekleri değerlendir"
                title="Gelen İstekler"
                styles={styles}
                tokens={tokens}
              />
              <SocialEntry
                accessibilityLabel={unreadMessageCount > 0
                  ? `Mesajlar. ${unreadMessageCount} okunmamış mesaj var.`
                  : 'Mesajlar. Okunmamış mesaj yok.'}
                badgeCount={unreadMessageCount}
                icon="chatbubbles-outline"
                onPress={() => router.push('/messages')}
                subtitle="Arkadaşlarınla güvenli sohbet et"
                title="Mesajlar"
                styles={styles}
                tokens={tokens}
              />
              <SocialEntry
                accessibilityLabel="Favori Sorular arşivini aç"
                icon="star-outline"
                onPress={() => router.push('/favorite-questions')}
                subtitle="Kaydettiğin soruları yeniden incele"
                title="Favori Sorular"
                styles={styles}
                tokens={tokens}
              />
              <SocialEntry
                accessibilityLabel="Paylaşılan Sorular gelen kutusunu aç"
                icon="paper-plane-outline"
                onPress={() => router.push('/shared-questions')}
                subtitle="Arkadaşlarından gelen soruları görüntüle"
                title="Paylaşılan Sorular"
                styles={styles}
                tokens={tokens}
              />
            </View>

            <View style={[styles.settingsGrid, isWide && styles.settingsGridWide]}>
              <View style={[styles.primaryColumn, isWide && styles.primaryColumnWide]}>
                <View style={styles.settingsPanel}>
                  <Pressable accessibilityRole="button" accessibilityState={{ expanded: settingsExpanded }} onPress={() => setSettingsExpanded(value => !value)} style={({ pressed }) => [styles.settingsToggle, pressed && styles.pressed]}>
                    <Text style={styles.sectionTitle}>Profil Ayarları</Text>
                    <Ionicons name={settingsExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={tokens.colors.textMuted} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
                  </Pressable>
                  {settingsExpanded ? (
                    <View style={styles.settingsCard}>
                      <Text style={styles.inputLabel}>Şirket Adı</Text>
                      <Text style={styles.inputHint}>Uygulamada görünen şirket adın.</Text>
                      <View style={styles.companyInputRow}>
                        <TextInput
                          accessibilityLabel="Şirket adı"
                          accessibilityHint={`Şirket adını değiştirir. ${companyMessage}`}
                          value={companyInput}
                          onChangeText={handleCompanyChange}
                          onFocus={() => setInputFocused(true)}
                          onBlur={() => setInputFocused(false)}
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
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="İlgi Alanı Tercihleri. Kategorileri ve çalışma odağını güncelle. Tercihleri Güncelle"
                        onPress={openInterestModal}
                        style={({ pressed }) => [styles.interestPreferenceRow, pressed && styles.pressed]}
                      >
                        <View style={styles.preferenceIcon}>
                          <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name="options-outline" size={19} color={tokens.colors.primary} />
                        </View>
                        <View style={styles.preferenceCopy}>
                          <Text style={styles.preferenceTitle}>İlgi Alanı Tercihleri</Text>
                          <Text style={styles.preferenceSubtitle}>Kategorileri ve çalışma odağını güncelle</Text>
                          <Text style={styles.preferenceAction}>Tercihleri Güncelle</Text>
                        </View>
                        <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name="chevron-forward" size={19} color={tokens.colors.textMuted} />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={[styles.secondaryColumn, isWide && styles.secondaryColumnWide]}>
                <ProfileSupport accountId={user?.id} />

                <View style={styles.accountActions}>
                  <Text style={styles.accountEyebrow}>HESAP</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Çıkış Yap"
                    accessibilityState={{ disabled: isLoggingOut }}
                    disabled={isLoggingOut}
                    onPress={openLogoutModal}
                    style={({ pressed }) => [styles.logoutRow, pressed && styles.pressed]}
                  >
                    <Ionicons name="log-out-outline" size={20} color={tokens.colors.danger} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
                    <Text style={styles.logoutLabel}>Çıkış Yap</Text>
                    <Ionicons name="chevron-forward" size={18} color={tokens.colors.textMuted} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
                  </Pressable>
                </View>

                {__DEV__ ? (
                  <>
                    <SectionHeading eyebrow="TEST / DEBUG" title="Geliştirici Araçları" styles={styles} compact />
                    <View style={styles.developerCard}>
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

        <Modal visible={interestModalVisible} transparent animationType="none" onRequestClose={closeInterestModal}>
          <SafeAreaView style={styles.preferenceScrim}>
            <View accessibilityViewIsModal style={styles.preferenceSheet}>
              <View style={styles.preferenceHeader}>
                <View style={styles.preferenceHeaderCopy}>
                  <Text accessibilityRole="header" style={styles.preferenceSheetTitle}>İlgi Alanı Tercihleri</Text>
                  <Text style={styles.preferenceSheetSubtitle}>Kategorileri ve çalışma odağını güncelle</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Kapat" onPress={closeInterestModal} style={({ pressed }) => [styles.preferenceClose, pressed && styles.pressed]}>
                  <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name="close" size={24} color={tokens.colors.text} />
                </Pressable>
              </View>
              <ScrollView style={styles.preferenceScroll} contentContainerStyle={styles.preferenceContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text accessibilityLiveRegion="polite" style={styles.selectedCount}>Seçili alan: {interestInput.length}</Text>
                <View style={styles.interestGrid}>
                  {INTEREST_AREA_OPTIONS.map((option) => {
                    const selected = interestInput.includes(option.id);
                    return (
                      <Pressable
                        key={option.id}
                        accessibilityRole="checkbox"
                        accessibilityLabel={option.label}
                        accessibilityState={{ checked: selected }}
                        onPress={() => setInterestInput((current) => current.includes(option.id)
                          ? current.filter((id) => id !== option.id)
                          : [...current, option.id])}
                        style={({ pressed }) => [
                          styles.interestTile,
                          width < 700 && styles.interestTileMobile,
                          width < 350 && styles.interestTileNarrow,
                          selected && styles.interestTileSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View style={styles.interestTileTop}>
                          <View style={[styles.interestTileIcon, selected && styles.interestTileIconSelected]}>
                            <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name={option.icon} size={19} color={selected ? tokens.colors.primary : tokens.colors.textSecondary} />
                          </View>
                          <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={selected ? tokens.colors.primary : tokens.colors.textMuted} />
                        </View>
                        <Text style={[styles.interestTileText, selected && styles.interestTileTextSelected]}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              <View style={styles.preferenceFooter}>
                <Pressable accessibilityRole="button" onPress={closeInterestModal} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
                  <Text style={styles.cancelButtonText}>Vazgeç</Text>
                </Pressable>
                <ProfileButton label="Kaydet" onPress={handleSaveInterests} style={styles.modalSaveButton} />
              </View>
            </View>
          </SafeAreaView>
        </Modal>

        <Modal visible={logoutModalVisible} transparent animationType="fade" onRequestClose={closeLogoutModal}>
          <SafeAreaView style={styles.logoutScrim}>
            <View accessibilityViewIsModal style={styles.logoutDialog}>
              <Text accessibilityRole="header" style={styles.logoutTitle}>Çıkış Yap</Text>
              <Text style={styles.logoutBody}>Bu hesaptan çıkış yapmak istediğine emin misin?</Text>
              {logoutError ? <Text accessibilityRole="alert" style={styles.logoutError}>{logoutError}</Text> : null}
              <View style={styles.logoutActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isLoggingOut }}
                  disabled={isLoggingOut}
                  onPress={closeLogoutModal}
                  style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
                >
                  <Text style={styles.cancelButtonText}>Vazgeç</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isLoggingOut, busy: isLoggingOut }}
                  disabled={isLoggingOut}
                  onPress={() => void handleConfirmLogout()}
                  style={({ pressed }) => [styles.logoutConfirm, pressed && styles.pressed, isLoggingOut && styles.logoutConfirmDisabled]}
                >
                  <Text style={styles.logoutConfirmText}>{isLoggingOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}</Text>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </Modal>

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
            <Text style={styles.toastText}>{toastMessage}</Text>
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
  eyebrow?: string;
  title: string;
  styles: ReturnType<typeof makeStyles>;
  compact?: boolean;
}) {
  return (
    <View style={[styles.sectionHeading, compact && styles.sectionHeadingCompact]}>
      <View>
        {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionRule} />
    </View>
  );
}

function SocialEntry({ accessibilityLabel, badgeCount = 0, icon, onPress, styles, subtitle, title, tokens }: {
  accessibilityLabel: string;
  badgeCount?: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  subtitle: string;
  title: string;
  tokens: DashboardTokens;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.socialEntry, pressed && styles.socialEntryPressed]}
    >
      <View style={styles.socialEntryIcon}>
        <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name={icon} size={20} color={tokens.colors.secondary} />
      </View>
      <View style={styles.socialEntryCopy}>
        <Text style={styles.socialEntryTitle}>{title}</Text>
        <Text style={styles.socialEntryText}>{subtitle}</Text>
      </View>
      {badgeCount > 0 ? (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.socialBadge}>
          <Text style={styles.socialBadgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      ) : null}
      <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name="chevron-forward" size={20} color={tokens.colors.textMuted} />
    </Pressable>
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
    container: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: tokens.layout.pageGutter, paddingTop: tokens.layout.pageTop },
    containerWide: { paddingHorizontal: tokens.layout.pageGutterWide },
    socialGroup: { overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    socialEntry: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.dividerSubtle },
    socialEntryPressed: { opacity: 0.82, borderColor: colors.borderStrong, backgroundColor: colors.surfacePressed },
    socialEntryIcon: { width: 42, height: 42, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySoft },
    socialEntryCopy: { flex: 1, minWidth: 0 },
    socialEntryTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 20, color: colors.text },
    socialEntryText: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    socialBadge: { minWidth: 28, height: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, borderRadius: radius.pill, backgroundColor: colors.primary },
    socialBadgeText: { color: colors.foregroundOnAction, fontFamily: fonts.monoBold, fontSize: 11, lineHeight: 15 },
    sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: tokens.layout.isCompact ? 20 : 32, marginBottom: tokens.layout.isCompact ? 9 : 13 },
    sectionHeadingCompact: { marginTop: tokens.layout.isCompact ? 16 : 24 },
    sectionEyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.textMuted, marginBottom: 2 },
    sectionTitle: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text },
    sectionRule: { flex: 1, height: 1, marginBottom: 5, backgroundColor: colors.dividerSubtle },
    settingsPanel: { marginTop: 16, borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden' },
    settingsToggle: { minHeight: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingHorizontal: tokens.layout.isCompact ? 13 : 17 },
    settingsGrid: { gap: 0 },
    settingsGridWide: { gap: 0 },
    primaryColumn: { minWidth: 0 },
    primaryColumnWide: { width: '100%' },
    secondaryColumn: { minWidth: 0 },
    secondaryColumnWide: { width: '100%' },
    settingsCard: { padding: tokens.layout.isCompact ? 13 : 17, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.dividerSubtle },
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
    accountActions: { marginTop: 20 },
    accountEyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.textMuted, marginBottom: 8 },
    logoutRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurface },
    logoutLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20, color: colors.danger },
    logoutScrim: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, backgroundColor: colors.overlayScrim },
    logoutDialog: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: 20, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface },
    logoutTitle: { fontFamily: fonts.headingBold, fontSize: 20, lineHeight: 26, color: colors.text },
    logoutBody: { marginTop: 8, fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.textSecondary },
    logoutError: { marginTop: 12, fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19, color: colors.danger },
    logoutActions: { flexDirection: 'row', gap: 10, marginTop: 22 },
    logoutConfirm: { flex: 1, minHeight: tokens.control.height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.dangerSoft },
    logoutConfirmDisabled: { opacity: 0.6 },
    logoutConfirmText: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, color: colors.danger },
    interestPreferenceRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurfaceRaised },
    preferenceIcon: { width: 38, height: 38, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.primarySoft },
    preferenceCopy: { flex: 1, minWidth: 0 },
    preferenceTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 19, color: colors.text },
    preferenceSubtitle: { marginTop: 1, fontFamily: fonts.body, fontSize: 11, lineHeight: 16, color: colors.textMuted },
    preferenceAction: { marginTop: 3, fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.primary },
    preferenceScrim: { flex: 1, justifyContent: tokens.layout.isCompact ? 'flex-end' : 'center', padding: tokens.layout.isCompact ? 0 : 16, backgroundColor: colors.overlayScrim },
    preferenceSheet: { width: '100%', maxWidth: 560, maxHeight: '90%', alignSelf: 'center', flexShrink: 1, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, overflow: 'hidden' },
    preferenceHeader: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 18, paddingRight: 8, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.dividerSubtle },
    preferenceHeaderCopy: { flex: 1, minWidth: 0 },
    preferenceSheetTitle: { fontFamily: fonts.headingBold, fontSize: 19, lineHeight: 25, color: colors.text },
    preferenceSheetSubtitle: { marginTop: 1, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    preferenceClose: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    preferenceScroll: { flexShrink: 1 },
    preferenceContent: { padding: tokens.layout.isCompact ? 12 : 16 },
    selectedCount: { marginBottom: 9, fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 16, color: colors.textMuted },
    interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    interestTile: { width: '31.5%', minHeight: 92, justifyContent: 'space-between', padding: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurfaceRaised },
    interestTileMobile: { width: '48.5%' },
    interestTileNarrow: { width: '100%', minHeight: 76 },
    interestTileSelected: { borderColor: colors.selectionBorder, backgroundColor: colors.selectionBackground },
    interestTileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    interestTileIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.borderSubtle },
    interestTileIconSelected: { backgroundColor: colors.primarySoft, borderColor: colors.selectionBorder },
    interestTileText: { marginTop: 8, flexShrink: 1, fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 16, color: colors.text },
    interestTileTextSelected: { color: colors.primary },
    preferenceFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.dividerSubtle, backgroundColor: colors.surfaceRaised },
    cancelButton: { flex: 1, minHeight: tokens.control.height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSoft },
    cancelButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, color: colors.text },
    modalSaveButton: { flex: 1 },
    pressed: { opacity: 0.72 },
    fullWidthButton: { width: '100%' },
    developerCard: { padding: tokens.layout.isCompact ? 14 : 18, borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle, borderLeftWidth: 3, borderLeftColor: colors.warning },
    developerDescription: { ...tokens.type.bodySmall, fontFamily: fonts.body, color: colors.textMuted, marginTop: 7, marginBottom: 11 },
    dangerDivider: { height: 1, backgroundColor: colors.dividerSubtle, marginVertical: 12 },
    toast: { position: 'absolute', left: tokens.layout.pageGutter, right: tokens.layout.pageGutter, bottom: tokens.layout.floatingInset, maxWidth: 620, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderRadius: radius.lg, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.secondary, ...shadow.raised },
    toastIcon: { fontFamily: fonts.bodySemiBold, fontSize: 16, lineHeight: 20, color: colors.secondary },
    toastText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19, color: colors.text },
  });
}
