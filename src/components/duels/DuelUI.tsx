import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, findNodeHandle, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDashboardTokens, type DashboardTokens } from '../dashboard/dashboardTokens';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import CosmeticPreview from '../cosmetics/CosmeticPreview';
import { DEFAULT_AVATAR_FRAME_ID, getCosmeticById, isCosmeticId } from '../../config/cosmetics';
import { DuelEntrance, useDuelReducedMotion } from './DuelMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function duelCategoryLabel(category: string): string {
  return ({ algorithms: 'Algoritmalar', databases: 'Veritabanları', networking: 'Ağ Sistemleri', security: 'Güvenlik', programming: 'Programlama', testing: 'Test ve Kalite', operations: 'Operasyon' } as Record<string, string>)[category] ?? category;
}

export function useDuelStyles() {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  return { tokens, styles, wide: width >= 900 };
}

export function DuelShell({ title, eyebrow = 'ARKADAŞ 1V1', children, onBack, maxWidth = 1120, actions, subtitle }: {
  title: string; eyebrow?: string; children: React.ReactNode; onBack?: () => void; maxWidth?: number;
  actions?: React.ReactNode; subtitle?: string;
}) {
  const { tokens, styles } = useDuelStyles();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  return <View style={styles.background}>
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.page, { maxWidth }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Geri dön" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace('/(tabs)/play'))} style={({ pressed }) => [styles.back, hovered && styles.controlHover, focused && styles.controlFocus, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} accessible={false} />
          </Pressable>
          <View style={styles.flex}><Text style={styles.eyebrow}>{eyebrow}</Text><Text accessibilityRole="header" style={styles.title}>{title}</Text>{subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}</View>
          {actions && <View style={styles.headerActions}>{actions}</View>}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  </View>;
}

export function DuelButton({ label, onPress, disabled, busy, secondary, danger, icon, quiet, style }: {
  label: string; onPress: () => void; disabled?: boolean; busy?: boolean; secondary?: boolean; danger?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name']; quiet?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const { styles, tokens } = useDuelStyles();
  const reduced = useDuelReducedMotion();
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const inactive = !!(disabled || busy);
  useEffect(() => {
    scale.stopAnimation();
    if (reduced || inactive) { scale.setValue(1); return; }
    const animation = Animated.timing(scale, {
      toValue: pressed ? 0.985 : 1, duration: pressed ? 150 : 180,
      easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [inactive, pressed, reduced, scale]);
  const color = danger ? tokens.colors.danger : secondary || quiet ? tokens.colors.text : tokens.colors.foregroundOnAction;
  return <AnimatedPressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: inactive, busy }} disabled={inactive} onPress={onPress}
    onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}
    onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); setPressed(false); }}
    onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}
    style={[styles.button, secondary && styles.buttonSecondary, quiet && styles.buttonQuiet,
      danger && styles.buttonDanger,
      hovered && !inactive && { backgroundColor: secondary || quiet || danger ? tokens.colors.surfaceHover : tokens.colors.actionHover },
      pressed && !inactive && { backgroundColor: secondary || quiet || danger ? tokens.colors.surfacePressed : tokens.colors.actionPressed, opacity: 0.88 },
      focused && styles.controlFocus, inactive && styles.disabled, style, { transform: [{ scale }] }]}>
    {busy ? <ActivityIndicator size="small" color={color} /> : icon ? <Ionicons name={icon} size={18} color={color} accessible={false} /> : null}
    <Text style={[styles.buttonText, (secondary || quiet) && styles.buttonSecondaryText, danger && styles.buttonDangerText]}>{label}</Text>
  </AnimatedPressable>;
}

/** IDs come from normalized local equipment or the ownership-safe public profile. */
export function DuelAvatar({ name, avatarId, frameId, size = 48 }: {
  name: string; avatarId?: string | null; frameId?: string | null; size?: number;
}) {
  const { styles, tokens } = useDuelStyles();
  const avatar = isCosmeticId(avatarId) ? getCosmeticById(avatarId) : null;
  const frame = isCosmeticId(frameId) ? getCosmeticById(frameId) : getCosmeticById(DEFAULT_AVATAR_FRAME_ID);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [avatarId, frameId]);
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join('').toLocaleUpperCase('tr');
  if (!failed && avatar?.type === 'avatar') {
    if (frame?.type === 'avatar_frame') return <CosmeticPreview avatar={avatar} frame={frame} size={size} accessibilityLabel={`${name} avatarı`} onAssetError={() => setFailed(true)} />;
    return <CosmeticPreview mode="avatarOnly" avatar={avatar} size={size} accessibilityLabel={`${name} avatarı`} onAssetError={() => setFailed(true)} />;
  }
  return <View accessible accessibilityRole="image" accessibilityLabel={`${name || 'Oyuncu'} avatarı`} style={[styles.avatarFallback, { width: size, height: size, borderRadius: Math.min(tokens.radius.md, size / 3) }]}>
    {initials ? <Text style={[styles.avatarInitials, { fontSize: Math.max(14, Math.round(size * 0.3)), lineHeight: Math.round(size * 0.42) }]}>{initials}</Text> : <Ionicons name="person-outline" size={Math.round(size * 0.45)} color={tokens.colors.textSecondary} accessible={false} />}
    {!failed && frame?.type === 'avatar_frame' && frame.id !== DEFAULT_AVATAR_FRAME_ID && <View pointerEvents="none" style={StyleSheet.absoluteFill}><CosmeticPreview mode="frameOnly" frame={frame} size={size} onAssetError={() => setFailed(true)} /></View>}
  </View>;
}

function focusControl(control: View | null) {
  if (!control) return;
  if (Platform.OS === 'web') (control as unknown as { focus?: () => void }).focus?.();
  else {
    const handle = findNodeHandle(control);
    if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
  }
}

export function DuelRules() {
  const { styles, tokens } = useDuelStyles();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [closeFocused, setCloseFocused] = useState(false);
  const trigger = useRef<View>(null);
  const closeButton = useRef<View>(null);
  const hasOpened = useRef(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (open) { hasOpened.current = true; return; }
    if (!hasOpened.current) return;
    const frame = requestAnimationFrame(() => focusControl(trigger.current));
    return () => cancelAnimationFrame(frame);
  }, [open]);
  useEffect(() => {
    if (!open || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close, open]);

  const rules = [
    ['Aynı sorular, eşit süre', 'İki oyuncu aynı 7 soruyu yanıtlar. Her soru için 20 saniyen var; kilitlediğin yanıt değiştirilemez.'],
    ['Kabulden sonra 5 saniye', 'Davet kabul edildiğinde 5 saniyelik geri sayım başlar. Maç iki oyuncu için aynı anda açılır.'],
    ['Soru başına en fazla 100 puan', 'Doğru yanıt 70 puan, hız bonusu 0–20 puan, ilk doğru yanıt bonusu 10 puan. Yanlış ve yanıtsız cevap 0 puan. Toplam puan eşitse beraberlik olur.'],
    ['Her sorudan sonra sonuç', 'İkiniz de yanıtı kilitleyince veya 20 saniye dolunca yanıtlar ve puanlar birlikte açılır. 3 saniyelik geri sayımdan sonra sıradaki soru başlar; son sorudan sonra maç sonucu açılır.'],
    ['Dostça rekabet', 'Bu mod XP, coin, İtibar veya Şirket Bütçesi ödülü vermez.'],
    ['Maç duraklatılmaz', 'Ekrandan ayrılmak maçı durdurmaz; süre işlemeye devam eder. “Maçtan Çekil” işlemini onaylarsan hükmen kaybedersin.'],
  ];
  return <>
    <Pressable ref={trigger} accessibilityRole="button" accessibilityLabel="Nasıl oynanır?" accessibilityState={{ expanded: open }} onPress={() => setOpen(true)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [styles.rulesTrigger, hovered && styles.controlHover, focused && styles.controlFocus, pressed && styles.pressed]}>
      <Ionicons name="help-circle-outline" size={18} color={tokens.colors.textSecondary} accessible={false} />
      <Text style={styles.rulesTriggerText}>Nasıl oynanır?</Text>
    </Pressable>
    <Modal visible={open} transparent animationType="none" onRequestClose={close} onShow={() => focusControl(closeButton.current)}>
      <SafeAreaView style={styles.modalRoot} edges={['top', 'bottom', 'left', 'right']}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessible={false} focusable={false} importantForAccessibility="no" />
        <View role={Platform.OS === 'web' ? 'dialog' : undefined} aria-modal={Platform.OS === 'web' ? true : undefined} accessibilityViewIsModal accessibilityLabel="Kapışma kuralları" style={styles.rulesPanel}>
          <View style={styles.rulesHeading}>
            <View style={styles.flex}><Text style={styles.eyebrow}>ARKADAŞ 1V1</Text><Text accessibilityRole="header" style={styles.sectionTitle}>Kapışma kuralları</Text></View>
            <Pressable ref={closeButton} accessibilityRole="button" accessibilityLabel="Kuralları kapat" onPress={close} onFocus={() => setCloseFocused(true)} onBlur={() => setCloseFocused(false)} style={({ pressed }) => [styles.back, closeFocused && styles.controlFocus, pressed && styles.pressed]}>
              <Ionicons name="close" size={20} color={tokens.colors.text} accessible={false} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.rulesContent}>
            <DuelEntrance style={styles.section}>{rules.map(([heading, copy], index) => <View key={heading} style={styles.ruleRow}>
              <Text style={styles.ruleNumber}>{String(index + 1).padStart(2, '0')}</Text>
              <View style={styles.flex}><Text style={styles.strong}>{heading}</Text><Text style={styles.body}>{copy}</Text></View>
            </View>)}</DuelEntrance>
          </ScrollView>
          <View style={styles.rulesFooter}><DuelButton label="Anladım" secondary onPress={close} /></View>
        </View>
      </SafeAreaView>
    </Modal>
  </>;
}

export function DuelNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { styles } = useDuelStyles();
  return <View accessibilityLiveRegion="polite" style={styles.notice}>
    <Text style={styles.body}>{message}</Text>
    {onRetry && <DuelButton label="Tekrar Dene" secondary onPress={onRetry} />}
  </View>;
}

function makeStyles(t: DashboardTokens) {
  const c = t.colors;
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: c.canvas }, safe: { flex: 1 },
    page: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: t.layout.isCompact ? t.layout.pageGutter : t.layout.pageGutterWide, paddingTop: t.layout.isCompact ? 16 : 28, paddingBottom: t.layout.pageBottom, gap: t.layout.isCompact ? 20 : 28 },
    header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: c.dividerSubtle }, flex: { flex: 1, minWidth: 0 },
    headerActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
    headerSubtitle: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: c.textSecondary, marginTop: 6 },
    back: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: c.secondarySurface, borderRadius: t.radius.sm, borderWidth: 1, borderColor: c.borderSubtle },
    eyebrow: { ...t.type.eyebrow, color: c.primary, fontFamily: fonts.bodySemiBold, marginBottom: 4 },
    title: { ...t.type.display, color: c.text, fontFamily: fonts.headingBold },
    sectionTitle: { fontFamily: fonts.headingBold, fontSize: 18, lineHeight: 25, color: c.text },
    body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: c.textSecondary },
    strong: { color: c.text, fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 22 },
    mono: { color: c.text, fontFamily: fonts.monoSemiBold, fontSize: 16 },
    surface: { ...t.shadow.card, shadowColor: c.shadowNeutral, shadowOpacity: 0.12, shadowRadius: 12, elevation: 2, padding: t.layout.cardPadding, backgroundColor: c.surface, borderRadius: t.radius.md, borderWidth: 1, borderColor: c.border, gap: 16 },
    section: { gap: 12 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.dividerSubtle },
    rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    button: { minHeight: 48, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: c.action, borderRadius: t.radius.sm, borderWidth: 1, borderColor: c.action },
    buttonText: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20, color: c.foregroundOnAction, textAlign: 'center', flexShrink: 1 },
    buttonSecondary: { backgroundColor: c.secondarySurface, borderColor: c.borderStrong }, buttonSecondaryText: { color: c.text },
    buttonQuiet: { backgroundColor: 'transparent', borderColor: 'transparent' },
    buttonDanger: { backgroundColor: c.dangerSoft, borderColor: c.danger }, buttonDangerText: { color: c.danger },
    controlHover: { backgroundColor: c.surfaceHover }, controlFocus: { borderColor: c.actionFocus, ...(Platform.OS === 'web' ? { outlineColor: c.actionFocus, outlineWidth: 2, outlineOffset: 2, outlineStyle: 'solid' as const } : {}) },
    avatarFallback: { backgroundColor: c.secondarySurfaceRaised, borderWidth: 1, borderColor: c.borderSubtle, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    avatarInitials: { color: c.text, fontFamily: fonts.headingSemiBold },
    rulesTrigger: { minHeight: 48, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: t.radius.sm, borderWidth: 1, borderColor: 'transparent' },
    rulesTriggerText: { color: c.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 20 },
    modalRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.overlayScrim, paddingHorizontal: t.layout.pageGutter, paddingVertical: 16 },
    rulesPanel: { ...t.shadow.raised, width: '100%', maxWidth: 560, maxHeight: '94%', backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderStrong, borderRadius: t.radius.lg, overflow: 'hidden' },
    rulesHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderBottomWidth: 1, borderBottomColor: c.dividerSubtle },
    rulesContent: { paddingHorizontal: 20, paddingVertical: 8 }, ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
    ruleNumber: { fontFamily: fonts.monoSemiBold, color: c.textMuted, fontSize: 12, lineHeight: 22 },
    rulesFooter: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.dividerSubtle },
    disabled: { opacity: 0.5 }, pressed: { opacity: 0.72 }, notice: { padding: 16, gap: 12, backgroundColor: c.secondarySurface, borderRadius: t.radius.sm, borderWidth: 1, borderColor: c.borderSubtle },
    columns: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 }, column: { flex: 1, minWidth: 0, gap: 20 },
    selected: { backgroundColor: c.gameSelectionBackground, borderColor: c.gameSelectionBorder },
    timer: { color: c.gameLabelAccent, fontSize: 26, fontFamily: fonts.monoBold },
    score: { color: c.text, fontSize: 36, lineHeight: 48, fontFamily: fonts.monoBold },
    question: { color: c.text, fontSize: 19, lineHeight: 29, fontFamily: fonts.headingSemiBold },
    answer: { minHeight: 56, flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: t.radius.sm, backgroundColor: c.gameAnswerSurface, borderWidth: 1, borderColor: c.borderStrong },
    answerLetter: { color: c.textSecondary, fontFamily: fonts.monoBold, fontSize: 16 },
    success: { color: c.success }, warning: { color: c.warning },
    progressTrack: { height: 4, borderRadius: 2, backgroundColor: c.progressTrack, overflow: 'hidden' }, progress: { height: 4, backgroundColor: c.gameProgress },
  });
}
