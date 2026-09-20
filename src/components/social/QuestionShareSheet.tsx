import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCosmeticById, type AvatarCosmetic, type AvatarFrameCosmetic } from '../../config/cosmetics';
import { listFriends } from '../../services/friends';
import { sendQuestionToDirectMessage } from '../../services/directMessaging';
import { shareQuestionWithFriend } from '../../services/questionSocial';
import { useAuth } from '../../state/AuthContext';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import type { FriendConnection } from '../../utils/friends';
import CosmeticPreview from '../cosmetics/CosmeticPreview';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface QuestionShareSheetProps {
  questionId: unknown;
  visible: boolean;
  onClose: () => void;
  onSent?: (companyName: string) => void;
  allowInboxDelivery?: boolean;
}

export default function QuestionShareSheet({ questionId, visible, onClose, onSent, allowInboxDelivery = false }: QuestionShareSheetProps) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [friends, setFriends] = useState<FriendConnection[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [sendingUserId, setSendingUserId] = useState<string | null>(null);
  const [sentCompanyName, setSentCompanyName] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'message' | 'inbox'>('message');
  const effectiveDeliveryMode = allowInboxDelivery ? deliveryMode : 'message';
  const sendLockRef = useRef(false);

  const loadFriends = useCallback(() => {
    if (!visible || !user?.id) return;
    setStatus('loading');
    setFriends([]);
    setSentCompanyName('');
    setDeliveryMode('message');
    void listFriends(user.id)
      .then((connections) => {
        setFriends(connections.filter((connection) => connection.profile));
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [user?.id, visible]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const handleSend = useCallback(async (connection: FriendConnection) => {
    if (!connection.profile || sendLockRef.current) return;
    sendLockRef.current = true;
    setSendingUserId(connection.userId);
    try {
      if (effectiveDeliveryMode === 'message') {
        await sendQuestionToDirectMessage(connection.userId, questionId);
      } else {
        await shareQuestionWithFriend(connection.userId, questionId);
      }
      setSentCompanyName(connection.profile.companyName);
      onSent?.(connection.profile.companyName);
    } catch {
      setStatus('error');
    } finally {
      setSendingUserId(null);
      sendLockRef.current = false;
    }
  }, [effectiveDeliveryMode, onSent, questionId]);

  const handleClose = useCallback(() => {
    if (sendingUserId) return;
    sendLockRef.current = false;
    setStatus('idle');
    setSentCompanyName('');
    onClose();
  }, [onClose, sendingUserId]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <SafeAreaView style={styles.scrim}>
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>SORU PAYLAŞIMI</Text>
              <Text accessibilityRole="header" style={styles.title}>Arkadaşa Gönder</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Paylaşım penceresini kapat"
              disabled={Boolean(sendingUserId)}
              onPress={handleClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={23} color={tokens.colors.text} />
            </Pressable>
          </View>

          {allowInboxDelivery && !sentCompanyName ? (
            <View accessibilityRole="radiogroup" style={styles.deliveryTabs}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: deliveryMode === 'message', disabled: Boolean(sendingUserId) }}
                disabled={Boolean(sendingUserId)}
                onPress={() => setDeliveryMode('message')}
                style={({ pressed }) => [styles.deliveryTab, deliveryMode === 'message' && styles.deliveryTabActive, pressed && styles.pressed]}
              >
                <Ionicons name="chatbubble-outline" size={17} color={deliveryMode === 'message' ? tokens.colors.primary : tokens.colors.textMuted} />
                <Text style={[styles.deliveryTabText, deliveryMode === 'message' && styles.deliveryTabTextActive]}>Mesajlara</Text>
              </Pressable>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: deliveryMode === 'inbox', disabled: Boolean(sendingUserId) }}
                disabled={Boolean(sendingUserId)}
                onPress={() => setDeliveryMode('inbox')}
                style={({ pressed }) => [styles.deliveryTab, deliveryMode === 'inbox' && styles.deliveryTabActive, pressed && styles.pressed]}
              >
                <Ionicons name="archive-outline" size={17} color={deliveryMode === 'inbox' ? tokens.colors.primary : tokens.colors.textMuted} />
                <Text style={[styles.deliveryTabText, deliveryMode === 'inbox' && styles.deliveryTabTextActive]}>Paylaşılanlara</Text>
              </Pressable>
            </View>
          ) : null}

          {sentCompanyName ? (
            <View accessibilityLiveRegion="polite" style={styles.successState}>
              <Ionicons name="checkmark-circle-outline" size={32} color={tokens.colors.success} />
              <Text style={styles.stateTitle}>Soru gönderildi</Text>
              <Text style={styles.stateText}>{effectiveDeliveryMode === 'message'
                ? `${sentCompanyName} soruyu mesajlarında görecek.`
                : `${sentCompanyName} soruyu Paylaşılan Sorular ekranında görecek.`}</Text>
              <Pressable accessibilityRole="button" onPress={handleClose} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Text style={styles.primaryButtonText}>Kapat</Text>
              </Pressable>
            </View>
          ) : status === 'loading' || status === 'idle' ? (
            <View accessibilityLiveRegion="polite" style={styles.stateBox}>
              <ActivityIndicator color={tokens.colors.secondary} />
              <Text style={styles.stateTitle}>Arkadaşlar yükleniyor</Text>
            </View>
          ) : status === 'error' ? (
            <View accessibilityLiveRegion="polite" style={styles.stateBox}>
              <Ionicons name="cloud-offline-outline" size={30} color={tokens.colors.warning} />
              <Text style={styles.stateTitle}>Paylaşım tamamlanamadı</Text>
              <Text style={styles.stateText}>Bağlantını kontrol edip tekrar deneyebilirsin.</Text>
              <Pressable accessibilityRole="button" onPress={loadFriends} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Text style={styles.primaryButtonText}>Tekrar Dene</Text>
              </Pressable>
            </View>
          ) : friends.length === 0 ? (
            <View style={styles.stateBox}>
              <Ionicons name="people-outline" size={30} color={tokens.colors.textMuted} />
              <Text style={styles.stateTitle}>Paylaşılabilecek arkadaş yok</Text>
              <Text style={styles.stateText}>Yalnızca kabul edilmiş arkadaşlıklar burada görünür.</Text>
            </View>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(connection) => connection.relationship.id}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <FriendShareRow
                  connection={item}
                  disabled={Boolean(sendingUserId)}
                  sending={sendingUserId === item.userId}
                  mode={effectiveDeliveryMode}
                  onSend={() => void handleSend(item)}
                  styles={styles}
                  tokens={tokens}
                />
              )}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function FriendShareRow({ connection, disabled, mode, onSend, sending, styles, tokens }: {
  connection: FriendConnection;
  disabled: boolean;
  mode: 'message' | 'inbox';
  onSend: () => void;
  sending: boolean;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  const profile = connection.profile;
  if (!profile) return null;
  const avatar = getCosmeticById(profile.avatarId) as AvatarCosmetic;
  const frame = getCosmeticById(profile.avatarFrameId) as AvatarFrameCosmetic;
  return (
    <View style={styles.friendRow}>
      <CosmeticPreview avatar={avatar} frame={frame} mode="equippedCombo" size={48} accessibilityLabel={`${profile.companyName} avatarı`} />
      <View style={styles.friendCopy}>
        <Text numberOfLines={2} style={styles.companyName}>{profile.companyName}</Text>
        <Text numberOfLines={1} style={styles.rank}>{profile.careerRank}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${profile.companyName} şirketine soruyu ${mode === 'message' ? 'mesaj olarak' : 'Paylaşılan Sorular gelen kutusuna'} gönder`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onSend}
        style={({ pressed }) => [styles.sendButton, disabled && styles.disabled, pressed && styles.pressed]}
      >
        {sending ? <ActivityIndicator size="small" color={tokens.colors.foregroundOnAction} /> : <Text style={styles.sendButtonText}>Gönder</Text>}
      </Pressable>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    scrim: { flex: 1, justifyContent: tokens.layout.isCompact ? 'flex-end' : 'center', padding: tokens.layout.isCompact ? 0 : 20, backgroundColor: colors.overlayScrim },
    sheet: { width: '100%', maxWidth: 560, maxHeight: '86%', alignSelf: 'center', overflow: 'hidden', borderRadius: radius.lg, backgroundColor: colors.floatingSurface, borderWidth: 1, borderColor: colors.borderStrong, ...shadow.raised },
    header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 17, paddingRight: 8, borderBottomWidth: 1, borderBottomColor: colors.dividerSubtle },
    headerCopy: { flex: 1, minWidth: 0 },
    eyebrow: { ...tokens.type.eyebrow, color: colors.secondary, fontFamily: fonts.monoSemiBold },
    title: { marginTop: 2, color: colors.text, fontFamily: fonts.headingBold, fontSize: 19, lineHeight: 24 },
    closeButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
    deliveryTabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 12 },
    deliveryTab: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    deliveryTabActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    deliveryTabText: { color: colors.textMuted, fontFamily: fonts.bodySemiBold, fontSize: 12 },
    deliveryTabTextActive: { color: colors.primary },
    list: { padding: 12 },
    separator: { height: 8 },
    friendRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    friendCopy: { flex: 1, minWidth: 0 },
    companyName: { color: colors.text, fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 19 },
    rank: { marginTop: 2, color: colors.textMuted, fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 16 },
    sendButton: { minWidth: 82, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderRadius: radius.sm, backgroundColor: colors.primary },
    sendButtonText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17 },
    stateBox: { minHeight: 280, alignItems: 'center', justifyContent: 'center', padding: 24 },
    successState: { minHeight: 280, alignItems: 'center', justifyContent: 'center', padding: 24 },
    stateTitle: { marginTop: 11, color: colors.text, fontFamily: fonts.headingBold, fontSize: 16, lineHeight: 22, textAlign: 'center' },
    stateText: { maxWidth: 380, marginTop: 5, color: colors.textMuted, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, textAlign: 'center' },
    primaryButton: { minHeight: 48, marginTop: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: radius.sm, backgroundColor: colors.primary },
    primaryButtonText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 13 },
    disabled: { opacity: 0.48 },
    pressed: { opacity: 0.72 },
  });
}
