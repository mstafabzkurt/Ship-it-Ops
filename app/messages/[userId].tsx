import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CosmeticPreview from '../../src/components/cosmetics/CosmeticPreview';
import { getDashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import ChatDuelPanel from '../../src/components/messaging/ChatDuelPanel';
import ChatThemeSheet from '../../src/components/messaging/ChatThemeSheet';
import ChatWallpaper from '../../src/components/messaging/ChatWallpaper';
import DirectMessageText from '../../src/components/messaging/DirectMessageText';
import DirectQuestionCard from '../../src/components/messaging/DirectQuestionCard';
import ReportUserSheet from '../../src/components/messaging/ReportUserSheet';
import { useChatTheme } from '../../src/components/messaging/useChatTheme';
import { getCosmeticById, type AvatarCosmetic, type AvatarFrameCosmetic } from '../../src/config/cosmetics';
import {
  blockDirectMessageUser,
  getDirectConversationContext,
  listDirectMessages,
  markConversationRead,
  openDirectConversation,
  reportDirectMessageUser,
  sendDirectMessage,
  subscribeToDirectMessages,
  unblockDirectMessageUser,
} from '../../src/services/directMessaging';
import { fetchPublicProfile } from '../../src/services/publicProfile';
import { useAuth } from '../../src/state/AuthContext';
import { useMessagingUnread } from '../../src/state/MessagingUnreadContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';
import { getChatThemePalette, type ChatThemePalette } from '../../src/utils/chatThemes';
import { getComposerEnterAction, runDirectMessageSendOnce } from '../../src/utils/directMessageComposer';
import {
  getDirectMessageCursor,
  mergeDirectMessageEntries,
  type DirectConversationContext,
  type DirectMessageEntry,
  type UserReportReason,
} from '../../src/utils/directMessaging';
import type { PublicProfile } from '../../src/utils/publicProfile';

type LoadStatus = 'loading' | 'ready' | 'error';
const PAGE_SIZE = 40;

export default function DirectConversationScreen() {
  const params = useLocalSearchParams<{ userId?: string | string[] }>();
  const targetUserId = firstParam(params.userId) ?? '';
  const { user } = useAuth();
  const { refreshUnread } = useMessagingUnread();
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const { preset: chatTheme, ready: chatThemeReady, saveTheme } = useChatTheme(user?.id ?? '', targetUserId);
  const chatPalette = useMemo(() => getChatThemePalette(chatTheme, tokens.colors), [chatTheme, tokens.colors]);
  const styles = useMemo(() => makeStyles(tokens, chatPalette), [tokens, chatPalette]);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [context, setContext] = useState<DirectConversationContext | null>(null);
  const [messages, setMessages] = useState<DirectMessageEntry[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [body, setBody] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [sendFocused, setSendFocused] = useState(false);
  const [focusedControl, setFocusedControl] = useState<string | null>(null);
  const [sendPending, setSendPending] = useState(false);
  const [olderPending, setOlderPending] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [actionError, setActionError] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [themeVisible, setThemeVisible] = useState(false);
  const [safetyPending, setSafetyPending] = useState(false);
  const requestIdRef = useRef(0);
  const listRef = useRef<FlatList<DirectMessageEntry>>(null);
  const shouldScrollToEndRef = useRef(false);
  const nearBottomRef = useRef(true);
  const bodyRef = useRef('');
  const sendInFlightRef = useRef(false);
  const menuButtonRef = useRef<View>(null);

  const markReadAndRefresh = useCallback(async (conversationId: string) => {
    try {
      if (await markConversationRead(conversationId)) await refreshUnread();
    } catch {
      // Message history remains readable; the next focus/Realtime sync retries.
    }
  }, [refreshUnread]);

  const load = useCallback(() => {
    const requestId = ++requestIdRef.current;
    shouldScrollToEndRef.current = false;
    nearBottomRef.current = true;
    setStatus('loading');
    setActionError('');
    void Promise.allSettled([
      fetchPublicProfile(targetUserId),
      openDirectConversation(targetUserId),
    ]).then(async ([profileResult, contextResult]) => {
      if (requestId !== requestIdRef.current) return;
      if (contextResult.status === 'rejected') {
        setStatus('error');
        return;
      }
      const nextContext = contextResult.value;
      setProfile(profileResult.status === 'fulfilled' ? profileResult.value : null);
      setContext(nextContext);
      if (!nextContext.conversationId) {
        setMessages([]);
        setHasOlder(false);
        setStatus('ready');
        return;
      }
      try {
        const initial = await listDirectMessages(nextContext.conversationId, null, PAGE_SIZE);
        if (requestId !== requestIdRef.current) return;
        // Arm before rendering the page: its first content-size event positions the list.
        shouldScrollToEndRef.current = initial.length > 0;
        setMessages(initial);
        setHasOlder(initial.length === PAGE_SIZE);
        setStatus('ready');
        void markReadAndRefresh(nextContext.conversationId);
      } catch {
        if (requestId === requestIdRef.current) setStatus('error');
      }
    });
  }, [markReadAndRefresh, targetUserId]);

  useFocusEffect(useCallback(() => {
    load();
    return () => { requestIdRef.current += 1; };
  }, [load]));

  useFocusEffect(useCallback(() => {
    const conversationId = context?.conversationId;
    if (!conversationId || status !== 'ready') return undefined;
    return subscribeToDirectMessages(conversationId, (entry) => {
      shouldScrollToEndRef.current = nearBottomRef.current;
      setMessages((current) => mergeDirectMessageEntries(current, [entry]));
      if (entry.message.senderId !== user?.id) {
        void markReadAndRefresh(conversationId);
      }
    });
  }, [context?.conversationId, markReadAndRefresh, status, user?.id]));

  const refreshContext = useCallback(async () => {
    const next = await getDirectConversationContext(targetUserId);
    setContext(next);
  }, [targetUserId]);

  const send = useCallback(async () => {
    const submittedBody = bodyRef.current;
    const trimmed = submittedBody.trim();
    if (!context?.canSend || !trimmed) return;
    await runDirectMessageSendOnce(sendInFlightRef, async () => {
      setSendPending(true);
      setActionError('');
      try {
        const entry = await sendDirectMessage(targetUserId, trimmed);
        shouldScrollToEndRef.current = true;
        setMessages((current) => mergeDirectMessageEntries(current, [entry]));
        if (bodyRef.current === submittedBody) {
          bodyRef.current = '';
          setBody('');
        }
        if (!context.conversationId) await refreshContext();
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Mesaj gönderilemedi.');
        await refreshContext().catch(() => undefined);
      } finally {
        setSendPending(false);
      }
    });
  }, [context?.canSend, context?.conversationId, refreshContext, targetUserId]);

  const loadOlder = useCallback(async () => {
    const conversationId = context?.conversationId;
    const first = messages[0]?.message;
    if (!conversationId || !first || olderPending || !hasOlder) return;
    shouldScrollToEndRef.current = false;
    setOlderPending(true);
    setActionError('');
    try {
      const older = await listDirectMessages(conversationId, getDirectMessageCursor(first), PAGE_SIZE);
      setMessages((current) => mergeDirectMessageEntries(current, older));
      setHasOlder(older.length === PAGE_SIZE);
    } catch {
      setActionError('Eski mesajlar yüklenemedi. Tekrar deneyebilirsin.');
    } finally {
      setOlderPending(false);
    }
  }, [context?.conversationId, hasOlder, messages, olderPending]);

  const toggleBlock = useCallback(async () => {
    if (safetyPending || !context) return;
    if (!context.blockedByViewer) {
      const confirmed = await confirmBlock(profile?.companyName ?? 'bu kullanıcı');
      if (!confirmed) return;
    }
    setSafetyPending(true);
    setActionError('');
    try {
      if (context.blockedByViewer) await unblockDirectMessageUser(targetUserId);
      else await blockDirectMessageUser(targetUserId);
      await refreshContext();
      setMenuVisible(false);
    } catch {
      setActionError('Güvenlik işlemi tamamlanamadı. Tekrar deneyebilirsin.');
    } finally {
      setSafetyPending(false);
    }
  }, [context, profile?.companyName, refreshContext, safetyPending, targetUserId]);

  const submitReport = useCallback(async (reason: UserReportReason, details: string) => {
    await reportDirectMessageUser({
      targetUserId,
      reason,
      details,
      conversationId: context?.conversationId,
    });
  }, [context?.conversationId, targetUserId]);

  const companyName = profile?.companyName ?? 'Oyuncu';
  const composerMessage = getComposerStatus(context);

  return (
    <View style={styles.background}>
      <View pointerEvents="none" style={styles.topRule} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Mesajlara dön" hitSlop={8} onFocus={() => setFocusedControl('back')} onBlur={() => setFocusedControl(null)} onPress={() => (router.canGoBack() ? router.back() : router.replace('/messages'))} style={({ pressed }) => [styles.headerButton, focusedControl === 'back' && styles.controlFocused, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={22} color={tokens.colors.text} />
          </Pressable>
          <Pressable
            accessibilityRole={profile ? 'button' : undefined}
            accessibilityLabel={profile ? `${companyName} profilini aç` : companyName}
            disabled={!profile}
            onFocus={() => setFocusedControl('profile')}
            onBlur={() => setFocusedControl(null)}
            onPress={() => router.push({ pathname: '/public-profile/[userId]', params: { userId: targetUserId } })}
            style={({ pressed }) => [styles.identity, focusedControl === 'profile' && styles.controlFocused, pressed && styles.pressed]}
          >
            <HeaderAvatar profile={profile} styles={styles} tokens={tokens} />
            <View style={styles.identityCopy}>
              <Text numberOfLines={1} style={styles.companyName}>{companyName}</Text>
              <Text numberOfLines={1} style={styles.rank}>{profile?.careerRank ?? 'Doğrudan Mesaj'}</Text>
            </View>
          </Pressable>
          <Pressable ref={menuButtonRef} accessibilityRole="button" accessibilityLabel="Konuşma seçeneklerini aç" accessibilityState={{ expanded: menuVisible }} onFocus={() => setFocusedControl('menu')} onBlur={() => setFocusedControl(null)} onPress={() => setMenuVisible((current) => !current)} style={({ pressed }) => [styles.headerButton, focusedControl === 'menu' && styles.controlFocused, pressed && styles.pressed]}>
            <Ionicons name="ellipsis-horizontal" size={23} color={tokens.colors.text} />
          </Pressable>
        </View>

        {menuVisible ? (
          <View style={styles.menu}>
            <Pressable accessibilityRole="button" accessibilityLabel="Sohbet Teması" accessibilityState={{ disabled: !chatThemeReady }} disabled={!chatThemeReady} onFocus={() => setFocusedControl('theme')} onBlur={() => setFocusedControl(null)} onPress={() => { setMenuVisible(false); setThemeVisible(true); }} style={({ pressed }) => [styles.menuAction, focusedControl === 'theme' && styles.controlFocused, pressed && styles.pressed]}>
              <Ionicons name="color-palette-outline" size={19} color={tokens.colors.secondary} accessible={false} />
              <Text style={styles.menuText}>Sohbet Teması</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: safetyPending }} disabled={safetyPending} onFocus={() => setFocusedControl('block')} onBlur={() => setFocusedControl(null)} onPress={() => void toggleBlock()} style={({ pressed }) => [styles.menuAction, focusedControl === 'block' && styles.controlFocused, pressed && styles.pressed]}>
              <Ionicons name={context?.blockedByViewer ? 'lock-open-outline' : 'ban-outline'} size={19} color={context?.blockedByViewer ? tokens.colors.success : tokens.colors.danger} />
              <Text style={styles.menuText}>{context?.blockedByViewer ? 'Engeli Kaldır' : 'Kullanıcıyı Engelle'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onFocus={() => setFocusedControl('report')} onBlur={() => setFocusedControl(null)} onPress={() => { setMenuVisible(false); setReportVisible(true); }} style={({ pressed }) => [styles.menuAction, focusedControl === 'report' && styles.controlFocused, pressed && styles.pressed]}>
              <Ionicons name="flag-outline" size={19} color={tokens.colors.warning} />
              <Text style={styles.menuText}>Şikayet Et</Text>
            </Pressable>
          </View>
        ) : null}

        {status === 'ready' ? <ChatDuelPanel opponentId={targetUserId} disabled={!context?.canSend} /> : null}
        <KeyboardAvoidingView style={styles.keyboardArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
          <View testID="conversation-canvas" style={styles.conversationCanvas}>
          <ChatWallpaper preset={chatTheme} palette={chatPalette} />
          {status === 'loading' ? (
            <View style={styles.state}><ActivityIndicator color={tokens.colors.secondary} /><Text style={styles.stateTitle}>Konuşma yükleniyor</Text></View>
          ) : status === 'error' ? (
            <View style={styles.state}><Ionicons name="cloud-offline-outline" size={31} color={tokens.colors.warning} /><Text style={styles.stateTitle}>Konuşma yüklenemedi</Text><Pressable accessibilityRole="button" onPress={load} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}><Text style={styles.retryText}>Tekrar Dene</Text></Pressable></View>
          ) : (
            <FlatList
              ref={listRef}
              contentContainerStyle={[styles.messageList, messages.length === 0 && styles.messageListEmpty]}
              data={messages}
              initialNumToRender={PAGE_SIZE}
              keyExtractor={(entry) => entry.message.id}
              renderItem={({ item }) => (
                <MessageRow
                  currentUserId={user?.id ?? ''}
                  entry={item}
                  onOpenQuestion={() => item.message.questionId && router.push({ pathname: '/question-detail/[questionId]', params: { questionId: item.message.questionId, source: 'message', userId: targetUserId } })}
                  styles={styles}
                  tokens={tokens}
                  chatPalette={chatPalette}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.messageGap} />}
              ListHeaderComponent={hasOlder ? (
                <Pressable accessibilityRole="button" accessibilityState={{ disabled: olderPending }} disabled={olderPending} onPress={() => void loadOlder()} style={({ pressed }) => [styles.olderButton, pressed && styles.pressed]}>
                  {olderPending ? <ActivityIndicator size="small" color={tokens.colors.secondary} /> : <Text style={styles.olderText}>Daha Eski Mesajları Yükle</Text>}
                </Pressable>
              ) : null}
              ListEmptyComponent={<View style={styles.emptyChat}><Ionicons name="chatbubble-ellipses-outline" size={30} color={tokens.colors.textMuted} /><Text style={styles.emptyTitle}>Konuşma kanalı hazır.</Text><Text style={styles.emptyText}>İlk mesaj yalnızca kabul edilmiş arkadaşlar arasında gönderilebilir.</Text></View>}
              onContentSizeChange={() => {
                if (!shouldScrollToEndRef.current) return;
                shouldScrollToEndRef.current = false;
                listRef.current?.scrollToEnd({ animated: false });
              }}
              onScroll={(event) => {
                const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                nearBottomRef.current = contentSize.height - layoutMeasurement.height - contentOffset.y < 80;
              }}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
            />
          )}
          </View>

          {status === 'ready' ? (
            <View style={styles.composerShell}>
              {composerMessage ? (
                <View style={styles.composerNotice}>
                  <Ionicons name="information-circle-outline" size={17} color={tokens.colors.textSecondary} />
                  <Text accessibilityLiveRegion="polite" style={styles.composerStatus}>{composerMessage}</Text>
                </View>
              ) : null}
              {actionError ? <Text accessibilityLiveRegion="polite" style={styles.actionError}>{actionError}</Text> : null}
              <View style={styles.composer}>
                <TextInput
                  accessibilityLabel="Mesaj"
                  editable={Boolean(context?.canSend) && !sendPending}
                  maxLength={1000}
                  multiline
                  submitBehavior={Platform.OS === 'web' ? undefined : 'newline'}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onChangeText={(nextBody) => { bodyRef.current = nextBody; setBody(nextBody); }}
                  onKeyPress={Platform.OS === 'web' ? (event) => {
                    const webKey = event.nativeEvent as typeof event.nativeEvent & {
                      shiftKey?: boolean;
                      isComposing?: boolean;
                      keyCode?: number;
                    };
                    const action = getComposerEnterAction({
                      isWeb: Platform.OS === 'web',
                      key: webKey.key,
                      shiftKey: webKey.shiftKey,
                      isComposing: webKey.isComposing,
                      keyCode: webKey.keyCode,
                      body: bodyRef.current,
                      canSend: Boolean(context?.canSend),
                      inFlight: sendInFlightRef.current,
                    });
                    if (action === 'native') return;
                    event.preventDefault();
                    if (action === 'send') void send();
                  } : undefined}
                  placeholder={context?.canSend ? 'Mesaj yaz…' : 'Mesaj gönderilemez'}
                  placeholderTextColor={tokens.colors.textMuted}
                  style={[styles.input, !context?.canSend && styles.inputDisabled, inputFocused && context?.canSend && styles.inputFocused]}
                  textAlignVertical="center"
                  value={body}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mesajı gönder"
                  accessibilityState={{ disabled: !context?.canSend || !body.trim() || sendPending }}
                  disabled={!context?.canSend || !body.trim() || sendPending}
                  onFocus={() => setSendFocused(true)}
                  onBlur={() => setSendFocused(false)}
                  onPress={() => void send()}
                  style={({ pressed }) => [styles.sendButton, (!context?.canSend || !body.trim() || sendPending) && styles.sendDisabled, sendFocused && styles.controlFocused, pressed && styles.pressed]}
                >
                  {sendPending ? <ActivityIndicator size="small" color={tokens.colors.foregroundOnAction} /> : <Ionicons name="send" size={20} color={!context?.canSend || !body.trim() ? tokens.colors.disabledForeground : tokens.colors.foregroundOnAction} />}
                </Pressable>
              </View>
              {body.length >= 850 ? <Text style={styles.characterCount}>{body.length}/1000</Text> : null}
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
      <ReportUserSheet visible={reportVisible} companyName={companyName} onClose={() => setReportVisible(false)} onSubmit={submitReport} />
      <ChatThemeSheet key={`${user?.id}:${targetUserId}`} visible={themeVisible} selectedId={chatTheme.id} onClose={() => setThemeVisible(false)} onSave={saveTheme} returnFocusRef={menuButtonRef} />
    </View>
  );
}
function HeaderAvatar({ profile, styles, tokens }: {
  profile: PublicProfile | null;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  const avatar = profile ? getCosmeticById(profile.avatarId) as AvatarCosmetic : null;
  const frame = profile ? getCosmeticById(profile.avatarFrameId) as AvatarFrameCosmetic : null;
  return profile && avatar && frame
    ? <CosmeticPreview avatar={avatar} frame={frame} mode="equippedCombo" size={44} accessibilityLabel={`${profile.companyName} avatarı`} />
    : <View style={styles.avatarFallback}><Ionicons name="person-outline" size={20} color={tokens.colors.textMuted} /></View>;
}

function MessageRow({ currentUserId, entry, onOpenQuestion, styles, tokens, chatPalette }: {
  currentUserId: string;
  entry: DirectMessageEntry;
  onOpenQuestion: () => void;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
  chatPalette: ChatThemePalette;
}) {
  const own = entry.message.senderId === currentUserId;
  return (
    <View style={[styles.messageLane, own ? styles.messageLaneOwn : styles.messageLaneOther]}>
      <View style={[styles.messageSurface, own ? styles.messageOwn : styles.messageOther, entry.message.messageType === 'question_share' && styles.questionMessageSurface]}>
        {entry.message.messageType === 'text' ? (
          <DirectMessageText body={entry.message.body ?? ''} linkColor={chatPalette.link} style={[styles.messageBody, Platform.OS === 'web' && ({ wordBreak: 'break-word' } as TextStyle)]} />
        ) : (
          <DirectQuestionCard question={entry.question} onOpen={onOpenQuestion} />
        )}
        <Text style={[styles.messageTime, own && styles.messageTimeOwn]}>{formatMessageTime(entry.message.createdAt)}</Text>
      </View>
      <Text style={styles.messageSideLabel}>{own ? 'SEN' : 'ARKADAŞ'}</Text>
    </View>
  );
}

function getComposerStatus(context: DirectConversationContext | null): string {
  if (!context) return '';
  if (context.blockedByViewer) return 'Bu kullanıcı engellendi.';
  if (!context.isFriend) return 'Artık arkadaş değilsiniz. Yeni mesaj gönderemezsin.';
  if (!context.canSend) return 'Bu kullanıcıyla şu anda mesajlaşamazsın.';
  return '';
}

function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function confirmBlock(companyName: string): Promise<boolean> {
  const message = `${companyName} ile iki yönde de yeni mesajlaşma duracak. Geçmiş konuşma korunacak.`;
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(message));
  return new Promise((resolve) => {
    Alert.alert('Kullanıcıyı Engelle', message, [
      { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Engelle', style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>, chatPalette: ChatThemePalette) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    topRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, opacity: 0.5 },
    safeArea: { flex: 1 },
    header: { width: '100%', maxWidth: Platform.OS === 'web' ? undefined : 820, alignSelf: 'center', minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: tokens.layout.pageGutter, paddingTop: tokens.layout.pageTop, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.dividerSubtle },
    headerButton: { width: 48, height: 48, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    identity: { flex: 1, minWidth: 0, minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 5, borderRadius: radius.sm },
    avatarFallback: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.borderSubtle },
    identityCopy: { flex: 1, minWidth: 0 },
    companyName: { color: colors.text, fontFamily: fonts.headingBold, fontSize: 15, lineHeight: 20 },
    rank: { marginTop: 1, color: colors.primary, fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 15 },
    menu: { position: 'absolute', zIndex: 20, top: tokens.layout.isCompact ? 72 : 84, right: tokens.layout.pageGutter, width: 220, padding: 6, borderRadius: radius.md, backgroundColor: colors.floatingSurfaceRaised, borderWidth: 1, borderColor: colors.borderStrong, ...shadow.raised },
    menuAction: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11, borderRadius: radius.sm },
    menuText: { flex: 1, color: colors.text, fontFamily: fonts.bodySemiBold, fontSize: 13 },
    keyboardArea: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? undefined : 820, alignSelf: 'center' },
    conversationCanvas: { flex: 1, overflow: 'hidden', backgroundColor: chatPalette.canvas },
    messageList: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: tokens.layout.pageGutter, paddingTop: 14, paddingBottom: 18 },
    messageListEmpty: { justifyContent: 'center' },
    messageGap: { height: 12 },
    olderButton: { minHeight: 44, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginBottom: 14, borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    olderText: { color: colors.secondary, fontFamily: fonts.bodySemiBold, fontSize: 12 },
    messageLane: { width: '100%' },
    messageLaneOwn: { alignItems: 'flex-end' },
    messageLaneOther: { alignItems: 'flex-start' },
    messageSurface: { maxWidth: tokens.layout.isCompact ? '88%' : 680, minWidth: 88, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1 },
    messageOwn: { backgroundColor: chatPalette.own, borderColor: chatPalette.border },
    messageOther: { backgroundColor: chatPalette.other, borderColor: chatPalette.border },
    questionMessageSurface: { width: tokens.layout.isCompact ? '88%' : '74%', paddingHorizontal: 0, paddingVertical: 0, backgroundColor: 'transparent', borderWidth: 0 },
    messageBody: { minWidth: 0, flexShrink: 1, color: chatPalette.text, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
    messageTime: { marginTop: 6, color: chatPalette.muted, backgroundColor: chatPalette.labelBackground, alignSelf: 'flex-start', paddingHorizontal: 4, borderRadius: 3, fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 15, textAlign: 'left' },
    messageTimeOwn: { textAlign: 'right', alignSelf: 'flex-end' },
    messageSideLabel: { marginTop: 3, paddingHorizontal: 4, color: chatPalette.muted, backgroundColor: chatPalette.labelBackground, borderRadius: 3, fontFamily: fonts.monoSemiBold, fontSize: 9, lineHeight: 14, letterSpacing: 0.35 },
    emptyChat: { alignItems: 'center', alignSelf: 'center', padding: 24, borderRadius: radius.sm, backgroundColor: colors.surface },
    emptyTitle: { marginTop: 10, color: colors.text, fontFamily: fonts.headingBold, fontSize: 16, lineHeight: 22, textAlign: 'center' },
    emptyText: { maxWidth: 360, marginTop: 5, color: colors.textMuted, fontFamily: fonts.body, fontSize: 13, lineHeight: 20, textAlign: 'center' },
    composerShell: { paddingHorizontal: tokens.layout.pageGutter, paddingTop: 10, paddingBottom: tokens.layout.isCompact ? 8 : 12, backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.dividerSubtle },
    composerNotice: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    composerStatus: { flex: 1, minWidth: 0, color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 18 },
    actionError: { marginBottom: 7, color: colors.danger, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 18, textAlign: 'center' },
    composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    input: { flex: 1, minWidth: 0, minHeight: 48, maxHeight: 132, color: colors.text, fontFamily: fonts.body, fontSize: 16, lineHeight: 22, paddingHorizontal: 13, paddingVertical: 11, borderRadius: radius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle },
    inputFocused: { borderColor: colors.primary, outlineColor: colors.primary, outlineStyle: 'solid', outlineWidth: 2 },
    inputDisabled: { backgroundColor: colors.disabledBackground, borderColor: colors.disabledBorder, color: colors.disabledForeground },
    sendButton: { width: 48, height: 48, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.primary },
    sendDisabled: { backgroundColor: colors.disabledBackground, borderWidth: 1, borderColor: colors.disabledBorder },
    controlFocused: { outlineColor: colors.primary, outlineStyle: 'solid', outlineWidth: 2 },
    characterCount: { marginTop: 4, color: colors.textMuted, fontFamily: fonts.monoMedium, fontSize: 9, textAlign: 'right' },
    state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: colors.canvas },
    stateTitle: { marginTop: 11, color: colors.text, fontFamily: fonts.headingBold, fontSize: 17, lineHeight: 23, textAlign: 'center' },
    retryButton: { minHeight: 48, marginTop: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: radius.sm, backgroundColor: colors.primary },
    retryText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 13 },
    pressed: { opacity: 0.72, backgroundColor: colors.surfacePressed },
  });
}
