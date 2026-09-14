import React, { useMemo, useState } from 'react';
import { Clipboard, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { ASSET_CREDIT_LINKS, createSupportMailto, FEEDBACK_OPTIONS, LEGAL_DRAFTS, SHIP_IT_OPS_SUPPORT_EMAIL } from '../../config/support';
import { useTheme } from '../../state/ThemeContext';
import { usePrivacyConsent } from '../../state/PrivacyConsentContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';
import { trackAnalyticsEvent } from '../../lib/analytics';

type Sheet = 'feedback' | 'delete' | keyof typeof LEGAL_DRAFTS;
type RowIcon = React.ComponentProps<typeof Ionicons>['name'];

export default function ProfileSupport({ accountId }: { accountId?: string }) {
  const { theme } = useTheme();
  const { openPreferences } = usePrivacyConsent();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [message, setMessage] = useState('');
  const [mailError, setMailError] = useState('');
  const openSheet = (value: Sheet) => { setMailError(''); setSheet(value); };
  const copyId = async () => {
    if (!accountId) return;
    try {
      if (Platform.OS === 'web') await navigator.clipboard.writeText(accountId);
      else Clipboard.setString(accountId);
      setMessage('Hesap ID kopyalandı.');
    } catch { setMessage('Kopyalanamadı. Hesap ID metnini seçerek kopyalayabilirsin.'); }
  };
  const openMail = async (subject: string, body: string) => {
    setMailError('');
    try { await Linking.openURL(createSupportMailto(subject, body)); }
    catch { setMailError(`E-posta uygulaması açılamadı. Adres: ${SHIP_IT_OPS_SUPPORT_EMAIL}\nKonu: ${subject}\n\n${body}`); }
  };
  const openSource = async (url: string) => {
    try { await Linking.openURL(url); }
    catch { setMailError('Kaynak bağlantısı açılamadı. Detaylar docs/asset-credits.md dosyasında yer alır.'); }
  };
  const row = (title: string, onPress: () => void, subtitle?: string, danger = false, icon?: RowIcon) => (
    <Pressable key={title} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {icon ? (
        <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
          <Ionicons
            name={icon}
            size={18}
            color={danger ? tokens.colors.danger : tokens.colors.textSecondary}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </View>
      ) : null}
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, danger && styles.danger]}>{title}</Text>
        {subtitle ? <Text style={styles.body}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={tokens.colors.textMuted} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    </Pressable>
  );
  const legal = sheet && sheet in LEGAL_DRAFTS ? LEGAL_DRAFTS[sheet as keyof typeof LEGAL_DRAFTS] : null;
  const title = legal?.title ?? (sheet === 'delete' ? 'Hesabı Sil' : 'Geri Bildirim');

  return (
    <>
      <Text accessibilityRole="header" style={styles.heading}>Yardım ve Yasal</Text>
      <View style={styles.group}>
        {row('Geri Bildirim Gönder', () => {
          void trackAnalyticsEvent('feedback_opened');
          openSheet('feedback');
        }, 'Soru, öneri veya yeni soru isteği', false, 'chatbubble-ellipses-outline')}
        {row('Gizlilik Tercihleri', openPreferences, undefined, false, 'options-outline')}
        {row(LEGAL_DRAFTS.privacy.title, () => openSheet('privacy'), undefined, false, 'shield-checkmark-outline')}
        {row(LEGAL_DRAFTS.terms.title, () => openSheet('terms'), undefined, false, 'document-text-outline')}
        {row(LEGAL_DRAFTS.licenses.title, () => openSheet('licenses'), undefined, false, 'library-outline')}
        <View style={styles.aboutInline}>
          <Text style={styles.aboutVersion}>Ship It Ops v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          <Text style={styles.about}>Bilgisayar mühendisliği konularını operasyon senaryolarıyla çalıştıran eğitim amaçlı karar oyunu.</Text>
        </View>
      </View>

      <Text accessibilityRole="header" style={styles.heading}>Hesap</Text>
      <View style={styles.group}>
        <View style={styles.account}>
          <View style={styles.accountCopy}>
            <Text style={styles.accountLabel}>Hesap ID</Text>
            <Text selectable numberOfLines={1} style={styles.accountId}>{accountId ?? 'Hesap bilgisi bulunamadı'}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hesap ID kopyala"
            disabled={!accountId}
            accessibilityState={{ disabled: !accountId }}
            onPress={() => void copyId()}
            style={({ pressed }) => [styles.copy, !accountId && styles.copyDisabled, pressed && styles.pressed]}
          >
            <Ionicons name="copy-outline" size={19} color={tokens.colors.primary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
          </Pressable>
        </View>
        {message ? <Text accessibilityLiveRegion="polite" style={styles.accountMessage}>{message}</Text> : null}
        {row('Hesabı Sil', () => openSheet('delete'), undefined, true, 'trash-outline')}
      </View>

      <Modal visible={sheet !== null} transparent animationType="none" onRequestClose={() => setSheet(null)}>
        <SafeAreaView style={styles.scrim}>
          <View accessibilityViewIsModal style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text accessibilityRole="header" style={styles.sheetTitle}>{title}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Kapat" onPress={() => setSheet(null)} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
                <Ionicons name="close" size={24} color={tokens.colors.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
              {legal ? (
                <>
                  {legal.paragraphs.map(paragraph => <Text selectable key={paragraph} style={styles.paragraph}>{paragraph}</Text>)}
                  {sheet === 'licenses' ? (
                    <View style={styles.creditLinks}>
                      {ASSET_CREDIT_LINKS.map(link => (
                        <Pressable
                          key={link.url}
                          accessibilityRole="link"
                          accessibilityLabel={link.label}
                          onPress={() => void openSource(link.url)}
                          style={({ pressed }) => [styles.creditLink, pressed && styles.pressed]}
                        >
                          <Text style={styles.link}>{link.label}</Text>
                          <Ionicons name="open-outline" size={17} color={tokens.colors.primary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </>
              ) : (
                <>
                  {sheet === 'feedback' ? FEEDBACK_OPTIONS.map(option => row(option.title, () => void openMail(option.subject, option.body), option.subtitle)) : (
                    <>
                      <Text style={styles.paragraph}>Bu işlem hesabını hemen silmez. E-posta uygulamanda bir silme talebi taslağı açar; göndermeden önce inceleyebilirsin. Otomatik hesap silme henüz kullanıma açık değildir.</Text>
                      {row('Silme Talebi Oluştur', () => void openMail('Ship It Ops - Hesap Silme Talebi', `Merhaba, Ship It Ops hesabımın ve ilişkili verilerimin silinmesini talep ediyorum.\n\nHesap ID: ${accountId ?? 'Belirtilmedi'}`))}
                    </>
                  )}
                  <Text selectable style={styles.paragraph}>Destek adresi: {SHIP_IT_OPS_SUPPORT_EMAIL}</Text>
                  <Text style={styles.body}>E-posta uygulaman açılır; gönderme kararını sen verirsin.</Text>
                </>
              )}
              {mailError ? <Text selectable accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.paragraph, styles.danger]}>{mailError}</Text> : null}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

function makeStyles({ colors, radius }: ReturnType<typeof getDashboardTokens>) {
  return StyleSheet.create({
    heading: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.text, marginTop: 20, marginBottom: 9 },
    group: { borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurface, borderRadius: radius.md, overflow: 'hidden' },
    row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.dividerSubtle },
    rowIcon: { width: 34, height: 34, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySurfaceRaised },
    rowIconDanger: { backgroundColor: colors.dangerSoft },
    rowCopy: { flex: 1, minWidth: 0 },
    rowTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 21, color: colors.text },
    body: { fontFamily: fonts.body, fontSize: 12, lineHeight: 19, color: colors.textMuted, marginTop: 3 },
    aboutInline: { paddingHorizontal: 13, paddingVertical: 11, backgroundColor: colors.secondarySurfaceRaised },
    aboutVersion: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 18, color: colors.textSecondary },
    about: { fontFamily: fonts.body, fontSize: 11, lineHeight: 17, color: colors.textMuted, marginTop: 2 },
    account: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 13, paddingRight: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.dividerSubtle },
    accountCopy: { flex: 1, minWidth: 0 },
    accountLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, color: colors.text },
    accountId: { fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 18, color: colors.textMuted, marginTop: 2 },
    accountMessage: { paddingHorizontal: 13, paddingVertical: 8, fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.primary, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.dividerSubtle },
    copy: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
    copyDisabled: { opacity: 0.38 },
    link: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.primary },
    danger: { color: colors.danger },
    pressed: { opacity: 0.7 },
    scrim: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: colors.overlayScrim },
    sheet: { width: '100%', maxWidth: 560, maxHeight: '90%', alignSelf: 'center', borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, overflow: 'hidden', flexShrink: 1 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.dividerSubtle },
    sheetTitle: { flex: 1, fontFamily: fonts.headingBold, fontSize: 20, color: colors.text },
    close: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
    sheetContent: { padding: 18, gap: 12 },
    paragraph: { fontFamily: fonts.body, fontSize: 14, lineHeight: 23, color: colors.text },
    creditLinks: { gap: 4 },
    creditLink: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  });
}
