import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CosmeticPreview from '../../src/components/cosmetics/CosmeticPreview';
import { getDashboardTokens } from '../../src/components/dashboard/dashboardTokens';
import ReportUserSheet from '../../src/components/messaging/ReportUserSheet';
import RankIcon from '../../src/components/rank/RankIcon';
import { ACHIEVEMENTS } from '../../src/config/achievements';
import { getCosmeticById, type AvatarCosmetic, type AvatarFrameCosmetic } from '../../src/config/cosmetics';
import { getRankForCareerXp } from '../../src/config/progression';
import {
  acceptFriendRequest,
  getSocialProfileStats,
  getRelationshipWithUser,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from '../../src/services/friends';
import {
  blockDirectMessageUser,
  getDirectConversationContext,
  reportDirectMessageUser,
  unblockDirectMessageUser,
} from '../../src/services/directMessaging';
import { fetchPublicProfile } from '../../src/services/publicProfile';
import { useAuth } from '../../src/state/AuthContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';
import {
  getFriendRelationshipDirection,
  getFriendshipStatusLabel,
  type FriendRelationship,
  type SocialProfileStats,
} from '../../src/utils/friends';
import type { UserReportReason } from '../../src/utils/directMessaging';
import type { PublicProfile } from '../../src/utils/publicProfile';

type LoadStatus = 'loading' | 'ready' | 'missing' | 'error';

export default function PublicProfileScreen() {
  const params = useLocalSearchParams<{ userId?: string | string[] }>();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [relationship, setRelationship] = useState<FriendRelationship | null>(null);
  const [socialStats, setSocialStats] = useState<SocialProfileStats | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [isSocialPending, setIsSocialPending] = useState(false);
  const [isSafetyPending, setIsSafetyPending] = useState(false);
  const [blockedByViewer, setBlockedByViewer] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [socialError, setSocialError] = useState('');
  const [safetyError, setSafetyError] = useState('');
  const [socialStatsError, setSocialStatsError] = useState('');
  const requestIdRef = useRef(0);
  const socialActionPendingRef = useRef(false);
  const safetyActionPendingRef = useRef(false);

  const loadProfile = useCallback(() => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    if (!userId) {
      setProfile(null);
      setRelationship(null);
      setSocialStats(null);
      setBlockedByViewer(false);
      setStatus('missing');
      return;
    }
    setStatus('loading');
    const relationshipPromise = user?.id && user.id !== userId
      ? getRelationshipWithUser(userId, user.id)
      : Promise.resolve(null);
    const socialStatsPromise = user?.id
      ? getSocialProfileStats(userId)
      : Promise.resolve(null);
    const safetyContextPromise = user?.id && user.id !== userId
      ? getDirectConversationContext(userId)
      : Promise.resolve(null);
    void Promise.allSettled([fetchPublicProfile(userId), relationshipPromise, socialStatsPromise, safetyContextPromise])
      .then(([profileResult, relationshipResult, socialStatsResult, safetyContextResult]) => {
        if (requestIdRef.current !== requestId) return;
        if (profileResult.status === 'rejected') {
          setProfile(null);
          setRelationship(null);
          setSocialStats(null);
          setBlockedByViewer(false);
          setStatus('error');
          return;
        }
        const result = profileResult.value;
        setProfile(result);
        setRelationship(relationshipResult.status === 'fulfilled' ? relationshipResult.value : null);
        setSocialStats(socialStatsResult.status === 'fulfilled' ? socialStatsResult.value : null);
        setBlockedByViewer(safetyContextResult.status === 'fulfilled'
          ? safetyContextResult.value?.blockedByViewer ?? false
          : false);
        setSocialError(relationshipResult.status === 'rejected'
          ? 'Arkadaşlık durumu yüklenemedi. Tekrar deneyebilirsin.'
          : '');
        setSafetyError(safetyContextResult.status === 'rejected'
          ? 'Güvenlik durumu yüklenemedi. Tekrar deneyebilirsin.'
          : '');
        setSocialStatsError(socialStatsResult.status === 'rejected'
          ? 'Sosyal istatistikler yüklenemedi.'
          : '');
        setStatus(result ? 'ready' : 'missing');
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setProfile(null);
        setRelationship(null);
        setSocialStats(null);
        setBlockedByViewer(false);
        setStatus('error');
      });
  }, [user?.id, userId]);

  useEffect(() => {
    loadProfile();
    return () => { requestIdRef.current += 1; };
  }, [loadProfile]);

  const runSocialAction = useCallback(async (action: 'send' | 'accept' | 'reject' | 'remove') => {
    if (!profile || !user?.id || profile.userId === user.id
      || socialActionPendingRef.current || safetyActionPendingRef.current || blockedByViewer) return;
    socialActionPendingRef.current = true;
    setIsSocialPending(true);
    setSocialError('');
    try {
      if (action === 'send') {
        setRelationship(await sendFriendRequest(profile.userId));
      } else if (action === 'accept' && relationship) {
        setRelationship(await acceptFriendRequest(relationship.id));
        setSocialStats((current) => current
          ? { ...current, friendCount: current.friendCount + 1 }
          : current);
      } else if (action === 'reject' && relationship) {
        setRelationship(await rejectFriendRequest(relationship.id));
      } else if (action === 'remove') {
        const confirmed = await confirmFriendRemoval(profile.companyName);
        if (!confirmed) return;
        const removed = await removeFriend(profile.userId);
        if (removed) {
          setRelationship(null);
          setSocialStats((current) => current
            ? { ...current, friendCount: Math.max(0, current.friendCount - 1) }
            : current);
        }
      }
    } catch {
      setSocialError('Arkadaşlık işlemi tamamlanamadı. Tekrar deneyebilirsin.');
    } finally {
      socialActionPendingRef.current = false;
      setIsSocialPending(false);
    }
  }, [blockedByViewer, profile, relationship, user?.id]);

  const runSafetyAction = useCallback(async (action: 'block' | 'unblock') => {
    if (!profile || !user?.id || profile.userId === user.id
      || safetyActionPendingRef.current || socialActionPendingRef.current) return;
    safetyActionPendingRef.current = true;
    setIsSafetyPending(true);
    setSafetyError('');
    setSocialError('');
    try {
      const confirmed = action === 'block'
        ? await confirmProfileBlock(profile.companyName)
        : await confirmProfileUnblock(profile.companyName);
      if (!confirmed) return;

      if (action === 'block') {
        const wasAccepted = relationship
          ? getFriendRelationshipDirection(relationship, user.id) === 'accepted'
          : false;
        await blockDirectMessageUser(profile.userId);
        setBlockedByViewer(true);
        setRelationship(null);
        if (wasAccepted) {
          setSocialStats((current) => current
            ? { ...current, friendCount: Math.max(0, current.friendCount - 1) }
            : current);
        }
      } else {
        await unblockDirectMessageUser(profile.userId);
        setBlockedByViewer(false);
        setRelationship(null);
      }
    } catch {
      setSafetyError('Güvenlik işlemi tamamlanamadı. Tekrar deneyebilirsin.');
    } finally {
      safetyActionPendingRef.current = false;
      setIsSafetyPending(false);
    }
  }, [profile, relationship, user?.id]);

  const submitReport = useCallback(async (reason: UserReportReason, details: string) => {
    if (!profile) return;
    await reportDirectMessageUser({ targetUserId: profile.userId, reason, details });
  }, [profile]);

  return (
    <View style={styles.background}>
      <View pointerEvents="none" style={styles.topRule} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Arama sonuçlarına dön" hitSlop={8} onPress={() => (router.canGoBack() ? router.back() : router.replace('/company-search'))} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={22} color={tokens.colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>HERKESE AÇIK PROFİL</Text>
            <Text accessibilityRole="header" numberOfLines={2} style={styles.headerTitle}>{profile?.companyName ?? 'Şirket Profili'}</Text>
          </View>
        </View>

        {status === 'ready' && profile ? (
          <ProfileContent
            blockedByViewer={blockedByViewer}
            currentUserId={user?.id ?? ''}
            isSafetyPending={isSafetyPending}
            isSocialPending={isSocialPending}
            onOpenReport={() => setReportVisible(true)}
            onSafetyAction={runSafetyAction}
            onSocialAction={runSocialAction}
            profile={profile}
            relationship={relationship}
            safetyError={safetyError}
            socialError={socialError}
            socialStats={socialStats}
            socialStatsError={socialStatsError}
            styles={styles}
            tokens={tokens}
          />
        ) : (
          <LoadState status={status} onRetry={loadProfile} styles={styles} tokens={tokens} />
        )}
      </SafeAreaView>
      <ReportUserSheet
        visible={reportVisible}
        companyName={profile?.companyName ?? 'Oyuncu'}
        isBlocked={blockedByViewer}
        onClose={() => setReportVisible(false)}
        onSubmit={submitReport}
      />
    </View>
  );
}

function ProfileContent({
  blockedByViewer,
  currentUserId,
  isSafetyPending,
  isSocialPending,
  onOpenReport,
  onSafetyAction,
  onSocialAction,
  profile,
  relationship,
  safetyError,
  socialError,
  socialStats,
  socialStatsError,
  styles,
  tokens,
}: {
  blockedByViewer: boolean;
  currentUserId: string;
  isSafetyPending: boolean;
  isSocialPending: boolean;
  onOpenReport: () => void;
  onSafetyAction: (action: 'block' | 'unblock') => Promise<void>;
  onSocialAction: (action: 'send' | 'accept' | 'reject' | 'remove') => Promise<void>;
  profile: PublicProfile;
  relationship: FriendRelationship | null;
  safetyError: string;
  socialError: string;
  socialStats: SocialProfileStats | null;
  socialStatsError: string;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  const avatar = getCosmeticById(profile.avatarId) as AvatarCosmetic;
  const frame = getCosmeticById(profile.avatarFrameId) as AvatarFrameCosmetic;
  const rank = getRankForCareerXp(profile.careerXp).current;
  const badges = ACHIEVEMENTS.filter((badge) => profile.selectedBadgeIds.includes(badge.id));
  const successRate = profile.successRate.toLocaleString('tr-TR', { maximumFractionDigits: 2 });

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View pointerEvents="none" style={styles.heroRail} />
          <CosmeticPreview avatar={avatar} frame={frame} mode="equippedCombo" variant="profile" accessibilityLabel={`${profile.companyName}: ${avatar.name}, ${frame.name}`} />
          <View style={styles.identityCopy}>
            <Text style={styles.companyName}>{profile.companyName}</Text>
            <View style={styles.rankLine}>
              <View style={styles.rankIcon}>
                <RankIcon rank={rank} size={36} fallbackColor={tokens.colors.primary} />
              </View>
              <Text style={styles.rankText}>{profile.careerRank}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kariyer Özeti</Text>
          <View style={styles.sectionRule} />
        </View>
        <View style={styles.statsGrid}>
          <Stat label="Kariyer XP" value={profile.careerXp.toLocaleString('tr-TR')} icon="trending-up-outline" styles={styles} tokens={tokens} />
          <Stat label="İtibar" value={profile.reputation.toLocaleString('tr-TR')} icon="shield-checkmark-outline" styles={styles} tokens={tokens} />
          <Stat label="Başarı Oranı" value={`%${successRate}`} icon="analytics-outline" styles={styles} tokens={tokens} />
          <Stat label="Tamamlanan Oturum" value={profile.completedSessions.toLocaleString('tr-TR')} icon="checkmark-done-outline" styles={styles} tokens={tokens} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sosyal</Text>
          <View style={styles.sectionRule} />
        </View>
        <SocialStatsSummary
          error={socialStatsError}
          isOwnProfile={profile.userId === currentUserId}
          stats={socialStats}
          styles={styles}
          tokens={tokens}
        />

        {profile.userId !== currentUserId ? (
          <SocialActions
            blockedByViewer={blockedByViewer}
            currentUserId={currentUserId}
            isSafetyPending={isSafetyPending}
            isPending={isSocialPending}
            onOpenReport={onOpenReport}
            onSafetyAction={onSafetyAction}
            onAction={onSocialAction}
            relationship={relationship}
            safetyError={safetyError}
            error={socialError}
            styles={styles}
            targetUserId={profile.userId}
            tokens={tokens}
          />
        ) : null}

        {badges.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Öne Çıkan Rozetler</Text>
              <View style={styles.sectionRule} />
            </View>
            <View style={styles.badgeList}>
              {badges.map((badge) => (
                <View key={badge.id} style={styles.badgeRow}>
                  <Ionicons name={badge.icon} size={20} color={tokens.colors.secondary} />
                  <Text style={styles.badgeText}>{badge.title}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.readOnlyNote}>
          <Ionicons name="eye-outline" size={18} color={tokens.colors.textMuted} />
          <Text style={styles.readOnlyText}>Bu profil salt okunurdur ve yalnızca güvenli oyuncu bilgilerini gösterir.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function SocialStatsSummary({ error, isOwnProfile, stats, styles, tokens }: {
  error: string;
  isOwnProfile: boolean;
  stats: SocialProfileStats | null;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  if (!stats) {
    return (
      <View accessibilityLiveRegion="polite" style={styles.socialStatsUnavailable}>
        <Ionicons name="information-circle-outline" size={17} color={tokens.colors.textMuted} />
        <Text style={styles.socialStatsUnavailableText}>{error || 'Sosyal istatistikler kullanılamıyor.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.socialStatsRow}>
      <View accessible accessibilityLabel={`${stats.friendCount} arkadaş`} style={styles.socialMetric}>
        <Ionicons name="people-outline" size={19} color={tokens.colors.secondary} />
        <View style={styles.socialMetricCopy}>
          <Text style={styles.socialMetricValue}>{stats.friendCount.toLocaleString('tr-TR')}</Text>
          <Text style={styles.socialMetricLabel}>Arkadaş</Text>
        </View>
      </View>
      {!isOwnProfile ? (
        <View accessible accessibilityLabel={`${stats.mutualFriendCount} ortak arkadaş`} style={styles.socialMetric}>
          <Ionicons name="git-merge-outline" size={19} color={tokens.colors.secondary} />
          <View style={styles.socialMetricCopy}>
            <Text style={styles.socialMetricValue}>{stats.mutualFriendCount.toLocaleString('tr-TR')}</Text>
            <Text style={styles.socialMetricLabel}>Ortak Arkadaş</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function SocialActions({
  blockedByViewer,
  currentUserId,
  error,
  isPending,
  isSafetyPending,
  onAction,
  onOpenReport,
  onSafetyAction,
  relationship,
  safetyError,
  styles,
  targetUserId,
  tokens,
}: {
  blockedByViewer: boolean;
  currentUserId: string;
  error: string;
  isPending: boolean;
  isSafetyPending: boolean;
  onAction: (action: 'send' | 'accept' | 'reject' | 'remove') => Promise<void>;
  onOpenReport: () => void;
  onSafetyAction: (action: 'block' | 'unblock') => Promise<void>;
  relationship: FriendRelationship | null;
  safetyError: string;
  styles: ReturnType<typeof makeStyles>;
  targetUserId: string;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  const [focusedControl, setFocusedControl] = useState<string | null>(null);
  const direction = relationship
    ? getFriendRelationshipDirection(relationship, currentUserId)
    : null;
  const statusLabel = getFriendshipStatusLabel(direction);
  const relationshipUnavailable = !relationship && error.startsWith('Arkadaşlık durumu yüklenemedi');
  const interactionPending = isPending || isSafetyPending;

  return (
    <View style={styles.socialPanel}>
      <View style={styles.socialPanelHeading}>
        <Ionicons name={blockedByViewer ? 'shield-outline' : 'people-outline'} size={20} color={blockedByViewer ? tokens.colors.textMuted : tokens.colors.secondary} />
        <Text style={styles.socialPanelTitle}>{blockedByViewer ? 'Bağlantı Durumu' : 'Arkadaşlık'}</Text>
      </View>

      {blockedByViewer ? (
        <View>
          <View accessibilityRole="text" style={styles.blockedStatus}>
            <Ionicons name="ban-outline" size={19} color={tokens.colors.danger} />
            <View style={styles.blockedStatusCopy}>
              <Text style={styles.blockedStatusTitle}>Bu kullanıcıyı engellediniz.</Text>
              <Text style={styles.blockedStatusText}>Yeni arkadaşlık ve mesaj eylemleri kullanılamaz.</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kullanıcının engelini kaldır"
            accessibilityState={{ disabled: interactionPending }}
            disabled={interactionPending}
            onBlur={() => setFocusedControl(null)}
            onFocus={() => setFocusedControl('unblock')}
            onPress={() => void onSafetyAction('unblock')}
            style={({ pressed }) => [styles.socialPrimaryButton, styles.unblockButton, interactionPending && styles.socialDisabled, focusedControl === 'unblock' && styles.controlFocused, pressed && styles.pressed]}
          >
            {isSafetyPending ? <ActivityIndicator color={tokens.colors.foregroundOnAction} /> : <Text style={styles.socialPrimaryText}>Engeli Kaldır</Text>}
          </Pressable>
        </View>
      ) : relationshipUnavailable ? (
        <View accessibilityRole="text" style={styles.socialStatus}>
          <Ionicons name="cloud-offline-outline" size={19} color={tokens.colors.warning} />
          <Text style={styles.socialStatusText}>Arkadaşlık durumu kullanılamıyor</Text>
        </View>
      ) : direction === 'incoming' ? (
        <View>
          <View accessibilityRole="text" style={styles.socialIncomingStatus}>
            <Ionicons name="mail-unread-outline" size={19} color={tokens.colors.primary} />
            <Text style={styles.socialIncomingText}>{statusLabel}</Text>
          </View>
          <View style={styles.socialButtonRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Arkadaşlık isteğini kabul et"
              accessibilityState={{ disabled: interactionPending }}
              disabled={interactionPending}
              onBlur={() => setFocusedControl(null)}
              onFocus={() => setFocusedControl('accept')}
              onPress={() => void onAction('accept')}
              style={({ pressed }) => [styles.socialPrimaryButton, interactionPending && styles.socialDisabled, focusedControl === 'accept' && styles.controlFocused, pressed && styles.pressed]}
            >
              <Text style={styles.socialPrimaryText}>{isPending ? 'İşleniyor...' : 'Kabul Et'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Arkadaşlık isteğini reddet"
              accessibilityState={{ disabled: interactionPending }}
              disabled={interactionPending}
              onBlur={() => setFocusedControl(null)}
              onFocus={() => setFocusedControl('reject')}
              onPress={() => void onAction('reject')}
              style={({ pressed }) => [styles.socialDangerButton, interactionPending && styles.socialDisabled, focusedControl === 'reject' && styles.controlFocused, pressed && styles.pressed]}
            >
              <Text style={styles.socialDangerText}>Reddet</Text>
            </Pressable>
          </View>
        </View>
      ) : direction === 'outgoing' ? (
        <View accessibilityRole="text" style={styles.socialStatus}>
          <Ionicons name="time-outline" size={19} color={tokens.colors.textMuted} />
          <Text style={styles.socialStatusText}>{statusLabel}</Text>
        </View>
      ) : direction === 'accepted' ? (
        <View>
          <View accessibilityRole="text" style={styles.socialAcceptedStatus}>
            <Ionicons name="checkmark-circle-outline" size={19} color={tokens.colors.success} />
            <Text style={styles.socialAcceptedText}>{statusLabel}</Text>
          </View>
          <View style={styles.socialButtonRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mesaj gönder"
              accessibilityState={{ disabled: interactionPending }}
              disabled={interactionPending}
              onBlur={() => setFocusedControl(null)}
              onFocus={() => setFocusedControl('message')}
              onPress={() => router.push({ pathname: '/messages/[userId]', params: { userId: targetUserId } })}
              style={({ pressed }) => [styles.socialPrimaryButton, interactionPending && styles.socialDisabled, focusedControl === 'message' && styles.controlFocused, pressed && styles.pressed]}
            >
              <Text style={styles.socialPrimaryText}>Mesaj Gönder</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="1v1 kapışmaya davet et"
              accessibilityState={{ disabled: interactionPending }}
              disabled={interactionPending}
              onBlur={() => setFocusedControl(null)}
              onFocus={() => setFocusedControl('duel')}
              onPress={() => router.push({ pathname: '/duels', params: { opponentId: targetUserId } })}
              style={({ pressed }) => [styles.socialSecondaryButton, interactionPending && styles.socialDisabled, focusedControl === 'duel' && styles.controlFocused, pressed && styles.pressed]}
            >
              <Text style={styles.socialSecondaryText}>1v1 Kapış</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Arkadaşlıktan çıkar"
              accessibilityState={{ disabled: interactionPending }}
              disabled={interactionPending}
              onBlur={() => setFocusedControl(null)}
              onFocus={() => setFocusedControl('remove')}
              onPress={() => void onAction('remove')}
              style={({ pressed }) => [styles.socialDangerButton, interactionPending && styles.socialDisabled, focusedControl === 'remove' && styles.controlFocused, pressed && styles.pressed]}
            >
              <Text style={styles.socialDangerText}>{isPending ? 'İşleniyor...' : 'Arkadaşlıktan Çıkar'}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Arkadaşlık isteği gönder"
          accessibilityState={{ disabled: interactionPending }}
          disabled={interactionPending}
          onBlur={() => setFocusedControl(null)}
          onFocus={() => setFocusedControl('send')}
          onPress={() => void onAction('send')}
          style={({ pressed }) => [styles.socialPrimaryButton, interactionPending && styles.socialDisabled, focusedControl === 'send' && styles.controlFocused, pressed && styles.pressed]}
        >
          <Text style={styles.socialPrimaryText}>{isPending ? 'Gönderiliyor...' : 'Arkadaşlık İsteği Gönder'}</Text>
        </Pressable>
      )}

      {error ? <Text accessibilityLiveRegion="polite" style={styles.socialError}>{error}</Text> : null}

      <View style={styles.safetySection}>
        <Text style={styles.safetyLabel}>GÜVENLİK</Text>
        <View style={styles.safetyButtonRow}>
          {!blockedByViewer ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kullanıcıyı engelle"
              accessibilityState={{ disabled: interactionPending }}
              disabled={interactionPending}
              onBlur={() => setFocusedControl(null)}
              onFocus={() => setFocusedControl('block')}
              onPress={() => void onSafetyAction('block')}
              style={({ pressed }) => [styles.safetyDangerButton, interactionPending && styles.socialDisabled, focusedControl === 'block' && styles.controlFocused, pressed && styles.pressed]}
            >
              {isSafetyPending ? <ActivityIndicator color={tokens.colors.danger} /> : <Ionicons name="ban-outline" size={18} color={tokens.colors.danger} />}
              <Text style={styles.safetyDangerText}>{isSafetyPending ? 'Engelleniyor...' : 'Engelle'}</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kullanıcıyı şikayet et"
            accessibilityState={{ disabled: interactionPending }}
            disabled={interactionPending}
            onBlur={() => setFocusedControl(null)}
            onFocus={() => setFocusedControl('report')}
            onPress={onOpenReport}
            style={({ pressed }) => [styles.safetyNeutralButton, interactionPending && styles.socialDisabled, focusedControl === 'report' && styles.controlFocused, pressed && styles.pressed]}
          >
            <Ionicons name="flag-outline" size={18} color={tokens.colors.textSecondary} />
            <Text style={styles.safetyNeutralText}>Şikayet Et</Text>
          </Pressable>
        </View>
        {safetyError ? <Text accessibilityLiveRegion="polite" style={styles.socialError}>{safetyError}</Text> : null}
      </View>
    </View>
  );
}

function confirmProfileBlock(companyName: string): Promise<boolean> {
  const title = 'Kullanıcı engellensin mi?';
  const message = `${companyName} ile arkadaşlığın varsa sona erecek ve yeni mesaj gönderilemeyecek. Eski mesaj geçmişin silinmeyecek. Engeli daha sonra kaldırabilirsin.`;
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Engelle', style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

function confirmProfileUnblock(companyName: string): Promise<boolean> {
  const title = 'Engel kaldırılsın mı?';
  const message = `${companyName} ile önceki arkadaşlığın geri gelmeyecek. Yeniden arkadaş olmak istersen yeni bir istek göndermen gerekir.`;
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Engeli Kaldır', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

function confirmFriendRemoval(companyName: string): Promise<boolean> {
  const message = `${companyName} ile arkadaşlığın kaldırılacak. Devam etmek istiyor musun?`;
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(message));
  return new Promise((resolve) => {
    Alert.alert('Arkadaşlıktan Çıkar', message, [
      { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Çıkar', style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

function Stat({ label, value, icon, styles, tokens }: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color={tokens.colors.secondary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LoadState({ status, onRetry, styles, tokens }: {
  status: LoadStatus;
  onRetry: () => void;
  styles: ReturnType<typeof makeStyles>;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  if (status === 'loading') {
    return (
      <View accessibilityLiveRegion="polite" style={styles.loadState}>
        <ActivityIndicator color={tokens.colors.secondary} />
        <Text style={styles.loadTitle}>Profil yükleniyor</Text>
      </View>
    );
  }
  const isMissing = status === 'missing';
  return (
    <View accessibilityLiveRegion="polite" style={styles.loadState}>
      <Ionicons name={isMissing ? 'person-outline' : 'cloud-offline-outline'} size={32} color={isMissing ? tokens.colors.textMuted : tokens.colors.warning} />
      <Text style={styles.loadTitle}>{isMissing ? 'Profil bulunamadı' : 'Profil yüklenemedi'}</Text>
      <Text style={styles.loadText}>{isMissing ? 'Bu oyuncunun herkese açık profili henüz hazır olmayabilir.' : 'Bağlantını kontrol edip tekrar deneyebilirsin.'}</Text>
      {!isMissing ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius, shadow } = tokens;
  return StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.canvas },
    topRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, opacity: 0.5 },
    safeArea: { flex: 1 },
    header: { width: '100%', maxWidth: 760, alignSelf: 'center', minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: tokens.layout.pageGutter, paddingTop: tokens.layout.pageTop, paddingBottom: 8 },
    backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    headerCopy: { flex: 1, minWidth: 0 },
    eyebrow: { ...tokens.type.eyebrow, color: colors.secondary, fontFamily: fonts.bodySemiBold, marginBottom: 2 },
    headerTitle: { ...tokens.type.title, color: colors.text, fontFamily: fonts.headingBold },
    scrollContent: { paddingBottom: tokens.layout.pageBottom },
    container: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: tokens.layout.pageGutter, paddingTop: 10 },
    hero: { position: 'relative', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: tokens.layout.isCompact ? 12 : 20, padding: tokens.layout.cardPadding, paddingLeft: tokens.layout.cardPadding + 3, borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle, ...shadow.card, shadowColor: colors.shadowNeutral, shadowOpacity: 0.16 },
    heroRail: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, backgroundColor: colors.primary },
    identityCopy: { flex: 1, minWidth: 170 },
    companyName: { ...tokens.type.display, color: colors.text, fontFamily: fonts.headingBold, marginBottom: 10 },
    rankLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    rankIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySurfaceRaised, borderWidth: 1, borderColor: colors.borderSubtle },
    rankText: { flexShrink: 1, color: colors.primary, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, textTransform: 'uppercase' },
    socialPanel: { marginTop: 12, padding: 13, borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    socialPanelHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 11 },
    socialPanelTitle: { color: colors.text, fontFamily: fonts.headingBold, fontSize: 15, lineHeight: 20 },
    socialButtonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    socialStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 1, overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.dividerSubtle, borderWidth: 1, borderColor: colors.borderSubtle },
    socialMetric: { flexGrow: 1, flexBasis: 150, minWidth: 140, minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, paddingVertical: 12, backgroundColor: colors.secondarySurface },
    socialMetricCopy: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, minWidth: 0 },
    socialMetricValue: { color: colors.text, fontFamily: fonts.monoBold, fontSize: 18, lineHeight: 24 },
    socialMetricLabel: { color: colors.textMuted, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17 },
    socialStatsUnavailable: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 2 },
    socialStatsUnavailableText: { flex: 1, color: colors.textMuted, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
    socialPrimaryButton: { flexGrow: 1, minWidth: 132, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderRadius: radius.sm, backgroundColor: colors.primary },
    socialPrimaryText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, textAlign: 'center' },
    socialSecondaryButton: { flexGrow: 1, minWidth: 132, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderRadius: radius.sm, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
    socialSecondaryText: { color: colors.primary, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, textAlign: 'center' },
    socialDangerButton: { flexGrow: 1, minWidth: 132, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger },
    socialDangerText: { color: colors.danger, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, textAlign: 'center' },
    socialStatus: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.borderSubtle },
    socialStatusText: { color: colors.textMuted, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
    socialIncomingStatus: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8, paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.selectionBorder },
    socialIncomingText: { flexShrink: 1, color: colors.primary, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, textAlign: 'center' },
    socialAcceptedStatus: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, paddingHorizontal: 12, borderRadius: radius.sm, backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.successBorder },
    socialAcceptedText: { color: colors.success, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
    blockedStatus: { minHeight: 58, flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: radius.sm, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.borderSubtle },
    blockedStatusCopy: { flex: 1, minWidth: 0 },
    blockedStatusTitle: { color: colors.text, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 19 },
    blockedStatusText: { marginTop: 2, color: colors.textMuted, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
    unblockButton: { marginTop: 10 },
    safetySection: { marginTop: 13, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.dividerSubtle },
    safetyLabel: { ...tokens.type.eyebrow, marginBottom: 8, color: colors.textMuted, fontFamily: fonts.monoSemiBold },
    safetyButtonRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
    safetyDangerButton: { minWidth: 140, minHeight: 48, flexBasis: tokens.layout.isNarrow ? '100%' : 'auto', flexGrow: tokens.layout.isNarrow ? 1 : 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger },
    safetyDangerText: { color: colors.danger, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
    safetyNeutralButton: { minWidth: 140, minHeight: 48, flexBasis: tokens.layout.isNarrow ? '100%' : 'auto', flexGrow: tokens.layout.isNarrow ? 1 : 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.borderSubtle },
    safetyNeutralText: { color: colors.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
    socialDisabled: { opacity: 0.48 },
    socialError: { marginTop: 9, color: colors.danger, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 18 },
    controlFocused: { outlineColor: colors.actionFocus, outlineStyle: 'solid', outlineWidth: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: tokens.layout.isCompact ? 22 : 30, marginBottom: 12 },
    sectionTitle: { ...tokens.type.title, color: colors.text, fontFamily: fonts.headingBold },
    sectionRule: { flex: 1, height: 1, marginBottom: 5, backgroundColor: colors.dividerSubtle },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: { flexGrow: 1, flexBasis: tokens.layout.isNarrow ? '100%' : 150, minHeight: 112, justifyContent: 'center', padding: 15, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle },
    statValue: { marginTop: 9, color: colors.text, fontFamily: fonts.monoBold, fontSize: 20, lineHeight: 25 },
    statLabel: { marginTop: 3, color: colors.textMuted, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
    badgeList: { gap: 8 },
    badgeRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    badgeText: { flex: 1, color: colors.text, fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20 },
    readOnlyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 24, padding: 13, borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    readOnlyText: { flex: 1, color: colors.textMuted, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
    loadState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
    loadTitle: { marginTop: 12, color: colors.text, fontFamily: fonts.headingBold, fontSize: 18, lineHeight: 24, textAlign: 'center' },
    loadText: { maxWidth: 400, marginTop: 6, color: colors.textMuted, fontFamily: fonts.body, fontSize: 14, lineHeight: 21, textAlign: 'center' },
    retryButton: { minHeight: 48, marginTop: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: radius.sm, backgroundColor: colors.primary },
    retryText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 14 },
    pressed: { opacity: 0.72 },
  });
}
