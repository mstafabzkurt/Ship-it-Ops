import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

// Keep browser chrome/keyboard measurements separate from onboarding drafts.
export function useOnboardingViewport() {
  const dimensions = useWindowDimensions();
  const [webViewport, setWebViewport] = useState<{ width: number; height: number; top: number } | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const viewport = window.visualViewport;
    let frame = 0;
    const measure = () => {
      if (document.visibilityState === 'hidden') return;
      const { clientWidth: width, clientHeight: layoutHeight } = document.documentElement;
      if (!Number.isFinite(layoutHeight) || layoutHeight <= 0) return;
      if (viewport && (!Number.isFinite(viewport.width) || !Number.isFinite(viewport.height) || !Number.isFinite(viewport.scale)
        || viewport.width <= 0 || viewport.height <= 0 || viewport.scale <= 0)) return;
      // Normalize pinch zoom so zooming pans the page rather than reflowing it.
      const height = viewport
        ? Math.min(layoutHeight, Math.round(viewport.height * viewport.scale))
        : layoutHeight;
      // Inactive documents can report a zero scale/size when returning from browser UI.
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
      // iOS can pan the visual viewport while the layout viewport stays full-size.
      // Ignore zoom panning, and clamp stale offsets after keyboard dismissal.
      const top = viewport && viewport.scale === 1 && Number.isFinite(viewport.offsetTop)
        ? Math.max(0, Math.min(viewport.offsetTop, layoutHeight - height))
        : 0;
      setWebViewport((current) => current?.width === width && current.height === height && current.top === top
        ? current
        : { width, height, top });
    };
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    viewport?.addEventListener('resize', scheduleMeasure);
    viewport?.addEventListener('scroll', scheduleMeasure);
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('orientationchange', scheduleMeasure);
    window.addEventListener('focus', scheduleMeasure);
    window.addEventListener('pageshow', scheduleMeasure);
    document.addEventListener('visibilitychange', scheduleMeasure);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', scheduleMeasure);
      viewport?.removeEventListener('scroll', scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('orientationchange', scheduleMeasure);
      window.removeEventListener('focus', scheduleMeasure);
      window.removeEventListener('pageshow', scheduleMeasure);
      document.removeEventListener('visibilitychange', scheduleMeasure);
    };
  }, []);

  return Platform.OS === 'web' && webViewport ? webViewport : dimensions;
}
