import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { useTheme } from '../../src/state/ThemeContext';
import { useReputation } from '../../src/state/ReputationContext';
import { fonts, fontSizes } from '../../src/theme/typography';

// Alt navigasyon: Ana Sayfa / Oyun / Kariyer / Sıralama / Mağaza / Profil
export default function TabsLayout() {
  const { theme } = useTheme();
  const { unseenBadgeIds } = useReputation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const bottomInset = Math.max(insets.bottom, tokens.spacing.sm);
  const hasNewBadge = unseenBadgeIds.length > 0;

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={({ navigation }) => ({
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.secondary,
        tabBarInactiveTintColor: tokens.colors.textMuted,
        tabBarLabelPosition: 'beside-icon',
        tabBarStyle: {
          backgroundColor: tokens.colors.surface,
          borderTopColor: tokens.colors.border,
          borderTopWidth: 1,
          height: tokens.layout.tabBarHeight + bottomInset,
          paddingTop: tokens.spacing.sm,
          paddingBottom: bottomInset,
          paddingHorizontal: Math.max(insets.left, insets.right, tokens.spacing.sm),
        },
        tabBarLabel: ({ focused, color, children }) => focused ? (
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
            style={[styles.activeLabel, { color, marginLeft: tokens.spacing.xs }]}
          >
            {children}
          </Text>
        ) : null,
        tabBarItemStyle: {
          // Reserve room for the selected label while keeping six comfortable targets.
          flex: navigation.isFocused() ? 2.6 : 1,
          minWidth: 44,
          maxWidth: navigation.isFocused() ? 160 : 64,
          height: tokens.control.height,
          alignSelf: 'center',
          marginHorizontal: 'auto',
          borderRadius: tokens.radius.pill,
          borderWidth: 1,
          borderColor: navigation.isFocused() ? tokens.colors.borderStrong : 'transparent',
          backgroundColor: navigation.isFocused() ? tokens.colors.secondarySoft : 'transparent',
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarAccessibilityLabel: 'Ana Sayfa',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: 'Oyun',
          tabBarAccessibilityLabel: 'Oyun',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'game-controller' : 'game-controller-outline'} color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="reputation"
        options={{
          title: 'Kariyer',
          tabBarAccessibilityLabel: hasNewBadge ? 'Kariyer, yeni rozet var' : 'Kariyer',
          tabBarIcon: ({ color, focused }) => (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.careerIcon}
            >
              <Ionicons name={focused ? 'trophy' : 'trophy-outline'} color={color} size={22} />
              {hasNewBadge ? (
                <View style={[styles.notificationDot, { backgroundColor: tokens.colors.danger, borderColor: tokens.colors.surface, shadowColor: tokens.colors.danger }]} />
              ) : null}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Sıralama',
          tabBarAccessibilityLabel: 'Sıralama',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'podium' : 'podium-outline'} color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Mağaza',
          tabBarAccessibilityLabel: 'Mağaza',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'bag-handle' : 'bag-handle-outline'} color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarAccessibilityLabel: 'Profil',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="game"
        options={{
          href: null,
          title: 'Oyun',
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeLabel: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.base, lineHeight: 18, flexShrink: 1 },
  careerIcon: { width: 26, height: 24, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', top: 0, right: 0, width: 7, height: 7, borderRadius: 4, borderWidth: 1, shadowOpacity: 0.38, shadowRadius: 5, elevation: 5 },
});
