import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ReputationBar from '../../src/components/ReputationBar';
import BadgeCard from '../../src/components/BadgeCard';
import { useReputation, RANKS } from '../../src/state/ReputationContext';
import { colors } from '../../src/theme/colors';
import { fonts, fontSizes } from '../../src/theme/typography';

// Tier görsel konfigürasyonu
const TIER_CONFIG: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  junior: { emoji: '🌱', color: '#8A93A6', bg: 'rgba(138,147,166,0.10)', border: 'rgba(138,147,166,0.30)' },
  engineer: { emoji: '⚡', color: '#35C9A3', bg: 'rgba(53,201,163,0.10)', border: 'rgba(53,201,163,0.30)' },
  senior: { emoji: '🔵', color: '#60AFFF', bg: 'rgba(96,175,255,0.10)', border: 'rgba(96,175,255,0.30)' },
  lead: { emoji: '🟣', color: '#B57BFF', bg: 'rgba(181,123,255,0.10)', border: 'rgba(181,123,255,0.30)' },
  manager: { emoji: '🟠', color: '#F2A93B', bg: 'rgba(242,169,59,0.10)', border: 'rgba(242,169,59,0.30)' },
  director: { emoji: '🔴', color: '#E5484D', bg: 'rgba(229,72,77,0.12)', border: 'rgba(229,72,77,0.35)' },
  cto: { emoji: '👑', color: '#FFD700', bg: 'rgba(255,215,0,0.10)', border: 'rgba(255,215,0,0.35)' },
};

// İtibar sekmesi — rütbe ilerlemesi + rozet koleksiyonu.
// Veri kaynağı ReputationContext (bkz. src/state/ReputationContext.tsx).
export default function ReputationScreen() {
  const { score, currentRank, nextRank, rankProgress, badges } = useReputation();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>İtibar</Text>

        {/* Current rank progress card */}
        <View style={styles.progressCard}>
          <ReputationBar score={score} currentRank={currentRank} nextRank={nextRank} progress={rankProgress} />
        </View>

        {/* ── Rank Road ─────────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Rütbe Yolu</Text>
        <View style={styles.rankList}>
          {RANKS.map((rank) => {
            const reached = score >= rank.threshold;
            const isCurrent = rank.id === currentRank.id;
            const cfg = TIER_CONFIG[rank.tier] ?? TIER_CONFIG.junior;

            return (
              <View
                key={rank.id}
                style={[
                  styles.rankRow,
                  isCurrent && { borderColor: cfg.border, backgroundColor: cfg.bg },
                  !reached && styles.rankRowLocked,
                ]}
              >
                {/* Tier dot */}
                <View
                  style={[
                    styles.rankDot,
                    reached && { backgroundColor: cfg.color },
                  ]}
                />

                <Text style={styles.rankEmoji}>{cfg.emoji}</Text>

                <View style={styles.rankTextWrap}>
                  <Text
                    style={[
                      styles.rankName,
                      isCurrent && { color: cfg.color },
                    ]}
                  >
                    {rank.name}
                  </Text>
                  <Text style={styles.rankThreshold}>
                    {rank.threshold.toLocaleString('tr-TR')} puan
                  </Text>
                </View>

                {isCurrent ? (
                  <View style={[styles.currentTagWrap, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
                    <Text style={[styles.currentTag, { color: cfg.color }]}>Şu an</Text>
                  </View>
                ) : reached ? (
                  <Text style={styles.reachedCheck}>✓</Text>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* ── Badges ────────────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>
          Rozetler ({badges.filter((b) => b.earned).length}/{badges.length})
        </Text>
        {/* Earned count summary */}
        <View style={styles.badgeSummaryRow}>
          <View style={styles.badgeSummaryChip}>
            <Text style={styles.badgeSummaryIcon}>🏆</Text>
            <Text style={styles.badgeSummaryText}>
              {badges.filter((b) => b.earned).length} kazanıldı
            </Text>
          </View>
          <View style={[styles.badgeSummaryChip, styles.badgeSummaryChipLocked]}>
            <Text style={styles.badgeSummaryIcon}>🔒</Text>
            <Text style={[styles.badgeSummaryText, styles.badgeSummaryTextLocked]}>
              {badges.filter((b) => !b.earned).length} kilitli
            </Text>
          </View>
        </View>

        {/* All badges — earned first, then locked */}
        <View style={styles.badgeGrid}>
          {[...badges].sort((a, b) => {
            // Earned badges come first
            if (a.earned && !b.earned) return -1;
            if (!a.earned && b.earned) return 1;
            return a.requiredScore - b.requiredScore;
          }).map((badge, i) => (
            <View key={badge.id} style={styles.badgeGridItem}>
              <BadgeCard
                icon={badge.icon}
                title={badge.title}
                description={badge.description}
                earned={badge.earned}
                requiredScore={badge.requiredScore}
                rewardBudget={badge.rewardBudget}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    fontFamily: fonts.headingSemiBold,
    fontSize: fontSizes['3xl'],
    color: colors.textPrimary,
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 4,
  },
  progressCard: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
  },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
  },

  /* Rank list */
  rankList: {
    marginHorizontal: 20,
    gap: 6,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  rankRowLocked: {
    opacity: 0.4,
  },
  rankDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  rankEmoji: {
    fontSize: 14,
  },
  rankTextWrap: {
    flex: 1,
  },
  rankName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  rankThreshold: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  currentTagWrap: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  currentTag: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
  },
  reachedCheck: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.accentPositive,
  },

  /* Badge summary */
  badgeSummaryRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  badgeSummaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.positiveBg,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  badgeSummaryChipLocked: {
    backgroundColor: colors.panelAlt,
    borderColor: colors.border,
  },
  badgeSummaryIcon: {
    fontSize: 13,
  },
  badgeSummaryText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    color: colors.accentPositive,
  },
  badgeSummaryTextLocked: {
    color: colors.textMuted,
  },

  /* Badge grid */
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    gap: 10,
  },
  badgeGridItem: {
    flexBasis: '47%',
    flexGrow: 1,
  },
});
