import { supabase } from '../supabase';
import {
  validateCompanyName,
  type CompanyNameValidationCode,
  type CompanyNameValidationResult,
} from '../utils/companyNameValidation';

export type CompanyNameAvailabilityStatus =
  | 'idle'
  | 'invalid'
  | 'checking'
  | 'available'
  | 'unavailable'
  | 'error'
  | 'saved';

export interface CompanyNameAvailabilityResult extends CompanyNameValidationResult {
  status: Exclude<CompanyNameAvailabilityStatus, 'idle' | 'checking' | 'saved'>;
}

export interface CompanyNameSaveResult extends CompanyNameValidationResult {
  status: 'saved' | 'invalid' | 'unavailable' | 'error';
}

interface AvailabilityRpcRow {
  available?: boolean;
  valid?: boolean;
  code?: string;
  message?: string;
  normalized_lookup?: string;
}

interface SaveRpcRow {
  success?: boolean;
  valid?: boolean;
  code?: string;
  message?: string;
  company_name_display?: string;
  normalized_lookup?: string;
}

function firstRow<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T | undefined) ?? null;
  return data && typeof data === 'object' ? data as T : null;
}

function withStatus<T extends CompanyNameAvailabilityResult['status'] | CompanyNameSaveResult['status']>(
  validation: CompanyNameValidationResult,
  status: T,
  code: CompanyNameValidationCode,
  message: string,
): CompanyNameValidationResult & { status: T } {
  return { ...validation, status, code, message };
}

export async function checkCompanyNameAvailability(candidate: string): Promise<CompanyNameAvailabilityResult> {
  const validation = validateCompanyName(candidate);
  if (!validation.isValid) return withStatus(validation, 'invalid', validation.code, validation.message);

  const { data, error } = await supabase.rpc('check_company_name_availability', {
    candidate: validation.displayName,
  });
  if (error) {
    return withStatus(
      validation,
      'error',
      'network_error',
      'Şirket adı şu an kontrol edilemedi. Tekrar dene.',
    );
  }

  const row = firstRow<AvailabilityRpcRow>(data);
  if (!row) {
    return withStatus(validation, 'error', 'network_error', 'Şirket adı şu an kontrol edilemedi. Tekrar dene.');
  }
  if (row.available && row.valid) {
    return withStatus(validation, 'available', 'available', row.message || 'Bu şirket adı alınabilir.');
  }
  if (row.code === 'unavailable') {
    return withStatus(validation, 'unavailable', 'unavailable', row.message || 'Bu şirket adı zaten var.');
  }
  return withStatus(validation, 'invalid', (row.code || 'blocked') as CompanyNameValidationCode, row.message || 'Bu şirket adı kullanılamaz.');
}

export async function saveCompanyName(candidate: string): Promise<CompanyNameSaveResult> {
  const validation = validateCompanyName(candidate);
  if (!validation.isValid) return withStatus(validation, 'invalid', validation.code, validation.message);

  const { data, error } = await supabase.rpc('set_company_name', {
    candidate: validation.displayName,
  });
  if (error) {
    return withStatus(validation, 'error', 'network_error', 'Şirket adı kaydedilemedi. Tekrar dene.');
  }

  const row = firstRow<SaveRpcRow>(data);
  if (!row) return withStatus(validation, 'error', 'network_error', 'Şirket adı kaydedilemedi. Tekrar dene.');
  if (row.success && row.valid) {
    const saved = validateCompanyName(row.company_name_display || validation.displayName);
    return withStatus(saved, 'saved', 'saved', row.message || 'Şirket adı kaydedildi.');
  }
  if (row.code === 'race_conflict') {
    return withStatus(validation, 'unavailable', 'unavailable', 'Bu şirket adı az önce alınmış. Başka bir isim dene.');
  }
  if (row.code === 'unavailable') {
    return withStatus(validation, 'unavailable', 'unavailable', row.message || 'Bu şirket adı zaten var.');
  }
  if (row.code === 'network_error' || row.code === 'not_authenticated') {
    return withStatus(validation, 'error', 'network_error', 'Şirket adı kaydedilemedi. Tekrar dene.');
  }
  return withStatus(validation, 'invalid', (row.code || 'blocked') as CompanyNameValidationCode, row.message || 'Bu şirket adı kullanılamaz.');
}
