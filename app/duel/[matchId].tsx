import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Share, Text, View, type TextStyle } from 'react-native';
import { duelCategoryLabel, DuelButton, DuelNotice, DuelShell, useDuelStyles } from '../../src/components/duels/DuelUI';
import { DuelLobby } from '../../src/components/duels/DuelLobby';
import { useDuelResource } from '../../src/hooks/useDuelResource';
import { acceptDuel, cancelDuel, createDuel, declineDuel, forfeitDuel, getDuel, getDuelHeadToHead, submitDuelAnswer } from '../../src/services/duels';
import { listFriends } from '../../src/services/friends';
import { useAuth } from '../../src/state/AuthContext';
import { useReputation } from '../../src/state/ReputationContext';
import type { DuelHeadToHead, DuelRoundResult } from '../../src/utils/duels';
import type { PublicProfile } from '../../src/utils/publicProfile';

export default function DuelMatchScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user } = useAuth();
  const reputation = useReputation();
  const { styles, tokens } = useDuelStyles();
  const load = useCallback(() => getDuel(matchId), [matchId]);
  const resource = useDuelResource(`${user?.id ?? ''}:${matchId}`, load, 750);
  const match = resource.data;
  const [now, setNow] = useState(Date.now());
  const [selection, setSelection] = useState<{ round: number; option: number } | null>(null);
  const profileKey = `${user?.id ?? ''}:${match?.opponentId ?? ''}`;
  const recordKey = `${profileKey}:${matchId}`;
  const [opponentData, setOpponentData] = useState<{ key: string; profile: PublicProfile | null } | null>(null);
  const opponent = opponentData?.key === profileKey ? opponentData.profile : null;
  const opponentName = opponent?.companyName ?? 'Rakip şirket';
  const [recordData, setRecordData] = useState<{ key: string; record: DuelHeadToHead | null; error: boolean } | null>(null);
  const record = recordData?.key === recordKey ? recordData.record : null;
  const recordError = recordData?.key === recordKey && recordData.error;
  const [recordRetry, setRecordRetry] = useState(0);
  const [shareFailure, setShareFailure] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareLock = useRef(false);
  const shareGeneration = useRef(0);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const terminal = match?.status === 'completed' || match?.status === 'forfeited';
  const recordPhase = terminal ? 'terminal' : match?.status === 'pending' ? 'pending' : null;

  useEffect(() => {
    setSelection(null);
    setShareFailure(null);
    setCopied(false);
    setSharing(false);
    shareLock.current = false;
    shareGeneration.current += 1;
    return () => {
      shareGeneration.current += 1;
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, [matchId, user?.id]);

  useEffect(() => {
    if (!resource.active) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [resource.active]);
  useEffect(() => {
    let current = true;
    setOpponentData(null);
    if (user?.id && match?.opponentId) {
      void listFriends(user.id).then((friends) => {
        if (current) setOpponentData({ key: profileKey, profile: friends.find((friend) => friend.userId === match.opponentId)?.profile ?? null });
      }).catch(() => {});
    }
    return () => { current = false; };
  }, [user?.id, match?.opponentId, profileKey]);
  useEffect(() => {
    let current = true;
    if (recordPhase && user?.id && match?.opponentId) {
      setRecordData({ key: recordKey, record: null, error: false });
      void getDuelHeadToHead(match.opponentId).then((next) => {
        if (current) setRecordData({ key: recordKey, record: next, error: false });
      }).catch(() => {
        if (current) setRecordData({ key: recordKey, record: null, error: true });
      });
    }
    return () => { current = false; };
  }, [recordPhase, user?.id, match?.opponentId, recordKey, recordRetry]);

  // Offset uses the midpoint of the latest request, so client clock skew is irrelevant.
  const serverNow = match ? Date.parse(match.serverNow) + (now - resource.receivedAt) : now;
  const startsAt = match?.startsAt ? Date.parse(match.startsAt) : Infinity;
  const elapsed = serverNow - startsAt;
  const expectedRound = Math.floor(elapsed / 20000);
  const question = match?.currentQuestion ?? null;
  const currentQuestionIsLive = match?.status === 'active' && question !== null && (match.scoringVersion === 2 ? match.phase === 'question' : expectedRound === question.roundIndex) && serverNow < Date.parse(question.roundEndsAt);
  const revealing = match?.status === 'active' && match.phase === 'reveal';
  const revealSeconds = match?.revealEndsAt ? Math.max(0, Math.ceil((Date.parse(match.revealEndsAt) - serverNow) / 1000)) : 0;
  const selectedOption = question && selection?.round === question.roundIndex ? selection.option : null;
  const submittedOption = match?.myAnswer?.roundIndex === question?.roundIndex ? match?.myAnswer?.optionIndex : null;
  const secondsLeft = question ? Math.max(0, Math.ceil((Date.parse(question.roundEndsAt) - serverNow) / 1000)) : 0;
  const countdown = Math.max(0, Math.ceil((startsAt - serverNow) / 1000));
  const inviteSeconds = match ? Math.max(0, Math.ceil((Date.parse(match.expiresAt) - serverNow) / 1000)) : 0;
  const expiration = inviteSeconds === 0 ? 'Davetin süresi doldu' : inviteSeconds >= 60 ? `Davet ${Math.ceil(inviteSeconds / 60)} dakika geçerli` : `Davet ${inviteSeconds} saniye geçerli`;

  useEffect(() => {
    if (match?.status === 'active' && !currentQuestionIsLive && elapsed >= 0) void resource.refresh();
  }, [expectedRound, match?.status, currentQuestionIsLive, resource.refresh, elapsed < 0, revealSeconds]);

  const share = async () => {
    if (shareLock.current) return;
    shareLock.current = true;
    const generation = shareGeneration.current;
    setSharing(true);
    setShareFailure(null);
    setCopied(false);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    const url = Linking.createURL(`duel/${matchId}`);
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) throw new Error('clipboard_unavailable');
        await navigator.clipboard.writeText(url);
        if (shareGeneration.current !== generation) return;
        setCopied(true);
        copiedTimer.current = setTimeout(() => {
          if (shareGeneration.current === generation) setCopied(false);
        }, 2400);
      } else {
        await Share.share({ message: `Ship It Ops 1v1 davetin: ${url}`, url });
      }
    } catch {
      if (shareGeneration.current === generation) setShareFailure(url);
    } finally {
      if (shareGeneration.current === generation) { shareLock.current = false; setSharing(false); }
    }
  };
  const forfeit = async () => {
    const confirmed = await confirmForfeit();
    if (confirmed) await resource.runAction(() => forfeitDuel(matchId));
  };
  const rematch = async () => {
    if (!match) return;
    const next = await resource.runAction(() => createDuel(match.opponentId));
    if (next) router.replace({ pathname: '/duel/[matchId]', params: { matchId: next.id } });
  };

  return <DuelShell title={match?.status === 'active' && elapsed >= 0 ? opponentName : '1v1 Kapışma'} maxWidth={900} onBack={() => router.replace('/duels')}>
    {resource.loading && !match && <View style={styles.surface}><ActivityIndicator color={tokens.colors.primary} /><Text style={styles.body}>Düello yükleniyor…</Text></View>}
    {resource.error && <DuelNotice message={resource.error} onRetry={() => void resource.refresh()} />}
    {match && (match.status === 'pending' || (match.status === 'active' && elapsed < 0)) && <DuelLobby
      self={{ name: reputation.isLoaded ? reputation.companyName : 'Şirketin', avatarId: reputation.isLoaded ? reputation.equippedAvatarId : undefined, frameId: reputation.isLoaded ? reputation.equippedAvatarFrameId : undefined }}
      opponent={{ name: opponentName, avatarId: opponent?.avatarId, frameId: opponent?.avatarFrameId }}
      preparing={match.status === 'active'} countdown={countdown} incoming={match.inviteeId === user?.id}
      expiration={expiration} history={record && record.total > 0 ? `Aranızda ${record.wins}–${record.losses}${record.draws > 0 ? ` · ${record.draws} beraberlik` : ''}` : undefined}
    >
      {match.inviteeId === user?.id ? <>
        <DuelButton label="Daveti Kabul Et" icon="checkmark" disabled={!resource.active || inviteSeconds === 0} busy={resource.busy} onPress={() => void resource.runAction(() => acceptDuel(matchId))} />
        <DuelButton label="Daveti Reddet" quiet disabled={resource.busy || !resource.active} onPress={() => void resource.runAction(() => declineDuel(matchId))} />
      </> : <>
        <DuelButton label={copied ? 'Kopyalandı' : Platform.OS === 'web' ? 'Davet Bağlantısını Kopyala' : 'Davet Bağlantısını Paylaş'} icon={copied ? 'checkmark' : Platform.OS === 'web' ? 'copy-outline' : 'share-outline'} busy={sharing} disabled={!resource.active || inviteSeconds === 0} onPress={() => void share()} />
        <Text style={[styles.body, { textAlign: 'center', fontSize: 13 }]}>Yalnızca davet ettiğin arkadaş katılabilir.</Text>
        {shareFailure && <View accessibilityLiveRegion="polite" style={{ gap: 8 }}><Text style={styles.body}>Bağlantı paylaşılamadı. Tekrar dene veya aşağıdaki bağlantıyı kopyala.</Text><Text selectable style={[styles.body, { flexShrink: 1 }, Platform.OS === 'web' && ({ overflowWrap: 'anywhere' } as TextStyle)]}>{shareFailure}</Text></View>}
        <DuelButton label="Daveti İptal Et" quiet disabled={resource.busy || !resource.active} onPress={() => void resource.runAction(() => cancelDuel(matchId))} />
      </>}
    </DuelLobby>}
    {match?.status === 'active' && <>
      {elapsed < 0 ? null : revealing && match.roundResult ? <View style={styles.section} accessibilityLiveRegion="polite">
        <Text style={styles.eyebrow}>SORU {match.roundResult.roundIndex + 1} / 7 · SONUÇ</Text>
        <Text style={styles.score}>+{match.roundResult.myPoints} – +{match.roundResult.opponentPoints}</Text>
        <RoundFeedback round={match.roundResult} />
        <Text style={styles.strong}>{revealSeconds > 0 ? `${match.roundResult.roundIndex === 6 ? 'Maç sonucu' : 'Sıradaki soru'} ${revealSeconds} saniye sonra` : 'Sunucuyla eşitleniyor…'}</Text>
      </View> : currentQuestionIsLive && question ? <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.flex}><Text style={styles.eyebrow}>SORU {question.roundIndex + 1} / 7</Text><Text style={styles.body}>{duelCategoryLabel(question.category)}</Text></View>
          <Text accessibilityLabel={`${secondsLeft} saniye kaldı`} style={[styles.timer, secondsLeft <= 5 && styles.warning]}>{secondsLeft}s</Text>
        </View>
        <View style={styles.progressTrack}><View style={[styles.progress, { width: `${Math.min(100, Math.max(0, secondsLeft / 20 * 100))}%` }]} /></View>
        <View style={styles.surface}><Text accessibilityRole="header" style={styles.question}>{question.prompt}</Text></View>
        {question.options.map((option, index) => {
          const isSelected = (submittedOption ?? selectedOption) === index;
          return <Pressable key={`${question.roundIndex}:${index}`} accessibilityRole="radio" accessibilityState={{ selected: isSelected, disabled: submittedOption != null || resource.busy || !resource.active }} disabled={submittedOption != null || resource.busy || !resource.active} onPress={() => setSelection({ round: question.roundIndex, option: index })} style={({ pressed }) => [styles.answer, isSelected && styles.selected, pressed && styles.pressed]}>
            <Text style={styles.answerLetter}>{String.fromCharCode(65 + index)}</Text><Text style={[styles.body, styles.flex]}>{option}</Text>{isSelected && <Ionicons name="checkmark" size={20} color={tokens.colors.primary} />}
          </Pressable>;
        })}
        {match.opponentAnswered && <View style={styles.row} accessibilityLiveRegion="polite"><Ionicons name="checkmark-circle" size={20} color={tokens.colors.success} /><Text style={styles.body}>Rakip cevapladı</Text></View>}
        {submittedOption != null ? <DuelNotice message={match.scoringVersion === 2 ? 'Yanıtın kilitlendi. İkiniz de yanıtlayınca veya süre dolunca sonuç açılır.' : 'Yanıtın kaydedildi. Süre bitince sıradaki soru otomatik açılır.'} /> : <DuelButton label="Yanıtı Kilitle" disabled={selectedOption == null || !resource.active} busy={resource.busy} onPress={() => { if (selectedOption != null) void resource.runAction(() => submitDuelAnswer(matchId, question.roundIndex, selectedOption)); }} />}
      </View> : <View style={styles.surface}><ActivityIndicator color={tokens.colors.primary} /><Text style={styles.body}>{expectedRound >= 7 ? 'Maç sonucu hazırlanıyor…' : 'Sıradaki soru sunucuyla eşitleniyor…'}</Text></View>}
      {elapsed >= 0 && <Text style={styles.body}>Bağlantı kesilse veya bu ekrandan ayrılsan da süre devam eder. Yanlış ve yanıtsız sorular 0 puan alır. {match.scoringVersion === 2 ? 'Her soru sonucu birlikte açılır; sonraki soru 3 saniye sonra başlar.' : 'Doğru yanıtlar maç sonunda açılır.'}</Text>}
      <DuelButton label="Maçtan Çekil" quiet disabled={resource.busy || !resource.active} onPress={() => void forfeit()} />
    </>}
    {terminal && match && <>
      <View style={styles.surface}>
        <Text style={styles.eyebrow}>MAÇ SONUCU{match.status === 'forfeited' ? ' · HÜKMEN' : ''}</Text>
        <Text accessibilityRole="header" style={styles.title}>{match.winnerId === null ? 'Berabere' : match.winnerId === user?.id ? 'Kazandın' : 'Kaybettin'}</Text>
        <Text accessibilityLabel={`Sen ${match.myScore}, rakibin ${match.opponentScore} ${match.scoringVersion === 2 ? 'puan' : 'doğru'}`} style={styles.score}>{match.myScore} – {match.opponentScore}</Text>
        <Text style={styles.body}>{match.scoringVersion === 2 ? 'Toplam puan · Eşit puanda beraberlik' : 'Doğru yanıt sayısı · Eşitlikte toplam süre'}</Text>
        <Text style={styles.body}>Toplam yanıt süresi: Sen {(match.myResponseMs / 1000).toFixed(2)}s · Rakip {(match.opponentResponseMs / 1000).toFixed(2)}s</Text>
        {match.status === 'forfeited' && <Text style={styles.body}>{match.forfeitedBy === user?.id ? 'Maçtan çekildin.' : 'Rakibin maçtan çekildi.'}</Text>}
        {record && <Text style={styles.body}>Aranızdaki {record.total} maç: {record.wins} galibiyet · {record.losses} mağlubiyet · {record.draws} beraberlik</Text>}
        {!record && !recordError && <Text style={styles.body}>Aranızdaki maç geçmişi yükleniyor…</Text>}
        {recordError && <DuelNotice message="Aranızdaki maç geçmişi yüklenemedi." onRetry={() => setRecordRetry((value) => value + 1)} />}
        <DuelButton label="Rövanş Daveti Gönder" busy={resource.busy} disabled={!resource.active} onPress={() => void rematch()} />
      </View>
      {match.results && <View style={styles.section}><Text accessibilityRole="header" style={styles.sectionTitle}>Sorular ve yanıtlar</Text>{match.results.map((round) => <RoundReview key={round.roundIndex} round={round} />)}</View>}
    </>}
    {match && ['declined', 'cancelled', 'expired'].includes(match.status) && <View style={styles.surface}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{match.status === 'declined' ? 'Davet reddedildi' : match.status === 'expired' ? 'Davetin süresi doldu' : 'Davet iptal edildi'}</Text>
      <Text style={styles.body}>Arkadaş 1v1 ekranından yeni bir davet gönderebilirsin.</Text>
      <DuelButton label="Arkadaş 1v1’e Dön" onPress={() => router.replace('/duels')} />
    </View>}
  </DuelShell>;
}

function RoundFeedback({ round }: { round: DuelRoundResult }) {
  const { styles } = useDuelStyles();
  const describe = (option: number | null) => option === null ? 'Yanıtsız' : `${String.fromCharCode(65 + option)} · ${option === round.correctIndex ? 'Doğru' : 'Yanlış'}`;
  return <View style={styles.surface}>
    <Text style={styles.strong}>{round.prompt}</Text>
    <Text style={styles.body}>Sen: {describe(round.myOptionIndex)} · +{round.myPoints} puan</Text>
    <Text style={styles.body}>Rakip: {describe(round.opponentOptionIndex)} · +{round.opponentPoints} puan</Text>
    <Text style={styles.body}>Sen: hız +{round.mySpeedBonus} · ilk doğru +{round.myFirstBonus}</Text>
    <Text style={styles.body}>Rakip: hız +{round.opponentSpeedBonus} · ilk doğru +{round.opponentFirstBonus}</Text>
    <Text style={[styles.body, styles.success]}>Doğru yanıt: {String.fromCharCode(65 + round.correctIndex)}. {round.options[round.correctIndex]}</Text>
    <Text style={styles.body}>{round.explanation}</Text>
  </View>;
}

function RoundReview({ round }: { round: DuelRoundResult }) {
  const { styles, tokens } = useDuelStyles();
  const [expanded, setExpanded] = useState(false);
  const describe = (index: number | null) => index === null ? 'Yanıtsız · 0 puan' : `${String.fromCharCode(65 + index)} · ${index === round.correctIndex ? 'Doğru' : 'Yanlış'}`;
  return <View style={styles.section}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={`Soru ${round.roundIndex + 1}, yanıtları ${expanded ? 'gizle' : 'göster'}`} onPress={() => setExpanded((value) => !value)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.flex}><Text style={styles.strong}>{round.roundIndex + 1}. {duelCategoryLabel(round.category)}</Text><Text style={styles.body}>Sen: {describe(round.myOptionIndex)} · +{round.myPoints} · Rakip: {describe(round.opponentOptionIndex)} · +{round.opponentPoints}</Text></View>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={tokens.colors.textMuted} />
    </Pressable>
    {expanded && <View style={styles.surface}>
      <Text style={styles.strong}>{round.prompt}</Text>
      {round.options.map((option, index) => <Text key={index} style={[styles.body, index === round.correctIndex && styles.success]}>{String.fromCharCode(65 + index)}. {option}{index === round.correctIndex ? ' · Doğru yanıt' : ''}</Text>)}
      <Text style={styles.body}>{round.explanation}</Text>
    </View>}
  </View>;
}

function confirmForfeit(): Promise<boolean> {
  const message = 'Çekilirsen rakibin hükmen kazanır. Maçtan çekilmek istiyor musun?';
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(message));
  return new Promise((resolve) => Alert.alert('Maçtan Çekil', message, [
    { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(false) },
    { text: 'Çekil', style: 'destructive', onPress: () => resolve(true) },
  ], { cancelable: true, onDismiss: () => resolve(false) }));
}
