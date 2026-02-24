import React, { useState } from 'react';
import { X, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { loginWithEmail, registerWithEmail } from '../services/authApi';
import { supabase } from '../services/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError('Supabase не настроен. Проверьте переменные окружения.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) throw oauthError;
      // Supabase redirects to Google — browser will navigate away
    } catch (err: any) {
      setError(err.message || 'Ошибка входа через Google');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) {
          setError('Введите ваше имя.');
          setLoading(false);
          return;
        }
        await registerWithEmail(name.trim(), email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Invalid login') || msg.includes('invalid-credential') || msg.includes('401') || msg.includes('Unauthorized')) {
        setError('Неверный email или пароль.');
      } else if (msg.includes('already') || msg.includes('duplicate') || msg.includes('exists')) {
        setError('Этот email уже занят.');
      } else if (msg.includes('weak') || msg.includes('password') || msg.includes('6 char')) {
        setError('Пароль слишком простой (минимум 6 символов).');
      } else {
        setError(msg || 'Произошла ошибка. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-vibe-dark border border-gray-800 rounded-2xl shadow-2xl shadow-indigo-500/10 overflow-hidden animate-fade-in">
        {/* Glow Effect */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vibe-primary via-vibe-accent to-pink-500" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-vibe-card border border-gray-700 mb-4 text-white">
              <span className="font-bold text-xl">Ai</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'С возвращением!' : 'Создать аккаунт'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isLogin
                ? 'Войдите, чтобы сохранить свой прогресс'
                : 'Присоединяйтесь к Vibecoder Academy бесплатно'}
            </p>
          </div>

          {/* Social Auth */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-gray-900 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors mb-6"
          >
            {loading ? (
               <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Продолжить с Google
              </>
            )}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-vibe-dark text-gray-500">или</span>
            </div>
          </div>

          {/* Email Auth Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-900/20 border border-red-900/50 text-red-400 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!isLogin && (
               <div className="space-y-1">
                <label className="text-xs text-gray-400 ml-1">Имя</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-vibe-card/50 border border-gray-700 rounded-xl py-2.5 px-4 pl-10 text-white focus:outline-none focus:border-vibe-primary focus:ring-1 focus:ring-vibe-primary transition-all"
                    placeholder="Ваше имя"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <span className="text-xs font-bold">Aa</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-gray-400 ml-1">Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-vibe-card/50 border border-gray-700 rounded-xl py-2.5 px-4 pl-10 text-white focus:outline-none focus:border-vibe-primary focus:ring-1 focus:ring-vibe-primary transition-all"
                  placeholder="name@example.com"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 ml-1">Пароль</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-vibe-card/50 border border-gray-700 rounded-xl py-2.5 px-4 pl-10 text-white focus:outline-none focus:border-vibe-primary focus:ring-1 focus:ring-vibe-primary transition-all"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-vibe-primary to-vibe-accent text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : (isLogin ? 'Войти' : 'Зарегистрироваться')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
              <span className="text-vibe-primary font-medium">
                {isLogin ? 'Создать бесплатно' : 'Войти'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
