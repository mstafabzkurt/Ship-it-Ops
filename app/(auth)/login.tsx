import { useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import AuthButton from '../../src/components/auth/AuthButton';
import AuthField from '../../src/components/auth/AuthField';
import AuthNotice from '../../src/components/auth/AuthNotice';
import AuthScreenShell from '../../src/components/auth/AuthScreenShell';
import { validateEmail } from '../../src/auth/validation';
import { useAuth } from '../../src/state/AuthContext';
import { useTheme } from '../../src/state/ThemeContext';
import { fonts } from '../../src/theme/typography';
import { getDashboardTokens } from '../../src/components/dashboard/dashboardTokens';

interface LoginFieldErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const tokens = useMemo(() => getDashboardTokens(theme, width), [theme, width]);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const { signInWithGoogle, signInWithPassword } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const isBusy = submitting || googleSubmitting;

  const validateForm = () => {
    const nextErrors: LoginFieldErrors = {
      email: validateEmail(email) || undefined,
      password: password ? undefined : 'Şifrenizi girin.',
    };
    setFieldErrors(nextErrors);

    if (nextErrors.email) return 'email';
    if (nextErrors.password) return 'password';
    return null;
  };

  const handleSubmit = async () => {
    if (isBusy) return;
    setActionError('');
    const invalidField = validateForm();

    if (invalidField) {
      if (invalidField === 'email') emailRef.current?.focus();
      if (invalidField === 'password') passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    const result = await signInWithPassword({ email, password });
    if (!result.ok) setActionError(result.error.message);
    setSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    if (isBusy) return;
    setActionError('');
    setGoogleSubmitting(true);
    const result = await signInWithGoogle();

    if (!result.ok) {
      setActionError(result.error.message);
      setGoogleSubmitting(false);
      return;
    }

    if (result.data.requiresNativeContinuation) {
      setActionError('Google ile girişin native uygulama adımı henüz etkin değil. Web sürümünden devam edebilirsiniz.');
      setGoogleSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      eyebrow="OPERATÖR OTURUMU"
      title="Tekrar hoş geldin"
      description="Hesabınla giriş yap. Bu cihazdaki mevcut oyun ilerlemen korunur."
    >
      <View style={styles.form}>
        <AuthField
          ref={emailRef}
          accessibilityHint="Hesabınızda kullandığınız e-posta adresi"
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
          autoComplete="current-password"
          error={fieldErrors.password}
          isPassword
          isPasswordVisible={passwordVisible}
          label="Şifre"
          onChangeText={(value) => {
            setPassword(value);
            if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
          onSubmitEditing={() => void handleSubmit()}
          onTogglePasswordVisibility={() => setPasswordVisible((visible) => !visible)}
          placeholder="Şifrenizi girin"
          returnKeyType="done"
          textContentType="password"
          value={password}
        />

        {actionError ? <AuthNotice message={actionError} /> : null}

        <AuthButton
          accessibilityHint="E-posta ve şifreyle Ship It Ops oturumunu açar"
          disabled={isBusy}
          label="Giriş Yap"
          loading={submitting}
          onPress={() => void handleSubmit()}
        />

        <View accessibilityElementsHidden style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>VEYA</Text>
          <View style={styles.divider} />
        </View>

        <AuthButton
          accessibilityHint="Google hesabıyla web oturumunu başlatır"
          disabled={isBusy}
          icon={<Ionicons name="logo-google" size={19} color={tokens.colors.text} />}
          label="Google ile Devam Et"
          loading={googleSubmitting}
          onPress={() => void handleGoogleSignIn()}
          variant="secondary"
        />

        <View style={styles.routeRow}>
          <Text style={styles.routePrompt}>Henüz hesabın yok mu?</Text>
          <Link href="/(auth)/register" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Hesap oluştur"
              style={({ pressed }) => [styles.routeLink, pressed && styles.routeLinkPressed]}
            >
              <Text style={styles.routeLinkText}>Hesap Oluştur</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </AuthScreenShell>
  );
}

function makeStyles(tokens: ReturnType<typeof getDashboardTokens>) {
  return StyleSheet.create({
    form: { width: '100%', gap: 5 },
    dividerRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 12 },
    divider: { flex: 1, height: 1, backgroundColor: tokens.colors.dividerSubtle },
    dividerText: { fontFamily: fonts.monoMedium, fontSize: 9, lineHeight: 13, letterSpacing: 0.8, color: tokens.colors.textMuted },
    routeRow: { minHeight: 48, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 4 },
    routePrompt: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: tokens.colors.textMuted },
    routeLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderRadius: tokens.radius.sm },
    routeLinkPressed: { backgroundColor: tokens.colors.primarySoft, opacity: 0.85 },
    routeLinkText: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20, color: tokens.colors.secondary },
  });
}
