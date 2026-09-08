import { useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import AuthButton from '../../src/components/auth/AuthButton';
import AuthField from '../../src/components/auth/AuthField';
import AuthNotice from '../../src/components/auth/AuthNotice';
import AuthScreenShell from '../../src/components/auth/AuthScreenShell';
import {
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from '../../src/auth/validation';
import { useAuth } from '../../src/state/AuthContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';
import { getDashboardTokens } from '../../src/components/dashboard/dashboardTokens';

interface RegisterFieldErrors {
  email?: string;
  password?: string;
  passwordConfirmation?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const { signUpWithPassword } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmationRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  const validateForm = () => {
    const nextErrors: RegisterFieldErrors = {
      email: validateEmail(email) || undefined,
      password: validatePassword(password) || undefined,
      passwordConfirmation: validatePasswordConfirmation(password, passwordConfirmation) || undefined,
    };
    setFieldErrors(nextErrors);

    if (nextErrors.email) return 'email';
    if (nextErrors.password) return 'password';
    if (nextErrors.passwordConfirmation) return 'passwordConfirmation';
    return null;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setActionError('');
    const invalidField = validateForm();

    if (invalidField) {
      if (invalidField === 'email') emailRef.current?.focus();
      if (invalidField === 'password') passwordRef.current?.focus();
      if (invalidField === 'passwordConfirmation') confirmationRef.current?.focus();
      return;
    }

    setSubmitting(true);
    const result = await signUpWithPassword({ email, password });

    if (!result.ok) {
      setActionError(result.error.message);
      setSubmitting(false);
      return;
    }

    if (result.data.requiresEmailConfirmation) {
      setConfirmationEmail(email.trim());
    }
    setSubmitting(false);
    // Immediate-session signup is routed to Dashboard by the root guard.
  };

  if (confirmationEmail) {
    return (
      <AuthScreenShell
        eyebrow="KAYIT TAMAMLANDI"
        title="E-posta adresini doğrula"
        description="Oturum açmadan önce gelen kutundaki doğrulama bağlantısını kullan."
      >
        <View style={styles.confirmationState}>
          <View style={styles.confirmationIcon}>
            <Ionicons name="mail-unread-outline" size={28} color={tokens.colors.secondary} />
          </View>
          <Text style={styles.confirmationTitle}>Doğrulama bağlantısı gönderildi</Text>
          <Text style={styles.confirmationCopy}>
            <Text style={styles.confirmationEmail}>{confirmationEmail}</Text>
            {' adresini kontrol et. Doğrulamadan sonra giriş ekranına dönebilirsin.'}
          </Text>
          <AuthButton label="Giriş Ekranına Dön" onPress={() => router.replace('/(auth)/login')} />
        </View>
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      eyebrow="YENİ OPERATÖR"
      title="Hesabını oluştur"
      description="Yeni hesabın temiz ilerlemeyle başlar; cihazdaki eski ilerleme otomatik aktarılmaz."
    >
      <View style={styles.form}>
        <AuthField
          ref={emailRef}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          blurOnSubmit={false}
          error={fieldErrors.email}
          keyboardType="email-address"
          label="E-posta"
          onChangeText={(value) => {
            setEmail(value);
            if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="operator@shipit.dev"
          returnKeyType="next"
          textContentType="emailAddress"
          value={email}
        />
        <AuthField
          ref={passwordRef}
          autoComplete="new-password"
          blurOnSubmit={false}
          error={fieldErrors.password}
          hint={`En az ${MIN_PASSWORD_LENGTH} karakter kullan.`}
          isPassword
          isPasswordVisible={passwordVisible}
          label="Şifre"
          onChangeText={(value) => {
            setPassword(value);
            if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
          onSubmitEditing={() => confirmationRef.current?.focus()}
          onTogglePasswordVisibility={() => setPasswordVisible((visible) => !visible)}
          placeholder="Güçlü bir şifre oluştur"
          returnKeyType="next"
          textContentType="newPassword"
          value={password}
        />
        <AuthField
          ref={confirmationRef}
          autoComplete="new-password"
          error={fieldErrors.passwordConfirmation}
          isPassword
          isPasswordVisible={confirmationVisible}
          label="Şifre Tekrarı"
          onChangeText={(value) => {
            setPasswordConfirmation(value);
            if (fieldErrors.passwordConfirmation) {
              setFieldErrors((current) => ({ ...current, passwordConfirmation: undefined }));
            }
          }}
          onSubmitEditing={() => void handleSubmit()}
          onTogglePasswordVisibility={() => setConfirmationVisible((visible) => !visible)}
          placeholder="Şifrenizi tekrar girin"
          returnKeyType="done"
          textContentType="newPassword"
          value={passwordConfirmation}
        />

        {actionError ? <AuthNotice message={actionError} /> : null}

        <AuthButton
          accessibilityHint="E-posta ve şifreyle yeni Ship It Ops hesabı oluşturur"
          disabled={submitting}
          label="Hesap Oluştur"
          loading={submitting}
          onPress={() => void handleSubmit()}
        />

        <View style={styles.routeRow}>
          <Text style={styles.routePrompt}>Zaten hesabın var mı?</Text>
          <Link href="/(auth)/login" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Giriş yap"
              style={({ pressed }) => [styles.routeLink, pressed && styles.routeLinkPressed]}
            >
              <Text style={styles.routeLinkText}>Giriş Yap</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </AuthScreenShell>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  return StyleSheet.create({
    form: { width: '100%', gap: 4 },
    routeRow: { minHeight: 48, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 4 },
    routePrompt: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: tokens.colors.textMuted },
    routeLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderRadius: tokens.radius.sm },
    routeLinkPressed: { backgroundColor: tokens.colors.primarySoft, opacity: 0.85 },
    routeLinkText: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20, color: tokens.colors.secondary },
    confirmationState: { width: '100%', alignItems: 'flex-start', gap: 14 },
    confirmationIcon: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.radius.md,
      borderWidth: 1,
      borderColor: tokens.colors.secondary,
      backgroundColor: tokens.colors.secondarySoft,
    },
    confirmationTitle: { fontFamily: fonts.headingSemiBold, fontSize: 18, lineHeight: 24, color: tokens.colors.text },
    confirmationCopy: { marginBottom: 4, fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: tokens.colors.textMuted },
    confirmationEmail: { fontFamily: fonts.bodySemiBold, color: tokens.colors.text },
  });
}
