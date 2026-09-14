import AsyncStorage from '@react-native-async-storage/async-storage';

export const PRIVACY_CONSENT_VERSION = 1 as const;

const PRIVACY_CONSENT_STORAGE_KEY = '@shipit_privacy_consent';

export interface PrivacyConsent {
  necessary: true;
  analytics: boolean;
  advertising: boolean;
  consentVersion: typeof PRIVACY_CONSENT_VERSION;
  updatedAt: string;
}

export interface PrivacyConsentChoices {
  analytics: boolean;
  advertising: boolean;
}

function isPrivacyConsent(value: unknown): value is PrivacyConsent {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<PrivacyConsent>;
  return candidate.necessary === true
    && typeof candidate.analytics === 'boolean'
    && typeof candidate.advertising === 'boolean'
    && candidate.consentVersion === PRIVACY_CONSENT_VERSION
    && typeof candidate.updatedAt === 'string'
    && Number.isFinite(Date.parse(candidate.updatedAt));
}

export async function getPrivacyConsent(): Promise<PrivacyConsent | null> {
  try {
    const stored = await AsyncStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);
    return isPrivacyConsent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function setPrivacyConsent(choices: PrivacyConsentChoices): Promise<PrivacyConsent> {
  const consent: PrivacyConsent = {
    necessary: true,
    analytics: choices.analytics === true,
    advertising: choices.advertising === true,
    consentVersion: PRIVACY_CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(PRIVACY_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  return consent;
}

export async function hasAnalyticsConsent(): Promise<boolean> {
  return (await getPrivacyConsent())?.analytics === true;
}

export async function hasAdvertisingConsent(): Promise<boolean> {
  return (await getPrivacyConsent())?.advertising === true;
}

