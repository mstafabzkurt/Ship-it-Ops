import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  getPrivacyConsent,
  setPrivacyConsent,
  type PrivacyConsent,
  type PrivacyConsentChoices,
} from '../config/privacyConsent';
import { syncAnalyticsConsent, trackAnalyticsEvent } from '../lib/analytics';

interface PrivacyConsentContextValue {
  consent: PrivacyConsent | null;
  isHydrated: boolean;
  preferencesVisible: boolean;
  storageError: string;
  openPreferences: () => void;
  closePreferences: () => void;
  saveConsent: (choices: PrivacyConsentChoices) => Promise<boolean>;
}

const PrivacyConsentContext = createContext<PrivacyConsentContextValue | null>(null);

export function PrivacyConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<PrivacyConsent | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [preferencesVisible, setPreferencesVisible] = useState(false);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    let active = true;

    void getPrivacyConsent().then((storedConsent) => {
      if (!active) return;
      setConsent(storedConsent);
      setIsHydrated(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const openPreferences = useCallback(() => {
    setStorageError('');
    setPreferencesVisible(true);
  }, []);

  const closePreferences = useCallback(() => {
    setStorageError('');
    setPreferencesVisible(false);
  }, []);

  const saveConsent = useCallback(async (choices: PrivacyConsentChoices) => {
    setStorageError('');
    try {
      const savedConsent = await setPrivacyConsent(choices);
      setConsent(savedConsent);
      setPreferencesVisible(false);
      void syncAnalyticsConsent(savedConsent).then((enabled) => {
        if (!enabled) return;
        void trackAnalyticsEvent('privacy_consent_updated', {
          analytics_consent: 'granted',
          advertising_consent: savedConsent.advertising ? 'granted' : 'denied',
        });
      });
      return true;
    } catch {
      setStorageError('Tercihler kaydedilemedi. Lütfen tekrar deneyin.');
      return false;
    }
  }, []);

  const value = useMemo<PrivacyConsentContextValue>(() => ({
    consent,
    isHydrated,
    preferencesVisible,
    storageError,
    openPreferences,
    closePreferences,
    saveConsent,
  }), [closePreferences, consent, isHydrated, openPreferences, preferencesVisible, saveConsent, storageError]);

  return <PrivacyConsentContext.Provider value={value}>{children}</PrivacyConsentContext.Provider>;
}

export function usePrivacyConsent(): PrivacyConsentContextValue {
  const context = useContext(PrivacyConsentContext);
  if (!context) throw new Error('[PrivacyConsentContext] usePrivacyConsent must be used inside <PrivacyConsentProvider>');
  return context;
}
