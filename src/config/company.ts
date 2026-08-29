export const DEFAULT_COMPANY_NAME = 'ShipIt Inc.';
export const MAX_COMPANY_NAME_LENGTH = 48;

export function normalizeCompanyName(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_COMPANY_NAME;
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_COMPANY_NAME;
  return trimmed.slice(0, MAX_COMPANY_NAME_LENGTH);
}
