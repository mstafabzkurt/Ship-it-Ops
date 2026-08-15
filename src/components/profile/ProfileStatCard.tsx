import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

type StatTone = 'neutral' | 'positive' | 'negative' | 'warning';

interface ProfileStatCardProps {
  mark: string;
  label: string;
  value: string;
  tone: StatTone;
}

export default function ProfileStatCard({ mark, label, value, tone }: ProfileStatCardProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  return (
    <View style={[styles.card, styles[`${tone}Card`]]}>
      <View style={[styles.mark, styles[`${tone}Mark`]]}>
        <Text style={[styles.markText, styles[`${tone}Value`]]}>{mark}</Text>
      </View>
      <Text style={[styles.value, styles[`${tone}Value`]]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: { flex: 1, minHeight: 142, justifyContent: 'space-between', padding: 15, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadow.card },
    neutralCard: { backgroundColor: colors.surface },
    positiveCard: { backgroundColor: colors.secondarySoft, borderColor: colors.secondary },
    negativeCard: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
    warningCard: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
    mark: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderStrong },
    neutralMark: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    positiveMark: { backgroundColor: colors.surface, borderColor: colors.secondary },
    negativeMark: { backgroundColor: colors.surface, borderColor: colors.danger },
    warningMark: { backgroundColor: colors.surface, borderColor: colors.warning },
    markText: { fontFamily: fonts.headingBold, fontSize: 17, lineHeight: 21 },
    value: { fontFamily: fonts.monoBold, fontSize: 24, lineHeight: 30, marginTop: 10 },
    neutralValue: { color: colors.primary },
    positiveValue: { color: colors.secondary },
    negativeValue: { color: colors.danger },
    warningValue: { color: colors.warning },
    label: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: colors.textMuted, marginTop: 3 },
  });
}
