// Executes the actual production migration in isolated PostgreSQL (PGlite).
// No network, real accounts, or production database are used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const root = path.resolve(__dirname, '..');
const A = '00000000-0000-4000-8000-000000000001';
const B = '00000000-0000-4000-8000-000000000002';
const C = '00000000-0000-4000-8000-000000000003';
const D = '00000000-0000-4000-8000-000000000004';
let checks = 0;
function check(condition, message) { assert.ok(condition, message); checks++; }

async function main() {
  const db = new PGlite();
  try {
    // Reproduce the identity and social columns used by these migrations.
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth; create schema private;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
      create table public.friend_relationships (
        requester_id uuid, addressee_id uuid, status text,
        pair_low_id uuid generated always as (least(requester_id, addressee_id)) stored,
        pair_high_id uuid generated always as (greatest(requester_id, addressee_id)) stored
      );
      create table public.user_blocks(blocker_id uuid, blocked_user_id uuid);
      insert into auth.users values ('${A}'), ('${B}'), ('${C}'), ('${D}');
      insert into friend_relationships(requester_id,addressee_id,status)
        values ('${A}','${B}','accepted'), ('${A}','${C}','accepted'), ('${B}','${C}','accepted');
    `);
    await db.exec(fs.readFileSync(path.join(root, 'supabase/migrations/20261002120000_create_friend_duels.sql'), 'utf8'));
    const seed = fs.readFileSync(path.join(root, 'supabase/migrations/20261002121000_seed_friend_duel_questions.sql'), 'utf8');
    await db.exec(seed);
    await db.exec(seed);
    const pool = (await db.query('select * from duel_questions')).rows;
    check(pool.length === 70, 'Seed rerun must preserve exactly 70 questions');
    check(new Set(pool.map(q => q.prompt)).size === 70, 'Question prompts must be distinct');
    check(pool.every(q => q.options.length === 4 && new Set(q.options).size === 4 && q.correct_index >= 0 && q.correct_index < 4), 'Questions must have four distinct choices and a valid key');

    let isolatedTransaction = false;
    async function as(user, sql, params = [], role = 'authenticated') {
      // Expected denied RPCs abort a PostgreSQL transaction. Savepoints retain
      // each isolated fixture and preserve the original error for assertion.
      if (isolatedTransaction) await db.exec('savepoint duel_rpc');
      await db.exec(`set role ${role}`);
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user || '']);
      try { return await db.query(sql, params); }
      catch (error) {
        if (isolatedTransaction) await db.exec('rollback to savepoint duel_rpc');
        throw error;
      } finally {
        await db.exec('reset role');
        if (isolatedTransaction) await db.exec('release savepoint duel_rpc');
      }
    }
    async function rpc(user, name, args = []) {
      return (await as(user, `select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) as result`, args)).rows[0].result;
    }
    async function denied(work, pattern) {
      await assert.rejects(work, pattern); checks++;
    }
    const create = (user = A, opponent = B) => rpc(user, 'create_friend_duel', [opponent]);
    const get = (user, id) => rpc(user, 'get_friend_duel', [id]);
    const respond = (user, id, action) => rpc(user, 'respond_friend_duel', [id, action]);
    const answer = (user, id, round, option) => rpc(user, 'answer_friend_duel', [id, round, option]);
    const stats = (user, opponent) => rpc(user, 'get_friend_duel_head_to_head', [opponent]);
    const moveClock = (id, seconds) => db.query("update friend_duels set starts_at = clock_timestamp() - $2 * interval '1 second' where id=$1", [id, seconds]);
    // Each risk scenario gets real PostgreSQL transactions with fixture writes
    // rolled back, keeping its cap/state independent of preceding scenarios.
    async function isolated(work) {
      await db.exec('begin');
      isolatedTransaction = true;
      try { await work(); } finally { await db.exec('rollback'); isolatedTransaction = false; }
    }
    const fixtureId = number => `00000000-0000-4000-8000-${number.toString(16).padStart(12, '0')}`;
    async function addUser(id) {
      await db.query('insert into auth.users(id) values ($1) on conflict do nothing', [id]);
    }
    async function addFriend(first, second) {
      await db.query("insert into friend_relationships(requester_id,addressee_id,status) values ($1,$2,'accepted')", [first, second]);
    }

    await denied(() => as(null, 'select public.list_friend_duels()', [], 'anon'), /permission denied/);
    await denied(() => rpc(null, 'list_friend_duels'), /duel_auth_required/);
    for (const table of ['duel_questions', 'friend_duels', 'friend_duel_rounds', 'friend_duel_answers']) {
      await denied(() => as(A, `select * from public.${table}`), /permission denied/);
      await denied(() => as(A, `insert into public.${table} default values`), /permission denied/);
      const column = { duel_questions: 'active', friend_duels: 'status', friend_duel_rounds: 'prompt', friend_duel_answers: 'option_index' }[table];
      await denied(() => as(A, `update public.${table} set ${column}=${column}`), /permission denied/);
      await denied(() => as(A, `delete from public.${table}`), /permission denied/);
      await denied(() => as(A, `truncate public.${table}`), /permission denied/);
    }
    await denied(() => as(A, "select private.duel_check_pair($1,$2)", [A, B]), /permission denied/);
    // A private-schema denial alone would mask an accidentally public helper
    // grant. Inspect the effective grants as the owner as well.
    const functions = (await db.query(`select n.nspname as schema_name, p.proname,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated,
      has_function_privilege('anon', p.oid, 'EXECUTE') as anon
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where (n.nspname='private' and p.proname in ('duel_check_pair','duel_require_match','duel_settle','duel_summary'))
        or (n.nspname='public' and p.proname in ('create_friend_duel','respond_friend_duel','answer_friend_duel',
          'forfeit_friend_duel','get_friend_duel','list_friend_duels','get_friend_duel_head_to_head'))`)).rows;
    check(functions.length === 11, 'The privilege audit must cover every public duel RPC and private helper');
    check(functions.every(f => !f.anon && (f.schema_name === 'public' ? f.authenticated : !f.authenticated)),
      'Only authenticated callers can execute public RPCs; neither client role can execute helpers');
    await denied(() => create(A, A), /duel_invalid_opponent/);
    await denied(() => create(A, D), /duel_friend_required/);
    for (const [blocker, blocked] of [[A, B], [B, A]]) {
      await db.query('insert into user_blocks values ($1,$2)', [blocker, blocked]);
      await denied(() => create(), /duel_blocked/);
      await db.exec('delete from user_blocks');
    }

    let match = await create();
    check(match.status === 'pending' && match.current_question === null && match.results === null, 'Invitation must not expose questions');
    check((await create()).id === match.id && (await create(B, A)).id === match.id, 'Duplicate and reverse invitations must reuse the open pair');
    check((await rpc(C, 'list_friend_duels')).length === 0, 'Nonparticipant list must not expose another match');
    await denied(() => get(C, match.id), /duel_not_found/);
    await denied(() => respond(A, match.id, 'accept'), /duel_action_forbidden/);
    await denied(() => respond(B, match.id, 'cancel'), /duel_action_forbidden/);
    match = await respond(B, match.id, 'decline');
    check(match.status === 'declined' && (await stats(A, B)).total === 0, 'Declines must not change the record');
    match = await create();
    check((await respond(A, match.id, 'cancel')).status === 'cancelled', 'Inviter can cancel a pending challenge');
    match = await create();
    await db.query("update friend_duels set expires_at=clock_timestamp()-interval '1 second' where id=$1", [match.id]);
    check((await respond(B, match.id, 'accept')).status === 'expired', 'Expired invitation cannot start');
    check((await stats(A, B)).total === 0, 'Expired invites do not count as losses');

    match = await create();
    match = await respond(B, match.id, 'accept');
    check(match.status === 'active' && match.current_question === null, 'Accept starts a countdown without exposing questions');
    check((await db.query('select * from friend_duel_rounds where duel_id=$1', [match.id])).rows.length === 7, 'Match contains exactly seven frozen questions');
    await denied(() => answer(A, match.id, 0, 0), /duel_round_closed/);
    const busy = await create(C, A);
    await denied(() => respond(A, busy.id, 'accept'), /duel_busy/);
    await respond(C, busy.id, 'cancel');
    await moveClock(match.id, 2);
    const qa = (await get(A, match.id)).current_question;
    const qb = (await get(B, match.id)).current_question;
    check(qa.prompt === qb.prompt && JSON.stringify(qa.options) === JSON.stringify(qb.options), 'Both participants receive the same question and options');
    check(!('correct_index' in qa) && !('explanation' in qa), 'Active snapshot must not leak answer keys');
    const rounds = (await db.query('select * from friend_duel_rounds where duel_id=$1 order by round_index', [match.id])).rows;
    const first = await answer(A, match.id, 0, rounds[0].correct_index);
    const retry = await answer(A, match.id, 0, rounds[0].correct_index);
    check(first.my_answer.answered_at === retry.my_answer.answered_at, 'Answer retry must preserve original timing');
    check(first.results === null && first.my_score === 0, 'Answer submission must not reveal correctness through scores');
    await denied(() => answer(A, match.id, 0, (rounds[0].correct_index + 1) % 4), /duel_answer_locked/);
    await denied(() => answer(B, match.id, 1, 0), /duel_round_closed/);
    await denied(() => answer(B, match.id, 0, 4), /duel_invalid_answer/);
    await moveClock(match.id, 22);
    await denied(() => answer(B, match.id, 0, 0), /duel_round_closed/);
    await answer(A, match.id, 1, (rounds[1].correct_index + 1) % 4);
    await answer(B, match.id, 1, rounds[1].correct_index);
    await db.query('update friend_duel_answers set response_ms=case when user_id=$2 then 1000 else 1500 end where duel_id=$1', [match.id, A]);
    await moveClock(match.id, 141);
    const final = await get(A, match.id);
    check(final.status === 'completed' && final.my_score === 1 && final.opponent_score === 1, 'Server settles correct counts and missed rounds');
    check(final.winner_id === A && final.my_response_ms === 102000 && final.opponent_response_ms === 121500, 'Tied scores use total response time with 20s missing-answer penalty');
    check(final.results.length === 7 && final.results[0].correct_index === rounds[0].correct_index, 'Completed participants can review frozen answers');
    await get(A, match.id);
    check((await stats(A, B)).wins === 1 && (await stats(B, A)).losses === 1, 'Repeated settlement counts only once and h2h is directional');
    await denied(() => get(D, match.id), /duel_not_found/);

    match = await create();
    await respond(B, match.id, 'accept');
    await moveClock(match.id, 141);
    const draw = await get(B, match.id);
    check(draw.winner_id === null && draw.my_score === 0 && draw.my_response_ms === 140000, 'Two absent players yield a draw and maximum response time');
    check((await stats(A, B)).draws === 1, 'Draw is tracked separately');

    match = await create();
    await respond(B, match.id, 'accept');
    const forfeited = await rpc(A, 'forfeit_friend_duel', [match.id]);
    check(forfeited.status === 'forfeited' && forfeited.winner_id === B && forfeited.forfeited_by === A, 'Explicit forfeit records a loss even during countdown');
    await rpc(A, 'forfeit_friend_duel', [match.id]);
    const opponentRetry = await rpc(B, 'forfeit_friend_duel', [match.id]);
    check(opponentRetry.winner_id === B && opponentRetry.forfeited_by === A,
      'The opponent retry cannot reverse a committed forfeit winner or forfeiter');
    const record = await stats(A, B);
    check(record.wins === 1 && record.losses === 1 && record.draws === 1 && record.total === 3, 'Forfeit retries cannot increment the record twice');
    await db.query('insert into user_blocks values ($1,$2)', [B, A]);
    await denied(() => get(A, match.id), /duel_blocked/);
    check((await rpc(A, 'list_friend_duels')).every(m => m.opponent_id !== B), 'Blocked matches are hidden from list');
    await denied(() => stats(A, B), /duel_blocked/);
    await denied(() => answer(A, match.id, 0, 0), /duel_blocked/);
    await denied(() => rpc(A, 'forfeit_friend_duel', [match.id]), /duel_blocked/);
    await denied(() => respond(B, match.id, 'accept'), /duel_blocked/);
    await db.exec('delete from user_blocks');

    await isolated(async () => {
      const pending = await create();
      await db.query('delete from friend_relationships where pair_low_id=$1 and pair_high_id=$2', [A, B]);
      await denied(() => respond(B, pending.id, 'accept'), /duel_friend_required/);
      const unchanged = await get(B, pending.id);
      check(unchanged.status === 'pending' && unchanged.starts_at === null,
        'Removing friendship before acceptance cannot start the pending match');
      check((await db.query('select count(*)::integer as count from friend_duel_rounds where duel_id=$1', [pending.id])).rows[0].count === 0,
        'Failed acceptance cannot leave frozen question rows behind');
    });

    await isolated(async () => {
      const pending = await create();
      await respond(B, pending.id, 'accept');
      await moveClock(pending.id, 2);
      const original = (await db.query('select * from friend_duel_rounds where duel_id=$1 and round_index=0', [pending.id])).rows[0];
      await db.query(`update duel_questions set prompt='Changed pool prompt', category='changed-pool',
        options=$2::jsonb, correct_index=$3, explanation='Changed pool explanation', active=false where key=$1`,
        [original.question_key, JSON.stringify(['Updated A', 'Updated B', 'Updated C', 'Updated D']), (original.correct_index + 1) % 4]);
      const live = (await get(A, pending.id)).current_question;
      check(live.prompt === original.prompt && live.category === original.category && JSON.stringify(live.options) === JSON.stringify(original.options),
        'Pool edits or deactivation cannot change the accepted live question');
      await answer(A, pending.id, 0, original.correct_index);
      await moveClock(pending.id, 141);
      const finished = await get(A, pending.id);
      check(finished.my_score === 1 && finished.results[0].correct_index === original.correct_index
        && finished.results[0].explanation === original.explanation && finished.results[0].prompt === original.prompt,
        'Final scoring and explanations use the frozen accepted answer key after pool edits');
    });

    await isolated(async () => {
      const sender = fixtureId(1000), recipient = fixtureId(1001);
      await addUser(sender); await addUser(recipient); await addFriend(sender, recipient);
      for (let index = 0; index < 12; index++) {
        const invitation = await create(sender, recipient);
        await respond(sender, invitation.id, 'cancel');
      }
      check((await db.query('select count(*)::integer as count from friend_duels where inviter_id=$1', [sender])).rows[0].count === 12,
        'Hourly allowance permits exactly 12 real invitations even when each is cancelled');
      await denied(() => create(sender, recipient), /duel_rate_limit/);
    });

    await isolated(async () => {
      const sender = fixtureId(1100), recipient = fixtureId(1101);
      await addUser(sender); await addUser(recipient); await addFriend(sender, recipient);
      // History is older than an hour so only the daily cap can deny creation.
      await db.query(`insert into friend_duels(inviter_id,invitee_id,status,created_at,expires_at,completed_at)
        select $1::uuid,$2::uuid,'cancelled',clock_timestamp()-interval '2 hours',
          clock_timestamp()-interval '110 minutes',clock_timestamp()-interval '119 minutes'
        from generate_series(1,40)`, [sender, recipient]);
      await denied(() => create(sender, recipient), /duel_rate_limit/);
      await db.query("update friend_duels set created_at=clock_timestamp()-interval '25 hours' where inviter_id=$1", [sender]);
      check((await create(sender, recipient)).status === 'pending', 'Invitations older than a day no longer consume daily allowance');
    });

    await isolated(async () => {
      const sender = fixtureId(1200);
      await addUser(sender);
      const recipients = Array.from({ length: 6 }, (_, index) => fixtureId(1201 + index));
      for (const recipient of recipients) { await addUser(recipient); await addFriend(sender, recipient); }
      const pending = [];
      for (const recipient of recipients.slice(0, 5)) pending.push(await create(sender, recipient));
      await denied(() => create(sender, recipients[5]), /duel_rate_limit/);
      check((await create(sender, recipients[0])).id === pending[0].id, 'Idempotent invite retries are allowed at the pending cap');
      await db.query("update friend_duels set expires_at=clock_timestamp()-interval '1 second' where id=$1", [pending[0].id]);
      check((await create(sender, recipients[5])).status === 'pending', 'Expired outgoing invitations release pending allowance without requiring list polling');
    });

    await isolated(async () => {
      const recipient = fixtureId(1300), sender = fixtureId(1301);
      await addUser(recipient); await addUser(sender); await addFriend(sender, recipient);
      // Other users fill the inbox; this sender has no invitation history.
      for (let index = 0; index < 20; index++) {
        const existingSender = fixtureId(1310 + index);
        await addUser(existingSender);
        await db.query('insert into friend_duels(inviter_id,invitee_id) values ($1,$2)', [existingSender, recipient]);
      }
      await denied(() => create(sender, recipient), /duel_rate_limit/);
      await db.query("update friend_duels set expires_at=clock_timestamp()-interval '1 second' where inviter_id=$1", [fixtureId(1310)]);
      check((await create(sender, recipient)).status === 'pending', 'Expired incoming invitations release the recipient inbox cap');
    });

    const privileges = (await db.query("select tablename, rowsecurity from pg_tables where schemaname='public' and tablename in ('duel_questions','friend_duels','friend_duel_rounds','friend_duel_answers')")).rows;
    check(privileges.every(t => t.rowsecurity), 'All duel tables enable row level security');
    // Install the upgrade while a real legacy match is active.
    const legacy = await create();
    await respond(B, legacy.id, 'accept');
    await db.exec(fs.readFileSync(path.join(root, 'supabase/migrations/20261003120000_friend_duel_round_feedback.sql'), 'utf8'));
    await moveClock(legacy.id, 1);
    check((await get(A, legacy.id)).scoring_version === 1, 'Already accepted matches retain legacy rules after upgrade');
    await answer(A, legacy.id, 0, 0);
    await moveClock(legacy.id, 141);
    check((await get(A, legacy.id)).status === 'completed', 'Legacy answer and settlement continue after helper migration');
    const helperGrants = (await db.query(`select p.proname, has_function_privilege('authenticated',p.oid,'EXECUTE') as auth,
      has_function_privilege('anon',p.oid,'EXECUTE') as anon from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='private' and (p.proname like 'duel_%' or p.proname='answer_friend_duel')`)).rows;
    check(helperGrants.every(f => !f.auth && !f.anon), 'All new and retained legacy helpers deny client execution');
    async function shift(id, seconds) {
      await db.query("update friend_duels set starts_at=starts_at-$2*interval '1 second' where id=$1", [id, seconds]);
      await db.query("update friend_duel_rounds set starts_at=starts_at-$2*interval '1 second', resolved_at=resolved_at-$2*interval '1 second' where duel_id=$1", [id, seconds]);
      await db.query("update friend_duel_answers set answered_at=answered_at-$2*interval '1 second' where duel_id=$1", [id, seconds]);
    }
    await isolated(async () => {
      const fresh = await create(); await respond(B, fresh.id, 'accept');
      await moveClock(fresh.id, 1);
      const live = await get(A, fresh.id);
      check(live.scoring_version === 2 && live.phase === 'question' && live.results.length === 0, 'New matches start with V2 rules and no answer keys');
      const keys = (await db.query('select * from friend_duel_rounds where duel_id=$1 order by round_index', [fresh.id])).rows;
      const locked = await answer(A, fresh.id, 0, keys[0].correct_index);
      const observer = await get(B, fresh.id);
      check(locked.my_score === 0 && locked.round_result === null && observer.opponent_answered && !observer.my_answer,
        'Opponent lock status never exposes answer/correctness or live score');
      check(!JSON.stringify(observer).includes('correct_index'), 'No answer keys before both locks');
      const revealed = await answer(B, fresh.id, 0, (keys[0].correct_index + 1) % 4);
      check(revealed.phase === 'reveal' && revealed.current_question === null && revealed.round_result.round_index === 0,
        'Second lock immediately resolves round without waiting for 20 seconds');
      check(revealed.round_result.my_points === 0 && revealed.round_result.opponent_first_bonus === 10
        && revealed.round_result.opponent_points === 80 + Math.floor((20000-locked.my_answer.response_ms)/1000), 'Correct + speed + first bonus use server time, wrong receives zero');
      check(revealed.results.length === 1 && Date.parse(revealed.reveal_ends_at)-Date.parse(revealed.round_result.resolved_at) === 3000,
        'Only resolved round is exposed and countdown is exactly three seconds');
      const retry = await answer(A, fresh.id, 0, keys[0].correct_index);
      check(retry.my_answer.answered_at === locked.my_answer.answered_at && retry.results.length === 1, 'Repeated lock cannot rescore or restart reveal');
      await denied(() => answer(A, fresh.id, 1, 0), /duel_round_closed/);
      await denied(() => answer(A, fresh.id, 0, (keys[0].correct_index + 1)%4), /duel_answer_locked/);
      await shift(fresh.id, 3.1);
      check((await get(A, fresh.id)).current_question.round_index === 1, 'Next question opens three seconds after early resolution');
      await denied(() => answer(B, fresh.id, 0, keys[0].correct_index), /duel_answer_locked/);
      for (let index = 1; index < 7; index++) {
        await answer(A, fresh.id, index, keys[index].correct_index);
        const result = await answer(B, fresh.id, index, keys[index].correct_index);
        check(result.phase === 'reveal' && result.round_result.my_first_bonus === 0 && result.round_result.opponent_first_bonus === 10,
          `Round ${index + 1}: both correct, only first gets bonus`);
        if (index === 6) check(result.status === 'active', 'Last round result is visible before match completion');
        await shift(fresh.id, 3.1);
        await get(A, fresh.id);
      }
      const finished = await get(A, fresh.id);
      check(finished.status === 'completed' && finished.results.length === 7 && finished.winner_id === A && finished.my_score <= 700,
        'Seven early resolved rounds finish with authoritative bounded point totals');
      check(finished.my_score === finished.results.reduce((sum, r) => sum + r.my_points, 0), 'Final score equals displayed round breakdown');
      const rematch = await create(); check(rematch.id !== fresh.id && rematch.scoring_version === 2, 'Rematch starts a fresh V2 invitation');
    });
    await isolated(async () => {
      const fresh = await create(); await respond(B, fresh.id, 'accept');
      await moveClock(fresh.id, 21);
      const reveal = await get(A, fresh.id);
      check(reveal.phase === 'reveal' && reveal.round_result.my_option_index === null && reveal.round_result.my_points === 0,
        'Timeout resolves two absent answers as zero');
      await denied(() => answer(A, fresh.id, 0, 0), /duel_round_closed/);
      await shift(fresh.id, 200);
      const finished = await get(A, fresh.id);
      check(finished.status === 'completed' && finished.winner_id === null && finished.my_response_ms === 140000,
        'Reconnect catches up multiple timed-out rounds and preserves a zero-score draw');
    });
    await isolated(async () => {
      const fresh = await create(); await respond(B, fresh.id, 'accept'); await moveClock(fresh.id, 1); await get(A, fresh.id);
      const key = (await db.query('select correct_index from friend_duel_rounds where duel_id=$1 and round_index=0', [fresh.id])).rows[0].correct_index;
      await answer(A, fresh.id, 0, key);
      const forfeited = await rpc(B, 'forfeit_friend_duel', [fresh.id]);
      check(forfeited.status === 'forfeited' && forfeited.winner_id === A && forfeited.results.length === 1 && forfeited.opponent_score > 70,
        'Forfeit scores started round, reveals no future keys and awards opponent the win');
      check((await rpc(A, 'forfeit_friend_duel', [fresh.id])).winner_id === A, 'V2 forfeit retries cannot reverse winner');
    });
    await isolated(async () => {
      const fresh = await create(); await respond(B, fresh.id, 'accept'); await moveClock(fresh.id, 1); await get(A, fresh.id);
      await db.query(`insert into friend_duel_answers(duel_id,round_index,user_id,option_index,answered_at,response_ms)
        select r.duel_id,0,u.id,r.correct_index,r.starts_at,0 from friend_duel_rounds r cross join auth.users u
        where r.duel_id=$1 and r.round_index=0 and u.id in ($2,$3)`, [fresh.id,A,B]);
      const tied = await get(A, fresh.id);
      check(tied.round_result.my_points === 100 && tied.round_result.opponent_points === 100,
        'Exact server-time tie awards both first bonus and maximum 100 points');
      await shift(fresh.id, 200);
      check((await get(A, fresh.id)).winner_id === null, 'Equal point totals are draws without hidden response-time tie break');
    });
    console.log(`Duel PostgreSQL integration: ${checks} checks passed (70 questions, legacy + V2 RPCs and permission checks).`);
  } finally { await db.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
