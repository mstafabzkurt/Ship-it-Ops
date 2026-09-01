import {
  createTelemetryTracker,
  sanitizeTelemetryMetadata,
} from '../src/utils/telemetryCore';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function run() {
  const rejectedTracker = createTelemetryTracker({
    auth: {
      getUser: async () => ({ data: { user: { id: 'test-user' } } }),
    },
    from: () => ({
      insert: async () => ({ error: new Error('expected insert failure') }),
    }),
  }, false);
  await rejectedTracker('session_started', { category_id: 'web_programming' });

  const sanitized = sanitizeTelemetryMetadata({
    category_id: 'web_programming',
    question_id: 12,
    email: 'private@example.com',
    name: 'Private User',
    company_name: 'Private Company',
    token: 'secret-token',
    secret: 'private-secret',
    access_token: 'private-access-token',
    question_text: 'A full question must never be stored.',
    question_title: 'A full question title must never be stored.',
    full_question_text: 'Neither should this.',
    nested: { refresh_token: 'private-refresh-token', question_id: 13 },
  });
  for (const privateKey of ['email', 'name', 'company_name', 'token', 'secret', 'access_token', 'question_text', 'question_title', 'full_question_text']) {
    assert(!(privateKey in sanitized), `Telemetry metadata must remove ${privateKey}`);
  }
  assert(sanitized.question_id === 12, 'Telemetry metadata must retain question_id');
  assert(
    JSON.stringify(sanitized.nested) === JSON.stringify({ question_id: 13 }),
    'Telemetry metadata must sanitize nested private keys',
  );

  const insertedRows: Record<string, unknown>[] = [];
  const tracker = createTelemetryTracker({
    auth: {
      getUser: async () => ({ data: { user: { id: 'test-user' } } }),
    },
    from: (table) => {
      assert(table === 'playtest_events', 'Telemetry must insert into playtest_events');
      return {
        insert: async (row) => {
          insertedRows.push(row);
          return {};
        },
      };
    },
  }, false);

  await tracker('session_completed', {
    category_id: 'web_programming',
    difficulty_star: 1,
    session_reputation: 40,
  });
  await tracker('checkpoint_passed', {
    checkpoint_target: 40,
    session_reputation: 40,
  });
  await tracker('joker_used', { joker_type: 'gitRevert' });

  const eventMetadata = (eventName: string) => (
    insertedRows.find((row) => row.event_name === eventName)?.metadata as Record<string, unknown> | undefined
  );
  const session = eventMetadata('session_completed');
  assert(session?.category_id === 'web_programming', 'session_completed must include category_id');
  assert(session?.difficulty_star === 1, 'session_completed must include difficulty_star');
  assert(session?.session_reputation === 40, 'session_completed must include session_reputation');
  const checkpoint = eventMetadata('checkpoint_passed');
  assert(checkpoint?.checkpoint_target === 40, 'Checkpoint events must include checkpoint_target');
  assert(checkpoint?.session_reputation === 40, 'Checkpoint events must include session_reputation');
  assert(eventMetadata('joker_used')?.joker_type === 'gitRevert', 'Joker events must include joker_type');

  let unauthenticatedInsertAttempted = false;
  const unauthenticatedTracker = createTelemetryTracker({
    auth: { getUser: async () => ({ data: { user: null } }) },
    from: () => ({
      insert: async () => {
        unauthenticatedInsertAttempted = true;
        return {};
      },
    }),
  }, false);
  await unauthenticatedTracker('profile_opened');
  assert(!unauthenticatedInsertAttempted, 'Unauthenticated telemetry must skip remote inserts');

  console.log('Telemetry invariants passed.');
}

void run();
