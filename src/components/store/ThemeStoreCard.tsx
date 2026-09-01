import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { formatCurrency } from '../../utils/format';
import { getDashboardTokens } from '../dashboard/dashboardTokens';
import { AcquisitionCaption, AcquisitionRail, useAcquisitionMotion, type StoreFeedbackEvent } from './StoreFeedback';

interface ThemeStoreCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  features: string[];
  previewColors: [string, string, string];
  price?: number;
  owned: boolean;
  active: boolean;
  canAfford: boolean;
  isDefault?: boolean;
  isProcessing?: boolean;
  actionLocked?: boolean;
  reduceMotion: boolean;
  feedback?: StoreFeedbackEvent;
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
  isProcessing = false,
  actionLocked = false,
  reduceMotion,
  feedback,
  onAction,
}: ThemeStoreCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { rail, pulseStyle } = useAcquisitionMotion(feedback?.id, reduceMotion);

  const disabled = active || actionLocked || (!owned && !canAfford);
  const buttonLabel = isProcessing ? 'İşleniyor' : actionLocked ? 'İşlem Sürüyor' : active
    ? 'Aktif'
    : owned
      ? isDefault ? 'Varsayılanı Kuşan' : 'Kuşan'
      : canAfford
        ? `Satın Al — ${formatCurrency(price ?? 0)}`
        : `${formatCurrency(price ?? 0)} Gerekli`;

  return (
    <View style={[styles.card, active && styles.cardActive, owned && !active && styles.cardOwned, feedback && { borderColor: previewColors[1] }]}>
      <AcquisitionRail progress={rail} color={previewColors[1]} reduceMotion={reduceMotion} />
      <View style={[styles.preview, { backgroundColor: previewColors[0] }]}>
        <View style={[styles.previewOrbLarge, { backgroundColor: previewColors[1] }]} />
        <View style={[styles.previewOrbSmall, { backgroundColor: previewColors[2] }]} />
        <Animated.View style={[styles.previewPanel, pulseStyle]}>
          <View style={[styles.previewIcon, { borderColor: previewColors[1] }]} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Ionicons name={icon} size={28} color={previewColors[1]} />
          </View>
          <View style={styles.previewLines}>
            <View style={[styles.previewLineLong, { backgroundColor: previewColors[1] }]} />
            <View style={[styles.previewLineShort, { backgroundColor: previewColors[2] }]} />
          </View>
        </Animated.View>
        <View style={[styles.statusPill, active ? styles.statusPillActive : owned ? styles.statusPillOwned : styles.statusPillAvailable]}>
          <Text style={[styles.statusText, active ? styles.statusTextActive : owned ? styles.statusTextOwned : styles.statusTextAvailable]}>
            {active ? 'AKTİF' : owned ? 'ALINDI' : 'MEVCUT'}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.catalogCode}>{isDefault ? 'SYS-00' : `THM-${title.slice(0, 2).toUpperCase()}`}</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.features}>
          {features.map((feature, index) => (
            <View key={feature} style={styles.featureRow}>
              <Text style={[styles.featureIndex, active && styles.featureIndexActive]}>{String(index + 1).padStart(2, '0')}</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        {price !== undefined && !owned ? (
          <View style={styles.priceReadout}>
            <Text style={styles.priceLabel}>FİYAT</Text>
            <Text style={[styles.priceText, !canAfford && styles.priceTextUnavailable]}>{formatCurrency(price)}</Text>
            <AcquisitionCaption event={feedback} color={tokens.colors.warning} />
          </View>
        ) : <View style={styles.priceReadout}><AcquisitionCaption event={feedback} color={tokens.colors.warning} /></View>}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title}: ${buttonLabel}`}
          accessibilityState={{ disabled, busy: isProcessing }}
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
            hovered && !disabled && !reduceMotion && styles.actionHovered,
            focused && styles.actionFocused,
            pressed && (reduceMotion ? styles.pressedStill : styles.actionPressed),
          ]}
        >
          {isProcessing && !reduceMotion ? <ActivityIndicator color={tokens.colors.onAccent} size="small" accessibilityLabel="Tema işleniyor" /> : <Text style={[styles.actionText, active && styles.actionTextActive, !owned && !canAfford && styles.actionTextDisabled]}>
            {buttonLabel}
          </Text>}
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: { flex: 1, minHeight: tokens.layout.isCompact ? 0 : 460, overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle, ...shadow.card, shadowColor: colors.shadowNeutral, shadowOpacity: 0.14 },
    cardActive: { borderColor: colors.warning },
    cardOwned: { borderColor: colors.secondary },
    preview: { height: tokens.layout.isCompact ? 132 : 164, overflow: 'hidden', padding: tokens.layout.isCompact ? 12 : 16, justifyContent: 'flex-end' },
    previewOrbLarge: { position: 'absolute', width: 170, height: 170, top: -95, right: -40, borderRadius: 85, opacity: 0.42 },
    previewOrbSmall: { position: 'absolute', width: 90, height: 90, bottom: -50, left: 20, borderRadius: 45, opacity: 0.32 },
    previewPanel: { width: 154, minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.sm, backgroundColor: 'rgba(9,10,20,0.76)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
    previewIcon: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    previewLines: { flex: 1, gap: 8 },
    previewLineLong: { height: 8, borderRadius: 4 },
    previewLineShort: { width: '62%', height: 8, borderRadius: 4 },
    statusPill: { position: 'absolute', top: 14, right: 14, minHeight: 26, justifyContent: 'center', paddingHorizontal: 8, borderRadius: radius.sm, borderWidth: 1 },
    statusPillActive: { backgroundColor: 'rgba(9,10,20,0.82)', borderColor: colors.warning },
    statusPillOwned: { backgroundColor: 'rgba(9,10,20,0.82)', borderColor: colors.secondary },
    statusPillAvailable: { backgroundColor: 'rgba(9,10,20,0.82)', borderColor: 'rgba(255,255,255,0.18)' },
    statusText: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.55 },
    statusTextActive: { color: colors.warning },
    statusTextOwned: { color: colors.secondary },
    statusTextAvailable: { color: colors.textMuted },
    body: { flex: 1, padding: tokens.layout.isCompact ? 14 : 18 },
    titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 6 },
    title: { ...tokens.type.title, flex: 1, fontFamily: fonts.headingBold, color: colors.text },
    catalogCode: { fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.5, color: colors.textMuted },
    description: { ...tokens.type.body, fontFamily: fonts.body, color: colors.textMuted },
    features: { marginTop: tokens.layout.isCompact ? 12 : 17, borderTopWidth: 1, borderTopColor: colors.dividerSubtle },
    featureRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.dividerSubtle },
    featureIndex: { width: 20, fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, color: colors.textMuted },
    featureIndexActive: { color: colors.warning },
    featureText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textMuted },
    footer: { minHeight: tokens.layout.isCompact ? 64 : 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 8 : 10, padding: tokens.layout.isCompact ? 10 : 14, borderTopWidth: 1, borderTopColor: colors.dividerSubtle },
    priceReadout: { minHeight: 36, flexShrink: 1, justifyContent: 'center' },
    priceLabel: { fontFamily: fonts.bodySemiBold, fontSize: 9, lineHeight: 12, letterSpacing: 0.55, color: colors.textMuted },
    priceText: { fontFamily: fonts.monoBold, fontSize: 12, lineHeight: 17, color: colors.warning },
    priceTextUnavailable: { color: colors.danger },
    action: { minHeight: tokens.control.height, flexGrow: tokens.layout.isCompact ? 1 : 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.layout.isCompact ? 12 : 15, borderRadius: radius.sm, borderWidth: 1, borderColor: 'transparent', backgroundColor: colors.primary },
    actionActive: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
    actionOwned: { backgroundColor: colors.secondary },
    actionPurchase: { backgroundColor: colors.warning },
    actionDisabled: { backgroundColor: colors.surfaceSoft, borderColor: colors.border, opacity: 0.62 },
    actionHovered: { transform: [{ translateY: -1 }], ...shadow.card },
    actionFocused: { borderColor: colors.text },
    actionPressed: { transform: [{ scale: 0.98 }] },
    pressedStill: { opacity: 0.85 },
    actionText: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, color: colors.onAccent, textAlign: 'center' },
    actionTextActive: { color: colors.warning },
    actionTextDisabled: { color: colors.textMuted },
  });
}
