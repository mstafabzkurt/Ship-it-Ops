export const COMPANY_NAME_MIN_LENGTH = 3;
export const COMPANY_NAME_MAX_LENGTH = 32;

export type CompanyNameValidationCode =
  | 'valid'
  | 'available'
  | 'unavailable'
  | 'blocked'
  | 'saved'
  | 'network_error'
  | 'not_authenticated'
  | 'race_conflict'
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'invalid_characters'
  | 'numeric_only'
  | 'url_or_email'
  | 'phone_number'
  | 'handle_or_hashtag'
  | 'reserved'
  | 'excessive_repetition';

export interface CompanyNameValidationResult {
  displayName: string;
  uniqueLookupName: string;
  moderationLookupName: string;
  isValid: boolean;
  code: CompanyNameValidationCode;
  message: string;
}

const RESERVED_COMPANY_NAMES = [
  'admin',
  'administrator',
  'root',
  'system',
  'support',
  'moderator',
  'mod',
  'shipitops',
  'ship it ops',
  'ship-it-ops',
  'shipit inc',
  'null',
  'undefined',
  'deleted user',
  'anonymous',
  'kullanıcı',
  'kullanici',
  'misafir',
  'guest',
  'test',
] as const;

const INVISIBLE_OR_CONTROL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\u2060\uFEFF]/u;
const ALLOWED_CHARACTERS = /^[A-Za-zÇĞİÖŞÜçğıöşü0-9 ._-]+$/u;
const EMAIL_OR_URL = /(?:https?:\/\/|www\.|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(?:^|\s)[a-z0-9-]+\.(?:com|net|org|io|co|com\.tr|net\.tr|org\.tr|dev|app|tech|xyz)(?:\/|\s|$))/iu;
const HANDLE_OR_HASHTAG = /[@#]/u;
const EXCESSIVE_REPETITION = /(.)\1{4,}/iu;

function foldTurkishCase(value: string): string {
  return value
    .replace(/I/g, 'ı')
    .replace(/İ/g, 'i')
    .toLowerCase();
}

export function normalizeCompanyNameDisplay(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ');
}

export function normalizeCompanyNameUniqueLookup(value: string): string {
  return foldTurkishCase(normalizeCompanyNameDisplay(value)).replace(/[\s._-]+/gu, '');
}

export function normalizeCompanyNameModerationLookup(value: string): string {
  const leetFolded = foldTurkishCase(normalizeCompanyNameDisplay(value))
    .replace(/[ç]/g, 'c')
    .replace(/[ğ]/g, 'g')
    .replace(/[ı]/g, 'i')
    .replace(/[ö]/g, 'o')
    .replace(/[ş]/g, 's')
    .replace(/[ü]/g, 'u')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/@/g, 'a');

  return leetFolded
    .replace(/[^a-z0-9]/g, '')
    .replace(/(.)\1{2,}/g, '$1$1');
}

const RESERVED_MODERATION_NAMES = new Set(
  RESERVED_COMPANY_NAMES.map(normalizeCompanyNameModerationLookup),
);

function result(
  value: string,
  isValid: boolean,
  code: CompanyNameValidationCode,
  message: string,
): CompanyNameValidationResult {
  const displayName = normalizeCompanyNameDisplay(value);
  return {
    displayName,
    uniqueLookupName: normalizeCompanyNameUniqueLookup(displayName),
    moderationLookupName: normalizeCompanyNameModerationLookup(displayName),
    isValid,
    code,
    message,
  };
}

function isPhoneNumberLike(value: string): boolean {
  const digitCount = (value.match(/\d/g) ?? []).length;
  return digitCount >= 7 && /^[\d+().\s-]+$/u.test(value);
}

export function validateCompanyName(value: string): CompanyNameValidationResult {
  const displayName = normalizeCompanyNameDisplay(value);
  if (!displayName) return result(value, false, 'empty', 'Şirket adı boş bırakılamaz.');
  if (INVISIBLE_OR_CONTROL.test(value)) {
    return result(value, false, 'invalid_characters', 'Şirket adında geçersiz karakter var.');
  }

  const characterLength = Array.from(displayName).length;
  if (characterLength < COMPANY_NAME_MIN_LENGTH) {
    return result(value, false, 'too_short', 'Şirket adı en az 3 karakter olmalı.');
  }
  if (characterLength > COMPANY_NAME_MAX_LENGTH) {
    return result(value, false, 'too_long', 'Şirket adı en fazla 32 karakter olabilir.');
  }
  if (EMAIL_OR_URL.test(displayName)) {
    return result(value, false, 'url_or_email', 'Şirket adı bağlantı, e-posta veya telefon numarası içeremez.');
  }
  if (HANDLE_OR_HASHTAG.test(displayName)) {
    return result(value, false, 'handle_or_hashtag', 'Şirket adı kullanıcı etiketi veya hashtag içeremez.');
  }
  if (isPhoneNumberLike(displayName)) {
    return result(value, false, 'phone_number', 'Şirket adı bağlantı, e-posta veya telefon numarası içeremez.');
  }
  if (!ALLOWED_CHARACTERS.test(displayName)) {
    return result(value, false, 'invalid_characters', 'Şirket adında geçersiz karakter var.');
  }
  if (!normalizeCompanyNameUniqueLookup(displayName)) {
    return result(value, false, 'invalid_characters', 'Şirket adında geçersiz karakter var.');
  }
  if (/^\d+$/u.test(normalizeCompanyNameUniqueLookup(displayName))) {
    return result(value, false, 'numeric_only', 'Şirket adı yalnızca rakamlardan oluşamaz.');
  }
  if (EXCESSIVE_REPETITION.test(foldTurkishCase(displayName))) {
    return result(value, false, 'excessive_repetition', 'Şirket adında aşırı tekrarlanan karakterler var.');
  }
  if (RESERVED_MODERATION_NAMES.has(normalizeCompanyNameModerationLookup(displayName))) {
    return result(value, false, 'reserved', 'Bu şirket adı kullanılamaz.');
  }
  return result(value, true, 'valid', '');
}
