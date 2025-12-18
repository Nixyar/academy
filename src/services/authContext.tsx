import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import { logout as apiLogout, me, setSession } from '@/services/authApi';
import { userFromProfile } from '@/services/userFromProfile';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  handleAuthCallback: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await me();
      setUser(userFromProfile(profile));
    } catch (err) {
      setUser(null);
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!supabase) {
      setError('Supabase не сконфигурирован');
      return;
    }

    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/#/auth/callback`,
      },
    });
  }, []);

  const handleAuthCallback = useCallback(async () => {
    if (!supabase) {
      setError('Supabase не сконфигурирован');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (exchangeError) throw exchangeError;

      const session = data.session;
      if (!session) throw new Error('Нет активной сессии Supabase');

      await setSession(session.access_token, session.refresh_token);
      await fetchProfile();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (supabase) await supabase.auth.signOut();
      await apiLogout();
      setUser(null);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile().catch(() => undefined);
  }, [fetchProfile]);

  const value = useMemo(
    () => ({ user, loading, error, loginWithGoogle, logout, fetchProfile, handleAuthCallback }),
    [user, loading, error, loginWithGoogle, logout, fetchProfile, handleAuthCallback],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
