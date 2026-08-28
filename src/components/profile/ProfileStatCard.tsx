import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

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
  const { width } = useWindowDimensions();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
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
  const { colors, radius } = tokens;
  return StyleSheet.create({
    card: { flex: 1, minHeight: tokens.layout.isCompact ? 94 : 106, justifyContent: 'space-between', padding: tokens.layout.isCompact ? 11 : 13, borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle, borderTopWidth: 2 },
    neutralCard: { borderTopColor: colors.primary },
    positiveCard: { borderTopColor: colors.secondary },
    negativeCard: { borderTopColor: colors.danger },
    warningCard: { borderTopColor: colors.warning },
    mark: { width: 28, height: 24, alignItems: 'flex-start', justifyContent: 'center' },
    neutralMark: {},
    positiveMark: {},
    negativeMark: {},
    warningMark: {},
    markText: { fontFamily: fonts.headingBold, fontSize: 17, lineHeight: 21 },
    value: { fontFamily: fonts.monoBold, fontSize: tokens.layout.isCompact ? 20 : 24, lineHeight: tokens.layout.isCompact ? 25 : 30, marginTop: tokens.layout.isCompact ? 6 : 10 },
    neutralValue: { color: colors.primary },
    positiveValue: { color: colors.secondary },
    negativeValue: { color: colors.danger },
    warningValue: { color: colors.warning },
    label: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: colors.textMuted, marginTop: 3 },
  });
}
