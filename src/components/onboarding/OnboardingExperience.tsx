import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CompanyNameStatus from '../company/CompanyNameStatus';
import {
  type AvatarCosmetic,
  type AvatarCosmeticId,
  type AvatarFrameCosmetic,
  type AvatarFrameCosmeticId,
} from '../../config/cosmetics';
import { useCompanyNameAvailability } from '../../hooks/useCompanyNameAvailability';
import { useOnboardingViewport } from '../../hooks/useOnboardingViewport';
import type { CompanyNameAvailabilityStatus } from '../../services/companyName';
import { useAuth } from '../../state/AuthContext';
import { useReputation } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { THEMES, THEME_METADATA, type Theme } from '../../theme/themes';
import { fonts } from '../../theme/typography';
import {
  INTEREST_AREA_OPTIONS,
  getStarterAvatars,
  getStarterFrames,
  getOnboardingPanelWidth,
  ONBOARDING_STEP_COUNT,
  type InterestAreaId,
} from '../../utils/onboarding';
import { COMPANY_NAME_MAX_LENGTH } from '../../utils/companyNameValidation';
import { suggestCompanyName } from '../../utils/companyNameSuggestions';
import { trackEvent } from '../../utils/telemetry';
import CosmeticPreview from '../cosmetics/CosmeticPreview';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

export default function OnboardingExperience() {
  const { user } = useAuth();
  const {
    completeOnboarding,
    equippedAvatarFrameId,
    equippedAvatarId,
    onboardingCompleted,
    ownedCosmeticIds,
    selectedInterestAreas,
    skipOnboarding,
  } = useReputation();
  const { theme, themeId, setThemeId } = useTheme();
  const { width, height } = useOnboardingViewport();
  const starterAvatars = useMemo(() => getStarterAvatars(ownedCosmeticIds), [ownedCosmeticIds]);
  const starterFrames = useMemo(() => getStarterFrames(ownedCosmeticIds), [ownedCosmeticIds]);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [themeDraft, setThemeDraft] = useState<Theme['id']>(themeId);
  const [companyDraft, setCompanyDraft] = useState('');
  const [avatarDraft, setAvatarDraft] = useState<AvatarCosmeticId>(
    starterAvatars.some((item) => item.id === equippedAvatarId)
      ? equippedAvatarId
      : starterAvatars[0]?.id ?? 'avatar_default',
  );
  const [frameDraft, setFrameDraft] = useState<AvatarFrameCosmeticId>(
    starterFrames.some((item) => item.id === equippedAvatarFrameId)
      ? equippedAvatarFrameId
      : starterFrames[0]?.id ?? 'avatar_frame_default',
  );
  const [interestDraft, setInterestDraft] = useState<InterestAreaId[]>(selectedInterestAreas);
  const [companyError, setCompanyError] = useState('');
  const [companySubmissionFeedback, setCompanySubmissionFeedback] = useState<{
    status: CompanyNameAvailabilityStatus;
    message: string;
  } | null>(null);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const onboardingStarted = useRef(false);
  const showOnboarding = !onboardingCompleted;
  const previewTheme = onboardingStep === 2 ? THEMES[themeDraft] : theme;
  const tokens = useMemo(() => getDashboardTokens(previewTheme, width), [previewTheme, width]);
  const styles = useMemo(() => makeStyles(tokens, width, height), [tokens, width, height]);
  const companyAvailability = useCompanyNameAvailability(companyDraft, {
    enabled: onboardingStep === 1,
  });
  const companyStepBlocked = onboardingStep === 1 && !companyAvailability.canSave;

  useEffect(() => {
    if (!showOnboarding || onboardingStarted.current) return;
    onboardingStarted.current = true;
    void trackEvent('onboarding_started', { step_count: ONBOARDING_STEP_COUNT });
  }, [showOnboarding]);

  const skipCurrentOnboarding = () => {
    if (isSavingCompany) return;
    void trackEvent('onboarding_skipped', {
      step_count: ONBOARDING_STEP_COUNT,
      skipped_at_step: onboardingStep + 1,
    });
    skipOnboarding();
  };

  const advanceOnboarding = async () => {
    if (onboardingStep === 1) {
      if (!companyAvailability.canSave) {
        setCompanyError(companyAvailability.message);
        return;
      }
      setCompanyDraft(companyAvailability.displayName);
      setCompanyError('');
      setCompanySubmissionFeedback(null);
    }

    if (onboardingStep === 2) {
      await setThemeId(themeDraft);
    }

    if (onboardingStep < ONBOARDING_STEP_COUNT - 1) {
      setOnboardingStep((step) => step + 1);
      return;
    }

    setIsSavingCompany(true);
    const result = await completeOnboarding({
      companyName: companyDraft,
      avatarId: avatarDraft,
      avatarFrameId: frameDraft,
      selectedInterestAreas: interestDraft,
    });
    setIsSavingCompany(false);
    if (result.status !== 'saved') {
      setCompanyError(result.message);
      setCompanySubmissionFeedback({ status: result.status, message: result.message });
      setOnboardingStep(1);
      return;
    }
    void trackEvent('interest_areas_selected', {
      selected_interest_areas: interestDraft,
      selected_count: interestDraft.length,
    });
    void trackEvent('onboarding_completed', { step_count: ONBOARDING_STEP_COUNT });
  };

  if (!user || !showOnboarding) return null;

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => undefined}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardArea}
        >
          <View style={styles.centerer}>
            <View accessibilityViewIsModal style={styles.panel}>
              <View style={styles.technicalRail} />
              <View style={styles.header}>
                <View style={styles.headerCopy}>
                  <Text style={styles.eyebrow}>
                    KURULUM PROTOKOLÜ
                  </Text>
                  <Text accessibilityLiveRegion="polite" style={styles.stepLabel}>
                    ADIM {onboardingStep + 1} / {ONBOARDING_STEP_COUNT}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Onboarding akışını atla"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isSavingCompany }}
                  disabled={isSavingCompany}
                  hitSlop={8}
                  onPress={skipCurrentOnboarding}
                  style={({ pressed }) => [styles.skipButton, isSavingCompany && styles.controlDisabled, pressed && styles.pressed]}
                >
                  <Text style={styles.skipText}>Atla</Text>
                </Pressable>
              </View>
              <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: ONBOARDING_STEP_COUNT, now: onboardingStep + 1 }} style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${((onboardingStep + 1) / ONBOARDING_STEP_COUNT) * 100}%` }]} />
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.stepContent}>
                  {renderOnboardingStep({
                    avatarDraft,
                    companyDraft,
                    companyError,
                    companyMessage: companySubmissionFeedback?.message ?? companyAvailability.message,
                    companyStatus: companySubmissionFeedback?.status ?? companyAvailability.status,
                    retryCompanyCheck: () => {
                      setCompanySubmissionFeedback(null);
                      companyAvailability.retry();
                    },
                    frameDraft,
                    interestDraft,
                    onboardingStep,
                    setAvatarDraft,
                    setCompanyDraft: (value) => {
                      setCompanyDraft(value);
                      if (companyError) setCompanyError('');
                      if (companySubmissionFeedback) setCompanySubmissionFeedback(null);
                    },
                    setFrameDraft,
                    setInterestDraft,
                    setThemeDraft,
                    starterAvatars,
                    starterFrames,
                    styles,
                    themeDraft,
                    tokens,
                    width,
                  })}
                </View>

                <View style={styles.footer}>
                  {onboardingStep === 0 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isSavingCompany }}
                      disabled={isSavingCompany}
                      onPress={skipCurrentOnboarding}
                      style={({ pressed }) => [styles.secondaryButton, isSavingCompany && styles.controlDisabled, pressed && styles.pressed]}
                    >
                      <Text style={styles.secondaryButtonText}>Atla</Text>
                    </Pressable>
                  ) : onboardingStep > 0 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isSavingCompany }}
                      disabled={isSavingCompany}
                      onPress={() => setOnboardingStep((step) => Math.max(0, step - 1))}
                      style={({ pressed }) => [styles.secondaryButton, isSavingCompany && styles.controlDisabled, pressed && styles.pressed]}
                    >
                      <Text style={styles.secondaryButtonText}>Geri</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      busy: isSavingCompany,
                      disabled: companyStepBlocked || isSavingCompany,
                    }}
                    disabled={companyStepBlocked || isSavingCompany}
                    onPress={() => void advanceOnboarding()}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      (companyStepBlocked || isSavingCompany) && styles.primaryButtonDisabled,
                      pressed && styles.primaryPressed,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isSavingCompany
                        ? 'Şirket adı kaydediliyor...'
                        : onboardingStep === 0
                        ? 'Başlayalım'
                        : onboardingStep === 2
                          ? 'Bu temayla devam et'
                          : onboardingStep === ONBOARDING_STEP_COUNT - 1
                            ? 'Sistemi Başlat'
                            : 'Devam et'}
                    </Text>
                    <Ionicons
                      accessibilityElementsHidden
                      color={tokens.colors.onAccent}
                      importantForAccessibility="no-hide-descendants"
                      name={onboardingStep === ONBOARDING_STEP_COUNT - 1 ? 'play' : 'arrow-forward'}
                      size={18}
                    />
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

interface OnboardingStepRenderOptions {
  avatarDraft: AvatarCosmeticId;
  companyDraft: string;
  companyError: string;
  companyMessage: string;
  companyStatus: CompanyNameAvailabilityStatus;
  frameDraft: AvatarFrameCosmeticId;
  interestDraft: InterestAreaId[];
  onboardingStep: number;
  setAvatarDraft: (id: AvatarCosmeticId) => void;
  setCompanyDraft: (value: string) => void;
  setFrameDraft: (id: AvatarFrameCosmeticId) => void;
  setInterestDraft: React.Dispatch<React.SetStateAction<InterestAreaId[]>>;
  setThemeDraft: (id: Theme['id']) => void;
  retryCompanyCheck: () => void;
  starterAvatars: AvatarCosmetic[];
  starterFrames: AvatarFrameCosmetic[];
  styles: ReturnType<typeof makeStyles>;
  themeDraft: Theme['id'];
  tokens: ReturnType<typeof getDashboardTokens>;
  width: number;
}

function renderOnboardingStep(options: OnboardingStepRenderOptions) {
  const { onboardingStep, styles, tokens } = options;
  if (onboardingStep === 0) {
    return (
      <StepIntro
        body="Kendi yazılım şirketini kur, teknik kararlar ver ve operasyon hedeflerini geçerek kademeleri aç."
        icon="terminal-outline"
        styles={styles}
        title="Ship It Ops'a hoş geldin"
        tokens={tokens}
      />
    );
  }
  if (onboardingStep === 1) {
    return (
      <View style={styles.stepBlock}>
        <StepHeading icon="business-outline" title="Şirketini kur" styles={styles} tokens={tokens} />
        <Text style={styles.inputLabel}>Şirket adı</Text>
        <View style={styles.companyInputRow}>
          <TextInput
            accessibilityLabel="Şirket adı"
            accessibilityHint={`En fazla ${COMPANY_NAME_MAX_LENGTH} karakter. ${options.companyMessage}`}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={COMPANY_NAME_MAX_LENGTH}
            onChangeText={options.setCompanyDraft}
            placeholder="Şirket adını yaz"
            placeholderTextColor={tokens.colors.textMuted}
            returnKeyType="done"
            style={[
              styles.input,
              (options.companyStatus === 'available' || options.companyStatus === 'saved') && styles.inputAvailable,
              (options.companyStatus === 'invalid' || options.companyStatus === 'unavailable' || options.companyStatus === 'error') && styles.inputError,
            ]}
            value={options.companyDraft}
          />
          <Pressable
            accessibilityLabel="Rastgele şirket adı seç"
            accessibilityRole="button"
            onPress={() => options.setCompanyDraft(suggestCompanyName(options.companyDraft))}
            style={({ pressed }) => [styles.randomCompanyButton, pressed && styles.pressed]}
          >
            <Ionicons
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              name="dice-outline"
              size={22}
              color={tokens.colors.text}
            />
          </Pressable>
        </View>
        <View style={styles.inputMeta}>
          <View style={styles.companyStatusSlot}>
            <CompanyNameStatus
              message={options.companyError || options.companyMessage}
              onRetry={options.retryCompanyCheck}
              status={options.companyStatus}
            />
          </View>
          <Text style={styles.counter}>{options.companyDraft.length}/{COMPANY_NAME_MAX_LENGTH}</Text>
        </View>
      </View>
    );
  }
  if (onboardingStep === 2) {
    return (
      <View style={styles.stepBlock}>
        <StepHeading icon="color-palette-outline" title="Operasyon alanını seç" styles={styles} tokens={tokens} />
        <Text style={styles.body}>Sana en rahat gelen görünümü seç. Temanı daha sonra değiştirebilirsin.</Text>
        <View style={styles.themeChoiceGrid}>
          {(['default', 'daylight'] as const).map((id) => (
            <ThemeChoice
              key={id}
              id={id}
              selected={options.themeDraft === id}
              onPress={() => options.setThemeDraft(id)}
              styles={styles}
              width={options.width}
            />
          ))}
        </View>
        <Text style={styles.note}>Tema seçimi oyun kurallarını ve ilerlemeni değiştirmez.</Text>
      </View>
    );
  }
  if (onboardingStep === 3) {
    return (
      <View style={styles.stepBlock}>
        <StepHeading icon="person-outline" title="Operatör avatarını seç" styles={styles} tokens={tokens} />
        <View style={styles.selectionGrid}>
          {options.starterAvatars.map((item) => (
            <CosmeticChoice
              key={item.id}
              item={item}
              selected={options.avatarDraft === item.id}
              onPress={() => options.setAvatarDraft(item.id)}
              styles={styles}
            />
          ))}
        </View>
      </View>
    );
  }
  if (onboardingStep === 4) {
    return (
      <View style={styles.stepBlock}>
        <StepHeading icon="scan-outline" title="Avatar çerçeveni seç" styles={styles} tokens={tokens} />
        <View style={styles.selectionGrid}>
          {options.starterFrames.map((item) => (
            <CosmeticChoice
              key={item.id}
              item={item}
              selected={options.frameDraft === item.id}
              onPress={() => options.setFrameDraft(item.id)}
              styles={styles}
            />
          ))}
        </View>
      </View>
    );
  }
  if (onboardingStep === 5) {
    return (
      <View style={styles.stepBlock}>
        <StepHeading icon="options-outline" title="İlgi alanlarını seç" styles={styles} tokens={tokens} />
        <Text style={styles.body}>Bunu oyun deneyimini ve gelecek içerik önerilerini kişiselleştirmek için kullanacağız.</Text>
        <View style={styles.interestList}>
          {INTEREST_AREA_OPTIONS.map((option) => {
            const selected = options.interestDraft.includes(option.id);
            return (
              <Pressable
                key={option.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                onPress={() => options.setInterestDraft((current) => current.includes(option.id)
                  ? current.filter((id) => id !== option.id)
                  : [...current, option.id])}
                style={({ pressed }) => [styles.interestCard, selected && styles.choiceSelected, pressed && styles.pressed]}
              >
                <View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}>
                  <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name={option.icon} size={20} color={selected ? tokens.colors.primary : tokens.colors.textMuted} />
                </View>
                <Text style={[styles.choiceName, selected && styles.choiceNameSelected]}>{option.label}</Text>
                <Ionicons
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={selected ? tokens.colors.primary : tokens.colors.textMuted}
                />
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.note}>İstersen sonra Profil’den değiştirebilirsin.</Text>
      </View>
    );
  }
  return (
    <StepIntro
      body="Soruları cevapla, doğru kararlarınla kariyer basamaklarını tek tek tırman."
      icon="checkmark-done-outline"
      secondaryBody="Oturum hedeflerini geçerek yeni kademeleri aç; kazandığın bütçeyle jokerler ve kozmetiklerle kendi tarzını ortaya çıkar."
      styles={styles}
      title="Hazırsın"
      tokens={tokens}
    />
  );
}

function ThemeChoice({
  id,
  onPress,
  selected,
  styles,
  width,
}: {
  id: 'default' | 'daylight';
  onPress: () => void;
  selected: boolean;
  styles: ReturnType<typeof makeStyles>;
  width: number;
}) {
  const metadata = THEME_METADATA[id];
  const preview = getDashboardTokens(THEMES[id], width);

  return (
    <Pressable
      accessibilityLabel={`${metadata.title}. ${metadata.description}`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.themeChoiceCard,
        selected && styles.choiceSelected,
        pressed && styles.pressed,
      ]}
    >
      <View
        pointerEvents="none"
        style={[styles.themePreview, { backgroundColor: preview.colors.canvas, borderColor: preview.colors.border }]}
      >
        <View style={[styles.themePreviewQuestion, { backgroundColor: preview.colors.surface, borderColor: preview.colors.borderSubtle }]}>
          <Text style={[styles.themePreviewEyebrow, { color: preview.colors.decision }]}>TEKNİK KARAR</Text>
          <View style={[styles.themePreviewLineLong, { backgroundColor: preview.colors.text }]} />
          <View style={[styles.themePreviewLineShort, { backgroundColor: preview.colors.textMuted }]} />
        </View>
        <View style={[styles.themePreviewAnswer, { backgroundColor: preview.colors.surfaceRaised, borderColor: preview.colors.borderStrong }]}>
          <View style={[styles.themePreviewIndex, { backgroundColor: preview.colors.selectionBackground, borderColor: preview.colors.selectionBorder }]} />
          <View style={[styles.themePreviewAnswerLine, { backgroundColor: preview.colors.textMuted }]} />
        </View>
        <View style={[styles.themePreviewTrack, { backgroundColor: preview.colors.progressTrack }]}>
          <View style={[styles.themePreviewFill, { backgroundColor: preview.colors.reputation }]} />
        </View>
      </View>
      <View style={styles.themeChoiceHeader}>
        <Text style={[styles.choiceName, selected && styles.choiceNameSelected]}>{metadata.title}</Text>
        {selected ? (
          <View style={styles.selectedPill}>
            <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name="checkmark" size={13} color={styles.choiceNameSelected.color} />
            <Text style={styles.selectedPillText}>Seçili</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.themeChoiceDescription}>{metadata.description}</Text>
    </Pressable>
  );
}

function CosmeticChoice({
  item,
  onPress,
  selected,
  styles,
}: {
  item: AvatarCosmetic | AvatarFrameCosmetic;
  onPress: () => void;
  selected: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable
      accessibilityLabel={`${item.name}, ücretsiz başlangıç seçeneği`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.cosmeticCard, selected && styles.choiceSelected, pressed && styles.pressed]}
    >
      {item.type === 'avatar' ? (
        <CosmeticPreview
          accessibilityLabel={`${item.name} önizlemesi`}
          avatar={item}
          mode="avatarOnly"
          size={88}
        />
      ) : (
        <CosmeticPreview
          accessibilityLabel={`${item.name} önizlemesi`}
          frame={item}
          mode="frameOnly"
          size={88}
        />
      )}
      <View style={styles.cosmeticCopy}>
        <Text style={[styles.choiceName, selected && styles.choiceNameSelected]}>{item.name}</Text>
        <Text style={styles.freeLabel}>BAŞLANGIÇ · ÜCRETSİZ</Text>
      </View>
      <Ionicons
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={selected ? styles.choiceNameSelected.color : styles.fieldHint.color}
      />
    </Pressable>
  );
}

function StepIntro({ body, icon, secondaryBody, styles, title, tokens }: {
  body: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  secondaryBody?: string;
  styles: ReturnType<typeof makeStyles>;
  title: string;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  return (
    <View style={styles.intro}>
      <View style={styles.heroIcon}>
        <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name={icon} size={36} color={tokens.colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.bodyCentered}>{body}</Text>
      {secondaryBody ? <Text style={[styles.bodyCentered, styles.bodyContinuation]}>{secondaryBody}</Text> : null}
      <View style={styles.signalRow}>
        <View style={styles.signalDot} />
        <Text style={styles.signalText}>SİSTEM HAZIR</Text>
        <View style={styles.signalDot} />
      </View>
    </View>
  );
}

function StepHeading({ icon, styles, title, tokens }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  styles: ReturnType<typeof makeStyles>;
  title: string;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  return (
    <View style={styles.stepHeading}>
      <View style={styles.headingIcon}>
        <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name={icon} size={22} color={tokens.colors.primary} />
      </View>
      <Text style={styles.titleCompact}>{title}</Text>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>, width: number, height: number) {
  const { colors, radius } = tokens;
  const desktop = width >= 700;
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.canvas,
      ...(Platform.OS === 'web' ? { flex: undefined, height, maxHeight: '100%' as const, minHeight: 0 } : {}),
    },
    keyboardArea: { flex: 1, minHeight: 0 },
    centerer: {
      flex: 1,
      minHeight: 0,
      alignItems: 'center',
      justifyContent: 'center',
      padding: desktop ? 24 : 0,
      backgroundColor: colors.canvas,
    },
    panel: {
      flex: desktop ? undefined : 1,
      width: getOnboardingPanelWidth(width),
      minWidth: 0,
      flexShrink: 1,
      maxWidth: 640,
      maxHeight: desktop ? Math.min(760, Math.max(0, height - 48)) : '100%',
      minHeight: desktop ? Math.min(600, Math.max(0, height - 48)) : 0,
      overflow: 'hidden',
      borderRadius: desktop ? radius.lg : 0,
      borderWidth: desktop ? 1 : 0,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
      ...tokens.shadow.raised,
    },
    technicalRail: { height: 3, backgroundColor: colors.primary },
    header: {
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: tokens.layout.pageGutter,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.dividerSubtle,
    },
    headerCopy: { flex: 1, minWidth: 0 },
    eyebrow: { color: colors.primary, fontFamily: fonts.monoSemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 1 },
    stepLabel: { marginTop: 2, color: colors.textMuted, fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.7 },
    skipButton: { minWidth: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
    skipText: { color: colors.textMuted, fontFamily: fonts.bodySemiBold, fontSize: 14 },
    progressTrack: { height: 3, backgroundColor: colors.secondarySurfaceRaised },
    progressFill: { height: 3, backgroundColor: colors.secondary },
    scroll: { flex: 1, minHeight: 0, width: '100%' },
    content: { flexGrow: 1 },
    stepContent: { flexGrow: 1, flexShrink: 0, justifyContent: 'center', paddingHorizontal: tokens.layout.pageGutter, paddingVertical: desktop ? 32 : 24 },
    stepBlock: { width: '100%', maxWidth: 520, alignSelf: 'center' },
    intro: { width: '100%', maxWidth: 500, alignSelf: 'center', alignItems: 'center', paddingVertical: 12 },
    heroIcon: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.primarySoft },
    title: { color: colors.text, fontFamily: fonts.headingBold, fontSize: tokens.layout.isNarrow ? 25 : 29, lineHeight: tokens.layout.isNarrow ? 32 : 36, textAlign: 'center' },
    titleCompact: { flex: 1, minWidth: 0, color: colors.text, fontFamily: fonts.headingBold, fontSize: 22, lineHeight: 29 },
    body: { marginTop: 10, color: colors.textMuted, fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
    bodyCentered: { maxWidth: 460, marginTop: 14, color: colors.textMuted, fontFamily: fonts.body, fontSize: 15, lineHeight: 23, textAlign: 'center' },
    bodyContinuation: { marginTop: 8 },
    signalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, opacity: tokens.effects.decorativeOpacity },
    signalDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.secondary },
    signalText: { color: colors.secondary, fontFamily: fonts.monoMedium, fontSize: 9, letterSpacing: 1.2 },
    stepHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    headingIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.primarySoft },
    inputLabel: { marginTop: 20, marginBottom: 8, color: colors.text, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
    companyInputRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8 },
    input: { minHeight: 52, flex: 1, minWidth: 0, paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.secondarySurface, color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 16 },
    randomCompanyButton: { width: 48, minHeight: 52, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.secondarySurface },
    inputAvailable: { borderColor: colors.success, backgroundColor: colors.successSoft },
    inputError: { borderColor: colors.danger },
    inputMeta: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 7 },
    companyStatusSlot: { flex: 1, minWidth: 0 },
    fieldHint: { flex: 1, color: colors.textMuted, fontFamily: fonts.body, fontSize: 11, lineHeight: 17 },
    errorText: { color: colors.danger },
    counter: { color: colors.textMuted, fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 17 },
    selectionGrid: { width: '100%', gap: 10, marginTop: 18 },
    themeChoiceGrid: { width: '100%', flexDirection: width >= 560 ? 'row' : 'column', gap: 12, marginTop: 18 },
    themeChoiceCard: { flex: width >= 560 ? 1 : undefined, minWidth: 0, gap: 9, padding: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurface },
    themePreview: { height: 116, gap: 7, padding: 9, overflow: 'hidden', borderRadius: radius.sm, borderWidth: 1 },
    themePreviewQuestion: { gap: 5, padding: 8, borderRadius: 8, borderWidth: 1 },
    themePreviewEyebrow: { fontFamily: fonts.monoSemiBold, fontSize: 7, lineHeight: 9, letterSpacing: 0.45 },
    themePreviewLineLong: { width: '86%', height: 5, borderRadius: 3, opacity: 0.88 },
    themePreviewLineShort: { width: '58%', height: 4, borderRadius: 2, opacity: 0.52 },
    themePreviewAnswer: { minHeight: 29, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 7, borderRadius: 8, borderWidth: 1 },
    themePreviewIndex: { width: 13, height: 13, borderRadius: 4, borderWidth: 1 },
    themePreviewAnswerLine: { width: '54%', height: 4, borderRadius: 2, opacity: 0.58 },
    themePreviewTrack: { height: 4, overflow: 'hidden', borderRadius: 2 },
    themePreviewFill: { width: '64%', height: '100%', borderRadius: 2 },
    themeChoiceHeader: { minHeight: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    themeChoiceDescription: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
    selectedPill: { minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, borderRadius: radius.sm, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
    selectedPillText: { color: colors.primary, fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14 },
    cosmeticCard: { minHeight: 112, width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurface },
    cosmeticCopy: { flex: 1, minWidth: 0 },
    choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    choiceName: { color: colors.text, fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20 },
    choiceNameSelected: { color: colors.primary },
    freeLabel: { marginTop: 4, color: colors.secondary, fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 13, letterSpacing: 0.7 },
    interestList: { width: '100%', gap: 10, marginTop: 18 },
    interestCard: { minHeight: 62, width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurface },
    choiceIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySurfaceRaised },
    choiceIconSelected: { backgroundColor: colors.surfaceHighlight },
    note: { marginTop: 12, color: colors.textMuted, fontFamily: fonts.body, fontSize: 11, lineHeight: 17 },
    footer: { minHeight: 84, flexShrink: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingHorizontal: tokens.layout.pageGutter, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.dividerSubtle, backgroundColor: colors.secondarySurface },
    secondaryButton: { minWidth: 84, minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    secondaryButtonText: { color: colors.text, fontFamily: fonts.bodySemiBold, fontSize: 14 },
    primaryButton: { minWidth: tokens.layout.isNarrow ? 150 : 174, maxWidth: '100%', minHeight: 52, flexShrink: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, borderRadius: radius.sm, backgroundColor: colors.primary },
    primaryButtonDisabled: { opacity: 0.45 },
    controlDisabled: { opacity: 0.45 },
    primaryButtonText: { flexShrink: 1, textAlign: 'center', color: colors.onAccent, fontFamily: fonts.bodySemiBold, fontSize: 14 },
    pressed: { opacity: 0.72 },
    primaryPressed: tokens.motion.pressed,
  });
}
