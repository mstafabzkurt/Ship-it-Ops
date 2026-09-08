import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import CosmeticFilters, { type CosmeticCategoryFilter } from '../../src/components/cosmetics/CosmeticFilters';
import AssetIcon from '../../src/components/AssetIcon';
import CosmeticStoreCard from '../../src/components/store/CosmeticStoreCard';
import JokerStoreCard from '../../src/components/store/JokerStoreCard';
import StoreTabs, { type StoreTabId } from '../../src/components/store/StoreTabs';
import ThemeStoreCard from '../../src/components/store/ThemeStoreCard';
import StoreFeedback, { useStoreFeedback } from '../../src/components/store/StoreFeedback';
import { getDashboardTokens, type DashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { THEME_ITEMS, type StoreItem } from '../../src/data/storeItems';
import { ECONOMY_ICON_ASSETS, JOKER_ICON_ASSETS } from '../../src/config/iconAssets';
import { getJokerPrice, JOKER_STORE_ORDER, type JokerId } from '../../src/config/jokerEconomy';
import { JOKER_DISPLAY } from '../../src/config/jokers';
import {
  COSMETIC_CATALOG,
  compareCosmeticsByPrice,
  type CosmeticDefinition,
  type CosmeticType,
  type CosmeticCatalogItem,
  type CosmeticId,
} from '../../src/config/cosmetics';
import { useReputation } from '../../src/state/ReputationContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';
import { THEME_METADATA, type Theme } from '../../src/theme/themes';
import { formatBudget, formatCurrency } from '../../src/utils/format';
import { trackEvent } from '../../src/utils/telemetry';

const DEFAULT_THEME_FEATURES = [
  'Dengeli koyu mavi palet (#0B0F17)',
  'Yuvarlak köşeler (borderRadius: 12)',
  'Standart gölge efektleri',
  'Tüm kullanıcılar için ücretsiz — her zaman erişilebilir',
];

const DAYLIGHT_THEME_FEATURES = [
  'Sıcak krem tuval ve near-white kartlar',
  'Lavanta seçim ve birincil aksiyon vurguları',
  'Yumuşak gölgeler ve sakin yüzey hiyerarşisi',
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
  daylight: ['#F7F4EF', '#62558E', '#35677B'],
  theme_cyberpunk: ['#05070A', '#00F5FF', '#FF3CAC'],
  theme_hardware: ['#07120C', '#00FF66', '#6F8F45'],
  theme_nebula: ['#17102E', '#A78BFA', '#E94057'],
};

const THEME_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  daylight: 'sunny-outline',
  theme_cyberpunk: 'hardware-chip-outline',
  theme_hardware: 'terminal-outline',
  theme_nebula: 'planet-outline',
};

const JOKER_CATALOG: Record<JokerId, {
  name: string;
  iconSource: React.ComponentProps<typeof JokerStoreCard>['iconSource'];
  fallbackIcon: React.ComponentProps<typeof JokerStoreCard>['fallbackIcon'];
  description: string;
}> = {
  serverScaleUp: { ...JOKER_DISPLAY.serverScaleUp, iconSource: JOKER_ICON_ASSETS.serverScaleUp, fallbackIcon: 'flash-outline' },
  codeReview: { ...JOKER_DISPLAY.codeReview, iconSource: JOKER_ICON_ASSETS.codeReview, fallbackIcon: 'scan-outline' },
  snapshotBackup: { ...JOKER_DISPLAY.snapshotBackup, iconSource: JOKER_ICON_ASSETS.snapshotBackup, fallbackIcon: 'camera-outline' },
  gitRevert: { ...JOKER_DISPLAY.gitRevert, iconSource: JOKER_ICON_ASSETS.gitRevert, fallbackIcon: 'arrow-undo-outline' },
};

const JOKERS = JOKER_STORE_ORDER.map((id) => ({ id, ...JOKER_CATALOG[id] }));
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
    currentRank,
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
  const activeTabRef = useRef<StoreTabId>('themes');
  const [cosmeticType, setCosmeticType] = useState<CosmeticType>('avatar');
  const [cosmeticCategory, setCosmeticCategory] = useState<CosmeticCategoryFilter>('Tümü');
  const visibleCosmetics = COSMETIC_CATALOG.filter(item => (
    item.type === cosmeticType && (cosmeticCategory === 'Tümü' || (item.category ?? 'Klasik') === cosmeticCategory)
  )).sort(compareCosmeticsByPrice);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const { feedback, showFeedback: showToast } = useStoreFeedback(isScreenFocused);
  const [processingThemeId, setProcessingThemeId] = useState<string | null>(null);
  const [purchasingJokerId, setPurchasingJokerId] = useState<JokerId | null>(null);
  const [processingCosmeticId, setProcessingCosmeticId] = useState<CosmeticId | null>(null);
  const jokerPurchaseGuard = useRef(false);
  const cosmeticActionGuard = useRef(false);
  const isTablet = width >= 700;
  const isDesktop = width >= 1040;
  const jokerPrices = useMemo(() => Object.fromEntries(
    JOKER_STORE_ORDER.map((id) => [id, getJokerPrice(id, currentRank.tier)]),
  ) as Record<JokerId, number>, [currentRank.tier]);
  const jokerCounts = { codeReview, gitRevert, serverScaleUp, snapshotBackup };

  useFocusEffect(useCallback(() => {
    setIsScreenFocused(true);
    void trackEvent('store_opened', { active_tab: activeTabRef.current });
    return () => setIsScreenFocused(false);
  }, []));

  const handleTabChange = useCallback((tab: StoreTabId) => {
    if (activeTabRef.current === tab) return;
    activeTabRef.current = tab;
    setActiveTab(tab);
    void trackEvent('store_tab_changed', { tab });
  }, []);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduceMotion(value);
    }).catch(() => { /* Keep motion disabled if the platform cannot report it. */ });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  const handleThemeAction = async (item: StoreItem) => {
    setProcessingThemeId(item.id);
    try {
      const owned = inventory.includes(item.id);
      if (!owned) {
        const result = await purchaseItem(item.id, item.price);
        if (result === 'ok') {
          void trackEvent('theme_purchased', {
            theme_id: item.themeIdKey ?? item.id,
            price: item.price,
          });
          if (item.themeIdKey) {
            await setThemeId(item.themeIdKey);
            void trackEvent('theme_equipped', { theme_id: item.themeIdKey });
          }
          showToast(`${item.title.replace(/ Tema$/, ' teması')} aktif.`, 'equip', { itemId: item.id, label: 'Satın alındı · Tema aktif', spend: item.price });
        } else if (result === 'already_owned') {
          showToast('Bu tema zaten envanterinde.', 'warning');
        } else {
          showToast(`Yetersiz bütçe! Gerekli: ${formatCurrency(item.price)}`, 'error');
        }
      } else if (item.themeIdKey && themeId !== item.themeIdKey) {
        await setThemeId(item.themeIdKey);
        void trackEvent('theme_equipped', { theme_id: item.themeIdKey });
        showToast(`${item.title.replace(/ Tema$/, ' teması')} aktif.`, 'equip', { itemId: item.id, label: 'Tema aktif' });
      }
    } finally { setProcessingThemeId(null); }
  };

  const handleEquipBuiltIn = async (id: Extract<Theme['id'], 'default' | 'daylight'>) => {
    if (themeId === id) return;
    setProcessingThemeId(id);
    try {
      await setThemeId(id);
      void trackEvent('theme_equipped', { theme_id: id });
      showToast(`${THEME_METADATA[id].title} aktif.`, 'equip', { itemId: id, label: 'Ücretsiz · Tema aktif' });
    } finally { setProcessingThemeId(null); }
  };

  const handleEquipDefault = () => handleEquipBuiltIn('default');

  const handleJokerPurchase = async (joker: (typeof JOKERS)[number]) => {
    if (jokerPurchaseGuard.current) return;
    jokerPurchaseGuard.current = true;
    setPurchasingJokerId(joker.id);

    try {
      const result = await purchaseJoker(joker.id);
      if (result === 'ok') {
        void trackEvent('joker_purchased', {
          joker_type: joker.id,
          price: jokerPrices[joker.id],
          inventory_after: jokerCounts[joker.id] + 1,
          budget_after: Math.max(0, budget - jokerPrices[joker.id]),
        });
        showToast(`${joker.name} envantere eklendi.`, 'success', { itemId: joker.id, label: 'Envantere +1', spend: jokerPrices[joker.id] });
      } else if (result === 'insufficient_funds') {
        showToast(`Yetersiz bütçe. Gerekli: ${formatCurrency(jokerPrices[joker.id])}`, 'error');
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
          void trackEvent('cosmetic_purchased', {
            item_id: item.id,
            item_type: item.type,
            rarity: (item as CosmeticDefinition).rarity ?? 'standard',
            price: item.price,
          });
          showToast(`${item.name} satın alındı.`, 'success', { itemId: item.id, label: 'Satın alındı', spend: item.price });
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
        void trackEvent('cosmetic_equipped', {
          item_id: item.id,
          item_type: item.type,
          rarity: (item as CosmeticDefinition).rarity ?? 'standard',
        });
        showToast(`${item.name} kuşanıldı.`, 'equip', { itemId: item.id, label: 'Kuşanıldı' });
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

  const activeThemeLabel = THEME_METADATA[themeId].title;
  const feedbackFor = (itemId: string) => feedback?.acquisition?.itemId === itemId ? feedback : undefined;

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
                <AssetIcon source={ECONOMY_ICON_ASSETS.coin} fallbackName="wallet-outline" fallbackColor={tokens.colors.warning} size={28} />
                <View>
                  <Text style={styles.budgetLabel}>ŞİRKET BÜTÇESİ</Text>
                  <Text style={styles.budgetValue}>{formatBudget(budget)}</Text>
                  {feedback?.acquisition?.spend ? <Text style={styles.budgetDelta}>−{formatBudget(feedback.acquisition.spend)} · Harcama</Text> : null}
                </View>
              </View>
            </View>

            <StoreTabs activeTab={activeTab} onChange={handleTabChange} />

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
                      disabled={processingThemeId !== null}
                      accessibilityState={{ disabled: processingThemeId !== null, busy: processingThemeId === 'default' }}
                      style={({ pressed }) => [styles.defaultButton, pressed && (reduceMotion ? styles.pressedStill : styles.buttonPressed)]}
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
                      icon="layers-outline"
                      title="Varsayılan Tema"
                      description="Yumuşak koyu palet, yuvarlak köşeler ve dengeli renkler. Tüm kullanıcılar için ücretsiz."
                      features={DEFAULT_THEME_FEATURES}
                      previewColors={THEME_PREVIEWS.default}
                      owned
                      active={themeId === 'default'}
                      canAfford
                      isDefault
                      isProcessing={processingThemeId === 'default'}
                      actionLocked={processingThemeId !== null}
                      reduceMotion={reduceMotion}
                      feedback={feedbackFor('default')}
                      onAction={() => void handleEquipDefault()}
                    />
                  </View>
                  <View style={[styles.themeGridItem, isTablet && styles.themeGridItemTablet]}>
                    <ThemeStoreCard
                      icon={THEME_ICONS.daylight}
                      title={THEME_METADATA.daylight.title}
                      description={THEME_METADATA.daylight.description}
                      features={DAYLIGHT_THEME_FEATURES}
                      previewColors={THEME_PREVIEWS.daylight}
                      previewScheme={{ surface: '#FFFDFA', border: '#D9D5CF', text: '#303641' }}
                      owned
                      active={themeId === 'daylight'}
                      canAfford
                      isProcessing={processingThemeId === 'daylight'}
                      actionLocked={processingThemeId !== null}
                      reduceMotion={reduceMotion}
                      feedback={feedbackFor('daylight')}
                      onAction={() => void handleEquipBuiltIn('daylight')}
                    />
                  </View>
                  {THEME_ITEMS.map((item) => {
                    const owned = inventory.includes(item.id);
                    return (
                      <View key={item.id} style={[styles.themeGridItem, isTablet && styles.themeGridItemTablet]}>
                        <ThemeStoreCard
                          icon={THEME_ICONS[item.id] ?? 'color-palette-outline'}
                          title={item.title}
                          description={item.description}
                          features={THEME_FEATURES[item.id] ?? []}
                          previewColors={THEME_PREVIEWS[item.id]}
                          price={item.price}
                          owned={owned}
                          active={themeId === item.themeIdKey}
                          canAfford={budget >= item.price}
                          isProcessing={processingThemeId === item.id}
                          actionLocked={processingThemeId !== null}
                          reduceMotion={reduceMotion}
                          feedback={feedbackFor(item.id)}
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
                    const price = jokerPrices[joker.id];
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
                          reduceMotion={reduceMotion}
                          feedback={feedbackFor(joker.id)}
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
                    <Text style={styles.collectionEyebrow}>COSMETIC TERMINAL</Text>
                    <Text style={styles.sectionTitle}>Operatör Koleksiyonu</Text>
                    <Text style={styles.sectionDescription}>Tarzını seç. Satın aldığın kozmetikler envanterine eklenir; kuşanmak sana kalır.</Text>
                  </View>
                  <View style={styles.sectionRule} />
                </View>
                <CosmeticFilters items={COSMETIC_CATALOG} type={cosmeticType}
                  onTypeChange={type => { setCosmeticType(type); setCosmeticCategory('Tümü'); }}
                  category={cosmeticCategory} onCategoryChange={setCosmeticCategory} />
                <View style={styles.resultsRow}>
                  <Text accessibilityLiveRegion="polite" style={styles.resultCount}>
                    {cosmeticCategory} · {visibleCosmetics.length} {cosmeticType === 'avatar' ? 'avatar' : 'çerçeve'}
                  </Text>
                  <Text style={styles.sortHint}>Fiyat: artan</Text>
                </View>
                {visibleCosmetics.length ? (
                  <View style={styles.cosmeticGrid}>
                    {visibleCosmetics.map(item => (
                      <View key={item.id} style={[styles.cosmeticGridItem, isTablet && styles.cosmeticGridItemTablet, isDesktop && styles.cosmeticGridItemDesktop]}>
                        <CosmeticStoreCard item={item} owned={ownedCosmeticIds.includes(item.id)}
                          equipped={equippedAvatarId === item.id || equippedAvatarFrameId === item.id}
                          canAfford={budget >= item.price} isProcessing={processingCosmeticId === item.id}
                          actionLocked={processingCosmeticId !== null} reduceMotion={reduceMotion}
                          feedback={feedbackFor(item.id)} onAction={() => void handleCosmeticAction(item)} />
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.sectionTitle}>Bu kategoride henüz kozmetik yok</Text>
                    <Text style={styles.sectionDescription}>Başka bir kategori seçerek koleksiyonu keşfedebilirsin.</Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        </ScrollView>

        <StoreFeedback event={feedback} reduceMotion={reduceMotion} tokens={tokens} />
      </SafeAreaView>
    </View>
  );
}

function makeStyles(tokens: DashboardTokens) {
  const { colors, radius } = tokens;
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
    budgetDelta: { fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 16, color: colors.warning },
    tabContent: { marginTop: tokens.layout.isCompact ? 14 : 22 },
    activeThemeBanner: { minHeight: tokens.layout.isCompact ? 52 : 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 8 : 12, paddingHorizontal: tokens.layout.isCompact ? 10 : 13, paddingVertical: 6, borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    activeThemeCopy: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
    activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.secondary },
    activeThemeLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.textMuted },
    activeThemeName: { fontFamily: fonts.headingBold, fontSize: 15, lineHeight: 20, color: colors.text },
    defaultButton: { minHeight: tokens.control.height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.secondarySurfaceRaised, borderWidth: 1, borderColor: colors.borderSubtle },
    defaultButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.text },
    buttonPressed: tokens.motion.pressed,
    pressedStill: { opacity: 0.85 },
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
    resultsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 10 },
    resultCount: { fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 17, color: colors.textMuted, flexShrink: 1 },
    sortHint: { fontFamily: fonts.body, fontSize: 10, lineHeight: 16, color: colors.textMuted },
    collectionEyebrow: { fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.8, color: colors.warning, marginBottom: 4 },
    emptyState: { padding: 20, borderRadius: radius.md, backgroundColor: colors.secondarySurface },
    cosmeticGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 10 : 14 },
    cosmeticGridItem: { width: '100%' },
    cosmeticGridItemTablet: { width: '48%' },
    cosmeticGridItemDesktop: { width: '32%' },
  });
}
