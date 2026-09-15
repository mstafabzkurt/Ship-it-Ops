import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

// Keep browser chrome/keyboard measurements separate from onboarding drafts.
export function useOnboardingViewport() {
  const dimensions = useWindowDimensions();
  const [webViewport, setWebViewport] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const viewport = window.visualViewport;
    let frame = 0;
    const measure = () => {
      if (document.visibilityState === 'hidden') return;
      const { clientWidth: width, clientHeight: layoutHeight } = document.documentElement;
      // Normalize pinch zoom so zooming pans the page rather than reflowing it.
      const height = viewport
        ? Math.min(layoutHeight, Math.round(viewport.height * viewport.scale))
        : layoutHeight;
      // Inactive documents can report a zero scale/size when returning from browser UI.
      if (width <= 0 || height <= 0) return;
      setWebViewport((current) => current?.width === width && current.height === height
        ? current
        : { width, height });
    };
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    viewport?.addEventListener('resize', scheduleMeasure);
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('orientationchange', scheduleMeasure);
    window.addEventListener('focus', scheduleMeasure);
    window.addEventListener('pageshow', scheduleMeasure);
    document.addEventListener('visibilitychange', scheduleMeasure);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('orientationchange', scheduleMeasure);
      window.removeEventListener('focus', scheduleMeasure);
      window.removeEventListener('pageshow', scheduleMeasure);
      document.removeEventListener('visibilitychange', scheduleMeasure);
    };
  }, []);

  return Platform.OS === 'web' && webViewport ? webViewport : dimensions;
}
