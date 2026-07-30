import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../src/theme/colors';
import { fonts, fontSizes } from '../../src/theme/typography';

// .bottom-nav karşılığı — Ana Sayfa / Oyun / İtibar / Mağaza / Profil
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentPositive,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: 'rgba(21,27,39,0.92)',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 78,
          paddingTop: 8,
          paddingBottom: 16,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: fontSizes.xs,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="game"
        options={{
          title: 'Oyun',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🎮</Text>,
        }}
      />
      <Tabs.Screen
        name="reputation"
        options={{
          title: 'İtibar',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🏆</Text>,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Mağaza',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🛍️</Text>,
        }}
      />
      <Tabs.Screen
        name="office"
        options={{
          title: 'Ofis',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🏢</Text>,
        }}
      />
      <Tabs.Screen
        name="room"
        options={{
          title: 'Oda',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🛏️</Text>,
        }}
      />
      <Tabs.Screen
        name="room-store"
        options={{
          title: 'Oda Shop',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🪑</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
