import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { COSMETIC_CATEGORIES, type CosmeticCatalogItem, type CosmeticCategory, type CosmeticType } from '../../config/cosmetics';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

export type CosmeticCategoryFilter = CosmeticCategory | 'Tümü';

interface CosmeticFiltersProps {
  items: readonly CosmeticCatalogItem[];
  type: CosmeticType;
  onTypeChange: (type: CosmeticType) => void;
  category?: CosmeticCategoryFilter;
  onCategoryChange?: (category: CosmeticCategoryFilter) => void;
}

export default function CosmeticFilters({ items, type, onTypeChange, category, onCategoryChange }: CosmeticFiltersProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(getDashboardTokens(theme, width)), [theme, width]);
  const [focused, setFocused] = useState<string | null>(null);
  const types = [{ id: 'avatar', label: 'Avatarlar' }, { id: 'avatar_frame', label: 'Çerçeveler' }] as const;
  const categories: CosmeticCategoryFilter[] = ['Tümü', ...COSMETIC_CATEGORIES[type]];
  const categoryChips = categories.map(label => (
    <Pressable key={label} accessibilityRole="button" accessibilityLabel={`${label} kategorisi`}
      {...(Platform.OS === 'web' ? { 'aria-pressed': category === label } : {})}
      accessibilityState={{ selected: category === label }} onPress={() => onCategoryChange?.(label)}
      onFocus={() => setFocused(label)} onBlur={() => setFocused(null)}
      style={({ pressed }) => [styles.chipTarget, pressed && styles.pressed]}>
      <View style={[styles.chip, category === label && styles.chipSelected, focused === label && styles.focused]}>
        <Text style={[styles.chipText, category === label && styles.chipTextSelected]}>{label}</Text>
      </View>
    </Pressable>
  ));

  return (
    <View style={styles.controls}>
      <View accessibilityRole="tablist" accessibilityLabel="Kozmetik türü" style={styles.types}>
        {types.map(({ id, label }) => (
          <Pressable key={id} accessibilityRole="tab" accessibilityLabel={label}
            aria-selected={type === id}
            accessibilityState={{ selected: type === id }} onPress={() => onTypeChange(id)}
            onFocus={() => setFocused(id)} onBlur={() => setFocused(null)}
            style={({ pressed }) => [styles.type, type === id && styles.typeSelected, focused === id && styles.focused, pressed && styles.pressed]}>
            <Text style={[styles.typeText, type === id && styles.selectedText]}>{label}</Text>
            <Text style={styles.count}>{items.filter(item => item.type === id).length}</Text>
          </Pressable>
        ))}
      </View>
      {category !== undefined && onCategoryChange ? (
        <View style={styles.categorySection}>
          <View style={styles.categoryHeading}>
            <Text style={styles.categoryLabel}>KATEGORİ</Text>
            {width < 600 ? <Text style={styles.scrollHint}>Kaydır →</Text> : null}
          </View>
          {width < 600 ? (
            <ScrollView key={type} horizontal showsHorizontalScrollIndicator={false}
              accessibilityLabel="Kozmetik kategorileri; yatay kaydır"
              style={styles.categoryRail} contentContainerStyle={styles.railContent}>
              {categoryChips}
            </ScrollView>
          ) : (
            <View accessibilityLabel="Kozmetik kategorileri" style={styles.categories}>{categoryChips}</View>
          )}
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    controls: { gap: 12, marginBottom: 8, minWidth: 0 },
    types: { flexDirection: 'row', gap: 3, padding: 3, maxWidth: 460, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.secondarySurface },
    type: { flex: 1, minWidth: 0, minHeight: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'transparent', borderRadius: radius.sm },
    typeText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textMuted },
    count: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.textMuted },
    categorySection: { minWidth: 0 },
    categoryHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    categoryLabel: { fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 13, letterSpacing: 0.7, color: colors.textMuted },
    scrollHint: { fontFamily: fonts.body, fontSize: 10, lineHeight: 14, color: colors.textMuted },
    categoryRail: { width: '100%', maxWidth: '100%', flexGrow: 0 },
    railContent: { gap: 6, alignItems: 'center', paddingHorizontal: 1 },
    categories: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6 },
    chipTarget: { minHeight: 44, justifyContent: 'center', flexShrink: 0 },
    chip: { minHeight: 30, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.dividerSubtle },
    chipText: { fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 16, color: colors.textMuted },
    chipSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    chipTextSelected: { color: colors.text },
    typeSelected: { backgroundColor: colors.secondarySoft, borderColor: colors.secondary },
    selectedText: { color: colors.secondary },
    focused: { borderColor: colors.text },
    pressed: { opacity: 0.8 },
  });
}
