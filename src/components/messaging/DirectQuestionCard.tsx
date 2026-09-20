import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import type { ArchivedQuestion } from '../../utils/questionSocial';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

export default function DirectQuestionCard({ question, onOpen }: {
  question: ArchivedQuestion | null;
  onOpen: () => void;
}) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  return (
    <View style={styles.card}>
      <View style={styles.rail} />
      <View style={styles.metaRow}>
        <Ionicons name="code-slash-outline" size={16} color={tokens.colors.secondary} />
        <Text numberOfLines={1} style={styles.meta}>
          {question ? `${question.categoryName} · ${question.difficultyStar}★` : 'PAYLAŞILAN SORU'}
        </Text>
      </View>
      <Text numberOfLines={4} style={styles.question}>
        {question?.title ?? 'Bu soru şu anda görüntülenemiyor.'}
      </Text>
      {question ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Paylaşılan soruyu salt okunur aç"
          onPress={onOpen}
          style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
        >
          <Text style={styles.openText}>Soruyu Aç</Text>
          <Ionicons name="arrow-forward" size={17} color={tokens.colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}
function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    card: { width: '100%', minWidth: 0, overflow: 'hidden', padding: 12, borderRadius: radius.sm, backgroundColor: colors.gameSupportRaisedSurface, borderWidth: 1, borderColor: colors.borderStrong },
    rail: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, backgroundColor: colors.secondary },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    meta: { flex: 1, minWidth: 0, color: colors.secondary, fontFamily: fonts.monoSemiBold, fontSize: 10, lineHeight: 15, letterSpacing: 0.35 },
    question: { marginTop: 8, color: colors.text, fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20 },
    openButton: { minHeight: 44, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.dividerSubtle, paddingTop: 8 },
    openText: { color: colors.primary, fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 18 },
    pressed: { opacity: 0.7 },
  });
}
