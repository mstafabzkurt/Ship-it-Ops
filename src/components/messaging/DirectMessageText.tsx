import { Link, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { useDuelInvitations } from '../../state/DuelInvitationsContext';
import { splitChatLinks, type ChatLink } from '../../utils/chatLinks';
import { DuelButton, useDuelStyles } from '../duels/DuelUI';
import { DuelInvitationCard } from './ChatDuelPanel';

export default function DirectMessageText({ body, style, linkColor }: { body: string; style?: StyleProp<TextStyle>; linkColor?: string }) {
  const { tokens } = useDuelStyles();
  const { duels } = useDuelInvitations();
  const [error, setError] = useState('');
  const currentOrigin = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined;
  const parts = useMemo(() => splitChatLinks(body, currentOrigin), [body, currentOrigin]);
  const invitation = parts.length === 1 && parts[0].link?.kind === 'duel' ? parts[0].link : null;
  const open = async (link: ChatLink) => {
    setError('');
    if (link.kind === 'duel') { router.push({ pathname: '/duel/[matchId]', params: { matchId: link.matchId } }); return; }
    try { await Linking.openURL(link.url); } catch { setError('Bağlantı açılamadı. Tekrar deneyebilirsin.'); }
  };
  const duel = invitation ? duels.find((item) => item.id === invitation.matchId) : undefined;
  if (invitation) return <View style={{ padding: 12, borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.surface }}>
    {duel ? <DuelInvitationCard duel={duel} /> : <DuelButton label="1v1 Davetini Aç" icon="git-compare-outline" secondary onPress={() => void open(invitation)} />}
  </View>;
  return <View>
    <Text selectable style={[style, Platform.OS === 'web' && ({ wordBreak: 'break-word' } as TextStyle)]}>
      {parts.map((part, index) => part.link ? <Link key={index}
        href={part.link.kind === 'duel' ? { pathname: '/duel/[matchId]', params: { matchId: part.link.matchId } } : part.link.url as `${'https' | 'http'}://${string}`}
        target={part.link.kind === 'external' ? '_blank' : undefined} rel={part.link.kind === 'external' ? 'noopener noreferrer' : undefined}
        accessibilityLabel={part.link.kind === 'duel' ? '1v1 davetini aç' : part.text}
        onPress={Platform.OS !== 'web' ? (event) => { event.preventDefault(); void open(part.link!); } : undefined}
        style={{ color: linkColor ?? tokens.colors.primary, textDecorationLine: 'underline' }}>{part.text}</Link> : part.text)}
    </Text>
    {error ? <Text accessibilityRole="alert" style={[s.error, { color: tokens.colors.danger }]}>{error}</Text> : null}
  </View>;
}
const s = StyleSheet.create({ error: { fontSize: 12, lineHeight: 18, marginTop: 4 } });
