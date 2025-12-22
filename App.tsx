import React, { useEffect, useRef, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { CourseViewer } from './components/CourseViewer';
import { AuthModal } from './components/AuthModal';
import { ProfilePage } from './components/ProfilePage';
import { AuthCallback } from './components/AuthCallback';
import { Course, User } from './types';
import { logout, me } from './services/authApi';
import { userFromProfile } from './services/userFromProfile';
import { fetchCourseLessons, fetchCourses } from './services/coursesApi';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'course' | 'profile'>('landing');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [bootstrapping, setBootstrapping] = useState(false);
  const [hasFetchedProfile, setHasFetchedProfile] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonsLoadingFor, setLessonsLoadingFor] = useState<string | null>(null);
  const coursesLoadedRef = useRef(false);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

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
    if (currentView !== 'profile' || user || hasFetchedProfile) return;
    let cancelled = false;
    async function loadProfile() {
      setBootstrapping(true);
      try {
        const profile = await me();
        if (cancelled) return;
        setUser(userFromProfile(profile));
      } catch {
        if (cancelled) return;
        setUser(null);
      } finally {
        if (cancelled) return;
        setHasFetchedProfile(true);
        setBootstrapping(false);
      }
    }
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [currentView, hasFetchedProfile, user]);

  const handleAuthenticated = (authedUser: User) => {
    setUser(authedUser);
    setCurrentView('profile');
    setAuthModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    setUser(null);
    setCurrentView('landing');
  };

  const handleSelectCourse = async (courseId: string) => {
    if (!user) {
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

  const isAuthCallback = window.location.pathname === '/auth/callback' || window.location.pathname.startsWith('/auth/callback/');
  if (isAuthCallback) {
    return (
      <AuthCallback
        onAuthenticated={(authedUser) => {
          setUser(authedUser);
          setCurrentView('profile');
        }}
      />
    );
  }

  if (bootstrapping && currentView === 'profile') {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-slate-300 text-sm">Загрузка…</div>
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
          onGoToProfile={() => setCurrentView('profile')}
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
            <div className="text-slate-300 text-sm">Загружаем уроки…</div>
          </div>
        ) : activeCourse && activeCourse.lessons.length > 0 ? (
          <CourseViewer 
            course={activeCourse} 
            onBack={() => setCurrentView('profile')}
            isSubscribed={user.isSubscribed}
          />
        ) : (
          <div className="min-h-screen bg-void text-white flex items-center justify-center text-center px-6">
            <div>
              <div className="text-slate-200 font-semibold mb-2">Не удалось загрузить уроки курса</div>
              <button
                onClick={() => setCurrentView('profile')}
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
