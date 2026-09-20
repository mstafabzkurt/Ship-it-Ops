import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CosmeticPreview from '../src/components/cosmetics/CosmeticPreview';
import { getDashboardTokens } from '../src/components/dashboard/dashboardTokens';
import { getCosmeticById, type AvatarCosmetic, type AvatarFrameCosmetic } from '../src/config/cosmetics';
import { searchPublicProfiles } from '../src/services/publicProfile';
import { useAuth } from '../src/state/AuthContext';
import { useTheme } from '../src/state/ThemeContext';
import { fonts } from '../src/theme/typography';
import { normalizePublicProfileQuery, type PublicProfile } from '../src/utils/publicProfile';

type SearchStatus = 'idle' | 'loading' | 'ready' | 'error';
const SEARCH_DEBOUNCE_MS = 320;

export default function CompanySearchScreen() {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { user } = useAuth();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [retryToken, setRetryToken] = useState(0);
  const requestIdRef = useRef(0);
  const query = normalizePublicProfileQuery(input);

  useEffect(() => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    if (!query || !user?.id) {
      setResults([]);
      setStatus('idle');
      return undefined;
    }

    setStatus('loading');
    const timer = setTimeout(() => {
      void searchPublicProfiles(query, user.id)
        .then((profiles) => {
          if (requestIdRef.current !== requestId) return;
          setResults(profiles);
          setStatus('ready');
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) return;
          setResults([]);
          setStatus('error');
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, retryToken, user?.id]);

  const helper = input.trim().length === 1
    ? 'Aramak için en az 2 karakter gir.'
    : 'Tam veya başlangıç eşleşmeleri en üstte gösterilir.';

  return (
    <View style={styles.background}>
      <View pointerEvents="none" style={styles.topRule} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Profile dön"
              hitSlop={8}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Ionicons name="arrow-back" size={22} color={tokens.colors.text} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>SOSYAL KEŞİF</Text>
              <Text accessibilityRole="header" style={styles.title}>Şirket Ara</Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Şirket adı</Text>
          <View style={styles.searchField}>
            <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name="search" size={20} color={tokens.colors.textMuted} />
            <TextInput
              accessibilityLabel="Şirket adı ara"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={32}
              onChangeText={setInput}
              placeholder="Şirket adı ara"
              placeholderTextColor={tokens.colors.textMuted}
              returnKeyType="search"
              style={styles.input}
              value={input}
            />
            {input ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Aramayı temizle"
                hitSlop={6}
                onPress={() => setInput('')}
                style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
              >
                <Ionicons name="close-circle" size={20} color={tokens.colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.helper}>{helper}</Text>

          <FlatList
            contentContainerStyle={[styles.listContent, results.length === 0 && styles.listContentEmpty]}
            data={results}
            keyExtractor={(profile) => profile.userId}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <SearchResultCard
                profile={item}
                onPress={() => router.push({ pathname: '/public-profile/[userId]', params: { userId: item.userId } })}
                styles={styles}
                tokens={tokens}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.resultSeparator} />}
            ListEmptyComponent={(
              <SearchState
                input={input}
                status={status}
                onRetry={() => setRetryToken((value) => value + 1)}
                styles={styles}
                tokens={tokens}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function SearchResultCard({
  profile,
  onPress,
  styles,
  tokens,
}: {
  profile: PublicProfile;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  const avatar = getCosmeticById(profile.avatarId) as AvatarCosmetic;
  const frame = getCosmeticById(profile.avatarFrameId) as AvatarFrameCosmetic;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${profile.companyName}, ${profile.careerRank}, ${profile.careerXp.toLocaleString('tr-TR')} Kariyer XP. Profili aç.`}
      onPress={onPress}
      style={({ pressed }) => [styles.resultCard, pressed && styles.resultCardPressed]}
    >
      <CosmeticPreview
        avatar={avatar}
        frame={frame}
        mode="equippedCombo"
        size={64}
        accessibilityLabel={`${profile.companyName} avatarı`}
      />
      <View style={styles.resultCopy}>
        <Text numberOfLines={2} style={styles.companyName}>{profile.companyName}</Text>
        <Text numberOfLines={1} style={styles.rank}>{profile.careerRank}</Text>
        <Text style={styles.xp}>{profile.careerXp.toLocaleString('tr-TR')} Kariyer XP</Text>
      </View>
      <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name="chevron-forward" size={20} color={tokens.colors.textMuted} />
    </Pressable>
  );
}

function SearchState({ input, status, onRetry, styles, tokens }: {
  input: string;
  status: SearchStatus;
  onRetry: () => void;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  if (status === 'loading') {
    return (
      <View accessibilityLiveRegion="polite" style={styles.stateBox}>
        <ActivityIndicator color={tokens.colors.secondary} />
        <Text style={styles.stateTitle}>Şirketler aranıyor</Text>
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View accessibilityLiveRegion="polite" style={styles.stateBox}>
        <Ionicons name="cloud-offline-outline" size={28} color={tokens.colors.warning} />
        <Text style={styles.stateTitle}>Arama tamamlanamadı</Text>
        <Text style={styles.stateText}>Bağlantını kontrol edip tekrar deneyebilirsin.</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }
  if (status === 'ready') {
    return (
      <View accessibilityLiveRegion="polite" style={styles.stateBox}>
        <Ionicons name="business-outline" size={28} color={tokens.colors.textMuted} />
        <Text style={styles.stateTitle}>Eşleşen şirket bulunamadı</Text>
        <Text style={styles.stateText}>Yazımı kontrol et veya şirket adının başlangıcını dene.</Text>
      </View>
    );
  }
  return (
    <View style={styles.stateBox}>
      <Ionicons name="search-outline" size={28} color={tokens.colors.textMuted} />
      <Text style={styles.stateTitle}>{input.trim().length === 1 ? 'Bir karakter daha gir' : 'Bir şirket profili bul'}</Text>
      <Text style={styles.stateText}>Arama sonuçları yalnızca güvenli, herkese açık profil bilgilerini gösterir.</Text>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    topRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, opacity: 0.5 },
    safeArea: { flex: 1 },
    container: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: tokens.layout.pageGutter, paddingTop: tokens.layout.pageTop },
    header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
    backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    headerCopy: { flex: 1, minWidth: 0 },
    eyebrow: { ...tokens.type.eyebrow, color: colors.secondary, fontFamily: fonts.bodySemiBold, marginBottom: 2 },
    title: { ...tokens.type.display, color: colors.text, fontFamily: fonts.headingBold },
    inputLabel: { color: colors.text, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 19, marginBottom: 7 },
    searchField: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 15, paddingRight: 4, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
    input: { flex: 1, minWidth: 0, paddingVertical: 12, color: colors.text, fontFamily: fonts.body, fontSize: 16, lineHeight: 22 },
    clearButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
    helper: { marginTop: 7, color: colors.textMuted, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
    listContent: { paddingTop: 18, paddingBottom: 28 },
    listContentEmpty: { flexGrow: 1 },
    resultSeparator: { height: 10 },
    resultCard: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle, ...shadow.card, shadowColor: colors.shadowNeutral, shadowOpacity: 0.12 },
    resultCardPressed: { opacity: 0.84, borderColor: colors.borderStrong, backgroundColor: colors.surfacePressed },
    resultCopy: { flex: 1, minWidth: 0 },
    companyName: { color: colors.text, fontFamily: fonts.headingBold, fontSize: 17, lineHeight: 22 },
    rank: { marginTop: 2, color: colors.primary, fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17 },
    xp: { marginTop: 2, color: colors.textMuted, fontFamily: fonts.monoMedium, fontSize: 12, lineHeight: 17 },
    stateBox: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
    stateTitle: { marginTop: 12, color: colors.text, fontFamily: fonts.headingBold, fontSize: 17, lineHeight: 23, textAlign: 'center' },
    stateText: { maxWidth: 380, marginTop: 5, color: colors.textMuted, fontFamily: fonts.body, fontSize: 14, lineHeight: 21, textAlign: 'center' },
    retryButton: { minHeight: 48, marginTop: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: radius.sm, backgroundColor: colors.primary },
    retryText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 14 },
    pressed: { opacity: 0.72 },
  });
}
