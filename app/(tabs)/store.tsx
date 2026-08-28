import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import CosmeticStoreCard from '../../src/components/store/CosmeticStoreCard';
import JokerStoreCard from '../../src/components/store/JokerStoreCard';
import StoreTabs, { type StoreTabId } from '../../src/components/store/StoreTabs';
import ThemeStoreCard from '../../src/components/store/ThemeStoreCard';
import { getDashboardTokens, type DashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { THEME_ITEMS, type StoreItem } from '../../src/data/storeItems';
import { JOKER_PRICES, JOKER_STORE_ORDER, type JokerId } from '../../src/config/jokerEconomy';
import {
  COSMETIC_CATALOG,
  type AvatarCosmetic,
  type AvatarFrameCosmetic,
  type CosmeticCatalogItem,
  type CosmeticId,
} from '../../src/config/cosmetics';
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

const JOKER_CATALOG: Record<JokerId, {
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  description: string;
}> = {
  serverScaleUp: { name: 'Scale Up', icon: 'flash-outline', description: 'Müdahale süresini uzatır' },
  codeReview: { name: 'Code Review', icon: 'scan-outline', description: 'İki zayıf seçeneği eler' },
  snapshotBackup: { name: 'Snapshot', icon: 'camera-outline', description: 'Kriz durumunu korur' },
  gitRevert: { name: 'Git Revert', icon: 'arrow-undo-outline', description: 'Son kararı geri alır' },
};

const JOKERS = JOKER_STORE_ORDER.map((id) => ({ id, ...JOKER_CATALOG[id] }));
const AVATAR_COSMETICS = COSMETIC_CATALOG.filter(
  (item): item is AvatarCosmetic => item.type === 'avatar',
);
const AVATAR_FRAME_COSMETICS = COSMETIC_CATALOG.filter(
  (item): item is AvatarFrameCosmetic => item.type === 'avatar_frame',
);

export default function StoreScreen() {
  const { width } = useWindowDimensions();
  const {
    budget,
    inventory,
    purchaseItem,
    purchaseJoker,
    codeReview,
    gitRevert,
    serverScaleUp,
    snapshotBackup,
    ownedCosmeticIds,
    equippedAvatarId,
    equippedAvatarFrameId,
    purchaseCosmetic,
    equipAvatar,
    equipAvatarFrame,
  } = useReputation();
  const { theme, themeId, setThemeId } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [activeTab, setActiveTab] = useState<StoreTabId>('themes');
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', variant: 'success' });
  const [purchasingJokerId, setPurchasingJokerId] = useState<JokerId | null>(null);
  const [processingCosmeticId, setProcessingCosmeticId] = useState<CosmeticId | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jokerPurchaseGuard = useRef(false);
  const cosmeticActionGuard = useRef(false);
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

  const handleJokerPurchase = async (joker: (typeof JOKERS)[number]) => {
    if (jokerPurchaseGuard.current) return;
    jokerPurchaseGuard.current = true;
    setPurchasingJokerId(joker.id);

    try {
      const result = await purchaseJoker(joker.id);
      if (result === 'ok') {
        showToast(`${joker.name} satın alındı. Envanter +1.`, 'success');
      } else if (result === 'insufficient_funds') {
        showToast(`Yetersiz bütçe. Gerekli: ${formatCurrency(JOKER_PRICES[joker.id])}`, 'error');
      } else if (result === 'persistence_error') {
        showToast('Satın alma kaydedilemedi. Lütfen tekrar dene.', 'error');
      }
    } finally {
      jokerPurchaseGuard.current = false;
      setPurchasingJokerId(null);
    }
  };

  const handleCosmeticAction = async (item: CosmeticCatalogItem) => {
    if (cosmeticActionGuard.current) return;
    cosmeticActionGuard.current = true;
    setProcessingCosmeticId(item.id);

    try {
      const owned = ownedCosmeticIds.includes(item.id);
      if (!owned) {
        const result = await purchaseCosmetic(item.id);
        if (result === 'ok') {
          showToast(`${item.name} envantere eklendi.`, 'success');
        } else if (result === 'insufficient_funds') {
          showToast(`Yetersiz bütçe. Gerekli: ${formatCurrency(item.price)}`, 'error');
        } else if (result === 'already_owned') {
          showToast('Bu kozmetik zaten envanterinde.', 'warning');
        } else if (result === 'persistence_error') {
          showToast('Kozmetik satın alımı kaydedilemedi. Lütfen tekrar dene.', 'error');
        }
        return;
      }

      const result = item.type === 'avatar'
        ? await equipAvatar(item.id)
        : await equipAvatarFrame(item.id);
      if (result === 'ok') {
        showToast(`${item.name} kuşanıldı.`, 'equip');
      } else if (result === 'not_owned') {
        showToast('Bu kozmetik envanterinde bulunmuyor.', 'warning');
      } else if (result === 'persistence_error') {
        showToast('Kozmetik seçimi kaydedilemedi. Lütfen tekrar dene.', 'error');
      }
    } finally {
      cosmeticActionGuard.current = false;
      setProcessingCosmeticId(null);
    }
  };

  const activeThemeLabel = themeId === 'cyberpunk'
    ? 'Cyberpunk'
    : themeId === 'hardware'
      ? 'Hardware'
      : themeId === 'nebula'
        ? 'Nebula'
        : 'Varsayılan';
  const jokerCounts = { codeReview, gitRevert, serverScaleUp, snapshotBackup };
  const toastColor = toast.variant === 'error'
    ? tokens.colors.danger
    : toast.variant === 'success'
      ? tokens.colors.secondary
      : tokens.colors.warning;

  return (
    <View style={styles.background}>
      <View pointerEvents="none" style={styles.topRule} />
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
                <Ionicons name="wallet-outline" size={18} color={tokens.colors.warning} />
                <View>
                <Text style={styles.budgetLabel}>ŞİRKET BÜTÇESİ</Text>
                <Text style={styles.budgetValue}>{formatCurrency(budget)}</Text>
                </View>
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
                  <View style={styles.sectionHeadingCopy}>
                    <Text style={styles.sectionTitle}>Temalar</Text>
                    <Text style={styles.sectionDescription}>Satın aldığın temaları istediğin zaman yeniden kuşanabilirsin.</Text>
                  </View>
                  <View style={styles.sectionRule} />
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
                  <View style={styles.sectionHeadingCopy}>
                    <Text style={styles.sectionTitle}>Jokerler</Text>
                    <Text style={styles.sectionDescription}>Operasyon jokerlerini tekli satın al; envanterin anında güncellensin.</Text>
                  </View>
                  <View style={styles.sectionRule} />
                </View>
                <View style={styles.jokerGrid}>
                  {JOKERS.map((joker) => {
                    const price = JOKER_PRICES[joker.id];
                    return (
                      <View
                        key={joker.id}
                        style={[
                          styles.jokerGridItem,
                          isTablet && styles.jokerGridItemTablet,
                          isDesktop && styles.jokerGridItemDesktop,
                        ]}
                      >
                        <JokerStoreCard
                          {...joker}
                          count={jokerCounts[joker.id]}
                          price={price}
                          canAfford={budget >= price}
                          isProcessing={purchasingJokerId === joker.id}
                          purchaseLocked={purchasingJokerId !== null}
                          onPurchase={() => void handleJokerPurchase(joker)}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {activeTab === 'cosmetics' ? (
              <View style={styles.tabContent}>
                <View style={styles.sectionHeading}>
                  <View style={styles.sectionHeadingCopy}>
                    <Text style={styles.sectionTitle}>Avatarlar</Text>
                    <Text style={styles.sectionDescription}>Operatör kimliğini seç; satın aldığın avatarları istediğin zaman kuşan.</Text>
                  </View>
                  <View style={styles.sectionRule} />
                </View>
                <View style={styles.cosmeticGrid}>
                  {AVATAR_COSMETICS.map((item) => {
                    const owned = ownedCosmeticIds.includes(item.id);
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.cosmeticGridItem,
                          isTablet && styles.cosmeticGridItemTablet,
                          isDesktop && styles.cosmeticGridItemDesktop,
                        ]}
                      >
                        <CosmeticStoreCard
                          item={item}
                          owned={owned}
                          equipped={equippedAvatarId === item.id}
                          canAfford={budget >= item.price}
                          isProcessing={processingCosmeticId === item.id}
                          actionLocked={processingCosmeticId !== null}
                          onAction={() => void handleCosmeticAction(item)}
                        />
                      </View>
                    );
                  })}
                </View>

                <View style={[styles.sectionHeading, styles.cosmeticSectionHeading]}>
                  <View style={styles.sectionHeadingCopy}>
                    <Text style={styles.sectionTitle}>Avatar Çerçeveleri</Text>
                    <Text style={styles.sectionDescription}>Profil kimliğini tamamlayan operasyon çerçeveleri.</Text>
                  </View>
                  <View style={styles.sectionRule} />
                </View>
                <View style={styles.cosmeticGrid}>
                  {AVATAR_FRAME_COSMETICS.map((item) => {
                    const owned = ownedCosmeticIds.includes(item.id);
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.cosmeticGridItem,
                          isTablet && styles.cosmeticGridItemTablet,
                          isDesktop && styles.cosmeticGridItemDesktop,
                        ]}
                      >
                        <CosmeticStoreCard
                          item={item}
                          owned={owned}
                          equipped={equippedAvatarFrameId === item.id}
                          canAfford={budget >= item.price}
                          isProcessing={processingCosmeticId === item.id}
                          actionLocked={processingCosmeticId !== null}
                          onAction={() => void handleCosmeticAction(item)}
                        />
                      </View>
                    );
                  })}
                </View>
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
    containerDesktop: { paddingHorizontal: tokens.layout.pageGutterWide },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 10 : 18, marginBottom: tokens.layout.isCompact ? 12 : 20 },
    headerCopy: { flex: 1, minWidth: 240 },
    eyebrow: { ...tokens.type.eyebrow, fontFamily: fonts.bodySemiBold, color: colors.secondary, marginBottom: 4 },
    headerTitle: { ...tokens.type.display, fontFamily: fonts.headingBold, color: colors.text },
    headerDescription: { ...tokens.type.bodySmall, maxWidth: 560, fontFamily: fonts.body, color: colors.textMuted, marginTop: 3 },
    budgetCard: { minWidth: tokens.layout.isCompact ? 0 : 190, flexGrow: tokens.layout.isCompact ? 1 : 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 13, borderLeftWidth: 2, borderLeftColor: colors.warning },
    budgetLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.65, color: colors.textMuted },
    budgetValue: { fontFamily: fonts.monoBold, fontSize: tokens.layout.isCompact ? 20 : 23, lineHeight: tokens.layout.isCompact ? 25 : 29, color: colors.warning, marginTop: 1 },
    tabContent: { marginTop: tokens.layout.isCompact ? 14 : 22 },
    activeThemeBanner: { minHeight: tokens.layout.isCompact ? 52 : 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 8 : 12, paddingHorizontal: tokens.layout.isCompact ? 10 : 13, paddingVertical: 6, borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    activeThemeCopy: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
    activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.secondary },
    activeThemeLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.textMuted },
    activeThemeName: { fontFamily: fonts.headingBold, fontSize: 15, lineHeight: 20, color: colors.text },
    defaultButton: { minHeight: tokens.control.height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.secondarySurfaceRaised, borderWidth: 1, borderColor: colors.borderSubtle },
    defaultButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.text },
    buttonPressed: tokens.motion.pressed,
    sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: tokens.layout.isCompact ? 16 : 24, marginBottom: tokens.layout.isCompact ? 10 : 14 },
    sectionHeadingCopy: { flexShrink: 1, minWidth: 0, maxWidth: 650 },
    sectionRule: { flex: 1, height: 1, marginBottom: 5, backgroundColor: colors.dividerSubtle },
    sectionTitle: { ...tokens.type.title, fontFamily: fonts.headingBold, color: colors.text },
    sectionDescription: { ...tokens.type.bodySmall, maxWidth: 650, fontFamily: fonts.body, color: colors.textMuted, marginTop: 3 },
    themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 10 : 14 },
    themeGridItem: { width: '100%' },
    themeGridItemTablet: { width: '48%', flexGrow: 1 },
    jokerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 10 : 14 },
    jokerGridItem: { width: '100%' },
    jokerGridItemTablet: { width: '48%', flexGrow: 1 },
    jokerGridItemDesktop: { width: '23%', flexGrow: 1 },
    cosmeticSectionHeading: { marginTop: tokens.layout.isCompact ? 22 : 30 },
    cosmeticGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 10 : 14 },
    cosmeticGridItem: { width: '100%' },
    cosmeticGridItemTablet: { width: '48%', flexGrow: 1 },
    cosmeticGridItemDesktop: { width: '31%', flexGrow: 1 },
    toast: { position: 'absolute', left: tokens.layout.pageGutter, right: tokens.layout.pageGutter, bottom: tokens.layout.floatingInset, maxWidth: 620, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 13, borderRadius: radius.lg, backgroundColor: colors.surfaceRaised, borderWidth: 1, ...shadow.raised },
    toastText: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  });
}
