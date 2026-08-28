import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  DEFAULT_AVATAR_FRAME_ID,
  DEFAULT_AVATAR_ID,
  getCosmeticById,
  type AvatarCosmetic,
  type AvatarFrameCosmetic,
  type CosmeticCatalogItem,
} from '../../config/cosmetics';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { formatCurrency } from '../../utils/format';
import CosmeticPreview from '../cosmetics/CosmeticPreview';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface CosmeticStoreCardProps {
  item: CosmeticCatalogItem;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  isProcessing: boolean;
  actionLocked: boolean;
  onAction: () => void;
}

const DEFAULT_AVATAR = getCosmeticById(DEFAULT_AVATAR_ID) as AvatarCosmetic;
const DEFAULT_FRAME = getCosmeticById(DEFAULT_AVATAR_FRAME_ID) as AvatarFrameCosmetic;

export default function CosmeticStoreCard({
  item,
  owned,
  equipped,
  canAfford,
  isProcessing,
  actionLocked,
  onAction,
}: CosmeticStoreCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const avatar = item.type === 'avatar' ? item : DEFAULT_AVATAR;
  const frame = item.type === 'avatar_frame' ? item : DEFAULT_FRAME;
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
  const stateLabel = equipped ? 'KUŞANILDI' : owned ? 'ENVANTERDE' : 'MEVCUT';

  return (
    <View style={[styles.card, equipped && styles.cardEquipped]}>
      <View style={styles.recordRow}>
        <View style={styles.previewWell}>
          <CosmeticPreview
            avatar={avatar}
            frame={frame}
            variant="store"
            accessibilityLabel={`${item.name} kozmetik önizlemesi`}
          />
        </View>

        <View style={styles.copy}>
          <View style={styles.metaRow}>
            <Text style={styles.category}>{item.type === 'avatar' ? 'AVATAR' : 'AVATAR ÇERÇEVESİ'}</Text>
            <Text style={[styles.state, equipped && styles.stateEquipped]}>{stateLabel}</Text>
          </View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.priceReadout}>
          <Text style={styles.priceLabel}>ŞİRKET BÜTÇESİ</Text>
          <Text style={[styles.price, !owned && !canAfford && styles.priceUnavailable]}>
            {item.price === 0 ? 'Ücretsiz' : formatCurrency(item.price)}
          </Text>
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
            pressed && !disabled && styles.actionPressed,
          ]}
        >
          {isProcessing ? (
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
      backgroundColor: colors.secondarySurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...shadow.card,
      shadowColor: colors.shadowNeutral,
      shadowOpacity: 0.12,
    },
    cardEquipped: { borderColor: colors.secondary },
    recordRow: {
      minHeight: tokens.layout.isCompact ? 118 : 132,
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.layout.isCompact ? 8 : 12,
      padding: tokens.layout.isCompact ? 10 : 12,
    },
    previewWell: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRightWidth: 1,
      borderRightColor: colors.dividerSubtle,
      paddingRight: tokens.layout.isCompact ? 6 : 9,
    },
    copy: { flex: 1, minWidth: 0 },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 5, marginBottom: 3 },
    category: { fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 12, letterSpacing: 0.55, color: colors.primary },
    state: { fontFamily: fonts.bodySemiBold, fontSize: 9, lineHeight: 12, letterSpacing: 0.45, color: colors.textMuted },
    stateEquipped: { color: colors.secondary },
    name: { fontFamily: fonts.headingBold, fontSize: tokens.layout.isCompact ? 16 : 17, lineHeight: tokens.layout.isCompact ? 21 : 22, color: colors.text, marginBottom: 3 },
    description: { ...tokens.type.bodySmall, fontFamily: fonts.body, color: colors.textMuted },
    footer: {
      minHeight: tokens.layout.isCompact ? 62 : 68,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      padding: tokens.layout.isCompact ? 9 : 11,
      borderTopWidth: 1,
      borderTopColor: colors.dividerSubtle,
    },
    priceReadout: { flexShrink: 1, minWidth: 0 },
    priceLabel: { fontFamily: fonts.bodySemiBold, fontSize: 9, lineHeight: 12, letterSpacing: 0.5, color: colors.textMuted },
    price: { fontFamily: fonts.monoBold, fontSize: 13, lineHeight: 18, color: colors.warning },
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
    actionText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.onAccent, textAlign: 'center' },
    actionTextEquipped: { color: colors.secondary },
    actionTextDisabled: { color: colors.textMuted },
  });
}
