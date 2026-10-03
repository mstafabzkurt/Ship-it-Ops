/* Local exported-build QA. Every non-local request is intercepted; no real account or backend writes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
let playwright;
try { playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); }
catch { throw new Error('Set PLAYWRIGHT_MODULE to an installed Playwright module; this test installs no dependencies.'); }

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const output = path.join(root, 'docs', 'duel-qa');
const USER = '11111111-1111-4111-8111-111111111111';
const FRIEND = '22222222-2222-4222-8222-222222222222';
const MATCH = '33333333-3333-4333-8333-333333333333';
const REMATCH = '44444444-4444-4444-8444-444444444444';
const CONVERSATION = '66666666-6666-4666-8666-666666666666';
const iso = (ms = Date.now()) => new Date(ms).toISOString();
const prompt = 'Bir API isteğinin gecikmesi artıyor. İlk olarak hangi veriyi incelemelisin?';
const options = ['İstek sürelerini ve trace verilerini incele', 'Tüm logları sil', 'Üretim veritabanını yeniden başlat', 'Rate limit kontrolünü kapat'];
const save = { user_id: USER, save_version: 5, company_name: 'Fixture Ops', career_xp: 0, reputation: 0, company_budget: 1000, correct_answers: 0, wrong_answers: 0, completed_sessions: 0, joker_inventory: { codeReview: 3, gitRevert: 3, serverScaleUp: 3, snapshotBackup: 3 }, owned_item_ids: [], owned_cosmetic_ids: ['avatar_default', 'avatar_frame_default'], equipped_avatar_id: 'avatar_default', equipped_avatar_frame_id: 'avatar_frame_default', streak_days: [false, false, false, false, false, false, false], recent_question_ids: [], category_progress: {}, onboarding_completed: true, tutorial_completed: true, selected_interest_areas: [], claimed_badge_reward_ids: [], unseen_badge_ids: [] };
const profile = { user_id: FRIEND, company_name: 'Latency Labs', avatar_id: 'avatar_default', avatar_frame_id: 'avatar_frame_default', career_rank: 'Junior Developer', career_xp: 0, reputation: 0, success_rate: 0, completed_sessions: 0, selected_badge_ids: [], updated_at: iso() };
let mode = 'hub';
let startsAt = Date.now() - 2000;
let answer = null;
let rejectCreate = false;
let createCount = 0;
let answerCount = 0;
let forfeitCount = 0;
let expiresAt = Date.now() + 8 * 60000;
let noFriends = false;
let opponentAnswered = false;
let revealEndsAt = null;
let roundIndex = 0;
let messageCount = 0;
const requests = [];

function snapshot(id = MATCH) {
  const incoming = mode === 'incoming';
  const completed = mode === 'completed' || mode === 'forfeited';
  const status = completed ? mode : ['active', 'countdown', 'reveal'].includes(mode) ? 'active' : 'pending';
  const row = { id, inviter_id: incoming ? FRIEND : USER, invitee_id: incoming ? USER : FRIEND, opponent_id: FRIEND, status, created_at: iso(Date.now() - 60000), expires_at: iso(expiresAt), starts_at: status === 'active' || completed ? iso(startsAt) : null, completed_at: completed ? iso() : null, winner_id: completed ? USER : null, forfeited_by: mode === 'forfeited' ? FRIEND : null, my_score: completed ? 5 : 0, opponent_score: completed ? 3 : 0, my_response_ms: completed ? 54250 : 0, opponent_response_ms: completed ? 80100 : 0, server_now: iso(), current_round_index: status === 'active' && Date.now() >= startsAt ? 0 : null, current_question: null, my_answer: answer, results: null };
  Object.assign(row, { scoring_version: 2, phase: completed ? 'finished' : mode === 'reveal' ? 'reveal' : status === 'active' ? Date.now() >= startsAt ? 'question' : 'countdown' : 'pending', opponent_answered: opponentAnswered, reveal_ends_at: revealEndsAt, round_result: null, current_round_index: status === 'active' && Date.now() >= startsAt ? roundIndex : null });
  if (status === 'active' && Date.now() >= startsAt && mode !== 'reveal') row.current_question = { round_index: roundIndex, category: 'operations', prompt, options, round_starts_at: iso(startsAt), round_ends_at: iso(startsAt + 20000) };
  if (mode === 'reveal') {
    row.round_result = { round_index: roundIndex, category: 'operations', prompt, options, correct_index: 0, explanation: 'Trace verileri gecikmenin hangi aşamada oluştuğunu gösterir.', my_option_index: 0, opponent_option_index: 1, my_response_ms: 4000, opponent_response_ms: 2500, my_points: 96, opponent_points: 0, my_speed_bonus: 16, opponent_speed_bonus: 0, my_first_bonus: 10, opponent_first_bonus: 0, resolved_at: iso() };
    row.results = [row.round_result];
    row.my_score = 96;
  }
  if (completed) row.results = Array.from({ length: 7 }, (_, round_index) => ({ round_index, category: 'operations', prompt, options, correct_index: 0, explanation: 'Trace verileri gecikmenin hangi aşamada oluştuğunu gösterir.', my_option_index: round_index < 5 ? 0 : 1, opponent_option_index: round_index < 3 ? 0 : null, my_response_ms: 7750, opponent_response_ms: 11400 }));
  if (completed) {
    row.my_score = 460; row.opponent_score = 234;
    row.results.forEach((result) => Object.assign(result, { my_points: result.my_option_index === 0 ? 92 : 0, opponent_points: result.opponent_option_index === 0 ? 78 : 0, my_speed_bonus: result.my_option_index === 0 ? 12 : 0, opponent_speed_bonus: result.opponent_option_index === 0 ? 8 : 0, my_first_bonus: result.my_option_index === 0 ? 10 : 0, opponent_first_bonus: 0, resolved_at: iso() }));
  }
  return row;
}

async function main() {
  assert.ok(fs.existsSync(path.join(dist, 'index.html')), 'Run expo export --platform web before this test.');
  fs.mkdirSync(output, { recursive: true });
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const entry = html.match(/src="([^"]+\.js)"/)[1];
  const bundle = fs.readFileSync(path.join(dist, entry), 'utf8');
  const supabaseUrl = bundle.match(/https:\/\/[a-z0-9-]+\.supabase\.co/)[0];
  const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.resolve(dist, `.${pathname}`);
    if (!file.startsWith(`${dist}${path.sep}`) && file !== dist) { res.writeHead(403); res.end(); return; }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) file = path.join(dist, 'index.html');
    const ext = path.extname(file);
    const types = { '.html': 'text/html', '.js': 'application/javascript', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.json': 'application/json' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
    const context = await browser.newContext({ viewport: { width: 360, height: 800 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
    if (context.routeWebSocket) await context.routeWebSocket('**/*', (socket) => socket.close());
    await context.route('**/*', async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (url.origin === origin) return route.continue();
      requests.push({ path: url.pathname, method: req.method() });
      if (url.origin !== supabaseUrl) return route.abort();
      let data = [];
      if (url.pathname.startsWith('/auth/')) data = { id: USER, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated' };
      if (url.pathname === '/rest/v1/player_saves') data = save;
      if (url.pathname === '/rest/v1/friend_relationships') data = noFriends ? [] : [{ id: '55555555-5555-4555-8555-555555555555', requester_id: USER, addressee_id: FRIEND, status: 'accepted', created_at: iso(), updated_at: iso() }];
      if (url.pathname === '/rest/v1/public_profiles') data = req.headers().accept?.includes('object+json') ? profile : [profile];
      if (url.pathname.includes('/rpc/')) {
        const rpc = url.pathname.split('/').pop();
        const body = req.postDataJSON() || {};
        if (rpc === 'get_direct_message_unread_total') data = 0;
        if (rpc === 'list_friend_duels') data = noFriends || mode === 'none' ? [] : [snapshot()];
        if (rpc === 'get_direct_conversation_context') data = { conversation_id: CONVERSATION, can_send: true, is_friend: true, blocked_by_viewer: false };
        if (rpc === 'mark_conversation_read') data = true;
        if (rpc === 'list_direct_messages') data = [
          { id: '77777777-7777-4777-8777-777777777777', conversation_id: CONVERSATION, sender_id: FRIEND, message_type: 'text', body: `Birlikte oynayalım: ${origin}/duel/${MATCH}`, created_at: iso(Date.now() - 10000) },
          { id: '88888888-8888-4888-8888-888888888888', conversation_id: CONVERSATION, sender_id: USER, message_type: 'text', body: 'Tamam, hazırım.', created_at: iso(Date.now() - 5000) },
        ];
        if (rpc === 'send_direct_message') {
          messageCount++;
          data = { id: '99999999-9999-4999-8999-999999999999', conversation_id: CONVERSATION, sender_id: USER, message_type: 'text', body: body.message_body, created_at: iso() };
        }
        if (rpc === 'get_friend_duel') {
          if (mode === 'reveal' && Date.now() >= Date.parse(revealEndsAt)) {
            mode = 'active'; roundIndex = 1; startsAt = Date.parse(revealEndsAt); answer = null; opponentAnswered = false;
          }
          data = snapshot(body.match_id);
        }
        if (rpc === 'get_friend_duel_head_to_head') data = { opponent_id: FRIEND, wins: 3, losses: 1, draws: 1, total: 5 };
        if (rpc === 'create_friend_duel') {
          createCount++;
          if (rejectCreate) return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'P0001', message: 'duel_busy' }) });
          const id = mode === 'completed' ? REMATCH : MATCH;
          mode = 'outgoing'; answer = null;
          data = snapshot(id);
        }
        if (rpc === 'respond_friend_duel') {
          mode = body.response_action === 'accept' ? 'countdown' : body.response_action === 'decline' ? 'declined' : 'cancelled';
          startsAt = Date.now() + 5000;
          data = snapshot();
          if (mode === 'declined' || mode === 'cancelled') data.status = mode;
        }
        if (rpc === 'answer_friend_duel') {
          answerCount++;
          answer = { round_index: body.round_index, option_index: body.option_index, answered_at: iso(), response_ms: Date.now() - startsAt };
          data = snapshot();
        }
        if (rpc === 'forfeit_friend_duel') { forfeitCount++; mode = 'forfeited'; data = snapshot(); }
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data), headers: { 'access-control-allow-origin': '*', 'content-range': '0-0/1' } });
    });
    await context.addInitScript(({ storageKey, user }) => {
      const payload = btoa(JSON.stringify({ sub: user, exp: Math.floor(Date.now() / 1000) + 86400, role: 'authenticated' }));
      localStorage.setItem(storageKey, JSON.stringify({ access_token: `e30.${payload}.fixture`, refresh_token: 'fixture-refresh-token', expires_at: Math.floor(Date.now() / 1000) + 86400, expires_in: 86400, token_type: 'bearer', user: { id: user, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} } }));
      localStorage.setItem('@shipit_privacy_consent', JSON.stringify({ necessary: true, analytics: false, advertising: false, consentVersion: 1, updatedAt: new Date().toISOString() }));
      localStorage.setItem('@shipit_theme_id', localStorage.getItem('fixture-theme') || 'default');
    }, { storageKey, user: USER });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    async function shot(name) {
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > innerWidth);
      assert.equal(overflow, false, `Horizontal overflow: ${name}`);
      await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
    }
    await page.goto(`${origin}/duels`);
    const challenge = page.getByRole('button', { name: /Latency Labs.*Meydan Oku/ });
    await challenge.waitFor();
    assert.equal(await challenge.isEnabled(), true, 'The only friend is selected without an extra click');
    const challengeHeading = await page.getByRole('heading', { name: 'Meydan oku', exact: true }).boundingBox();
    const activityHeading = await page.getByRole('heading', { name: 'Kapışmaların', exact: true }).boundingBox();
    const challengeBox = await challenge.boundingBox();
    assert.ok(activityHeading.y > challengeBox.y + challengeBox.height && activityHeading.y > challengeHeading.y, 'Mobile activity must follow the challenge panel without overlap');
    await page.getByRole('button', { name: 'Devam eden', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.getByText('Sıradaki kapışma seni bekliyor', { exact: true }).waitFor();
    assert.equal(await page.getByText('İlk kapışma, ilk hikâye', { exact: true }).count(), 0, 'Only the selected activity empty state is shown');
    await page.getByRole('button', { name: 'Geçmiş', exact: true }).click();
    await page.getByText('İlk kapışma, ilk hikâye', { exact: true }).waitFor();
    await page.getByRole('button', { name: /^Davetler/ }).click();
    await page.getByRole('button', { name: 'Nasıl oynanır?', exact: true }).click();
    await page.getByRole('button', { name: 'Kuralları kapat', exact: true }).waitFor();
    await shot('rules-360-dark');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Kuralları kapat', exact: true }).waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.textContent?.includes('Nasıl oynanır'));
    assert.equal(await page.getByRole('button', { name: 'Nasıl oynanır?', exact: true }).evaluate(el => el === document.activeElement), true, 'Closing rules restores keyboard focus');
    await shot('hub-360-dark');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => localStorage.setItem('fixture-theme', 'daylight'));
    await page.reload();
    await challenge.waitFor();
    const desktopChallenge = await page.getByRole('heading', { name: 'Meydan oku', exact: true }).boundingBox();
    const desktopActivity = await page.getByRole('heading', { name: 'Kapışmaların', exact: true }).boundingBox();
    assert.ok(desktopActivity.x > desktopChallenge.x + desktopChallenge.width, 'Desktop activity is arranged beside the challenge');
    await shot('hub-1280-light');
    rejectCreate = true;
    await challenge.click();
    await page.getByText('Oyunculardan biri başka bir düelloda. Sonra tekrar dene.', { exact: true }).waitFor();
    await page.waitForTimeout(5500);
    assert.equal(await page.getByText('Oyunculardan biri başka bir düelloda. Sonra tekrar dene.', { exact: true }).isVisible(), true, 'Action errors must survive automatic polling');
    rejectCreate = false;
    await challenge.click();
    await page.getByText('Rakibin bekleniyor', { exact: true }).waitFor();
    assert.ok(page.url().includes(`/duel/${MATCH}`));
    await page.getByRole('button', { name: 'Davet Bağlantısını Kopyala', exact: true }).waitFor();
    await page.getByText('VS', { exact: true }).waitFor();
    await page.getByText('Aranızda 3–1 · 1 beraberlik', { exact: true }).waitFor();
    assert.equal(await page.getByText(/Davet \d+ dakika geçerli/).count(), 1, 'Lobby shows relative invite expiry');
    await shot('lobby-1280-light');
    await page.getByRole('button', { name: 'Davet Bağlantısını Kopyala', exact: true }).click();
    await page.getByRole('button', { name: /Kopyalandı/ }).waitFor();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), `${origin}/duel/${MATCH}`);
    await page.getByRole('button', { name: 'Davet Bağlantısını Kopyala', exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    mode = 'incoming';
    await page.evaluate(() => localStorage.setItem('fixture-theme', 'default'));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`${origin}/duel/${MATCH}`);
    await page.getByRole('button', { name: 'Daveti Kabul Et', exact: true }).waitFor();
    await shot('pending-390-dark');
    await page.getByRole('button', { name: 'Daveti Kabul Et', exact: true }).click();
    await page.getByText('Maç başlıyor', { exact: true }).waitFor();
    await page.getByText(prompt, { exact: true }).waitFor({ timeout: 15000 });
    mode = 'active';
    await page.setViewportSize({ width: 430, height: 932 });
    await page.getByRole('radio').first().click();
    await shot('active-430-dark');
    assert.equal(await page.getByText(/ · Doğru yanıt$/).count(), 0, 'Correctness leaked before completion');
    opponentAnswered = true;
    await page.getByText(/Rakip (cevapladı|yanıtını kilitledi)/).first().waitFor();
    assert.equal(await page.getByText(/ · Doğru yanıt$/).count(), 0, 'Opponent lock indicator must not reveal the answer key');
    await page.getByRole('button', { name: 'Yanıtı Kilitle', exact: true }).click();
    await page.getByText(/Yanıtın (kaydedildi|kilitlendi)/).waitFor();
    assert.equal(await page.getByRole('radio').first().getAttribute('aria-disabled'), 'true');
    assert.equal(answerCount, 1);
    mode = 'reveal'; opponentAnswered = true; revealEndsAt = iso(Date.now() + 3000);
    await page.getByText(/\+96/).first().waitFor();
    await page.getByText('Bu soruda sen daha çok puan aldın', { exact: true }).waitFor();
    await page.getByText('Doğru', { exact: true }).waitFor();
    await page.getByText('Yanlış', { exact: true }).waitFor();
    assert.equal(await page.getByLabel(/Sıradaki soru [123] saniye sonra/).isVisible(), true, 'Countdown remains visible beside the round result');
    await shot('round-feedback-430-dark');
    await page.getByText('SORU 2 / 7', { exact: true }).waitFor({ timeout: 6000 });
    assert.equal(await page.getByRole('radio').first().isEnabled(), true, 'The next round accepts a new answer without waiting for the old 20-second deadline');
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: 'Maçtan Çekil', exact: true }).click();
    assert.equal(forfeitCount, 0, 'Dismissed forfeit dialog must not mutate');
    await page.getByRole('button', { name: 'Geri dön', exact: true }).click();
    await challenge.waitFor();
    assert.equal(forfeitCount, 0, 'Leaving screen must not forfeit');
    mode = 'completed';
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${origin}/duel/${MATCH}`);
    await page.getByText('Kazandın', { exact: true }).waitFor();
    await page.getByText('Aranızdaki 5 maç: 3 galibiyet · 1 mağlubiyet · 1 beraberlik', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Soru 1, yanıtları göster', exact: true }).click();
    await shot('result-1280-dark');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => localStorage.setItem('fixture-theme', 'daylight'));
    await page.reload();
    await page.getByText('Kazandın', { exact: true }).waitFor();
    await shot('result-390-light');
    await page.getByRole('button', { name: 'Rövanş Daveti Gönder', exact: true }).click();
    await page.getByText('Rakibin bekleniyor', { exact: true }).waitFor();
    assert.ok(page.url().includes(`/duel/${REMATCH}`));
    assert.equal(createCount, 3);
    noFriends = true;
    await page.goto(`${origin}/duels`);
    await page.getByRole('button', { name: 'Şirket Ara', exact: true }).waitFor();
    await shot('empty-390-light');
    noFriends = false; mode = 'none';
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`${origin}/messages/${FRIEND}`);
    await page.getByText('Tamam, hazırım.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Konuşma seçeneklerini aç', exact: true }).click();
    await page.getByRole('button', { name: 'Sohbet Teması', exact: true }).click();
    await page.getByRole('radio', { name: 'Sisli Göl, Fotoğraf', exact: true }).click();
    await shot('chat-theme-picker-360-light');
    await page.getByRole('button', { name: 'Temayı Uygula', exact: true }).click();
    const chatThemeKey = `@shipit_chat_theme_v1:${USER}:${FRIEND}`;
    await page.waitForFunction((key) => localStorage.getItem(key) === 'forest', chatThemeKey);
    await shot('chat-wallpaper-360-light');
    await page.setViewportSize({ width: 1280, height: 900 });
    const canvas = await page.getByTestId('conversation-canvas').boundingBox();
    assert.ok(canvas.width >= 1278 && canvas.x <= 1, 'Desktop conversation fills the viewport instead of an 820px column');
    await shot('chat-wallpaper-1280-light');
    await page.setViewportSize({ width: 1920, height: 1080 });
    const wideCanvas = await page.getByTestId('conversation-canvas').boundingBox();
    assert.ok(wideCanvas.width >= 1918, 'Wide desktop also uses the full canvas');
    const wallpaper = await page.getByTestId('conversation-canvas').getByTestId('chat-wallpaper-image').boundingBox();
    assert.ok(wallpaper.width >= wideCanvas.width - 1 && wallpaper.height >= wideCanvas.height - 1, 'Wallpaper must cover the full canvas beyond its intrinsic image size');
    await shot('chat-wallpaper-1920-light');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => localStorage.setItem('fixture-theme', 'default'));
    await page.reload();
    await page.getByText('Tamam, hazırım.', { exact: true }).waitFor();
    await shot('chat-wallpaper-390-dark');
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), chatThemeKey), 'forest', 'Conversation theme survives reload');
    await page.getByRole('button', { name: 'Konuşma seçeneklerini aç', exact: true }).click();
    await page.getByRole('button', { name: 'Sohbet Teması', exact: true }).click();
    assert.equal(await page.getByRole('radio', { name: 'Sisli Göl, Fotoğraf', exact: true }).getAttribute('aria-checked'), 'true');
    await page.getByRole('radio', { name: 'Varsayılan, Uygulama teması', exact: true }).click();
    await page.getByRole('button', { name: 'Varsayılanı Kullan', exact: true }).click();
    await page.waitForFunction((key) => localStorage.getItem(key) === null, chatThemeKey);
    await page.getByRole('button', { name: 'Konuşma seçeneklerini aç', exact: true }).click();
    await page.getByRole('button', { name: 'Sohbet Teması', exact: true }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog', { name: 'Sohbet Teması', exact: true }).waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Konuşma seçeneklerini aç');
    mode = 'outgoing';
    await page.getByRole('link', { name: '1v1 davetini aç', exact: true }).click();
    await page.getByText('Rakibin bekleniyor', { exact: true }).waitFor();
    assert.ok(page.url().includes(`/duel/${MATCH}`), 'Existing chat invitation link navigates into the app');
    mode = 'none';
    await page.goto(`${origin}/messages/${FRIEND}`);
    await page.getByRole('button', { name: "1v1'e Davet Et", exact: true }).click();
    await page.getByText('Rakibin bekleniyor', { exact: true }).waitFor();
    assert.equal(createCount, 4, 'Chat creates a direct invitation without requiring link sharing');
    mode = 'incoming';
    await page.setViewportSize({ width: 360, height: 800 });
    await page.evaluate(() => localStorage.setItem('fixture-theme', 'daylight'));
    await page.goto(`${origin}/messages/${FRIEND}`);
    await page.getByRole('button', { name: 'Kabul Et', exact: true }).waitFor();
    await shot('chat-invitation-360-light');
    await page.getByRole('button', { name: 'Kabul Et', exact: true }).click();
    await page.getByText('Maç başlıyor', { exact: true }).waitFor();
    assert.ok(page.url().includes(`/duel/${MATCH}`), 'In-chat acceptance opens the match');
    mode = 'incoming';
    await page.goto(`${origin}/friends`);
    await page.getByText('YENİ 1V1 DAVETİ', { exact: true }).waitFor();
    await shot('global-invitation-360-light');
    await page.getByRole('button', { name: 'Davet bildirimini kapat', exact: true }).click();
    await page.getByText('YENİ 1V1 DAVETİ', { exact: true }).waitFor({ state: 'hidden' });
    assert.deepEqual(errors, [], 'Uncaught browser errors');
    console.log(JSON.stringify({ passed: true, screenshots: 17, widths: [360, 390, 430, 1280, 1920], themes: ['default', 'daylight'], chatTheme: 'forest', motion: ['reduce', 'no-preference'], answerCount, forfeitCount, createCount, messageCount, mockedBackendRequests: requests.length, externalRequestsAllowed: 0 }));
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
