import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { usePathname } from 'expo-router';
import { listDuels, type DuelSummary } from '../services/duels';
import { useAuth } from './AuthContext';
import { useReputation } from './ReputationContext';

interface InvitationsValue {
  duels: DuelSummary[];
  busy: boolean;
  refresh: () => Promise<void>;
  runAction: (action: () => Promise<DuelSummary>) => Promise<DuelSummary | null>;
}
const Context = createContext<InvitationsValue | null>(null);
const foreground = () => AppState.currentState !== 'background' && AppState.currentState !== 'inactive'
  && (Platform.OS !== 'web' || typeof document === 'undefined' || document.visibilityState !== 'hidden');

/** One foreground-only feed for chat and the global notice. Identity remount is provided by the app shell. */
export function DuelInvitationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isLoaded } = useReputation();
  const pathname = usePathname();
  const enabled = !!user && isLoaded && !pathname.startsWith('/duel/');
  const [duels, setDuels] = useState<DuelSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const live = useRef(false);
  const allowed = useRef(enabled);
  allowed.current = enabled;
  const sequence = useRef(0);
  const reading = useRef(false);
  const mutating = useRef(false);

  const refresh = useCallback(async () => {
    if (!live.current || !allowed.current || !foreground() || reading.current || mutating.current) return;
    reading.current = true;
    const version = sequence.current;
    try {
      const next = await listDuels();
      if (live.current && allowed.current && sequence.current === version) setDuels(next);
    } catch {
      // A notice must never interrupt the app for a transient read failure.
    } finally { reading.current = false; }
  }, []);

  useEffect(() => {
    live.current = true;
    return () => { live.current = false; sequence.current += 1; };
  }, []);

  useEffect(() => {
    if (!enabled) { sequence.current += 1; return; }
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    const wake = () => { if (foreground()) void refresh(); };
    const listener = AppState.addEventListener('change', wake);
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.addEventListener('visibilitychange', wake);
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.addEventListener('focus', wake);
    return () => {
      sequence.current += 1;
      clearInterval(timer);
      listener.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') document.removeEventListener('visibilitychange', wake);
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.removeEventListener('focus', wake);
    };
  }, [enabled, refresh]);

  const runAction = useCallback(async (action: () => Promise<DuelSummary>) => {
    if (!live.current || !allowed.current || !foreground() || mutating.current) return null;
    mutating.current = true;
    sequence.current += 1;
    setBusy(true);
    try {
      const next = await action();
      if (!live.current) return null;
      setDuels((current) => [next, ...current.filter((duel) => duel.id !== next.id)]);
      return next;
    } finally {
      mutating.current = false;
      if (live.current) { setBusy(false); void refresh(); }
    }
  }, [refresh]);
  const value = useMemo(() => ({ duels, busy, refresh, runAction }), [duels, busy, refresh, runAction]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDuelInvitations() {
  const value = useContext(Context);
  if (!value) throw new Error('DuelInvitationsProvider is required');
  return value;
}
