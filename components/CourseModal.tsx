import React, { useState } from 'react';
import type { Course, User } from '../types';
import { X, Play, CheckCircle2, Lock, Clock, BookOpen, CreditCard, Loader2, LogIn } from 'lucide-react';

interface CourseModalProps {
  course: Course;
  isOpen: boolean;
  isEnrolled: boolean;
  onClose: () => void;
  onStartCourse: () => void;
  onPurchaseCourse: () => void;
  user: User | null;
  onOpenAuth: () => void;
}

const CourseModal: React.FC<CourseModalProps> = ({
  course,
  isOpen,
  isEnrolled,
  onClose,
  onStartCourse,
  onPurchaseCourse,
  user,
  onOpenAuth,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const imageUrl = course.coverUrl || course.imageUrl || '';
  const price = course.salePrice ?? course.price ?? 0;
  const originalPrice = course.price ?? 0;
  const currency = course.currency || '₽';
  const features = course.features ?? [];

  const handleAction = async () => {
    // If free, allow starting even without user (Guest Mode)
    if (course.isFree) {
      onStartCourse();
      return;
    }

    // If paid and no user, prompt auth
    if (!user) {
      onClose();
      onOpenAuth();
      return;
    }

    if (isEnrolled) {
      onStartCourse();
    } else {
      setLoading(true);
      onPurchaseCourse();
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-vibe-dark border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors backdrop-blur-sm"
        >
          <X size={20} />
        </button>

        {/* Left Side: Visuals */}
        <div className="md:w-5/12 relative">
          <div className="h-48 md:h-full relative">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-vibe-primary/30 to-vibe-accent/30 flex items-center justify-center">
                <BookOpen size={64} className="text-gray-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-vibe-dark via-vibe-dark/40 to-transparent md:bg-gradient-to-r md:from-transparent md:to-vibe-dark" />

            <div className="absolute bottom-0 left-0 p-6 w-full">
              <div className="flex gap-2 mb-3">
                {course.level && (
                  <span className="px-3 py-1 bg-vibe-primary/90 text-white text-xs font-bold rounded-full shadow-lg">
                    {course.level}
                  </span>
                )}
                {!course.isFree && price > 0 && !isEnrolled && user && (
                  <span className="px-3 py-1 bg-yellow-500/90 text-black text-xs font-bold rounded-full shadow-lg">
                    Премиум
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2 drop-shadow-md">
                {course.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Right Side: Content & CTA */}
        <div className="md:w-7/12 p-6 md:p-8 overflow-y-auto bg-vibe-card flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-2">О курсе</h3>
            <p className="text-gray-400 leading-relaxed text-sm">
              {course.description}
            </p>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
                Чему вы научитесь
              </h3>
              <ul className="space-y-2">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                    <CheckCircle2 size={16} className="text-vibe-success shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Syllabus Preview */}
          <div className="mb-8 flex-grow">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Программа курса</span>
              <span className="text-xs text-gray-500 normal-case flex items-center gap-1">
                <Clock size={12} /> {(course.lessons ?? []).length} уроков
              </span>
            </h3>
            <div className="space-y-2 bg-gray-900/50 rounded-xl p-2 border border-gray-800">
              {(course.lessons ?? []).map((lesson, idx) => (
                <div key={lesson.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-500 shrink-0 font-mono">
                    {idx + 1}
                  </div>
                  <span className="text-sm text-gray-300 truncate flex-grow">{lesson.title}</span>
                  {isEnrolled || course.isFree || idx === 0 ? (
                    <Play size={14} className="text-vibe-primary opacity-80" />
                  ) : (
                    <Lock size={14} className="text-gray-600" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="pt-6 border-t border-gray-800 mt-auto">
            <div className="flex items-center justify-between gap-6">
              {/* Price Display */}
              <div>
                {course.isFree ? (
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase tracking-wider mb-1">Доступно всем</span>
                    <div className="text-white font-bold text-xl">Бесплатно</div>
                  </div>
                ) : !user ? (
                  <div className="text-gray-400 text-sm">
                    Войдите, чтобы приобрести курс
                  </div>
                ) : isEnrolled ? (
                  <div className="text-vibe-success flex items-center gap-1.5 text-sm font-medium">
                    <CheckCircle2 size={16} />
                    Курс куплен
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {course.salePrice && originalPrice > price && (
                      <span className="text-gray-500 text-xs line-through">
                        {originalPrice.toLocaleString()} {currency}
                      </span>
                    )}
                    <div className="text-white font-bold text-2xl">
                      {price.toLocaleString()} {currency}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleAction}
                disabled={loading}
                className={`flex-grow md:flex-grow-0 px-8 py-3.5 rounded-xl font-bold shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                  (course.isFree || (user && isEnrolled))
                    ? 'bg-gradient-to-r from-vibe-primary to-vibe-accent text-white hover:shadow-indigo-500/25'
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                }`}
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : course.isFree ? (
                  <>
                    <Play size={18} className="fill-current" />
                    {user ? 'Начать обучение' : 'Пробный урок'}
                  </>
                ) : !user ? (
                  <>
                    <LogIn size={18} />
                    Войти
                  </>
                ) : isEnrolled ? (
                  <>
                    <Play size={18} className="fill-current" />
                    Начать обучение
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Купить курс
                  </>
                )}
              </button>
            </div>
            {user && !course.isFree && price > 0 && !isEnrolled && (
              <p className="text-center text-xs text-gray-500 mt-3">
                Единоразовый платеж. Доступ навсегда.
              </p>
            )}
            {!user && course.isFree && (
              <p className="text-center text-xs text-gray-500 mt-3">
                Практические задания доступны только после регистрации
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;
