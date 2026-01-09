import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { acceptDocuments, type BackendProfile } from '../services/authApi';
import { ApiError } from '../services/apiClient';

type ConsentModalProps = {
  isOpen: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  onAccepted: (profile: BackendProfile) => void;
  onLogout: () => void;
};

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  termsAccepted,
  privacyAccepted,
  onAccepted,
  onLogout,
}) => {
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTermsChecked(Boolean(termsAccepted));
    setPrivacyChecked(Boolean(privacyAccepted));
    setLoading(false);
    setError(null);
  }, [isOpen, termsAccepted, privacyAccepted]);

  const canSubmit = useMemo(() => termsChecked && privacyChecked && !loading, [termsChecked, privacyChecked, loading]);
  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const payload: { termsAccepted?: boolean; privacyAccepted?: boolean } = {};
      if (!termsAccepted && termsChecked) payload.termsAccepted = true;
      if (!privacyAccepted && privacyChecked) payload.privacyAccepted = true;
      const profile = await acceptDocuments(payload);
      onAccepted(profile);
    } catch (e: any) {
      const message =
        e instanceof ApiError
          ? 'Не удалось сохранить согласие. Попробуйте еще раз.'
          : e?.message || 'Не удалось сохранить согласие.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#030712]/90 backdrop-blur-md" />

      <div className="relative w-full max-w-lg bg-[#0a0f1e] border border-white/10 rounded-3xl shadow-2xl shadow-purple-900/20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vibe-500 via-purple-500 to-vibe-500" />

        <div className="p-7 sm:p-8">
          <h2 className="text-2xl font-bold font-display text-white mb-2 text-center">Примите условия сервиса</h2>
          <p className="text-slate-400 text-sm mb-6">
            Чтобы продолжить использование сервиса, необходимо принять следующие документы.
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#02050e] px-4 py-3">
              <input
                type="checkbox"
                checked={termsChecked}
                disabled={termsAccepted}
                onChange={(e) => setTermsChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-vibe-500 focus:ring-vibe-500 disabled:opacity-70"
              />
              <span className="text-sm text-slate-300 leading-snug">
                Я принимаю{' '}
                <a
                  href="/agreement.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-vibe-400 hover:text-vibe-300 transition-colors underline underline-offset-4"
                >
                  Пользовательское соглашение
                </a>
                {termsAccepted ? <span className="text-slate-500"> (уже принято)</span> : null}
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#02050e] px-4 py-3">
              <input
                type="checkbox"
                checked={privacyChecked}
                disabled={privacyAccepted}
                onChange={(e) => setPrivacyChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-vibe-500 focus:ring-vibe-500 disabled:opacity-70"
              />
              <span className="text-sm text-slate-300 leading-snug">
                Я принимаю{' '}
                <a
                  href="/privacy.docx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-vibe-400 hover:text-vibe-300 transition-colors underline underline-offset-4"
                >
                  Политику конфиденциальности
                </a>
                {privacyAccepted ? <span className="text-slate-500"> (уже принято)</span> : null}
              </span>
            </label>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl p-4 text-sm border bg-red-500/10 border-red-500/20 text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onLogout}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Выйти
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 bg-gradient-to-r from-vibe-600 to-purple-600 hover:from-vibe-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Подтвердить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
