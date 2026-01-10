import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Timer, X } from 'lucide-react';
import type { Course } from '../types';
import { useBodyScrollLock } from './useBodyScrollLock';
import { initTbankCoursePurchase } from '../services/paymentsApi';
import { ApiError } from '../services/apiClient';

type PurchaseCourseModalProps = {
  isOpen: boolean;
  course: Course | null;
  onClose: () => void;
};

const formatPrice = (price: number | null | undefined, currency: string | null | undefined): string => {
  if (!Number.isFinite(price as number)) return '';
  const value = Number(price);
  const cur = String(currency || '').trim().toUpperCase();

  if (!cur || cur === 'RUB') {
    const formatted = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value);
    return `${formatted} ₽`;
  }

  if (cur === 'USD' || cur === 'EUR') {
    const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
    const sign = cur === 'USD' ? '$' : '€';
    return `${sign}${formatted}`;
  }

  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  return `${formatted} ${cur}`;
};

const calcDiscountPercent = (price: number | null | undefined, salePrice: number | null | undefined): number | null => {
  if (!Number.isFinite(price as number) || !Number.isFinite(salePrice as number)) return null;
  const original = Number(price);
  const sale = Number(salePrice);
  if (original <= 0) return null;
  if (sale >= original) return null;
  const pct = Math.round(((original - sale) / original) * 100);
  return pct > 0 ? pct : null;
};

export const PurchaseCourseModal: React.FC<PurchaseCourseModalProps> = ({ isOpen, course, onClose }) => {
  const [offerAccepted, setOfferAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setOfferAccepted(false);
    setIsSubmitting(false);
    setError(null);
  }, [isOpen, course?.id]);

  const originalPriceLabel = useMemo(
    () => formatPrice(course?.price ?? null, course?.currency ?? null),
    [course?.price, course?.currency],
  );
  const salePriceLabel = useMemo(
    () => formatPrice(course?.salePrice ?? null, course?.currency ?? null),
    [course?.salePrice, course?.currency],
  );
  const discountPercent = useMemo(
    () => calcDiscountPercent(course?.price ?? null, course?.salePrice ?? null),
    [course?.price, course?.salePrice],
  );
  const primaryPriceLabel = salePriceLabel || originalPriceLabel;
  const hasDiscount = Boolean(discountPercent) && Boolean(salePriceLabel) && Boolean(originalPriceLabel);
  const buttonLabel = (course?.salePrice ?? null) === 0 ? 'Начать обучение бесплатно' : 'Приобрести';

  if (!isOpen || !course) return null;

  const handlePurchase = async () => {
    if (!offerAccepted || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const { paymentUrl } = await initTbankCoursePurchase(course.id);
      window.location.href = paymentUrl;
    } catch (e: any) {
      const message =
        e instanceof ApiError
          ? 'Не удалось создать оплату. Попробуйте еще раз.'
          : e?.message || 'Не удалось создать оплату.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-modal-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-[500px] overflow-hidden rounded-[24px] bg-[#0d0d12] border border-white/10 shadow-2xl animate-modal-zoom-in">
        <div
          className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00A3FF] via-[#7000FF] to-[#00A3FF] animate-gradient-x"
          style={{ backgroundSize: '200% auto' }}
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pt-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight text-center">{course.title}</h2>
            {course.description ? (
              <p className="text-white/60 text-base leading-relaxed">{course.description}</p>
            ) : null}
          </div>

          <div className="mb-12 space-y-5">
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium">Бессрочный доступ к материалам</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium">Готовые шаблоны для старта</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium">Доступ к обновлениям материалов курса</span>
            </div>
          </div>

          {primaryPriceLabel ? (
            <div className="mb-6 p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                  Стоимость
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{primaryPriceLabel}</span>
                  {hasDiscount ? (
                    <span className="text-sm text-white/30 line-through">{originalPriceLabel}</span>
                  ) : null}
                </div>
              </div>
              {discountPercent ? (
                <div className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/20">
                  {discountPercent}% СКИДКА
                </div>
              ) : null}
            </div>
          ) : null}

          <label className="flex items-center gap-3 cursor-pointer group mb-8 p-1">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={offerAccepted}
                onChange={() => setOfferAccepted((prev) => !prev)}
                className="peer hidden"
              />
              <div className="w-5 h-5 rounded border border-white/20 bg-white/5 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                <svg
                  className={`w-3.5 h-3.5 text-white transition-opacity ${offerAccepted ? 'opacity-100' : 'opacity-0'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
              Я принимаю{' '}
              <a
                href="/offer.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline underline-offset-4 hover:text-blue-300"
              >
                условия публичной оферты
              </a>
            </span>
          </label>

          <button
            type="button"
            disabled={!offerAccepted || isSubmitting}
            onClick={handlePurchase}
            className={`
              w-full relative h-14 rounded-xl font-bold text-white text-lg transition-all
              overflow-hidden group
              ${offerAccepted && !isSubmitting ? 'opacity-100 scale-100 shadow-[0_0_20px_rgba(112,0,255,0.3)]' : 'opacity-50 scale-[0.98] cursor-not-allowed'}
            `}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#00A3FF] to-[#7000FF] transition-transform duration-500 group-hover:scale-110 active:scale-95" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : null}
              {buttonLabel}
            </span>
          </button>

          <div className="mt-3 text-center text-[11px] text-white/40">
            Оплачивая курс, вы соглашаетесь с условиями публичной оферты
          </div>

          {error ? (
            <div className="mt-4 text-center text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-2xl p-3">
              {error}
            </div>
          ) : null}

          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-center gap-6 opacity-40">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-white">
              <Shield className="w-3.5 h-3.5" />
              Безопасно
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-white">
              <Timer className="w-3.5 h-3.5" />
              Мгновенный доступ
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x { animation: gradient-x 3s ease infinite; }

        @keyframes modal-fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-modal-fade-in { animation: modal-fade-in 250ms ease-out; }

        @keyframes modal-zoom-in {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-modal-zoom-in { animation: modal-zoom-in 250ms ease-out; }
      `}</style>
    </div>
  );
};
