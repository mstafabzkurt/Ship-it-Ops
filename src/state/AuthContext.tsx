import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import * as Linking from 'expo-linking';

import { normalizeAuthError, type NormalizedAuthError } from '../auth/authErrors';
import { supabase } from '../supabase';

export interface EmailPasswordCredentials {
  email: string;
  password: string;
}

export type AuthActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: NormalizedAuthError };

export interface SignInResult {
  session: Session;
  user: User;
}

export interface SignUpResult {
  session: Session | null;
  user: User | null;
  requiresEmailConfirmation: boolean;
}

export interface GoogleSignInResult {
  url: string | null;
  requiresNativeContinuation: boolean;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithPassword: (
    credentials: EmailPasswordCredentials,
  ) => Promise<AuthActionResult<SignInResult>>;
  signUpWithPassword: (
    credentials: EmailPasswordCredentials,
  ) => Promise<AuthActionResult<SignUpResult>>;
  signInWithGoogle: () => Promise<AuthActionResult<GoogleSignInResult>>;
  signOut: () => Promise<AuthActionResult<void>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);
        setIsLoading(false);
      },
    );

    const restoreSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          if (__DEV__) {
            const normalizedError = normalizeAuthError(error);
            console.warn('[AuthContext] Oturum geri yüklenemedi.', {
              code: normalizedError.code,
              status: normalizedError.debug.status,
            });
          }
          setSession(null);
          return;
        }

        setSession(data.session);
      } catch (error) {
        if (isMounted) {
          if (__DEV__) {
            const normalizedError = normalizeAuthError(error);
            console.warn('[AuthContext] Oturum geri yüklenemedi.', {
              code: normalizedError.code,
              status: normalizedError.debug.status,
            });
          }
          setSession(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void supabase.auth.startAutoRefresh();
      } else {
        void supabase.auth.stopAutoRefresh();
      }
    };

    handleAppStateChange(AppState.currentState);
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      void supabase.auth.stopAutoRefresh();
    };
  }, []);

  const signInWithPassword = useCallback(async (
    credentials: EmailPasswordCredentials,
  ): Promise<AuthActionResult<SignInResult>> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim(),
        password: credentials.password,
      });

      if (error) return { ok: false, error: normalizeAuthError(error) };

      return {
        ok: true,
        data: {
          session: data.session,
          user: data.user,
        },
      };
    } catch (error) {
      return { ok: false, error: normalizeAuthError(error) };
    }
  }, []);

  const signUpWithPassword = useCallback(async (
    credentials: EmailPasswordCredentials,
  ): Promise<AuthActionResult<SignUpResult>> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email.trim(),
        password: credentials.password,
      });

      if (error) return { ok: false, error: normalizeAuthError(error) };

      return {
        ok: true,
        data: {
          session: data.session,
          user: data.user,
          requiresEmailConfirmation: data.user !== null && data.session === null,
        },
      };
    } catch (error) {
      return { ok: false, error: normalizeAuthError(error) };
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthActionResult<GoogleSignInResult>> => {
    try {
      const redirectTo = Platform.OS === 'web' && typeof window !== 'undefined'
        ? `${window.location.origin}/`
        : Linking.createURL('/');
      const isNative = Platform.OS !== 'web';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          // Web redirects automatically. Native receives the provider URL so
          // a later phase can finish the flow with a deep-link browser session.
          skipBrowserRedirect: isNative,
        },
      });

      if (error) return { ok: false, error: normalizeAuthError(error) };

      return {
        ok: true,
        data: {
          url: data.url,
          requiresNativeContinuation: isNative,
        },
      };
    } catch (error) {
      return { ok: false, error: normalizeAuthError(error) };
    }
  }, []);

  const signOut = useCallback(async (): Promise<AuthActionResult<void>> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { ok: false, error: normalizeAuthError(error) };
      return { ok: true, data: undefined };
    } catch (error) {
      return { ok: false, error: normalizeAuthError(error) };
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    isAuthenticated: Boolean(session?.user),
    isLoading,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    signOut,
  }), [isLoading, session, signInWithGoogle, signInWithPassword, signOut, signUpWithPassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('[AuthContext] useAuth must be used inside <AuthProvider>');
  return context;
}
