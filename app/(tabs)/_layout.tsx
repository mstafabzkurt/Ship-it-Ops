import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts, fontSizes } from '../../src/theme/typography';

// Alt navigasyon: Ana Sayfa / Oyun / Kariyer / Sıralama / Mağaza / Profil
export default function TabsLayout() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const bottomInset = Math.max(insets.bottom, tokens.spacing.sm);

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
          height: tokens.layout.tabBarHeight + bottomInset,
          paddingTop: tokens.spacing.sm,
          paddingBottom: bottomInset,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodySemiBold,
          fontSize: width <= 430 ? 10 : fontSizes.sm,
        },
        tabBarItemStyle: { minWidth: 0 },
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
        name="play"
        options={{
          title: 'Oyun',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'game-controller' : 'game-controller-outline'} color={color} size={width <= 430 ? 20 : 22} />,
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
        name="ranking"
        options={{
          title: 'Sıralama',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'podium' : 'podium-outline'} color={color} size={22} />,
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
      <Tabs.Screen
        name="game"
        options={{
          href: null,
          title: 'Oyun',
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{ href: null }}
      />
    </Tabs>
  );
}
