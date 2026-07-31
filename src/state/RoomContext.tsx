// ─────────────────────────────────────────────────────────────────────────────
// RoomContext — manages room level state and upgrade logic.
//
// Design decisions:
//   • Budget lives in ReputationContext. RoomProvider consumes it via
//     useReputation(), so RoomProvider MUST be mounted inside ReputationProvider.
//   • Only the roomLevel (integer 0-17) is persisted to AsyncStorage.
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
import { useReputation } from './ReputationContext';

// ── Prices for each upgrade ───────────────────────────────────────────────────
export const NEXT_LEVEL_PRICES = [
  0,       // 0 -> 1 (free initial placement)
  100,     // 1 -> 2
  250,     // 2 -> 3
  500,     // 3 -> 4
  1000,    // 4 -> 5
  1500,    // 5 -> 6
  2000,    // 6 -> 7
  3000,    // 7 -> 8
  4000,    // 8 -> 9
  5000,    // 9 -> 10
  7500,    // 10 -> 11
  10000,   // 11 -> 12
  15000,   // 12 -> 13
  20000,   // 13 -> 14
  30000,   // 14 -> 15
  50000,   // 15 -> 16
  75000,   // 16 -> 17
];

export const MAX_ROOM_LEVEL = 17;

// ── Public types ──────────────────────────────────────────────────────────────

export type UpgradeResult =
  | 'ok'               // Successful purchase / level-up
  | 'max_level'        // Already at max level
  | 'insufficient_funds'; // Budget too low

interface RoomContextValue {
  /** Current room level (0 to 17) */
  roomLevel: number;
  /**
   * Attempt to advance room to the next level.
   * Deducts the next level's price from the shared company budget.
   * Returns a discriminated result string.
   */
  upgradeRoom: () => Promise<UpgradeResult>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const RoomContext = createContext<RoomContextValue | null>(null);

const ROOM_STORAGE_KEY = '@shipit_room_level';

// ── Provider ─────────────────────────────────────────────────────────────────

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const { budget, applyOutcome } = useReputation();
  const [roomLevel, setRoomLevel] = useState<number>(0);

  // Refs so async callbacks never see stale closure values.
  const roomLevelRef = useRef<number>(0);
  const budgetRef = useRef(budget);
  budgetRef.current = budget;

  // ── Persistence: load ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(ROOM_STORAGE_KEY);
        if (!raw) return;

        const savedLevel = parseInt(raw, 10);
        if (!isNaN(savedLevel) && savedLevel >= 0 && savedLevel <= MAX_ROOM_LEVEL) {
          roomLevelRef.current = savedLevel;
          setRoomLevel(savedLevel);
        }
      } catch (e) {
        console.error('[RoomContext] Oda seviyesi yüklenemedi:', e);
      }
    };
    load();
  }, []);

  // ── Persistence: save helper ─────────────────────────────────────────────
  const saveToStorage = async (level: number) => {
    try {
      await AsyncStorage.setItem(ROOM_STORAGE_KEY, level.toString());
    } catch (e) {
      console.error('[RoomContext] Oda seviyesi kaydedilemedi:', e);
    }
  };

  // ── upgradeRoom ──────────────────────────────────────────────────────────
  const upgradeRoom = useCallback(async (): Promise<UpgradeResult> => {
    const currentLevel = roomLevelRef.current;

    // Guard: already maxed out
    if (currentLevel >= MAX_ROOM_LEVEL) return 'max_level';

    const nextPrice = NEXT_LEVEL_PRICES[currentLevel];

    // Budget pre-check
    if (nextPrice > 0 && budgetRef.current < nextPrice) {
      return 'insufficient_funds';
    }

    // Deduct from the shared economy
    if (nextPrice > 0) {
      await applyOutcome(0, -nextPrice);
    }

    // Update state
    const newLevel = currentLevel + 1;
    roomLevelRef.current = newLevel;
    setRoomLevel(newLevel);

    await saveToStorage(newLevel);
    return 'ok';
  }, [applyOutcome]);

  // ── Context value ────────────────────────────────────────────────────────
  const value = useMemo<RoomContextValue>(
    () => ({ roomLevel, upgradeRoom }),
    [roomLevel, upgradeRoom],
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('[RoomContext] useRoom must be used inside <RoomProvider>');
  return ctx;
}