import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useMemo } from 'react';

import { getDashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts, fontSizes } from '../../src/theme/typography';

// Alt navigasyon: Ana Sayfa / Oyun / Kariyer / Mağaza / Profil
export default function TabsLayout() {
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme), [theme]);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.secondary,
        tabBarInactiveTintColor: tokens.colors.textMuted,
        tabBarStyle: {
          backgroundColor: tokens.colors.surface,
          borderTopColor: tokens.colors.border,
          borderTopWidth: 1,
          height: tokens.layout.tabBarHeight,
          paddingTop: tokens.spacing.sm,
          paddingBottom: tokens.spacing.md,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodySemiBold,
          fontSize: fontSizes.sm,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="game"
        options={{
          title: 'Oyun',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'game-controller' : 'game-controller-outline'} color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="reputation"
        options={{
          title: 'Kariyer',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'trophy' : 'trophy-outline'} color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Mağaza',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'bag-handle' : 'bag-handle-outline'} color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
