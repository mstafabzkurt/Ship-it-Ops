import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { dashboardType, getDashboardTokens } from '../dashboard/dashboardTokens';

interface JokerStoreCardProps {
  icon: string;
  name: string;
  description: string;
  count: number;
}

export default function JokerStoreCard({ icon, name, description, count }: JokerStoreCardProps) {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);

  return (
    <View style={styles.card}>
      <View style={styles.powerArea}>
        <View style={styles.iconSlot}>
          <Text style={styles.icon} accessibilityElementsHidden>{icon}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>×{count}</Text>
          </View>
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={styles.footer}>
        <View style={styles.inventoryPill}>
          <Text style={styles.inventoryLabel}>ENVANTER</Text>
          <Text style={styles.inventoryValue}>{count}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${name} satın alma yakında`}
          accessibilityState={{ disabled: true }}
          disabled
          style={styles.disabledAction}
        >
          <Text style={styles.disabledActionText}>Satın Alma Yakında</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    card: { flex: 1, minHeight: 310, overflow: 'hidden', borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadow.card },
    powerArea: { height: 126, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, borderBottomWidth: 1, borderBottomColor: colors.border },
    iconSlot: { width: 82, height: 82, alignItems: 'center', justifyContent: 'center', borderRadius: 41, backgroundColor: colors.surfaceRaised, borderWidth: 2, borderColor: colors.primary, ...shadow.raised },
    icon: { fontSize: 37, lineHeight: 45 },
    countBadge: { position: 'absolute', top: -5, right: -8, minWidth: 34, height: 30, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, borderRadius: radius.pill, backgroundColor: colors.danger, borderWidth: 2, borderColor: colors.surface },
    countText: { fontFamily: fonts.monoBold, fontSize: 12, lineHeight: 16, color: colors.onAccent },
    copy: { flex: 1, padding: 18 },
    name: { ...dashboardType.title, fontFamily: fonts.headingBold, color: colors.text, marginBottom: 7 },
    description: { ...dashboardType.body, fontFamily: fonts.body, color: colors.textMuted },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surfaceRaised },
    inventoryPill: { minHeight: tokens.control.height, justifyContent: 'center', paddingHorizontal: 11, borderRadius: radius.md, backgroundColor: colors.secondarySoft, borderWidth: 1, borderColor: colors.secondary },
    inventoryLabel: { fontFamily: fonts.bodySemiBold, fontSize: 9, lineHeight: 12, letterSpacing: 0.55, color: colors.textMuted },
    inventoryValue: { fontFamily: fonts.monoBold, fontSize: 16, lineHeight: 20, color: colors.secondary },
    disabledAction: { minHeight: tokens.control.height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, opacity: 0.58 },
    disabledActionText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: colors.textMuted },
  });
}
