import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import CosmeticPreview from '../../src/components/cosmetics/CosmeticPreview';
import { getDashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import { getCosmeticById, type AvatarCosmetic, type AvatarFrameCosmetic } from '../../src/config/cosmetics';
import { listDirectConversations } from '../../src/services/directMessaging';
import { useAuth } from '../../src/state/AuthContext';
import { useMessagingUnread } from '../../src/state/MessagingUnreadContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';
import { getDirectMessagePreview, uniqueDirectConversationSummaries, type DirectConversationSummary } from '../../src/utils/directMessaging';

type LoadStatus = 'loading' | 'ready' | 'error';

export default function MessagesScreen() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { incomingMessageVersion } = useMessagingUnread();
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [conversations, setConversations] = useState<DirectConversationSummary[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [backFocused, setBackFocused] = useState(false);
  const requestIdRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(null);
  const lastUserIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const focusedRef = useRef(false);
  const incomingVersionRef = useRef(incomingMessageVersion);
  const handledIncomingVersionRef = useRef(incomingMessageVersion);
  incomingVersionRef.current = incomingMessageVersion;

  const load = useCallback((background = false) => {
    if (!userId || activeUserIdRef.current !== userId) return;
    const requestId = ++requestIdRef.current;
    if (!background) setStatus('loading');
    void listDirectConversations()
      .then((result) => {
        if (requestId !== requestIdRef.current || activeUserIdRef.current !== userId) return;
        setConversations(uniqueDirectConversationSummaries(result));
        hasLoadedRef.current = true;
        setStatus('ready');
      })
      .catch(() => {
        if (requestId !== requestIdRef.current || activeUserIdRef.current !== userId) return;
        if (!background || !hasLoadedRef.current) {
          hasLoadedRef.current = false;
          setConversations([]);
          setStatus('error');
        } else {
          // A failed background fetch leaves the last successful list visible.
          setStatus('ready');
        }
      });
  }, [userId]);

  useFocusEffect(useCallback(() => {
    if (lastUserIdRef.current !== userId) {
      lastUserIdRef.current = userId;
      hasLoadedRef.current = false;
      setConversations([]);
      setStatus('loading');
    }
    activeUserIdRef.current = userId;
    focusedRef.current = true;
    handledIncomingVersionRef.current = incomingVersionRef.current;
    load();
    return () => {
      focusedRef.current = false;
      activeUserIdRef.current = null;
      requestIdRef.current += 1;
    };
  }, [load, userId]));

  useEffect(() => {
    if (!focusedRef.current || handledIncomingVersionRef.current === incomingMessageVersion) return;
    handledIncomingVersionRef.current = incomingMessageVersion;
    load(true);
  }, [incomingMessageVersion, load]);

  return (
    <View style={styles.background}>
      <View pointerEvents="none" style={styles.topRule} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Profile dön" hitSlop={8} onFocus={() => setBackFocused(true)} onBlur={() => setBackFocused(false)} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} style={({ pressed }) => [styles.backButton, backFocused && styles.rowFocused, pressed && styles.pressed]}>
              <Ionicons name="arrow-back" size={22} color={tokens.colors.text} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>GÜVENLİ BAĞLANTI</Text>
              <Text accessibilityRole="header" style={styles.title}>Mesajlar</Text>
            </View>
          </View>

          <FlatList
            contentContainerStyle={[styles.listContent, conversations.length === 0 && styles.listContentEmpty]}
            data={conversations}
            keyExtractor={(conversation) => conversation.conversationId}
            renderItem={({ item }) => (
              <ConversationRow
                conversation={item}
                currentUserId={userId ?? ''}
                onOpen={() => router.push({ pathname: '/messages/[userId]', params: { userId: item.otherUserId } })}
                styles={styles}
                tokens={tokens}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={<MessagesState status={status} onRetry={() => load()} styles={styles} tokens={tokens} />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
function ConversationRow({ conversation, currentUserId, onOpen, styles, tokens }: {
  conversation: DirectConversationSummary;
  currentUserId: string;
  onOpen: () => void;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const profile = conversation.profile;
  const avatar = profile ? getCosmeticById(profile.avatarId) as AvatarCosmetic : null;
  const frame = profile ? getCosmeticById(profile.avatarFrameId) as AvatarFrameCosmetic : null;
  const preview = getDirectMessagePreview(conversation.lastMessage, currentUserId);
  const timestamp = formatConversationTime(conversation.lastMessage?.createdAt ?? conversation.updatedAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${profile?.companyName ?? 'Oyuncu'} ile konuşmayı aç${conversation.unreadCount ? `, ${conversation.unreadCount} okunmamış mesaj` : ''}`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onOpen}
      style={({ pressed }) => [styles.row, conversation.unreadCount > 0 && styles.rowUnread, hovered && styles.rowHovered, focused && styles.rowFocused, pressed && styles.pressed]}
    >
      {profile && avatar && frame ? (
        <CosmeticPreview avatar={avatar} frame={frame} mode="equippedCombo" size={tokens.layout.isNarrow ? 46 : 50} accessibilityLabel={`${profile.companyName} avatarı`} />
      ) : (
        <View style={styles.avatarFallback}><Ionicons name="person-outline" size={22} color={tokens.colors.textMuted} /></View>
      )}
      <View style={styles.rowCopy}>
        <View style={styles.rowTitleLine}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.companyName}>{profile?.companyName ?? 'Oyuncu'}</Text>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.rank}>{profile?.careerRank ?? 'Profil kullanılamıyor'}</Text>
        <Text numberOfLines={2} style={[styles.preview, conversation.unreadCount > 0 && styles.previewUnread]}>{preview}</Text>
      </View>
      {conversation.unreadCount > 0 ? (
        <View style={styles.badge}><Text style={styles.badgeText}>{Math.min(99, conversation.unreadCount)}</Text></View>
      ) : (
        <Ionicons name="chevron-forward" size={19} color={tokens.colors.textMuted} />
      )}
    </Pressable>
  );
}

function MessagesState({ status, onRetry, styles, tokens }: {
  status: LoadStatus;
  onRetry: () => void;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  if (status === 'loading') return <View style={styles.state}><ActivityIndicator color={tokens.colors.secondary} /><Text style={styles.stateTitle}>Mesajlar yükleniyor</Text></View>;
  if (status === 'error') return (
    <View style={styles.state}>
      <Ionicons name="cloud-offline-outline" size={31} color={tokens.colors.warning} />
      <Text style={styles.stateTitle}>Mesajlar yüklenemedi</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}><Text style={styles.retryText}>Tekrar Dene</Text></Pressable>
    </View>
  );
  return (
    <View style={styles.state}>
      <Ionicons name="chatbubbles-outline" size={32} color={tokens.colors.textMuted} />
      <Text style={styles.stateTitle}>Henüz mesajın yok.</Text>
      <Text style={styles.stateText}>Arkadaşlarınla sohbet başlatabilirsin.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/friends')} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}><Text style={styles.retryText}>Arkadaşlara Git</Text></Pressable>
    </View>
  );
}

function formatConversationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    topRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, opacity: 0.5 },
    safeArea: { flex: 1 },
    container: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: tokens.layout.pageGutter, paddingTop: tokens.layout.pageTop },
    header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    headerCopy: { flex: 1, minWidth: 0 },
    eyebrow: { ...tokens.type.eyebrow, color: colors.secondary, fontFamily: fonts.monoSemiBold },
    title: { ...tokens.type.display, color: colors.text, fontFamily: fonts.headingBold },
    listContent: { paddingBottom: tokens.layout.pageBottom },
    listContentEmpty: { flexGrow: 1 },
    separator: { height: 8 },
    row: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: tokens.layout.isNarrow ? 8 : 11, padding: tokens.layout.isNarrow ? 9 : 11, borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    rowUnread: { backgroundColor: colors.secondarySurfaceRaised, borderColor: colors.borderStrong, borderLeftWidth: 3, borderLeftColor: colors.primary },
    rowHovered: { backgroundColor: colors.surfaceHover },
    rowFocused: { borderColor: colors.primary, outlineColor: colors.primary, outlineStyle: 'solid', outlineWidth: 2 },
    avatarFallback: { width: tokens.layout.isNarrow ? 46 : 50, height: tokens.layout.isNarrow ? 46 : 50, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.borderSubtle },
    rowCopy: { flex: 1, minWidth: 0 },
    rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    companyName: { flex: 1, minWidth: 0, color: colors.text, fontFamily: fonts.headingBold, fontSize: 15, lineHeight: 20 },
    timestamp: { flexShrink: 0, color: colors.textMuted, fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 15 },
    rank: { marginTop: 1, color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 10, lineHeight: 15 },
    preview: { marginTop: 4, color: colors.textMuted, fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
    previewUnread: { color: colors.text, fontFamily: fonts.bodySemiBold },
    badge: { minWidth: 28, height: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, borderRadius: radius.pill, backgroundColor: colors.primary },
    badgeText: { color: colors.foregroundOnAction, fontFamily: fonts.monoBold, fontSize: 11 },
    state: { flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', padding: 24 },
    stateTitle: { marginTop: 11, color: colors.text, fontFamily: fonts.headingBold, fontSize: 17, lineHeight: 23, textAlign: 'center' },
    stateText: { marginTop: 5, color: colors.textMuted, fontFamily: fonts.body, fontSize: 14, lineHeight: 21, textAlign: 'center' },
    retryButton: { minHeight: 48, marginTop: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: radius.sm, backgroundColor: colors.primary },
    retryText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 13 },
    pressed: { opacity: 0.72, backgroundColor: colors.surfacePressed },
  });
}
