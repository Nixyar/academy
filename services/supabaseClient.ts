import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

const authStorage = typeof window !== 'undefined' ? window.localStorage : undefined;

export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: false,
      // Keep Supabase-managed data (incl. PKCE verifier) across the redirect roundtrip
      persistSession: true,
      storage: authStorage,
    },
  });
})();

export const clearSupabaseStoredSession = () => {
  if (typeof window === 'undefined') return;
  const storages = [window.localStorage, window.sessionStorage];
  storages.forEach((storage) => {
    if (!storage) return;
    Object.keys(storage)
      .filter((key) => key.startsWith('sb-'))
      .forEach((key) => storage.removeItem(key));
  });
};
