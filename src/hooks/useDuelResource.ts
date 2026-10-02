import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

/** Focused, foreground-only polling; mutations invalidate older reads. */
export function useDuelResource<T>(key: string, load: () => Promise<T>, intervalMs: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(false);
  const [receivedAt, setReceivedAt] = useState(0);
  const generation = useRef(0);
  const request = useRef<number | null>(null);
  const sequence = useRef(0);
  const focused = useRef(false);
  const foreground = useRef(true);
  const mutation = useRef<number | null>(null);
  const actionError = useRef<string | null>(null);
  const loader = useRef(load);
  loader.current = load;

  const refresh = useCallback(async () => {
    if (!focused.current || !foreground.current || request.current !== null || mutation.current) return;
    const version = generation.current;
    const id = ++sequence.current;
    request.current = id;
    const sentAt = Date.now();
    try {
      const next = await loader.current();
      if (generation.current !== version || !focused.current || !foreground.current) return;
      setData(next);
      setReceivedAt((sentAt + Date.now()) / 2);
      setError(actionError.current);
    } catch (cause) {
      if (generation.current === version && focused.current && foreground.current) {
        setError(cause instanceof Error ? cause.message : 'Bağlantı kurulamadı. Tekrar dene.');
      }
    } finally {
      if (request.current === id) request.current = null;
      if (generation.current === version && focused.current) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    generation.current += 1;
    request.current = null;
    focused.current = true;
    mutation.current = null;
    setBusy(false);
    setData(null);
    actionError.current = null;
    setError(null);
    setLoading(true);
    const isForeground = () => AppState.currentState !== 'background'
      && AppState.currentState !== 'inactive'
      && (Platform.OS !== 'web' || typeof document === 'undefined' || document.visibilityState !== 'hidden');
    const resync = () => {
      foreground.current = isForeground();
      setActive(foreground.current);
      if (foreground.current) void refresh();
      else { generation.current += 1; request.current = null; }
    };
    resync();
    const listener = AppState.addEventListener('change', resync);
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.addEventListener('visibilitychange', resync);
    const timer = setInterval(() => { void refresh(); }, intervalMs);
    return () => {
      focused.current = false;
      generation.current += 1;
      request.current = null;
      setActive(false);
      clearInterval(timer);
      listener.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') document.removeEventListener('visibilitychange', resync);
    };
  }, [key, intervalMs, refresh]));

  const runAction = useCallback(async (action: () => Promise<T>) => {
    if (mutation.current !== null || !focused.current || !foreground.current) return undefined;
    const actionId = ++sequence.current;
    mutation.current = actionId;
    const version = ++generation.current;
    request.current = null;
    setBusy(true);
    actionError.current = null;
    setError(null);
    const sentAt = Date.now();
    try {
      const next = await action();
      if (generation.current !== version || !focused.current || !foreground.current) return undefined;
      setData(next);
      setReceivedAt((sentAt + Date.now()) / 2);
      setLoading(false);
      return next;
    } catch (cause) {
      if (generation.current === version && focused.current) {
        actionError.current = cause instanceof Error ? cause.message : 'İşlem tamamlanamadı. Tekrar dene.';
        setError(actionError.current);
      }
      return undefined;
    } finally {
      if (mutation.current === actionId) {
        mutation.current = null;
        if (focused.current) setBusy(false);
        // Resync even when an answer timed out after the server stored it.
        if (focused.current && foreground.current) void refresh();
      }
    }
  }, [refresh]);

  const retry = useCallback(async () => {
    actionError.current = null;
    setError(null);
    await refresh();
  }, [refresh]);
  return { data, error, loading, busy, active, receivedAt, refresh: retry, runAction };
}
