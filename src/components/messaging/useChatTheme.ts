import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getChatTheme, getChatThemeStorageKey, type ChatThemeId } from '../../utils/chatThemes';

export function useChatTheme(viewerId: string, peerId: string) {
  const storageKey = getChatThemeStorageKey(viewerId, peerId);
  const activeKey = useRef(storageKey);
  activeKey.current = storageKey;
  const revision = useRef(0);
  const pending = useRef(false);
  const [selection, setSelection] = useState<{ key: string | null; id: ChatThemeId }>({ key: null, id: 'default' });
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadRevision = ++revision.current;
    if (!storageKey) return;
    void AsyncStorage.getItem(storageKey).then((stored) => {
      if (!cancelled && loadRevision === revision.current) setSelection({ key: storageKey, id: getChatTheme(stored).id });
    }).catch(() => {
      // Keep the app theme when local storage is unavailable.
    }).finally(() => { if (!cancelled) setHydratedKey(storageKey); });
    return () => { cancelled = true; };
  }, [storageKey]);

  const saveTheme = useCallback(async (id: ChatThemeId) => {
    if (!storageKey || pending.current) throw new Error('Tema şu anda kaydedilemiyor.');
    pending.current = true;
    revision.current += 1;
    try {
      if (id === 'default') await AsyncStorage.removeItem(storageKey);
      else await AsyncStorage.setItem(storageKey, getChatTheme(id).id);
      if (activeKey.current === storageKey) setSelection({ key: storageKey, id: getChatTheme(id).id });
    } finally {
      pending.current = false;
    }
  }, [storageKey]);

  return {
    preset: getChatTheme(selection.key === storageKey ? selection.id : 'default'),
    ready: Boolean(storageKey) && hydratedKey === storageKey,
    saveTheme,
  };
}
