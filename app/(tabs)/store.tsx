import React, { useState, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReputation } from '../../src/state/ReputationContext';
import { OFFICE_ITEMS, PREMIUM_ITEMS, type StoreItem } from '../../src/data/storeItems';
import { colors } from '../../src/theme/colors';
import { fonts, fontSizes } from '../../src/theme/typography';

// ---------------------------------------------------------------------------
// Toast types
// ---------------------------------------------------------------------------
type ToastVariant = 'success' | 'error' | 'warning';
interface ToastState {
  visible: boolean;
  message: string;
  variant: ToastVariant;
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function StoreScreen() {
  const { budget, techTokens, inventory, purchaseItem } = useReputation();
  const [activeTab, setActiveTab] = useState<'office' | 'premium'>('office');

  // Toast state
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', variant: 'success' });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      }).start(() => setToast(prev => ({ ...prev, visible: false })));
    }, 2800);
  };

  const handlePurchase = async (item: StoreItem) => {
    const currency = item.category === 'office' ? 'budget' : 'tt';
    const result = await purchaseItem(item.id, currency, item.price);
    if (result === 'ok') {
      showToast(`✓ "${item.title}" satın alındı!`, 'success');
    } else if (result === 'already_owned') {
      showToast(`Bu ürün zaten envanterinde var.`, 'warning');
    } else {
      showToast(
        currency === 'budget'
          ? `Yetersiz bütçe! Gerekli: $${item.price.toLocaleString('tr-TR')}`
          : `Yetersiz TechToken! Gerekli: ${item.price} tt`,
        'error',
      );
    }
  };

  const activeItems = activeTab === 'office' ? OFFICE_ITEMS : PREMIUM_ITEMS;

  const toastBorderColor =
    toast.variant === 'success'
      ? colors.accentPositive
      : toast.variant === 'error'
        ? colors.accentDanger
        : colors.accentAlert;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ---- Header ---- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛍️ Şirket Mağazası</Text>
        <Text style={styles.headerSub}>Bütçeni ve TechToken'ını akıllıca harca</Text>
      </View>

      {/* ---- Currency Bar ---- */}
      <View style={styles.currencyBar}>
        <View style={styles.currencyChip}>
          <Text style={styles.currencyIcon}>💰</Text>
          <View>
            <Text style={styles.currencyLabel}>Şirket Bütçesi</Text>
            <Text style={styles.currencyValue}>${budget.toLocaleString('tr-TR')}</Text>
          </View>
        </View>
        <View style={styles.currencySep} />
        <View style={styles.currencyChip}>
          <Text style={styles.currencyIcon}>🪙</Text>
          <View>
            <Text style={styles.currencyLabel}>TechToken</Text>
            <Text style={[styles.currencyValue, styles.ttValue]}>{techTokens} tt</Text>
          </View>
        </View>
      </View>

      {/* ---- Segmented Tabs ---- */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'office' && styles.tabButtonActive]}
          onPress={() => setActiveTab('office')}
          activeOpacity={0.8}
        >
          <Text style={styles.tabIcon}>🏢</Text>
          <Text style={[styles.tabLabel, activeTab === 'office' && styles.tabLabelActive]}>
            Ofis &amp; Bütçe
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'premium' && styles.tabButtonPremiumActive]}
          onPress={() => setActiveTab('premium')}
          activeOpacity={0.8}
        >
          <Text style={styles.tabIcon}>⚡</Text>
          <Text style={[styles.tabLabel, activeTab === 'premium' && styles.tabLabelPremiumActive]}>
            Premium / tt
          </Text>
        </TouchableOpacity>
      </View>

      {/* ---- Category Hint ---- */}
      <View
        style={[
          styles.categoryHint,
          activeTab === 'premium' && styles.categoryHintPremium,
        ]}
      >
        <Text style={styles.categoryHintText}>
          {activeTab === 'office'
            ? '💰 Ofis ürünleri şirket bütçesiyle satın alınır'
            : '⚡ Premium içerikler TechToken (tt) ile satın alınır'}
        </Text>
      </View>

      {/* ---- Items List ---- */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeItems.map((item) => {
          const owned = inventory.includes(item.id);
          const canAfford =
            item.category === 'office' ? budget >= item.price : techTokens >= item.price;

          return (
            <StoreCard
              key={item.id}
              item={item}
              owned={owned}
              canAfford={canAfford}
              onBuy={handlePurchase}
            />
          );
        })}
        {/* Bottom padding to avoid tab bar overlap */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ---- Toast Notification ---- */}
      {toast.visible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { borderColor: toastBorderColor },
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
                {
                  scale: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.94, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.toastText, { color: toastBorderColor }]}>{toast.message}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// StoreCard Component
// ---------------------------------------------------------------------------
interface StoreCardProps {
  item: StoreItem;
  owned: boolean;
  canAfford: boolean;
  onBuy: (item: StoreItem) => void;
}

function StoreCard({ item, owned, canAfford, onBuy }: StoreCardProps) {
  const isPremium = item.category === 'premium';
  const currency = isPremium ? 'tt' : '$';
  const priceDisplay = isPremium
    ? `${item.price} tt`
    : `$${item.price.toLocaleString('tr-TR')}`;

  const buttonDisabled = owned || !canAfford;

  const buttonStyle = [
    styles.buyButton,
    owned
      ? styles.buyButtonOwned
      : canAfford
        ? isPremium
          ? styles.buyButtonPremium
          : styles.buyButtonBudget
        : styles.buyButtonDisabled,
  ];

  const buttonLabel = owned
    ? '✓ Sahip Olundu'
    : canAfford
      ? isPremium
        ? `⚡ ${priceDisplay} ile Al`
        : `💰 ${priceDisplay} ile Satın Al`
      : 'Yetersiz Bakiye';

  return (
    <View
      style={[
        styles.card,
        owned && styles.cardOwned,
        isPremium && styles.cardPremium,
      ]}
    >
      {/* Left: Icon */}
      <View
        style={[
          styles.cardIconWrap,
          owned && styles.cardIconWrapOwned,
          isPremium && !owned && styles.cardIconWrapPremium,
        ]}
      >
        <Text style={styles.cardIcon}>{item.icon}</Text>
      </View>

      {/* Middle: Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {owned && (
            <View style={styles.ownedBadge}>
              <Text style={styles.ownedBadgeText}>KİLİTSİZ</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Price tag */}
        <View style={styles.priceRow}>
          <View
            style={[
              styles.priceTag,
              isPremium ? styles.priceTagPremium : styles.priceTagBudget,
            ]}
          >
            <Text
              style={[
                styles.priceTagText,
                isPremium ? styles.priceTagTextPremium : styles.priceTagTextBudget,
              ]}
            >
              {priceDisplay}
            </Text>
          </View>
        </View>

        {/* Buy Button */}
        <TouchableOpacity
          style={buttonStyle}
          onPress={() => !buttonDisabled && onBuy(item)}
          activeOpacity={buttonDisabled ? 1 : 0.75}
          disabled={buttonDisabled}
        >
          <Text
            style={[
              styles.buyButtonText,
              owned ? styles.buyButtonTextOwned : !canAfford ? styles.buyButtonTextDisabled : null,
            ]}
          >
            {buttonLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },

  /* Header */
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes['3xl'],
    color: colors.textPrimary,
  },
  headerSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },

  /* Currency Bar */
  currencyBar: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  currencyChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencyIcon: {
    fontSize: 22,
  },
  currencyLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  currencyValue: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.lg,
    color: colors.accentPositive,
    marginTop: 1,
  },
  ttValue: {
    color: colors.accentAlert,
  },
  currencySep: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
    marginHorizontal: 14,
  },

  /* Tab Bar */
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: colors.positiveBg,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
  },
  tabButtonPremiumActive: {
    backgroundColor: colors.alertBg,
    borderWidth: 1,
    borderColor: colors.alertBorder,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.accentPositive,
  },
  tabLabelPremiumActive: {
    color: colors.accentAlert,
  },

  /* Category Hint */
  categoryHint: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.positiveBg,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
  },
  categoryHintPremium: {
    backgroundColor: colors.alertBg,
    borderColor: colors.alertBorder,
  },
  categoryHintText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },

  /* Store Card */
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 14,
  },
  cardOwned: {
    borderColor: colors.positiveBorder,
    backgroundColor: colors.positiveBg,
  },
  cardPremium: {
    borderColor: colors.alertBorder,
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.panelAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
  },
  cardIconWrapOwned: {
    borderColor: colors.positiveBorder,
    backgroundColor: colors.positiveBg,
  },
  cardIconWrapPremium: {
    borderColor: colors.alertBorder,
    backgroundColor: colors.alertBg,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
    gap: 5,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontFamily: fonts.headingSemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    flex: 1,
  },
  ownedBadge: {
    backgroundColor: colors.positiveBg,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  ownedBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    color: colors.accentPositive,
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  priceTagBudget: {
    backgroundColor: 'rgba(53,201,163,0.08)',
    borderColor: colors.positiveBorder,
  },
  priceTagPremium: {
    backgroundColor: 'rgba(242,169,59,0.10)',
    borderColor: colors.alertBorder,
  },
  priceTagText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.sm,
  },
  priceTagTextBudget: {
    color: colors.accentPositive,
  },
  priceTagTextPremium: {
    color: colors.accentAlert,
  },

  /* Buy Button */
  buyButton: {
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  buyButtonBudget: {
    backgroundColor: colors.accentPositive,
  },
  buyButtonPremium: {
    backgroundColor: colors.accentAlert,
  },
  buyButtonOwned: {
    backgroundColor: colors.positiveBg,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
  },
  buyButtonDisabled: {
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buyButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.bgBase,
  },
  buyButtonTextOwned: {
    color: colors.accentPositive,
  },
  buyButtonTextDisabled: {
    color: colors.textMuted,
  },

  /* Toast */
  toast: {
    position: 'absolute',
    bottom: 28,
    left: 20,
    right: 20,
    backgroundColor: colors.panelAlt,
    borderWidth: 1.5,
    borderRadius: 13,
    paddingVertical: 13,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  toastText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
  },
});
