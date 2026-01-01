import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { CourseViewer } from './components/CourseViewer';
import { AuthModal } from './components/AuthModal';
import { ProfilePage } from './components/ProfilePage';
import { AuthCallback } from './components/AuthCallback';
import { Course, CourseProgress, User } from './types';
import { logout, me, refreshSession } from './services/authApi';
import { clearSupabaseStoredSession, supabase } from './services/supabaseClient';
import { userFromProfile } from './services/userFromProfile';
import { fetchCourseLessons, fetchCourses } from './services/coursesApi';
import { fetchCoursesProgress } from './services/progressApi';

type View = 'landing' | 'course' | 'profile';

type RouteState = {
  view: View;
  courseId: string | null;
};

const normalizeRoute = (route: RouteState): RouteState => {
  if (route.view === 'course' && !route.courseId) {
    return { view: 'landing', courseId: null };
  }
  return route;
};

const parseRouteFromLocation = (): RouteState => {
  const path = window.location.pathname.replace(/^\//, '');
  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'profile') {
    return { view: 'profile', courseId: null };
  }

  if (segments[0] === 'courses') {
    return { view: 'course', courseId: segments[1] ?? null };
  }

  return { view: 'landing', courseId: null };
};

const routeToPath = (route: RouteState): string => {
  if (route.view === 'profile') return '/profile';
  if (route.view === 'course' && route.courseId) return `/courses/${route.courseId}`;
  return '/';
};

const OrbitLoader: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
    <div className="orbit-container">
      <div className="orbit-inner" />
      <div className="orbit-outer" />
    </div>
    {label ? <div className="text-slate-300 text-sm">{label}</div> : null}
  </div>
);

const App: React.FC = () => {
  const initialRoute = useMemo(() => normalizeRoute(parseRouteFromLocation()), []);
  const [locationPath, setLocationPath] = useState(() => window.location.pathname);

  const [route, setRoute] = useState<RouteState>(initialRoute);
  const [currentView, setCurrentView] = useState<View>(
    initialRoute.view === 'course' ? 'landing' : initialRoute.view,
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(initialRoute.courseId);
  const isAuthCallbackPath =
    locationPath === '/auth/callback' || locationPath.startsWith('/auth/callback/');
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [bootstrapping, setBootstrapping] = useState(true);
  const [hasFetchedProfile, setHasFetchedProfile] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonsLoadingFor, setLessonsLoadingFor] = useState<string | null>(null);
  const coursesLoadedRef = useRef(false);
  const bootstrapPromiseRef = useRef<Promise<void> | null>(null);
  const progressFetchKeyRef = useRef<string | null>(null);

  const syncRoute = (next: RouteState) => {
    const normalized = normalizeRoute(next);
    setRoute(normalized);
    const targetPath = routeToPath(normalized);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const navigateToLanding = () => {
    setSelectedCourseId(null);
    setCurrentView('landing');
    syncRoute({ view: 'landing', courseId: null });
  };

  const navigateToProfile = () => {
    setSelectedCourseId(null);
    setCurrentView('profile');
    syncRoute({ view: 'profile', courseId: null });
  };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  useEffect(() => {
    progressFetchKeyRef.current = null;
  }, [user?.id]);

  useEffect(() => {
    if (coursesLoadedRef.current) return;
    coursesLoadedRef.current = true;

    async function loadCourses() {
      try {
        const fetched = await fetchCourses();
        setCourses(fetched);
      } catch (error) {
        console.error('Failed to load courses', error);
      }
    }
    void loadCourses();
    return;
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      setLocationPath(window.location.pathname);
      const parsed = normalizeRoute(parseRouteFromLocation());
      setRoute(parsed);
      setSelectedCourseId(parsed.courseId);
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const wrapHistoryMethod = (original: typeof window.history.pushState) => {
      return (...args: Parameters<typeof window.history.pushState>) => {
        const result = original.apply(window.history, args);
        window.dispatchEvent(new Event('locationchange'));
        return result;
      };
    };

    window.history.pushState = wrapHistoryMethod(originalPushState);
    window.history.replaceState = wrapHistoryMethod(originalReplaceState);

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('locationchange', handleLocationChange);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('locationchange', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    if (bootstrapPromiseRef.current) return;

    bootstrapPromiseRef.current = (async () => {
      setBootstrapping(true);
      try {
        try {
          await refreshSession();
        } catch {
          // Ignore missing/expired sessions; we'll handle it via /me below
        }
        const profile = await me();
        setUser(userFromProfile(profile));
        setHasFetchedProfile(true);
      } catch {
        setUser(null);
        setHasFetchedProfile(true);
        const latestRoute = normalizeRoute(parseRouteFromLocation());
        if (latestRoute.view === 'profile') {
          navigateToLanding();
        }
      } finally {
        setBootstrapping(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user || !hasFetchedProfile) return;
    if (courses.length === 0) return;

    const sortedIds = [...courses].map((course) => course.id).sort();
    if (!sortedIds.length) return;
    const key = `${user.id}:${sortedIds.join(',')}`;
    if (progressFetchKeyRef.current === key) return;
    progressFetchKeyRef.current = key;

    let cancelled = false;
    (async () => {
      try {
        const progressMap = await fetchCoursesProgress(sortedIds);
        if (cancelled) return;
        setUser((prev) =>
          prev
            ? {
                ...prev,
                progress: { ...(prev.progress ?? {}), ...progressMap },
              }
            : prev,
        );
      } catch (error) {
        console.error('Failed to load user progress', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courses, hasFetchedProfile, user?.id]);

  useEffect(() => {
    if (bootstrapping) return;

    if (route.view === 'profile') {
      if (user) {
        setCurrentView('profile');
        setSelectedCourseId(null);
      } else if (hasFetchedProfile) {
        navigateToLanding();
      }
      return;
    }

    if (route.view === 'course') {
      if (route.courseId && user) {
        void handleSelectCourse(route.courseId, { skipPathUpdate: true });
      } else if (route.courseId && hasFetchedProfile && !user) {
        navigateToLanding();
      }
      return;
    }

    setCurrentView('landing');
    setSelectedCourseId(null);
  }, [route, user, hasFetchedProfile, bootstrapping, courses]);

  useEffect(() => {
    if (isAuthCallbackPath) return;
    const targetPath = routeToPath(route);
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({}, '', targetPath);
    }
  }, [route, isAuthCallbackPath]);

  const handleAuthenticated = (authedUser: User) => {
    setUser(authedUser);
    setHasFetchedProfile(true);
    setAuthModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (supabase) {
        await supabase.auth.signOut();
      }
      clearSupabaseStoredSession();
    } catch {
      // ignore
    }
    setUser(null);
    setHasFetchedProfile(true);
    navigateToLanding();
  };

  const handleCourseProgressChange = useCallback(
    (courseId: string, progress: CourseProgress) => {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              progress: { ...(prev.progress ?? {}), [courseId]: progress },
            }
          : prev,
      );
    },
    [],
  );

  const handleSelectCourse = async (
    courseId: string,
    options?: { skipPathUpdate?: boolean },
  ) => {
    if (!user) {
      navigateToLanding();
      handleOpenAuth('register');
      return;
    }

    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    if (!course.isFree && !user.isSubscribed) {
      alert('Этот курс доступен только по подписке! Пожалуйста, оформите Vibe Pro.');
      return;
    }

    if (course.lessons.length === 0) {
      setLessonsLoadingFor(courseId);
      try {
        const lessons = await fetchCourseLessons(courseId);
        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, lessons } : c)),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось загрузить уроки.';
        alert(message);
        setLessonsLoadingFor(null);
        return;
      }
      setLessonsLoadingFor(null);
    }

    setSelectedCourseId(courseId);
    setCurrentView('course');
    if (!options?.skipPathUpdate) {
      syncRoute({ view: 'course', courseId });
    }
  };

  const handleSubscribe = () => {
    if (!user) {
        handleOpenAuth('register');
        return;
    }
    const confirm = window.confirm("Оформить подписку за 1499₽ в месяц?");
    if (confirm) {
      setUser({ ...user, isSubscribed: true });
      alert("Поздравляем! Вы теперь Vibe Pro кодер. Доступ ко всем курсам открыт.");
    }
  };

  const activeCourse = courses.find(c => c.id === selectedCourseId);
  const isLessonsLoading = lessonsLoadingFor === selectedCourseId;

  if (isAuthCallbackPath) {
    return (
      <AuthCallback
        onAuthenticated={(authedUser) => {
          setUser(authedUser);
          setHasFetchedProfile(true);
        }}
      />
    );
  }

  if (bootstrapping && currentView === 'profile') {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <OrbitLoader label="Загрузка" />
      </div>
    );
  }

  return (
    <div className="font-sans antialiased text-slate-900">
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
        initialMode={authMode}
      />

      {currentView === 'landing' && (
        <LandingPage 
          courses={courses} 
          user={user}
          onSelectCourse={handleSelectCourse} 
          onSubscribe={handleSubscribe}
          onOpenAuth={handleOpenAuth}
          onGoToProfile={navigateToProfile}
        />
      )}

      {currentView === 'profile' && user && (
          <ProfilePage 
            user={user}
            courses={courses}
            onLogout={handleLogout}
            onContinueCourse={(id) => {
                void handleSelectCourse(id);
            }}
            onSubscribe={handleSubscribe}
          />
      )}

      {currentView === 'course' && user && (
        isLessonsLoading ? (
          <div className="min-h-screen bg-void text-white flex items-center justify-center">
            <OrbitLoader label="Загружаем уроки" />
          </div>
        ) : activeCourse && activeCourse.lessons.length > 0 ? (
          <CourseViewer 
            course={activeCourse} 
            onBack={navigateToProfile}
            isSubscribed={user.isSubscribed}
            initialProgress={user.progress?.[activeCourse.id]}
            onProgressChange={handleCourseProgressChange}
          />
        ) : (
          <div className="min-h-screen bg-void text-white flex items-center justify-center text-center px-6">
            <div>
              <div className="text-slate-200 font-semibold mb-2">Не удалось загрузить уроки курса</div>
              <button
                onClick={navigateToProfile}
                className="mt-3 px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm"
              >
                Вернуться в профиль
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default App;
