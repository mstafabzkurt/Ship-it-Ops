import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { RANK_ICON_ASSETS } from '../../config/rankAssets';
import type { Rank, RankTier } from '../../config/progression';
import AssetIcon from '../AssetIcon';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const RANK_FALLBACK_ICONS: Readonly<Record<RankTier, IoniconName>> = {
  junior: 'leaf-outline',
  engineer: 'flash-outline',
  senior: 'layers-outline',
  lead: 'git-network-outline',
  manager: 'people-outline',
  director: 'compass-outline',
  cto: 'diamond-outline',
};

type RankValue = Rank | RankTier | string;

interface RankIconProps {
  rank: RankValue;
  size?: number;
  accessibilityLabel?: string;
  fallbackName?: IoniconName;
  fallbackColor?: string;
}

function resolveRankTier(rank: RankValue): RankTier | null {
  const value = typeof rank === 'string' ? rank : rank.tier;
  const normalized = value.trim().toLocaleLowerCase('tr-TR');

  if (normalized === 'junior' || normalized.startsWith('junior-')) return 'junior';
  if (['engineer', 'muhendis', 'mühendis', 'muh'].includes(normalized) || normalized.startsWith('engineer-')) return 'engineer';
  if (['senior', 'kidemli', 'kıdemli'].includes(normalized) || normalized.startsWith('senior-')) return 'senior';
  if (['lead', 'teamlead', 'takimlideri', 'takımlideri'].includes(normalized) || normalized.startsWith('lead-')) return 'lead';
  if (['manager', 'mudur', 'müdür'].includes(normalized) || normalized.startsWith('manager-')) return 'manager';
  if (['director', 'direktor', 'direktör'].includes(normalized) || normalized.startsWith('director-')) return 'director';
  if (normalized === 'cto' || normalized.startsWith('cto-')) return 'cto';
  return null;
}

export default function RankIcon({
  rank,
  size = 48,
  accessibilityLabel,
  fallbackName,
  fallbackColor = '#8A93A6',
}: RankIconProps) {
  const tier = resolveRankTier(rank);
  const source = tier ? RANK_ICON_ASSETS[tier] : null;
  const resolvedFallback = fallbackName ?? (tier ? RANK_FALLBACK_ICONS[tier] : 'ribbon-outline');

  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {source ? (
        <AssetIcon
          source={source}
          fallbackName={resolvedFallback}
          fallbackColor={fallbackColor}
          size={size}
        />
      ) : (
        <Ionicons
          name={resolvedFallback}
          size={Math.round(size * 0.72)}
          color={fallbackColor}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      )}
    </View>
  );
}
