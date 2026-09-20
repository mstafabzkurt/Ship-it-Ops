import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { DIFFICULTY_LABELS } from '../../config/gameCategories';
import type { ArchivedQuestion } from '../../utils/questionSocial';

interface QuestionDetailSurfaceProps {
  favorite: boolean;
  favoritePending: boolean;
  question: ArchivedQuestion;
  onShare: () => void;
  onToggleFavorite: () => void;
  styles: Record<string, any>;
  colors: Record<string, string>;
}

export default function QuestionDetailSurface({
  colors,
  favorite,
  favoritePending,
  onShare,
  onToggleFavorite,
  question,
  styles,
}: QuestionDetailSurfaceProps) {
  return (
    <>
      <View style={styles.detailHeader}>
        <View style={styles.detailMetaRow}>
          <Text style={styles.detailMeta}>{question.categoryName}</Text>
          <Text style={styles.detailMeta}>{DIFFICULTY_LABELS[question.difficultyStar]} · {question.difficultyStar} yıldız</Text>
        </View>
        <Text accessibilityRole="header" style={styles.detailQuestion}>{question.title}</Text>
      </View>

      <View style={styles.detailActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favorite ? 'Soruyu favorilerden çıkar' : 'Soruyu favorilere ekle'}
          accessibilityState={{ disabled: favoritePending, selected: favorite }}
          disabled={favoritePending}
          onPress={onToggleFavorite}
          style={({ pressed }) => [styles.detailActionButton, favorite && styles.detailActionSelected, favoritePending && styles.disabled, pressed && styles.pressed]}
        >
          <Ionicons name={favorite ? 'star' : 'star-outline'} size={19} color={favorite ? colors.warning : colors.primary} />
          <Text style={[styles.detailActionText, favorite && styles.detailActionSelectedText]}>{favorite ? 'Favorilerde' : 'Favoriye Ekle'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onShare} style={({ pressed }) => [styles.detailActionButton, pressed && styles.pressed]}>
          <Ionicons name="paper-plane-outline" size={19} color={colors.primary} />
          <Text style={styles.detailActionText}>Arkadaşa Gönder</Text>
        </Pressable>
      </View>

      <View style={styles.answerSection}>
        <Text style={styles.answerSectionTitle}>Cevap Seçenekleri</Text>
        <Text style={styles.spoilerNote}>Bu arşiv görünümü doğru cevabı işaretlemez ve aktif oturumu değiştirmez.</Text>
        <View style={styles.answerList}>
          {question.answerOptions.map((answer, index) => (
            <View key={`${question.id}-${index}`} style={styles.answerRow}>
              <View style={styles.answerIndex}>
                <Text style={styles.answerIndexText}>{String.fromCharCode(65 + index)}</Text>
              </View>
              <Text style={styles.answerText}>{answer}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}
