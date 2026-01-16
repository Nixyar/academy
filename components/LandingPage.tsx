import React from 'react';
import { Course, User } from '../types';
import { Code, Rocket, Sparkles, Terminal } from 'lucide-react';
import { CoursesSlider } from './CoursesSlider';

interface LandingPageProps {
  courses: Course[];
  user: User | null;
  onSelectCourse: (courseId: string) => void | Promise<void>;
  onSubscribe: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onGoToProfile: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  courses,
  user,
  onSelectCourse,
  onSubscribe,
  onOpenAuth,
  onGoToProfile,
}) => {
  const seoFallbackCourses = [
    {
      href: '/courses/vibe-basics',
      title: 'Основы Vibe Coding',
      description: 'Быстрый старт: как собирать лендинги и веб‑приложения с AI, без фреймворк‑боли и рутины.',
      coverUrl: '/logo.png',
      label: 'Бесплатно',
      access: 'free',
    },
    {
      href: '/courses/prompt-developer',
      title: 'Prompt-Developer',
      description:
        'Промпт‑инжиниринг под прод: структура, итерации и проверка — чтобы идеи превращались в рабочие продукты.',
      coverUrl: '/logo.png',
      label: 'PRO',
      access: 'paid',
    },
  ] as const;

  const handleHeroAction = () => {
    if (user) {
      onGoToProfile();
    } else {
      onOpenAuth('login');
    }
  };

  return (
    <div
      className="min-h-screen bg-void text-white selection:bg-purple-glow selection:text-white relative overflow-hidden font-sans">

      {/* Background FX */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-vibe-glow/10 rounded-full blur-[150px] animate-blob"></div>
        <div
          className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-purple-glow/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div
          className="absolute bottom-[-20%] left-[30%] w-[700px] h-[700px] bg-pink-glow/5 rounded-full blur-[150px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-void/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div
                className="w-12 h-12 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="VibeCoderAI"
                  className="w-12 h-12 object-contain drop-shadow-[0_0_12px_rgba(0,243,255,0.28)]"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight font-display">
                VibeCoder<span className="text-vibe-400">Ai</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-baseline space-x-8">
                <a
                  href="#courses"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-sm font-medium text-slate-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all"
                >
                  Курсы
                </a>
              </div>

              {user && (
                <button
                  onClick={onGoToProfile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-vibe-400/50 transition-all text-sm font-bold group"
                >
                  <div
                    className="w-5 h-5 rounded-full bg-gradient-to-r from-vibe-500 to-purple-500 flex items-center justify-center text-[10px] text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className="group-hover:text-vibe-400 transition-colors">{user.name}</span>
                </button>
              )}

            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-4 relative flex flex-col items-center text-center">
        {/* Floating Icons */}
        <div className="absolute top-40 left-[10%] opacity-30 animate-float pointer-events-none">
          <Code
            className="w-16 h-16 text-vibe-400 -rotate-12 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
        </div>
        <div className="absolute top-60 right-[15%] opacity-30 animate-float pointer-events-none"
          style={{ animationDelay: '1.5s' }}>
          <Sparkles
            className="w-12 h-12 text-purple-glow rotate-12 drop-shadow-[0_0_15px_rgba(188,19,254,0.5)]" />
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors shadow-lg shadow-black/50">
          <span className="w-2 h-2 rounded-full bg-vibe-glow animate-pulse"></span>
          <span className="text-xs font-bold text-vibe-100 tracking-wide uppercase font-display">AI-Native Education Platform</span>
        </div>

        <h1 className="max-w-6xl mx-auto text-5xl md:text-7xl font-bold font-display tracking-tighter leading-[1.1] mb-8">
          Мышление — твоё.<br />
          <span
            className="transparent-text bg-clip-text text-transparent bg-gradient-to-r from-vibe-glow via-purple-glow to-pink-glow animate-gradient bg-[length:200%_auto] drop-shadow-[0_0_30px_rgba(188,19,254,0.3)]">
            Исполнение за AI.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed mb-6">
          Забудь о рутине и синтаксисе. Используй AI-подход, чтобы создавать приложения со
          скоростью мысли.
        </p>

        <div className="flex flex-wrap justify-center gap-2 text-sm text-slate-400 mb-10">
          {['Gemini', 'DeepSeek', 'Ollama', 'ChatGPT', 'Claude'].map((tool) => (
            <span
              key={tool}
              className="px-3 py-1 rounded-full bg-white/5 border border-white/10 transition-all duration-200 hover:bg-white/10 hover:border-vibe-400/50 hover:text-white hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(0,243,255,0.35)]"
            >
              {tool}
            </span>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleHeroAction}
            className="relative w-full sm:w-auto px-10 sm:px-12 py-4 sm:py-5 rounded-2xl bg-white text-void font-bold text-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-[0_0_35px_rgba(255,255,255,0.3)] flex items-center justify-center font-display"
          >
            <span className="text-center">{user
              ? 'Продолжить обучение'
              : 'Начать вайб-кодить'}</span>
          </button>
        </div>
      </section>

      {/* What It Really Is Section */}
      <section className="py-24 relative">
        <div
          className="pointer-events-none absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-80"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-black font-display tracking-tight leading-[1.05] mb-8">
            Это не курсы.<br />
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-vibe-glow via-sky-400 to-purple-glow">
              Это AI-мышление.
            </span>
          </h2>

          <p className="max-w-3xl mx-auto text-lg md:text-2xl text-slate-300 leading-relaxed">
            VibeCoderAI — это академия нового поколения, где ты учишься <span
              className="text-white font-semibold">формулировать задачи для AI</span>, подбирать
            правильные инструменты и получать результат за минуты, а не дни.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Feature 1 */}
            <div
              className="p-8 rounded-3xl bg-glass border border-white/5 hover:border-vibe-glow/50 transition-all hover:-translate-y-2 group backdrop-blur-md relative overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-br from-vibe-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div
                className="w-14 h-14 rounded-2xl bg-vibe-900/50 flex items-center justify-center mb-6 border border-vibe-500/20 group-hover:border-vibe-glow/50 group-hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all relative z-10">
                <Terminal className="w-7 h-7 text-vibe-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white font-display relative z-10">AI &
                Prompts</h3>
              <p className="text-slate-400 leading-relaxed relative z-10">
                Научись писать промпты, которые превращают идеи в рабочие сайты и приложения.
              </p>
            </div>

            {/* Feature 2 */}
            <div
              className="p-8 rounded-3xl bg-glass border border-white/5 hover:border-purple-glow/50 transition-all hover:-translate-y-2 group backdrop-blur-md relative overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div
                className="w-14 h-14 rounded-2xl bg-purple-900/50 flex items-center justify-center mb-6 border border-purple-500/20 group-hover:border-purple-glow/50 group-hover:shadow-[0_0_20px_rgba(188,19,254,0.4)] transition-all relative z-10">
                <Code className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white font-display relative z-10">Vibe
                Coding (Web)</h3>
              <p className="text-slate-400 leading-relaxed relative z-10">
                Создавай лендинги и веб-приложения через AI — без фреймворк-боли и бесконечной
                рутины.
              </p>
            </div>

            {/* Feature 3 */}
            <div
              className="p-8 rounded-3xl bg-glass border border-white/5 hover:border-pink-glow/50 transition-all hover:-translate-y-2 group backdrop-blur-md relative overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div
                className="w-14 h-14 rounded-2xl bg-pink-900/50 flex items-center justify-center mb-6 border border-pink-500/20 group-hover:border-pink-glow/50 group-hover:shadow-[0_0_20px_rgba(255,0,85,0.4)] transition-all relative z-10">
                <Rocket className="w-7 h-7 text-pink-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white font-display relative z-10">Методология</h3>
              <p className="text-slate-400 leading-relaxed relative z-10">
                Понимай, какой AI использовать и зачем, чтобы решать именно твою задачу.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-24 relative">
        {/* Divider Glow */}
        <div
          className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-16 text-center">Программа <span
            className="text-transparent bg-clip-text bg-gradient-to-r from-vibe-400 to-purple-400">Погружения</span>
          </h2>

          {courses.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {seoFallbackCourses.map((course) => {
                const badgeLabel = course.label.trim();
                const isFreeAccess = course.access.toLowerCase() === 'free';

                return (
                  <a
                    key={course.href}
                    href={course.href}
                    className="group relative rounded-3xl overflow-hidden bg-glass border border-white/5 hover:border-white/20 transition-all duration-300 h-full"
                  >
                    <div className="absolute inset-0 z-0">
                      <img
                        src={course.coverUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/90 to-void/40"></div>
                    </div>

                    <div className="relative z-10 p-8 h-full flex flex-col">
                      <div className="flex justify-end items-start mb-6">
                        {badgeLabel ? (
                          isFreeAccess ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border backdrop-blur-md bg-green-500/10 border-green-500/20 text-green-400">
                              {badgeLabel}
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border backdrop-blur-md bg-purple-500/10 border-purple-500/20 text-purple-400">
                              {badgeLabel}
                            </span>
                          )
                        ) : null}
                      </div>

                      <h3 className="text-3xl font-bold mb-4 font-display group-hover:text-vibe-400 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-slate-400 mb-8 flex-1 leading-relaxed">{course.description}</p>

                      <div className="w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 font-display bg-white text-void hover:bg-slate-200">
                        Начать Погружение
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <CoursesSlider
              courses={courses}
              user={user}
              onSelectCourse={onSelectCourse}
              onSubscribe={onSubscribe}
            />
          )}
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 bg-[#02050e]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-slate-600 text-sm mt-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
            <a href="/offer.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">
              Публичная оферта
            </a>
            <a href="/agreement.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">
              Пользовательское соглашение
            </a>
            <a href="/privacy.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">
              Политика конфиденциальности
            </a>
          </div>
          <p className="text-slate-600 text-sm mt-2">© 2025-2026 VibeCoderAi</p>
        </div>
      </footer>
    </div>
  );
};
