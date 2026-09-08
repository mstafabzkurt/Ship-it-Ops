import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium, JetBrainsMono_600SemiBold, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { colors } from '../src/theme/colors';
import { AuthProvider, useAuth } from '../src/state/AuthContext';
import { LeaderboardProvider } from '../src/state/LeaderboardContext';
import { ReputationProvider, useReputation } from '../src/state/ReputationContext';
import { ThemeProvider, useTheme } from '../src/state/ThemeContext';
import { fonts } from '../src/theme/typography';
import GuidedProductTour from '../src/components/onboarding/GuidedProductTour';
import OnboardingExperience from '../src/components/onboarding/OnboardingExperience';

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
          <ReputationProvider>
            <LeaderboardProvider>
              <RootNavigator fontsLoaded={fontsLoaded} />
            </LeaderboardProvider>
          </ReputationProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
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
        danger: theme.semantic?.danger ?? theme.colors.accentDanger,
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
        danger: colors.accentDanger,
        text: colors.textPrimary,
        muted: colors.textMuted,
        panel: colors.panel,
        panelRaised: colors.panelAlt,
        warning: colors.accentAlert,
        warningSoft: colors.alertBg,
        warningBorder: colors.alertBorder,
      };

  useEffect(() => {
    if (isShellReady) void SplashScreen.hideAsync();
  }, [isShellReady]);

  if (!isShellReady) {
    return (
      <View accessibilityLabel="Ship It Ops hazırlanıyor" style={[styles.bootScreen, themedBackground]}>
        <View style={[styles.bootMark, { backgroundColor: shellColors.primary }]} />
        <Text style={[styles.bootTitle, { color: shellColors.text }, fontsLoaded && styles.bootTitleLoaded]}>SHIP IT OPS</Text>
        <Text style={[styles.bootLabel, { color: shellColors.muted }, fontsLoaded && styles.bootLabelLoaded]}>ACCESS NODE BAŞLATILIYOR</Text>
        <ActivityIndicator accessibilityLabel="Oturum yükleniyor" color={shellColors.primary} size="small" />
      </View>
    );
  }

  if (isAuthenticated && !isPlayerSaveLoaded) {
    const hasError = saveStatus === 'error';
    return (
      <View accessibilityLabel="Hesap ilerlemesi hazırlanıyor" style={[styles.bootScreen, themedBackground]}>
        <View style={[styles.bootMark, { backgroundColor: hasError ? shellColors.danger : shellColors.primary }]} />
        <Text style={[styles.bootTitle, { color: shellColors.text }, styles.bootTitleLoaded]}>SHIP IT OPS</Text>
        <Text accessibilityLiveRegion="polite" style={[styles.bootLabel, { color: shellColors.muted }, styles.bootLabelLoaded]}>
          {hasError
            ? 'HESAP KAYDI YÜKLENEMEDİ'
            : saveStatus === 'migrating'
              ? 'MEVCUT İLERLEME HESABA TAŞINIYOR'
              : 'HESAP İLERLEMESİ YÜKLENİYOR'}
        </Text>
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
        ) : (
          <ActivityIndicator accessibilityLabel="Hesap ilerlemesi yükleniyor" color={shellColors.primary} size="small" />
        )}
      </View>
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
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      {isAuthenticated && isPlayerSaveLoaded && user ? (
        <>
          <OnboardingExperience key={`onboarding-${user.id}`} />
          <GuidedProductTour key={`tour-${user.id}`} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: { flex: 1, backgroundColor: colors.bgBase },
  bootScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.bgBase,
  },
  bootMark: { width: 42, height: 3, borderRadius: 2, backgroundColor: colors.accentPositive },
  bootTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', letterSpacing: 1.4 },
  bootTitleLoaded: { fontFamily: fonts.headingBold, fontWeight: '400' },
  bootLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.1, marginBottom: 4 },
  bootLabelLoaded: { fontFamily: fonts.monoMedium },
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
