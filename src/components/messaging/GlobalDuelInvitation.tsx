import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchPublicProfile } from '../../services/publicProfile';
import { useAuth } from '../../state/AuthContext';
import { useDuelInvitations } from '../../state/DuelInvitationsContext';
import { usePrivacyConsent } from '../../state/PrivacyConsentContext';
import { useReputation } from '../../state/ReputationContext';
import { fonts } from '../../theme/typography';
import { useDuelStyles } from '../duels/DuelUI';
import { DuelInvitationCard } from './ChatDuelPanel';

export default function GlobalDuelInvitation() {
  const { user } = useAuth();
  const { duels } = useDuelInvitations();
  const { isLoaded, onboardingCompleted, tutorialCompleted } = useReputation();
  const { consent, isHydrated, preferencesVisible } = usePrivacyConsent();
  const { tokens } = useDuelStyles();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [name, setName] = useState('Arkadaşın');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const incoming = duels.find((duel) => duel.status === 'pending' && duel.inviteeId === user?.id && !dismissed.includes(duel.id));
  const inviterId = incoming?.inviterId;
  useEffect(() => {
    let active = true;
    setName('Arkadaşın');
    if (inviterId) void fetchPublicProfile(inviterId).then((profile) => { if (active && profile) setName(profile.companyName); }).catch(() => undefined);
    return () => { active = false; };
  }, [inviterId]);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const hiddenRoute = pathname.startsWith('/duel') || pathname === '/game'
    || pathname === `/messages/${inviterId}`;
  if (!user || !incoming || !isLoaded || !onboardingCompleted || !tutorialCompleted || !isHydrated || !consent || preferencesVisible || hiddenRoute || keyboardVisible) return null;
  return <View pointerEvents="box-none" style={[s.position, { top: insets.top + 10, left: insets.left + 12, right: insets.right + 12 }]}>
    <View style={[s.notice, { backgroundColor: tokens.colors.floatingSurfaceRaised, borderColor: tokens.colors.borderStrong, borderRadius: tokens.radius.md, ...tokens.shadow.raised }]}>
      <View style={s.header}>
        <Text accessibilityLiveRegion="polite" style={[s.eyebrow, { color: tokens.colors.primary }]}>YENİ 1V1 DAVETİ</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Davet bildirimini kapat" accessibilityHint="Daveti daha sonra 1v1 Kapışma ekranında bulabilirsin." onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onPress={() => setDismissed((current) => [...current, incoming.id])} style={({ pressed }) => [s.close, focused && { borderColor: tokens.colors.actionFocus }, pressed && { opacity: 0.7 }]}>
          <Ionicons name="close-outline" size={22} color={tokens.colors.text} accessible={false} />
        </Pressable>
      </View>
      <DuelInvitationCard duel={incoming} label={name} />
    </View>
  </View>;
}
const s = StyleSheet.create({
  position: { position: 'absolute', zIndex: 25, elevation: 16, alignItems: 'center' },
  notice: { width: '100%', maxWidth: 420, borderWidth: 1, paddingHorizontal: 16, paddingBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eyebrow: { fontFamily: fonts.monoSemiBold, fontSize: 11, letterSpacing: 0.5 },
  close: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent', borderRadius: 8, marginRight: -8 },
});
