import React, { useEffect, useState, useCallback } from 'react';
import { X, Mail, Lock, User as UserIcon, ArrowRight, Loader2, Chrome } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { me, loginWithEmail, registerWithEmail } from '../services/authApi';
import { userFromProfile } from '../services/userFromProfile';
import { ApiError } from '../services/apiClient';
import type { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: User) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthInProgress, setOauthInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
    setInfo(null);
    setLoading(false);
    setOauthInProgress(false);
    setMode(initialMode);
  }, [initialMode]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    resetForm();
  }, [isOpen, resetForm]);

  useEffect(() => {
    const handleFocus = () => {
      if (!oauthInProgress) return;
      setLoading(false);
      setOauthInProgress(false);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [oauthInProgress]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOauthInProgress(false);
    setError(null);
    setInfo(null);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(name, email, password);
      }

      let profile: Awaited<ReturnType<typeof me>>;
      try {
        profile = await me();
      } catch (err) {
        if (mode === 'register' && err instanceof ApiError && err.status === 401) {
          setInfo('Проверьте почту: возможно нужно подтвердить email перед входом.');
          return;
        }
        throw err;
      }
      onAuthenticated(userFromProfile(profile));
      handleClose();
    } catch (e: any) {
      const message =
        e?.message || 'Ошибка авторизации.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setOauthInProgress(true);
    setError(null);
    setInfo(null);

    try {
      if (!supabase) {
        throw new Error('SUPABASE_ENV_MISSING');
      }

      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (oauthError) throw oauthError;
    } catch (e: any) {
      const message =
        e?.message === 'SUPABASE_ENV_MISSING'
          ? 'Не настроены переменные окружения Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'
          : e?.message || 'Ошибка входа через Google.';
      setError(message);
      setOauthInProgress(false);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#030712]/90 backdrop-blur-md"
      ></div>

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-[#0a0f1e] border border-white/10 rounded-3xl shadow-2xl shadow-purple-900/20 overflow-hidden animate-blob-enter">
        {/* Decor */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vibe-500 via-purple-500 to-pink-500"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <button 
          onClick={handleClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pt-10">
          <h2 className="text-3xl font-bold font-display text-white mb-2 text-center">
            {mode === 'login' ? 'Welcome Back' : 'Start Coding'}
          </h2>
          <p className="text-slate-400 text-center mb-8 text-sm">
            {mode === 'login' 
              ? 'Войдите, чтобы продолжить обучение' 
              : 'Создайте аккаунт и начните путь Vibe Coder'}
          </p>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white text-void font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-3 mb-6"
          >
            <Chrome className="w-5 h-5" />
            Продолжить с Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0f1e] px-2 text-slate-500">Или через Email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Имя</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-vibe-400 transition-colors" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#02050e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-vibe-500 focus:ring-1 focus:ring-vibe-500 transition-all placeholder:text-slate-700 font-medium"
                    placeholder="Neo"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-vibe-400 transition-colors" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#02050e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-vibe-500 focus:ring-1 focus:ring-vibe-500 transition-all placeholder:text-slate-700 font-medium"
                  placeholder="neo@matrix.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Пароль</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-vibe-400 transition-colors" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#02050e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-vibe-500 focus:ring-1 focus:ring-vibe-500 transition-all placeholder:text-slate-700 font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-vibe-600 to-purple-600 hover:from-vibe-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Войти в систему' : 'Создать аккаунт'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {(error || info) && (
            <div
              className={`mt-5 rounded-2xl p-4 text-sm border ${
                error
                  ? 'bg-red-500/10 border-red-500/20 text-red-200'
                  : 'bg-white/5 border-white/10 text-slate-300'
              }`}
            >
              {error ?? info}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
              <button 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="ml-2 text-vibe-400 font-bold hover:text-vibe-300 transition-colors underline underline-offset-4"
              >
                {mode === 'login' ? 'Регистрация' : 'Войти'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
