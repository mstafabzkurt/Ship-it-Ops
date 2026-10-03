import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { acceptDuel, cancelDuel, createDuel, declineDuel, type DuelSummary } from '../../services/duels';
import { useAuth } from '../../state/AuthContext';
import { useDuelInvitations } from '../../state/DuelInvitationsContext';
import { fonts } from '../../theme/typography';
import { DuelButton, useDuelStyles } from '../duels/DuelUI';

export function duelInvitationLabel(duel: DuelSummary, userId?: string): string {
  if (duel.status === 'pending') return duel.inviteeId === userId ? 'Arkadaşın sana meydan okuyor' : 'Davet gönderildi · Yanıt bekleniyor';
  return ({ active: 'Kapışma başladı', expired: 'Davetin süresi doldu', cancelled: 'Davet iptal edildi', declined: 'Davet reddedildi', completed: 'Kapışma tamamlandı', forfeited: 'Kapışma sona erdi' })[duel.status];
}

export function DuelInvitationCard({ duel, label, disabled = false }: { duel: DuelSummary; label?: string; disabled?: boolean }) {
  const { user } = useAuth();
  const { tokens } = useDuelStyles();
  const { busy, runAction } = useDuelInvitations();
  const [error, setError] = useState('');
  const incoming = duel.status === 'pending' && duel.inviteeId === user?.id;
  useEffect(() => setError(''), [duel.id, duel.status]);
  const respond = async (action: 'accept' | 'decline' | 'cancel') => {
    setError('');
    try {
      const next = await runAction(() => action === 'accept' ? acceptDuel(duel.id) : action === 'decline' ? declineDuel(duel.id) : cancelDuel(duel.id));
      if (next?.status === 'active' && action === 'accept') router.push({ pathname: '/duel/[matchId]', params: { matchId: next.id } });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Davet yanıtlanamadı. Tekrar dene.'); }
  };
  const open = () => router.push({ pathname: '/duel/[matchId]', params: { matchId: duel.id } });
  return <View style={s.card}>
    <View style={s.heading}>
      <Ionicons name="git-compare-outline" size={20} color={tokens.colors.primary} accessible={false} />
      <View style={s.copy}>
        <Text style={[s.title, { color: tokens.colors.text }]}>{label ?? '1v1 Kapışma'}</Text>
        <Text accessibilityLiveRegion="polite" style={[s.subtitle, { color: tokens.colors.textSecondary }]}>{duelInvitationLabel(duel, user?.id)}</Text>
      </View>
    </View>
    <View style={s.actions}>
      {incoming ? <>
        <DuelButton label="Kabul Et" icon="checkmark-outline" disabled={disabled || busy} onPress={() => void respond('accept')} style={s.action} />
        <DuelButton label="Reddet" secondary disabled={disabled || busy} onPress={() => void respond('decline')} style={s.action} />
      </> : <>
        <DuelButton label={duel.status === 'active' ? 'Maça Dön' : duel.status === 'pending' ? 'Daveti Aç' : 'Ayrıntılar'} secondary disabled={busy} onPress={open} style={s.action} />
        {duel.status === 'pending' && <DuelButton label="İptal Et" quiet disabled={disabled || busy} onPress={() => void respond('cancel')} style={s.action} />}
      </>}
    </View>
    {error ? <Text accessibilityRole="alert" style={[s.error, { color: tokens.colors.danger }]}>{error}</Text> : null}
  </View>;
}

export default function ChatDuelPanel({ opponentId, disabled = false }: { opponentId: string; disabled?: boolean }) {
  const { tokens } = useDuelStyles();
  const { duels, busy, runAction, refresh } = useDuelInvitations();
  const [error, setError] = useState('');
  const existing = duels.find((duel) => duel.opponentId === opponentId && (duel.status === 'pending' || duel.status === 'active'));
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh, opponentId]));
  useEffect(() => setError(''), [opponentId]);
  const invite = async () => {
    setError('');
    try {
      const next = await runAction(() => createDuel(opponentId));
      if (next) router.push({ pathname: '/duel/[matchId]', params: { matchId: next.id } });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Davet gönderilemedi. Tekrar dene.'); }
  };
  if (disabled) return null;
  return <View style={[s.panel, { paddingHorizontal: tokens.layout.pageGutter, backgroundColor: tokens.colors.canvas, borderBottomColor: tokens.colors.dividerSubtle }]}>
    {existing ? <DuelInvitationCard duel={existing} /> : <DuelButton label="1v1'e Davet Et" icon="git-compare-outline" quiet busy={busy} onPress={() => void invite()} />}
    {error ? <Text accessibilityRole="alert" style={[s.error, { color: tokens.colors.danger }]}>{error}</Text> : null}
  </View>;
}

const s = StyleSheet.create({
  panel: { width: '100%', maxWidth: Platform.OS === 'web' ? undefined : 820, alignSelf: 'center', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  card: { gap: 10 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20 }, subtitle: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, action: { flexGrow: 1, flexBasis: 110, minHeight: 48 },
  error: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
});
