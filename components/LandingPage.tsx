import React from 'react';
import { Course, User } from '../types';
import { Play, Code, Zap, Rocket, CheckCircle, Sparkles, User as UserIcon, Terminal, Shield } from 'lucide-react';

interface LandingPageProps {
  courses: Course[];
  user: User | null;
  onSelectCourse: (courseId: string) => void;
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
  onGoToProfile
}) => {
  const isSubscribed = user?.isSubscribed || false;

  const handleHeroAction = () => {
    if (user) {
        onSelectCourse(courses[0].id);
    } else {
        onOpenAuth('login');
    }
  };

  return (
    <div className="min-h-screen bg-void text-white selection:bg-purple-glow selection:text-white relative overflow-hidden font-sans">
      
      {/* Background FX */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
         <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-vibe-glow/10 rounded-full blur-[150px] animate-blob"></div>
         <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-purple-glow/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
         <div className="absolute bottom-[-20%] left-[30%] w-[700px] h-[700px] bg-pink-glow/5 rounded-full blur-[150px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-void/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-vibe-glow to-purple-glow flex items-center justify-center text-void font-bold shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                <Zap size={22} className="fill-current" />
              </div>
              <span className="text-2xl font-bold tracking-tight font-display">
                VibeCoder<span className="text-vibe-400">Ai</span>
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-baseline space-x-8">
                <a href="#courses" className="text-sm font-medium text-slate-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">Курсы</a>
                <a href="#pricing" className="text-sm font-medium text-slate-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">Тарифы</a>
              </div>
              
              {user && (
                <button 
                  onClick={onGoToProfile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-vibe-400/50 transition-all text-sm font-bold group"
                >
                   <div className="w-5 h-5 rounded-full bg-gradient-to-r from-vibe-500 to-purple-500 flex items-center justify-center text-[10px] text-white">
                      {user.name.charAt(0).toUpperCase()}
                   </div>
                   <span className="group-hover:text-vibe-400 transition-colors">{user.name}</span>
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
            <Code className="w-16 h-16 text-vibe-400 -rotate-12 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
        </div>
        <div className="absolute top-60 right-[15%] opacity-30 animate-float pointer-events-none" style={{animationDelay: '1.5s'}}>
            <Sparkles className="w-12 h-12 text-purple-glow rotate-12 drop-shadow-[0_0_15px_rgba(188,19,254,0.5)]" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors shadow-lg shadow-black/50">
            <span className="w-2 h-2 rounded-full bg-vibe-glow animate-pulse"></span>
            <span className="text-xs font-bold text-vibe-100 tracking-wide uppercase font-display">AI-Native Education Platform</span>
        </div>

        <h1 className="max-w-6xl mx-auto text-6xl md:text-8xl font-bold font-display tracking-tighter leading-[1.1] mb-8">
          Кодируй на частоте <br />
          <span className="transparent-text bg-clip-text text-transparent bg-gradient-to-r from-vibe-glow via-purple-glow to-pink-glow animate-gradient bg-[length:200%_auto] drop-shadow-[0_0_30px_rgba(188,19,254,0.3)]">
            Вайба и Мысли
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed mb-12">
          Забудь о синтаксисе. Используй <span className="text-white font-semibold">Gemini 3 Pro</span> и <span className="text-white font-semibold">Nano Banana</span>, чтобы создавать приложения со скоростью мысли.
        </p>

        <div className="flex flex-col items-center gap-6">
          <button 
              onClick={handleHeroAction}
              className="relative w-full sm:w-auto px-12 py-5 rounded-2xl bg-white text-void font-bold text-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-[0_0_35px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3 group font-display"
          >
            <Play className="w-6 h-6 fill-void group-hover:translate-x-1 transition-transform" />
            {user ? 'Продолжить обучение' : 'Начать бесплатно'}
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-glass border border-white/5 hover:border-vibe-glow/50 transition-all hover:-translate-y-2 group backdrop-blur-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-vibe-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-14 h-14 rounded-2xl bg-vibe-900/50 flex items-center justify-center mb-6 border border-vibe-500/20 group-hover:border-vibe-glow/50 group-hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all relative z-10">
                <Terminal className="w-7 h-7 text-vibe-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white font-display relative z-10">Nano Banana</h3>
              <p className="text-slate-400 leading-relaxed relative z-10">
                Научитесь писать профессиональный код с помощью промптов. Больше никакой рутины, только чистая логика.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-glass border border-white/5 hover:border-purple-glow/50 transition-all hover:-translate-y-2 group backdrop-blur-md relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-14 h-14 rounded-2xl bg-purple-900/50 flex items-center justify-center mb-6 border border-purple-500/20 group-hover:border-purple-glow/50 group-hover:shadow-[0_0_20px_rgba(188,19,254,0.4)] transition-all relative z-10">
                <Code className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white font-display relative z-10">AI & Prompts</h3>
              <p className="text-slate-400 leading-relaxed relative z-10">
                Пиши и редактируй код при помощи промптов. Gemini 3 Pro превращает ваши идеи в работающие приложения.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-glass border border-white/5 hover:border-pink-glow/50 transition-all hover:-translate-y-2 group backdrop-blur-md relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-14 h-14 rounded-2xl bg-pink-900/50 flex items-center justify-center mb-6 border border-pink-500/20 group-hover:border-pink-glow/50 group-hover:shadow-[0_0_20px_rgba(255,0,85,0.4)] transition-all relative z-10">
                <Rocket className="w-7 h-7 text-pink-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white font-display relative z-10">Vibe Methodology</h3>
              <p className="text-slate-400 leading-relaxed relative z-10">
                Меньше кода, больше смысла. Мы учим не просто писать функции, а управлять потоком создания продукта.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-24 relative">
        {/* Divider Glow */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-16 text-center">Программа <span className="text-transparent bg-clip-text bg-gradient-to-r from-vibe-400 to-purple-400">Погружения</span></h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {courses.map(course => (
              <div key={course.id} className="group relative rounded-3xl overflow-hidden bg-glass border border-white/5 hover:border-white/20 transition-all duration-300">
                
                {/* Image BG Overlay */}
                <div className="absolute inset-0 z-0">
                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-void via-void/90 to-void/40"></div>
                </div>

                {!course.isFree && !isSubscribed && (
                    <div className="absolute inset-0 z-20 bg-void/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/10 m-4 rounded-2xl">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 backdrop-blur-md border border-white/10">
                            <Shield className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 font-display">Доступно в PRO</h3>
                        <button onClick={onSubscribe} className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all">
                            Разблокировать
                        </button>
                    </div>
                )}
                
                <div className="relative z-10 p-8 h-full flex flex-col">
                   <div className="flex justify-between items-start mb-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border backdrop-blur-md
                            ${course.isFree ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'}`}>
                            {course.isFree ? 'Free Access' : 'Pro Course'}
                        </span>
                   </div>
                   
                   <h3 className="text-3xl font-bold mb-4 font-display group-hover:text-vibe-400 transition-colors">{course.title}</h3>
                   <p className="text-slate-400 mb-8 flex-1 leading-relaxed">{course.description}</p>
                   
                   <button 
                    onClick={() => onSelectCourse(course.id)}
                    className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 font-display
                        ${course.isFree || isSubscribed 
                            ? 'bg-white text-void hover:bg-slate-200' 
                            : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}
                   >
                       {course.isFree || isSubscribed ? (
                           <>Начать Погружение <Play className="w-4 h-4 fill-current" /></>
                       ) : (
                           <> <Shield className="w-4 h-4" /> Доступ Закрыт</>
                       )}
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-void via-purple-900/10 to-void pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">All In One. <span className="text-purple-400">Pro Vibe.</span></h2>
            <p className="text-slate-400 mb-16 text-lg">Единая подписка. Бесконечный поток обновлений.</p>
            
            <div className="relative group mx-auto max-w-lg">
                {/* Glow behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-vibe-glow via-purple-glow to-pink-glow rounded-[2.5rem] blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                
                <div className="relative bg-[#0a0f1e] ring-1 ring-white/10 rounded-[2rem] p-10 md:p-14 shadow-2xl backdrop-blur-xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg shadow-purple-500/30 uppercase tracking-widest font-display">
                            Best Value
                        </div>
                    </div>

                    <h3 className="text-3xl font-bold text-white mb-2 mt-4 font-display">Vibe Pro Access</h3>
                    <div className="flex items-baseline justify-center gap-2 mb-10">
                        <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 font-display">1499₽</span>
                        <span className="text-slate-500 font-medium">/ месяц</span>
                    </div>
                    
                    <ul className="text-left space-y-5 mb-12">
                        {[
                            "Доступ ко всем курсам платформы",
                            "Безлимитный Nano Banana Editor",
                            "Gemini 3 Pro Vision Analyser",
                            "Доступ в закрытый Discord"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-4">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                                </div>
                                <span className="text-slate-300 font-medium">{item}</span>
                            </li>
                        ))}
                    </ul>

                    <button 
                        onClick={onSubscribe}
                        disabled={isSubscribed}
                        className="w-full py-5 rounded-xl text-lg font-bold transition-all shadow-[0_0_25px_rgba(188,19,254,0.3)] hover:shadow-[0_0_40px_rgba(188,19,254,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:shadow-none bg-gradient-to-r from-vibe-600 via-purple-600 to-pink-600 text-white font-display"
                    >
                        {isSubscribed ? "Подписка Активна" : "Оформить Подписку"}
                    </button>
                    <p className="mt-6 text-xs text-slate-500">Отмена в любое время. Гарантия вайба.</p>
                </div>
            </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 bg-[#02050e]">
          <div className="max-w-7xl mx-auto px-4 text-center">
             <div className="flex justify-center gap-8 mb-8">
                 {['Twitter', 'Discord', 'Telegram', 'GitHub'].map(social => (
                     <a href="#" key={social} className="text-slate-500 hover:text-white hover:underline decoration-vibe-500 underline-offset-4 transition-all text-sm font-medium">{social}</a>
                 ))}
             </div>
             <p className="text-slate-600 text-sm">© 2024 VibeCoderAi. Создано с помощью Gemini.</p>
          </div>
      </footer>
    </div>
  );
};