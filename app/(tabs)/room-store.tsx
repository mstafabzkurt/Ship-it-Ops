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
import { useRoom, NEXT_LEVEL_PRICES, MAX_ROOM_LEVEL, type UpgradeResult } from '../../src/state/RoomContext';
import { useReputation } from '../../src/state/ReputationContext';
import { colors } from '../../src/theme/colors';
import { fonts, fontSizes } from '../../src/theme/typography';

type ToastVariant = 'success' | 'error' | 'warning';
interface ToastState {
  visible: boolean;
  message: string;
  variant: ToastVariant;
}

export default function RoomStoreScreen() {
  const { roomLevel, upgradeRoom } = useRoom();
  const { budget } = useReputation();

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    variant: 'success',
  });
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
      }).start(() => setToast((prev) => ({ ...prev, visible: false })));
    }, 2800);
  };

  const handleUpgrade = async () => {
    const result: UpgradeResult = await upgradeRoom();

    if (result === 'ok') {
      showToast(`✓ Oda Seviye ${roomLevel + 1}'e yükseltildi!`, 'success');
    } else if (result === 'max_level') {
      showToast(`Odanız zaten maksimum seviyede.`, 'warning');
    } else {
      const nextPrice = NEXT_LEVEL_PRICES[roomLevel] ?? 0;
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

  const isMaxLevel = roomLevel >= MAX_ROOM_LEVEL;
  const nextPrice = isMaxLevel ? 0 : NEXT_LEVEL_PRICES[roomLevel];
  const canAfford = isMaxLevel || budget >= nextPrice;

  let buttonLabel = '';
  if (isMaxLevel) {
    buttonLabel = '✓ Maksimum Seviye';
  } else if (!canAfford) {
    buttonLabel = 'Yetersiz Bütçe';
  } else if (nextPrice === 0) {
    buttonLabel = '🏗️ Ücretsiz Yükselt';
  } else {
    buttonLabel = `⬆️ $${nextPrice.toLocaleString('tr-TR')} ile Yükselt`;
  }

  const buttonDisabled = isMaxLevel || !canAfford;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🪑 Oda Yükseltmeleri</Text>
        <Text style={styles.headerSub}>Odanı geliştir, verimliliğini artır</Text>
      </View>

      <View style={styles.balanceBar}>
        <View style={styles.balanceLeft}>
          <Text style={styles.balanceIcon}>💰</Text>
          <View>
            <Text style={styles.balanceLabel}>Şirket Bütçesi</Text>
            <Text style={styles.balanceValue}>${budget.toLocaleString('tr-TR')}</Text>
          </View>
        </View>
        <Text style={styles.balanceNote}>Oda yükseltmeleri{'\n'}bütçeden düşülür</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={[styles.card, isMaxLevel && styles.cardMax]}>
          <View style={[styles.cardIconWrap, isMaxLevel && styles.cardIconMax]}>
            <Text style={styles.cardIcon}>🏗️</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>Oda Seviyesi</Text>
              {isMaxLevel ? (
                <View style={styles.maxBadge}>
                  <Text style={styles.maxBadgeText}>MAX</Text>
                </View>
              ) : (
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>Lv {roomLevel}</Text>
                </View>
              )}
            </View>

            <Text style={styles.currentLabel}>Şu an: Seviye {roomLevel}</Text>

            {!isMaxLevel && (
              <View style={styles.nextRow}>
                <Text style={styles.nextLabel}>Sonraki: Seviye {roomLevel + 1}</Text>
                {nextPrice === 0 ? (
                  <View style={styles.freeTag}>
                    <Text style={styles.freeTagText}>ÜCRETSİZ</Text>
                  </View>
                ) : (
                  <View style={[styles.priceTag, !canAfford && styles.priceTagDanger]}>
                    <Text style={[styles.priceTagText, !canAfford && styles.priceTagTextDanger]}>
                      ${nextPrice.toLocaleString('tr-TR')}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.dotRow}>
              {Array.from({ length: MAX_ROOM_LEVEL + 1 }).map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    idx <= roomLevel ? styles.dotFilled : (idx === roomLevel + 1 && !isMaxLevel ? styles.dotNext : styles.dotEmpty)
                  ]}
                />
              ))}
            </View>
            <Text style={styles.dotLabel}>{roomLevel} / {MAX_ROOM_LEVEL}</Text>

            <TouchableOpacity
              style={[
                styles.button,
                isMaxLevel ? styles.buttonMax : (canAfford ? styles.buttonActive : styles.buttonDisabled),
              ]}
              onPress={() => !buttonDisabled && handleUpgrade()}
              disabled={buttonDisabled}
              activeOpacity={buttonDisabled ? 1 : 0.75}
            >
              <Text style={[
                styles.buttonText,
                isMaxLevel && styles.buttonTextMax,
                !canAfford && !isMaxLevel && styles.buttonTextDisabled,
              ]}>
                {buttonLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {toast.visible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { borderColor: toastBorderColor },
            {
              opacity: toastAnim,
              transform: [
                { translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                { scale: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
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

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgBase },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontFamily: fonts.headingBold, fontSize: fontSizes['3xl'], color: colors.textPrimary },
  headerSub: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
  balanceBar: {
    marginHorizontal: 20, marginBottom: 14, backgroundColor: colors.panel, borderWidth: 1,
    borderColor: colors.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  balanceLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  balanceIcon: { fontSize: 22 },
  balanceLabel: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.textMuted },
  balanceValue: { fontFamily: fonts.monoBold, fontSize: fontSizes.lg, color: colors.accentPositive, marginTop: 1 },
  balanceNote: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.textMuted, textAlign: 'right', lineHeight: 16 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 12 },
  card: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, flexDirection: 'row', gap: 14 },
  cardMax: { borderColor: colors.alertBorder, backgroundColor: colors.alertBg },
  cardIconWrap: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.panelAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, flexShrink: 0 },
  cardIconMax: { borderColor: colors.alertBorder, backgroundColor: colors.alertBg },
  cardIcon: { fontSize: 24 },
  cardBody: { flex: 1, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTitle: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes.md, color: colors.textPrimary, flex: 1 },
  maxBadge: { backgroundColor: colors.alertBg, borderWidth: 1, borderColor: colors.alertBorder, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  maxBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.xs, color: colors.accentAlert, letterSpacing: 0.5 },
  levelBadge: { backgroundColor: colors.positiveBg, borderWidth: 1, borderColor: colors.positiveBorder, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  levelBadgeText: { fontFamily: fonts.monoSemiBold, fontSize: fontSizes.xs, color: colors.accentPositive },
  currentLabel: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.textMuted },
  nextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.panelAlt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, gap: 8 },
  nextLabel: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.textMuted, flex: 1 },
  priceTag: { backgroundColor: colors.positiveBg, borderWidth: 1, borderColor: colors.positiveBorder, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  priceTagDanger: { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder },
  priceTagText: { fontFamily: fonts.monoSemiBold, fontSize: fontSizes.sm, color: colors.accentPositive },
  priceTagTextDanger: { color: colors.accentDanger },
  freeTag: { backgroundColor: colors.alertBg, borderWidth: 1, borderColor: colors.alertBorder, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  freeTagText: { fontFamily: fonts.monoSemiBold, fontSize: fontSizes.xs, color: colors.accentAlert, letterSpacing: 0.4 },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 2, flexWrap: 'wrap', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotFilled: { backgroundColor: colors.accentPositive },
  dotNext: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.accentPositive },
  dotEmpty: { backgroundColor: colors.border },
  dotLabel: { fontFamily: fonts.mono, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 4 },
  button: { borderRadius: 9, paddingVertical: 9, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  buttonActive: { backgroundColor: colors.accentPositive },
  buttonMax: { backgroundColor: colors.alertBg, borderWidth: 1, borderColor: colors.alertBorder },
  buttonDisabled: { backgroundColor: colors.panelAlt, borderWidth: 1, borderColor: colors.border },
  buttonText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, color: colors.bgBase },
  buttonTextMax: { color: colors.accentAlert },
  buttonTextDisabled: { color: colors.textMuted },
  toast: { position: 'absolute', bottom: 28, left: 20, right: 20, backgroundColor: colors.panelAlt, borderWidth: 1.5, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 18, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  toastText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md },
});
