import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';

interface BadgeCardProps {
  icon: string;
  title: string;
  description: string;
  earned: boolean;
  requiredScore: number;
  rewardBudget?: number; // <-- Ödül bütçesini buraya ekledik
}

export default function BadgeCard({ icon, title, description, earned, requiredScore, rewardBudget }: BadgeCardProps) {
  return (
    <View style={[styles.card, earned ? styles.cardEarned : styles.cardLocked]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      
      {/* Ödül miktarı gösterimi */}
      {rewardBudget && (
        <Text style={styles.rewardText}>🎁 +{rewardBudget.toLocaleString('tr-TR')} Bütçe</Text>
      )}

      {!earned ? (
        <Text style={styles.lockBadge}>🔒 {requiredScore.toLocaleString('tr-TR')} puan gerekli</Text>
      ) : (
        <Text style={styles.earnedBadge}>✓ Kazanıldı</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  cardEarned: {
    borderColor: colors.positiveBorder,
    backgroundColor: colors.positiveBg,
  },
  cardLocked: {
    borderColor: colors.border,
    opacity: 0.55,
  },
  icon: {
    fontSize: 22,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.headingSemiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    lineHeight: 15,
  },
  rewardText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    color: colors.accentPositive,
    marginTop: 6,
  },
  lockBadge: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.accentAlert,
    marginTop: 8,
  },
  earnedBadge: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    color: colors.accentPositive,
    marginTop: 8,
  },
});