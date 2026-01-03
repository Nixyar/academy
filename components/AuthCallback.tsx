import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { me, setSession } from '../services/authApi';
import { ApiError } from '../services/apiClient';
import { userFromProfile } from '../services/userFromProfile';
import type { User } from '../types';

export function AuthCallback(props: { onAuthenticated: (user: User) => void }) {
  const [error, setError] = useState<string | null>(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    let cancelled = false;

    async function run() {
      try {
        if (!supabase) throw new Error('SUPABASE_ENV_MISSING');

        const code = new URLSearchParams(window.location.search).get('code');
        if (!code) throw new Error('OAUTH_CODE_MISSING');

        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        if (!data.session) throw new Error('SESSION_MISSING');

        await setSession(data.session.access_token, data.session.refresh_token);

        const profile = await me();
        const user = userFromProfile(profile);

        if (cancelled) return;
        props.onAuthenticated(user);
        // Force navigation so we definitely leave the callback screen even if SPA routing listeners fail
        window.location.replace('/profile');
      } catch (e: any) {
        if (cancelled) return;
        console.error('Auth callback failed', e);
        const message =
          e?.message === 'SUPABASE_ENV_MISSING'
            ? 'Не настроены переменные окружения Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'
            : e?.message === 'OAUTH_CODE_MISSING'
              ? 'Не найден параметр code в URL. Проверьте Redirect URL в Supabase.'
              : e instanceof ApiError && e.status === 401
                ? 'Не удалось сохранить сессию на бэкенде (401). Проверьте, что /api/auth/session возвращает httpOnly cookies с Access-Control-Allow-Credentials.'
            : e?.message || 'Ошибка авторизации.';
        setError(message);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [props]);

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
          <div className="text-slate-300 text-sm">Подождите пару секунд…</div>
        )}
      </div>
    </div>
  );
}
