import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ReputationBar from '../../src/components/ReputationBar';
import BadgeCard from '../../src/components/BadgeCard';
import { useReputation, RANKS } from '../../src/state/ReputationContext';
import { colors } from '../../src/theme/colors';
import { fonts, fontSizes } from '../../src/theme/typography';

// İtibar sekmesi — rütbe ilerlemesi + rozet koleksiyonu.
// Veri kaynağı ReputationContext (bkz. src/state/ReputationContext.tsx),
// Dashboard'daki İtibar barıyla aynı state paylaşılıyor.
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

        <View style={styles.progressCard}>
          <ReputationBar score={score} currentRank={currentRank} nextRank={nextRank} progress={rankProgress} />
        </View>

        <Text style={styles.sectionLabel}>Rütbe Yolu</Text>
        <View style={styles.rankList}>
          {RANKS.map((rank) => {
            const reached = score >= rank.threshold;
            const isCurrent = rank.id === currentRank.id;
            return (
              <View
                key={rank.id}
                style={[
                  styles.rankRow,
                  isCurrent && styles.rankRowCurrent,
                  !reached && styles.rankRowLocked,
                ]}
              >
                <View style={[styles.rankDot, reached && styles.rankDotReached]} />
                <View style={styles.rankTextWrap}>
                  <Text style={[styles.rankName, isCurrent && styles.rankNameCurrent]}>{rank.name}</Text>
                  <Text style={styles.rankThreshold}>{rank.threshold.toLocaleString('tr-TR')} puan</Text>
                </View>
                {isCurrent ? <Text style={styles.currentTag}>Şu an</Text> : null}
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Rozetler</Text>
        <View style={styles.badgeGrid}>
          {badges.map((badge, i) => (
            <View key={badge.id} style={i % 2 === 0 ? styles.badgeGridItemLeft : styles.badgeGridItemRight}>
              <BadgeCard
                icon={badge.icon}
                title={badge.title}
                description={badge.description}
                earned={badge.earned}
                requiredScore={badge.requiredScore}
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
    paddingBottom: 32,
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
  rankList: {
    marginHorizontal: 20,
    gap: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  rankRowCurrent: {
    borderColor: colors.positiveBorder,
    backgroundColor: colors.positiveBg,
  },
  rankRowLocked: {
    opacity: 0.5,
  },
  rankDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  rankDotReached: {
    backgroundColor: colors.accentPositive,
  },
  rankTextWrap: {
    flex: 1,
  },
  rankName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  rankNameCurrent: {
    color: colors.accentPositive,
  },
  rankThreshold: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  currentTag: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    color: colors.accentPositive,
    textTransform: 'uppercase',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    gap: 10,
  },
  badgeGridItemLeft: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  badgeGridItemRight: {
    flexBasis: '47%',
    flexGrow: 1,
  },
});
