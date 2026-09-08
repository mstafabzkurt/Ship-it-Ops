export function getWebOAuthRedirectUrl(origin: string): string {
  return new URL('/', origin).toString();
}
