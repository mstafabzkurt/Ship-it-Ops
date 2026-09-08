import React, { useMemo } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { formatCurrency } from '../../utils/format';
import AssetIcon from '../AssetIcon';
import { getDashboardTokens } from '../dashboard/dashboardTokens';
import { AcquisitionCaption, AcquisitionRail, useAcquisitionMotion, type StoreFeedbackEvent } from './StoreFeedback';

export interface JokerStoreCardProps {
  iconSource: ImageSourcePropType;
  fallbackIcon: React.ComponentProps<typeof Ionicons>['name'];
  name: string;
  description: string;
  count: number;
  price: number;
  canAfford: boolean;
  isProcessing: boolean;
  purchaseLocked: boolean;
  reduceMotion: boolean;
  feedback?: StoreFeedbackEvent;
  onPurchase: () => void;
}

export default function JokerStoreCard({
  iconSource,
  fallbackIcon,
  name,
  description,
  count,
  price,
  canAfford,
  isProcessing,
  purchaseLocked,
  reduceMotion,
  feedback,
  onPurchase,
}: JokerStoreCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const { rail, pulseStyle } = useAcquisitionMotion(feedback?.id, reduceMotion);
  const disabled = !canAfford || purchaseLocked;
  const actionLabel = isProcessing
    ? 'İşleniyor'
    : !canAfford
      ? 'Yetersiz Bütçe'
      : purchaseLocked
        ? 'İşlem Sürüyor'
        : 'Satın Al';

  return (
    <View style={[styles.card, feedback && { borderColor: tokens.colors.warning }]}>
      <AcquisitionRail progress={rail} color={tokens.colors.warning} reduceMotion={reduceMotion} />
      <View style={styles.equipmentRow}>
        <View style={styles.iconSlot}>
          <AssetIcon source={iconSource} fallbackName={fallbackIcon} fallbackColor={tokens.colors.primary} size={42} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.equipmentLabel}>OPERASYON EKİPMANI</Text>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={styles.countReadout}>
          <Text style={styles.countLabel}>ENVANTER</Text>
          <Animated.View style={pulseStyle}>
            <Text style={styles.countText} numberOfLines={1} adjustsFontSizeToFit>x{count}</Text>
          </Animated.View>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.priceReadout}>
          <Text style={styles.priceLabel}>FİYAT</Text>
          <Text style={[styles.priceText, !canAfford && styles.priceTextUnavailable]}>
            {formatCurrency(price)}
          </Text>
          <AcquisitionCaption event={feedback} color={tokens.colors.warning} />
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
            pressed && !disabled && (reduceMotion ? styles.pressedStill : styles.actionPressed),
          ]}
        >
          {isProcessing && !reduceMotion ? (
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
    equipmentRow: { flex: 1, minHeight: tokens.layout.isCompact ? 112 : 126, flexDirection: 'row', alignItems: 'center', gap: tokens.layout.isCompact ? 11 : 14, padding: tokens.layout.isCompact ? 12 : 15 },
    iconSlot: { width: 56, height: 56, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
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
    pressedStill: { opacity: 0.85 },
    actionText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.onAccent, textAlign: 'center' },
    actionTextDisabled: { color: colors.textMuted },
  });
}
