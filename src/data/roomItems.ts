// ─────────────────────────────────────────────────────────────────────────────
// Room Builder — Item Catalog
//
// Positions are defined for a 360 × 300 px canvas base.
// RoomScreen scales every value by:  scale = (screenWidth - 32) / 360
//
// Asset strategy: use `placeholderColor` (colored View) now.
// When you have your PNG files ready, swap `imagePath` into an <Image> source.
// ─────────────────────────────────────────────────────────────────────────────
import { ImageSourcePropType } from 'react-native';

export interface RoomItemLevel {
  /** Human-readable level name shown in the store */
  label: string;
  /** Cost in the shared company budget. 0 = free */
  price: number;
  /** Hex color for the placeholder View block */
  placeholderColor: string;
  /** Future PNG path — e.g. require('../../assets/images/room/bed_lvl1.png') */
  imagePath: ImageSourcePropType;
}

export interface RoomItemPosition {
  /** Distance from the top of the canvas (px, base 360-wide) */
  top: number;
  /** Distance from the left of the canvas (px, base 360-wide) */
  left: number;
  /** Width of the item sprite (px, base 360-wide) */
  width: number;
  /** Height of the item sprite (px, base 360-wide) */
  height: number;
}

export interface RoomItem {
  id: string;
  name: string;
  icon: string;
  /**
   * Isometric paint order.
   * Lower zIndex → rendered first (farther back in scene).
   * Higher zIndex → rendered last (closer to camera, painted on top).
   */
  zIndex: number;
  /**
   * 0  = item not yet placed in the room.
   * 1+ = currently at this level (1-based).
   * levels[currentLevel - 1] = active level data.
   * levels[currentLevel]     = next level data (what the store sells next).
   */
  currentLevel: number;
  /** Absolute position on the shared 360 × 300 canvas */
  position: RoomItemPosition;
  /** Array of upgrade levels, index 0 → Level 1, index 1 → Level 2, … */
  levels: RoomItemLevel[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────────────────────

/**
 * INITIAL_ROOM_ITEMS is the source of truth for the room builder.
 * RoomContext deep-clones this array on mount, then hydrates persisted levels
 * from AsyncStorage.  Never mutate this export directly.
 */
export const INITIAL_ROOM_ITEMS: RoomItem[] = [
  // ── 0. Floor ──────────────────────────────────────────────────────────────
  // Covers the bottom 2/3 of the canvas.  Rendered first (behind everything).
  {
    id: 'floor',
    name: 'Zemin',
    icon: '🟫',
    zIndex: 0,
    currentLevel: 1,
    position: { top: 100, left: -50, width: 360, height: 200 },
    levels: [
      {
        label: 'Parlak Ahşap Zemin',
        price: 0, // Free — lets new players immediately see something in the room
        placeholderColor: '#2C3D50',
        imagePath: require('../../assets/images/jr_muh/new_floor.png'),
      },
      {
        label: 'Koyu Ahşap Laminat',
        price: 800,
        placeholderColor: '#6B4E3D',
        imagePath: require('../../assets/images/jr_muh/dark_wood_floor.png'),
      },
      {
        label: 'Mermer Taban',
        price: 2000,
        placeholderColor: '#8B9EA3',
        imagePath: require('../../assets/images/jr_muh/dark_grey_floor.png'),
      },
    ],
  },

  // ── 1. Bookshelf ──────────────────────────────────────────────────────────
  // Left-back corner; zIndex 1 → sits in front of floor but behind wardrobe.
  {
    id: 'bookshelf',
    name: 'Kitaplık',
    icon: '📚',
    zIndex: 1,
    currentLevel: 0,
    position: { top: 20, left: 20, width: 80, height: 120 },
    levels: [
      {
        label: 'Temel Kitaplık',
        price: 500,
        placeholderColor: '#3D6647',
        imagePath: require('../../assets/images/jr_muh/tall_bookshelf.png'),
      },
      {
        label: 'Teknik Kitaplık (Dolu)',
        price: 1200,
        placeholderColor: '#56905D',
        imagePath: require('../../assets/images/jr_muh/large_bookshelf.png'),
      },
    ],
  },

  // ── 2. Wardrobe ───────────────────────────────────────────────────────────
  // Right-back corner; taller than bookshelf, slightly higher zIndex.
  {
    id: 'wardrobe',
    name: 'Gardırop',
    icon: '🚪',
    zIndex: 2,
    currentLevel: 0,
    position: { top: 10, left: 258, width: 92, height: 140 },
    levels: [
      {
        label: 'Temel Gardırop',
        price: 900,
        placeholderColor: '#3A5070',
        imagePath: require('../../assets/images/jr_muh/wood_gardrop.png'),
      },
      {
        label: 'Gelişmiş Gardırop',
        price: 1800,
        placeholderColor: '#4A6090',
        imagePath: require('../../assets/images/jr_muh/blue_gardrop.png'),
      },
    ],
  },

  // ── 3. Bed ────────────────────────────────────────────────────────────────
  // Left-front area; overlaps the floor.
  {
    id: 'bed',
    name: 'Yatak',
    icon: '🛏️',
    zIndex: 3,
    currentLevel: 0,
    position: { top: 148, left: 10, width: 145, height: 105 },
    levels: [
      {
        label: 'Temel Yatak',
        price: 600,
        placeholderColor: '#6B3D7A',
        imagePath: require('../../assets/images/jr_muh/wood_single_bed.png'),
      },
      {
        label: 'Çift Kişilik Ahşap Yatak',
        price: 1400,
        placeholderColor: '#8B5D9A',
        imagePath: require('../../assets/images/jr_muh/wood_double_bed.png'),
      },
      {
        label: 'Modern Yatak',
        price: 1400,
        placeholderColor: '#8B5D9A',
        imagePath: require('../../assets/images/jr_muh/modern_double_bed.png'),
      },
    ],
  },

  // ── 4. Desk ───────────────────────────────────────────────────────────────
  // Right-front area; highest zIndex — frontmost in the scene.
  {
    id: 'desk',
    name: 'Çalışma Masası',
    icon: '🖥️',
    zIndex: 4,
    currentLevel: 0,
    position: { top: 143, left: 185, width: 165, height: 105 },
    levels: [
      {
        label: 'Temel Masa',
        price: 700,
        placeholderColor: '#7A5C3E',
        imagePath: require('../../assets/images/jr_muh/wood_table.png'),
      },
      {
        label: 'Standing Desk',
        price: 1500,
        placeholderColor: '#9A7C5E',
        imagePath: require('../../assets/images/jr_muh/white_table.png'),
      },
      {
        label: 'Dual-Monitor Kurulum',
        price: 3000,
        placeholderColor: '#BAA07E',
        imagePath: require('../../assets/images/jr_muh/glass_table.png'),
      },
    ],
  },
];

