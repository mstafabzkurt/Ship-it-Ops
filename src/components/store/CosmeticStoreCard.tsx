import React, { useMemo } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  COSMETIC_RARITY_LABELS,
  type CosmeticDefinition,
  type CosmeticCatalogItem,
} from '../../config/cosmetics';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { formatCurrency } from '../../utils/format';
import CosmeticPreview from '../cosmetics/CosmeticPreview';
import { getDashboardTokens } from '../dashboard/dashboardTokens';
import { AcquisitionCaption, AcquisitionRail, useAcquisitionMotion, type StoreFeedbackEvent } from './StoreFeedback';

interface CosmeticStoreCardProps {
  item: CosmeticCatalogItem;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  isProcessing: boolean;
  actionLocked: boolean;
  reduceMotion: boolean;
  feedback?: StoreFeedbackEvent;
  onAction: () => void;
  ownershipOnly?: boolean;
}

export default function CosmeticStoreCard({
  item,
  owned,
  equipped,
  canAfford,
  isProcessing,
  actionLocked,
  reduceMotion,
  feedback,
  onAction,
  ownershipOnly = false,
}: CosmeticStoreCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const { rail, pulseStyle } = useAcquisitionMotion(feedback?.id, reduceMotion);
  const rarity = (item as CosmeticDefinition).rarity;
  const rarityColor = rarity === 'legendary' || rarity === 'prestige' ? tokens.colors.warning
    : rarity === 'advanced' ? tokens.colors.secondary : tokens.colors.textMuted;
  const premium = rarity === 'prestige' || rarity === 'legendary';
  const disabled = equipped || actionLocked || (!owned && !canAfford);
  const actionLabel = isProcessing
    ? 'İşleniyor'
    : equipped
      ? 'Kuşanıldı'
      : owned
        ? 'Kuşan'
        : canAfford
          ? 'Satın Al'
          : 'Yetersiz Bütçe';
  const stateLabel = equipped ? 'KUŞANILDI' : owned ? 'SAHİP' : 'MEVCUT';

  return (
    <View style={[styles.card, equipped && styles.cardEquipped, feedback && { borderColor: tokens.colors.warning }]}>
      <View pointerEvents="none" style={[styles.instrumentRail, { backgroundColor: rarityColor }, premium && styles.premiumRail]} />
      <AcquisitionRail progress={rail} color={tokens.colors.warning} reduceMotion={reduceMotion} />
      <View style={styles.metaRow}>
        <Text style={styles.category}>{item.type === 'avatar' ? 'AVATAR' : 'AVATAR ÇERÇEVESİ'}</Text>
        <View style={[styles.statusChip, owned && styles.statusOwned, equipped && styles.statusEquipped]}>
          <View style={[styles.statusDot, owned && { backgroundColor: tokens.colors.secondary }]} />
          <Text style={[styles.state, owned && styles.stateEquipped]}>{stateLabel}</Text>
        </View>
      </View>
      <View style={styles.recordRow}>
        <View style={styles.previewWell}>
          <Animated.View style={[styles.previewStage, premium && styles.premiumStage, pulseStyle, feedback && { borderColor: tokens.colors.warning }]}>
            <View pointerEvents="none" style={[styles.stageCorner, { borderColor: rarityColor }]} />
            {item.type === 'avatar' ? (
              <CosmeticPreview mode="avatarOnly" avatar={item} variant="store" accessibilityLabel={`${item.name} kozmetik önizlemesi`} />
            ) : (
              <CosmeticPreview mode="frameOnly" frame={item} variant="store" accessibilityLabel={`${item.name} kozmetik önizlemesi`} />
            )}
          </Animated.View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.description}>{item.category}</Text>
          {rarity ? (
            <View accessibilityLabel={`Nadirlik: ${COSMETIC_RARITY_LABELS[rarity]}`}
              style={[styles.rarityChip, { borderColor: rarityColor }, rarity === 'prestige' && styles.prestigeChip, rarity === 'legendary' && styles.legendaryChip]}>
              <Text style={[styles.rarityText, { color: rarityColor }]}>{COSMETIC_RARITY_LABELS[rarity]}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.priceReadout}>
          <Text style={styles.priceLabel}>{ownershipOnly ? 'ENVANTER' : 'FİYAT · ŞİRKET BÜTÇESİ'}</Text>
          <Text style={[styles.price, !owned && !canAfford && styles.priceUnavailable]}>
            {ownershipOnly ? 'Sahip' : item.price === 0 ? 'Ücretsiz' : formatCurrency(item.price)}
          </Text>
          <AcquisitionCaption event={feedback} color={tokens.colors.warning} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.name}: ${actionLabel}`}
          accessibilityState={{ disabled, selected: equipped, busy: isProcessing }}
          disabled={disabled}
          onPress={onAction}
          style={({ pressed }) => [
            styles.action,
            owned && !equipped && styles.actionEquip,
            equipped && styles.actionEquipped,
            disabled && !equipped && styles.actionDisabled,
            pressed && !disabled && (reduceMotion ? styles.pressedStill : styles.actionPressed),
          ]}
        >
          {isProcessing && !reduceMotion ? (
            <ActivityIndicator size="small" color={tokens.colors.onAccent} />
          ) : (
            <Text style={[styles.actionText, equipped && styles.actionTextEquipped, disabled && !equipped && styles.actionTextDisabled]}>
              {actionLabel}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: {
      flex: 1,
      overflow: 'hidden',
      borderRadius: radius.md,
      backgroundColor: colors.floatingSurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...shadow.card,
      shadowColor: colors.shadowNeutral,
      shadowOpacity: 0.12,
    },
    cardEquipped: { borderColor: colors.secondary },
    instrumentRail: { position: 'absolute', top: 0, left: 14, right: 14, height: 1, opacity: 0.55 },
    premiumRail: { height: 2, opacity: 0.8 },
    recordRow: {
      minHeight: tokens.layout.isCompact ? 112 : 126,
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.layout.isCompact ? 8 : 12,
      paddingHorizontal: tokens.layout.isCompact ? 10 : 12,
      paddingBottom: 10,
      paddingTop: 4,
    },
    previewWell: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1, minWidth: 0 },
    previewStage: { padding: 3, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.dividerSubtle, backgroundColor: colors.secondarySurfaceRaised },
    premiumStage: { borderColor: colors.warningSoft },
    stageCorner: { position: 'absolute', left: 5, top: 5, width: 10, height: 10, borderLeftWidth: 1, borderTopWidth: 1, opacity: 0.5 },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 5, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 5 },
    category: { fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 13, letterSpacing: 0.6, color: colors.textMuted },
    statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 22, paddingHorizontal: 7, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderSubtle },
    statusOwned: { borderColor: colors.secondary },
    statusEquipped: { backgroundColor: colors.secondarySoft },
    statusDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textMuted },
    state: { fontFamily: fonts.bodySemiBold, fontSize: 9, lineHeight: 12, letterSpacing: 0.45, color: colors.textMuted },
    stateEquipped: { color: colors.secondary },
    name: { fontFamily: fonts.headingBold, fontSize: tokens.layout.isCompact ? 16 : 17, lineHeight: tokens.layout.isCompact ? 21 : 22, color: colors.text, marginBottom: 3 },
    description: { ...tokens.type.bodySmall, fontFamily: fonts.body, color: colors.textMuted },
    rarityChip: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderRadius: radius.sm, marginTop: 7 },
    rarityText: { fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14 },
    legendaryChip: { backgroundColor: colors.primarySoft },
    prestigeChip: { backgroundColor: colors.warningSoft },
    footer: {
      minHeight: tokens.layout.isCompact ? 62 : 68,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      padding: tokens.layout.isCompact ? 9 : 11,
      borderTopWidth: 1,
      borderTopColor: colors.dividerSubtle,
      backgroundColor: colors.secondarySurface,
    },
    priceReadout: { flexShrink: 1, minWidth: 0 },
    priceLabel: { fontFamily: fonts.bodySemiBold, fontSize: 9, lineHeight: 12, letterSpacing: 0.5, color: colors.textMuted },
    price: { fontFamily: fonts.monoBold, fontSize: 15, lineHeight: 20, color: colors.warning },
    priceUnavailable: { color: colors.textMuted },
    action: {
      minWidth: tokens.layout.isCompact ? 116 : 124,
      minHeight: tokens.control.height,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 13,
      borderRadius: radius.sm,
      backgroundColor: colors.warning,
      borderWidth: 1,
      borderColor: colors.warning,
    },
    actionEquip: { backgroundColor: colors.primary, borderColor: colors.primary },
    actionEquipped: { backgroundColor: colors.secondarySoft, borderColor: colors.secondary },
    actionDisabled: { backgroundColor: colors.surfaceSoft, borderColor: colors.borderSubtle, opacity: 0.62 },
    actionPressed: tokens.motion.pressed,
    pressedStill: { opacity: 0.85 },
    actionText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.onAccent, textAlign: 'center' },
    actionTextEquipped: { color: colors.secondary },
    actionTextDisabled: { color: colors.textMuted },
  });
}
