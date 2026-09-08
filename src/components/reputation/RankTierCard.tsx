import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Rank } from '../../state/ReputationContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';
import RankIcon from '../rank/RankIcon';

export interface RankTierVisual {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  softColor: string;
}

interface RankTierCardProps {
  ranks: Rank[];
  careerXp: number;
  currentRank: Rank;
  visual: RankTierVisual;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function RankTierCard({ ranks, careerXp, currentRank, visual, isExpanded, onToggle }: RankTierCardProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const containsCurrentRank = ranks.some((rank) => rank.id === currentRank.id);
  const isCompleted = !containsCurrentRank && ranks.every((rank) => careerXp >= rank.threshold);
  const stateLabel = containsCurrentRank ? currentRank.name : isCompleted ? 'Tamamlandı' : 'Kilitli';
  const currentAccent = tokens.colors.rankCurrent ?? visual.color;
  const currentAccentSoft = tokens.colors.rankCurrentSoft ?? visual.softColor;
  const stateColor = containsCurrentRank ? currentAccent : isCompleted ? tokens.colors.success : tokens.colors.textMuted;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${visual.label}, ${stateLabel}`}
        accessibilityHint={isExpanded ? 'Rütbe seviyelerini daraltır' : 'Rütbe seviyelerini genişletir'}
        accessibilityState={{ expanded: isExpanded }}
        aria-expanded={isExpanded}
        onPress={onToggle}
        style={({ pressed }) => [styles.cardHeader, pressed && styles.cardHeaderPressed]}
      >
        <View style={styles.tierRail}>
          <View
            style={[
              styles.tierNode,
              (containsCurrentRank || isCompleted) && { borderColor: stateColor },
              containsCurrentRank && { backgroundColor: currentAccentSoft },
            ]}
          >
            <RankIcon
              rank={ranks[0]}
              size={tokens.layout.isCompact ? 48 : 56}
              fallbackName={visual.icon}
              fallbackColor={stateColor}
            />
          </View>
        </View>

        <View style={styles.headerCopy}>
          <Text style={[styles.tierLabel, containsCurrentRank && { color: currentAccent }]}>{visual.label}</Text>
          <Text style={styles.tierRange}>
            {ranks[0].threshold.toLocaleString('tr-TR')}–{ranks[ranks.length - 1].threshold.toLocaleString('tr-TR')} XP
          </Text>
        </View>

        <View style={styles.headerState}>
          <Text style={[styles.stateLabel, { color: stateColor }]} numberOfLines={1}>{stateLabel}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={tokens.colors.textMuted}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </View>
      </Pressable>

      {isExpanded ? <View style={styles.milestones}>
        {ranks.map((rank, index) => {
          const reached = careerXp >= rank.threshold;
          const isCurrent = rank.id === currentRank.id;
          const levelLabel = rank.name.slice(rank.name.lastIndexOf(' ') + 1);
          const levelState = isCurrent ? 'Şu an' : reached ? 'Tamamlandı' : 'Yaklaşan';
          return (
            <View key={rank.id} style={styles.milestoneRow}>
              <View style={styles.rail}>
                {index > 0 ? <View style={[styles.connectorTop, reached && { backgroundColor: visual.color }]} /> : null}
                <View
                  style={[
                    styles.milestoneDot,
                    reached && { borderColor: isCurrent ? currentAccent : visual.color, backgroundColor: isCurrent ? currentAccent : visual.color },
                    isCurrent && styles.milestoneDotCurrent,
                  ]}
                >
                  {reached ? <Ionicons name={isCurrent ? 'radio-button-on' : 'checkmark'} size={isCurrent ? 11 : 10} color={tokens.colors.onAccent} /> : null}
                </View>
                {index < ranks.length - 1 ? (
                  <View style={[styles.connectorBottom, careerXp >= ranks[index + 1].threshold && { backgroundColor: visual.color }]} />
                ) : null}
              </View>

              <View style={[styles.milestoneContent, isCurrent && { backgroundColor: currentAccentSoft, borderLeftColor: currentAccent }]}>
                <View style={styles.rankCopy}>
                  <Text style={[styles.rankName, isCurrent && { color: currentAccent }]}>{levelLabel}</Text>
                  <Text style={styles.rankThreshold}>{rank.threshold.toLocaleString('tr-TR')} Kariyer XP</Text>
                </View>
                <View style={styles.levelState}>
                  <Ionicons
                    name={isCurrent ? 'radio-button-on' : reached ? 'checkmark' : 'lock-closed-outline'}
                    size={13}
                    color={isCurrent ? currentAccent : reached ? tokens.colors.success : tokens.colors.textMuted}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  />
                  <Text style={[styles.levelStateText, isCurrent && { color: currentAccent }]}>{levelState}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View> : null}
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    card: { borderBottomWidth: 1, borderBottomColor: colors.dividerSubtle },
    cardHeader: { minHeight: tokens.layout.isCompact ? 68 : 78, flexDirection: 'row', alignItems: 'center', gap: tokens.layout.isCompact ? 9 : 12, paddingVertical: 7 },
    cardHeaderPressed: { backgroundColor: colors.secondarySurfaceRaised, opacity: 0.9 },
    tierRail: { width: tokens.layout.isCompact ? 56 : 64, alignItems: 'center', justifyContent: 'center' },
    tierNode: { width: tokens.layout.isCompact ? 56 : 64, height: tokens.layout.isCompact ? 56 : 64, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.secondarySurfaceRaised, borderWidth: 1, borderColor: colors.borderSubtle },
    headerCopy: { flex: 1, minWidth: 0 },
    tierLabel: { fontFamily: fonts.headingBold, fontSize: tokens.layout.isCompact ? 16 : 17, lineHeight: 22, color: colors.text },
    tierRange: { fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 16, color: colors.textMuted, marginTop: 2 },
    headerState: { maxWidth: tokens.layout.isCompact ? 112 : 180, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 7 },
    stateLabel: { flexShrink: 1, fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 15, textAlign: 'right' },
    milestones: { paddingBottom: tokens.layout.isCompact ? 5 : 8, paddingLeft: tokens.layout.isCompact ? 6 : 9 },
    milestoneRow: { minHeight: tokens.layout.isCompact ? 52 : 58, flexDirection: 'row' },
    rail: { width: tokens.layout.isCompact ? 32 : 38, alignItems: 'center' },
    connectorTop: { position: 'absolute', top: 0, width: 2, height: tokens.layout.isCompact ? 13 : 15, backgroundColor: colors.borderStrong },
    connectorBottom: { position: 'absolute', top: tokens.layout.isCompact ? 29 : 31, bottom: 0, width: 2, backgroundColor: colors.borderStrong },
    milestoneDot: { position: 'absolute', top: tokens.layout.isCompact ? 12 : 14, width: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.secondarySurfaceRaised, borderWidth: 2, borderColor: colors.borderStrong, zIndex: 1 },
    milestoneDotCurrent: { width: 22, height: 22, top: tokens.layout.isCompact ? 10 : 12, borderRadius: 11, borderWidth: 3 },
    milestoneContent: { flex: 1, minWidth: 0, minHeight: tokens.layout.isCompact ? 44 : 50, marginBottom: 8, paddingHorizontal: tokens.layout.isCompact ? 9 : 11, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 8, borderLeftWidth: 2, borderLeftColor: 'transparent' },
    rankCopy: { flex: 1, minWidth: 0 },
    rankName: { fontFamily: fonts.headingBold, fontSize: 14, lineHeight: 19, color: colors.text },
    rankThreshold: { fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 16, color: colors.textMuted, marginTop: 1 },
    levelState: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 5 },
    levelStateText: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 14, color: colors.textMuted },
  });
}
