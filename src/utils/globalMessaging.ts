export interface GlobalMessagesVisibility {
  pathname: string;
  isAuthenticated: boolean;
  isPlayerReady: boolean;
  onboardingCompleted: boolean;
  tutorialCompleted: boolean;
  consentReady: boolean;
  keyboardVisible: boolean;
}

export function shouldShowGlobalMessagesShortcut(input: GlobalMessagesVisibility): boolean {
  if (!input.isAuthenticated || !input.isPlayerReady || !input.onboardingCompleted
    || !input.tutorialCompleted || !input.consentReady || input.keyboardVisible) return false;

  const pathname = input.pathname.replace(/^\/\(tabs\)/, '').replace(/\/$/, '') || '/';
  if (pathname === '/game' || pathname === '/profile') return false;
  if (pathname === '/messages' || pathname.startsWith('/messages/')) return false;
  if (pathname === '/question-detail' || pathname.startsWith('/question-detail/')) return false;
  return true;
}

export function formatGlobalUnreadBadge(unreadCount: number): string | null {
  const count = Math.max(0, Math.trunc(unreadCount));
  if (count === 0) return null;
  return count > 99 ? '99+' : String(count);
}

export function getMessagesShortcutAccessibilityLabel(unreadCount: number): string {
  return unreadCount > 0
    ? `Mesajlar, ${Math.trunc(unreadCount)} okunmamış mesaj`
    : 'Mesajlar';
}

export function shouldAnimateUnreadAttention(
  previousCount: number | null,
  unreadCount: number,
  reduceMotion: boolean,
  visible: boolean,
): boolean {
  return previousCount !== null && unreadCount > previousCount && !reduceMotion && visible;
}
