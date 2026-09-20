import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDashboardTokens } from '../src/components/dashboard/dashboardTokens';
import SocialProfileRow from '../src/components/social/SocialProfileRow';
import { listFriends } from '../src/services/friends';
import { useAuth } from '../src/state/AuthContext';
import { useTheme } from '../src/state/ThemeContext';
import { fonts } from '../src/theme/typography';
import type { FriendConnection } from '../src/utils/friends';

type LoadStatus = 'loading' | 'ready' | 'error';

export default function FriendsScreen() {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { user } = useAuth();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [friends, setFriends] = useState<FriendConnection[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const requestIdRef = useRef(0);

  const loadFriends = useCallback(() => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    if (!user?.id) {
      setFriends([]);
      setStatus('error');
      return;
    }

    setStatus('loading');
    void listFriends(user.id)
      .then((connections) => {
        if (requestIdRef.current !== requestId) return;
        setFriends(connections);
        setStatus('ready');
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setFriends([]);
        setStatus('error');
      });
  }, [user?.id]);

  useFocusEffect(useCallback(() => {
    loadFriends();
    return () => { requestIdRef.current += 1; };
  }, [loadFriends]));

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
              <Text style={styles.eyebrow}>SOSYAL</Text>
              <Text accessibilityRole="header" style={styles.title}>Arkadaşlar</Text>
            </View>
          </View>

          <FlatList
            contentContainerStyle={[styles.listContent, friends.length === 0 && styles.listContentEmpty]}
            data={friends}
            keyExtractor={(connection) => connection.relationship.id}
            renderItem={({ item }) => (
              <SocialProfileRow
                actions={item.profile ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${item.profile.companyName} şirketine mesaj gönder`}
                    onPress={() => router.push({ pathname: '/messages/[userId]', params: { userId: item.userId } })}
                    style={({ pressed }) => [styles.messageButton, pressed && styles.pressed]}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color={tokens.colors.primary} />
                    <Text style={styles.messageButtonText}>Mesaj Gönder</Text>
                  </Pressable>
                ) : undefined}
                profile={item.profile}
                onOpen={item.profile
                  ? () => router.push({ pathname: '/public-profile/[userId]', params: { userId: item.userId } })
                  : undefined}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={(
              <FriendsState status={status} onRetry={loadFriends} styles={styles} tokens={tokens} />
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function FriendsState({ status, onRetry, styles, tokens }: {
  status: LoadStatus;
  onRetry: () => void;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  if (status === 'loading') {
    return (
      <View accessibilityLiveRegion="polite" style={styles.stateBox}>
        <ActivityIndicator color={tokens.colors.secondary} />
        <Text style={styles.stateTitle}>Arkadaşlar yükleniyor</Text>
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View accessibilityLiveRegion="polite" style={styles.stateBox}>
        <Ionicons name="cloud-offline-outline" size={30} color={tokens.colors.warning} />
        <Text style={styles.stateTitle}>Arkadaşlar yüklenemedi</Text>
        <Text style={styles.stateText}>Bağlantını kontrol edip tekrar deneyebilirsin.</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.stateBox}>
      <Ionicons name="people-outline" size={30} color={tokens.colors.textMuted} />
      <Text style={styles.stateTitle}>Henüz arkadaşın yok.</Text>
      <Text style={styles.stateText}>Şirket Ara üzerinden oyuncuları bulabilirsin.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/company-search')} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
        <Text style={styles.retryText}>Şirket Ara</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    topRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, opacity: 0.5 },
    safeArea: { flex: 1 },
    container: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: tokens.layout.pageGutter, paddingTop: tokens.layout.pageTop },
    header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    headerCopy: { flex: 1, minWidth: 0 },
    eyebrow: { ...tokens.type.eyebrow, color: colors.secondary, fontFamily: fonts.bodySemiBold, marginBottom: 2 },
    title: { ...tokens.type.display, color: colors.text, fontFamily: fonts.headingBold },
    listContent: { paddingBottom: tokens.layout.pageBottom },
    listContentEmpty: { flexGrow: 1 },
    separator: { height: 10 },
    stateBox: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
    stateTitle: { marginTop: 12, color: colors.text, fontFamily: fonts.headingBold, fontSize: 17, lineHeight: 23, textAlign: 'center' },
    stateText: { maxWidth: 380, marginTop: 5, color: colors.textMuted, fontFamily: fonts.body, fontSize: 14, lineHeight: 21, textAlign: 'center' },
    retryButton: { minHeight: 48, marginTop: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: radius.sm, backgroundColor: colors.primary },
    retryText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 14 },
    messageButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
    messageButtonText: { color: colors.primary, fontFamily: fonts.bodySemiBold, fontSize: 12 },
    pressed: { opacity: 0.72 },
  });
}
