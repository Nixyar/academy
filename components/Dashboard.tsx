import React, { useState, useEffect } from 'react';
import type { Course, CourseProgress, User } from '../types';
import { Play, BookOpen, Sparkles, TrendingUp, ArrowRight, Lock, Check, Library, Eye, EyeOff, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  courses: Course[];
  courseProgress: Record<string, CourseProgress>;
  completedLessonIds: string[];
  totalLessons: number;
  user: User | null;
  purchasedCourseIds: Set<string>;
  onSelectCourse: (courseId: string) => void;
  onOpenLibrary: () => void;
  loading: boolean;
}

const TIPS = [
  "Используйте 'Давайте подумаем шаг за шагом', чтобы улучшить логику ответа модели.",
  "Назначайте ИИ роль: 'Ты сеньор React-разработчик' работает лучше, чем просто запрос.",
  "При генерации кода всегда просите добавить комментарии к сложным участкам.",
  "Разбивайте сложные задачи на цепочку последовательных промптов.",
  "Используйте разделители (###) для четкого отделения инструкций от контекста."
];
const COURSE_CARD_SIZE = 'w-[300px] md:w-[350px] h-[420px]';

const CourseCard = ({
  course,
  completedLessonIds,
  purchasedCourseIds,
  onClick,
  user,
}: {
  course: Course;
  completedLessonIds: string[];
  purchasedCourseIds: Set<string>;
  onClick: () => void;
  user: User | null;
}) => {
  const lessonIds = (course.lessons ?? []).map(l => l.id);
  const completedCount = lessonIds.filter(id => completedLessonIds.includes(id)).length;
  const totalCount = lessonIds.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isEnrolled = user && (course.isFree || purchasedCourseIds.has(course.id));
  const imageUrl = course.coverUrl || course.imageUrl || '';
  const price = course.salePrice ?? course.price ?? 0;
  const currency = course.currency || '₽';

  return (
    <div
      onClick={onClick}
      className={`${COURSE_CARD_SIZE} bg-vibe-card/40 backdrop-blur-md rounded-2xl overflow-hidden border border-gray-800 hover:border-vibe-primary/50 transition-all duration-300 group cursor-pointer relative flex flex-col`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-vibe-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative h-48 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-vibe-primary/30 to-vibe-accent/30 flex items-center justify-center">
            <BookOpen size={48} className="text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-vibe-card via-vibe-card/50 to-transparent" />

        <div className="absolute top-4 left-4 flex gap-2">
          {course.level && (
            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10 shadow-xl">
              {course.level}
            </div>
          )}
          {course.label && !(
            course.isFree && (
              (typeof course.label === 'string' && course.label.toLowerCase() === 'бесплатно') ||
              (Array.isArray(course.label) && course.label[0]?.toLowerCase() === 'бесплатно')
            )
          ) && (
            <div className="bg-vibe-primary/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10 shadow-xl">
              {Array.isArray(course.label) ? course.label[0] : course.label}
            </div>
          )}
        </div>

        {/* Pricing Badge */}
        <div className="absolute top-4 right-4">
          {isEnrolled ? (
            <div className="bg-vibe-success/90 backdrop-blur-md px-2 py-1 rounded-full text-white border border-white/10 shadow-xl flex items-center justify-center">
              <Check size={14} strokeWidth={3} />
            </div>
          ) : course.isFree ? (
            <div className="bg-vibe-primary/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10 shadow-xl">
              Бесплатно
            </div>
          ) : price > 0 ? (
            <div className="bg-yellow-500/90 text-black backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10 shadow-xl flex items-center gap-1">
              <Lock size={12} />
              {price.toLocaleString()} {currency}
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-6 relative z-10 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-vibe-primary transition-colors">{course.title}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>

        {isEnrolled ? (
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Прогресс</span>
              <span className="text-white font-mono">{percentage}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-vibe-primary to-vibe-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mb-6 h-10 flex items-center text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <BookOpen size={16} />
              {totalCount} уроков
            </span>
          </div>
        )}

        <div className="mt-auto flex items-center text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
          {isEnrolled ? (percentage > 0 ? 'Продолжить обучение' : 'Начать обучение') : 'Подробнее о курсе'}
          <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};

const DailyTip = () => {
  const [tip, setTip] = useState("");

  useEffect(() => {
    setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 p-6 flex items-start gap-4 shadow-lg shadow-indigo-900/20">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
      <div className="bg-indigo-500/20 p-3 rounded-xl shrink-0 border border-indigo-500/20">
        <Sparkles className="w-6 h-6 text-indigo-300" />
      </div>
      <div className="relative z-10">
        <h4 className="font-bold text-indigo-100 mb-1 flex items-center gap-2">
          Инсайт дня
          <span className="text-[10px] uppercase tracking-wider bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300 border border-indigo-500/20">Совет</span>
        </h4>
        <p className="text-indigo-200/80 text-sm leading-relaxed max-w-xl">
          {tip}
        </p>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({
  courses,
  courseProgress,
  completedLessonIds,
  totalLessons,
  user,
  purchasedCourseIds,
  onSelectCourse,
  onOpenLibrary,
  loading,
}) => {
  const totalCompleted = completedLessonIds.length;
  const globalPercentage = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;
  const [showCompleted, setShowCompleted] = useState(false);
  const activeCourses = courses.filter(c => c.status === 'active');
  const draftCourses = courses.filter(c => c.status === 'draft');
  const [draftIndex, setDraftIndex] = useState(0);
  const [draftVisible, setDraftVisible] = useState(true);

  const pieData = [
    { name: 'Пройдено', value: totalCompleted },
    { name: 'Осталось', value: Math.max(0, totalLessons - totalCompleted) },
  ];
  const pieColors = ['#6366f1', '#1e293b'];

  useEffect(() => {
    if (draftCourses.length === 0) {
      setDraftIndex(0);
      return;
    }
    setDraftIndex(Math.floor(Math.random() * draftCourses.length));
  }, [draftCourses.length]);

  useEffect(() => {
    if (draftCourses.length <= 1) return;

    let timeoutId: number | null = null;
    const intervalId = window.setInterval(() => {
      setDraftVisible(false);
      timeoutId = window.setTimeout(() => {
        setDraftIndex(prev => {
          let next = prev;
          while (next === prev && draftCourses.length > 1) {
            next = Math.floor(Math.random() * draftCourses.length);
          }
          return next;
        });
        setDraftVisible(true);
      }, 300);
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [draftCourses.length]);

  const displayedCourses = showCompleted
    ? activeCourses.filter(c => {
        const lessonIds = (c.lessons ?? []).map(l => l.id);
        return lessonIds.length > 0 && lessonIds.every(id => completedLessonIds.includes(id));
      })
    : activeCourses;

  const draftCourse = draftCourses[draftIndex];

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 p-6 md:p-12 max-w-7xl mx-auto space-y-16 animate-fade-in">

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-12 items-center pt-8">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
              Разрабатывай <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-vibe-primary via-vibe-accent to-pink-500 animate-pulse">
                в Своём Вайбе
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-xl leading-relaxed mx-auto md:mx-0">
              Преврати ИИ в своего второго пилота. Изучи промпт-инжиниринг и создавай продукты быстрее, чем когда-либо.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-2">
              <button
                onClick={() => document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3.5 rounded-xl bg-white text-vibe-dark font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10"
              >
                <Play size={18} className="fill-current" />
                Начать обучение
              </button>
              <button
                onClick={onOpenLibrary}
                className="px-8 py-3.5 rounded-xl bg-vibe-card/80 backdrop-blur-sm border border-gray-700 text-white font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Library size={18} />
                Библиотека промптов
              </button>
            </div>
          </div>
          <div className="w-full md:w-auto md:flex-1 flex justify-center md:justify-end">
            <div className="relative w-full max-w-md hover:scale-[1.02] transition-transform duration-500">
              <DailyTip />
            </div>
          </div>
        </div>

        {/* Stats */}
        {user && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-vibe-card/40 backdrop-blur-md border border-gray-800 p-6 rounded-2xl flex items-center gap-6 group hover:border-gray-700 transition-colors hover:bg-vibe-card/60">
              <div className="h-16 w-16 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={22} outerRadius={32} paddingAngle={5} dataKey="value" stroke="none">
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-500">
                  {globalPercentage}%
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Ваш прогресс</p>
                <h3 className="text-2xl font-bold text-white">{totalCompleted} <span className="text-sm text-gray-500 font-normal">/ {totalLessons} доступных уроков</span></h3>
              </div>
            </div>

            <div className="bg-vibe-card/40 backdrop-blur-md border border-gray-800 p-6 rounded-2xl flex items-center gap-6 group hover:border-gray-700 transition-colors hover:bg-vibe-card/60">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.2)] shrink-0">
                <TrendingUp className="text-green-500" size={28} />
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Серия</p>
                <h3 className="text-2xl font-bold text-white">3 дня 🔥</h3>
              </div>
            </div>
          </section>
        )}

        {/* Courses */}
        <section id="courses-section">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <BookOpen className="text-vibe-primary" />
                {showCompleted ? 'Завершенные курсы' : 'Курсы'}
              </h2>
              <p className="text-gray-400 mt-2">
                {showCompleted ? 'Ваши достижения и сертификаты' : 'Выбери свой путь к мастерству'}
              </p>
            </div>
            {user && (
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-white transition-colors bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-800 hover:border-gray-600"
              >
                {showCompleted ? <><EyeOff size={16} /> Все курсы</> : <><Eye size={16} /> Показать завершенные</>}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-vibe-primary animate-spin" />
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-12 pt-4 px-2 -mx-2 snap-x snap-mandatory scroll-smooth no-scrollbar">
              {displayedCourses.length > 0 ? (
                displayedCourses.map(course => (
                  <div key={course.id} className="snap-start">
                    <CourseCard
                      course={course}
                      completedLessonIds={completedLessonIds}
                      purchasedCourseIds={purchasedCourseIds}
                      onClick={() => onSelectCourse(course.id)}
                      user={user}
                    />
                  </div>
                ))
              ) : (
                <div className="w-full text-center py-10 bg-vibe-card/20 rounded-2xl border border-dashed border-gray-800">
                  <p className="text-gray-500">
                    {showCompleted ? 'У вас пока нет завершенных курсов.' : 'Нет доступных курсов.'}
                  </p>
                  {showCompleted && (
                    <button onClick={() => setShowCompleted(false)} className="mt-4 text-vibe-primary hover:underline text-sm">
                      Вернуться ко всем курсам
                    </button>
                  )}
                </div>
              )}

              {!showCompleted && (
                <div className={`snap-start ${COURSE_CARD_SIZE} bg-gray-900/30 border-2 border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center text-center p-8 group hover:border-gray-700 transition-colors hover:bg-gray-900/50`}>
                  <div className={`w-full transition-opacity duration-300 ${draftVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                      <Sparkles className="text-gray-600 group-hover:text-vibe-accent transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-500 group-hover:text-gray-300">Скоро</h3>
                    {draftCourse ? (
                      <p className="text-sm text-gray-600 mt-2">{draftCourse.title}</p>
                    ) : (
                      <p className="text-sm text-gray-600 mt-2">Новые курсы в разработке</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
