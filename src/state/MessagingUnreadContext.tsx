import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { getDirectMessageUnreadTotal, subscribeToIncomingDirectMessages } from '../services/directMessaging';
import { useAuth } from './AuthContext';
import { useReputation } from './ReputationContext';

interface MessagingUnreadContextValue {
  unreadCount: number;
  hasLoaded: boolean;
  refreshUnread: () => Promise<void>;
}

const MessagingUnreadContext = createContext<MessagingUnreadContextValue | null>(null);
const REALTIME_REFRESH_DEBOUNCE_MS = 180;

export function MessagingUnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isLoaded } = useReputation();
  const userId = user?.id ?? null;
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const activeUserIdRef = useRef<string | null>(null);
  const requestSequenceRef = useRef(0);

  const refreshUnread = useCallback(async () => {
    if (!userId || !isLoaded || activeUserIdRef.current !== userId) return;
    const requestSequence = ++requestSequenceRef.current;
    try {
      const nextCount = await getDirectMessageUnreadTotal();
      if (activeUserIdRef.current !== userId || requestSequence !== requestSequenceRef.current) return;
      setUnreadCount(nextCount);
      setHasLoaded(true);
    } catch {
      // Keep the last authoritative value; focus or a Realtime reconnect retries.
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    if (!userId || !isLoaded) {
      activeUserIdRef.current = null;
      requestSequenceRef.current += 1;
      setUnreadCount(0);
      setHasLoaded(false);
      return undefined;
    }

    activeUserIdRef.current = userId;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        void refreshUnread();
      }, REALTIME_REFRESH_DEBOUNCE_MS);
    };

    // Subscribe first, then fetch. SUBSCRIBED also reconciles events that may
    // have arrived between the initial RPC and the Realtime channel joining.
    const unsubscribe = subscribeToIncomingDirectMessages(userId, scheduleRefresh, (status) => {
      if (status === 'SUBSCRIBED') scheduleRefresh();
    });
    void refreshUnread();

    const appStateSubscription = Platform.OS === 'web'
      ? null
      : AppState.addEventListener('change', (state) => {
        if (state === 'active') scheduleRefresh();
      });
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('focus', scheduleRefresh);
    }

    return () => {
      activeUserIdRef.current = null;
      requestSequenceRef.current += 1;
      if (refreshTimer) clearTimeout(refreshTimer);
      unsubscribe();
      appStateSubscription?.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('focus', scheduleRefresh);
      }
    };
  }, [isLoaded, refreshUnread, userId]);

  const value = useMemo<MessagingUnreadContextValue>(() => ({
    unreadCount,
    hasLoaded,
    refreshUnread,
  }), [hasLoaded, refreshUnread, unreadCount]);

  return <MessagingUnreadContext.Provider value={value}>{children}</MessagingUnreadContext.Provider>;
}

export function useMessagingUnread(): MessagingUnreadContextValue {
  const context = useContext(MessagingUnreadContext);
  if (!context) throw new Error('useMessagingUnread must be used inside MessagingUnreadProvider');
  return context;
}
