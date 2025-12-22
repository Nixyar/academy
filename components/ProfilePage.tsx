import React from 'react';
import { User, Course } from '../types';
import { Zap, Crown, BookOpen, Clock, LogOut, ChevronRight, Play, Sparkles } from 'lucide-react';

interface ProfilePageProps {
  user: User;
  courses: Course[];
  onLogout: () => void;
  onContinueCourse: (courseId: string) => void | Promise<void>;
  onSubscribe: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, courses, onLogout, onContinueCourse, onSubscribe }) => {
  
  // Calculate mock stats
  const coursesInProgress = Object.keys(user.progress).length;
  const totalCalls = user.dailyLimit ?? 15;
  const usedCalls = user.dailyUsed ?? 0;
  const remainingCalls = Math.max(0, totalCalls - usedCalls);

  return (
    <div className="min-h-screen bg-void text-white font-sans">
      {/* Navbar Placeholder */}
      <nav className="h-20 border-b border-white/5 bg-void/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vibe-glow to-purple-glow flex items-center justify-center text-void font-bold shadow-[0_0_10px_rgba(0,243,255,0.3)]">
                <Zap size={20} className="fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight font-display">Vibe<span className="text-vibe-400">Profile</span></span>
         </div>
         <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium hover:bg-white/5 px-3 py-2 rounded-lg">
            <LogOut className="w-4 h-4" /> Выйти
         </button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
            {/* Avatar Card */}
            <div className="w-full md:w-auto flex-shrink-0">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 p-1 relative group shadow-2xl">
                    <div className="w-full h-full rounded-[1.3rem] overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-br from-vibe-500/20 to-purple-500/20"></div>
                         <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-bold text-slate-300 font-display">{user.name.charAt(0).toUpperCase()}</span>
                         </div>
                    </div>
                    {user.isSubscribed && (
                        <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 p-2 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.5)] text-void border border-void">
                            <Crown className="w-4 h-4 fill-current" />
                        </div>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold font-display mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    Привет, {user.name}! 👋
                </h1>
                <p className="text-slate-400 mb-6 text-lg">Готов продолжить писать код силой мысли?</p>
                
                <div className="flex flex-wrap gap-4">
                    <div className="bg-[#0b1120] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg shadow-black/30 min-w-[240px]">
                        <div className="p-2.5 bg-vibe-500/15 rounded-2xl text-vibe-300 border border-vibe-500/20">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Курсов</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black font-display text-white">{coursesInProgress}</span>
                                <span className="text-sm font-semibold text-slate-400">Активно</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#0b1120] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg shadow-black/30 min-w-[260px]">
                        <div className="p-2.5 bg-purple-500/15 rounded-2xl text-purple-300 border border-purple-500/20">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Vibecoder AI</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black font-display text-white">{remainingCalls}</span>
                                <span className="text-lg font-semibold text-slate-500">/{totalCalls}</span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium">осталось вызовов</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription Card (Mini) */}
            <div className={`p-6 rounded-2xl border flex flex-col items-start gap-4 w-full md:w-80 backdrop-blur-sm
                ${user.isSubscribed 
                    ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20' 
                    : 'bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20'}
            `}>
                <div>
                    <h3 className={`font-bold text-lg font-display ${user.isSubscribed ? 'text-green-400' : 'text-purple-400'}`}>
                        {user.isSubscribed ? 'Vibe Pro Active' : 'Базовый доступ'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {user.isSubscribed ? 'Вам доступны все курсы, Nano Banana и Gemini 3 Pro.' : 'Перейдите на Pro для полного доступа к инструментам.'}
                    </p>
                </div>
                {!user.isSubscribed && (
                    <button onClick={onSubscribe} className="text-sm bg-white text-void font-bold px-4 py-2.5 rounded-xl hover:bg-slate-200 transition-colors w-full shadow-lg">
                        Upgrade to Pro
                    </button>
                )}
            </div>
        </div>

        {/* My Courses Section */}
        <h2 className="text-2xl font-bold font-display mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-vibe-400" />
            Продолжить обучение
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {courses.map(course => {
                const progress = user.progress[course.id] || 0; // index of last lesson
                const totalLessons = course.lessons.length;
                const percent = totalLessons > 0 ? Math.round(((progress) / totalLessons) * 100) : 0;
                const isStarted = user.progress[course.id] !== undefined;

                return (
                    <div key={course.id} className="group bg-glass border border-white/5 rounded-2xl overflow-hidden hover:border-vibe-500/30 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-vibe-900/10">
                        <div className="h-40 bg-slate-800 relative overflow-hidden">
                             <img src={course.coverUrl || 'https://placehold.co/600x400/0b1120/FFFFFF?text=Course'} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 group-hover:scale-105" />
                             <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/50 to-transparent"></div>
                             {user.isSubscribed || course.isFree ? (
                                <div className="absolute top-3 right-3 bg-green-500/20 backdrop-blur-md text-green-400 text-[10px] font-bold px-2 py-1 rounded border border-green-500/20">
                                    ДОСТУПНО
                                </div>
                             ) : (
                                <div className="absolute top-3 right-3 bg-red-500/20 backdrop-blur-md text-red-400 text-[10px] font-bold px-2 py-1 rounded border border-red-500/20">
                                    ЗАКРЫТО
                                </div>
                             )}
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold font-display text-xl mb-3 truncate group-hover:text-vibe-400 transition-colors">{course.title}</h3>
                            
                            {/* Progress Bar */}
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
                                <span>Прогресс</span>
                                <span>{percent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full mb-6 overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-vibe-500 to-purple-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                                    style={{ width: `${Math.max(5, percent)}%` }}
                                ></div>
                            </div>

                            <button 
                                onClick={() => onContinueCourse(course.id)}
                                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                                    ${isStarted 
                                        ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' 
                                        : 'bg-gradient-to-r from-vibe-600 to-purple-600 hover:from-vibe-500 hover:to-purple-500 text-white shadow-lg shadow-vibe-900/20'}
                                `}
                            >
                                {isStarted ? 'Продолжить' : 'Начать курс'}
                                {isStarted ? <ChevronRight className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>

        <div className="border-t border-white/5 pt-6 mt-2 flex justify-center">
            <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-vibe-400 shadow-[0_0_8px_rgba(0,243,255,0.6)]"></span>
                <span>Новые модули и направления добавляются регулярно.</span>
            </div>
        </div>
      </main>
    </div>
  );
};
