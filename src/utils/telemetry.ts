import { supabase } from '../supabase';
import { createTelemetryTracker, type TelemetryClient } from './telemetryCore';
import { trackAnalyticsEvent } from '../lib/analytics';
import type { TelemetryMetadata } from './telemetryCore';

export {
  createTelemetryTracker,
  sanitizeTelemetryMetadata,
  type TelemetryMetadata,
} from './telemetryCore';

const trackPlaytestEvent = createTelemetryTracker(supabase as unknown as TelemetryClient);

export async function trackEvent(eventName: string, metadata: TelemetryMetadata = {}): Promise<void> {
  void trackMappedAnalyticsEvent(eventName, metadata);
  await trackPlaytestEvent(eventName, metadata);
}

async function trackMappedAnalyticsEvent(eventName: string, metadata: TelemetryMetadata): Promise<void> {
  if (eventName !== 'session_started' && eventName !== 'session_completed' && eventName !== 'question_answered') return;

  const categoryId = safeIdentifier(metadata.category_id);
  const difficultyStar = safeInteger(metadata.difficulty_star);
  const result = safeIdentifier(metadata.result);
  const sessionQuestionCount = safeInteger(metadata.session_question_count);

  await trackAnalyticsEvent(eventName, {
    category_id: categoryId,
    difficulty_star: difficultyStar,
    result,
    session_question_count: sessionQuestionCount,
  });
}

function safeIdentifier(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^[a-z0-9_]+$/i.test(value)) return undefined;
  return value.slice(0, 64);
}

function safeInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : undefined;
}
