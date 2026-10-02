import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../../theme/typography';
import type { AvatarCosmeticId, AvatarFrameCosmeticId } from '../../config/cosmetics';
import type { DashboardTokens } from '../dashboard/dashboardTokens';
import { DuelAvatar, DuelRules, useDuelStyles } from './DuelUI';
import { DuelCountdownNumber, useDuelReducedMotion } from './DuelMotion';

interface LobbyPlayer {
  name: string;
  avatarId?: AvatarCosmeticId;
  frameId?: AvatarFrameCosmeticId;
}

export function DuelLobby({ self, opponent, preparing, countdown, incoming, expiration, history, children }: {
  self: LobbyPlayer;
  opponent: LobbyPlayer;
  preparing: boolean;
  countdown: number;
  incoming: boolean;
  expiration: string;
  history?: string;
  children?: React.ReactNode;
}) {
  const { tokens } = useDuelStyles();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const reducedMotion = useDuelReducedMotion();
  const approach = useRef(new Animated.Value(preparing ? 1 : 0)).current;

  useEffect(() => {
    approach.stopAnimation();
    if (reducedMotion) {
      approach.setValue(preparing ? 1 : 0);
      return;
    }
    const animation = Animated.timing(approach, { toValue: preparing ? 1 : 0, duration: 240, useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => animation.stop();
  }, [approach, preparing, reducedMotion]);

  return <View style={styles.lobby}>
    <View style={styles.heading}>
      <Text accessibilityRole="header" style={styles.title}>{preparing ? 'Maç başlıyor' : incoming ? 'Düelloya davetlisin' : 'Rakibin bekleniyor'}</Text>
      {!preparing && <Text style={styles.subtitle}>{incoming ? 'Daveti kabul et, birlikte başlayın.' : 'Arkadaşın kabul ettiğinde maç otomatik başlar.'}</Text>}
    </View>
    <View style={styles.versus}>
      <Animated.View style={[styles.player, { transform: [{ translateX: approach.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) }] }]}>
        <DuelAvatar name={self.name} avatarId={self.avatarId} frameId={self.frameId} size={tokens.layout.isCompact ? 76 : 96} />
        <Text style={styles.company}>{self.name}</Text>
        <Text style={styles.role}>SEN</Text>
      </Animated.View>
      <View style={styles.vs}><Text style={styles.vsText}>VS</Text></View>
      <Animated.View style={[styles.player, { transform: [{ translateX: approach.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }] }]}>
        <DuelAvatar name={opponent.name} avatarId={opponent.avatarId} frameId={opponent.frameId} size={tokens.layout.isCompact ? 76 : 96} />
        <Text style={styles.company}>{opponent.name}</Text>
        <Text style={styles.role}>RAKİP</Text>
      </Animated.View>
    </View>
    {history && <Text style={styles.history}>{history}</Text>}
    {preparing ? <View style={styles.countdown}>
      <View accessibilityLiveRegion="polite" accessibilityLabel={`${countdown} saniye sonra başlayacak`}>
        <DuelCountdownNumber value={countdown} textStyle={styles.countdownNumber} />
      </View>
      <Text style={styles.subtitle}>Hazır ol. İlk soru birlikte açılacak.</Text>
    </View> : <View style={styles.actions}>
      <View style={styles.expiration}><Ionicons accessible={false} name="time-outline" size={16} color={tokens.colors.textSecondary} /><Text style={styles.expirationText}>{expiration}</Text></View>
      {children}
    </View>}
    <View style={styles.rules}>
      <Text style={styles.rulesText}>7 soru · Soru başına 20 saniye</Text>
      <DuelRules />
    </View>
  </View>;
}

function makeStyles(t: DashboardTokens) {
  return StyleSheet.create({
    lobby: { backgroundColor: t.colors.surface, borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.layout.cardPadding, paddingTop: t.layout.isCompact ? 24 : 36, paddingBottom: 20, alignItems: 'center', gap: 20 },
    heading: { alignItems: 'center', gap: 8 },
    title: { fontFamily: fonts.headingBold, fontSize: t.layout.isCompact ? 24 : 30, lineHeight: t.layout.isCompact ? 32 : 38, color: t.colors.text, textAlign: 'center' },
    subtitle: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: t.colors.textSecondary, textAlign: 'center', maxWidth: 380 },
    versus: { width: '100%', maxWidth: 480, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 8, gap: 8 },
    player: { flex: 1, minWidth: 0, alignItems: 'center', gap: 8 },
    company: { fontFamily: fonts.bodySemiBold, color: t.colors.text, fontSize: 15, lineHeight: 21, textAlign: 'center', width: '100%' },
    role: { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 16, letterSpacing: 1, color: t.colors.textSecondary },
    vs: { width: 40, height: t.layout.isCompact ? 76 : 96, justifyContent: 'center', alignItems: 'center' },
    vsText: { fontFamily: fonts.headingBold, fontSize: 22, lineHeight: 30, color: t.colors.primary },
    history: { fontFamily: fonts.monoSemiBold, fontSize: 14, lineHeight: 22, color: t.colors.textSecondary, textAlign: 'center' },
    actions: { width: '100%', maxWidth: 440, gap: 12 },
    expiration: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
    expirationText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, color: t.colors.textSecondary },
    countdown: { alignItems: 'center', gap: 8 },
    countdownNumber: { color: t.colors.primary, fontFamily: fonts.monoBold, fontSize: 64, lineHeight: 80, textAlign: 'center', minWidth: 100 },
    rules: { width: '100%', alignItems: 'center', borderTopWidth: 1, borderTopColor: t.colors.dividerSubtle, paddingTop: 12, gap: 0 },
    rulesText: { color: t.colors.textSecondary, fontFamily: fonts.body, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  });
}
