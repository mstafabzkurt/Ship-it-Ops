import assert from 'node:assert/strict';
import { parseChatLink, splitChatLinks } from '../src/utils/chatLinks';
import { CHAT_THEMES, getChatTheme, getChatThemeStorageKey } from '../src/utils/chatThemes';

const id = '33333333-3333-4333-8333-333333333333';
const origin = 'https://preview.example.test';
assert.deepEqual(parseChatLink(`${origin}/duel/${id}`, origin), { kind: 'duel', matchId: id });
assert.deepEqual(parseChatLink(`shipit://duel/${id}`), { kind: 'duel', matchId: id });
assert.deepEqual(parseChatLink(`/duel/${id}`), { kind: 'duel', matchId: id });
assert.equal(parseChatLink(`https://evil.test/duel/${id}`, origin)?.kind, 'external');
assert.equal(parseChatLink(`https://ship-it-ops.vercel.app.evil.test/duel/${id}`)?.kind, 'external');
assert.equal(parseChatLink(`https://ship-it-ops.vercel.app@evil.test/duel/${id}`), null);
assert.equal(parseChatLink('javascript:alert(1)'), null);
assert.equal(parseChatLink('data:text/html,test'), null);
assert.equal(parseChatLink('file:///private'), null);
assert.equal(parseChatLink('/duel/not-an-id'), null);
assert.equal(parseChatLink(`shipit://other/${id}`), null);
const message = `Hazır mısın? (${origin}/duel/${id}). https://example.test/path?q=1!`;
const parts = splitChatLinks(message, origin);
assert.equal(parts.map((part) => part.text).join(''), message, 'Link parsing preserves original message text and punctuation');
assert.deepEqual(parts.filter((part) => part.link).map((part) => part.link?.kind), ['duel', 'external']);
assert.equal(getChatThemeStorageKey('', id), null);
assert.notEqual(getChatThemeStorageKey('a', 'b'), getChatThemeStorageKey('b', 'a'), 'Other account has independent preferences');
assert.notEqual(getChatThemeStorageKey('a', 'b'), getChatThemeStorageKey('a', 'c'), 'Other conversation has independent preferences');
assert.equal(getChatTheme('removed-preset').id, 'default');

function luminance(hex: string) {
  const components = hex.slice(1).match(/../g)!.map((part) => parseInt(part, 16) / 255).map((c) => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return components[0] * .2126 + components[1] * .7152 + components[2] * .0722;
}
function contrast(a: string, b: string) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
for (const preset of CHAT_THEMES) {
  if (!preset.palette) continue;
  const p = preset.palette;
  for (const bubble of [p.own, p.other]) {
    assert.ok(contrast(p.text, bubble) >= 4.5, `${preset.name}: message contrast`);
    assert.ok(contrast(p.link, bubble) >= 4.5, `${preset.name}: link contrast`);
  }
  assert.ok(contrast(p.muted, p.labelBackground) >= 4.5, `${preset.name}: timestamp contrast`);
}
console.log('Chat URL safety, account/conversation isolation and preset contrast checks passed.');
