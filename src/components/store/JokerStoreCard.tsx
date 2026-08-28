import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { formatCurrency } from '../../utils/format';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface JokerStoreCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  name: string;
  description: string;
  count: number;
  price: number;
  canAfford: boolean;
  isProcessing: boolean;
  purchaseLocked: boolean;
  onPurchase: () => void;
}

export default function JokerStoreCard({
  icon,
  name,
  description,
  count,
  price,
  canAfford,
  isProcessing,
  purchaseLocked,
  onPurchase,
}: JokerStoreCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const disabled = !canAfford || purchaseLocked;
  const actionLabel = isProcessing
    ? 'İşleniyor'
    : !canAfford
      ? 'Yetersiz Bütçe'
      : purchaseLocked
        ? 'İşlem Sürüyor'
        : 'Satın Al';

  return (
    <View style={styles.card}>
      <View style={styles.equipmentRow}>
        <View style={styles.iconSlot}>
          <Ionicons name={icon} size={24} color={tokens.colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.equipmentLabel}>OPERASYON EKİPMANI</Text>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={styles.countReadout}>
          <Text style={styles.countLabel}>SAHİP OLUNAN</Text>
          <Text style={styles.countText}>{String(count).padStart(2, '0')}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.priceReadout}>
          <Text style={styles.priceLabel}>FİYAT</Text>
          <Text style={[styles.priceText, !canAfford && styles.priceTextUnavailable]}>
            {formatCurrency(price)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${name}: ${formatCurrency(price)}, ${actionLabel}`}
          accessibilityState={{ disabled, busy: isProcessing }}
          disabled={disabled}
          onPress={onPurchase}
          style={({ pressed }) => [
            styles.action,
            disabled && styles.actionDisabled,
            pressed && !disabled && styles.actionPressed,
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={tokens.colors.onAccent} />
          ) : (
            <Text style={[styles.actionText, disabled && styles.actionTextDisabled]}>{actionLabel}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: { flex: 1, overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle, ...shadow.card, shadowColor: colors.shadowNeutral, shadowOpacity: 0.12 },
    equipmentRow: { minHeight: tokens.layout.isCompact ? 112 : 126, flexDirection: 'row', alignItems: 'center', gap: tokens.layout.isCompact ? 11 : 14, padding: tokens.layout.isCompact ? 12 : 15 },
    iconSlot: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
    copy: { flex: 1, minWidth: 0 },
    equipmentLabel: { fontFamily: fonts.bodySemiBold, fontSize: 9, lineHeight: 12, letterSpacing: 0.6, color: colors.textMuted, marginBottom: 2 },
    name: { fontFamily: fonts.headingBold, fontSize: 17, lineHeight: 22, color: colors.text, marginBottom: 2 },
    description: { ...tokens.type.bodySmall, fontFamily: fonts.body, color: colors.textMuted },
    countReadout: { minWidth: 60, alignItems: 'flex-end', paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: colors.dividerSubtle },
    countLabel: { fontFamily: fonts.bodySemiBold, fontSize: 9, lineHeight: 12, letterSpacing: 0.55, color: colors.textMuted },
    countText: { fontFamily: fonts.monoBold, fontSize: 22, lineHeight: 27, color: colors.secondary },
    footer: { minHeight: tokens.layout.isCompact ? 62 : 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: tokens.layout.isCompact ? 9 : 11, borderTopWidth: 1, borderTopColor: colors.dividerSubtle },
    priceReadout: { flexShrink: 1, minWidth: 0 },
    priceLabel: { fontFamily: fonts.bodySemiBold, fontSize: 9, lineHeight: 12, letterSpacing: 0.55, color: colors.textMuted },
    priceText: { fontFamily: fonts.monoBold, fontSize: 13, lineHeight: 18, color: colors.warning },
    priceTextUnavailable: { color: colors.textMuted },
    action: { minWidth: tokens.layout.isCompact ? 116 : 124, minHeight: tokens.control.height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13, borderRadius: radius.sm, backgroundColor: colors.warning, borderWidth: 1, borderColor: colors.warning },
    actionDisabled: { backgroundColor: colors.surfaceSoft, borderColor: colors.borderSubtle, opacity: 0.62 },
    actionPressed: tokens.motion.pressed,
    actionText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.onAccent, textAlign: 'center' },
    actionTextDisabled: { color: colors.textMuted },
  });
}
