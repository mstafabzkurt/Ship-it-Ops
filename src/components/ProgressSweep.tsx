import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface ProgressSweepProps {
  value: number;
  reduceMotion: boolean;
  active?: boolean;
  accessibilityLabel: string;
  accessibilityValue?: React.ComponentProps<typeof View>['accessibilityValue'];
  trackStyle?: StyleProp<ViewStyle>;
  fillStyle?: StyleProp<ViewStyle>;
  sweepColor: string;
  markers?: readonly number[];
  children?: React.ReactNode;
}

const clampProgress = (value: number) => Math.min(1, Math.max(0, value));

export default function ProgressSweep({
  value,
  reduceMotion,
  active = true,
  accessibilityLabel,
  accessibilityValue,
  trackStyle,
  fillStyle,
  sweepColor,
  markers = [],
  children,
}: ProgressSweepProps) {
  const target = clampProgress(value);
  const fillProgress = useRef(new Animated.Value(target)).current;
  const sweepProgress = useRef(new Animated.Value(0)).current;
  const completedTargetRef = useRef(target);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    const previousTarget = completedTargetRef.current;
    animationRef.current?.stop();
    animationRef.current = null;
    sweepProgress.stopAnimation();
    // Consume changes even while hidden. Focus changes must not replay a fill.
    completedTargetRef.current = target;
    if (!active || reduceMotion || Math.abs(previousTarget - target) < 0.0001) {
      fillProgress.stopAnimation();
      fillProgress.setValue(target);
      sweepProgress.setValue(0);
      return;
    }

    let cancelled = false;
    fillProgress.stopAnimation((currentValue) => {
      if (cancelled) return;

      const distance = Math.min(1, Math.abs(target - currentValue));
      const duration = Math.round(650 + distance * 200);
      sweepProgress.setValue(0);
      const animation = Animated.parallel([
        Animated.timing(fillProgress, {
          toValue: target,
          duration,
          easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.delay(140),
          Animated.timing(sweepProgress, {
            toValue: 1,
            duration: 520,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]);
      animationRef.current = animation;
      animation.start(() => {
        if (animationRef.current === animation) animationRef.current = null;
      });
    });

    return () => {
      cancelled = true;
      animationRef.current?.stop();
      animationRef.current = null;
    };
  }, [active, fillProgress, reduceMotion, sweepProgress, target]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setTrackWidth((currentWidth) => Math.abs(currentWidth - nextWidth) > 0.5 ? nextWidth : currentWidth);
  }, []);

  const fillWidth = fillProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const sweepTranslateX = sweepProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-28, Math.max(28, trackWidth * target + 28)],
  });
  const sweepOpacity = sweepProgress.interpolate({
    inputRange: [0, 0.12, 0.82, 1],
    outputRange: [0, 0.48, 0.3, 0],
  });
  const progressPercent = Math.round(target * 100);
  const accessibleValue = accessibilityValue ?? { min: 0, max: 100, now: progressPercent };

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={accessibleValue}
      aria-valuemin={accessibleValue.min}
      aria-valuemax={accessibleValue.max}
      aria-valuenow={accessibleValue.now}
      aria-valuetext={accessibleValue.text}
      onLayout={handleLayout}
      style={trackStyle}
    >
      <Animated.View pointerEvents="none" style={[styles.fill, fillStyle, { width: fillWidth }]}>
        {children}
        <Animated.View
          style={[
            styles.sweep,
            { backgroundColor: sweepColor, opacity: sweepOpacity, transform: [{ translateX: sweepTranslateX }] },
          ]}
        />
      </Animated.View>
      {markers.map((marker) => (
        <View
          key={marker}
          pointerEvents="none"
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.marker, { left: `${clampProgress(marker) * 100}%`, backgroundColor: sweepColor }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { height: '100%', overflow: 'hidden' },
  sweep: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 24 },
  marker: { position: 'absolute', top: 0, bottom: 0, width: 2, opacity: 0.4 },
});
