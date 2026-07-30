// ─────────────────────────────────────────────────────────────────────────────
// RoomContext — manages room item state and upgrade logic.
//
// Design decisions:
//   • Budget lives in ReputationContext.  RoomProvider consumes it via
//     useReputation(), so RoomProvider MUST be mounted inside ReputationProvider.
//   • Only the currentLevel per item is persisted to AsyncStorage (not the
//     full item shape), so catalog changes in roomItems.ts don't corrupt saves.
//   • upgradeItem uses a ref for budget to avoid stale-closure reads.
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_ROOM_ITEMS, type RoomItem } from '../data/roomItems';
import { useReputation } from './ReputationContext';

// ── Public types ──────────────────────────────────────────────────────────────

export type UpgradeResult =
  | 'ok'               // Successful purchase / level-up
  | 'max_level'        // Item already at max level
  | 'insufficient_funds'; // Budget too low

interface RoomContextValue {
  /** Full array of room items, including unplaced ones (currentLevel === 0). */
  roomItems: RoomItem[];
  /**
   * Attempt to advance `itemId` to the next level.
   * Deducts the next level's price from the shared company budget.
   * Returns a discriminated result string.
   */
  upgradeItem: (itemId: string) => Promise<UpgradeResult>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const RoomContext = createContext<RoomContextValue | null>(null);

const ROOM_STORAGE_KEY = '@shipit_room_levels';

// ── Provider ─────────────────────────────────────────────────────────────────

export function RoomProvider({ children }: { children: React.ReactNode }) {
  // Tap into the shared economy — only need budget (for the pre-check) and
  // applyOutcome (to deduct the price and persist).
  const { budget, applyOutcome } = useReputation();

  const [roomItems, setRoomItems] = useState<RoomItem[]>(INITIAL_ROOM_ITEMS);

  // Refs so async callbacks never see stale closure values.
  const roomItemsRef = useRef<RoomItem[]>(INITIAL_ROOM_ITEMS);
  const budgetRef = useRef(budget);
  // Keep budgetRef in sync on every render (runs before any effect / callback).
  budgetRef.current = budget;

  // ── Persistence: load ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(ROOM_STORAGE_KEY);
        if (!raw) return;

        // Stored shape: { [itemId]: currentLevel }
        const savedLevels: Record<string, number> = JSON.parse(raw);

        const restored = INITIAL_ROOM_ITEMS.map((item) => ({
          ...item,
          currentLevel: savedLevels[item.id] ?? item.currentLevel,
        }));
        roomItemsRef.current = restored;
        setRoomItems(restored);
      } catch (e) {
        console.error('[RoomContext] Oda ögeleri yüklenemedi:', e);
      }
    };
    load();
  }, []);

  // ── Persistence: save helper ─────────────────────────────────────────────
  const saveToStorage = async (items: RoomItem[]) => {
    try {
      const levels: Record<string, number> = {};
      items.forEach((i) => {
        levels[i.id] = i.currentLevel;
      });
      await AsyncStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(levels));
    } catch (e) {
      console.error('[RoomContext] Oda ögeleri kaydedilemedi:', e);
    }
  };

  // ── upgradeItem ──────────────────────────────────────────────────────────
  const upgradeItem = useCallback(
    async (itemId: string): Promise<UpgradeResult> => {
      const item = roomItemsRef.current.find((i) => i.id === itemId);

      // Guard: unknown id or already maxed out
      if (!item || item.currentLevel >= item.levels.length) return 'max_level';

      // levels is 0-based; currentLevel 0 → wants levels[0] (Level 1)
      const nextLevelData = item.levels[item.currentLevel];

      // Budget pre-check (free items bypass this)
      if (nextLevelData.price > 0 && budgetRef.current < nextLevelData.price) {
        return 'insufficient_funds';
      }

      // Deduct from the shared economy (0 score delta, negative budget delta)
      if (nextLevelData.price > 0) {
        await applyOutcome(0, -nextLevelData.price);
      }

      // Update state
      const updated = roomItemsRef.current.map((i) =>
        i.id === itemId ? { ...i, currentLevel: i.currentLevel + 1 } : i,
      );
      roomItemsRef.current = updated;
      setRoomItems(updated);

      await saveToStorage(updated);
      return 'ok';
    },
    [applyOutcome],
  );

  // ── Context value ────────────────────────────────────────────────────────
  const value = useMemo<RoomContextValue>(
    () => ({ roomItems, upgradeItem }),
    [roomItems, upgradeItem],
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('[RoomContext] useRoom must be used inside <RoomProvider>');
  return ctx;
}
AsyncStorage.clear()