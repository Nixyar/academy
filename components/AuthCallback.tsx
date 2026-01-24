import { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { me, setSession } from '../services/authApi';
import { ApiError } from '../services/apiClient';
import { userFromProfile } from '../services/userFromProfile';
import type { User } from '../types';

export function AuthCallback(props: { onAuthenticated: (user: User) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'idle' | 'exchanging' | 'saving' | 'loadingProfile' | 'redirecting'>('idle');
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    async function run() {
      try {
        if (!supabase) throw new Error('SUPABASE_ENV_MISSING');

        const code = new URLSearchParams(window.location.search).get('code');
        if (!code) throw new Error('OAUTH_CODE_MISSING');

        setStage('exchanging');

        const exchangePromise = supabase.auth.exchangeCodeForSession(code);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('EXCHANGE_TIMEOUT')), 10000)
        );

        const { data, error: exchangeError } = await Promise.race([
          exchangePromise,
          timeoutPromise
        ]) as any;

        if (exchangeError) throw exchangeError;
        if (!data.session) throw new Error('SESSION_MISSING');

        setStage('saving');
        await setSession(data.session.access_token, data.session.refresh_token);

        setStage('loadingProfile');
        const profile = await me();

        const user = userFromProfile(profile);

        setStage('redirecting');
        props.onAuthenticated(user);

        // Give SPA navigation a chance to work first
        setTimeout(() => {
          if (window.location.pathname.startsWith('/auth/callback')) {
            window.location.replace('/profile');
          }
        }, 1000);
      } catch (e: any) {
        console.error('[AuthCallback] Auth callback failed:', e);
        const message =
          e?.message === 'SUPABASE_ENV_MISSING'
            ? 'Не настроены переменные окружения Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'
            : e?.message === 'OAUTH_CODE_MISSING'
              ? 'Не найден параметр code в URL. Проверьте Redirect URL в Supabase.'
              : e?.message === 'EXCHANGE_TIMEOUT'
                ? 'Превышено время ожидания обмена кода на сессию. Попробуйте авторизоваться заново.'
              : e instanceof ApiError && e.status === 401
                ? 'Не удалось сохранить сессию на бэкенде (401). Проверьте, что /api/auth/session возвращает httpOnly cookies с Access-Control-Allow-Credentials.'
            : e?.message || 'Ошибка авторизации.';
        setError(message);
      }
    }

    void run();
  }, []);

  const stageLabels = {
    idle: 'Инициализация...',
    exchanging: 'Обмен кода на сессию...',
    saving: 'Сохранение сессии...',
    loadingProfile: 'Загрузка профиля...',
    redirecting: 'Перенаправление...',
  };

  return (
    <div className="min-h-screen bg-void text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-[#0a0f1e] border border-white/10 rounded-3xl p-8 text-center">
        <h1 className="text-2xl font-bold font-display mb-2">Завершаем вход…</h1>
        <p className="text-slate-400 text-sm mb-6">
          Сохраняем сессию и загружаем профиль.
        </p>
        {error ? (
          <div className="text-red-300 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm">
            {error}
          </div>
        ) : (
          <div className="text-slate-300 text-sm">
            <div className="animate-pulse mb-2">{stageLabels[stage]}</div>
            <div className="text-xs text-slate-500">Подождите пару секунд…</div>
          </div>
        )}
      </div>
    </div>
  );
}
