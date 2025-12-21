import React, { useEffect, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { CourseViewer } from './components/CourseViewer';
import { AuthModal } from './components/AuthModal';
import { ProfilePage } from './components/ProfilePage';
import { AuthCallback } from './components/AuthCallback';
import { Course, Lesson, LessonType, User } from './types';
import { logout, me } from './services/authApi';
import { userFromProfile } from './services/userFromProfile';
import { BackendCourse, BackendLesson, fetchCourses, fetchLessonsByCourse } from './services/coursesApi';

const DEFAULT_COURSE_COVER =
  'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&auto=format&fit=crop&q=80';

function mapLessonType(raw: string | null | undefined): LessonType {
  const normalized = (raw ?? '').toLowerCase();
  if (normalized.includes('analysis')) return LessonType.INTERACTIVE_ANALYSIS;
  if (normalized.includes('edit')) return LessonType.INTERACTIVE_EDIT;
  if (normalized.includes('code')) return LessonType.CODE_GENERATION;
  return LessonType.VIDEO_TEXT;
}

function extractLessonDescription(blocks: BackendLesson['blocks']): string {
  if (!blocks || !Array.isArray(blocks)) return '';
  const textBlock = blocks.find((block) => block?.type === 'text' && typeof block.value === 'string');
  if (textBlock && typeof textBlock.value === 'string') return textBlock.value;
  const firstStringBlock = blocks.find((block) => typeof block.value === 'string');
  if (firstStringBlock && typeof firstStringBlock.value === 'string') return firstStringBlock.value;
  return '';
}

function mapLessonFromBackend(lesson: BackendLesson): Lesson {
  const description = extractLessonDescription(lesson.blocks) || 'Материалы урока скоро появятся.';
  return {
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    description,
    type: mapLessonType(lesson.lesson_type),
    sortOrder: lesson.sort_order,
  };
}

function mapCourseFromBackend(course: BackendCourse): Course {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description ?? '',
    thumbnail: course.cover_url || DEFAULT_COURSE_COVER,
    isFree: (course.access ?? '').toLowerCase() === 'public',
    lessons: [],
  };
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'course' | 'profile'>('landing');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [loadingCourseId, setLoadingCourseId] = useState<string | null>(null);
  const [authHandled, setAuthHandled] = useState(false);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [bootstrapping, setBootstrapping] = useState(false);
  const [hasFetchedProfile, setHasFetchedProfile] = useState(false);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const backendCourses = await fetchCourses('active');
        if (cancelled) return;
        setCourses(backendCourses.map(mapCourseFromBackend));
      } catch (error) {
        if (cancelled) return;
        const rawMessage = error instanceof Error ? error.message : 'Не удалось загрузить курсы';
        const friendlyMessage =
          rawMessage === 'FAILED_TO_FETCH_COURSES'
            ? 'Не удалось загрузить курсы. Попробуйте позже.'
            : rawMessage;
        setCoursesError(friendlyMessage);
      } finally {
        if (cancelled) return;
        setCoursesLoading(false);
      }
    }

    void loadCourses();
    return () => {
      cancelled = true;
    };
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

  const loadLessonsForCourse = async (courseId: string): Promise<boolean> => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return false;
    if (course.lessons.length > 0) return true;

    setLoadingCourseId(courseId);
    try {
      const backendLessons = await fetchLessonsByCourse(courseId);
      const mappedLessons = backendLessons.map(mapLessonFromBackend);
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, lessons: mappedLessons } : c)),
      );
      return true;
    } catch (error) {
      const message =
        error instanceof Error && error.message === 'FAILED_TO_FETCH_LESSONS'
          ? 'Не удалось загрузить уроки'
          : error instanceof Error
            ? error.message
            : 'Не удалось загрузить уроки';
      console.error(message);
      alert('Не удалось загрузить уроки курса. Попробуйте позже.');
      return false;
    } finally {
      setLoadingCourseId((prev) => (prev === courseId ? null : prev));
    }
  };

  const handleAuthenticated = (authedUser: User) => {
    setUser(authedUser);
    setCurrentView('profile');
    setAuthModalOpen(false);
    setAuthHandled(true);
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
    // If user is not logged in, ask them to login first
    if (!user) {
        handleOpenAuth('register');
        return;
    }

    if (loadingCourseId === courseId) return;

    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    if (!course.isFree && !user.isSubscribed) {
      alert("Этот курс доступен только по подписке! Пожалуйста, оформите Vibe Pro.");
      return;
    }

    const lessonsReady = await loadLessonsForCourse(courseId);
    if (!lessonsReady) return;

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

  const isAuthCallbackRoute =
    window.location.pathname === '/auth/callback' ||
    window.location.pathname.startsWith('/auth/callback/');
  const shouldRenderAuthCallback = isAuthCallbackRoute && !authHandled;
  if (shouldRenderAuthCallback) {
    return (
      <AuthCallback
        onAuthenticated={(authedUser) => {
          handleAuthenticated(authedUser);
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
          coursesLoading={coursesLoading}
          coursesError={coursesError}
          user={user}
          onSelectCourse={(courseId) => { void handleSelectCourse(courseId); }} 
          onSubscribe={handleSubscribe}
          onOpenAuth={handleOpenAuth}
          onGoToProfile={() => setCurrentView('profile')}
        />
      )}

      {currentView === 'profile' && user && (
          <ProfilePage 
            user={user}
            courses={courses}
            isLoadingCourses={coursesLoading}
            coursesError={coursesError}
            onLogout={handleLogout}
            onContinueCourse={(id) => { void handleSelectCourse(id); }}
            onSubscribe={handleSubscribe}
          />
      )}

      {currentView === 'course' && activeCourse && user && (
        <CourseViewer 
          course={activeCourse} 
          onBack={() => setCurrentView('profile')}
          isSubscribed={user.isSubscribed}
        />
      )}
    </div>
  );
};

export default App;
