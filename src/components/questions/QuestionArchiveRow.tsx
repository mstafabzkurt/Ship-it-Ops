import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { DIFFICULTY_LABELS } from '../../config/gameCategories';
import { getCosmeticById, type AvatarCosmetic, type AvatarFrameCosmetic } from '../../config/cosmetics';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import type { ArchivedQuestion } from '../../utils/questionSocial';
import type { PublicProfile } from '../../utils/publicProfile';
import CosmeticPreview from '../cosmetics/CosmeticPreview';
import { getDashboardTokens } from '../dashboard/dashboardTokens';

interface QuestionArchiveRowProps {
  question: ArchivedQuestion;
  contextLabel: string;
  sender?: PublicProfile | null;
  senderUnavailable?: boolean;
  unread?: boolean;
  onOpen: () => void;
  onRemove?: () => void;
  onShare?: () => void;
}

export default function QuestionArchiveRow({
  contextLabel,
  onOpen,
  onRemove,
  onShare,
  question,
  sender,
  senderUnavailable = false,
  unread = false,
}: QuestionArchiveRowProps) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const avatar = sender ? getCosmeticById(sender.avatarId) as AvatarCosmetic : null;
  const frame = sender ? getCosmeticById(sender.avatarFrameId) as AvatarFrameCosmetic : null;

  return (
    <View style={[styles.row, unread && styles.rowUnread]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${question.title}. Soru detayını aç.`}
        onPress={onOpen}
        style={({ pressed }) => [styles.openArea, pressed && styles.pressed]}
      >
        <View style={styles.contextLine}>
          {sender && avatar && frame ? (
            <CosmeticPreview avatar={avatar} frame={frame} mode="equippedCombo" size={38} accessibilityLabel={`${sender.companyName} avatarı`} />
          ) : (
            <View style={styles.questionIcon}>
              <Ionicons name="help-outline" size={19} color={tokens.colors.secondary} />
            </View>
          )}
          <View style={styles.contextCopy}>
            <Text numberOfLines={1} style={styles.contextLabel}>{sender?.companyName ?? (senderUnavailable ? 'Şirket profili kullanılamıyor' : contextLabel)}</Text>
            <Text style={styles.meta}>{question.categoryName} · {DIFFICULTY_LABELS[question.difficultyStar]}</Text>
            {sender || senderUnavailable ? <Text style={styles.timestamp}>{contextLabel}</Text> : null}
          </View>
          {unread ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>YENİ</Text>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={19} color={tokens.colors.textMuted} />
        </View>
        <Text numberOfLines={3} style={styles.questionTitle}>{question.title}</Text>
      </Pressable>

      {onRemove || onShare ? (
        <View style={styles.actions}>
          {onShare ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Soruyu arkadaşa gönder" onPress={onShare} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <Ionicons name="paper-plane-outline" size={17} color={tokens.colors.primary} />
              <Text style={styles.actionText}>Arkadaşa Gönder</Text>
            </Pressable>
          ) : null}
          {onRemove ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Soruyu favorilerden çıkar" onPress={onRemove} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <Ionicons name="star-outline" size={17} color={tokens.colors.textMuted} />
              <Text style={styles.removeText}>Favoriden Çıkar</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    row: { overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.borderSubtle },
    rowUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary, backgroundColor: colors.secondarySurfaceRaised },
    openArea: { padding: 13 },
    contextLine: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    questionIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.secondarySoft },
    contextCopy: { flex: 1, minWidth: 0 },
    contextLabel: { color: colors.text, fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17 },
    meta: { marginTop: 1, color: colors.textMuted, fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 15 },
    timestamp: { marginTop: 1, color: colors.textMuted, fontFamily: fonts.body, fontSize: 10, lineHeight: 14 },
    unreadBadge: { minHeight: 24, justifyContent: 'center', paddingHorizontal: 8, borderRadius: radius.pill, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.selectionBorder },
    unreadText: { color: colors.primary, fontFamily: fonts.monoBold, fontSize: 8, lineHeight: 11, letterSpacing: 0.5 },
    questionTitle: { marginTop: 10, color: colors.text, fontFamily: fonts.headingMedium, fontSize: 15, lineHeight: 21 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.dividerSubtle, backgroundColor: colors.secondarySurfaceRaised },
    actionButton: { minHeight: 44, flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surfaceSoft },
    actionText: { color: colors.primary, fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17 },
    removeText: { color: colors.textMuted, fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17 },
    pressed: { opacity: 0.72, backgroundColor: colors.surfacePressed },
  });
}
