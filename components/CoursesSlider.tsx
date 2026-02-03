import React, { useEffect, useMemo, useRef } from 'react';
import type { Course, User } from '../types';
import { Play, Send, Shield } from 'lucide-react';

type CoursesSliderProps = {
  courses: Course[];
  user: User | null;
  onSelectCourse: (courseId: string) => void | Promise<void>;
  onSubscribe: () => void;
  autoAdvanceMs?: number;
};

export const CoursesSlider: React.FC<CoursesSliderProps> = ({
  courses,
  user,
  onSelectCourse,
  onSubscribe,
  autoAdvanceMs = 7000,
}) => {
  const telegramUrl = 'https://t.me/vibecoderai';
  const isSubscribed = user?.isSubscribed || false;
  const trackRef = useRef<HTMLDivElement | null>(null);

  const sortedCourses = useMemo(() => {
    const copy = [...courses];
    copy.sort((a, b) => {
      const aFree = (a.access ?? '').toLowerCase() === 'free';
      const bFree = (b.access ?? '').toLowerCase() === 'free';
      if (aFree === bFree) return 0;
      return aFree ? -1 : 1;
    });
    return copy;
  }, [courses]);

  const shouldAutoAdvance = useMemo(() => sortedCourses.length > 2, [sortedCourses.length]);

  useEffect(() => {
    if (!shouldAutoAdvance) return;
    if (!Number.isFinite(autoAdvanceMs) || autoAdvanceMs < 1500) return;

    const track = trackRef.current;
    if (!track) return;

    const tick = () => {
      const currentTrack = trackRef.current;
      if (!currentTrack) return;

      const maxScrollLeft = Math.max(0, currentTrack.scrollWidth - currentTrack.clientWidth);
      if (maxScrollLeft <= 4) return;

      const children = currentTrack.children;
      const stepPx =
        children.length >= 2
          ? Math.max(1, (children[1] as HTMLElement).offsetLeft - (children[0] as HTMLElement).offsetLeft)
          : currentTrack.clientWidth;

      const nextLeft = currentTrack.scrollLeft + stepPx;
      if (nextLeft >= maxScrollLeft - 4) {
        currentTrack.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        currentTrack.scrollTo({ left: nextLeft, behavior: 'smooth' });
      }
    };

    const id = window.setInterval(tick, autoAdvanceMs);
    return () => window.clearInterval(id);
  }, [autoAdvanceMs, shouldAutoAdvance]);

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory custom-scrollbar pb-2"
      >
        {sortedCourses.map((course) => {
          const isDraft = (course.status ?? '').toLowerCase() === 'draft';
          const badgeLabel = typeof course.label === 'string' ? course.label.trim() : '';
          const accessLower = (course.access ?? '').toLowerCase();
          const isFreeAccess = accessLower === 'free';

          return (
            <div
              key={course.id}
              className="snap-start shrink-0 w-full md:w-[calc((100%-2rem)/2)]"
            >
              <div className="group relative rounded-3xl overflow-hidden bg-glass border border-white/5 hover:border-white/20 transition-all duration-300 h-full">
                {/* Image BG Overlay */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={course.coverUrl || 'https://placehold.co/600x400/0b1120/FFFFFF?text=Course'}
                    alt=""
                    className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void via-void/90 to-void/40"></div>
                </div>

                {!course.isFree && !isSubscribed && (
                  <div className="absolute inset-0 z-20 bg-void/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/10 m-4 rounded-2xl">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 backdrop-blur-md border border-white/10">
                      <Shield className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 font-display">
                      Доступно в PRO
                    </h3>
                    <button
                      type="button"
                      onClick={onSubscribe}
                      className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
                    >
                      Разблокировать
                    </button>
                  </div>
                )}

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

                  {isDraft ? (
                    <a
                      href={telegramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3.5 rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 font-display bg-gradient-to-r from-sky-500/20 via-sky-500/10 to-purple-500/20 text-white hover:from-sky-500/30 hover:to-purple-500/30 border border-white/10"
                    >
                      <span className="text-xs uppercase tracking-wide text-white/70">Открытие скоро</span>
                      <span className="text-base font-bold flex items-center gap-2">
                        Следить в Telegram <Send className="w-4 h-4" />
                      </span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectCourse(course.id)}
                      className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 font-display
                        ${course.isFree || isSubscribed
                          ? 'bg-white text-void hover:bg-slate-200'
                          : 'bg-white/5 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {course.isFree || isSubscribed ? (
                        <>
                          Начать Погружение <Play className="w-4 h-4 fill-current" />
                        </>
                      ) : (
                        <>
                          {' '}
                          <Shield className="w-4 h-4" /> Доступ Закрыт
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
