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

let scriptInjected = false;
let scriptLoaded = false;
let jsInitialized = false;
let configured = false;
let analyticsEnabled = false;
let desiredConsent: PrivacyConsent = DENIED_CONSENT;
let initializationPromise: Promise<boolean> | null = null;
const reportedDiagnostics = new Set<string>();

function reportDiagnostic(key: string, message: string): void {
  if (reportedDiagnostics.has(key)) return;
  reportedDiagnostics.add(key);
  console.info(`[analytics] ${message}`);
}

function reportSkipped(reason: string): void {
  reportDiagnostic(`skipped:${reason}`, `event skipped: ${reason}`);
}

function getAnalyticsWindow(): AnalyticsWindow | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return window as AnalyticsWindow;
}

function isAnalyticsAvailable(): boolean {
  return Boolean(measurementId) && getAnalyticsWindow() !== null && typeof document !== 'undefined';
}

function getGtag(analyticsWindow: AnalyticsWindow): Gtag {
  analyticsWindow.dataLayer ??= [];
  if (!analyticsWindow.gtag) {
    analyticsWindow.gtag = function queuedGtag(..._args: unknown[]): void {
      // The official gtag queue consumes the function's Arguments object.
      analyticsWindow.dataLayer?.push(arguments);
    };
  }
  return analyticsWindow.gtag;
}

function setGaDisabled(analyticsWindow: AnalyticsWindow, disabled: boolean): void {
  (analyticsWindow as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = disabled;
}

function updateConsentMode(
  analyticsWindow: AnalyticsWindow,
  consent: PrivacyConsent,
  command: 'default' | 'update',
): void {
  getGtag(analyticsWindow)('consent', command, {
    analytics_storage: consent.analytics ? 'granted' : 'denied',
    ad_storage: consent.advertising ? 'granted' : 'denied',
    ad_user_data: consent.advertising ? 'granted' : 'denied',
    ad_personalization: consent.advertising ? 'granted' : 'denied',
  });
}

function configureLoadedScript(analyticsWindow: AnalyticsWindow): boolean {
  scriptLoaded = true;
  reportDiagnostic('script-loaded', 'script loaded: true');

  if (!desiredConsent.analytics) {
    setGaDisabled(analyticsWindow, true);
    updateConsentMode(analyticsWindow, desiredConsent, 'update');
    analyticsEnabled = false;
    configured = false;
    return false;
  }

  const gtag = getGtag(analyticsWindow);
  setGaDisabled(analyticsWindow, false);
  if (!jsInitialized) {
    gtag('js', new Date());
    jsInitialized = true;
  }
  updateConsentMode(analyticsWindow, desiredConsent, 'update');
  gtag('config', measurementId, { send_page_view: false });

  configured = true;
  analyticsEnabled = true;
  const script = document.getElementById(GA_SCRIPT_ID);
  if (script instanceof HTMLScriptElement) {
    script.dataset.shipitGaLoaded = 'true';
    script.dataset.shipitGaConfigured = 'true';
  }
  reportDiagnostic('configured', 'configured: true');
  return true;
}

function loadAndConfigureAnalytics(
  analyticsWindow: AnalyticsWindow,
  consent: PrivacyConsent,
): Promise<boolean> {
  desiredConsent = consent;
  setGaDisabled(analyticsWindow, false);

  if (scriptLoaded) {
    if (configured) {
      updateConsentMode(analyticsWindow, desiredConsent, 'update');
      analyticsEnabled = true;
      return Promise.resolve(true);
    }
    return Promise.resolve(configureLoadedScript(analyticsWindow));
  }

  if (initializationPromise) return initializationPromise;

  getGtag(analyticsWindow);
  updateConsentMode(analyticsWindow, DENIED_CONSENT, 'default');

  initializationPromise = new Promise<boolean>((resolve) => {
    let script = document.getElementById(GA_SCRIPT_ID) as HTMLScriptElement | null;

    const handleLoad = () => {
      scriptInjected = true;
      resolve(configureLoadedScript(analyticsWindow));
    };
    const handleError = () => {
      scriptInjected = false;
      scriptLoaded = false;
      configured = false;
      analyticsEnabled = false;
      script?.remove();
      reportDiagnostic('script-load-failed', 'script loaded: false');
      resolve(false);
    };

    if (script?.dataset.shipitGaLoaded === 'true') {
      scriptInjected = true;
      handleLoad();
      return;
    }

    if (!script) {
      script = document.createElement('script');
      script.id = GA_SCRIPT_ID;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      scriptInjected = true;
      reportDiagnostic('script-injected', 'script injected: true');
    }

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    if (!script.isConnected) document.head.appendChild(script);
  }).finally(() => {
    initializationPromise = null;
  });

  return initializationPromise;
}

export function isAnalyticsConfigured(): boolean {
  return isAnalyticsAvailable() && configured;
}

export async function initAnalyticsIfAllowed(): Promise<boolean> {
  try {
    reportDiagnostic('measurement-id', `measurement id present: ${Boolean(measurementId)}`);
    if (!isAnalyticsAvailable()) {
      reportSkipped(measurementId ? 'unsupported platform' : 'measurement id missing');
      return false;
    }

    const consent = await getPrivacyConsent();
    const analyticsWindow = getAnalyticsWindow();
    desiredConsent = consent ?? DENIED_CONSENT;
    reportDiagnostic(
      `consent:${Boolean(consent?.analytics)}`,
      `consent analytics: ${Boolean(consent?.analytics)}`,
    );

    if (!analyticsWindow || !consent?.analytics) {
      analyticsEnabled = false;
      configured = false;
      if (analyticsWindow && (scriptInjected || scriptLoaded)) {
        setGaDisabled(analyticsWindow, true);
        updateConsentMode(analyticsWindow, desiredConsent, 'update');
      }
      reportSkipped('analytics consent denied');
      return false;
    }

    return loadAndConfigureAnalytics(analyticsWindow, consent);
  } catch {
    analyticsEnabled = false;
    configured = false;
    reportSkipped('initialization failed');
    return false;
  }
}

export async function syncAnalyticsConsent(consent: PrivacyConsent | null): Promise<boolean> {
  try {
    const analyticsWindow = getAnalyticsWindow();
    desiredConsent = consent ?? DENIED_CONSENT;
    reportDiagnostic(
      `consent:${Boolean(consent?.analytics)}`,
      `consent analytics: ${Boolean(consent?.analytics)}`,
    );

    if (!isAnalyticsAvailable() || !analyticsWindow) return false;

    if (!consent?.analytics) {
      analyticsEnabled = false;
      configured = false;
      if (scriptInjected || scriptLoaded) {
        setGaDisabled(analyticsWindow, true);
        updateConsentMode(analyticsWindow, desiredConsent, 'update');
      }
      return false;
    }

    return loadAndConfigureAnalytics(analyticsWindow, consent);
  } catch {
    analyticsEnabled = false;
    configured = false;
    reportSkipped('consent sync failed');
    return false;
  }
}

export async function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  parameters: AnalyticsEventParameters = {},
): Promise<void> {
  try {
    if (!await initAnalyticsIfAllowed() || !analyticsEnabled || !configured) {
      reportSkipped('GA not configured');
      return;
    }

    const consent = await getPrivacyConsent();
    const analyticsWindow = getAnalyticsWindow();
    if (!analyticsWindow || !consent?.analytics) {
      reportSkipped('analytics consent denied at send time');
      return;
    }
    getGtag(analyticsWindow)('event', eventName, compactParameters(parameters));
  } catch {
    // Analytics failures must never interrupt product behavior.
  }
}

export async function trackPageView(pathname: string): Promise<void> {
  try {
    if (!await initAnalyticsIfAllowed() || !analyticsEnabled || !configured) {
      reportSkipped('GA not configured');
      return;
    }

    const consent = await getPrivacyConsent();
    const analyticsWindow = getAnalyticsWindow();
    if (!analyticsWindow || !consent?.analytics) {
      reportSkipped('analytics consent denied at send time');
      return;
    }

    const pagePath = (pathname.startsWith('/') ? pathname : `/${pathname}`).slice(0, 120);
    getGtag(analyticsWindow)('event', 'page_view', {
      page_path: pagePath,
      page_location: `${analyticsWindow.location.origin}${pagePath}`,
      page_title: document.title.slice(0, 120),
    });
  } catch {
    // Analytics failures must never interrupt navigation.
  }
}

function compactParameters(parameters: AnalyticsEventParameters): Record<string, AnalyticsParameter> {
  return Object.fromEntries(
    Object.entries(parameters).filter((entry): entry is [string, AnalyticsParameter] => entry[1] !== undefined),
  );
}
