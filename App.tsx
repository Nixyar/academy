import React, { useState, useEffect, useRef, useCallback } from 'react';
import { promptLibrary } from './data';
import type { Course, CourseProgress, User } from './types';
import Dashboard from './components/Dashboard';
import CourseViewer from './components/CourseViewer';
import PromptLibrary from './components/PromptLibrary';
import Profile from './components/Profile';
import AuthModal from './components/AuthModal';
import CourseModal from './components/CourseModal';
import { ConsentModal } from './components/ConsentModal';
import { AuthCallback } from './components/AuthCallback';
import { PaymentResultModal } from './components/PaymentResultModal';
import { PurchaseCourseModal } from './components/PurchaseCourseModal';

import { refreshSession, me, logout as apiLogout } from './services/authApi';
import { fetchCourses, fetchCourseContent } from './services/coursesApi';
import { fetchCoursesProgress, invalidateProgressCache, patchCourseProgress } from './services/progressApi';
import { fetchPurchasedCourseIds } from './services/purchasesApi';
import { syncTbankCoursePurchase } from './services/paymentsApi';
import { supabase, clearSupabaseStoredSession } from './services/supabaseClient';
import { userFromProfile } from './services/userFromProfile';
import { getAllLocalCourseProgress, clearLocalProgress } from './services/localProgressApi';

import { LayoutDashboard, Library, LogIn, LogOut, User as UserIcon, Loader2 } from 'lucide-react';

// =============================================
// URL Routing helpers
// =============================================

type AppView = 'dashboard' | 'courses' | 'library' | 'profile' | 'auth-callback';

function parseRoute(pathname: string): { view: AppView; courseSlug?: string } {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/auth/callback') return { view: 'auth-callback' };
  if (p === '/profile') return { view: 'profile' };
  if (p === '/library') return { view: 'library' };
  if (p.startsWith('/courses/')) {
    const slug = p.replace('/courses/', '');
    return { view: 'courses', courseSlug: slug };
  }
  return { view: 'dashboard' };
}

function viewToPath(view: AppView, courseSlug?: string): string {
  switch (view) {
    case 'profile': return '/profile';
    case 'library': return '/library';
    case 'courses': return courseSlug ? `/courses/${courseSlug}` : '/';
    case 'auth-callback': return '/auth/callback';
    default: return '/';
  }
}

function navigateTo(path: string) {
  if (window.location.pathname !== path) {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new Event('locationchange'));
  }
}

// =============================================
// SEO Meta helpers
// =============================================

function updateMeta(title: string, description: string, noindex = false) {
  document.title = title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', description);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', title);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', description);
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', window.location.href);

  // Canonical URL
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = window.location.origin + window.location.pathname;

  // Robots meta
  let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
  if (!robots) {
    robots = document.createElement('meta');
    robots.name = 'robots';
    document.head.appendChild(robots);
  }
  robots.content = noindex ? 'noindex, nofollow' : 'index, follow';
}

// =============================================
// App Component
// =============================================

const App: React.FC = () => {
  // --- Routing ---
  const [activeTab, setActiveTab] = useState<AppView>(() => parseRoute(window.location.pathname).view);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string | null>(
    () => parseRoute(window.location.pathname).courseSlug ?? null
  );

  // --- Course Modal (preview before starting) ---
  const [viewingCourseId, setViewingCourseId] = useState<string | null>(null);
  const [purchasingCourse, setPurchasingCourse] = useState<Course | null>(null);

  // --- Auth ---
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);

  // --- Data ---
  const [courses, setCourses] = useState<Course[]>([]);
  const [purchasedCourseIds, setPurchasedCourseIds] = useState<Set<string>>(new Set());
  const [courseProgress, setCourseProgress] = useState<Record<string, CourseProgress>>({});

  // --- Loading ---
  const [bootstrapping, setBootstrapping] = useState(true);
  const bootstrapRef = useRef(false);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // --- Payment result ---
  const [paymentResult, setPaymentResult] = useState<{ open: boolean; status: 'success' | 'fail' | 'pending' }>({ open: false, status: 'pending' });

  // --- Mouse Spotlight ---
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // =============================================
  // Bootstrap: restore session, load data
  // =============================================

  useEffect(() => {
    if (bootstrapRef.current) return;
    bootstrapRef.current = true;

    (async () => {
      try {
        // Try to restore server session
        await refreshSession();
        const profile = await me();
        const u = userFromProfile(profile);
        setUser(u);

        // Check consent
        if (!u.termsAccepted || !u.privacyAccepted) {
          setConsentModalOpen(true);
        }
      } catch {
        // Not authenticated — that's fine
        setUser(null);
        // Restore guest progress from localStorage
        const localProgress = getAllLocalCourseProgress();
        if (Object.keys(localProgress).length > 0) {
          setCourseProgress(localProgress as Record<string, CourseProgress>);
        }
      }

      // Load courses (public, no auth needed)
      try {
        setCoursesLoading(true);
        const c = await fetchCourses();
        // Pre-fetch lesson lists for all courses so counts are shown immediately
        const contents = await Promise.allSettled(c.map(co => fetchCourseContent(co.id)));
        const withLessons = c.map((co, i) => {
          const r = contents[i];
          return r.status === 'fulfilled'
            ? { ...co, lessons: r.value.lessons, modules: r.value.modules }
            : co;
        });
        setCourses(withLessons);
      } catch (e) {
        console.error('Failed to load courses', e);
      } finally {
        setCoursesLoading(false);
      }

      setBootstrapping(false);
    })();
  }, []);

  // Load purchases + progress when user appears
  useEffect(() => {
    if (!user) {
      setPurchasedCourseIds(new Set());
      setCourseProgress({});
      invalidateProgressCache();
      return;
    }

    (async () => {
      try {
        const ids = await fetchPurchasedCourseIds();
        setPurchasedCourseIds(new Set(ids));
      } catch { /* ignore */ }

      if (courses.length > 0) {
        try {
          const courseIds = courses.map(c => c.id);
          const progress = await fetchCoursesProgress(courseIds);
          setCourseProgress(progress);
        } catch { /* ignore */ }
      }
    })();
  }, [user, courses]);

  // =============================================
  // URL routing: sync URL ↔ state
  // =============================================

  useEffect(() => {
    const handleLocationChange = () => {
      const { view, courseSlug } = parseRoute(window.location.pathname);
      setActiveTab(view);
      setSelectedCourseSlug(courseSlug ?? null);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('locationchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('locationchange', handleLocationChange);
    };
  }, []);

  // =============================================
  // Payment callback handling
  // =============================================

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const orderId = params.get('orderId');

    if (payment && orderId) {
      (async () => {
        try {
          const result = await syncTbankCoursePurchase(orderId);
          const isSuccess = (result.status === 'confirmed' || result.status === 'paid') && result.paidAt;
          if (isSuccess && result.courseId) {
            setPurchasedCourseIds(prev => new Set([...prev, result.courseId!]));
          }
          setPaymentResult({ open: true, status: isSuccess ? 'success' : 'fail' });
        } catch {
          setPaymentResult({ open: true, status: 'fail' });
        }
        // Clean URL
        window.history.replaceState(null, '', window.location.pathname);
      })();
    }
  }, []);

  // =============================================
  // SEO meta updates
  // =============================================

  useEffect(() => {
    switch (activeTab) {
      case 'dashboard':
        updateMeta('VibecoderAi Academy — Курсы по AI-разработке', 'Учись создавать проекты с помощью ИИ. Курсы Vibe Coding, промпт-инженерия и AI для разработчиков.');
        break;
      case 'library':
        updateMeta('Библиотека промптов — VibecoderAi', 'Готовые промпты для генерации кода, текста, анализа данных и творческих задач.');
        break;
      case 'profile':
        updateMeta('Профиль — VibecoderAi', 'Ваш профиль и прогресс обучения.', true);
        break;
      case 'courses': {
        const course = courses.find(c => c.slug === selectedCourseSlug);
        if (course) {
          updateMeta(`${course.title} — VibecoderAi`, course.description ?? 'Курс на VibecoderAi Academy');
        }
        break;
      }
    }
  }, [activeTab, selectedCourseSlug, courses]);

  // =============================================
  // Mouse spotlight effect
  // =============================================

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // =============================================
  // Handlers
  // =============================================

  const handleNavigate = useCallback((view: AppView, courseSlug?: string) => {
    setActiveTab(view);
    setSelectedCourseSlug(courseSlug ?? null);
    setIsProfileMenuOpen(false);
    navigateTo(viewToPath(view, courseSlug));
  }, []);

  const handleSelectCourse = useCallback((courseId: string) => {
    setViewingCourseId(courseId);
  }, []);

  const handleStartCourse = useCallback(async (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    // Check if paid course needs purchase
    if (course.access === 'paid' && course.price && course.price > 0 && !purchasedCourseIds.has(courseId) && !course.isFree) {
      setPurchasingCourse(course);
      setViewingCourseId(null);
      return;
    }

    // Load course content if needed
    if (!course.lessons || course.lessons.length === 0) {
      try {
        const content = await fetchCourseContent(courseId);
        setCourses(prev => prev.map(c =>
          c.id === courseId ? { ...c, lessons: content.lessons, modules: content.modules } : c
        ));
      } catch (e) {
        console.error('Failed to load course content', e);
        return;
      }
    }

    setViewingCourseId(null);
    handleNavigate('courses', course.slug);
  }, [courses, purchasedCourseIds, handleNavigate]);

  const handleBackToDashboard = useCallback(() => {
    handleNavigate('dashboard');
  }, [handleNavigate]);

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
      if (supabase) await supabase.auth.signOut();
      clearSupabaseStoredSession();
    } catch { /* ignore */ }
    setUser(null);
    setIsProfileMenuOpen(false);
    handleNavigate('dashboard');
  }, [handleNavigate]);

  const handleAuthSuccess = useCallback(async () => {
    try {
      const profile = await me();
      const u = userFromProfile(profile);
      setUser(u);
      setIsAuthModalOpen(false);
      if (!u.termsAccepted || !u.privacyAccepted) {
        setConsentModalOpen(true);
      }

      // Sync guest localStorage progress to server
      const localProgress = getAllLocalCourseProgress();
      if (Object.keys(localProgress).length > 0) {
        for (const [courseId, cp] of Object.entries(localProgress)) {
          for (const [lessonId, lp] of Object.entries(cp.lessons)) {
            if (lp.status === 'completed') {
              patchCourseProgress(courseId, {
                op: 'lesson_status',
                lessonId,
                status: 'completed',
                completedAt: lp.completedAt,
              }).catch(() => {});
            }
          }
        }
        clearLocalProgress();
      }
    } catch { /* ignore */ }
  }, []);

  const handleProgressChange = useCallback((courseId: string, progress: CourseProgress) => {
    setCourseProgress(prev => ({ ...prev, [courseId]: progress }));
  }, []);

  // =============================================
  // Derived state
  // =============================================

  const selectedCourse = selectedCourseSlug ? courses.find(c => c.slug === selectedCourseSlug) : null;
  const viewingCourse = viewingCourseId ? courses.find(c => c.id === viewingCourseId) : null;
  const isLessonMode = activeTab === 'courses' && !!selectedCourse;

  // Auto-fetch course content when navigating directly to a course URL
  // (lessons array is empty until content is loaded — e.g. page refresh or direct link)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab === 'courses' && selectedCourse && !(selectedCourse.lessons?.length)) {
      fetchCourseContent(selectedCourse.id)
        .then(content => {
          setCourses(prev => prev.map(c =>
            c.id === selectedCourse.id
              ? { ...c, lessons: content.lessons, modules: content.modules }
              : c
          ));
        })
        .catch(() => {});
    }
  }, [activeTab, selectedCourse?.id]);

  // Calculate stats for Dashboard
  const totalLessons = user ? courses.reduce((acc, course) => {
    const hasAccess = course.isFree || purchasedCourseIds.has(course.id);
    return hasAccess ? acc + (course.lessons?.length ?? 0) : acc;
  }, 0) : 0;

  const completedLessonIds = Object.entries(courseProgress).flatMap(([, cp]) =>
    Object.entries(cp?.lessons ?? {})
      .filter(([, lp]) => lp?.status === 'completed')
      .map(([lessonId]) => lessonId)
  );

  // =============================================
  // Auth Callback route
  // =============================================

  if (activeTab === 'auth-callback') {
    return (
      <AuthCallback
        onAuthenticated={(u) => { setUser(u); handleNavigate('profile'); }}
      />
    );
  }

  // =============================================
  // Loading screen
  // =============================================

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-vibe-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-vibe-primary animate-spin" />
      </div>
    );
  }

  // =============================================
  // Render Content
  // =============================================

  const renderContent = () => {
    if (activeTab === 'profile' && user) {
      return (
        <Profile
          user={user}
          courses={courses}
          courseProgress={courseProgress}
          purchasedCourseIds={purchasedCourseIds}
          onSelectCourse={handleSelectCourse}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      );
    }

    if (activeTab === 'library') {
      return <PromptLibrary prompts={promptLibrary} />;
    }

    if (activeTab === 'courses' && selectedCourse) {
      return (
        <CourseViewer
          course={selectedCourse}
          user={user}
          courseProgress={courseProgress[selectedCourse.id] ?? {}}
          purchasedCourseIds={purchasedCourseIds}
          onBack={handleBackToDashboard}
          onProgressChange={handleProgressChange}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      );
    }

    return (
      <Dashboard
        courses={courses}
        courseProgress={courseProgress}
        completedLessonIds={completedLessonIds}
        totalLessons={totalLessons}
        user={user}
        purchasedCourseIds={purchasedCourseIds}
        onSelectCourse={handleSelectCourse}
        onOpenLibrary={() => handleNavigate('library')}
        loading={coursesLoading}
      />
    );
  };

  // =============================================
  // JSX
  // =============================================

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-vibe-dark text-vibe-text font-sans selection:bg-vibe-primary selection:text-white relative overflow-x-hidden"
    >
      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <ConsentModal
        isOpen={consentModalOpen}
        termsAccepted={user?.termsAccepted ?? false}
        privacyAccepted={user?.privacyAccepted ?? false}
        onAccepted={(profile) => {
          setUser(userFromProfile(profile));
          setConsentModalOpen(false);
        }}
        onLogout={handleLogout}
      />

      {viewingCourse && (
        <CourseModal
          course={viewingCourse}
          isOpen={!!viewingCourse}
          isEnrolled={viewingCourse.isFree || purchasedCourseIds.has(viewingCourse.id)}
          onClose={() => setViewingCourseId(null)}
          onStartCourse={() => handleStartCourse(viewingCourse.id)}
          onPurchaseCourse={() => {
            setPurchasingCourse(viewingCourse);
            setViewingCourseId(null);
          }}
          user={user}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      )}

      {purchasingCourse && (
        <PurchaseCourseModal
          isOpen={!!purchasingCourse}
          course={purchasingCourse}
          onClose={() => setPurchasingCourse(null)}
        />
      )}

      <PaymentResultModal
        isOpen={paymentResult.open}
        status={paymentResult.status}
        onClose={() => setPaymentResult({ open: false, status: 'pending' })}
      />

      {/* --- Global Background Effects --- */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }}
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.15), transparent 40%)`
        }}
      />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-vibe-primary/20 blur-[100px] rounded-full opacity-20 pointer-events-none z-0" />

      {/* --- Content --- */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-vibe-dark/80 backdrop-blur-lg border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div
              className="flex items-center gap-2 font-bold text-xl cursor-pointer"
              onClick={() => handleNavigate('dashboard')}
            >
              <span>Vibecoder</span>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vibe-primary to-vibe-accent flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                Ai
              </div>
            </div>

            <nav className="flex gap-1 bg-gray-900/50 p-1 rounded-full border border-gray-800 overflow-x-auto no-scrollbar">
              <button
                onClick={() => handleNavigate('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'dashboard' ? 'bg-vibe-card text-white shadow-sm ring-1 ring-white/10 scale-[1.02]' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutDashboard size={16} />
                <span className="hidden sm:inline">Главная</span>
              </button>
              <button
                onClick={() => handleNavigate('library')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'library' ? 'bg-vibe-card text-white shadow-sm ring-1 ring-white/10 scale-[1.02]' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Library size={16} />
                <span className="hidden sm:inline">Промпты</span>
              </button>
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-700"
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-600" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-vibe-primary flex items-center justify-center text-white font-bold text-sm">
                        {user.name?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                    )}
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-400">{user.isSubscribed ? 'PRO Студент' : 'Студент'}</p>
                      <p className="text-sm font-semibold text-white max-w-[100px] truncate">
                        {user.name}
                      </p>
                    </div>
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-vibe-card border border-gray-700 rounded-xl shadow-xl overflow-hidden py-1 animate-fade-in">
                      <div className="px-4 py-3 border-b border-gray-700 sm:hidden">
                        <p className="text-sm text-white font-medium truncate">{user.name || user.email}</p>
                      </div>
                      <button
                        onClick={() => handleNavigate('profile')}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2 transition-colors"
                      >
                        <UserIcon size={16} />
                        Профиль
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={16} />
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors border border-gray-700"
                >
                  <LogIn size={16} />
                  <span>Войти</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-16 flex-grow">
          <div
            key={activeTab + (selectedCourseSlug ?? '')}
            className="animate-page-in"
          >
            {renderContent()}
          </div>
        </main>

        {/* Footer */}
        {!isLessonMode && (
          <footer className="border-t border-gray-800 bg-vibe-dark/50 backdrop-blur-sm py-8 mt-auto relative z-10">
            <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm space-y-3">
              <p>&copy; 2025-2026 VibecoderAi Academy. Учись, создавай, ускоряй.</p>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                <a href="/offer.pdf" target="_blank" rel="noopener noreferrer"
                   className="hover:text-gray-300 transition-colors">
                  Публичная оферта
                </a>
                <a href="/agreement.pdf" target="_blank" rel="noopener noreferrer"
                   className="hover:text-gray-300 transition-colors">
                  Пользовательское соглашение
                </a>
                <a href="/privacy.pdf" target="_blank" rel="noopener noreferrer"
                   className="hover:text-gray-300 transition-colors">
                  Политика конфиденциальности
                </a>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default App;
