import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { COSMETIC_CATALOG, type AvatarCosmetic, type AvatarFrameCosmetic, type CosmeticCatalogItem, type CosmeticDefinition, type CosmeticId, type CosmeticType } from '../../config/cosmetics';
import { useTheme } from '../../state/ThemeContext';
import { fonts } from '../../theme/typography';
import { trackEvent } from '../../utils/telemetry';
import CosmeticFilters from '../cosmetics/CosmeticFilters';
import { getDashboardTokens } from '../dashboard/dashboardTokens';
import CosmeticStoreCard from '../store/CosmeticStoreCard';

interface ProfileCosmeticsProps {
  ownedCosmeticIds: readonly CosmeticId[];
  avatar: AvatarCosmetic;
  frame: AvatarFrameCosmetic;
  onEquipAvatar: (id: CosmeticId) => Promise<string>;
  onEquipFrame: (id: CosmeticId) => Promise<string>;
  compact?: boolean;
}

export default function ProfileCosmetics({ ownedCosmeticIds, avatar, frame, onEquipAvatar, onEquipFrame, compact = false }: ProfileCosmeticsProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(getDashboardTokens(theme, width)), [theme, width]);
  const [expanded, setExpanded] = useState(false);
  const [type, setType] = useState<CosmeticType>('avatar');
  const [processingId, setProcessingId] = useState<CosmeticId | null>(null);
  const [message, setMessage] = useState('');
  const guard = useRef(false);
  const owned = COSMETIC_CATALOG.filter(item => ownedCosmeticIds.includes(item.id));
  const visible = owned.filter(item => item.type === type);

  const equip = async (item: CosmeticCatalogItem) => {
    if (guard.current) return;
    guard.current = true;
    setProcessingId(item.id);
    try {
      const result = await (item.type === 'avatar' ? onEquipAvatar(item.id) : onEquipFrame(item.id));
      if (result === 'ok') {
        void trackEvent('cosmetic_equipped', {
          item_id: item.id,
          item_type: item.type,
          rarity: (item as CosmeticDefinition).rarity ?? 'standard',
        });
      }
      setMessage(result === 'ok' ? `${item.name} kuşanıldı.` : 'Kuşanılamadı. Lütfen tekrar dene.');
    } catch {
      setMessage('Kuşanılamadı. Lütfen tekrar dene.');
    } finally {
      setProcessingId(null);
      guard.current = false;
    }
  };

  return (
    <View style={[styles.panel, compact && styles.panelCompact]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Kozmetik envanterim" accessibilityState={{ expanded }}
        onPress={() => setExpanded(value => !value)} style={({ pressed }) => [styles.heading, compact && styles.headingCompact, pressed && styles.pressed]}>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>Avatar ve Çerçeve</Text>
          <Text style={styles.hint}>{owned.length} sahip olunan kozmetik</Text>
        </View>
        <Text style={styles.toggle}>{expanded ? '−' : '+'}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.content}>
          <CosmeticFilters items={owned} type={type} onTypeChange={setType} />
          {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
          {visible.length ? (
            <View style={styles.grid}>
              {visible.map(item => (
                <View key={item.id} style={[styles.item, width >= 700 && styles.itemTablet, width >= 1040 && styles.itemDesktop]}>
                  <CosmeticStoreCard item={item} owned ownershipOnly canAfford reduceMotion
                    equipped={item.id === avatar.id || item.id === frame.id}
                    isProcessing={processingId === item.id} actionLocked={processingId !== null}
                    onAction={() => void equip(item)} />
                </View>
              ))}
            </View>
          ) : <Text style={styles.hint}>Bu türde henüz kozmetiğin yok. Mağazadan koleksiyonuna ekleyebilirsin.</Text>}
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  const { colors, radius } = tokens;
  return StyleSheet.create({
    panel: { marginTop: 16 },
    panelCompact: { marginTop: 0 },
    heading: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.secondarySurface },
    headingCompact: { minHeight: 52, paddingHorizontal: 0, paddingVertical: 6, borderWidth: 0, borderRadius: 0, backgroundColor: 'transparent' },
    headingCopy: { flex: 1, minWidth: 0 },
    title: { fontFamily: fonts.headingBold, fontSize: 16, lineHeight: 22, color: colors.text },
    hint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.textMuted },
    toggle: { fontFamily: fonts.monoMedium, fontSize: 22, color: colors.secondary },
    content: { paddingTop: 12 },
    message: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19, color: colors.secondary, marginBottom: 10 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    item: { width: '100%' },
    itemTablet: { width: '48%' },
    itemDesktop: { width: '32%' },
    pressed: { opacity: 0.8 },
  });
}
