import React, { useRef, useState } from 'react';
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
import { useRoom, type UpgradeResult } from '../../src/state/RoomContext';
import { useReputation } from '../../src/state/ReputationContext';
import { type RoomItem } from '../../src/data/roomItems';
import { colors } from '../../src/theme/colors';
import { fonts, fontSizes } from '../../src/theme/typography';

// ─────────────────────────────────────────────────────────────────────────────
// Toast helpers (same pattern as existing StoreScreen)
// ─────────────────────────────────────────────────────────────────────────────
type ToastVariant = 'success' | 'error' | 'warning';
interface ToastState {
  visible: boolean;
  message: string;
  variant: ToastVariant;
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomStoreScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function RoomStoreScreen() {
  const { roomItems, upgradeItem } = useRoom();
  const { budget } = useReputation();

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    variant: 'success',
  });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Toast animation ────────────────────────────────────────────────────
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
      }).start(() => setToast((prev) => ({ ...prev, visible: false })));
    }, 2800);
  };

  // ── Upgrade handler ───────────────────────────────────────────────────
  const handleUpgrade = async (item: RoomItem) => {
    const result: UpgradeResult = await upgradeItem(item.id);

    if (result === 'ok') {
      // item.currentLevel still reflects the old level at this point in the
      // closure, so +1 gives us the newly achieved level.
      const achievedLevel = item.currentLevel + 1;
      const levelLabel = item.levels[achievedLevel - 1]?.label ?? `Seviye ${achievedLevel}`;
      const verb = item.currentLevel === 0 ? 'yerleştirildi' : 'yükseltildi';
      showToast(`✓ "${item.name}" ${verb}! → ${levelLabel}`, 'success');
    } else if (result === 'max_level') {
      showToast(`${item.name} zaten maksimum seviyede.`, 'warning');
    } else {
      const nextPrice = item.levels[item.currentLevel]?.price ?? 0;
      showToast(
        `Yetersiz bütçe! Gerekli: $${nextPrice.toLocaleString('tr-TR')}`,
        'error',
      );
    }
  };

  const toastBorderColor =
    toast.variant === 'success'
      ? colors.accentPositive
      : toast.variant === 'error'
        ? colors.accentDanger
        : colors.accentAlert;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🪑 Oda Mağazası</Text>
        <Text style={styles.headerSub}>Odanı geliştir, verimliliğini artır</Text>
      </View>

      {/* ── Balance bar ── */}
      <View style={styles.balanceBar}>
        <View style={styles.balanceLeft}>
          <Text style={styles.balanceIcon}>💰</Text>
          <View>
            <Text style={styles.balanceLabel}>Şirket Bütçesi</Text>
            <Text style={styles.balanceValue}>${budget.toLocaleString('tr-TR')}</Text>
          </View>
        </View>
        <Text style={styles.balanceNote}>Oda eşyaları{'\n'}bütçeden düşülür</Text>
      </View>

      {/* ── Item cards ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {roomItems.map((item) => {
          const isMaxLevel = item.currentLevel >= item.levels.length;
          const nextLevelData = !isMaxLevel ? item.levels[item.currentLevel] : null;
          // Free items (price === 0) are always affordable
          const canAfford = nextLevelData
            ? nextLevelData.price === 0 || budget >= nextLevelData.price
            : false;

          return (
            <RoomItemCard
              key={item.id}
              item={item}
              nextLevelData={nextLevelData}
              isMaxLevel={isMaxLevel}
              canAfford={canAfford}
              onUpgrade={handleUpgrade}
            />
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Toast ── */}
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
          <Text style={[styles.toastText, { color: toastBorderColor }]}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomItemCard — one card per catalog item
// ─────────────────────────────────────────────────────────────────────────────
interface RoomItemCardProps {
  item: RoomItem;
  nextLevelData: RoomItem['levels'][number] | null;
  isMaxLevel: boolean;
  canAfford: boolean;
  onUpgrade: (item: RoomItem) => void;
}

function RoomItemCard({
  item,
  nextLevelData,
  isMaxLevel,
  canAfford,
  onUpgrade,
}: RoomItemCardProps) {
  const isPlaced = item.currentLevel > 0;
  const currentLevelData = isPlaced ? item.levels[item.currentLevel - 1] : null;
  const buttonDisabled = isMaxLevel || !canAfford;

  // ── Button label ────────────────────────────────────────────────────────
  let buttonLabel: string;
  if (isMaxLevel) {
    buttonLabel = '✓ Maksimum Seviye';
  } else if (!canAfford) {
    buttonLabel = 'Yetersiz Bütçe';
  } else if (item.currentLevel === 0) {
    buttonLabel =
      nextLevelData?.price === 0
        ? '🏗️ Ücretsiz Yerleştir'
        : `💰 $${nextLevelData?.price.toLocaleString('tr-TR')} ile Yerleştir`;
  } else {
    buttonLabel = `⬆️ $${nextLevelData?.price.toLocaleString('tr-TR')} ile Yükselt`;
  }

  return (
    <View
      style={[
        styles.card,
        isPlaced && !isMaxLevel && styles.cardPlaced,
        isMaxLevel && styles.cardMax,
      ]}
    >
      {/* ── Icon ── */}
      <View
        style={[
          styles.cardIconWrap,
          isPlaced && !isMaxLevel && styles.cardIconPlaced,
          isMaxLevel && styles.cardIconMax,
        ]}
      >
        <Text style={styles.cardIcon}>{item.icon}</Text>
      </View>

      {/* ── Body ── */}
      <View style={styles.cardBody}>

        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          {isMaxLevel && (
            <View style={styles.maxBadge}>
              <Text style={styles.maxBadgeText}>MAX</Text>
            </View>
          )}
          {isPlaced && !isMaxLevel && (
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Lv {item.currentLevel}</Text>
            </View>
          )}
        </View>

        {/* Current level label */}
        {currentLevelData && (
          <Text style={styles.currentLabel}>
            Şu an: {currentLevelData.label}
          </Text>
        )}

        {/* Next level preview */}
        {nextLevelData && (
          <View style={styles.nextRow}>
            <Text style={styles.nextLabel}>
              {item.currentLevel === 0 ? 'İlk Seviye' : `Seviye ${item.currentLevel + 1}`}:{' '}
              <Text style={styles.nextName}>{nextLevelData.label}</Text>
            </Text>
            {nextLevelData.price === 0 ? (
              <View style={styles.freeTag}>
                <Text style={styles.freeTagText}>ÜCRETSİZ</Text>
              </View>
            ) : (
              <View style={[styles.priceTag, !canAfford && styles.priceTagDanger]}>
                <Text style={[styles.priceTagText, !canAfford && styles.priceTagTextDanger]}>
                  ${nextLevelData.price.toLocaleString('tr-TR')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Level progress dots */}
        <View style={styles.dotRow}>
          {item.levels.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx < item.currentLevel
                  ? styles.dotFilled           // already purchased
                  : idx === item.currentLevel && !isMaxLevel
                    ? styles.dotNext           // next to buy
                    : styles.dotEmpty,         // future
              ]}
            />
          ))}
          <Text style={styles.dotLabel}>
            {item.currentLevel}/{item.levels.length}
          </Text>
        </View>

        {/* Buy / Upgrade button */}
        <TouchableOpacity
          style={[
            styles.button,
            isMaxLevel
              ? styles.buttonMax
              : canAfford
                ? styles.buttonActive
                : styles.buttonDisabled,
          ]}
          onPress={() => !buttonDisabled && onUpgrade(item)}
          disabled={buttonDisabled}
          activeOpacity={buttonDisabled ? 1 : 0.75}
        >
          <Text
            style={[
              styles.buttonText,
              isMaxLevel && styles.buttonTextMax,
              !canAfford && !isMaxLevel && styles.buttonTextDisabled,
            ]}
          >
            {buttonLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },

  /* ── Header ── */
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

  /* ── Balance bar ── */
  balanceBar: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceIcon: { fontSize: 22 },
  balanceLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  balanceValue: {
    fontFamily: fonts.monoBold,
    fontSize: fontSizes.lg,
    color: colors.accentPositive,
    marginTop: 1,
  },
  balanceNote: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'right',
    lineHeight: 16,
  },

  /* ── Scroll ── */
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },

  /* ── Card ── */
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 14,
  },
  cardPlaced: {
    borderColor: colors.positiveBorder,
  },
  cardMax: {
    borderColor: colors.alertBorder,
    backgroundColor: colors.alertBg,
  },

  /* Icon wrapper */
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
  cardIconPlaced: {
    borderColor: colors.positiveBorder,
    backgroundColor: colors.positiveBg,
  },
  cardIconMax: {
    borderColor: colors.alertBorder,
    backgroundColor: colors.alertBg,
  },
  cardIcon: { fontSize: 24 },

  /* Body */
  cardBody: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
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

  /* Badges */
  maxBadge: {
    backgroundColor: colors.alertBg,
    borderWidth: 1,
    borderColor: colors.alertBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  maxBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    color: colors.accentAlert,
    letterSpacing: 0.5,
  },
  levelBadge: {
    backgroundColor: colors.positiveBg,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  levelBadgeText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    color: colors.accentPositive,
  },

  /* Current / next level labels */
  currentLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panelAlt,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  nextLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    flex: 1,
  },
  nextName: {
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },

  /* Price tags */
  priceTag: {
    backgroundColor: colors.positiveBg,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priceTagDanger: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  priceTagText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.sm,
    color: colors.accentPositive,
  },
  priceTagTextDanger: {
    color: colors.accentDanger,
  },
  freeTag: {
    backgroundColor: colors.alertBg,
    borderWidth: 1,
    borderColor: colors.alertBorder,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freeTagText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    color: colors.accentAlert,
    letterSpacing: 0.4,
  },

  /* Progress dots */
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  dotFilled: {
    backgroundColor: colors.accentPositive,
  },
  dotNext: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.accentPositive,
  },
  dotEmpty: {
    backgroundColor: colors.border,
  },
  dotLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginLeft: 2,
  },

  /* Upgrade button */
  button: {
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: colors.accentPositive,
  },
  buttonMax: {
    backgroundColor: colors.alertBg,
    borderWidth: 1,
    borderColor: colors.alertBorder,
  },
  buttonDisabled: {
    backgroundColor: colors.panelAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.bgBase,
  },
  buttonTextMax: {
    color: colors.accentAlert,
  },
  buttonTextDisabled: {
    color: colors.textMuted,
  },

  /* ── Toast ── */
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
