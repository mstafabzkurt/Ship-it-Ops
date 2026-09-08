import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const serviceSource = readFileSync(resolve(root, 'src/services/leaderboard.ts'), 'utf8');
const rankingSource = readFileSync(resolve(root, 'app/(tabs)/ranking.tsx'), 'utf8');
const gameSource = readFileSync(resolve(root, 'app/(tabs)/game.tsx'), 'utf8');
const migrationSource = readFileSync(
  resolve(root, 'supabase/migrations/20260903100000_create_leaderboard_score_events.sql'),
  'utf8',
);

assert(
  /period === 'all_time'\) return fetchGlobalLeaderboard\(limit\)/.test(serviceSource),
  'General leaderboard must keep using the existing all-time profile score',
);
assert(
  /p_period = 'weekly'[\s\S]*?date_trunc\('week', timezone\('Europe\/Istanbul', now\(\)\)\)/.test(migrationSource)
    && migrationSource.includes('PostgreSQL calendar weeks start Monday'),
  'Weekly leaderboard must use the current Monday-based calendar week',
);
assert(
  /p_period = 'monthly'[\s\S]*?date_trunc\('month', timezone\('Europe\/Istanbul', now\(\)\)\)/.test(migrationSource),
  'Monthly leaderboard must use the current calendar month',
);
assert(
  migrationSource.includes('event.created_at >= period_bounds.period_start')
    && !gameSource.slice(gameSource.indexOf('const abandonSession'), gameSource.indexOf('const handleConfirmExit')).includes('writeLeaderboardScoreEvent'),
  'Weekly/monthly rankings must only include persisted completed-session events, never abandoned sessions',
);
assert(
  (gameSource.match(/writeLeaderboardScoreEvent\(\{/g) ?? []).length === 1
    && gameSource.indexOf('writeLeaderboardScoreEvent({') > gameSource.indexOf('commitGameSession({')
    && migrationSource.includes('unique (user_id, session_id)'),
  'Completed sessions must write score history exactly once with a database idempotency key',
);
assert(
  gameSource.includes('scoreDelta: totals.leaderboardDelta')
    && gameSource.includes('commitResolvedSession(sessionResultsRef.current);'),
  'Score history must use the final Git-Revert-adjusted session accumulator total',
);
assert(
  gameSource.includes('sessionCommittedRef.current = true')
    && serviceSource.includes("if (!error || error.code === '23505') return;"),
  'Completion re-render or double click must not duplicate a score event',
);
assert(
  rankingSource.includes("title={period === 'all_time' ? 'Sıralama henüz boş' : 'Bu dönem için henüz skor yok.'}"),
  'Empty weekly/monthly periods must show the requested empty state',
);
assert(
  rankingSource.includes('accessibilityLabel="Sıralama nasıl hesaplanır?"')
    && rankingSource.includes('onPress={() => setInfoVisible(true)}')
    && rankingSource.includes('UI_ICON_ASSETS.info')
    && rankingSource.includes('<LeaderboardInfoModal'),
  'The accessible info asset button must open the leaderboard explanation modal',
);
assert(
  rankingSource.includes('onRequestClose={onClose}')
    && rankingSource.includes("if (event.key === 'Escape') closeInfoModal();")
    && rankingSource.includes('accessibilityLabel="Sıralama bilgilerini kapat"'),
  'The info modal must close with its action, backdrop, native request, and web Escape key',
);
for (const copy of [
  'tamamlanan 10 soruluk oturumlardaki doğru kararlarına göre hesaplanır',
  'Her doğru cevap +100 puan kazandırır',
  'Yanlış cevap ve süre dolması puan kazandırmaz',
  'Genel sıralama tüm zamanları kapsar',
  'Haftalık ve aylık sıralamalar',
  'Eksik bırakılan oturumlar sıralamaya yazılmaz',
]) {
  assert(rankingSource.includes(copy), `Info modal copy is missing: ${copy}`);
}
assert(!gameSource.includes('Yeni Oturum Başlat'), 'Completion screen must not render Yeni Oturum Başlat');
assert(gameSource.includes('label="Oyun Merkezine Dön"'), 'Completion screen must retain Oyun Merkezine Dön');
assert(gameSource.includes('label="Cevapları İncele"'), 'Completion screen must retain Cevapları İncele');

assert(
  migrationSource.includes('revoke all on table public.leaderboard_score_events from public, anon, authenticated')
    && migrationSource.includes('grant insert (user_id, score_delta, category_id, difficulty_star, session_id)')
    && migrationSource.includes('with check ((select auth.uid()) = user_id)')
    && migrationSource.includes('security definer')
    && migrationSource.includes("p_period in ('weekly', 'monthly')"),
  'Score event RLS and aggregate-only authenticated read boundary must remain locked down',
);

console.log('Leaderboard period invariants passed.');
