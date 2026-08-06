import React, { useState, useMemo, useRef } from 'react';
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
import { useTheme } from '../../src/state/ThemeContext';
import type { Theme } from '../../src/theme/themes';
import { THEME_ITEMS, type StoreItem } from '../../src/data/storeItems';
import { fonts, fontSizes } from '../../src/theme/typography';

type ToastVariant = 'success' | 'error' | 'warning' | 'equip';
interface ToastState { visible: boolean; message: string; variant: ToastVariant; }

// ── Theme feature blocks — shown inside each card ─────────────────────────────
const THEME_FEATURES: Record<string, string[]> = {
  theme_cyberpunk: [
    'Neon Cyan & Neon Pembe vurgular',
    'Keskin köşeler (borderRadius: 2)',
    'Agresif glow efektleri',
    'Derin siyah arka plan (#05070A)',
  ],
  theme_hacker_green: [
    'Fosforlu yeşil vurgular',
    'Terminal monospace estetiği',
    'Minimal koyu arka plan',
    'Düşük kontrast, göz dostu gece modu',
  ],
};

export default function StoreScreen() {
  const { techTokens, inventory, purchaseItem } = useReputation();
  const { theme, themeId, setThemeId } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', variant: 'success' });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, variant: ToastVariant) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ visible: true, message, variant });
    toastAnim.setValue(0);
    Animated.timing(toastAnim, {
      toValue: 1, duration: 260, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true,
    }).start();
    toastTimeout.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true,
      }).start(() => setToast(prev => ({ ...prev, visible: false })));
    }, 3000);
  };

  const handleThemeAction = async (item: StoreItem) => {
    // "Yakında" items have no themeIdKey — show coming soon toast
    if (!item.themeIdKey) {
      showToast('⏳ Bu tema yakında geliyor!', 'warning');
      return;
    }

    const owned = inventory.includes(item.id);

    if (!owned) {
      const result = await purchaseItem(item.id, 'tt', item.price);
      if (result === 'ok') {
        await setThemeId(item.themeIdKey);
        showToast(`⚡ "${item.title}" satın alındı ve etkinleştirildi!`, 'equip');
      } else if (result === 'already_owned') {
        showToast('Bu tema zaten envanterinde.', 'warning');
      } else {
        showToast(`Yetersiz TechToken! Gerekli: ${item.price} tt`, 'error');
      }
    } else {
      if (themeId === item.themeIdKey) return; // already active
      await setThemeId(item.themeIdKey);
      showToast(`⚡ "${item.title}" etkinleştirildi!`, 'equip');
    }
  };

  const handleEquipDefault = async () => {
    if (themeId === 'default') return;
    await setThemeId('default');
    showToast('✓ Varsayılan tema etkinleştirildi.', 'success');
  };

  const { colors, geometry, effects } = theme;

  const toastBorderColor =
    toast.variant === 'equip' ? colors.accentAlert :
    toast.variant === 'success' ? colors.accentPositive :
    toast.variant === 'error' ? colors.accentDanger :
    colors.accentAlert;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>🎨 Tema Mağazası</Text>
          <View style={styles.ttChip}>
            <Text style={styles.ttChipIcon}>🪙</Text>
            <Text style={styles.ttChipValue}>{techTokens} tt</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>
          TechToken kazanarak premium temalar satın al ve uygulamana kişilik kat.
        </Text>
      </View>

      {/* ── Active theme banner ─────────────────────────────────────────────── */}
      <View style={styles.activeBanner}>
        <View style={styles.activeBannerLeft}>
          <View style={styles.activeDot} />
          <Text style={styles.activeBannerLabel}>Aktif Tema:</Text>
          <Text style={styles.activeBannerName}>
            {themeId === 'cyberpunk' ? '⚡ Cyberpunk' : '🌑 Varsayılan'}
          </Text>
        </View>
        {themeId !== 'default' && (
          <TouchableOpacity
            style={styles.revertBtn}
            onPress={handleEquipDefault}
            activeOpacity={0.8}
          >
            <Text style={styles.revertBtnText}>Varsayılana Dön</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Item list ──────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {THEME_ITEMS.map((item) => {
          const owned = inventory.includes(item.id);
          const isActive = themeId === item.themeIdKey;
          const canAfford = techTokens >= item.price;
          const isComingSoon = !item.themeIdKey;
          return (
            <ThemeCard
              key={item.id}
              item={item}
              owned={owned}
              isActive={isActive}
              canAfford={canAfford}
              isComingSoon={isComingSoon}
              onAction={handleThemeAction}
              theme={theme}
              features={THEME_FEATURES[item.id] ?? []}
            />
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
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

// ── Theme Card Component ──────────────────────────────────────────────────────
interface ThemeCardProps {
  item: StoreItem;
  owned: boolean;
  isActive: boolean;
  canAfford: boolean;
  isComingSoon: boolean;
  features: string[];
  onAction: (item: StoreItem) => void;
  theme: Theme;
}

function ThemeCard({ item, owned, isActive, canAfford, isComingSoon, features, onAction, theme }: ThemeCardProps) {
  const { colors, geometry, effects } = theme;

  // ── Card visuals ────────────────────────────────────────────────────────
  const cardBg = isActive ? colors.alertBg : owned ? colors.positiveBg : colors.panel;
  const cardBorder = isActive ? colors.alertBorder : owned ? colors.positiveBorder : isComingSoon ? colors.border : colors.border;
  const cardGlow = isActive ? effects.glowAlert : owned ? effects.glowPositive : effects.cardShadow;

  // ── Button state ─────────────────────────────────────────────────────────
  let buttonLabel: string;
  let buttonBg: string;
  let buttonTextColor: string;
  let buttonDisabled = false;
  let buttonGlow = {};

  if (isComingSoon) {
    buttonLabel = '🔒 Yakında Geliyor';
    buttonBg = colors.panelAlt;
    buttonTextColor = colors.textMuted;
    buttonDisabled = true;
  } else if (isActive) {
    buttonLabel = '✓ Etkin — Aktif';
    buttonBg = colors.alertBg;
    buttonTextColor = colors.accentAlert;
    buttonDisabled = true;
  } else if (owned) {
    buttonLabel = '⚡ Giy (Equip)';
    buttonBg = colors.accentPositive;
    buttonTextColor = '#060D10';
    buttonGlow = effects.glowPositive;
  } else if (canAfford) {
    buttonLabel = `⚡ ${item.price} tt ile Satın Al`;
    buttonBg = colors.accentAlert;
    buttonTextColor = '#060D10';
    buttonGlow = effects.glowAlert;
  } else {
    buttonLabel = `🪙 ${item.price} tt Gerekli`;
    buttonBg = colors.panelAlt;
    buttonTextColor = colors.textMuted;
    buttonDisabled = true;
  }

  return (
    <View style={{
      backgroundColor: cardBg,
      borderWidth: geometry.borderWidth,
      borderColor: cardBorder,
      borderRadius: geometry.borderRadius,
      overflow: 'hidden',
      ...cardGlow,
    }}>
      {/* Top strip */}
      <View style={{
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 14,
        gap: 10,
      }}>
        {/* Title row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 48, height: 48, borderRadius: geometry.borderRadius,
            backgroundColor: isActive ? colors.alertBg : owned ? colors.positiveBg : colors.panelAlt,
            borderWidth: geometry.borderWidth,
            borderColor: isActive ? colors.alertBorder : owned ? colors.positiveBorder : colors.border,
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Text style={{ fontSize: 22 }}>{item.icon}</Text>
          </View>

          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={{ fontFamily: fonts.headingSemiBold, fontSize: fontSizes['2xl'], color: colors.textPrimary, flex: 1 }}>
                {item.title}
              </Text>
              {/* Status badge */}
              {isActive && (
                <View style={{ backgroundColor: colors.alertBg, borderWidth: geometry.borderWidth, borderColor: colors.alertBorder, paddingHorizontal: 7, paddingVertical: 2, borderRadius: geometry.borderRadiusSm }}>
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: fontSizes.xs, color: colors.accentAlert, letterSpacing: 0.6 }}>AKTİF</Text>
                </View>
              )}
              {owned && !isActive && (
                <View style={{ backgroundColor: colors.positiveBg, borderWidth: geometry.borderWidth, borderColor: colors.positiveBorder, paddingHorizontal: 7, paddingVertical: 2, borderRadius: geometry.borderRadiusSm }}>
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: fontSizes.xs, color: colors.accentPositive }}>ALINDI</Text>
                </View>
              )}
              {isComingSoon && (
                <View style={{ backgroundColor: colors.panelAlt, borderWidth: geometry.borderWidth, borderColor: colors.border, paddingHorizontal: 7, paddingVertical: 2, borderRadius: geometry.borderRadiusSm }}>
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: fontSizes.xs, color: colors.textMuted, letterSpacing: 0.5 }}>YAKINDA</Text>
                </View>
              )}
            </View>
            <Text style={{ fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.textMuted, lineHeight: 17 }}>
              {item.description}
            </Text>
          </View>
        </View>

        {/* Feature list */}
        {features.length > 0 && (
          <View style={{ gap: 5, paddingLeft: 4 }}>
            {features.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isActive ? colors.accentAlert : owned ? colors.accentPositive : colors.textMuted }} />
                <Text style={{ fontFamily: fonts.body, fontSize: fontSizes.xs, color: isActive ? colors.textPrimary : colors.textMuted, flex: 1 }}>
                  {f}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Bottom action strip */}
      <View style={{
        borderTopWidth: geometry.borderWidth,
        borderTopColor: isActive ? colors.alertBorder : owned ? colors.positiveBorder : colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 12,
        gap: 12,
        backgroundColor: isActive ? colors.alertBg + '88' : owned ? colors.positiveBg + '55' : colors.panelAlt,
      }}>
        {/* Price chip (only shown if not yet owned and not coming soon) */}
        {!owned && !isComingSoon ? (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: canAfford ? colors.alertBg : colors.dangerBg,
            borderWidth: geometry.borderWidth,
            borderColor: canAfford ? colors.alertBorder : colors.dangerBorder,
            borderRadius: geometry.borderRadiusSm,
            paddingHorizontal: 10, paddingVertical: 5,
          }}>
            <Text style={{ fontSize: 12 }}>🪙</Text>
            <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: fontSizes.md, color: canAfford ? colors.accentAlert : colors.accentDanger }}>
              {item.price} tt
            </Text>
          </View>
        ) : (
          <View /> // spacer
        )}

        {/* Action button */}
        <TouchableOpacity
          style={{
            paddingVertical: 9,
            paddingHorizontal: 18,
            borderRadius: geometry.borderRadiusSm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: buttonBg,
            borderWidth: buttonDisabled ? geometry.borderWidth : 0,
            borderColor: isActive ? colors.alertBorder : colors.border,
            ...buttonGlow,
          }}
          onPress={() => !buttonDisabled && onAction(item)}
          activeOpacity={buttonDisabled ? 1 : 0.75}
          disabled={buttonDisabled}
        >
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, color: buttonTextColor }}>
            {buttonLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function makeStyles(theme: Theme) {
  const { colors, geometry, effects } = theme;
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bgBase },

    header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    headerTitle: { fontFamily: fonts.headingBold, fontSize: fontSizes['3xl'], color: colors.textPrimary },
    headerSub: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.textMuted, lineHeight: 18 },
    ttChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: colors.alertBg, borderWidth: geometry.borderWidth,
      borderColor: colors.alertBorder, borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 6,
      ...effects.glowAlert,
    },
    ttChipIcon: { fontSize: 14 },
    ttChipValue: { fontFamily: fonts.monoBold, fontSize: fontSizes.md, color: colors.accentAlert },

    activeBanner: {
      marginHorizontal: 20, marginBottom: 14,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.panel, borderWidth: geometry.borderWidth,
      borderColor: colors.border, borderRadius: geometry.borderRadius,
      paddingHorizontal: 14, paddingVertical: 10,
      ...effects.cardShadow,
    },
    activeBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    activeDot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: colors.accentPositive,
    },
    activeBannerLabel: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.textMuted },
    activeBannerName: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, color: colors.textPrimary },
    revertBtn: {
      backgroundColor: colors.panelAlt, borderWidth: geometry.borderWidth,
      borderColor: colors.border, borderRadius: geometry.borderRadiusSm,
      paddingHorizontal: 10, paddingVertical: 5,
    },
    revertBtnText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: colors.textMuted },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, gap: 14 },

    toast: {
      position: 'absolute', bottom: 28, left: 20, right: 20,
      backgroundColor: colors.panelAlt, borderWidth: geometry.borderWidth,
      borderRadius: geometry.borderRadius, paddingVertical: 13, paddingHorizontal: 18,
      ...effects.panelShadow,
    },
    toastText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md },
  });
}
