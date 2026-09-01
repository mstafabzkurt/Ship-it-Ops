import { supabase } from '../supabase';
import { createTelemetryTracker, type TelemetryClient } from './telemetryCore';

export {
  createTelemetryTracker,
  sanitizeTelemetryMetadata,
  type TelemetryMetadata,
} from './telemetryCore';

export const trackEvent = createTelemetryTracker(supabase as unknown as TelemetryClient);
