import { isUuid } from './friends';

export type ChatLink = { kind: 'duel'; matchId: string } | { kind: 'external'; url: string };
export type ChatTextPart = { text: string; link: ChatLink | null };
const APP_ORIGIN = 'https://ship-it-ops.vercel.app';

/** Only our own origins/custom scheme can turn an untrusted message into app navigation. */
export function parseChatLink(value: string, currentOrigin?: string): ChatLink | null {
  try {
    const relative = value.startsWith('/duel/');
    const url = new URL(value, relative ? APP_ORIGIN : undefined);
    if (url.username || url.password) return null;
    const native = url.protocol === 'shipit:';
    const web = url.protocol === 'https:' || url.protocol === 'http:';
    if (!native && !web) return null;
    const ownOrigin = relative || url.origin === APP_ORIGIN || (!!currentOrigin && url.origin === currentOrigin);
    const path = native && url.hostname ? `/${url.hostname}${url.pathname}` : url.pathname;
    const match = /^\/duel\/([^/]+)\/?$/.exec(path);
    if ((native || ownOrigin) && match && isUuid(match[1])) return { kind: 'duel', matchId: match[1] };
    return web && !relative ? { kind: 'external', url: url.href } : null;
  } catch {
    return null;
  }
}

export function splitChatLinks(body: string, currentOrigin?: string): ChatTextPart[] {
  const pattern = /(?:https?:\/\/|shipit:\/\/)[^\s<>"']+|\/duel\/[a-f\d-]+\/?/gi;
  const parts: ChatTextPart[] = [];
  let offset = 0;
  for (const match of body.matchAll(pattern)) {
    const start = match.index ?? 0;
    // Sentence punctuation is not part of the URL; preserve it in the message.
    const text = match[0].replace(/[.,!?;:)}\]]+$/, '');
    if (start > offset) parts.push({ text: body.slice(offset, start), link: null });
    parts.push({ text, link: parseChatLink(text, currentOrigin) });
    offset = start + text.length;
  }
  if (offset < body.length) parts.push({ text: body.slice(offset), link: null });
  return parts;
}
