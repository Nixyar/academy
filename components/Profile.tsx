
import React, { useState, useMemo, useEffect } from 'react';
import type { Course, CourseProgress, User, Subscription } from '../types';
import {
  Mail, Zap, Shield, Check, Loader2, Crown, Sparkles, Lock,
  Settings, CreditCard, Calendar, AlertTriangle, X, BookOpen,
  CheckCircle2, Play,
} from 'lucide-react';
import { initSubscription, getCurrentSubscription, cancelSubscription } from '../services/subscriptionApi';

interface ProfileProps {
  user: User;
  courses: Course[];
  courseProgress: Record<string, CourseProgress>;
  purchasedCourseIds: Set<string>;
  onSelectCourse: (courseId: string) => void;
  onOpenAuth: () => void;
}

// =============================================
// Store Management Modal — connected to subscription API
// =============================================

const StoreModal = ({
  isOpen,
  onClose,
  subscription,
  onCancelled,
}: {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onCancelled: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCancelling = subscription?.cancelAtPeriodEnd ?? false;
  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('ru-RU')
    : '—';
  const priceLabel = subscription
    ? `${Math.round((subscription.amountKopeks ?? 49900) / 100)}₽ / мес`
    : '499₽ / мес';

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await cancelSubscription();
      onCancelled();
    } catch (e: any) {
      setError(e?.message || 'Не удалось отменить подписку');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-vibe-dark border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
            <CreditCard size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">Управление подпиской</h2>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Тариф</span>
            <span className="font-bold text-white flex items-center gap-1">
              Vibecoder PRO <Crown size={14} className="text-yellow-500 fill-current" />
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Стоимость</span>
            <span className="text-white">{priceLabel}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Статус</span>
            {isCancelling ? (
              <span className="text-orange-400 text-xs font-bold px-2 py-0.5 bg-orange-900/20 rounded border border-orange-500/30">
                ОТМЕНЕНА
              </span>
            ) : (
              <span className="text-green-400 text-xs font-bold px-2 py-0.5 bg-green-900/20 rounded border border-green-500/30">
                АКТИВНА
              </span>
            )}
          </div>
        </div>

        {isCancelling ? (
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 mb-6 text-sm text-gray-300">
            <p className="mb-2">Ваша подписка активна до:</p>
            <p className="font-mono text-white text-lg font-bold">{periodEnd}</p>
            <p className="mt-2 text-xs text-gray-500">
              После этой даты доступ к PRO функциям будет отключен.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-1">Следующее списание:</p>
            <div className="flex items-center gap-2 text-white font-medium">
              <Calendar size={16} className="text-vibe-primary" />
              {periodEnd}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          {!isCancelling && (
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 font-medium py-2.5 rounded-xl transition-colors flex justify-center items-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : (
                <>
                  <AlertTriangle size={16} />
                  Отменить подписку
                </>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-xl transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================
// Profile Component
// =============================================

const Profile: React.FC<ProfileProps> = ({
  user,
  courses,
  courseProgress,
  purchasedCourseIds,
  onSelectCourse,
}) => {
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const isPro = user.isSubscribed;
  const dailyUsed = user.dailyUsed ?? 0;
  const dailyLimit = user.dailyLimit ?? (isPro ? 30 : 15);

  // Load current subscription when profile opens
  useEffect(() => {
    if (isPro) {
      getCurrentSubscription().then(sub => setSubscription(sub)).catch(() => {});
    }
  }, [isPro]);

  // Derive stats from courseProgress
  const stats = useMemo(() => {
    const completedLessonIds: string[] = [];
    const coursesInProgress: string[] = [];
    const coursesCompleted: string[] = [];

    for (const [courseId, cp] of Object.entries(courseProgress)) {
      if (!cp?.lessons) continue;
      const entries = Object.entries(cp.lessons);
      const completed = entries.filter(([, lp]) => lp?.status === 'completed');

      completed.forEach(([lessonId]) => completedLessonIds.push(lessonId));

      const course = courses.find(c => c.id === courseId);
      if (!course) continue;

      const totalLessons = course.lessons?.length ?? 0;
      if (totalLessons > 0 && completed.length >= totalLessons) {
        coursesCompleted.push(courseId);
      } else if (completed.length > 0) {
        coursesInProgress.push(courseId);
      }
    }

    return { completedLessonIds, coursesInProgress, coursesCompleted };
  }, [courseProgress, courses]);

  // Courses the user has purchased or has access to (free + purchased)
  const myCourses = useMemo(() => {
    return courses.filter(c => c.isFree || purchasedCourseIds.has(c.id));
  }, [courses, purchasedCourseIds]);

  const handleSubscribe = async () => {
    setSubLoading(true);
    setSubError(null);
    try {
      const { paymentUrl } = await initSubscription();
      window.location.href = paymentUrl;
    } catch (e: any) {
      setSubError(e?.message || 'Не удалось инициализировать подписку');
      setSubLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 min-h-screen">

      <StoreModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        subscription={subscription}
        onCancelled={() => {
          setSubscription(prev => prev ? { ...prev, cancelAtPeriodEnd: true } : null);
        }}
      />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Настройки профиля</h1>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Settings size={14} />
          <span>ID: {user.id.substring(0, 8)}...</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* LEFT COLUMN: User Info & General Stats */}
        <div className="space-y-6">
          {/* User Details Card */}
          <div className="bg-vibe-card border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-2xl font-bold text-white border-2 border-gray-700 shadow-lg shrink-0 relative">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  (user.name?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()
                )}
                {isPro && (
                  <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black p-1 rounded-full border border-gray-900" title="PRO Аккаунт">
                    <Crown size={12} fill="currentColor" />
                  </div>
                )}
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-white truncate">{user.name || 'Студент'}</h3>
                </div>
                <p className="text-gray-400 text-xs flex items-center gap-1.5 truncate">
                  <Mail size={12} /> {user.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-800">
              <div>
                <div className="text-gray-500 text-xs mb-1">Завершено уроков</div>
                <div className="text-white font-mono text-xl">{stats.completedLessonIds.length}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Куплено курсов</div>
                <div className="text-white font-mono text-xl">{purchasedCourseIds.size}</div>
              </div>
            </div>
          </div>

          {/* My Courses */}
          {myCourses.length > 0 && (
            <div className="bg-vibe-card border border-gray-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen size={14} />
                Мои курсы
              </h3>
              <div className="space-y-3">
                {myCourses.map(course => {
                  const cp = courseProgress[course.id];
                  const totalLessons = course.lessons?.length ?? 0;
                  const completedCount = cp?.lessons
                    ? Object.values(cp.lessons).filter(lp => lp?.status === 'completed').length
                    : 0;
                  const isCompleted = totalLessons > 0 && completedCount >= totalLessons;
                  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

                  return (
                    <button
                      key={course.id}
                      onClick={() => onSelectCourse(course.id)}
                      className="w-full text-left flex items-center gap-4 p-3 rounded-xl hover:bg-gray-800/50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                        {course.coverUrl || course.imageUrl ? (
                          <img
                            src={course.coverUrl || course.imageUrl || ''}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen size={16} className="text-gray-500" />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm text-white font-medium truncate group-hover:text-vibe-primary transition-colors">
                          {course.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-grow h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isCompleted ? 'bg-vibe-success' : 'bg-vibe-primary'}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 shrink-0">
                            {completedCount}/{totalLessons}
                          </span>
                        </div>
                      </div>
                      {isCompleted ? (
                        <CheckCircle2 size={16} className="text-vibe-success shrink-0" />
                      ) : (
                        <Play size={14} className="text-gray-600 group-hover:text-vibe-primary shrink-0 transition-colors" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 flex gap-3">
            <Shield className="text-gray-600 shrink-0 mt-0.5" size={16} />
            <div>
              <h4 className="text-gray-300 font-bold text-xs mb-1">Приватность</h4>
              <p className="text-gray-500 text-[10px] leading-relaxed">
                История диалогов с ИИ сохраняется локально и используется только для контекста внутри уроков.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Subscription & AI Stats */}
        <div className="space-y-6">

          {/* COMPACT SUBSCRIPTION CARD */}
          <div className="bg-vibe-card border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {isPro ? 'Vibecoder PRO' : 'Базовый тариф'}
                  {isPro && !subscription?.cancelAtPeriodEnd && (
                    <span className="bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded font-bold border border-green-500/30">
                      ACTIVE
                    </span>
                  )}
                  {isPro && subscription?.cancelAtPeriodEnd && (
                    <span className="bg-orange-500/20 text-orange-400 text-[10px] px-1.5 py-0.5 rounded font-bold border border-orange-500/30">
                      CANCELLING
                    </span>
                  )}
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  {isPro
                    ? (subscription?.cancelAtPeriodEnd
                        ? `Доступ до ${subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('ru-RU') : '—'}`
                        : 'Автопродление включено')
                    : 'Ограниченный доступ к AI'}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${isPro ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-800 text-gray-400'}`}>
                {isPro ? <Crown size={20} /> : <Lock size={20} />}
              </div>
            </div>

            {!isPro && (
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check size={14} className="text-vibe-primary" />
                  <span>30 умных подсказок в день</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check size={14} className="text-vibe-primary" />
                  <span>Доступ к PRO урокам</span>
                </div>
              </div>
            )}

            {subError && (
              <div className="mb-4 text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                {subError}
              </div>
            )}

            {isPro ? (
              <button
                onClick={() => setIsStoreOpen(true)}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium border border-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Settings size={14} />
                Управление подпиской
              </button>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={subLoading}
                className="w-full py-2.5 bg-white text-black hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/5"
              >
                {subLoading ? <Loader2 size={16} className="animate-spin" /> : (
                  <>
                    <Sparkles size={16} className="fill-current" />
                    Подключить за 499₽
                  </>
                )}
              </button>
            )}
          </div>

          {/* AI STATS CARD */}
          <div className="bg-vibe-card border border-gray-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Zap className="text-vibe-primary" size={16} fill="currentColor" />
                AI Лимиты (Сегодня)
              </h3>
              <span className="text-xs text-gray-500">{dailyUsed} / {dailyLimit}</span>
            </div>

            <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800 mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isPro ? 'bg-vibe-primary' : 'bg-gray-500'}`}
                style={{ width: `${Math.min(100, dailyLimit > 0 ? (dailyUsed / dailyLimit) * 100 : 0)}%` }}
              />
            </div>

            {!isPro && (
              <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                <Lock size={10} /> Подсказки ограничены в бесплатной версии
              </p>
            )}
            {isPro && (
              <p className="text-[10px] text-gray-500 text-right">
                Лимиты сбрасываются в 00:00 UTC
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
