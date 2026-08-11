import React, { useRef, useMemo, useState } from 'react';
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
import { useTheme } from '../../src/state/ThemeContext';
import type { Theme } from '../../src/theme/themes';
import { fonts, fontSizes } from '../../src/theme/typography';

type ToastVariant = 'success' | 'error' | 'warning';
interface ToastState { visible: boolean; message: string; variant: ToastVariant; }

// ── Room preset definitions ───────────────────────────────────────────────────
interface RoomPreset {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  isLocked: boolean; // true = Coming Soon
}

const ROOM_PRESETS: RoomPreset[] = [
  {
    id: 'jr_engineer',
    icon: '🛏️',
    title: 'JR Mühendis Odası',
    subtitle: 'Başlangıç Seviyesi',
    description: 'Kariyerinin başında mütevazı ama işlevsel çalışma alanın. Kablo karışıklığı dahil.',
    features: [
      'Temel masa + sandalye düzeni',
      'Tek monitör kurulumu',
      'Gelişmekte olan ekipman seti',
      '17 yükseltme kademesi',
    ],
    isLocked: false,
  },
  {
    id: 'mid_engineer',
    icon: '🖥️',
    title: 'Mid Mühendis Odası',
    subtitle: 'Orta Seviye',
    description: 'Deneyim kazandıkça odanı dönüştür. Çift monitör, ergonomik koltuk ve temiz masa düzeni.',
    features: [
      'Çift monitör + mekanik klavye',
      'Ergonomik koltuk',
      'Kablo yönetimi sistemi',
      'Mini sunucu reyonu',
    ],
    isLocked: true,
  },
  {
    id: 'senior_engineer',
    icon: '🏗️',
    title: 'Senior Mühendis Odası',
    subtitle: 'İleri Seviye',
    description: 'Kıdemli mühendislerin çalışma ortamı. Üçlü monitör, özel aydınlatma ve profesyonel ses izolasyonu.',
    features: [
      'Ultra-geniş üçlü monitör duvarı',
      'Akıllı aydınlatma sistemi',
      'Ses izolasyonlu özel oda',
      'Dahili test lab alanı',
    ],
    isLocked: true,
  },
  {
    id: 'lead_engineer',
    icon: '🎖️',
    title: 'Takım Lideri Odası',
    subtitle: 'Liderlik Seviyesi',
    description: 'Ekibini yönettiğin komuta merkezi. Toplantı köşesi, büyük ekranlar ve özel beyaz tahta duvarı.',
    features: [
      'Komuta merkezi düzeni',
      'Toplantı/brainstorm köşesi',
      'Interaktif beyaz tahta duvarı',
      'Ekip metrik dashboard paneli',
    ],
    isLocked: true,
  },
  {
    id: 'cto_suite',
    icon: '👑',
    title: 'CTO Süiti',
    subtitle: 'Efsane Seviye',
    description: 'Teknoloji vizyonunu hayata geçirdiğin zirve. Floor-to-ceiling ekranlar, özel sunucu odası ve panoramik ofis.',
    features: [
      'Floor-to-ceiling LED ekran duvarı',
      'Özel soğutmalı sunucu odası',
      'Panoramik cam kenar ofis',
      'Gerçek zamanlı sistem monitörü',
    ],
    isLocked: true,
  },
];

export default function RoomStoreScreen() {
  const { roomLevel, upgradeRoom } = useRoom();
  const { budget } = useReputation();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', variant: 'success' });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, variant: ToastVariant) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ visible: true, message, variant });
    toastAnim.setValue(0);
    Animated.timing(toastAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start();
    toastTimeout.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true })
        .start(() => setToast(prev => ({ ...prev, visible: false })));
    }, 2800);
  };

  const handleUpgrade = async () => {
    const result: UpgradeResult = await upgradeRoom();
    if (result === 'ok') {
      showToast(`✓ Oda Seviye ${roomLevel + 1}'e yükseltildi!`, 'success');
    } else if (result === 'max_level') {
      showToast('Odanız zaten maksimum seviyede.', 'warning');
    } else {
      const nextPrice = NEXT_LEVEL_PRICES[roomLevel] ?? 0;
      showToast(`Yetersiz bütçe! Gerekli: $${nextPrice.toLocaleString('tr-TR')}`, 'error');
    }
  };

  const toastBorderColor = toast.variant === 'success' ? colors.accentPositive : toast.variant === 'error' ? colors.accentDanger : colors.accentAlert;

  const isMaxLevel = roomLevel >= MAX_ROOM_LEVEL;
  const nextPrice = isMaxLevel ? 0 : NEXT_LEVEL_PRICES[roomLevel];
  const canAfford = isMaxLevel || budget >= nextPrice;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🪑 Oda Seçimi</Text>
        <Text style={styles.headerSub}>Çalışma ortamını yükselt, kariyer yolculuğunu yansıt</Text>
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
        <Text style={styles.balanceNote}>Oda yükseltmeleri{'\n'}bütçeden düşülür</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {ROOM_PRESETS.map((preset) => (
          <RoomPresetCard
            key={preset.id}
            preset={preset}
            roomLevel={roomLevel}
            isMaxLevel={isMaxLevel}
            nextPrice={nextPrice}
            canAfford={canAfford}
            onUpgrade={handleUpgrade}
            theme={theme}
          />
        ))}
        <View style={{ height: 24 }} />
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

// ── Room Preset Card ──────────────────────────────────────────────────────────
interface RoomPresetCardProps {
  preset: RoomPreset;
  roomLevel: number;
  isMaxLevel: boolean;
  nextPrice: number;
  canAfford: boolean;
  onUpgrade: () => void;
  theme: Theme;
}

function RoomPresetCard({ preset, roomLevel, isMaxLevel, nextPrice, canAfford, onUpgrade, theme }: RoomPresetCardProps) {
  const { colors, geometry, effects } = theme;
  const isJrRoom = preset.id === 'jr_engineer';

  // ── Visual state ─────────────────────────────────────────────────────────
  const cardBg = preset.isLocked
    ? colors.panelAlt
    : isMaxLevel && isJrRoom
      ? colors.alertBg
      : colors.panel;

  const cardBorder = preset.isLocked
    ? colors.border
    : isMaxLevel && isJrRoom
      ? colors.alertBorder
      : colors.border;

  const cardGlow = preset.isLocked
    ? {}
    : isMaxLevel && isJrRoom
      ? effects.glowAlert
      : effects.cardShadow;

  const cardOpacity = preset.isLocked ? 0.45 : 1;

  // ── Button for JR room (the only active one) ─────────────────────────────
  let buttonLabel = '';
  let buttonDisabled = false;
  let buttonStyle = {};
  let buttonTextColor = colors.bgBase;

  if (preset.isLocked) {
    buttonLabel = '🔒 Çok Yakında';
    buttonDisabled = true;
    buttonStyle = { backgroundColor: colors.panelAlt, borderWidth: geometry.borderWidth, borderColor: colors.border };
    buttonTextColor = colors.textMuted;
  } else if (isMaxLevel) {
    buttonLabel = '✓ Maksimum Seviye — Aktif';
    buttonDisabled = true;
    buttonStyle = { backgroundColor: colors.alertBg, borderWidth: geometry.borderWidth, borderColor: colors.alertBorder };
    buttonTextColor = colors.accentAlert;
  } else if (!canAfford) {
    buttonLabel = `Yetersiz Bütçe — $${nextPrice.toLocaleString('tr-TR')} Gerekli`;
    buttonDisabled = true;
    buttonStyle = { backgroundColor: colors.dangerBg, borderWidth: geometry.borderWidth, borderColor: colors.dangerBorder };
    buttonTextColor = colors.accentDanger;
  } else if (nextPrice === 0) {
    buttonLabel = '🏗️ Ücretsiz Yükselt';
    buttonDisabled = false;
    buttonStyle = { backgroundColor: colors.accentPositive, ...effects.glowPositive };
    buttonTextColor = '#060D10';
  } else {
    buttonLabel = `⬆️ Yükselt — $${nextPrice.toLocaleString('tr-TR')}`;
    buttonDisabled = false;
    buttonStyle = { backgroundColor: colors.accentPositive, ...effects.glowPositive };
    buttonTextColor = '#060D10';
  }

  return (
    <View style={{ opacity: cardOpacity }}>
      <View style={{
        backgroundColor: cardBg,
        borderWidth: geometry.borderWidth,
        borderColor: cardBorder,
        borderRadius: geometry.borderRadius,
        overflow: 'hidden',
        ...cardGlow,
      }}>
        {/* ── Top strip ── */}
        <View style={{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14, gap: 12 }}>

          {/* Title row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 52, height: 52,
              borderRadius: geometry.borderRadius,
              backgroundColor: preset.isLocked ? colors.panelAlt : isMaxLevel && isJrRoom ? colors.alertBg : colors.panelAlt,
              borderWidth: geometry.borderWidth,
              borderColor: preset.isLocked ? colors.border : isMaxLevel && isJrRoom ? colors.alertBorder : colors.border,
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Text style={{ fontSize: 24 }}>{preset.isLocked ? '🔒' : preset.icon}</Text>
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={{
                  fontFamily: fonts.headingSemiBold,
                  fontSize: fontSizes['2xl'],
                  color: preset.isLocked ? colors.textMuted : colors.textPrimary,
                  flex: 1,
                }}>
                  {preset.title}
                </Text>

                {/* Status badges */}
                {preset.isLocked && (
                  <View style={{
                    backgroundColor: colors.panelAlt, borderWidth: geometry.borderWidth,
                    borderColor: colors.border, paddingHorizontal: 7, paddingVertical: 2,
                    borderRadius: geometry.borderRadiusSm,
                  }}>
                    <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: fontSizes.xs, color: colors.textMuted, letterSpacing: 0.5 }}>
                      ÇOK YAKINDA
                    </Text>
                  </View>
                )}
                {!preset.isLocked && isMaxLevel && isJrRoom && (
                  <View style={{
                    backgroundColor: colors.alertBg, borderWidth: geometry.borderWidth,
                    borderColor: colors.alertBorder, paddingHorizontal: 7, paddingVertical: 2,
                    borderRadius: geometry.borderRadiusSm,
                  }}>
                    <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: fontSizes.xs, color: colors.accentAlert, letterSpacing: 0.6 }}>
                      MAX
                    </Text>
                  </View>
                )}
                {!preset.isLocked && !isMaxLevel && (
                  <View style={{
                    backgroundColor: colors.positiveBg, borderWidth: geometry.borderWidth,
                    borderColor: colors.positiveBorder, paddingHorizontal: 7, paddingVertical: 2,
                    borderRadius: geometry.borderRadiusSm,
                  }}>
                    <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: fontSizes.xs, color: colors.accentPositive }}>
                      Lv {roomLevel}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: preset.isLocked ? colors.textMuted : colors.accentAlert, letterSpacing: 0.5 }}>
                {preset.subtitle.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={{ fontFamily: fonts.body, fontSize: fontSizes.sm, color: preset.isLocked ? colors.textMuted : colors.textMuted, lineHeight: 17, paddingLeft: 4 }}>
            {preset.description}
          </Text>

          {/* Feature list */}
          <View style={{ gap: 5, paddingLeft: 4 }}>
            {preset.features.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  width: 5, height: 5, borderRadius: 3,
                  backgroundColor: preset.isLocked ? colors.border : isMaxLevel && isJrRoom ? colors.accentAlert : colors.accentPositive,
                }} />
                <Text style={{
                  fontFamily: fonts.body, fontSize: fontSizes.xs,
                  color: preset.isLocked ? colors.textMuted : colors.textPrimary, flex: 1,
                }}>
                  {f}
                </Text>
              </View>
            ))}
          </View>

          {/* Upgrade progress dots (only for JR room) */}
          {isJrRoom && (
            <View style={{ gap: 4, paddingLeft: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {Array.from({ length: MAX_ROOM_LEVEL + 1 }).map((_, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: 7, height: 7, borderRadius: 4,
                      backgroundColor: idx <= roomLevel
                        ? colors.accentPositive
                        : idx === roomLevel + 1 && !isMaxLevel
                          ? 'transparent'
                          : colors.border,
                      borderWidth: idx === roomLevel + 1 && !isMaxLevel ? 1.5 : 0,
                      borderColor: colors.accentPositive,
                    }}
                  />
                ))}
              </View>
              <Text style={{ fontFamily: fonts.mono, fontSize: fontSizes.xs, color: colors.textMuted }}>
                {roomLevel} / {MAX_ROOM_LEVEL} yükseltme
              </Text>
            </View>
          )}
        </View>

        {/* ── Bottom action strip ── */}
        <View style={{
          borderTopWidth: geometry.borderWidth,
          borderTopColor: preset.isLocked ? colors.border : isMaxLevel && isJrRoom ? colors.alertBorder : colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: preset.isLocked ? 'center' : 'flex-end',
          paddingHorizontal: 18,
          paddingVertical: 12,
          gap: 12,
          backgroundColor: preset.isLocked
            ? colors.panelAlt
            : isMaxLevel && isJrRoom ? colors.alertBg + '66' : colors.panelAlt,
        }}>
          {/* Price chip for upgradeable room */}
          {isJrRoom && !isMaxLevel && (
            <View style={{ flex: 1 }}>
              {nextPrice > 0 && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                  backgroundColor: canAfford ? colors.positiveBg : colors.dangerBg,
                  borderWidth: geometry.borderWidth,
                  borderColor: canAfford ? colors.positiveBorder : colors.dangerBorder,
                  borderRadius: geometry.borderRadiusSm,
                  paddingHorizontal: 10, paddingVertical: 5,
                }}>
                  <Text style={{ fontSize: 12 }}>💰</Text>
                  <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: fontSizes.md, color: canAfford ? colors.accentPositive : colors.accentDanger }}>
                    ${nextPrice.toLocaleString('tr-TR')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Locked indicator text */}
          {preset.isLocked && (
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, color: colors.textMuted, letterSpacing: 0.4 }}>
              🔒 Erken Erişim — Çok Yakında
            </Text>
          )}

          {/* Action button */}
          {!preset.isLocked && (
            <TouchableOpacity
              style={[{
                paddingVertical: 9, paddingHorizontal: 18,
                borderRadius: geometry.borderRadiusSm,
                alignItems: 'center', justifyContent: 'center',
              }, buttonStyle]}
              onPress={() => !buttonDisabled && onUpgrade()}
              activeOpacity={buttonDisabled ? 1 : 0.75}
              disabled={buttonDisabled}
            >
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: fontSizes.sm, color: buttonTextColor }}>
                {buttonLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function makeStyles(theme: Theme) {
  const { colors, geometry, effects } = theme;
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bgBase },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    headerTitle: { fontFamily: fonts.headingBold, fontSize: fontSizes['3xl'], color: colors.textPrimary },
    headerSub: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
    balanceBar: {
      marginHorizontal: 20, marginBottom: 14, backgroundColor: colors.panel,
      borderWidth: geometry.borderWidth, borderColor: colors.border, borderRadius: geometry.borderRadius,
      paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'space-between', ...effects.cardShadow,
    },
    balanceLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    balanceIcon: { fontSize: 22 },
    balanceLabel: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.textMuted },
    balanceValue: { fontFamily: fonts.monoBold, fontSize: fontSizes.lg, color: colors.accentPositive, marginTop: 1 },
    balanceNote: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.textMuted, textAlign: 'right', lineHeight: 16 },
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
