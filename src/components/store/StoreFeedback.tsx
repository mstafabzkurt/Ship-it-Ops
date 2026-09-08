import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { DashboardTokens } from '../dashboard/dashboardTokens';
import { fonts } from '../../theme/typography';
import { formatBudget } from '../../utils/format';

type FeedbackVariant = 'success' | 'error' | 'warning' | 'equip';
export interface AcquisitionDetails {
  itemId: string;
  label: string;
  spend?: number;
}
export interface StoreFeedbackEvent {
  id: number;
  message: string;
  variant: FeedbackVariant;
  acquisition?: AcquisitionDetails;
}

/** One replaceable receipt for one completed action. Never performs a transaction. */
export function useStoreFeedback(active: boolean) {
  const [feedback, setFeedback] = useState<StoreFeedbackEvent | null>(null);
  const sequence = useRef(0);
  const activeRef = useRef(active);
  const mounted = useRef(true);
  useLayoutEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!active) {
      setFeedback(null);
      return;
    }
    if (!feedback) return;
    const id = feedback.id;
    const timeout = setTimeout(() => {
      setFeedback(current => current?.id === id ? null : current);
    }, feedback.variant === 'error' || feedback.variant === 'warning' ? 3000 : 1600);
    return () => clearTimeout(timeout);
  }, [active, feedback]);

  const showFeedback = useCallback((message: string, variant: FeedbackVariant, acquisition?: AcquisitionDetails) => {
    if (!mounted.current || !activeRef.current) return;
    setFeedback({ id: ++sequence.current, message, variant, acquisition });
  }, []);
  return { feedback, showFeedback };
}

/** Per-card one-shot response. A card remounted during a receipt does not replay. */
export function useAcquisitionMotion(eventId: number | undefined, reduceMotion: boolean) {
  const previousEvent = useRef(eventId);
  const rail = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    rail.stopAnimation();
    pulse.stopAnimation();
    rail.setValue(0);
    pulse.setValue(0);
    const isNewEvent = eventId !== undefined && eventId !== previousEvent.current;
    previousEvent.current = eventId;
    if (!isNewEvent || reduceMotion) return;
    const animation = Animated.parallel([
      Animated.timing(rail, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [eventId, pulse, rail, reduceMotion]);
  return {
    rail,
    pulseStyle: { transform: [{ scale: reduceMotion ? 1 : pulse.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 1.07, 1] }) }] },
  };
}

export function AcquisitionRail({ progress, color, reduceMotion }: { progress: Animated.Value; color: string; reduceMotion: boolean }) {
  return <Animated.View
    pointerEvents="none"
    aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.cardRail, {
      backgroundColor: color,
      opacity: reduceMotion ? 0 : progress.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.9, 0.6, 0] }),
      transform: [{ scaleX: progress.interpolate({ inputRange: [0, 1], outputRange: [0.02, 1] }) }],
    }]}
  />;
}

export function AcquisitionCaption({ event, color }: { event?: StoreFeedbackEvent; color: string }) {
  if (!event?.acquisition) return null;
  return <Text style={[styles.caption, { color }]}>
    {event.acquisition.label}{event.acquisition.spend ? ` · −${formatBudget(event.acquisition.spend)}` : ''}
  </Text>;
}

export default function StoreFeedback({ event, reduceMotion, tokens }: { event: StoreFeedbackEvent | null; reduceMotion: boolean; tokens: DashboardTokens }) {
  const reveal = useRef(new Animated.Value(1)).current;
  useLayoutEffect(() => {
    reveal.stopAnimation();
    if (!event || reduceMotion) {
      reveal.setValue(1);
      return;
    }
    reveal.setValue(0);
    const animation = Animated.timing(reveal, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [event?.id, reduceMotion, reveal]);
  if (!event) return null;
  const { colors, radius } = tokens;
  const failed = event.variant === 'error' || event.variant === 'warning';
  const accent = event.variant === 'error' ? colors.danger : colors.warning;
  return (
    <View pointerEvents="box-none" style={[styles.toastAnchor, { bottom: tokens.layout.floatingInset, paddingHorizontal: tokens.layout.pageGutter }]}>
      <Animated.View
        pointerEvents="none"
        accessible
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${event.acquisition?.label ?? (failed ? 'İşlem tamamlanamadı' : 'İşlem onaylandı')}. ${event.message}`}
        style={[styles.receipt, {
          borderRadius: radius.md, backgroundColor: colors.floatingSurface, borderColor: colors.borderStrong,
          opacity: reduceMotion ? 1 : reveal,
          transform: [{ translateY: reduceMotion ? 0 : reveal.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          ...tokens.shadow.raised,
        }]}
      >
        <View style={[styles.receiptRail, { backgroundColor: accent }]} />
        <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.receiptIcon, { borderColor: accent, backgroundColor: colors.floatingSurfaceRaised }]}>
          <Ionicons name={failed ? 'alert-circle-outline' : event.variant === 'equip' ? 'radio-button-on-outline' : 'checkmark'} size={21} color={accent} />
        </View>
        <View style={styles.receiptCopy}>
          <Text style={[styles.eyebrow, { color: accent }]}>{failed ? 'İŞLEM BİLGİSİ' : 'ACQUISITION CONFIRMED'}</Text>
          <Text style={[styles.message, { color: colors.text }]}>{event.message}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardRail: { position: 'absolute', top: 0, left: 12, right: 12, height: 2, zIndex: 2 },
  caption: { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 16, marginTop: 4 },
  toastAnchor: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  receipt: { width: '100%', maxWidth: 480, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, overflow: 'hidden' },
  receiptRail: { position: 'absolute', top: 0, left: 20, right: 20, height: 2 },
  receiptIcon: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  receiptCopy: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: { fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 14, letterSpacing: 1 },
  message: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 19 },
});
