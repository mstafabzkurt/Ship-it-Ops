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
  const [socialError, setSocialError] = useState('');
  const [socialStatsError, setSocialStatsError] = useState('');
  const requestIdRef = useRef(0);
  const socialActionPendingRef = useRef(false);

  const loadProfile = useCallback(() => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    if (!userId) {
      setProfile(null);
      setSocialStats(null);
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
    void Promise.allSettled([fetchPublicProfile(userId), relationshipPromise, socialStatsPromise])
      .then(([profileResult, relationshipResult, socialStatsResult]) => {
        if (requestIdRef.current !== requestId) return;
        if (profileResult.status === 'rejected') {
          setProfile(null);
          setRelationship(null);
          setSocialStats(null);
          setStatus('error');
          return;
        }
        const result = profileResult.value;
        setProfile(result);
        setRelationship(relationshipResult.status === 'fulfilled' ? relationshipResult.value : null);
        setSocialStats(socialStatsResult.status === 'fulfilled' ? socialStatsResult.value : null);
        setSocialError(relationshipResult.status === 'rejected'
          ? 'Arkadaşlık durumu yüklenemedi. Tekrar deneyebilirsin.'
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
        setStatus('error');
      });
  }, [user?.id, userId]);

  useEffect(() => {
    loadProfile();
    return () => { requestIdRef.current += 1; };
  }, [loadProfile]);

  const runSocialAction = useCallback(async (action: 'send' | 'accept' | 'reject' | 'remove') => {
    if (!profile || !user?.id || profile.userId === user.id || socialActionPendingRef.current) return;
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
  }, [profile, relationship, user?.id]);

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
            currentUserId={user?.id ?? ''}
            isSocialPending={isSocialPending}
            onSocialAction={runSocialAction}
            profile={profile}
            relationship={relationship}
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
    </View>
  );
}

function ProfileContent({
  currentUserId,
  isSocialPending,
  onSocialAction,
  profile,
  relationship,
  socialError,
  socialStats,
  socialStatsError,
  styles,
  tokens,
}: {
  currentUserId: string;
  isSocialPending: boolean;
  onSocialAction: (action: 'send' | 'accept' | 'reject' | 'remove') => Promise<void>;
  profile: PublicProfile;
  relationship: FriendRelationship | null;
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
            currentUserId={currentUserId}
            isPending={isSocialPending}
            onAction={onSocialAction}
            relationship={relationship}
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
        <Ionicons name="cloud-offline-outline" size={18} color={tokens.colors.warning} />
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

function SocialActions({ currentUserId, error, isPending, onAction, relationship, styles, targetUserId, tokens }: {
  currentUserId: string;
  error: string;
  isPending: boolean;
  onAction: (action: 'send' | 'accept' | 'reject' | 'remove') => Promise<void>;
  relationship: FriendRelationship | null;
  styles: ReturnType<typeof makeStyles>;
  targetUserId: string;
  tokens: ReturnType<typeof getDashboardTokens>;
}) {
  const direction = relationship
    ? getFriendRelationshipDirection(relationship, currentUserId)
    : null;
  const statusLabel = getFriendshipStatusLabel(direction);
  const relationshipUnavailable = !relationship && error.startsWith('Arkadaşlık durumu yüklenemedi');

  return (
    <View style={styles.socialPanel}>
      <View style={styles.socialPanelHeading}>
        <Ionicons name="people-outline" size={20} color={tokens.colors.secondary} />
        <Text style={styles.socialPanelTitle}>Arkadaşlık</Text>
      </View>

      {relationshipUnavailable ? (
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
              accessibilityState={{ disabled: isPending }}
              disabled={isPending}
              onPress={() => void onAction('accept')}
              style={({ pressed }) => [styles.socialPrimaryButton, isPending && styles.socialDisabled, pressed && styles.pressed]}
            >
              <Text style={styles.socialPrimaryText}>{isPending ? 'İşleniyor...' : 'Kabul Et'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isPending }}
              disabled={isPending}
              onPress={() => void onAction('reject')}
              style={({ pressed }) => [styles.socialDangerButton, isPending && styles.socialDisabled, pressed && styles.pressed]}
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
        <View style={styles.socialButtonRow}>
          <View accessibilityRole="text" style={styles.socialAcceptedStatus}>
            <Ionicons name="checkmark-circle-outline" size={19} color={tokens.colors.success} />
            <Text style={styles.socialAcceptedText}>{statusLabel}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mesaj gönder"
            onPress={() => router.push({ pathname: '/messages/[userId]', params: { userId: targetUserId } })}
            style={({ pressed }) => [styles.socialPrimaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.socialPrimaryText}>Mesaj Gönder</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isPending }}
            disabled={isPending}
            onPress={() => void onAction('remove')}
            style={({ pressed }) => [styles.socialDangerButton, isPending && styles.socialDisabled, pressed && styles.pressed]}
          >
            <Text style={styles.socialDangerText}>Arkadaşlıktan Çıkar</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isPending }}
          disabled={isPending}
          onPress={() => void onAction('send')}
          style={({ pressed }) => [styles.socialPrimaryButton, isPending && styles.socialDisabled, pressed && styles.pressed]}
        >
          <Text style={styles.socialPrimaryText}>{isPending ? 'Gönderiliyor...' : 'Arkadaş Ekle'}</Text>
        </Pressable>
      )}

      {error ? <Text accessibilityLiveRegion="polite" style={styles.socialError}>{error}</Text> : null}
    </View>
  );
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
    socialStatsUnavailable: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    socialStatsUnavailableText: { flex: 1, color: colors.textMuted, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
    socialPrimaryButton: { flexGrow: 1, minWidth: 132, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderRadius: radius.sm, backgroundColor: colors.primary },
    socialPrimaryText: { color: colors.foregroundOnAction, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, textAlign: 'center' },
    socialDangerButton: { flexGrow: 1, minWidth: 132, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger },
    socialDangerText: { color: colors.danger, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, textAlign: 'center' },
    socialStatus: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.borderSubtle },
    socialStatusText: { color: colors.textMuted, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
    socialIncomingStatus: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8, paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.selectionBorder },
    socialIncomingText: { flexShrink: 1, color: colors.primary, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, textAlign: 'center' },
    socialAcceptedStatus: { flexGrow: 1, minWidth: 132, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.successBorder },
    socialAcceptedText: { color: colors.success, fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
    socialDisabled: { opacity: 0.48 },
    socialError: { marginTop: 9, color: colors.danger, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 18 },
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
