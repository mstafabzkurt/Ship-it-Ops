import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

const nativeDriver = Platform.OS !== 'web';

/** Stay still while an unavailable/native preference resolves; follow changes live. */
export function useDuelReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
      const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => setReduced(preference.matches);
      update();
      if (preference.addEventListener) preference.addEventListener('change', update);
      else preference.addListener(update);
      return () => {
        if (preference.removeEventListener) preference.removeEventListener('change', update);
        else preference.removeListener(update);
      };
    }
    let mounted = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      changed = true;
      if (mounted) setReduced(enabled);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted && !changed) setReduced(enabled);
    }).catch(() => { /* Motion stays suppressed when the preference is unavailable. */ });
    return () => { mounted = false; subscription.remove(); };
  }, []);

  return reduced;
}

/** One small arrival, with visible content even before effects or preference resolution. */
export function DuelEntrance({ children, style, delay = 0 }: {
  children: React.ReactNode; style?: StyleProp<ViewStyle>; delay?: number;
}) {
  const reduced = useDuelReducedMotion();
  const progress = useRef(new Animated.Value(1)).current;
  const entered = useRef(false);

  useLayoutEffect(() => {
    progress.stopAnimation();
    if (entered.current || reduced) {
      entered.current = true;
      progress.setValue(1);
      return;
    }
    entered.current = true;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1, duration: 200, delay: Math.min(150, Math.max(0, delay)),
      easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver,
    });
    animation.start();
    return () => { animation.stop(); progress.setValue(1); };
  }, [delay, progress, reduced]);

  return <Animated.View style={[style, {
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }),
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
  }]}>{children}</Animated.View>;
}

/** Number changes remain synchronous; the small emphasis never controls the timer. */
export function DuelCountdownNumber({ value, textStyle }: { value: number; textStyle?: StyleProp<TextStyle> }) {
  const reduced = useDuelReducedMotion();
  const progress = useRef(new Animated.Value(1)).current;

  useLayoutEffect(() => {
    progress.stopAnimation();
    if (reduced) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver,
    });
    animation.start();
    return () => { animation.stop(); progress.setValue(1); };
  }, [progress, reduced, value]);

  return <Animated.Text style={[textStyle, {
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] }),
    transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
  }]}>{value}</Animated.Text>;
}
