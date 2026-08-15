import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { formatCurrency } from '../../utils/format';
import { dashboardType, getDashboardTokens } from '../dashboard/dashboardTokens';

interface ThemeStoreCardProps {
  icon: string;
  title: string;
  description: string;
  features: string[];
  previewColors: [string, string, string];
  price?: number;
  owned: boolean;
  active: boolean;
  canAfford: boolean;
  isDefault?: boolean;
  onAction: () => void;
}

export default function ThemeStoreCard({
  icon,
  title,
  description,
  features,
  previewColors,
  price,
  owned,
  active,
  canAfford,
  isDefault = false,
  onAction,
}: ThemeStoreCardProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const disabled = active || (!owned && !canAfford);
  const buttonLabel = active
    ? isDefault ? '✓ Aktif' : '✓ Kuşanıldı'
    : owned
      ? isDefault ? '⚡ Varsayılanı Kuşan' : '⚡ Kuşan'
      : canAfford
        ? `🛒 Satın Al — ${formatCurrency(price ?? 0)}`
        : `💵 ${formatCurrency(price ?? 0)} Gerekli`;

  return (
    <View style={[styles.card, active && styles.cardActive, owned && !active && styles.cardOwned]}>
      <View style={[styles.preview, { backgroundColor: previewColors[0] }]}>
        <View style={[styles.previewOrbLarge, { backgroundColor: previewColors[1] }]} />
        <View style={[styles.previewOrbSmall, { backgroundColor: previewColors[2] }]} />
        <View style={styles.previewPanel}>
          <Text style={styles.previewIcon} accessibilityElementsHidden>{icon}</Text>
          <View style={styles.previewLines}>
            <View style={[styles.previewLineLong, { backgroundColor: previewColors[1] }]} />
            <View style={[styles.previewLineShort, { backgroundColor: previewColors[2] }]} />
          </View>
        </View>
        <View style={[styles.statusPill, active ? styles.statusPillActive : owned ? styles.statusPillOwned : styles.statusPillAvailable]}>
          <Text style={[styles.statusText, active ? styles.statusTextActive : owned ? styles.statusTextOwned : styles.statusTextAvailable]}>
            {active ? 'AKTİF' : owned ? 'ALINDI' : 'MEVCUT'}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.features}>
          {features.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={[styles.featureDot, active && styles.featureDotActive]} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        {price !== undefined && !owned ? (
          <View style={[styles.pricePill, !canAfford && styles.pricePillUnavailable]}>
            <Text style={styles.priceIcon}>💵</Text>
            <Text style={[styles.priceText, !canAfford && styles.priceTextUnavailable]}>{formatCurrency(price)}</Text>
          </View>
        ) : <View />}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title}: ${buttonLabel}`}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onAction}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          style={({ pressed }) => [
            styles.action,
            active && styles.actionActive,
            owned && !active && styles.actionOwned,
            !owned && canAfford && styles.actionPurchase,
            !owned && !canAfford && styles.actionDisabled,
            hovered && !disabled && styles.actionHovered,
            focused && styles.actionFocused,
            pressed && styles.actionPressed,
          ]}
        >
          <Text style={[styles.actionText, active && styles.actionTextActive, !owned && !canAfford && styles.actionTextDisabled]}>
            {buttonLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: { flex: 1, minHeight: 500, overflow: 'hidden', borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadow.card },
    cardActive: { borderColor: colors.warning, ...shadow.raised },
    cardOwned: { borderColor: colors.secondary },
    preview: { height: 138, overflow: 'hidden', padding: 16, justifyContent: 'flex-end' },
    previewOrbLarge: { position: 'absolute', width: 170, height: 170, top: -95, right: -40, borderRadius: 85, opacity: 0.42 },
    previewOrbSmall: { position: 'absolute', width: 90, height: 90, bottom: -50, left: 20, borderRadius: 45, opacity: 0.32 },
    previewPanel: { width: 150, minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.lg, backgroundColor: 'rgba(9,10,28,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
    previewIcon: { fontSize: 32, lineHeight: 40 },
    previewLines: { flex: 1, gap: 8 },
    previewLineLong: { height: 8, borderRadius: 4 },
    previewLineShort: { width: '62%', height: 8, borderRadius: 4 },
    statusPill: { position: 'absolute', top: 14, right: 14, minHeight: 29, justifyContent: 'center', paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: 1 },
    statusPillActive: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
    statusPillOwned: { backgroundColor: colors.secondarySoft, borderColor: colors.secondary },
    statusPillAvailable: { backgroundColor: colors.surface, borderColor: colors.borderStrong },
    statusText: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.55 },
    statusTextActive: { color: colors.warning },
    statusTextOwned: { color: colors.secondary },
    statusTextAvailable: { color: colors.textMuted },
    body: { flex: 1, padding: 18 },
    title: { ...dashboardType.title, fontFamily: fonts.headingBold, color: colors.text, marginBottom: 7 },
    description: { ...dashboardType.body, fontFamily: fonts.body, color: colors.textMuted },
    features: { gap: 8, marginTop: 17, paddingTop: 15, borderTopWidth: 1, borderTopColor: colors.border },
    featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
    featureDot: { width: 7, height: 7, marginTop: 6, borderRadius: 4, backgroundColor: colors.textMuted },
    featureDotActive: { backgroundColor: colors.warning },
    featureText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textMuted },
    footer: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surfaceRaised },
    pricePill: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warning },
    pricePillUnavailable: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
    priceIcon: { fontSize: 13, lineHeight: 18 },
    priceText: { fontFamily: fonts.monoBold, fontSize: 12, lineHeight: 17, color: colors.warning },
    priceTextUnavailable: { color: colors.danger },
    action: { minHeight: tokens.control.height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.primary },
    actionActive: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
    actionOwned: { backgroundColor: colors.secondary },
    actionPurchase: { backgroundColor: colors.warning },
    actionDisabled: { backgroundColor: colors.surfaceSoft, borderColor: colors.border, opacity: 0.62 },
    actionHovered: { transform: [{ translateY: -1 }], ...shadow.card },
    actionFocused: { borderColor: colors.text },
    actionPressed: { transform: [{ scale: 0.98 }] },
    actionText: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, color: colors.onAccent, textAlign: 'center' },
    actionTextActive: { color: colors.warning },
    actionTextDisabled: { color: colors.textMuted },
  });
}
