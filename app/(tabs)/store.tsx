import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import JokerStoreCard from '../../src/components/store/JokerStoreCard';
import StoreComingSoon from '../../src/components/store/StoreComingSoon';
import StoreTabs, { type StoreTabId } from '../../src/components/store/StoreTabs';
import ThemeStoreCard from '../../src/components/store/ThemeStoreCard';
import { dashboardType, getDashboardTokens, type DashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { THEME_ITEMS, type StoreItem } from '../../src/data/storeItems';
import { useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';
import { formatCurrency } from '../../src/utils/format';

type ToastVariant = 'success' | 'error' | 'warning' | 'equip';
interface ToastState { visible: boolean; message: string; variant: ToastVariant }

const DEFAULT_THEME_FEATURES = [
  'Dengeli koyu mavi palet (#0B0F17)',
  'Yuvarlak köşeler (borderRadius: 12)',
  'Standart gölge efektleri',
  'Tüm kullanıcılar için ücretsiz — her zaman erişilebilir',
];

const THEME_FEATURES: Record<string, string[]> = {
  theme_cyberpunk: [
    'Neon Cyan & Neon Pembe vurgular',
    'Keskin köşeler (borderRadius: 2)',
    'Agresif glow efektleri',
    'Derin siyah arka plan (#05070A)',
  ],
  theme_hardware: [
    'Fosforlu yeşil (#00FF66) vurgu',
    'Keskin sıfır köşe estetiği (borderRadius: 0)',
    'Taktik orman yeşili panel renkleri',
    'Saha operasyonları için optimize görsel hiyerarşi',
  ],
  theme_nebula: [
    'Derin uzay morları + magenta gradyan arka plan',
    'Premium yuvarlak köşeler (borderRadius: 16)',
    'Violet (#A78BFA) & magenta (#E94057) aksentler',
    'LinearGradient — sadece bu temada aktif',
  ],
};

const THEME_PREVIEWS: Record<string, [string, string, string]> = {
  default: ['#111229', '#8B7CF6', '#49D7C5'],
  theme_cyberpunk: ['#05070A', '#00F5FF', '#FF3CAC'],
  theme_hardware: ['#07120C', '#00FF66', '#6F8F45'],
  theme_nebula: ['#17102E', '#A78BFA', '#E94057'],
};

const JOKERS = [
  { id: 'codeReview', name: 'Code Review', icon: '🔍', description: 'İki zayıf seçeneği eler' },
  { id: 'gitRevert', name: 'Git Revert', icon: '↩️', description: 'Son kararı geri alır' },
  { id: 'serverScaleUp', name: 'Scale Up', icon: '⚡', description: 'Müdahale süresini uzatır' },
  { id: 'snapshotBackup', name: 'Snapshot', icon: '📸', description: 'Kriz durumunu korur' },
] as const;

export default function StoreScreen() {
  const { width } = useWindowDimensions();
  const {
    budget,
    inventory,
    purchaseItem,
    codeReview,
    gitRevert,
    serverScaleUp,
    snapshotBackup,
  } = useReputation();
  const { theme, themeId, setThemeId } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [activeTab, setActiveTab] = useState<StoreTabId>('themes');
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', variant: 'success' });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTablet = width >= 700;
  const isDesktop = width >= 1040;

  useEffect(() => () => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
  }, []);

  const showToast = (message: string, variant: ToastVariant) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ visible: true, message, variant });
    toastAnim.setValue(0);
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();
    toastTimeout.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => setToast((previous) => ({ ...previous, visible: false })));
    }, 3000);
  };

  const handleThemeAction = async (item: StoreItem) => {
    const owned = inventory.includes(item.id);
    if (!owned) {
      const result = await purchaseItem(item.id, item.price);
      if (result === 'ok') {
        if (item.themeIdKey) await setThemeId(item.themeIdKey);
        showToast(`⚡ "${item.title}" satın alındı ve etkinleştirildi!`, 'equip');
      } else if (result === 'already_owned') {
        showToast('Bu tema zaten envanterinde.', 'warning');
      } else {
        showToast(`Yetersiz bütçe! Gerekli: ${formatCurrency(item.price)}`, 'error');
      }
    } else if (item.themeIdKey && themeId !== item.themeIdKey) {
      await setThemeId(item.themeIdKey);
      showToast(`⚡ "${item.title}" etkinleştirildi!`, 'equip');
    }
  };

  const handleEquipDefault = async () => {
    if (themeId === 'default') return;
    await setThemeId('default');
    showToast('✓ Varsayılan tema etkinleştirildi.', 'success');
  };

  const activeThemeLabel = themeId === 'cyberpunk'
    ? '⚡ Cyberpunk'
    : themeId === 'hardware'
      ? '🖥️ Hardware'
      : themeId === 'nebula'
        ? '🌌 Nebula'
        : '🌑 Varsayılan';
  const jokerCounts = { codeReview, gitRevert, serverScaleUp, snapshotBackup };
  const toastColor = toast.variant === 'error'
    ? tokens.colors.danger
    : toast.variant === 'success'
      ? tokens.colors.secondary
      : tokens.colors.warning;

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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.container, isDesktop && styles.containerDesktop]}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>OPERASYON TEDARİK MERKEZİ</Text>
                <Text style={styles.headerTitle}>Mağaza</Text>
                <Text style={styles.headerDescription}>Operasyon görünümünü ve oyun envanterini buradan yönet.</Text>
              </View>
              <View style={styles.budgetCard}>
                <Text style={styles.budgetLabel}>ŞİRKET BÜTÇESİ</Text>
                <Text style={styles.budgetValue}>{formatCurrency(budget)}</Text>
              </View>
            </View>

            <StoreTabs activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === 'themes' ? (
              <View style={styles.tabContent}>
                <View style={styles.activeThemeBanner}>
                  <View style={styles.activeThemeCopy}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeThemeLabel}>Aktif Tema:</Text>
                    <Text style={styles.activeThemeName}>{activeThemeLabel}</Text>
                  </View>
                  {themeId !== 'default' ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Varsayılan temaya dön"
                      onPress={handleEquipDefault}
                      style={({ pressed }) => [styles.defaultButton, pressed && styles.buttonPressed]}
                    >
                      <Text style={styles.defaultButtonText}>Varsayılana Dön</Text>
                    </Pressable>
                  ) : null}
                </View>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>Temalar</Text>
                  <Text style={styles.sectionDescription}>Satın aldığın temaları istediğin zaman yeniden kuşanabilirsin.</Text>
                </View>
                <View style={styles.themeGrid}>
                  <View style={[styles.themeGridItem, isTablet && styles.themeGridItemTablet]}>
                    <ThemeStoreCard
                      icon="🌑"
                      title="Varsayılan Tema"
                      description="Yumuşak koyu palet, yuvarlak köşeler ve dengeli renkler. Tüm kullanıcılar için ücretsiz."
                      features={DEFAULT_THEME_FEATURES}
                      previewColors={THEME_PREVIEWS.default}
                      owned
                      active={themeId === 'default'}
                      canAfford
                      isDefault
                      onAction={() => void handleEquipDefault()}
                    />
                  </View>
                  {THEME_ITEMS.map((item) => {
                    const owned = inventory.includes(item.id);
                    return (
                      <View key={item.id} style={[styles.themeGridItem, isTablet && styles.themeGridItemTablet]}>
                        <ThemeStoreCard
                          icon={item.icon}
                          title={item.title}
                          description={item.description}
                          features={THEME_FEATURES[item.id] ?? []}
                          previewColors={THEME_PREVIEWS[item.id]}
                          price={item.price}
                          owned={owned}
                          active={themeId === item.themeIdKey}
                          canAfford={budget >= item.price}
                          onAction={() => void handleThemeAction(item)}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {activeTab === 'jokers' ? (
              <View style={styles.tabContent}>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>Jokerler</Text>
                  <Text style={styles.sectionDescription}>Mevcut oyun jokerlerin ve envanter adetlerin.</Text>
                </View>
                <View style={styles.jokerNotice}>
                  <Text style={styles.jokerNoticeText}>Joker satın alma özelliği yakında eklenecek. Mevcut adetlerini buradan takip edebilirsin.</Text>
                </View>
                <View style={styles.jokerGrid}>
                  {JOKERS.map((joker) => (
                    <View
                      key={joker.id}
                      style={[
                        styles.jokerGridItem,
                        isTablet && styles.jokerGridItemTablet,
                        isDesktop && styles.jokerGridItemDesktop,
                      ]}
                    >
                      <JokerStoreCard {...joker} count={jokerCounts[joker.id]} />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {activeTab === 'cosmetics' ? (
              <View style={styles.tabContent}>
                <StoreComingSoon />
              </View>
            ) : null}
          </View>
        </ScrollView>

        {toast.visible ? (
          <Animated.View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            pointerEvents="none"
            style={[
              styles.toast,
              { borderColor: toastColor },
              {
                opacity: toastAnim,
                transform: [
                  { translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                  { scale: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
                ],
              },
            ]}
          >
            <Text style={[styles.toastText, { color: toastColor }]}>{toast.message}</Text>
          </Animated.View>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

function makeStyles(tokens: DashboardTokens) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    orbPrimary: { position: 'absolute', width: 300, height: 300, top: -175, right: -105, borderRadius: 150, backgroundColor: colors.primarySoft, opacity: 0.7 },
    orbSecondary: { position: 'absolute', width: 250, height: 250, top: 560, left: -180, borderRadius: 125, backgroundColor: colors.secondarySoft, opacity: 0.4 },
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: tokens.layout.pageBottom },
    container: { width: '100%', maxWidth: tokens.layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: tokens.layout.pageGutter, paddingTop: tokens.layout.pageTop },
    containerDesktop: { paddingHorizontal: tokens.layout.pageGutterWide },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18, marginBottom: 20 },
    headerCopy: { flex: 1, minWidth: 240 },
    eyebrow: { ...dashboardType.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.secondary, marginBottom: 5 },
    headerTitle: { ...dashboardType.display, fontFamily: fonts.headingBold, color: colors.text },
    headerDescription: { ...dashboardType.bodySmall, maxWidth: 560, fontFamily: fonts.body, color: colors.textMuted, marginTop: 4 },
    budgetCard: { minWidth: 190, paddingHorizontal: 17, paddingVertical: 13, borderRadius: radius.lg, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warning, ...shadow.card },
    budgetLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.65, color: colors.textMuted },
    budgetValue: { fontFamily: fonts.monoBold, fontSize: 23, lineHeight: 29, color: colors.warning, marginTop: 2 },
    tabContent: { marginTop: 22 },
    activeThemeBanner: { minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: 13, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, ...shadow.card },
    activeThemeCopy: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
    activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.secondary, shadowColor: colors.secondary, shadowOpacity: 0.55, shadowRadius: 7 },
    activeThemeLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.textMuted },
    activeThemeName: { fontFamily: fonts.headingBold, fontSize: 15, lineHeight: 20, color: colors.text },
    defaultButton: { minHeight: tokens.control.height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderStrong },
    defaultButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.text },
    buttonPressed: tokens.motion.pressed,
    sectionHeading: { marginTop: 24, marginBottom: 14 },
    sectionTitle: { ...dashboardType.title, fontFamily: fonts.headingBold, color: colors.text },
    sectionDescription: { ...dashboardType.bodySmall, maxWidth: 650, fontFamily: fonts.body, color: colors.textMuted, marginTop: 4 },
    themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    themeGridItem: { width: '100%' },
    themeGridItemTablet: { width: '48%', flexGrow: 1 },
    jokerNotice: { marginBottom: 14, padding: 13, borderRadius: radius.md, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warning },
    jokerNoticeText: { ...dashboardType.bodySmall, fontFamily: fonts.bodyMedium, color: colors.warning },
    jokerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    jokerGridItem: { width: '100%' },
    jokerGridItemTablet: { width: '48%', flexGrow: 1 },
    jokerGridItemDesktop: { width: '23%', flexGrow: 1 },
    toast: { position: 'absolute', left: tokens.layout.pageGutter, right: tokens.layout.pageGutter, bottom: tokens.layout.floatingInset, maxWidth: 620, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 13, borderRadius: radius.lg, backgroundColor: colors.surfaceRaised, borderWidth: 1, ...shadow.raised },
    toastText: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  });
}
