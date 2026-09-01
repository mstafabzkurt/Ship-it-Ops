export type TelemetryMetadata = Readonly<Record<string, unknown>>;

interface TelemetryUser {
  id: string;
}

export interface TelemetryClient {
  auth: {
    getUser: () => Promise<{
      data: { user: TelemetryUser | null };
      error?: unknown;
    }>;
  };
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => PromiseLike<{ error?: unknown }>;
  };
}

function isPrivateMetadataKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return normalized === 'name'
    || normalized.endsWith('_name')
    || normalized === 'password'
    || normalized === 'authorization'
    || normalized === 'title'
    || normalized.endsWith('_title')
    || normalized.includes('email')
    || normalized.includes('secret')
    || normalized.includes('token')
    || normalized.includes('question_text')
    || normalized === 'full_question';
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > 5) return undefined;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (Array.isArray(value)) {
    return value
      .map((entry) => sanitizeValue(entry, depth + 1))
      .filter((entry) => entry !== undefined);
  }
  if (typeof value !== 'object') return undefined;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !isPrivateMetadataKey(key))
      .map(([key, entry]) => [key, sanitizeValue(entry, depth + 1)])
      .filter(([, entry]) => entry !== undefined),
  );
}

export function sanitizeTelemetryMetadata(metadata: TelemetryMetadata = {}): Record<string, unknown> {
  return sanitizeValue(metadata, 0) as Record<string, unknown>;
}

export function createTelemetryTracker(
  client: TelemetryClient,
  development = typeof __DEV__ !== 'undefined' && __DEV__,
) {
  return async function trackEvent(eventName: string, metadata: TelemetryMetadata = {}): Promise<void> {
    try {
      const normalizedEventName = eventName.trim();
      if (!normalizedEventName) return;

      const { data, error: authError } = await client.auth.getUser();
      if (authError || !data.user?.id) return;

      const sanitizedMetadata = sanitizeTelemetryMetadata(metadata);
      const { error } = await client.from('playtest_events').insert({
        user_id: data.user.id,
        event_name: normalizedEventName,
        metadata: sanitizedMetadata,
      });
      if (error) throw error;

      if (development) console.debug('[telemetry]', normalizedEventName, sanitizedMetadata);
    } catch (error) {
      if (development) console.debug('[telemetry] event insert failed', error);
    }
  };
}
