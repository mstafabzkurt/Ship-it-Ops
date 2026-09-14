import { Platform } from 'react-native';

import {
  getPrivacyConsent,
  type PrivacyConsent,
} from '../config/privacyConsent';

type Gtag = (...args: unknown[]) => void;
type AnalyticsParameter = string | number | boolean;

export type AnalyticsEventName =
  | 'session_started'
  | 'session_completed'
  | 'question_answered'
  | 'category_selected'
  | 'tier_selected'
  | 'feedback_opened'
  | 'privacy_consent_updated';

export type AnalyticsEventParameters = Readonly<Record<string, AnalyticsParameter | undefined>>;

interface AnalyticsWindow extends Window {
  dataLayer?: unknown[];
  gtag?: Gtag;
}

const GA_SCRIPT_ID = 'shipit-ga4-script';
const measurementId = process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? '';
const DENIED_CONSENT: PrivacyConsent = {
  necessary: true,
  analytics: false,
  advertising: false,
  consentVersion: 1,
  updatedAt: new Date(0).toISOString(),
};

let initialized = false;
let analyticsEnabled = false;

function getAnalyticsWindow(): AnalyticsWindow | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return window as AnalyticsWindow;
}

function getGtag(analyticsWindow: AnalyticsWindow): Gtag {
  analyticsWindow.dataLayer ??= [];
  analyticsWindow.gtag ??= (...args: unknown[]) => {
    analyticsWindow.dataLayer?.push(args);
  };
  return analyticsWindow.gtag;
}

function setGaDisabled(analyticsWindow: AnalyticsWindow, disabled: boolean) {
  (analyticsWindow as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = disabled;
}

function updateConsentMode(analyticsWindow: AnalyticsWindow, consent: PrivacyConsent, command: 'default' | 'update') {
  getGtag(analyticsWindow)('consent', command, {
    analytics_storage: consent.analytics ? 'granted' : 'denied',
    ad_storage: consent.advertising ? 'granted' : 'denied',
    ad_user_data: consent.advertising ? 'granted' : 'denied',
    ad_personalization: consent.advertising ? 'granted' : 'denied',
  });
}

export function isAnalyticsConfigured(): boolean {
  return Boolean(measurementId) && getAnalyticsWindow() !== null && typeof document !== 'undefined';
}

export async function initAnalyticsIfAllowed(): Promise<boolean> {
  try {
    if (!isAnalyticsConfigured()) return false;

    const consent = await getPrivacyConsent();
    const analyticsWindow = getAnalyticsWindow();
    if (!analyticsWindow || !consent?.analytics) {
      analyticsEnabled = false;
      if (analyticsWindow && initialized) {
        setGaDisabled(analyticsWindow, true);
        updateConsentMode(analyticsWindow, consent ?? DENIED_CONSENT, 'update');
      }
      return false;
    }

    setGaDisabled(analyticsWindow, false);
    if (!initialized) {
      const gtag = getGtag(analyticsWindow);
      updateConsentMode(analyticsWindow, DENIED_CONSENT, 'default');
      updateConsentMode(analyticsWindow, consent, 'update');
      gtag('js', new Date());
      gtag('config', measurementId, { send_page_view: false });

      if (!document.getElementById(GA_SCRIPT_ID)) {
        const script = document.createElement('script');
        script.id = GA_SCRIPT_ID;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
        script.onerror = () => {
          analyticsEnabled = false;
        };
        document.head.appendChild(script);
      }
      initialized = true;
    } else {
      updateConsentMode(analyticsWindow, consent, 'update');
    }

    analyticsEnabled = true;
    return true;
  } catch {
    analyticsEnabled = false;
    return false;
  }
}

export async function syncAnalyticsConsent(consent: PrivacyConsent | null): Promise<boolean> {
  try {
    const analyticsWindow = getAnalyticsWindow();
    if (!isAnalyticsConfigured() || !analyticsWindow) return false;

    if (!consent?.analytics) {
      analyticsEnabled = false;
      if (initialized) {
        setGaDisabled(analyticsWindow, true);
        updateConsentMode(analyticsWindow, consent ?? DENIED_CONSENT, 'update');
      }
      return false;
    }

    return initAnalyticsIfAllowed();
  } catch {
    analyticsEnabled = false;
    return false;
  }
}

export async function trackAnalyticsEvent(eventName: AnalyticsEventName, parameters: AnalyticsEventParameters = {}): Promise<void> {
  try {
    if (!await initAnalyticsIfAllowed() || !analyticsEnabled) return;

    const analyticsWindow = getAnalyticsWindow();
    if (!analyticsWindow) return;
    getGtag(analyticsWindow)('event', eventName, compactParameters(parameters));
  } catch {
    // Analytics failures must never interrupt product behavior.
  }
}

export async function trackPageView(pathname: string): Promise<void> {
  try {
    if (!await initAnalyticsIfAllowed() || !analyticsEnabled) return;

    const analyticsWindow = getAnalyticsWindow();
    if (!analyticsWindow) return;
    const pagePath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    getGtag(analyticsWindow)('event', 'page_view', { page_path: pagePath.slice(0, 120) });
  } catch {
    // Analytics failures must never interrupt navigation.
  }
}

function compactParameters(parameters: AnalyticsEventParameters): Record<string, AnalyticsParameter> {
  return Object.fromEntries(
    Object.entries(parameters).filter((entry): entry is [string, AnalyticsParameter] => entry[1] !== undefined),
  );
}
