import { normalizeCompanyNameDisplay } from './companyNameValidation';

const COMPANY_NAME_SUGGESTIONS = [
  'Kod Atölyesi',
  'Veri Kulesi',
  'Piksel Labs',
  'Dev Durağı',
  'Bulut Takımı',
  'Terminal Works',
  'Byte Bahçesi',
  'Nova Yazılım',
  'Çekirdek Labs',
  'Akış Teknoloji',
  'Modül Studio',
  'Komut Merkezi',
  'Derleme Labs',
  'Algoritma Ekibi',
  'Sprint Atölyesi',
  'Uptime Studio',
  'Devre Labs',
  'Stack Takımı',
  'Kapsül Teknoloji',
  'Rota Yazılım',
] as const;

// Inject a [0, 1) random source for deterministic checks. Suggestions remain
// drafts and must pass the same validation/availability flow as typed names.
export function suggestCompanyName(currentName = '', random: () => number = Math.random): string {
  const currentDisplayName = normalizeCompanyNameDisplay(currentName);
  const candidates = COMPANY_NAME_SUGGESTIONS.filter((name) => name !== currentDisplayName);
  return normalizeCompanyNameDisplay(candidates[Math.floor(random() * candidates.length)]);
}
