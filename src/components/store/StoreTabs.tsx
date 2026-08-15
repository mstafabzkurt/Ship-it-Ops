import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

export type StoreTabId = 'themes' | 'jokers' | 'cosmetics';

const TABS: { id: StoreTabId; label: string }[] = [
  { id: 'themes', label: 'Temalar' },
  { id: 'jokers', label: 'Jokerler' },
  { id: 'cosmetics', label: 'Kozmetik' },
];

interface StoreTabsProps {
  activeTab: StoreTabId;
  onChange: (tab: StoreTabId) => void;
}

function StoreTabButton({
  id,
  label,
  selected,
  onPress,
  styles,
}: {
  id: StoreTabId;
  label: string;
  selected: boolean;
  onPress: (tab: StoreTabId) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={`${label} mağaza kategorisi`}
      accessibilityState={{ selected }}
      onPress={() => onPress(id)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.tab,
        selected && styles.tabSelected,
        hovered && !selected && styles.tabHovered,
        focused && styles.tabFocused,
        pressed && styles.tabPressed,
      ]}
    >
      <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{label}</Text>
      <View style={[styles.indicator, selected && styles.indicatorSelected]} />
    </Pressable>
  );
}

export default function StoreTabs({ activeTab, onChange }: StoreTabsProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  return (
    <View accessibilityRole="tablist" style={styles.tabs}>
      {TABS.map((tab) => (
        <StoreTabButton
          key={tab.id}
          id={tab.id}
          label={tab.label}
          selected={activeTab === tab.id}
          onPress={onChange}
          styles={styles}
        />
      ))}
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    tabs: {
      flexDirection: 'row',
      gap: 8,
      padding: 7,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.card,
    },
    tab: {
      flex: 1,
      minWidth: 0,
      minHeight: tokens.control.heightLarge,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: 'transparent',
      backgroundColor: 'transparent',
    },
    tabSelected: { backgroundColor: colors.primarySoft, borderColor: colors.borderStrong },
    tabHovered: { backgroundColor: colors.surfaceRaised },
    tabFocused: { borderColor: colors.text },
    tabPressed: { backgroundColor: colors.primarySoft, transform: [{ scale: 0.985 }] },
    tabLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 19, color: colors.textMuted, textAlign: 'center' },
    tabLabelSelected: { color: colors.text },
    indicator: { position: 'absolute', bottom: 6, width: 20, height: 3, borderRadius: 2, backgroundColor: 'transparent' },
    indicatorSelected: { backgroundColor: colors.primary },
  });
}
