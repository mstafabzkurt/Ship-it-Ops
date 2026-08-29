import type { AuthError } from '@supabase/supabase-js';

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'invalid_email'
  | 'weak_password'
  | 'existing_account'
  | 'email_confirmation_required'
  | 'network_error'
  | 'rate_limited'
  | 'unknown';

export interface NormalizedAuthError {
  code: AuthErrorCode;
  message: string;
  debug: {
    name: string;
    message: string;
    supabaseCode?: string;
    status?: number;
  };
}

const USER_MESSAGES: Record<AuthErrorCode, string> = {
  invalid_credentials: 'E-posta adresi veya şifre hatalı.',
  invalid_email: 'Geçerli bir e-posta adresi girin.',
  weak_password: 'Şifre güvenlik gereksinimlerini karşılamıyor.',
  existing_account: 'Bu e-posta adresiyle zaten bir hesap bulunuyor.',
  email_confirmation_required: 'Devam etmek için e-posta adresinizi doğrulayın.',
  network_error: 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.',
  rate_limited: 'Çok fazla deneme yapıldı. Lütfen kısa bir süre sonra tekrar deneyin.',
  unknown: 'Kimlik doğrulama işlemi tamamlanamadı. Lütfen tekrar deneyin.',
};

const getAuthErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    const authError = error as AuthError;
    return {
      name: error.name || 'Error',
      message: error.message,
      supabaseCode: authError.code,
      status: authError.status,
    };
  }

  return {
    name: 'UnknownError',
    message: typeof error === 'string' ? error : 'Unknown authentication error',
    supabaseCode: undefined,
    status: undefined,
  };
};

export function normalizeAuthError(error: unknown): NormalizedAuthError {
  const debug = getAuthErrorDetails(error);
  const supabaseCode = debug.supabaseCode?.toLowerCase();
  const searchableMessage = debug.message.toLowerCase();
  let code: AuthErrorCode = 'unknown';

  if (supabaseCode === 'invalid_credentials' || supabaseCode === 'user_not_found') {
    code = 'invalid_credentials';
  } else if (
    supabaseCode === 'email_address_invalid'
    || (supabaseCode === 'validation_failed' && searchableMessage.includes('email'))
    || searchableMessage.includes('invalid email')
  ) {
    code = 'invalid_email';
  } else if (supabaseCode === 'weak_password' || searchableMessage.includes('password should be')) {
    code = 'weak_password';
  } else if (
    supabaseCode === 'user_already_exists'
    || supabaseCode === 'email_exists'
    || searchableMessage.includes('already registered')
  ) {
    code = 'existing_account';
  } else if (supabaseCode === 'email_not_confirmed') {
    code = 'email_confirmation_required';
  } else if (
    debug.status === 429
    || supabaseCode === 'over_email_send_rate_limit'
    || supabaseCode === 'over_request_rate_limit'
  ) {
    code = 'rate_limited';
  } else if (
    debug.name.includes('Fetch')
    || debug.name.includes('Network')
    || searchableMessage.includes('failed to fetch')
    || searchableMessage.includes('network request failed')
  ) {
    code = 'network_error';
  }

  return {
    code,
    message: USER_MESSAGES[code],
    debug,
  };
}
