import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DashboardTokens } from '../src/components/dashboard/dashboardTokens';
import { DuelEntrance, useDuelReducedMotion } from '../src/components/duels/DuelMotion';
import { DuelAvatar, DuelButton, DuelNotice, DuelRules, DuelShell, useDuelStyles } from '../src/components/duels/DuelUI';
import { useDuelResource } from '../src/hooks/useDuelResource';
import { createDuel, listDuels } from '../src/services/duels';
import { listFriends } from '../src/services/friends';
import { useAuth } from '../src/state/AuthContext';
import { fonts } from '../src/theme/typography';
import type { DuelSummary } from '../src/utils/duels';

type ActivityTab = 'invites' | 'active' | 'history';

export default function DuelsScreen() {
  const { user } = useAuth();
  const { opponentId: opponentParam } = useLocalSearchParams<{ opponentId?: string | string[] }>();
  const opponentId = Array.isArray(opponentParam) ? opponentParam[0] : opponentParam;
  const { tokens, wide } = useDuelStyles();
  const s = useMemo(() => makeStyles(tokens), [tokens]);
  const [selectedId, setSelectedId] = useState<string | null>(opponentId ?? null);
  const [tab, setTab] = useState<ActivityTab>('invites');
  const [focusedTab, setFocusedTab] = useState<ActivityTab | null>(null);
  const [hoveredTab, setHoveredTab] = useState<ActivityTab | null>(null);
  const [focusedRow, setFocusedRow] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!user?.id) throw new Error('Düelloya katılmak için oturum açmalısın.');
    const [duels, friends] = await Promise.all([listDuels(), listFriends(user.id)]);
    return { duels, friends };
  }, [user?.id]);
  const resource = useDuelResource(user?.id ?? '', load, 5000);
  const friends = resource.data?.friends ?? [];
  const selectedFriend = friends.find((friend) => friend.userId === selectedId);
  useEffect(() => {
    if (opponentId) setSelectedId(opponentId);
  }, [opponentId]);
  useEffect(() => {
    if (!resource.data) return;
    // A targeted link takes precedence, even when its friend is unavailable.
    if (!opponentId && resource.data.friends.length === 1 && selectedId !== resource.data.friends[0].userId) {
      setSelectedId(resource.data.friends[0].userId);
    }
  }, [resource.data, opponentId, selectedId]);
  const profiles = useMemo(() => new Map(friends.map((friend) => [friend.userId, friend.profile])), [friends]);
  const duels = resource.data?.duels ?? [];
  const incoming = duels.filter((duel) => duel.status === 'pending' && duel.inviteeId === user?.id);
  const outgoing = duels.filter((duel) => duel.status === 'pending' && duel.inviterId === user?.id);
  const active = duels.filter((duel) => duel.status === 'active');
  const recent = duels.filter((duel) => duel.status !== 'active' && duel.status !== 'pending').slice(0, 20);
  const selectedName = selectedFriend?.profile?.companyName ?? 'Arkadaşın';

  const challenge = async () => {
    if (!selectedFriend || !resource.data || resource.busy || !resource.active) return;
    let matchId: string | null = null;
    const result = await resource.runAction(async () => {
      const created = await createDuel(selectedFriend.userId);
      matchId = created.id;
      return { friends, duels: [created, ...duels.filter((duel) => duel.id !== created.id)] };
    });
    if (result && matchId) router.push({ pathname: '/duel/[matchId]', params: { matchId } });
  };

  const matchRow = (duel: DuelSummary) => {
    const profile = profiles.get(duel.opponentId);
    const name = profile?.companyName ?? 'Rakip şirket';
    const invited = duel.status === 'pending' && duel.inviteeId === user?.id;
    const finished = duel.status === 'completed' || duel.status === 'forfeited';
    return <Pressable
      key={duel.id} accessibilityRole="button"
      accessibilityLabel={`${name}: ${duelLabel(duel, user?.id)}, ${invited ? 'daveti aç' : 'maçı aç'}`}
      onPress={() => router.push({ pathname: '/duel/[matchId]', params: { matchId: duel.id } })}
      onHoverIn={() => setHoveredRow(duel.id)} onHoverOut={() => setHoveredRow(null)}
      onFocus={() => setFocusedRow(duel.id)} onBlur={() => setFocusedRow(null)}
      style={({ pressed }) => [s.matchRow, invited && s.incomingRow, hoveredRow === duel.id && s.hovered, focusedRow === duel.id && s.focused, pressed && s.pressed]}>
      <DuelAvatar name={name} avatarId={profile?.avatarId} frameId={profile?.avatarFrameId} size={42} />
      <View style={s.flex}>
        <Text style={s.name}>{name}</Text>
        <Text style={[s.small, invited && s.accentText]}>{duelLabel(duel, user?.id)}</Text>
      </View>
      {finished && <Text style={s.score}>{duel.myScore}–{duel.opponentScore}</Text>}
      <Ionicons name="chevron-forward" size={18} color={invited ? tokens.colors.primary : tokens.colors.textMuted} accessible={false} />
    </Pressable>;
  };
  const inviteCount = incoming.length + outgoing.length;
  const visibleMatches = tab === 'invites' ? [...incoming, ...outgoing] : tab === 'active' ? active : recent;
  const empty = ({
    invites: { icon: 'mail-open-outline', title: 'Henüz bekleyen davet yok', body: 'Bir arkadaşına meydan oku. Gelen ve gönderdiğin davetler burada görünür.' },
    active: { icon: 'flash-outline', title: 'Sıradaki kapışma seni bekliyor', body: 'Kabul edilen maçlara buradan dönebilirsin.' },
    history: { icon: 'git-compare-outline', title: 'İlk kapışma, ilk hikâye', body: 'Tamamlanan maçlar ve arkadaşlarınla rekabetin burada birikir.' },
  } as const)[tab];

  return <DuelShell title="1v1 Kapışma" maxWidth={1120}>
    <View style={s.factsRow}>
      <Text style={s.facts}>7 soru · 20 sn/soru · 100 puan/soru · Ödülsüz rekabet</Text>
      <DuelRules />
    </View>
    {resource.loading && !resource.data && <View style={s.loading}>
      <ActivityIndicator accessibilityLabel="Düellolar yükleniyor" color={tokens.colors.primary} />
      <Text style={s.small}>Kapışmalar yükleniyor…</Text>
    </View>}
    {resource.error && <DuelNotice message={resource.error} onRetry={() => void resource.refresh()} />}
    {resource.data && <View style={[s.layout, wide && s.desktopLayout]}>
      <DuelEntrance style={wide ? s.challengeColumn : undefined}>
        <View style={s.panel}>
          <View style={s.panelHeader}>
            <View style={s.flex}>
              <Text accessibilityRole="header" style={s.panelTitle}>Meydan oku</Text>
              <Text style={s.small}>{friends.length > 0 ? 'Rakibini seç, aynı sorularda kapışın.' : 'Rekabet bir arkadaşla başlar.'}</Text>
            </View>
            <Ionicons name="git-compare-outline" size={24} color={tokens.colors.primary} accessible={false} />
          </View>
          {friends.length === 0 ? <View style={s.noFriends}>
            <View style={s.emptyIcon}><Ionicons name="people-outline" size={26} color={tokens.colors.textSecondary} accessible={false} /></View>
            <Text style={s.name}>Henüz rakibin yok</Text>
            <Text style={[s.small, s.centerText]}>Bir oyuncuyla arkadaş olduğunda ona 1v1 daveti gönderebilirsin.</Text>
            <DuelButton label="Şirket Ara" secondary onPress={() => router.push('/company-search')} />
          </View> : <>
            <View style={s.listHeading}>
              <Text style={s.listLabel}>ARKADAŞLARIN</Text>
              <Text style={s.small}>{friends.length} oyuncu</Text>
            </View>
            <ScrollView style={[s.friendScrollBase, friends.length > 4 && s.friendScroll]} contentContainerStyle={s.friendList} nestedScrollEnabled showsVerticalScrollIndicator={friends.length > 4}>
              {friends.map((friend) => {
                const selected = friend.userId === selectedId;
                const name = friend.profile?.companyName ?? 'Arkadaşın';
                return <SelectionEmphasis key={friend.userId} selected={selected}><Pressable accessibilityRole="button" accessibilityState={{ selected, disabled: resource.busy }}
                  accessibilityLabel={`${name}${friend.profile ? `, ${friend.profile.careerRank}` : ''}`}
                  disabled={resource.busy} onPress={() => setSelectedId(friend.userId)}
                  onHoverIn={() => setHoveredRow(friend.userId)} onHoverOut={() => setHoveredRow(null)}
                  onFocus={() => setFocusedRow(friend.userId)} onBlur={() => setFocusedRow(null)}
                  style={({ pressed }) => [s.friendRow, hoveredRow === friend.userId && s.hovered, selected && s.selectedFriend, focusedRow === friend.userId && s.focused, pressed && s.pressed]}>
                  <DuelAvatar name={name} avatarId={friend.profile?.avatarId} frameId={friend.profile?.avatarFrameId} size={46} />
                  <View style={s.flex}>
                    <Text style={s.name}>{name}</Text>
                    <Text style={s.small}>{friend.profile?.careerRank ?? 'Arkadaşın'}</Text>
                  </View>
                  <View style={[s.radio, selected && s.radioSelected]}>
                    {selected && <Ionicons name="checkmark" size={14} color={tokens.colors.primary} accessible={false} />}
                  </View>
                </Pressable></SelectionEmphasis>;
              })}
            </ScrollView>
            {opponentId && !selectedFriend && <Text style={s.small}>Bu oyuncu arkadaş listende bulunamadı. Listeden bir rakip seç.</Text>}
            <View style={s.challengeAction}>
              <DuelButton icon="git-compare-outline" label={selectedFriend ? `${selectedName}’e Meydan Oku` : 'Meydan okumak için rakip seç'} disabled={!selectedFriend || !resource.active} busy={resource.busy} onPress={() => void challenge()} />
              <Text style={[s.small, s.centerText]}>{selectedFriend ? 'Davet kabul edildiğinde kapışma başlar.' : 'Davet yalnızca seçtiğin arkadaşına gider.'}</Text>
            </View>
          </>}
        </View>
      </DuelEntrance>
      <DuelEntrance style={wide ? s.activityColumn : undefined} delay={70}>
        <View style={s.activityPanel}>
          <View style={s.activityHeading}>
            <Text accessibilityRole="header" style={s.panelTitle}>Kapışmaların</Text>
            {incoming.length > 0 && <Text accessibilityLiveRegion="polite" style={s.incomingCount}>{incoming.length} yeni davet</Text>}
          </View>
          <View style={s.tabs}>
            {([{ key: 'invites', label: 'Davetler', count: inviteCount }, { key: 'active', label: 'Devam eden', count: active.length }, { key: 'history', label: 'Geçmiş', count: recent.length }] as const).map((item) => <Pressable
              key={item.key} accessibilityRole="button" accessibilityState={{ selected: tab === item.key }}
              accessibilityLabel={`${item.label}${item.count ? `, ${item.count} maç` : ''}`}
              onPress={() => setTab(item.key)} onFocus={() => setFocusedTab(item.key)} onBlur={() => setFocusedTab(null)}
              onHoverIn={() => setHoveredTab(item.key)} onHoverOut={() => setHoveredTab(null)}
              style={({ pressed }) => [s.tab, hoveredTab === item.key && s.hovered, tab === item.key && s.tabSelected, focusedTab === item.key && s.tabFocused, pressed && s.pressed]}>
              <Text style={[s.tabText, tab === item.key && s.tabTextSelected]}>{item.label}</Text>
              {item.count > 0 && <Text style={[s.tabCount, tab === item.key && s.tabTextSelected]}>{item.count}</Text>}
            </Pressable>)}
          </View>
          {visibleMatches.length === 0 ? <View style={s.emptyState}>
            <View style={s.emptyIcon}><Ionicons name={empty.icon} size={26} color={tokens.colors.textSecondary} accessible={false} /></View>
            <Text style={[s.name, s.centerText]}>{empty.title}</Text>
            <Text style={[s.small, s.centerText, s.emptyCopy]}>{empty.body}</Text>
          </View> : <View style={s.matches}>
            {tab === 'invites' ? <>
              {incoming.length > 0 && <View style={s.matchGroup}>
                <Text style={s.groupLabel}>SANA MEYDAN OKUYANLAR</Text>
                {incoming.map(matchRow)}
              </View>}
              {outgoing.length > 0 && <View style={s.matchGroup}>
                <Text style={s.groupLabel}>YANIT BEKLEYENLER</Text>
                {outgoing.map(matchRow)}
              </View>}
            </> : visibleMatches.map(matchRow)}
          </View>}
        </View>
      </DuelEntrance>
    </View>}
  </DuelShell>;
}

function SelectionEmphasis({ selected, children }: { selected: boolean; children: React.ReactNode }) {
  const reducedMotion = useDuelReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    opacity.stopAnimation();
    opacity.setValue(selected && !reducedMotion ? 0.86 : 1);
    if (!selected || reducedMotion) return;
    const animation = Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => animation.stop();
  }, [selected, reducedMotion, opacity]);
  return <Animated.View style={{ opacity, flexShrink: 0 }}>{children}</Animated.View>;
}

function duelLabel(duel: DuelSummary, userId?: string) {
  if (duel.status === 'pending') return duel.inviteeId === userId ? 'Sana meydan okudu · Daveti aç' : 'Davet gönderildi · Kabul bekleniyor';
  if (duel.status === 'active') return 'Maç devam ediyor · Maça dön';
  if (duel.status === 'completed' || duel.status === 'forfeited') {
    const result = duel.winnerId === null ? 'Berabere' : duel.winnerId === userId ? 'Kazandın' : 'Kaybettin';
    return `${result}${duel.status === 'forfeited' ? ' · Hükmen' : ''}`;
  }
  return ({ declined: 'Davet reddedildi', cancelled: 'Davet iptal edildi', expired: 'Davetin süresi doldu' } as const)[duel.status];
}

function makeStyles(t: DashboardTokens) {
  const c = t.colors;
  return StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    factsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 16, rowGap: 2 },
    facts: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, color: c.textSecondary },
    layout: { gap: 20 }, desktopLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
    challengeColumn: { flex: 0.95, minWidth: 0 }, activityColumn: { flex: 1.15, minWidth: 0 },
    panel: { padding: t.layout.isCompact ? 16 : 24, backgroundColor: c.surface, borderRadius: t.radius.md, borderWidth: 1, borderColor: c.border, gap: 20 },
    panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    panelTitle: { color: c.text, fontFamily: fonts.headingBold, fontSize: 19, lineHeight: 27 },
    small: { color: c.textSecondary, fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
    name: { color: c.text, fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 21 },
    listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: -12 },
    listLabel: { color: c.textMuted, fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 16, letterSpacing: 1 },
    friendScrollBase: { flexGrow: 0, flexShrink: 0 }, friendScroll: { maxHeight: 292 }, friendList: { gap: 8 },
    friendRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: t.radius.sm, borderWidth: 1, borderColor: c.borderSubtle },
    selectedFriend: { backgroundColor: c.gameSelectionBackground, borderColor: c.gameSelectionBorder },
    radio: { width: 22, height: 22, borderWidth: 1, borderColor: c.borderStrong, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    radioSelected: { borderColor: c.primary, backgroundColor: c.primarySoft },
    challengeAction: { gap: 10, paddingTop: 4 }, centerText: { textAlign: 'center' },
    activityPanel: { backgroundColor: c.surface, borderRadius: t.radius.md, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
    activityHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: t.layout.isCompact ? 16 : 24, paddingTop: t.layout.isCompact ? 16 : 24, paddingBottom: 16, flexWrap: 'wrap' },
    incomingCount: { color: c.primary, fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 18 },
    tabs: { flexDirection: 'row', paddingHorizontal: t.layout.isCompact ? 12 : 20, gap: 4, borderBottomWidth: 1, borderBottomColor: c.dividerSubtle },
    tab: { minHeight: 48, flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 4, borderWidth: 1, borderColor: 'transparent', borderBottomWidth: 2 },
    tabSelected: { borderBottomColor: c.primary },
    tabFocused: { borderColor: c.actionFocus, borderRadius: 4 },
    tabText: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 18, color: c.textSecondary },
    tabTextSelected: { color: c.primary }, tabCount: { fontFamily: fonts.monoSemiBold, fontSize: 11, color: c.textMuted },
    emptyState: { paddingHorizontal: 24, paddingVertical: t.layout.isCompact ? 32 : 52, alignItems: 'center', gap: 10 },
    emptyIcon: { width: 52, height: 52, borderRadius: t.radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: c.secondarySurface, marginBottom: 2 },
    emptyCopy: { maxWidth: 300 }, noFriends: { alignItems: 'center', gap: 12, paddingVertical: 8 },
    matches: { paddingHorizontal: t.layout.isCompact ? 12 : 20, paddingTop: 16, paddingBottom: 12, gap: 16 }, matchGroup: { gap: 8 },
    groupLabel: { color: c.textMuted, fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 16, letterSpacing: 0.6, paddingHorizontal: 4 },
    matchRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 12, borderRadius: t.radius.sm, borderWidth: 1, borderColor: 'transparent', borderBottomColor: c.dividerSubtle },
    incomingRow: { backgroundColor: c.primarySoft, borderLeftWidth: 3, borderLeftColor: c.primary, borderBottomWidth: 0 }, accentText: { color: c.primary },
    score: { color: c.text, fontFamily: fonts.monoSemiBold, fontSize: 16, lineHeight: 22 },
    hovered: { backgroundColor: c.surfaceHover }, focused: { borderColor: c.actionFocus },
    pressed: { opacity: 0.78 }, loading: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 12 },
  });
}
