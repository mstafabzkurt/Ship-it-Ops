import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { upsertMyLeaderboardProfile, getLeaderboardErrorMessage } from '../services/leaderboard';
import { buildLeaderboardProjection, type LeaderboardProjection } from '../utils/leaderboard';
import { useAuth } from './AuthContext';
import { useReputation } from './ReputationContext';

export type LeaderboardSyncStatus = 'idle' | 'waiting' | 'syncing' | 'synced' | 'error';

interface LeaderboardContextValue {
  projection: LeaderboardProjection;
  syncStatus: LeaderboardSyncStatus;
  syncError: string | null;
  lastSyncedAt: number | null;
  retrySync: () => void;
}

const LeaderboardContext = createContext<LeaderboardContextValue | null>(null);
const SYNC_COALESCE_MS = 900;

export function LeaderboardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const {
    companyName,
    currentRank,
    correctAnswers,
    wrongAnswers,
    rankingScore,
    rankingOutcomeStats,
    equippedAvatarId,
    equippedAvatarFrameId,
    isLoaded,
    saveStatus,
  } = useReputation();
  const playerSaveReady = isLoaded && (saveStatus === 'ready' || saveStatus === 'saving');
  const [syncStatus, setSyncStatus] = useState<LeaderboardSyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const lastSyncedSignatureRef = useRef('');
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());

  const projection = useMemo(() => buildLeaderboardProjection({
    companyName,
    avatarId: equippedAvatarId,
    avatarFrameId: equippedAvatarFrameId,
    careerRank: currentRank,
    correctAnswers,
    wrongAnswers,
    rankingScore,
    rankingOutcomeStats,
  }), [
    companyName,
    correctAnswers,
    currentRank,
    equippedAvatarFrameId,
    equippedAvatarId,
    rankingOutcomeStats,
    rankingScore,
    wrongAnswers,
  ]);

  const signature = useMemo(() => JSON.stringify([
    user?.id ?? '',
    projection.companyName,
    projection.avatarId,
    projection.avatarFrameId,
    projection.careerRank,
    projection.rankingScore,
    projection.successRate,
    projection.successCount,
  ]), [projection, user?.id]);

  const latestRef = useRef({
    userId: user?.id ?? null,
    isLoaded: playerSaveReady,
    projection,
    signature,
  });
  latestRef.current = {
    userId: user?.id ?? null,
    isLoaded: playerSaveReady,
    projection,
    signature,
  };

  const queueSync = useCallback((force = false) => {
    syncQueueRef.current = syncQueueRef.current.then(async () => {
      const snapshot = latestRef.current;
      if (!snapshot.userId || !snapshot.isLoaded) return;
      if (!force && lastSyncedSignatureRef.current === snapshot.signature) return;

      setSyncStatus('syncing');
      setSyncError(null);

      try {
        await upsertMyLeaderboardProfile(snapshot.userId, snapshot.projection);
        if (latestRef.current.userId !== snapshot.userId) return;
        lastSyncedSignatureRef.current = snapshot.signature;
        setLastSyncedAt(Date.now());
        setSyncStatus('synced');
      } catch (error) {
        if (latestRef.current.userId !== snapshot.userId) return;
        setSyncError(getLeaderboardErrorMessage(error));
        setSyncStatus('error');
      }
    });
  }, []);

  useEffect(() => {
    if (!user?.id) {
      lastSyncedSignatureRef.current = '';
      setSyncStatus('idle');
      setSyncError(null);
      setLastSyncedAt(null);
      return undefined;
    }
    if (!playerSaveReady) {
      setSyncStatus('waiting');
      return undefined;
    }
    if (lastSyncedSignatureRef.current === signature) return undefined;

    setSyncStatus((current) => (current === 'syncing' ? current : 'waiting'));
    const timer = setTimeout(() => queueSync(), SYNC_COALESCE_MS);
    return () => clearTimeout(timer);
  }, [playerSaveReady, queueSync, signature, user?.id]);

  const retrySync = useCallback(() => {
    queueSync(true);
  }, [queueSync]);

  const value = useMemo<LeaderboardContextValue>(() => ({
    projection,
    syncStatus,
    syncError,
    lastSyncedAt,
    retrySync,
  }), [lastSyncedAt, projection, retrySync, syncError, syncStatus]);

  return <LeaderboardContext.Provider value={value}>{children}</LeaderboardContext.Provider>;
}

export function useLeaderboard(): LeaderboardContextValue {
  const context = useContext(LeaderboardContext);
  if (!context) throw new Error('useLeaderboard, LeaderboardProvider içinde kullanılmalı');
  return context;
}
