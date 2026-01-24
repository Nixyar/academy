import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { CourseViewer } from './components/CourseViewer';
import { AuthModal } from './components/AuthModal';
import { ConsentModal } from './components/ConsentModal';
import { PurchaseCourseModal } from './components/PurchaseCourseModal';
import { PaymentResultModal } from './components/PaymentResultModal';
import { ProfilePage } from './components/ProfilePage';
import { AuthCallback } from './components/AuthCallback';
import { Course, CourseProgress, User } from './types';
import { logout, me, refreshSession, type BackendProfile } from './services/authApi';
import { clearSupabaseStoredSession, supabase } from './services/supabaseClient';
import { userFromProfile } from './services/userFromProfile';
import { fetchCourseContent, fetchCourses } from './services/coursesApi';
import { fetchCoursesProgress } from './services/progressApi';
import { syncTbankCoursePurchase } from './services/paymentsApi';
import { ApiError } from './services/apiClient';
import { getRouteSeo } from './src/seo/useRouteSeo';

type View = 'landing' | 'course' | 'profile';

type RouteState = {
  view: View;
  courseSlug: string | null;
  landingPath?: '/' | '/courses';
};

const normalizeRoute = (route: RouteState): RouteState => {
  if (route.view === 'course' && !route.courseSlug) {
    return { view: 'landing', courseSlug: null, landingPath: route.landingPath ?? '/' };
  }
  return route;
};

const parseRouteFromLocation = (): RouteState => {
  const path = window.location.pathname.replace(/^\//, '');
  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'profile') {
    return { view: 'profile', courseSlug: null };
  }

  if (segments[0] === 'courses') {
    const slug = segments[1] ? decodeURIComponent(segments[1]) : null;
    if (!slug) return { view: 'landing', courseSlug: null, landingPath: '/courses' };
    return { view: 'course', courseSlug: slug };
  }

  return { view: 'landing', courseSlug: null, landingPath: '/' };
};

const routeToPath = (route: RouteState): string => {
  if (route.view === 'profile') return '/profile';
  if (route.view === 'course' && route.courseSlug) {
    return `/courses/${encodeURIComponent(route.courseSlug)}`;
  }
  return route.landingPath ?? '/';
};

const ensureMetaTag = (name: string): HTMLMetaElement => {
  let element = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', name);
    document.head.appendChild(element);
  }
  return element;
};

const ensureMetaProperty = (property: string): HTMLMetaElement => {
  let element = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  return element;
};

const removeMetaTag = (name: string) => {
  document.head.querySelector(`meta[name="${name}"]`)?.remove();
};

const removeMetaProperty = (property: string) => {
  document.head.querySelector(`meta[property="${property}"]`)?.remove();
};

const ensureLinkTag = (rel: string): HTMLLinkElement => {
  let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  return element;
};

const removeLinkTag = (rel: string) => {
  document.head.querySelector(`link[rel="${rel}"]`)?.remove();
};

const removeJsonLdScripts = () => {
  document.head.querySelectorAll('script[data-seo-jsonld="1"]').forEach((el) => el.remove());
};

  const addJsonLdScripts = (objects: unknown[]) => {
  removeJsonLdScripts();
  objects.forEach((obj) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-jsonld', '1');
    script.text = JSON.stringify(obj);
    document.head.appendChild(script);
  });
};

const OrbitLoader: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
    <div className="orbit-container">
      <div className="orbit-inner" />
      <div className="orbit-outer" />
    </div>
    {label ? <div className="text-slate-300 text-sm animate-pulse">{label}</div> : null}
  </div>
);

const App: React.FC = () => {
  const initialRoute = useMemo(() => normalizeRoute(parseRouteFromLocation()), []);
  const [locationPath, setLocationPath] = useState(() => window.location.pathname);

  const [route, setRoute] = useState<RouteState>(initialRoute);
  const [currentView, setCurrentView] = useState<View>(initialRoute.view);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [pendingCourseSlug, setPendingCourseSlug] = useState<string | null>(initialRoute.courseSlug);
  const isAuthCallbackPath =
    locationPath === '/auth/callback' || locationPath.startsWith('/auth/callback/');

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [bootstrapping, setBootstrapping] = useState(true);
  const [hasFetchedProfile, setHasFetchedProfile] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [purchasedCourseIds, setPurchasedCourseIds] = useState<Set<string>>(() => new Set());
  const purchasesFetchRef = useRef<Promise<Set<string>> | null>(null);
  const [purchaseCourse, setPurchaseCourse] = useState<Course | null>(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ open: boolean; status: 'success' | 'fail' | 'pending' }>({
    open: false,
    status: 'pending',
  });
  const [hasLoadedProgressList, setHasLoadedProgressList] = useState(false);
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
    setPendingCourseSlug(null);
    syncRoute({ view: 'landing', courseSlug: null, landingPath: '/' });
  };

  const navigateToProfile = () => {
    setSelectedCourseId(null);
    setCurrentView('profile');
    setPendingCourseSlug(null);
    syncRoute({ view: 'profile', courseSlug: null });
  };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const resolveCourseBySlug = useCallback(
    (slug: string | null) => {
      if (!slug) return null;
      return courses.find((c) => c.slug === slug || c.id === slug) ?? null;
    },
    [courses],
  );

  useEffect(() => {
    progressFetchKeyRef.current = null;
    setHasLoadedProgressList(false);
  }, [user?.id]);

  useEffect(() => {
    purchasesFetchRef.current = null;
    if (!user) {
      setPurchasedCourseIds(new Set());
    }
  }, [user?.id]);

  const derivePurchasedCourseIds = useCallback((list: Course[]) => {
    return new Set(
      (list || [])
        .filter((course) => Boolean(course?.isPurchased))
        .map((course) => course.id),
    );
  }, []);

  const mergeCoursesPreservingContent = useCallback((prev: Course[], next: Course[]) => {
    if (!Array.isArray(next) || next.length === 0) return prev;
    if (!Array.isArray(prev) || prev.length === 0) return next;

    const prevById = new Map(prev.map((course) => [course.id, course]));
    const nextIds = new Set(next.map((course) => course.id));

    const merged = next.map((course) => {
      const existing = prevById.get(course.id);
      if (!existing) return course;

      const mergedCourse: Course = { ...existing, ...course };
      mergedCourse.lessons = existing.lessons?.length ? existing.lessons : course.lessons;
      mergedCourse.modules = existing.modules?.length ? existing.modules : course.modules;
      return mergedCourse;
    });

    const extras = prev.filter((course) => !nextIds.has(course.id));
    return extras.length > 0 ? [...merged, ...extras] : merged;
  }, []);

  const ensurePurchasedCoursesLoaded = useCallback(async () => {
    if (!user) return new Set<string>();
    if (purchasesFetchRef.current) return purchasesFetchRef.current;

    const promise = (async () => {
      let currentCourses = courses;
      let fetchedCourses: Course[] | null = null;

      try {
        fetchedCourses = await fetchCourses();
        currentCourses = fetchedCourses;
        setCourses((prev) => mergeCoursesPreservingContent(prev, fetchedCourses as Course[]));
        coursesLoadedRef.current = true;
      } catch {
        // ignore - fall back to existing list
      }

      const next = derivePurchasedCourseIds(currentCourses);
      setPurchasedCourseIds(next);
      return next;
    })();

    purchasesFetchRef.current = promise;
    return promise;
  }, [user?.id, courses, derivePurchasedCourseIds, mergeCoursesPreservingContent]);

  const refreshPurchasedCourses = useCallback(async () => {
    purchasesFetchRef.current = null;
    try {
      const currentCourses = await fetchCourses();
      setCourses((prev) => mergeCoursesPreservingContent(prev, currentCourses));
      coursesLoadedRef.current = true;
      const next = derivePurchasedCourseIds(currentCourses);
      setPurchasedCourseIds(next);
      return next;
    } catch {
      return ensurePurchasedCoursesLoaded();
    }
  }, [ensurePurchasedCoursesLoaded, derivePurchasedCourseIds, mergeCoursesPreservingContent]);

  useEffect(() => {
    if (isAuthCallbackPath) return;

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
      setPendingCourseSlug(parsed.courseSlug);
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
    if (isAuthCallbackPath) return;

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
        const authedUser = userFromProfile(profile);
        setUser(authedUser);
        setHasFetchedProfile(true);

        // If we are on a course route, let's pre-fetch its progress to avoid jumping
        const currentRoute = normalizeRoute(parseRouteFromLocation());
        if (currentRoute.view === 'course' && currentRoute.courseSlug) {
          // We need courses to resolve the slug, but they might not be loaded yet.
          // Let's load courses first if they aren't.
          let currentCourses = courses;
          if (currentCourses.length === 0) {
            try {
              currentCourses = await fetchCourses();
              setCourses(currentCourses);
              coursesLoadedRef.current = true;
            } catch (err) {
              console.error('Failed to load courses during bootstrap', err);
            }
          }

          const course = currentCourses.find(c => c.slug === currentRoute.courseSlug || c.id === currentRoute.courseSlug);
          if (course) {
              try {
              const [progressResult, contentResult] = await Promise.allSettled([
                fetchCoursesProgress([course.id]),
                fetchCourseContent(course.id),
              ]);

              if (contentResult.status === 'fulfilled') {
                const { lessons, modules } = contentResult.value;
                setCourses(prev =>
                  prev.map(c => c.id === course.id ? { ...c, lessons, modules } : c),
                );
              } else {
                console.error('Failed to pre-fetch course content', contentResult.reason);
              }

              if (progressResult.status === 'fulfilled') {
                const progressMap = progressResult.value;
                setUser(prev => prev ? {
                  ...prev,
                  progress: { ...(prev.progress ?? {}), ...progressMap }
                } : prev);
              } else {
                console.error('Failed to pre-fetch course progress', progressResult.reason);
              }
            } catch (err) {
              console.error('Failed to pre-fetch course data', err);
            }
          }
        }
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
    void ensurePurchasedCoursesLoaded();
  }, [user?.id, hasFetchedProfile, ensurePurchasedCoursesLoaded]);

  useEffect(() => {
    if (!user) return;
    if (route.view !== 'profile') return;

    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const orderId = params.get('orderId');
    if (!payment || !orderId) return;
    if (payment !== 'success' && payment !== 'fail') return;

    setPaymentResult({ open: true, status: 'pending' });

    (async () => {
      try {
        const result = await syncTbankCoursePurchase(orderId);
        const status = String(result?.status || '').toLowerCase();
        const paid = Boolean(result?.paidAt) || status === 'confirmed' || status === 'paid';
        setPaymentResult({ open: true, status: paid ? 'success' : 'fail' });
        if (paid) {
          await refreshPurchasedCourses();
        }
      } catch {
        setPaymentResult({ open: true, status: payment === 'success' ? 'pending' : 'fail' });
      } finally {
        window.history.replaceState({}, '', '/profile');
      }
    })();
  }, [route.view, user?.id, refreshPurchasedCourses]);

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
        setHasLoadedProgressList(false);
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
      } finally {
        if (!cancelled) setHasLoadedProgressList(true);
      }
    })();

    return () => {
      cancelled = true;
      // React StrictMode mounts/unmounts effects twice in dev; if we keep the key set after
      // cleanup, the second mount will early-return and progress will never load.
      if (progressFetchKeyRef.current === key) {
        progressFetchKeyRef.current = null;
      }
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
      if (pendingCourseSlug && user) {
        const course = resolveCourseBySlug(pendingCourseSlug);
        if (course) {
          void handleSelectCourse(course.id, { skipPathUpdate: true });
        }
      } else if (pendingCourseSlug && hasFetchedProfile && !user) {
        navigateToLanding();
      }
      return;
    }

    setCurrentView('landing');
    setSelectedCourseId(null);
  }, [route, pendingCourseSlug, user, hasFetchedProfile, bootstrapping, courses, resolveCourseBySlug]);

  useEffect(() => {
    if (isAuthCallbackPath) return;
    const targetPath = routeToPath(route);
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({}, '', targetPath);
    }
  }, [route, isAuthCallbackPath]);

  useEffect(() => {
    if (isAuthCallbackPath) return;
    const pathname = routeToPath(route);
    const meta = getRouteSeo(pathname);
    document.title = meta.title;
    if (meta.description) ensureMetaTag('description').setAttribute('content', meta.description);
    else removeMetaTag('description');

    if (meta.canonicalUrl) {
      ensureLinkTag('canonical').setAttribute('href', meta.canonicalUrl);
    } else {
      removeLinkTag('canonical');
    }

    ensureMetaProperty('og:title').setAttribute('content', meta.openGraph.title);
    if (meta.openGraph.description) ensureMetaProperty('og:description').setAttribute('content', meta.openGraph.description);
    else removeMetaProperty('og:description');
    ensureMetaProperty('og:url').setAttribute('content', meta.openGraph.url);
    ensureMetaProperty('og:site_name').setAttribute('content', meta.openGraph.siteName);
    ensureMetaProperty('og:type').setAttribute('content', meta.openGraph.type);
    ensureMetaProperty('og:locale').setAttribute('content', meta.openGraph.locale);
    if (meta.openGraph.image) ensureMetaProperty('og:image').setAttribute('content', meta.openGraph.image);
    else removeMetaProperty('og:image');

    ensureMetaTag('twitter:card').setAttribute('content', meta.twitter.card);
    ensureMetaTag('twitter:title').setAttribute('content', meta.twitter.title);
    if (meta.twitter.description) ensureMetaTag('twitter:description').setAttribute('content', meta.twitter.description);
    else removeMetaTag('twitter:description');
    if (meta.twitter.image) ensureMetaTag('twitter:image').setAttribute('content', meta.twitter.image);
    else removeMetaTag('twitter:image');

    if (meta.noindex) {
      ensureMetaTag('robots').setAttribute('content', 'noindex,nofollow');
    } else {
      removeMetaTag('robots');
    }

    addJsonLdScripts(meta.jsonLd);
    document.dispatchEvent(new Event('prerender-ready'));
  }, [route.view, route.courseSlug, route.landingPath, isAuthCallbackPath]);

  const handleAuthenticated = (authedUser: User) => {
    setUser(authedUser);
    setHasFetchedProfile(true);
    setAuthModalOpen(false);
    navigateToProfile();
  };

  useEffect(() => {
    if (!user) {
      setConsentModalOpen(false);
      return;
    }
    const needsConsent = !user.termsAccepted || !user.privacyAccepted;
    setConsentModalOpen(needsConsent);
  }, [user?.id, user?.termsAccepted, user?.privacyAccepted]);

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

  const applyUpdatedProfile = useCallback((profile: BackendProfile) => {
    const updatedUser = userFromProfile(profile);
    setUser((prev) =>
      prev
        ? {
          ...prev,
          ...updatedUser,
          progress: prev.progress,
          completedCourses: prev.completedCourses,
        }
        : updatedUser,
    );
    setConsentModalOpen(false);
  }, []);

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

  const toUserFacingMessage = (error: unknown, fallback: string) => {
    if (error instanceof ApiError) return error.message || fallback;
    const message = error instanceof Error ? error.message : '';
    if (/^Minified React error #\d+/i.test(message) || message.includes('react.dev/errors/')) {
      return fallback;
    }
    return message || fallback;
  };

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

    const accessLower = (course.access ?? '').toLowerCase();
    const price = typeof course.price === 'number' ? course.price : 0;
    const requiresPurchase = accessLower === 'paid' || accessLower === 'purchase' || accessLower === 'buy' || price > 0;
    if (requiresPurchase) {
      const purchased =
        Boolean(course.isPurchased) ||
        purchasedCourseIds.has(course.id) ||
        (await ensurePurchasedCoursesLoaded()).has(course.id);
      if (!purchased) {
        setPurchaseCourse(course);
        setPurchaseModalOpen(true);
        return;
      }
    }

    if (!course.isFree && !user.isSubscribed) {
      alert('Этот курс доступен только по подписке! Пожалуйста, оформите Vibe Pro.');
      return;
    }

    if (course.lessons.length === 0) {
      setLessonsLoadingFor(courseId);
      try {
        const { lessons, modules } = await fetchCourseContent(courseId);
        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, lessons, modules } : c)),
        );
      } catch (error) {
        alert(toUserFacingMessage(error, 'Не удалось загрузить уроки. Попробуйте ещё раз.'));
        setLessonsLoadingFor(null);
        return;
      }
      setLessonsLoadingFor(null);
    }

    setSelectedCourseId(courseId);
    setCurrentView('course');
    const slug = course.slug ?? courseId;
    setPendingCourseSlug(slug);
    if (!options?.skipPathUpdate) {
      syncRoute({ view: 'course', courseSlug: slug });
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
          setBootstrapping(false);
          navigateToProfile();
        }}
      />
    );
  }

  if (bootstrapping && (currentView === 'profile' || currentView === 'course')) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <OrbitLoader label="Вайбкодим загрузку" />
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
      <PaymentResultModal
        isOpen={paymentResult.open}
        status={paymentResult.status}
        onClose={async () => {
          if (paymentResult.status === 'success') {
            await refreshPurchasedCourses();
          }
          setPaymentResult((prev) => ({ ...prev, open: false }));
        }}
      />
      <PurchaseCourseModal
        isOpen={purchaseModalOpen}
        course={purchaseCourse}
        onClose={() => setPurchaseModalOpen(false)}
      />
      {user ? (
        <ConsentModal
          isOpen={consentModalOpen}
          termsAccepted={Boolean(user.termsAccepted)}
          privacyAccepted={Boolean(user.privacyAccepted)}
          onAccepted={applyUpdatedProfile}
          onLogout={() => {
            void handleLogout();
          }}
        />
      ) : null}

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
          progressLoaded={hasLoadedProgressList}
          purchasedCourseIds={purchasedCourseIds}
          onLogout={handleLogout}
          onContinueCourse={(id) => {
            void handleSelectCourse(id);
          }}
          onPurchaseCourse={(course) => {
            setPurchaseCourse(course);
            setPurchaseModalOpen(true);
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
