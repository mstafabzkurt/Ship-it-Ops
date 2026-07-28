import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import Topbar from '../../src/components/Topbar';
import StatsPanel from '../../src/components/StatsPanel';
import IncidentCard from '../../src/components/IncidentCard';
import QuickActionCard from '../../src/components/QuickActionCard';
import { CURRENT_INCIDENT } from '../../src/data/incidents';
import { useReputation } from '../../src/state/ReputationContext';
import { colors } from '../../src/theme/colors';
import { fonts, fontSizes } from '../../src/theme/typography';

export default function DashboardScreen() {
  const router = useRouter();
  const { currentRank } = useReputation();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Topbar statusLabel="Kriz Modu" statusVariant="crisis" />

        <View style={styles.statsWrap}>
          <StatsPanel />
        </View>

        <View style={styles.incidentWrap}>
          <IncidentCard
            tag={CURRENT_INCIDENT.tag}
            title={CURRENT_INCIDENT.title}
            description={CURRENT_INCIDENT.description}
            onRespond={() => router.push('/(tabs)/game')}
          />
        </View>

        <Text style={styles.sectionLabel}>Hızlı Erişim</Text>
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <QuickActionCard
              icon="🚨"
              title="Kriz Müdahalesi"
              subtitle="Aktif senaryoya müdahale et"
              onPress={() => router.push('/(tabs)/game')}
            />
            <QuickActionCard
              icon="🎮"
              title="Oyun Modu"
              subtitle="Rastgele kriz senaryosu çöz"
              onPress={() => router.push('/(tabs)/game')}
            />
          </View>
          <View style={styles.gridRow}>
            <QuickActionCard
              icon="🏅"
              title="İtibar Rozetleri"
              subtitle={`Şu an: ${currentRank.name}`}
              onPress={() => router.push('/(tabs)/reputation')}
            />
            <QuickActionCard
              icon="🛍️"
              title="Şirket Mağazası"
              subtitle="Ofis & rozet temaları"
              locked
              lockText="Takım Lideri gerekli"
            />
          </View>
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
  statsWrap: {
    marginHorizontal: 20,
    marginTop: 4,
  },
  incidentWrap: {
    marginHorizontal: 20,
    marginTop: 18,
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
  grid: {
    marginHorizontal: 20,
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
