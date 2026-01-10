import React from 'react';
import { X } from 'lucide-react';
import { useBodyScrollLock } from './useBodyScrollLock';

type PaymentResultModalProps = {
  isOpen: boolean;
  status: 'success' | 'fail' | 'pending';
  onClose: () => void;
};

export const PaymentResultModal: React.FC<PaymentResultModalProps> = ({ isOpen, status, onClose }) => {
  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  const title =
    status === 'success' ? 'Оплата прошла успешно' : status === 'pending' ? 'Проверяем оплату…' : 'Оплата не прошла';
  const text =
    status === 'success'
      ? 'Доступ к курсу открыт. Можно начинать обучение.'
      : status === 'pending'
        ? 'Подождите пару секунд, подтверждаем статус платежа.'
        : 'Попробуйте еще раз или выберите другой способ оплаты.';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-modal-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-[480px] overflow-hidden rounded-[24px] bg-[#0d0d12] border border-white/10 shadow-2xl animate-modal-zoom-in">
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

        <div className="p-8 pt-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">{title}</h2>
          <p className="text-white/60 text-base leading-relaxed">{text}</p>

          <button
            type="button"
            onClick={onClose}
            className="mt-8 w-full h-12 rounded-xl font-bold text-white text-base transition-all overflow-hidden group bg-white/5 hover:bg-white/10 border border-white/10"
          >
            Закрыть
          </button>
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

