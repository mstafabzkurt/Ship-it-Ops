import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import type { UserReportReason } from '../../utils/directMessaging';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

const REASONS: { value: UserReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Taciz' },
  { value: 'inappropriate', label: 'Uygunsuz içerik' },
  { value: 'other', label: 'Diğer' },
];

export default function ReportUserSheet({ visible, companyName, onClose, onSubmit }: {
  visible: boolean;
  companyName: string;
  onClose: () => void;
  onSubmit: (reason: UserReportReason, details: string) => Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [reason, setReason] = useState<UserReportReason>('spam');
  const [details, setDetails] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setReason('spam');
    setDetails('');
    setPending(false);
    setError('');
    setSent(false);
  }, [visible]);

  const submit = async () => {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await onSubmit(reason, details);
      setSent(true);
    } catch {
      setError('Şikayet gönderilemedi. Tekrar deneyebilirsin.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={pending ? undefined : onClose}>
      <SafeAreaView style={styles.scrim}>
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>GÜVENLİK</Text>
              <Text accessibilityRole="header" style={styles.title}>Şikayet Et</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Şikayet penceresini kapat" disabled={pending} onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <Ionicons name="close" size={23} color={tokens.colors.text} />
            </Pressable>
          </View>

          {sent ? (
            <View accessibilityLiveRegion="polite" style={styles.success}>
              <Ionicons name="checkmark-circle-outline" size={34} color={tokens.colors.success} />
              <Text style={styles.successTitle}>Şikayet gönderildi.</Text>
              <Text style={styles.helper}>{companyName} bu işlem hakkında bilgilendirilmez. İstersen kullanıcıyı ayrıca engelleyebilirsin.</Text>
              <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}>
                <Text style={styles.submitText}>Kapat</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.content}>
              <Text style={styles.label}>Neden</Text>
              <View style={styles.reasonGrid}>
                {REASONS.map((item) => {
                  const selected = item.value === reason;
                  return (
                    <Pressable
                      key={item.value}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected, disabled: pending }}
                      disabled={pending}
                      onPress={() => setReason(item.value)}
                      style={({ pressed }) => [styles.reasonButton, selected && styles.reasonSelected, pressed && styles.pressed]}
                    >
                      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={18} color={selected ? tokens.colors.primary : tokens.colors.textMuted} />
                      <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Ek ayrıntı (isteğe bağlı)</Text>
              <TextInput
                accessibilityLabel="Şikayet ayrıntısı"
                editable={!pending}
                maxLength={500}
                multiline
                onChangeText={setDetails}
                placeholder="Kısa ve somut bir açıklama yazabilirsin."
                placeholderTextColor={tokens.colors.textMuted}
                style={styles.input}
                textAlignVertical="top"
                value={details}
              />
              <Text style={styles.counter}>{details.length}/500</Text>
              {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: pending }} disabled={pending} onPress={() => void submit()} style={({ pressed }) => [styles.submitButton, pending && styles.disabled, pressed && styles.pressed]}>
                {pending ? <ActivityIndicator color={tokens.colors.foregroundOnAction} /> : <Text style={styles.submitText}>Şikayeti Gönder</Text>}
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    scrim: { flex: 1, justifyContent: tokens.layout.isCompact ? 'flex-end' : 'center', padding: tokens.layout.isCompact ? 0 : 20, backgroundColor: colors.overlayScrim },
    sheet: { width: '100%', maxWidth: 540, maxHeight: '92%', alignSelf: 'center', overflow: 'hidden', borderRadius: radius.lg, backgroundColor: colors.floatingSurface, borderWidth: 1, borderColor: colors.borderStrong, ...shadow.raised },
    header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 17, paddingRight: 8, borderBottomWidth: 1, borderBottomColor: colors.dividerSubtle },
    headerCopy: { flex: 1, minWidth: 0 },
    eyebrow: { ...tokens.type.eyebrow, color: colors.danger, fontFamily: fonts.monoSemiBold },
    title: { marginTop: 2, color: colors.text, fontFamily: fonts.headingBold, fontSize: 19, lineHeight: 24 },
    closeButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
    content: { padding: 16 },
    label: { marginBottom: 7, color: colors.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 18 },
    reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
    reasonButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    reasonSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    reasonText: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 13 },
    reasonTextSelected: { color: colors.text },
    input: { minHeight: 112, color: colors.text, fontFamily: fonts.body, fontSize: 16, lineHeight: 23, padding: 12, borderRadius: radius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle },
    counter: { marginTop: 5, color: colors.textMuted, fontFamily: fonts.monoMedium, fontSize: 10, textAlign: 'right' },
    error: { marginTop: 8, color: colors.danger, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 18 },
    submitButton: { minHeight: 48, marginTop: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: radius.sm, backgroundColor: colors.primary },
    submitText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 13 },
    success: { minHeight: 280, alignItems: 'center', justifyContent: 'center', padding: 24 },
    successTitle: { marginTop: 11, color: colors.text, fontFamily: fonts.headingBold, fontSize: 18, lineHeight: 24 },
    helper: { maxWidth: 390, marginTop: 6, color: colors.textMuted, fontFamily: fonts.body, fontSize: 13, lineHeight: 20, textAlign: 'center' },
    disabled: { opacity: 0.48 },
    pressed: { opacity: 0.72 },
  });
}
