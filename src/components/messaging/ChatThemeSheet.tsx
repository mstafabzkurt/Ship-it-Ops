import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, findNodeHandle, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { CHAT_THEMES, getChatTheme, getChatThemePalette, type ChatThemeId } from '../../utils/chatThemes';
import { getDashboardTokens } from '../dashboard/dashboardTokens';
import ChatWallpaper from './ChatWallpaper';

function focusControl(control: View | null) {
  if (!control) return;
  if (Platform.OS === 'web') (control as unknown as { focus?: () => void }).focus?.();
  else { const handle = findNodeHandle(control); if (handle) AccessibilityInfo.setAccessibilityFocus(handle); }
}

export default function ChatThemeSheet({ visible, selectedId, onClose, onSave, returnFocusRef }: {
  visible: boolean;
  selectedId: ChatThemeId;
  onClose: () => void;
  onSave: (id: ChatThemeId) => Promise<void>;
  returnFocusRef: React.RefObject<View | null>;
}) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [draftId, setDraftId] = useState(selectedId);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const closeButton = useRef<View>(null);
  const hasOpened = useRef(false);
  const draft = getChatTheme(draftId);
  const palette = getChatThemePalette(draft, tokens.colors);

  useEffect(() => {
    if (visible) { setDraftId(selectedId); setError(''); setFocused(null); }
  }, [selectedId, visible]);

  useEffect(() => {
    if (visible) { hasOpened.current = true; return; }
    if (!hasOpened.current) return;
    const frame = requestAnimationFrame(() => focusControl(returnFocusRef.current));
    return () => cancelAnimationFrame(frame);
  }, [visible, returnFocusRef]);
  useEffect(() => {
    if (!visible || pending || Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, pending, onClose]);

  const save = async () => {
    if (pending) return;
    setPending(true);
    setError('');
    try { await onSave(draftId); onClose(); }
    catch { setError('Tema kaydedilemedi. Tekrar deneyebilirsin.'); }
    finally { setPending(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={pending ? undefined : onClose} onShow={() => focusControl(closeButton.current)} onDismiss={() => requestAnimationFrame(() => focusControl(returnFocusRef.current))}>
      <SafeAreaView style={styles.scrim}>
        <View accessibilityViewIsModal role={Platform.OS === 'web' ? 'dialog' : undefined} aria-modal={Platform.OS === 'web' ? true : undefined} accessibilityLabel="Sohbet Teması" style={styles.sheet}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>Sohbet Teması</Text>
            <Pressable ref={closeButton} accessibilityRole="button" accessibilityLabel="Tema penceresini kapat" disabled={pending} onPress={onClose} onFocus={() => setFocused('close')} onBlur={() => setFocused(null)} style={({ pressed }) => [styles.close, focused === 'close' && styles.focused, pressed && styles.pressed]}>
              <Ionicons name="close" size={23} color={tokens.colors.text} accessible={false} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.helper}>Bu sohbette yalnızca senin görünümün değişir. Seçimin bu cihazda saklanır.</Text>
            <View style={styles.preview} accessibilityLabel={`${draft.name} tema önizlemesi`}>
              <ChatWallpaper preset={draft} palette={palette} />
              <View style={[styles.previewBubble, { alignSelf: 'flex-start', backgroundColor: palette.other, borderColor: palette.border }]}><Text style={[styles.previewText, { color: palette.text }]}>Bir oyun daha?</Text></View>
              <View style={[styles.previewBubble, { alignSelf: 'flex-end', backgroundColor: palette.own, borderColor: palette.border }]}><Text style={[styles.previewText, { color: palette.text }]}>Hazırım, başlayalım.</Text></View>
            </View>
            <View style={styles.grid}>
              {CHAT_THEMES.map((preset) => {
                const selected = preset.id === draftId;
                const swatch = getChatThemePalette(preset, tokens.colors);
                return (
                  <Pressable key={preset.id} accessibilityRole="radio" aria-checked={selected} accessibilityLabel={`${preset.name}, ${preset.kind}`} accessibilityState={{ checked: selected, disabled: pending }} disabled={pending} onPress={() => setDraftId(preset.id)} onFocus={() => setFocused(preset.id)} onBlur={() => setFocused(null)} style={({ pressed }) => [styles.option, selected && styles.selected, focused === preset.id && styles.focused, pressed && styles.pressed]}>
                    <View style={styles.swatch}>
                      <ChatWallpaper preset={preset} palette={swatch} />
                      <View style={[styles.swatchBubble, { backgroundColor: swatch.own, borderColor: swatch.border }]} />
                      {selected ? <View style={styles.check}><Ionicons name="checkmark" size={17} color={tokens.colors.foregroundOnAction} /></View> : null}
                    </View>
                    <Text style={styles.optionName}>{preset.name}</Text>
                    <Text style={styles.kind}>{preset.kind}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          <View style={styles.footer}>
            {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: pending }} disabled={pending} onPress={() => void save()} onFocus={() => setFocused('save')} onBlur={() => setFocused(null)} style={({ pressed }) => [styles.save, focused === 'save' && styles.focused, pressed && styles.pressed, pending && styles.pressed]}>
              {pending ? <ActivityIndicator color={tokens.colors.foregroundOnAction} /> : <Text style={styles.saveText}>{draftId === 'default' ? 'Varsayılanı Kullan' : 'Temayı Uygula'}</Text>}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    scrim: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12, backgroundColor: colors.overlayScrim },
    sheet: { width: '100%', maxWidth: 520, maxHeight: '100%', flexShrink: 1, borderRadius: radius.lg, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderStrong, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 18, paddingRight: 8, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.dividerSubtle },
    title: { flex: 1, color: colors.text, fontFamily: fonts.headingBold, fontSize: 19, lineHeight: 26 },
    close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
    content: { padding: 16, gap: 16 },
    helper: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
    preview: { minHeight: 142, justifyContent: 'center', gap: 12, padding: 14, overflow: 'hidden', borderRadius: radius.sm },
    previewBubble: { maxWidth: '92%', paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.sm, borderWidth: 1 },
    previewText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    option: { width: '47%', flexGrow: 1, padding: 6, borderWidth: 2, borderColor: 'transparent', borderRadius: radius.sm },
    selected: { borderColor: colors.primary },
    swatch: { height: 72, overflow: 'hidden', borderRadius: radius.sm, justifyContent: 'flex-end', alignItems: 'flex-end', padding: 10 },
    swatchBubble: { width: 48, height: 18, borderRadius: 5, borderWidth: 1 },
    check: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
    optionName: { marginTop: 7, color: colors.text, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 19 },
    kind: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
    footer: { padding: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.dividerSubtle },
    save: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderRadius: radius.sm, backgroundColor: colors.primary },
    saveText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 21 },
    error: { color: colors.danger, fontFamily: fonts.body, fontSize: 13, lineHeight: 20, marginBottom: 8 },
    focused: { outlineColor: colors.primary, outlineStyle: 'solid', outlineWidth: 2 },
    pressed: { opacity: 0.7 },
  });
}
