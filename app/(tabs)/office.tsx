import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useReputation } from '../../src/state/ReputationContext';
import { OFFICE_ITEMS } from '../../src/data/storeItems';
import { colors } from '../../src/theme/colors';
import { fonts, fontSizes } from '../../src/theme/typography';

// ── Assets ─────────────────────────────────────────────────────────────────
const ROOM_BG = require('../../assets/images/jr_muh/junior_room.png');
const SPRITE_SHEET = require('../../assets/images/jr_muh/office_furniture.png');

// ── Sprite Sheet Configuration ──────────────────────────────────────────────
// The spritesheet is a pixel-art sheet where each tile = 32×32 px.
// Sheet dimensions: ~640px wide × ~512px tall (20 cols × 16 rows of 32px tiles).
// We scale up sprites by SPRITE_SCALE for display on modern screens.
const TILE = 32;
const SPRITE_SCALE = 3; // each 32px tile → 96px display
const SPRITE_SHEET_W = 640;
const SPRITE_SHEET_H = 512;

/**
 * SpriteItem: describes a clipped region from the spritesheet.
 * col, row = 0-indexed column/row position on the sheet.
 * colSpan, rowSpan = how many tiles wide/tall this item is.
 */
interface SpriteConfig {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

/**
 * OfficeSlot: a positioned slot in the room.
 * Maps a store item ID → sprite → room position (% of container).
 */
interface OfficeSlot {
  storeItemId: string;
  label: string;
  icon: string;
  sprite: SpriteConfig;
  /** Position in the room (% of room width/height) */
  left: number; // %
  top: number;  // %
  /** Display size override (optional, defaults to sprite scaled size) */
  displayW?: number;
  displayH?: number;
}

// ── Sprite coordinate map ────────────────────────────────────────────────────
// Identified from visual inspection of Office_Furniture_32x32_Shadow.png.
// Row 0 = top of sheet. Each item takes 2–3 tiles wide × 2–3 tiles tall.

const OFFICE_SLOTS: OfficeSlot[] = [
  {
    storeItemId: 'standing_desk',
    label: 'Ergonomik Masa',
    icon: '🪑',
    // Desk: top-right area of sheet, approx col 14, row 0, 2×2 tiles
    sprite: { col: 14, row: 0, colSpan: 2, rowSpan: 2 },
    left: 52,
    top: 38,
    displayW: TILE * SPRITE_SCALE * 2,
    displayH: TILE * SPRITE_SCALE * 2,
  },
  {
    storeItemId: 'dual_monitor',
    label: 'Çift Monitör',
    icon: '🖥️',
    // Computer monitor: col 4, row 7, 2×2 tiles (row 7 has monitors/computers)
    sprite: { col: 4, row: 7, colSpan: 2, rowSpan: 2 },
    left: 54,
    top: 30,
    displayW: TILE * SPRITE_SCALE * 2,
    displayH: TILE * SPRITE_SCALE * 2,
  },
  {
    storeItemId: 'office_plant',
    label: 'Ofis Bitkisi',
    icon: '🪴',
    // Plant: col 9, row 1, 1×3 tiles (tall plant)
    sprite: { col: 9, row: 1, colSpan: 1, rowSpan: 3 },
    left: 28,
    top: 22,
    displayW: TILE * SPRITE_SCALE,
    displayH: TILE * SPRITE_SCALE * 3,
  },
  {
    storeItemId: 'coffee_machine',
    label: 'Kahve Makinesi',
    icon: '☕',
    // Small appliance/coffee: col 0, row 7, 1×2 tiles
    sprite: { col: 0, row: 7, colSpan: 1, rowSpan: 2 },
    left: 20,
    top: 55,
    displayW: TILE * SPRITE_SCALE,
    displayH: TILE * SPRITE_SCALE * 2,
  },
  {
    storeItemId: 'whiteboard',
    label: 'Beyaz Tahta',
    icon: '📋',
    // Whiteboard / large board: col 0, row 13, 3×1 tiles (wide board)
    sprite: { col: 0, row: 13, colSpan: 3, rowSpan: 2 },
    left: 35,
    top: 55,
    displayW: TILE * SPRITE_SCALE * 3,
    displayH: TILE * SPRITE_SCALE * 2,
  },
  {
    storeItemId: 'server_rack',
    label: 'Sunucu Rafı',
    icon: '🗄️',
    // Server/rack cabinet: col 0, row 0, 2×4 tiles (tall cabinet on top-left)
    sprite: { col: 0, row: 0, colSpan: 2, rowSpan: 4 },
    left: 68,
    top: 22,
    displayW: TILE * SPRITE_SCALE * 2,
    displayH: TILE * SPRITE_SCALE * 4,
  },
  {
    storeItemId: 'team_snacks',
    label: 'Atıştırmalıklar',
    icon: '🍕',
    // Small table/snack area: col 12, row 10, 2×2
    sprite: { col: 12, row: 10, colSpan: 2, rowSpan: 2 },
    left: 18,
    top: 38,
    displayW: TILE * SPRITE_SCALE * 2,
    displayH: TILE * SPRITE_SCALE * 2,
  },
  {
    storeItemId: 'office_expansion',
    label: 'Ofis Genişletme',
    icon: '🏢',
    // Reception/large desk: col 17, row 12, 3×3
    sprite: { col: 17, row: 12, colSpan: 3, rowSpan: 3 },
    left: 42,
    top: 45,
    displayW: TILE * SPRITE_SCALE * 3,
    displayH: TILE * SPRITE_SCALE * 3,
  },
];

// ── Animated glow slot ────────────────────────────────────────────────────────
function GlowSlot({ label, icon }: { label: string; icon: string }) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.glowSlot, { opacity: pulse }]}>
      <Text style={styles.glowSlotIcon}>{icon}</Text>
      <Text style={styles.glowSlotLabel}>{label}</Text>
    </Animated.View>
  );
}

// ── Sprite clipping component ─────────────────────────────────────────────────
function OfficeSprite({ sprite, displayW, displayH }: {
  sprite: SpriteConfig;
  displayW: number;
  displayH: number;
}) {
  const scaleX = displayW / (sprite.colSpan * TILE);
  const scaleY = displayH / (sprite.rowSpan * TILE);
  const sheetDisplayW = SPRITE_SHEET_W * scaleX;
  const sheetDisplayH = SPRITE_SHEET_H * scaleY;
  const offsetX = -(sprite.col * TILE * scaleX);
  const offsetY = -(sprite.row * TILE * scaleY);

  return (
    <View style={{ width: displayW, height: displayH, overflow: 'hidden' }}>
      <Image
        source={SPRITE_SHEET}
        style={{
          width: sheetDisplayW,
          height: sheetDisplayH,
          transform: [{ translateX: offsetX }, { translateY: offsetY }],
        }}
        resizeMode="stretch"
      />
    </View>
  );
}

// ── Office Level Progress Bar ─────────────────────────────────────────────────
function OfficeLevelBar({ purchasedCount, total }: { purchasedCount: number; total: number }) {
  const progress = total > 0 ? purchasedCount / total : 0;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(barAnim, { toValue: progress, useNativeDriver: false, tension: 40, friction: 8 }).start();
  }, [progress]);

  const levelLabel =
    purchasedCount === 0 ? 'Boş Ofis' :
      purchasedCount < 3 ? 'Başlangıç Ofisi' :
        purchasedCount < 6 ? 'Gelişen Ofis' : 'Premium Ofis';

  return (
    <View style={styles.levelBarWrap}>
      <View style={styles.levelBarHeader}>
        <Text style={styles.levelBarTitle}>{levelLabel}</Text>
        <Text style={styles.levelBarCount}>{purchasedCount}/{total} öğe</Text>
      </View>
      <View style={styles.levelBarTrack}>
        <Animated.View
          style={[
            styles.levelBarFill,
            {
              width: barAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function OfficeScreen() {
  const router = useRouter();
  const { currentRank, inventory } = useReputation();
  const { width: screenWidth } = useWindowDimensions();

  // Room display size — keep it square and fill the screen width
  const roomSize = Math.min(screenWidth, 480);

  // How many office items are purchased
  const purchasedOfficeItems = OFFICE_SLOTS.filter(slot =>
    inventory.includes(slot.storeItemId),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🏢 Şirketim / Ofis</Text>
            <Text style={styles.headerSub}>
              {currentRank.name} · Junior Seviyesi
            </Text>
          </View>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)/store')}
            activeOpacity={0.8}
          >
            <Text style={styles.shopButtonText}>🛍️ Mağaza</Text>
          </TouchableOpacity>
        </View>

        {/* ── Level Progress Bar ──────────────────────────────────────────── */}
        <View style={styles.levelSection}>
          <OfficeLevelBar
            purchasedCount={purchasedOfficeItems.length}
            total={OFFICE_SLOTS.length}
          />
        </View>

        {/* ── Isometric Room ──────────────────────────────────────────────── */}
        <View style={[styles.roomContainer, { width: roomSize, height: roomSize * 0.92 }]}>
          {/* Room background */}
          <Image
            source={ROOM_BG}
            style={styles.roomBg}
            resizeMode="cover"
          />

          {/* Item slots */}
          {OFFICE_SLOTS.map((slot) => {
            const owned = inventory.includes(slot.storeItemId);
            const dw = slot.displayW ?? TILE * SPRITE_SCALE * slot.sprite.colSpan;
            const dh = slot.displayH ?? TILE * SPRITE_SCALE * slot.sprite.rowSpan;

            return (
              <View
                key={slot.storeItemId}
                style={[
                  styles.slotAbsolute,
                  {
                    left: `${slot.left}%` as any,
                    top: `${slot.top}%` as any,
                    width: dw,
                    height: dh,
                  },
                ]}
              >
                {owned ? (
                  <OfficeSprite
                    sprite={slot.sprite}
                    displayW={dw}
                    displayH={dh}
                  />
                ) : (
                  <GlowSlot label={slot.label} icon={slot.icon} />
                )}
              </View>
            );
          })}
        </View>

        {/* ── Item Legend ─────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Ofis Öğeleri</Text>
        <View style={styles.legendGrid}>
          {OFFICE_SLOTS.map((slot) => {
            const owned = inventory.includes(slot.storeItemId);
            const storeItem = OFFICE_ITEMS.find(i => i.id === slot.storeItemId);
            return (
              <View key={slot.storeItemId} style={[styles.legendCard, owned && styles.legendCardOwned]}>
                <Text style={styles.legendIcon}>{slot.icon}</Text>
                <View style={styles.legendInfo}>
                  <Text style={styles.legendTitle} numberOfLines={1}>{slot.label}</Text>
                  {storeItem && (
                    <Text style={styles.legendPrice}>
                      {owned ? '✓ Sahip' : `$${storeItem.price.toLocaleString('tr-TR')}`}
                    </Text>
                  )}
                </View>
                <View style={[styles.legendStatus, owned ? styles.legendStatusOwned : styles.legendStatusLocked]}>
                  <Text style={[styles.legendStatusText, owned ? styles.legendStatusTextOwned : styles.legendStatusTextLocked]}>
                    {owned ? 'Aktif' : 'Kilitli'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* CTA if nothing purchased */}
        {purchasedOfficeItems.length === 0 && (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/(tabs)/store')}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaButtonText}>
              🛍️ Ofisini Dekore Etmeye Başla
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 36,
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    width: '100%',
  },
  headerTitle: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes['3xl'],
    color: colors.textPrimary,
  },
  headerSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  shopButton: {
    backgroundColor: colors.positiveBg,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  shopButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.accentPositive,
  },

  // Level bar
  levelSection: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  levelBarWrap: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  levelBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBarTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  levelBarCount: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  levelBarTrack: {
    height: 6,
    backgroundColor: colors.panelAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
    backgroundColor: colors.accentPositive,
    borderRadius: 3,
  },

  // Room
  roomContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#1a1a2e',
    alignSelf: 'center',
  },
  roomBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  slotAbsolute: {
    position: 'absolute',
  },

  // Glow slot (locked item placeholder)
  glowSlot: {
    backgroundColor: 'rgba(53,201,163,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(53,201,163,0.4)',
    borderRadius: 8,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    minWidth: 40,
    minHeight: 40,
  },
  glowSlotIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  glowSlotLabel: {
    fontFamily: fonts.body,
    fontSize: 7,
    color: colors.accentPositive,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.8,
  },

  // Section label
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },

  // Item legend
  legendGrid: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 8,
  },
  legendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  legendCardOwned: {
    borderColor: colors.positiveBorder,
    backgroundColor: colors.positiveBg,
  },
  legendIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  legendInfo: {
    flex: 1,
  },
  legendTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  legendPrice: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  legendStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  legendStatusOwned: {
    backgroundColor: colors.positiveBg,
    borderColor: colors.positiveBorder,
  },
  legendStatusLocked: {
    backgroundColor: colors.panelAlt,
    borderColor: colors.border,
  },
  legendStatusText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
  },
  legendStatusTextOwned: {
    color: colors.accentPositive,
  },
  legendStatusTextLocked: {
    color: colors.textMuted,
  },

  // CTA
  ctaButton: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: colors.accentPositive,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    alignSelf: 'stretch',
  },
  ctaButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.bgBase,
  },
});
