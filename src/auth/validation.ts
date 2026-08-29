export const MIN_PASSWORD_LENGTH = 6;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'E-posta adresini girin.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Geçerli bir e-posta adresi girin.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Şifrenizi girin.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`;
  }
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | null {
  if (!confirmation) return 'Şifrenizi tekrar girin.';
  if (password !== confirmation) return 'Şifreler birbiriyle eşleşmiyor.';
  return null;
}
