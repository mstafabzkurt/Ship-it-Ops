import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DuelRoundResult } from '../../utils/duels';
import { fonts } from '../../theme/typography';
import { useDuelStyles } from './DuelUI';

export default function DuelRoundFeedback({ round, seconds }: { round: DuelRoundResult; seconds: number }) {
  const { styles, tokens } = useDuelStyles();
  const c = tokens.colors;
  const lead = round.myPoints === round.opponentPoints ? 'Bu soru berabere' : round.myPoints > round.opponentPoints ? 'Bu soruda sen daha çok puan aldın' : 'Bu soruda rakip daha çok puan aldı';
  return <View style={styles.section}>
    <View style={s.heading}>
      <View style={styles.flex}>
        <Text style={styles.eyebrow}>SORU {round.roundIndex + 1} / 7 · SONUÇ</Text>
        <Text accessibilityRole="header" style={styles.sectionTitle}>{lead}</Text>
      </View>
      <View accessibilityLabel={seconds > 0 ? `${round.roundIndex === 6 ? 'Maç sonucu' : 'Sıradaki soru'} ${seconds} saniye sonra` : 'Sunucuyla eşitleniyor'} style={[s.countdown, { backgroundColor: c.actionSubSurface, borderColor: c.selectionBorder }]}>
        <Text style={[s.count, { color: c.text }]}>{seconds > 0 ? seconds : '…'}</Text>
        <Text style={[s.countLabel, { color: c.textSecondary }]}>{round.roundIndex === 6 ? 'SONUÇ' : 'SONRAKİ'}</Text>
      </View>
    </View>
    <View style={s.players}>
      {([
        { label: 'Sen', option: round.myOptionIndex, points: round.myPoints, speed: round.mySpeedBonus, first: round.myFirstBonus },
        { label: 'Rakip', option: round.opponentOptionIndex, points: round.opponentPoints, speed: round.opponentSpeedBonus, first: round.opponentFirstBonus },
      ]).map((player) => {
        const correct = player.option === round.correctIndex;
        const color = player.option === null ? c.textSecondary : correct ? c.success : c.danger;
        return <View key={player.label} style={[s.player, { backgroundColor: c.surface, borderColor: correct ? c.successBorder : c.border, borderRadius: tokens.radius.md }]}>
          <Text style={styles.strong}>{player.label}</Text>
          <View style={s.verdict}>
            <Ionicons accessible={false} name={player.option === null ? 'time-outline' : correct ? 'checkmark-circle' : 'close-circle'} color={color} size={22} />
            <Text style={[s.verdictText, { color }]}>{player.option === null ? 'Yanıtsız' : correct ? 'Doğru' : 'Yanlış'}</Text>
          </View>
          <Text style={[s.points, { color: c.text }]}>+{player.points}<Text style={styles.body}> puan</Text></Text>
          <Text style={styles.body}>{player.option === null ? 'Yanıt verilmedi' : `${String.fromCharCode(65 + player.option)} şıkkı`}</Text>
          <Text style={[s.bonus, { color: c.textSecondary }]}>Doğru +{correct ? 70 : 0}{'\n'}Hız +{player.speed} · İlk +{player.first}</Text>
        </View>;
      })}
    </View>
    <View style={styles.surface}>
      <Text style={styles.strong}>Doğru yanıt: {String.fromCharCode(65 + round.correctIndex)}. {round.options[round.correctIndex]}</Text>
      <Text style={styles.body}>{round.explanation}</Text>
    </View>
  </View>;
}

const s = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  countdown: { minWidth: 76, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1 },
  count: { fontFamily: fonts.monoBold, fontSize: 40, lineHeight: 48 },
  countLabel: { fontFamily: fonts.bodySemiBold, fontSize: 10, lineHeight: 16 },
  players: { flexDirection: 'row', gap: 12 },
  player: { flex: 1, minWidth: 0, borderWidth: 1, padding: 14, gap: 8 },
  verdict: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  verdictText: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 22 },
  points: { fontFamily: fonts.monoBold, fontSize: 27, lineHeight: 36 },
  bonus: { fontFamily: fonts.body, fontSize: 12, lineHeight: 20 },
});
