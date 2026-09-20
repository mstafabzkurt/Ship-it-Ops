import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium, JetBrainsMono_600SemiBold, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { colors } from '../src/theme/colors';
import { AuthProvider, useAuth } from '../src/state/AuthContext';
import { LeaderboardProvider } from '../src/state/LeaderboardContext';
import { MessagingUnreadProvider } from '../src/state/MessagingUnreadContext';
import { ReputationProvider, useReputation } from '../src/state/ReputationContext';
import { ThemeProvider, useTheme } from '../src/state/ThemeContext';
import { PrivacyConsentProvider } from '../src/state/PrivacyConsentContext';
import { fonts } from '../src/theme/typography';
import ShipItOpsSplash from '../src/components/ShipItOpsSplash';
import GuidedProductTour from '../src/components/onboarding/GuidedProductTour';
import OnboardingExperience from '../src/components/onboarding/OnboardingExperience';
import PrivacyConsentExperience from '../src/components/privacy/PrivacyConsentExperience';
import AnalyticsLifecycle from '../src/components/analytics/AnalyticsLifecycle';
import GlobalMessagesShortcut from '../src/components/messaging/GlobalMessagesShortcut';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <PrivacyConsentProvider>
            <AccountScopedApp fontsLoaded={fontsLoaded} />
          </PrivacyConsentProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AccountScopedApp({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { user } = useAuth();

  // Remount all account-derived runtime state at every auth identity boundary.
  // Theme and device consent remain mounted outside this boundary.
  return (
    <ReputationProvider key={user?.id ?? 'signed-out'}>
      <LeaderboardProvider>
        <MessagingUnreadProvider>
          <RootNavigator fontsLoaded={fontsLoaded} />
        </MessagingUnreadProvider>
      </LeaderboardProvider>
    </ReputationProvider>
  );
}

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { theme, isHydrated: isThemeHydrated } = useTheme();
  const { isAuthenticated, isLoading, user } = useAuth();
  const {
    isLoaded: isPlayerSaveLoaded,
    retryPlayerSave,
    retrySaveInitialization,
    saveError,
    saveStatus,
  } = useReputation();
  const isShellReady = fontsLoaded && !isLoading && isThemeHydrated;
  const themedBackground = { backgroundColor: theme.colors.bgBase };
  const shellColors = theme.mode === 'light'
    ? {
        primary: theme.semantic?.action ?? theme.colors.accentPositive,
        text: theme.semantic?.text ?? theme.colors.textPrimary,
        muted: theme.semantic?.textMuted ?? theme.colors.textMuted,
        panel: theme.semantic?.surface ?? theme.colors.panel,
        panelRaised: theme.semantic?.surfaceRaised ?? theme.colors.panelAlt,
        warning: theme.semantic?.warning ?? theme.colors.accentAlert,
        warningSoft: theme.semantic?.warningSoft ?? theme.colors.alertBg,
        warningBorder: theme.colors.alertBorder,
      }
    : {
        primary: colors.accentPositive,
        text: colors.textPrimary,
        muted: colors.textMuted,
        panel: colors.panel,
        panelRaised: colors.panelAlt,
        warning: colors.accentAlert,
        warningSoft: colors.alertBg,
        warningBorder: colors.alertBorder,
      };

  useEffect(() => {
    if (fontsLoaded && isThemeHydrated) void SplashScreen.hideAsync();
  }, [fontsLoaded, isThemeHydrated]);

  if (!isShellReady) {
    return <ShipItOpsSplash fontsLoaded={fontsLoaded} />;
  }

  if (isAuthenticated && !isPlayerSaveLoaded) {
    const hasError = saveStatus === 'error';
    return (
      <ShipItOpsSplash
        loading={!hasError}
        status={hasError
          ? 'Hesap kaydı yüklenemedi'
          : saveStatus === 'migrating'
            ? 'Mevcut ilerleme hesaba taşınıyor...'
            : 'Operasyon ortamı hazırlanıyor...'}
      >
        {hasError ? (
          <>
            <Text style={[styles.bootError, { color: shellColors.muted }]}>{saveError}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={retrySaveInitialization}
              style={({ pressed }) => [
                styles.retryButton,
                { borderColor: shellColors.primary, backgroundColor: shellColors.panelRaised },
                pressed && styles.retryButtonPressed,
              ]}
            >
              <Text style={[styles.retryButtonText, { color: shellColors.primary }]}>Tekrar Dene</Text>
            </Pressable>
          </>
        ) : null}
      </ShipItOpsSplash>
    );
  }

  return (
    <View style={[styles.appRoot, themedBackground]}>
      <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />
      {isAuthenticated && isPlayerSaveLoaded && saveStatus === 'error' ? (
        <SafeAreaView edges={['top']} style={[styles.syncNoticeSafeArea, { backgroundColor: shellColors.panel }]}>
          <View
            accessibilityLiveRegion="polite"
            style={[styles.syncNotice, { borderBottomColor: shellColors.warningBorder, backgroundColor: shellColors.warningSoft }]}
          >
            <View style={styles.syncNoticeCopy}>
              <Text style={[styles.syncNoticeTitle, { color: shellColors.text }]}>Bulut kayıt bekliyor</Text>
              <Text numberOfLines={2} style={[styles.syncNoticeText, { color: shellColors.muted }]}>{saveError}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={retryPlayerSave}
              style={({ pressed }) => [styles.syncRetry, pressed && styles.retryButtonPressed]}
            >
              <Text style={[styles.syncRetryText, { color: shellColors.warning }]}>Yeniden Dene</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      ) : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: themedBackground }}>
        <Stack.Protected guard={isAuthenticated && isPlayerSaveLoaded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="company-search" />
          <Stack.Screen name="public-profile/[userId]" />
          <Stack.Screen name="friends" />
          <Stack.Screen name="friend-requests" />
          <Stack.Screen name="favorite-questions" />
          <Stack.Screen name="shared-questions" />
          <Stack.Screen name="question-detail/[questionId]" />
          <Stack.Screen name="messages/index" />
          <Stack.Screen name="messages/[userId]" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      <GlobalMessagesShortcut />
      {isAuthenticated && isPlayerSaveLoaded && user ? (
        <>
          <OnboardingExperience key={`onboarding-${user.id}`} />
          <GuidedProductTour key={`tour-${user.id}`} />
        </>
      ) : null}
      <PrivacyConsentExperience />
      <AnalyticsLifecycle />
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: { flex: 1, backgroundColor: colors.bgBase },
  bootError: {
    maxWidth: 440,
    paddingHorizontal: 24,
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 48,
    minWidth: 132,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accentPositive,
    backgroundColor: colors.panelAlt,
  },
  retryButtonPressed: { opacity: 0.72 },
  retryButtonText: { color: colors.accentPositive, fontFamily: fonts.bodySemiBold, fontSize: 13 },
  syncNoticeSafeArea: { backgroundColor: colors.panel },
  syncNotice: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.alertBorder,
    backgroundColor: colors.alertBg,
  },
  syncNoticeCopy: { flex: 1, minWidth: 0 },
  syncNoticeTitle: { color: colors.textPrimary, fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17 },
  syncNoticeText: { marginTop: 1, color: colors.textMuted, fontFamily: fonts.body, fontSize: 11, lineHeight: 16 },
  syncRetry: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 10 },
  syncRetryText: { color: colors.accentAlert, fontFamily: fonts.bodySemiBold, fontSize: 12 },
});
