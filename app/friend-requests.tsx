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
import {
  acceptFriendRequest,
  listIncomingRequests,
  rejectFriendRequest,
} from '../src/services/friends';
import { useAuth } from '../src/state/AuthContext';
import { useTheme } from '../src/state/ThemeContext';
import { fonts } from '../src/theme/typography';
import type { FriendConnection } from '../src/utils/friends';

type LoadStatus = 'loading' | 'ready' | 'error';

export default function FriendRequestsScreen() {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { user } = useAuth();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [requests, setRequests] = useState<FriendConnection[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [actingIds, setActingIds] = useState<Set<string>>(() => new Set());
  const [actionError, setActionError] = useState('');
  const requestIdRef = useRef(0);
  const actingIdsRef = useRef(new Set<string>());

  const loadRequests = useCallback(() => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    if (!user?.id) {
      setRequests([]);
      setStatus('error');
      return;
    }

    setStatus('loading');
    setActionError('');
    void listIncomingRequests(user.id)
      .then((connections) => {
        if (requestIdRef.current !== requestId) return;
        setRequests(connections);
        setStatus('ready');
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setRequests([]);
        setStatus('error');
      });
  }, [user?.id]);

  useFocusEffect(useCallback(() => {
    loadRequests();
    return () => { requestIdRef.current += 1; };
  }, [loadRequests]));

  const respond = useCallback(async (connection: FriendConnection, action: 'accept' | 'reject') => {
    const relationshipId = connection.relationship.id;
    if (actingIdsRef.current.has(relationshipId)) return;
    actingIdsRef.current.add(relationshipId);
    setActingIds((current) => new Set(current).add(relationshipId));
    setActionError('');
    try {
      if (action === 'accept') await acceptFriendRequest(relationshipId);
      else await rejectFriendRequest(relationshipId);
      setRequests((current) => current.filter((item) => item.relationship.id !== relationshipId));
    } catch {
      setActionError('İstek güncellenemedi. Tekrar deneyebilirsin.');
    } finally {
      actingIdsRef.current.delete(relationshipId);
      setActingIds((current) => {
        const next = new Set(current);
        next.delete(relationshipId);
        return next;
      });
    }
  }, []);

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
              <Text accessibilityRole="header" style={styles.title}>Gelen İstekler</Text>
            </View>
          </View>

          {actionError ? (
            <View accessibilityLiveRegion="polite" style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={19} color={tokens.colors.danger} />
              <Text style={styles.errorText}>{actionError}</Text>
            </View>
          ) : null}

          <FlatList
            contentContainerStyle={[styles.listContent, requests.length === 0 && styles.listContentEmpty]}
            data={requests}
            keyExtractor={(connection) => connection.relationship.id}
            renderItem={({ item }) => {
              const isActing = actingIds.has(item.relationship.id);
              return (
                <SocialProfileRow
                  profile={item.profile}
                  onOpen={item.profile
                    ? () => router.push({ pathname: '/public-profile/[userId]', params: { userId: item.userId } })
                    : undefined}
                  actions={(
                    <>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${item.profile?.companyName ?? 'Oyuncu'} arkadaşlık isteğini kabul et`}
                        accessibilityState={{ disabled: isActing }}
                        disabled={isActing}
                        onPress={() => void respond(item, 'accept')}
                        style={({ pressed }) => [styles.acceptButton, isActing && styles.disabled, pressed && styles.pressed]}
                      >
                        <Text style={styles.acceptText}>{isActing ? 'İşleniyor...' : 'Kabul Et'}</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${item.profile?.companyName ?? 'Oyuncu'} arkadaşlık isteğini reddet`}
                        accessibilityState={{ disabled: isActing }}
                        disabled={isActing}
                        onPress={() => void respond(item, 'reject')}
                        style={({ pressed }) => [styles.rejectButton, isActing && styles.disabled, pressed && styles.pressed]}
                      >
                        <Text style={styles.rejectText}>Reddet</Text>
                      </Pressable>
                    </>
                  )}
                />
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={(
              <RequestsState status={status} onRetry={loadRequests} styles={styles} tokens={tokens} />
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function RequestsState({ status, onRetry, styles, tokens }: {
  status: LoadStatus;
  onRetry: () => void;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  if (status === 'loading') {
    return (
      <View accessibilityLiveRegion="polite" style={styles.stateBox}>
        <ActivityIndicator color={tokens.colors.secondary} />
        <Text style={styles.stateTitle}>İstekler yükleniyor</Text>
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View accessibilityLiveRegion="polite" style={styles.stateBox}>
        <Ionicons name="cloud-offline-outline" size={30} color={tokens.colors.warning} />
        <Text style={styles.stateTitle}>İstekler yüklenemedi</Text>
        <Text style={styles.stateText}>Bağlantını kontrol edip tekrar deneyebilirsin.</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.stateBox}>
      <Ionicons name="mail-open-outline" size={30} color={tokens.colors.textMuted} />
      <Text style={styles.stateTitle}>Bekleyen isteğin yok.</Text>
      <Text style={styles.stateText}>Yeni istekler burada görünür.</Text>
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
    errorBanner: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.sm, backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger },
    errorText: { flex: 1, color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 18 },
    listContent: { paddingBottom: tokens.layout.pageBottom },
    listContentEmpty: { flexGrow: 1 },
    separator: { height: 10 },
    acceptButton: { flex: 1, minWidth: 128, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: colors.primary },
    acceptText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
    rejectButton: { flex: 1, minWidth: 112, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger },
    rejectText: { color: colors.danger, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
    disabled: { opacity: 0.48 },
    stateBox: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
    stateTitle: { marginTop: 12, color: colors.text, fontFamily: fonts.headingBold, fontSize: 17, lineHeight: 23, textAlign: 'center' },
    stateText: { maxWidth: 380, marginTop: 5, color: colors.textMuted, fontFamily: fonts.body, fontSize: 14, lineHeight: 21, textAlign: 'center' },
    retryButton: { minHeight: 48, marginTop: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: radius.sm, backgroundColor: colors.primary },
    retryText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 14 },
    pressed: { opacity: 0.72 },
  });
}
