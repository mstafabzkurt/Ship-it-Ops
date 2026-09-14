import { useEffect } from 'react';
import { usePathname } from 'expo-router';

import { syncAnalyticsConsent, trackPageView } from '../../lib/analytics';
import { usePrivacyConsent } from '../../state/PrivacyConsentContext';

export default function AnalyticsLifecycle() {
  const pathname = usePathname();
  const { consent, isHydrated } = usePrivacyConsent();

  useEffect(() => {
    if (!isHydrated) return;

    void syncAnalyticsConsent(consent).then((enabled) => {
      if (enabled) void trackPageView(pathname);
    });
  }, [consent, isHydrated, pathname]);

  return null;
}

