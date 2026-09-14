import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePrivacyConsent } from '../../state/PrivacyConsentContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

export default function PrivacyConsentExperience() {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const {
    closePreferences,
    consent,
    isHydrated,
    openPreferences,
    preferencesVisible,
    saveConsent,
    storageError,
  } = usePrivacyConsent();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const compact = width < 600;
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);

  useEffect(() => {
    if (!preferencesVisible) return;
    setAnalytics(consent?.analytics ?? false);
    setAdvertising(consent?.advertising ?? false);
  }, [consent, preferencesVisible]);

  const bannerVisible = isHydrated && consent === null && !preferencesVisible;

  return (
    <>
      {bannerVisible ? (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <SafeAreaView edges={['bottom']} pointerEvents="box-none" style={styles.bannerLayer}>
            <View accessibilityLiveRegion="polite" style={styles.banner}>
              <View style={styles.bannerCopyRow}>
                <View style={styles.bannerIcon}>
                  <Ionicons name="shield-checkmark-outline" size={21} color={tokens.colors.primary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
                </View>
                <View style={styles.bannerCopy}>
                  <Text accessibilityRole="header" style={styles.bannerTitle}>Gizlilik Tercihleri</Text>
                  <Text style={styles.bannerText}>Ship It Ops, oturumunuzu açık tutmak ve ilerlemenizi kaydetmek için zorunlu depolama teknolojilerini kullanır. Analitik ve reklam çerezleri yalnızca onayınızla çalışır.</Text>
                </View>
              </View>
              {storageError ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{storageError}</Text> : null}
              <View style={styles.bannerActions}>
                <ConsentButton
                  compact={compact}
                  label="Hepsini Reddet"
                  onPress={() => void saveConsent({ analytics: false, advertising: false })}
                  styles={styles}
                  variant="secondary"
                />
                <ConsentButton compact={compact} label="Tercihleri Yönet" onPress={openPreferences} styles={styles} variant="secondary" />
                <ConsentButton
                  compact={compact}
                  fullOnCompact
                  label="Hepsini Kabul Et"
                  onPress={() => void saveConsent({ analytics: true, advertising: true })}
                  styles={styles}
                  variant="primary"
                />
              </View>
            </View>
          </SafeAreaView>
        </View>
      ) : null}

      <Modal visible={preferencesVisible} transparent animationType="none" onRequestClose={closePreferences}>
        <SafeAreaView style={[styles.scrim, compact && styles.scrimCompact]}>
          <View accessibilityViewIsModal style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text accessibilityRole="header" style={styles.sheetTitle}>Gizlilik Tercihleri</Text>
                <Text style={styles.sheetSubtitle}>Zorunlu olmayan teknolojileri sen yönetirsin.</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Kapat" onPress={closePreferences} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
                <Ionicons name="close" size={24} color={tokens.colors.text} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
              </Pressable>
            </View>

            <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
              <ConsentRow
                description="Oturum, kayıt, tema, profil tercihleri ve oyun ilerlemesi için gereklidir."
                disabled
                label="Zorunlu"
                onValueChange={() => undefined}
                styles={styles}
                tokens={tokens}
                value
              />
              <ConsentRow
                description="Uygulamanın nasıl kullanıldığını anlamak ve iyileştirmek için kullanılabilir."
                label="Analitik"
                onValueChange={setAnalytics}
                styles={styles}
                tokens={tokens}
                value={analytics}
              />
              <ConsentRow
                description="Reklam teknolojileri şu anda aktif değildir. İleride reklam gösterimi eklenirse bu tercih dikkate alınacaktır."
                label="Reklam"
                onValueChange={setAdvertising}
                styles={styles}
                tokens={tokens}
                value={advertising}
              />
              {storageError ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{storageError}</Text> : null}
            </ScrollView>

            <View style={styles.sheetFooter}>
              <ConsentButton compact={false} label="Vazgeç" onPress={closePreferences} styles={styles} variant="secondary" />
              <ConsentButton
                compact={false}
                label="Tercihleri Kaydet"
                onPress={() => void saveConsent({ analytics, advertising })}
                styles={styles}
                variant="primary"
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

function ConsentRow({
  description,
  disabled = false,
  label,
  onValueChange,
  styles,
  tokens,
  value,
}: {
  description: string;
  disabled?: boolean;
  label: string;
  onValueChange: (value: boolean) => void;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
  value: boolean;
}) {
  return (
    <View style={[styles.preferenceRow, value && styles.preferenceRowSelected]}>
      <View style={styles.preferenceCopy}>
        <View style={styles.preferenceTitleRow}>
          <Text style={styles.preferenceTitle}>{label}</Text>
          {disabled ? <Text style={styles.requiredPill}>HER ZAMAN AÇIK</Text> : null}
        </View>
        <Text style={styles.preferenceDescription}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={`${label} tercihi`}
        accessibilityState={{ checked: value, disabled }}
        disabled={disabled}
        onValueChange={onValueChange}
        thumbColor={value ? tokens.colors.primary : tokens.colors.textMuted}
        trackColor={{ false: tokens.colors.progressTrack, true: tokens.colors.primarySoft }}
        value={value}
      />
    </View>
  );
}

function ConsentButton({ compact, fullOnCompact = false, label, onPress, styles, variant }: {
  compact: boolean;
  fullOnCompact?: boolean;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  variant: 'primary' | 'secondary';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        compact && styles.actionButtonCompact,
        compact && fullOnCompact && styles.actionButtonCompactFull,
        variant === 'primary' ? styles.actionPrimary : styles.actionSecondary,
        pressed && styles.pressed,
      ]}
    >
      <Text style={variant === 'primary' ? styles.actionPrimaryText : styles.actionSecondaryText}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    bannerLayer: { flex: 1, justifyContent: 'flex-end', padding: tokens.layout.isCompact ? 10 : 16 },
    banner: { width: '100%', maxWidth: 860, alignSelf: 'center', padding: tokens.layout.isCompact ? 14 : 18, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.floatingSurface, ...shadow.raised },
    bannerCopyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    bannerIcon: { width: 40, height: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.selectionBorder },
    bannerCopy: { flex: 1, minWidth: 0 },
    bannerTitle: { fontFamily: fonts.headingBold, fontSize: 18, lineHeight: 24, color: colors.text },
    bannerText: { marginTop: 4, fontFamily: fonts.body, fontSize: 12, lineHeight: 19, color: colors.textSecondary },
    bannerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
    actionButton: { flex: 1, minWidth: 150, minHeight: tokens.control.height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13, borderRadius: radius.md, borderWidth: 1 },
    actionButtonCompact: { flexBasis: '47%', minWidth: 0 },
    actionButtonCompactFull: { flexBasis: '100%' },
    actionPrimary: { borderColor: colors.secondary, backgroundColor: colors.secondary },
    actionSecondary: { borderColor: colors.borderStrong, backgroundColor: colors.surfaceSoft },
    actionPrimaryText: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, color: colors.onAccent, textAlign: 'center' },
    actionSecondaryText: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, color: colors.text, textAlign: 'center' },
    error: { marginTop: 10, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 18, color: colors.danger },
    scrim: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: colors.overlayScrim },
    scrimCompact: { justifyContent: 'flex-end', padding: 0 },
    sheet: { width: '100%', maxWidth: 560, maxHeight: '92%', alignSelf: 'center', flexShrink: 1, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, overflow: 'hidden' },
    sheetHeader: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 18, paddingRight: 8, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.dividerSubtle },
    sheetHeaderCopy: { flex: 1, minWidth: 0 },
    sheetTitle: { fontFamily: fonts.headingBold, fontSize: 20, lineHeight: 26, color: colors.text },
    sheetSubtitle: { marginTop: 1, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    sheetScroll: { flexShrink: 1 },
    sheetContent: { padding: tokens.layout.isCompact ? 12 : 16, gap: 10 },
    preferenceRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurfaceRaised },
    preferenceRowSelected: { borderColor: colors.selectionBorder, backgroundColor: colors.selectionBackground },
    preferenceCopy: { flex: 1, minWidth: 0 },
    preferenceTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
    preferenceTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20, color: colors.text },
    requiredPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.primarySoft, fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 13, color: colors.primary },
    preferenceDescription: { marginTop: 4, fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.textMuted },
    sheetFooter: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.dividerSubtle, backgroundColor: colors.surfaceRaised },
    pressed: { opacity: 0.72 },
  });
}
