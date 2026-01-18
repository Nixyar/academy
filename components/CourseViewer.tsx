import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Course, CourseProgress, LessonType } from '../types';
import { ImageAnalyzer } from './ImageAnalyzer';
import { ImageEditor } from './ImageEditor';
import { FileText, Menu, X, ChevronLeft, ChevronRight, ChevronDown, Send, Info } from 'lucide-react';
import { fetchCourseProgress, fetchCourseResume, patchCourseProgress } from '../services/progressApi';
import { ApiError, apiFetch } from '../services/apiClient';
import { fetchCourseQuota, type CourseQuota } from '../services/courseQuotaApi';
import { fetchLessonContent, getCachedLessonContent } from '../services/lessonsApi';

const IFRAME_BASE_STYLES = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    background: #050914;
    color: #e5e7eb;
    font-family: 'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
  }
  a { color: #7dd3fc; }
  img { max-width: 100%; display: block; }
`;

type Workspace = {
  files: Record<string, string>;
  activeFile: string;
  source: 'files' | 'html' | 'empty';
};

// A) Normalize workspace coming from backend (or legacy html-only progress).
function getWorkspace(progress: any): Workspace {
  const result = progress?.result;

  if (result?.files && typeof result.files === 'object' && !Array.isArray(result.files)) {
    const files: Record<string, string> = {};
    Object.entries(result.files as Record<string, unknown>).forEach(([key, value]) => {
      if (typeof value === 'string') files[key] = value;
    });

    const desiredActive = typeof result.active_file === 'string' ? (result.active_file as string) : 'index.html';
    const hasIndex = Object.prototype.hasOwnProperty.call(files, 'index.html');
    const fallbackActive = hasIndex ? 'index.html' : Object.keys(files)[0] ?? 'index.html';
    const hasDesired = Object.prototype.hasOwnProperty.call(files, desiredActive);
    const activeFile = hasDesired ? desiredActive : fallbackActive;

    return {
      files: Object.keys(files).length > 0 ? files : { 'index.html': '' },
      activeFile,
      source: 'files',
    };
  }

  if (typeof result?.html === 'string') {
    return { files: { 'index.html': result.html as string }, activeFile: 'index.html', source: 'html' };
  }

  if (typeof progress?.result_html === 'string') {
    return { files: { 'index.html': progress.result_html as string }, activeFile: 'index.html', source: 'html' };
  }

  return { files: { 'index.html': '' }, activeFile: 'index.html', source: 'empty' };
}

function decorateHtmlForPreview(rawHtml: string, extraCss: string | null): string {
  const raw = String(rawHtml ?? '').trim();
  const stylePieces = [IFRAME_BASE_STYLES];
  if (extraCss && extraCss.trim() && !raw.includes(extraCss)) stylePieces.push(extraCss);
  const styleTag = `<style>${stylePieces.join('\n')}</style>`;
  const tailwindScriptTag = `<script src="https://cdn.tailwindcss.com"></script>`;
  const headInjection = `${tailwindScriptTag}${styleTag}`;

  const ensureHead = (html: string) => {
    if (/<head[^>]*>/i.test(html)) {
      return html.replace(/<head[^>]*>/i, (match) => `${match}${headInjection}`);
    }
    if (/<html[^>]*>/i.test(html)) {
      return html.replace(/<html[^>]*>/i, (match) => `${match}<head>${headInjection}</head>`);
    }
    return `${headInjection}\n${html}`;
  };

  if (!raw) {
    return `<!doctype html>
<html>
<head>${styleTag}</head>
<body></body>
</html>`;
  }

  const withHead = ensureHead(raw);
  const hasBodyTag = /<body[^>]*>/i.test(withHead);
  if (hasBodyTag) return `<!doctype html>\n${withHead}`;

  return `<!doctype html>
<html>
<head>${styleTag}</head>
<body>
${withHead}
</body>
</html>`;
}

function normalizeFileHref(href: string): string {
  const trimmed = String(href ?? '').trim();
  return trimmed.replace(/^\.?\//, '').split('?')[0].split('#')[0];
}

// E) Iframe navigation: intercept <a href="*.html"> and ask parent to switch active_file.
function injectIframeRouter(html: string): string {
  const script = `<script>
(function () {
  try {
    if (window.__VIBE_IFRAME_ROUTER_INSTALLED) return;
    window.__VIBE_IFRAME_ROUTER_INSTALLED = true;
  } catch {}

  document.addEventListener('click', function (event) {
    var target = event && event.target;
    if (!target || !target.closest) return;
    var link = target.closest('a');
    if (!link) return;
    var href = (link.getAttribute('href') || '').trim();
    if (!href) return;
    if (href.charAt(0) === '#') return;
    if (/^(mailto:|tel:)/i.test(href)) return;
    if (/^javascript:/i.test(href)) { event.preventDefault(); return; }

    var isHtml = /\\.html(\\?|#|$)/i.test(href);
    if (isHtml) {
      var file = href.replace(/^\\.\\//, '').split('?')[0].split('#')[0];
      if (!file) return;
      event.preventDefault();
      try { window.parent.postMessage({ type: 'NAVIGATE_FILE', file: file }, '*'); } catch {}
      return;
    }

    // Prevent the preview iframe from navigating away (e.g. to app routes like /courses/...).
    event.preventDefault();
    try { window.open(href, '_blank', 'noopener,noreferrer'); } catch {}
  }, true);
})();
</script>`;

  if (/<\/body\s*>/i.test(html)) {
    return html.replace(/<\/body\s*>/i, `${script}</body>`);
  }
  return `${html}\n${script}`;
}

function extractCtaData(blocks: unknown[]): { buttonText: string | null; action: string | null } {
  const extract = (block: unknown) => {
    if (block && typeof block === 'object' && (block as any).type === 'cta') {
      const buttonText = typeof (block as any).buttonText === 'string' ? ((block as any).buttonText as string) : null;
      const action = typeof (block as any).action === 'string' ? ((block as any).action as string) : null;
      if (buttonText || action) return { buttonText, action };
    }
    return null;
  };

  for (const block of blocks) {
    const value = extract(block);
    if (value) return value;
  }

  return { buttonText: null, action: null };
}

function describeApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const body = error.body as any;
    const fromBody = body?.message || body?.error;
    return typeof fromBody === 'string' && fromBody.trim() ? fromBody : fallback;
  }
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

function getLessonMode(lesson: any): 'edit' | 'add_page' | 'create' {
  const rawSettings = lesson?.settings;
  let settings: any = rawSettings;
  if (typeof rawSettings === 'string') {
    try {
      settings = JSON.parse(rawSettings);
    } catch {
      settings = null;
    }
  }

  const modeRaw =
    (settings && typeof settings === 'object' && typeof settings.mode === 'string' ? settings.mode : null) ??
    (typeof lesson?.mode === 'string' ? lesson.mode : null) ??
    (typeof lesson?.settings_mode === 'string' ? lesson.settings_mode : null);

  const normalized = typeof modeRaw === 'string' ? modeRaw.trim().toLowerCase() : '';
  if (normalized === 'edit') return 'edit';
  if (normalized === 'add_page' || normalized === 'add-page' || normalized === 'add page') return 'add_page';
  return 'create';
}

interface CourseViewerProps {
  course: Course;
  onBack: () => void;
  isSubscribed: boolean;
  initialProgress?: CourseProgress;
  onProgressChange?: (courseId: string, progress: CourseProgress) => void;
}

// BOLT ⚡: This function is pure and does not depend on component state.
// By defining it outside the component, we prevent it from being re-created on every render,
// which is a micro-optimization that reduces memory allocation and garbage collection pressure.
const getValueByPath = (source: unknown, path: string): unknown => {
  if (!path) return undefined;
  return path.split('.').reduce((acc: any, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), source);
};

export const CourseViewer: React.FC<CourseViewerProps> = ({
  course,
  onBack,
  isSubscribed,
  initialProgress,
  onProgressChange,
}) => {
  const apiBaseUrl =
    (import.meta as any).env?.DEV === true ? '' : (import.meta as any).env?.VITE_API_BASE_URL ?? '';
  const [activeLessonIndex, setActiveLessonIndex] = useState(() => {
    const resumeId = initialProgress?.resume_lesson_id || initialProgress?.last_viewed_lesson_id;
    if (resumeId) {
      const idx = course.lessons.findIndex((l) => l.id === resumeId);
      if (idx !== -1) return idx;
    }
    return 0;
  });
  const activeLesson = course.lessons[activeLessonIndex];
  const [activeLessonContent, setActiveLessonContent] = useState<{
    blocks: unknown;
    settings: unknown;
    unlock_rule: unknown;
  } | null>(null);
  const [activeLessonContentLoading, setActiveLessonContentLoading] = useState(false);
  const [activeLessonContentError, setActiveLessonContentError] = useState<string | null>(null);

  const activeLessonResolved = useMemo(
    () => ({ ...activeLesson, ...(activeLessonContent ?? {}) }),
    [activeLesson, activeLessonContent],
  );
  const activeLessonMode = useMemo(() => getLessonMode(activeLessonResolved), [activeLessonResolved]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [copiedExample, setCopiedExample] = useState<number | null>(null);
  const [copiedPromptBlock, setCopiedPromptBlock] = useState<number | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress>(initialProgress ?? {});
  const [progressLoading, setProgressLoading] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [isSendingPrompt, setIsSendingPrompt] = useState(false);
  const [courseQuota, setCourseQuota] = useState<CourseQuota | null>(null);
  const [courseQuotaLoading, setCourseQuotaLoading] = useState(false);
  const [courseQuotaError, setCourseQuotaError] = useState<string | null>(null);
  const [llmHtml, setLlmHtml] = useState<string | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [llmOutline, setLlmOutline] = useState<unknown>(null);
  const [llmCss, setLlmCss] = useState<string | null>(null);
  const [llmSections, setLlmSections] = useState<Record<string, string>>({});
  const [llmSectionOrder, setLlmSectionOrder] = useState<string[]>([]);
  const [llmStatusText, setLlmStatusText] = useState<string | null>(null);
  const llmCssRef = useRef<string | null>(null);
  const llmSectionsRef = useRef<Record<string, string>>({});
  const llmSectionOrderRef = useRef<string[]>([]);
  const llmOutlineRef = useRef<unknown>(null);
  const streamControllerRef = useRef<AbortController | null>(null);
  const streamingJobIdRef = useRef<string | null>(null);
  const streamLastEventAtRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;

    const cached = getCachedLessonContent(activeLesson.id);
    setActiveLessonContent(cached);
    setActiveLessonContentLoading(!cached);
    setActiveLessonContentError(null);

    fetchLessonContent(activeLesson.id)
      .then((data) => {
        if (cancelled) return;
        setActiveLessonContent(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (!cached) {
          setActiveLessonContent(null);
          setActiveLessonContentError(
            describeApiError(err, 'Не удалось загрузить контент урока. Попробуйте обновить страницу.'),
          );
        }
      })
      .finally(() => {
        if (cancelled) return;
        setActiveLessonContentLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeLesson.id]);
  const lastLessonIdRef = useRef<string>(course.lessons[activeLessonIndex]?.id ?? '');
  const fetchedResultJobIdRef = useRef<string | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const rawActiveJob = (courseProgress as any)?.active_job;
  const rawActiveJobStatus =
    (courseProgress as any)?.active_job_status ??
    (rawActiveJob && typeof rawActiveJob === 'object' ? (rawActiveJob as any).status : null);
  const activeJobStatus = rawActiveJobStatus ?? null;
  const rawActiveJobId =
    typeof (courseProgress as any)?.active_job_id === 'string'
      ? (courseProgress as any).active_job_id
      : rawActiveJob && typeof rawActiveJob === 'object'
        ? (typeof (rawActiveJob as any).jobId === 'string'
          ? (rawActiveJob as any).jobId
          : typeof (rawActiveJob as any).job_id === 'string'
            ? (rawActiveJob as any).job_id
            : null)
        : null;
  const activeJobId = typeof rawActiveJobId === 'string' ? rawActiveJobId : null;
  const rawActiveJobPrompt =
    (courseProgress as any)?.active_job_prompt ??
    (rawActiveJob && typeof rawActiveJob === 'object' ? (rawActiveJob as any).prompt : null);
  const activeJobPrompt = typeof rawActiveJobPrompt === 'string' ? rawActiveJobPrompt : '';
  const rawActiveJobError =
    (rawActiveJob && typeof rawActiveJob === 'object' ? (rawActiveJob as any).error : null) ??
    (rawActiveJob && typeof rawActiveJob === 'object' ? (rawActiveJob as any).code : null);
  const activeJobError = typeof rawActiveJobError === 'string' ? rawActiveJobError : null;
  const rawActiveJobErrorDetails =
    (rawActiveJob && typeof rawActiveJob === 'object' ? (rawActiveJob as any).error_details : null) ??
    (rawActiveJob && typeof rawActiveJob === 'object' ? (rawActiveJob as any).details : null);
  const activeJobErrorDetails = typeof rawActiveJobErrorDetails === 'string' ? rawActiveJobErrorDetails : null;
  const rawActiveJobLessonId =
    typeof (courseProgress as any)?.active_job_lesson_id === 'string'
      ? (courseProgress as any).active_job_lesson_id
      : rawActiveJob && typeof rawActiveJob === 'object'
        ? (typeof (rawActiveJob as any).lessonId === 'string'
          ? (rawActiveJob as any).lessonId
          : typeof (rawActiveJob as any).lesson_id === 'string'
            ? (rawActiveJob as any).lesson_id
            : null)
        : null;
  const activeJobLessonId = typeof rawActiveJobLessonId === 'string' ? rawActiveJobLessonId : null;
  const isPromptLocked = Boolean(activeJobStatus);
  const isActiveJobForLesson = activeJobLessonId ? activeJobLessonId === activeLesson.id : false;
  const isPromptLockedForLesson = isPromptLocked && isActiveJobForLesson;
  const savedResultHtml =
    typeof (courseProgress as any)?.result?.html === 'string'
      ? ((courseProgress as any).result as any).html
      : typeof (courseProgress as any)?.result_html === 'string'
        ? ((courseProgress as any).result_html as any)
        : typeof (courseProgress as any)?.lessons?.[activeLesson.id]?.result?.html === 'string'
          ? ((courseProgress as any).lessons?.[activeLesson.id]?.result as any).html
          : '';
  const hasStoredFilesResult = Boolean(
    ((courseProgress as any)?.result?.files &&
      typeof (courseProgress as any).result.files === 'object' &&
      !Array.isArray((courseProgress as any).result.files)) ||
    ((courseProgress as any)?.lessons?.[activeLesson.id]?.result?.files &&
      typeof (courseProgress as any).lessons?.[activeLesson.id]?.result?.files === 'object' &&
      !Array.isArray((courseProgress as any).lessons?.[activeLesson.id]?.result?.files)),
  );
  const hasCompletedJob = activeJobStatus === 'done';

  const syncProgress = useCallback(
    (next: CourseProgress) => {
      setCourseProgress(next);
      onProgressChange?.(course.id, next);
    },
    [course.id, onProgressChange],
  );

  useEffect(() => {
    setCourseProgress(initialProgress ?? {});
  }, [initialProgress, course.id]);

  const applyProgressPatch = useCallback(
    async (patch: Parameters<typeof patchCourseProgress>[1]): Promise<CourseProgress | undefined> => {
      try {
        const updated = await patchCourseProgress(course.id, patch);
        syncProgress(updated ?? {});
        return updated ?? {};
      } catch (error) {
        console.error('Failed to update progress', error);
        return undefined;
      }
    },
    [course.id, syncProgress],
  );

  const isNonEmpty = (value: unknown) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value as object).length > 0;
    return true;
  };

  const evaluateUnlockRule = useCallback(
    (rule: any, data: unknown): boolean => {
      if (typeof rule === 'string') {
        try {
          const parsed = JSON.parse(rule);
          return evaluateUnlockRule(parsed, data);
        } catch {
          return true;
        }
      }

      if (!rule) return true;
      if (rule && typeof rule === 'object' && Object.keys(rule).length === 0) return true;

      if (Array.isArray(rule.allOf)) {
        return rule.allOf.every((child) => evaluateUnlockRule(child, data));
      }

      if (Array.isArray(rule.anyOf)) {
        return rule.anyOf.some((child) => evaluateUnlockRule(child, data));
      }

      const op = rule.op;
      const path = typeof rule.path === 'string' ? rule.path : '';
      const value = getValueByPath(data, path);

      switch (op) {
        case 'exists':
          return path ? value !== undefined : false;
        case 'notEmpty':
          return path ? isNonEmpty(value) : false;
        case 'equals':
          return path ? value === rule.value : false;
        default:
          return true;
      }
    },
    [],
  );

  const resolveUnlockPlaceholders = useCallback(
    (rule: any): any => {
      const substituteValue = (value: unknown) => {
        if (typeof value !== 'string') return value;
        const normalized = value.trim();
        const stripSigils = normalized
          .replace(/^\$\{?/, '')
          .replace(/\}?$/, '');
        const map: Record<string, string> = {
          lessonId: activeLesson.id,
          'lesson.id': activeLesson.id,
          currentLessonId: activeLesson.id,
          lesson_id: activeLesson.id,
        };
        return map[normalized] ?? map[stripSigils] ?? normalized;
      };

      if (Array.isArray(rule)) {
        return rule.map((item) => resolveUnlockPlaceholders(item));
      }

      if (rule && typeof rule === 'object') {
        const next: any = { ...rule };
        if (next.allOf) next.allOf = resolveUnlockPlaceholders(next.allOf);
        if (next.anyOf) next.anyOf = resolveUnlockPlaceholders(next.anyOf);
        if ('value' in next) next.value = substituteValue(next.value);
        return next;
      }

      return rule;
    },
    [activeLesson.id],
  );

  const unlockedLessonIds = useMemo(() => {
    const unlocked = new Set<string>();
    unlocked.add(activeLesson.id);

    const lessonProgressMap = courseProgress?.lessons ?? {};
    Object.entries(lessonProgressMap).forEach(([lessonId, progress]) => {
      if (progress?.status === 'completed' || progress?.status === 'in_progress') {
        unlocked.add(lessonId);
      }
    });

    const resumeId = courseProgress?.resume_lesson_id;
    const lastViewedId = courseProgress?.last_viewed_lesson_id;
    if (typeof resumeId === 'string') unlocked.add(resumeId);
    if (typeof lastViewedId === 'string') unlocked.add(lastViewedId);

    return unlocked;
  }, [activeLesson.id, courseProgress]);

  const lessonIdsKey = useMemo(() => course.lessons.map((lesson) => lesson.id).join('|'), [course.lessons]);

  const sortedCourseModules = useMemo(() => {
    const modules = Array.isArray(course.modules) ? course.modules : [];
    const copy = [...modules];
    copy.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return copy;
  }, [course.modules]);

  const moduleById = useMemo(() => {
    const map = new Map<string, (typeof sortedCourseModules)[number]>();
    sortedCourseModules.forEach((module) => map.set(module.id, module));
    return map;
  }, [sortedCourseModules]);

  const sidebarLessonGroups = useMemo(() => {
    if (sortedCourseModules.length === 0) return null;

    const grouped = new Map<string, Array<{ lesson: Course['lessons'][number]; idx: number }>>();
    sortedCourseModules.forEach((module) => grouped.set(module.id, []));

    const ungrouped: Array<{ lesson: Course['lessons'][number]; idx: number }> = [];

    course.lessons.forEach((lesson, idx) => {
      const moduleId = typeof (lesson as any)?.moduleId === 'string' ? ((lesson as any).moduleId as string) : null;
      if (moduleId && grouped.has(moduleId)) {
        grouped.get(moduleId)!.push({ lesson, idx });
      } else {
        ungrouped.push({ lesson, idx });
      }
    });

    return { grouped, ungrouped };
  }, [course.lessons, sortedCourseModules]);

  const [collapsedSidebarGroups, setCollapsedSidebarGroups] = useState<Set<string>>(() => new Set());

  const toggleSidebarGroup = useCallback((groupId: string) => {
    setCollapsedSidebarGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  useEffect(() => {
    const moduleId = typeof (activeLesson as any)?.moduleId === 'string' ? ((activeLesson as any).moduleId as string) : null;
    const groupId = moduleId ? `module:${moduleId}` : 'ungrouped';
    setCollapsedSidebarGroups((prev) => {
      if (!prev.has(groupId)) return prev;
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
  }, [activeLesson]);

  const activeModuleTitle = useMemo(() => {
    const moduleId = typeof (activeLesson as any)?.moduleId === 'string' ? ((activeLesson as any).moduleId as string) : null;
    if (!moduleId) return null;
    return moduleById.get(moduleId)?.title ?? null;
  }, [activeLesson, moduleById]);

  const renderLessonNavButton = (lesson: Course['lessons'][number], idx: number) => {
    const canNavigate = unlockedLessonIds.has(lesson.id);
    return (
      <button
        key={lesson.id}
        onClick={() => (canNavigate ? goToLesson(idx) : undefined)}
        disabled={!canNavigate}
        className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-all flex items-start gap-3 group
                    ${activeLessonIndex === idx ? 'bg-white/5 border-l-2 border-l-vibe-500' : 'border-l-2 border-l-transparent'}
                    ${canNavigate ? '' : 'opacity-50 cursor-not-allowed'}
                `}
      >
        <div
          className={`mt-0.5 w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors
                    ${activeLessonIndex === idx ? 'bg-vibe-500 text-white shadow-lg shadow-vibe-500/20' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}
                `}
        >
          {idx + 1}
        </div>
        <div>
          <h4
            className={`text-sm font-medium mb-1 transition-colors ${activeLessonIndex === idx ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}
          >
            {lesson.title}
          </h4>
          <span className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">
            {lesson.lessonTypeRu ?? lesson.lessonType ?? lesson.type ?? ''}
          </span>
        </div>
      </button>
    );
  };

  useEffect(() => {
    let cancelled = false;

    // If we already have initialProgress with a resume point, we've already set the index.
    // We still want to fetch the absolute latest, but without showing a full loader if we have data.
    const hasInitialData = !!initialProgress?.resume_lesson_id;
    if (!hasInitialData) {
      setProgressLoading(true);
    }

    (async () => {
      try {
        const progressData = await fetchCourseProgress(course.id);

        if (cancelled) return;
        syncProgress(progressData ?? {});

        const resumeLessonId = progressData?.resume_lesson_id || progressData?.last_viewed_lesson_id;
        const resumeIndex = resumeLessonId
          ? course.lessons.findIndex((lesson) => lesson.id === resumeLessonId)
          : -1;

        if (resumeIndex >= 0) setActiveLessonIndex(resumeIndex);
      } catch (error) {
        console.error('Failed to load course progress', error);
      } finally {
        if (!cancelled) setProgressLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [course.id, lessonIdsKey, syncProgress]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const llmLimit = (course as any)?.llmLimit;
      const required =
        String(activeLesson.lessonType ?? '').toLowerCase() === 'workshop' &&
        typeof llmLimit === 'number' &&
        Number.isFinite(llmLimit) &&
        llmLimit > 0;

      if (!required) {
        setCourseQuota(null);
        setCourseQuotaLoading(false);
        setCourseQuotaError(null);
        return;
      }

      try {
        setCourseQuotaLoading(true);
        setCourseQuotaError(null);
        const quota = await fetchCourseQuota(course.id);
        if (!cancelled) setCourseQuota(quota);
      } catch (error) {
        console.warn('Failed to load course quota', error);
        if (!cancelled) setCourseQuota(null);
        if (!cancelled) {
          const message = describeApiError(error, 'Не удалось проверить лимит запросов.');
          setCourseQuotaError(message);
        }
      } finally {
        if (!cancelled) setCourseQuotaLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeLesson.lessonType, course.id, (course as any)?.llmLimit]);

  const isWorkshopLesson = useMemo(
    () => (activeLesson.lessonType ?? '').toLowerCase() === 'workshop',
    [activeLesson.lessonType],
  );
  const quotaRequired = useMemo(() => {
    const limit = (course as any)?.llmLimit;
    return isWorkshopLesson && typeof limit === 'number' && Number.isFinite(limit) && limit > 0;
  }, [(course as any)?.llmLimit, isWorkshopLesson]);
  const isLectureLesson = useMemo(
    () => (activeLesson.lessonType ?? '').toLowerCase() === 'lecture',
    [activeLesson.lessonType],
  );

  const activeLessonProgress = useMemo(
    () => courseProgress?.lessons?.[activeLesson.id],
    [activeLesson.id, courseProgress?.lessons],
  );

  const gateContext = useMemo(
    () => ({
      ...(courseProgress ?? {}),
      lesson: activeLessonProgress ?? {},
      lessons: courseProgress?.lessons ?? {},
    }),
    [activeLessonProgress, courseProgress],
  );

  const evaluateGate = useCallback(
    (gate: any): boolean => {
      if (!gate) return true;
      if (gate && typeof gate === 'object' && Object.keys(gate).length === 0) return true;

      // Если урок уже завершён — не блокируем последующие блоки.
      if ((activeLessonProgress as any)?.status === 'completed') return true;

      // Нормализуем строковый gate (часто приходит как JSON-строка).
      let normalizedGate = gate;
      if (typeof gate === 'string') {
        try {
          normalizedGate = JSON.parse(gate);
        } catch {
          normalizedGate = gate;
        }
      }

      if (normalizedGate && typeof normalizedGate === 'object' && typeof (normalizedGate as any).op === 'string') {
        const resolvedGate = resolveUnlockPlaceholders(normalizedGate);
        return evaluateUnlockRule(resolvedGate, gateContext);
      }

      if (normalizedGate && typeof normalizedGate === 'object' && 'path' in normalizedGate) {
        const path = typeof (normalizedGate as any).path === 'string' ? (normalizedGate as any).path : '';
        const value =
          (normalizedGate as any).equals !== undefined
            ? (normalizedGate as any).equals
            : (normalizedGate as any).value !== undefined
              ? (normalizedGate as any).value
              : (normalizedGate as any).expected;
        if (!path) return true;
        const resolvedGate = resolveUnlockPlaceholders({ op: 'equals', path, value });
        return evaluateUnlockRule(resolvedGate, gateContext);
      }

      const resolvedGate = resolveUnlockPlaceholders(normalizedGate);
      return evaluateUnlockRule(resolvedGate, gateContext);
    },
    [activeLessonProgress, evaluateUnlockRule, gateContext, resolveUnlockPlaceholders],
  );

  const visibleBlocks = useMemo(() => {
    const { blocks } = activeLessonResolved as any;
    if (!blocks) return [];
    const list = Array.isArray(blocks) ? blocks : [blocks];
    const result: unknown[] = [];
    let gatePassed = true;

    for (const block of list) {
      if (block && typeof block === 'object' && (block as any).gate) {
        const gate = (block as any).gate;
        gatePassed = evaluateGate(gate);
        if (!gatePassed) continue;
      }

      if (gatePassed) {
        result.push(block);
      }
    }

    return result;
  }, [activeLessonResolved, evaluateGate]);

  const heroSubtitle = useMemo(() => {
    const hero = visibleBlocks.find(
      (block) => block && typeof block === 'object' && (block as any).type === 'hero',
    );
    if (hero && typeof (hero as any).subtitle === 'string') {
      return (hero as any).subtitle as string;
    }
    return null;
  }, [visibleBlocks]);

  const savedPrompt = useMemo(() => {
    const fromLesson =
      activeLessonProgress && typeof (activeLessonProgress as any).prompt === 'string'
        ? (activeLessonProgress as any).prompt
        : activeLessonProgress && typeof (activeLessonProgress as any).lesson_prompt === 'string'
          ? (activeLessonProgress as any).lesson_prompt
          : null;

    const pick = (value: unknown) => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    };

    return pick(fromLesson);
  }, [activeLessonProgress]);
  const isCtaUnlocked = useMemo(() => {
    if ((activeLessonProgress as any)?.status === 'completed') return true;
    const unlockRuleRaw = (activeLessonResolved as any)?.unlock_rule;
    let unlockRule: any = unlockRuleRaw;
    if (typeof unlockRuleRaw === 'string') {
      try {
        unlockRule = JSON.parse(unlockRuleRaw);
      } catch {
        unlockRule = undefined;
      }
    }

    if (!unlockRule) return true;
    const resolvedRule = resolveUnlockPlaceholders(unlockRule);
    // Evaluate against the full gate context, not just lesson progress, so rules that
    // reference course-level fields (e.g. active_job.*) work.
    return evaluateUnlockRule(resolvedRule, gateContext);
  }, [activeLessonResolved, activeLessonProgress, evaluateUnlockRule, gateContext, resolveUnlockPlaceholders]);

  const ctaData = useMemo(() => extractCtaData(visibleBlocks), [visibleBlocks]);
  const isFinishCta = useMemo(() => (ctaData.action ?? '').toLowerCase() === 'finish', [ctaData.action]);

  const quizBlock = useMemo(() => {
    const extract = (block: unknown) => {
      if (block && typeof block === 'object' && (block as any).type === 'quiz') {
        const quizId =
          typeof (block as any).id === 'string'
            ? (block as any).id
            : typeof (block as any).quizId === 'string'
              ? (block as any).quizId
              : typeof (block as any).quiz_id === 'string'
                ? (block as any).quiz_id
                : null;
        const title = typeof (block as any).title === 'string' ? (block as any).title : null;
        const question = typeof (block as any).question === 'string' ? (block as any).question : null;
        const note = typeof (block as any).note === 'string' ? (block as any).note : null;
        const options = Array.isArray((block as any).options)
          ? ((block as any).options as unknown[]).filter((opt) => typeof opt === 'string') as string[]
          : null;
        return { id: quizId ?? 'default', title, question, note, options };
      }
      return null;
    };

    for (const block of visibleBlocks) {
      const value = extract(block);
      if (value) return value;
    }
    return null;
  }, [visibleBlocks]);

  useEffect(() => {
    if (!quizBlock?.options) {
      setQuizAnswer(null);
      return;
    }

    const lessonProgress = courseProgress?.lessons?.[activeLesson.id];
    const saved = lessonProgress?.quiz_answers?.[quizBlock.id ?? 'default'];
    if (saved === undefined || saved === null) {
      setQuizAnswer(null);
      return;
    }

    const matchedByValue = quizBlock.options.findIndex((option) => option === saved);
    if (matchedByValue >= 0) {
      setQuizAnswer(matchedByValue);
      return;
    }

    if (typeof saved === 'number' && quizBlock.options[saved]) {
      setQuizAnswer(saved);
      return;
    }

    setQuizAnswer(null);
  }, [activeLesson.id, courseProgress, quizBlock]);

  useEffect(() => {
    const lessonChanged = activeLesson.id !== lastLessonIdRef.current;
    lastLessonIdRef.current = activeLesson.id;
    const hasLiveStream = Boolean(streamControllerRef.current && streamingJobIdRef.current);
    // Keep SSE stream alive across lesson navigation; abort only on CourseViewer unmount (exit course).
    const keepStreamAlive = hasLiveStream;
    const hasSavedHtml = hasStoredFilesResult || Boolean(savedResultHtml && savedResultHtml.trim());
    const failedMessage =
      activeJobStatus === 'failed' && isActiveJobForLesson
        ? [activeJobError ?? 'Генерация не удалась.', activeJobErrorDetails].filter(Boolean).join(': ')
        : null;

    const initialPrompt = savedPrompt ?? (isPromptLockedForLesson ? activeJobPrompt : '');
    setPromptInput(initialPrompt);
    if (keepStreamAlive) {
      // Keep spinner while we continue streaming the same job
      setIsSendingPrompt(true);
    } else {
      setIsSendingPrompt(activeJobStatus === 'running' && isActiveJobForLesson && !hasSavedHtml);
      setLlmHtml(hasSavedHtml && !hasStoredFilesResult ? savedResultHtml : null);
      setLlmError(failedMessage);
      setLlmOutline(null);
      setLlmCss(null);
      setLlmSections({});
      setLlmSectionOrder([]);
      llmCssRef.current = null;
      llmSectionsRef.current = {};
      llmSectionOrderRef.current = [];
      llmOutlineRef.current = null;
    }
  }, [
    activeJobId,
    activeJobPrompt,
    activeJobStatus,
    activeLesson.id,
    isActiveJobForLesson,
    activeJobError,
    activeJobErrorDetails,
    savedPrompt,
    isPromptLockedForLesson,
    savedResultHtml,
    hasStoredFilesResult,
  ]);

  useEffect(() => {
    if (!isPromptLockedForLesson) return;
    setPromptInput(activeJobPrompt);
  }, [activeJobPrompt, isPromptLockedForLesson]);

  useEffect(() => {
    if (!hasCompletedJob) return;
    if (hasStoredFilesResult) return;
    if (!savedResultHtml || typeof savedResultHtml !== 'string' || !savedResultHtml.trim()) return;
    setLlmHtml((current) => (current === savedResultHtml ? current : savedResultHtml));
    setLlmCss(null);
    setLlmSections({});
    setLlmSectionOrder([]);
    setLlmOutline(null);
    llmCssRef.current = null;
    llmSectionsRef.current = {};
    llmSectionOrderRef.current = [];
    llmOutlineRef.current = null;
    setIsSendingPrompt(false);
    setLlmError(null);
  }, [hasCompletedJob, hasStoredFilesResult, savedResultHtml]);

  useEffect(
    () => () => {
      if (streamControllerRef.current) {
        streamControllerRef.current.abort();
        streamControllerRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    llmCssRef.current = llmCss;
  }, [llmCss]);

  useEffect(() => {
    llmSectionsRef.current = llmSections;
  }, [llmSections]);

  useEffect(() => {
    llmSectionOrderRef.current = llmSectionOrder;
  }, [llmSectionOrder]);

  useEffect(() => {
    llmOutlineRef.current = llmOutline;
  }, [llmOutline]);

  const examplesBlock = useMemo(() => {
    const extract = (block: unknown) => {
      if (block && typeof block === 'object' && (block as any).type === 'examples') {
        const title = typeof (block as any).title === 'string' ? (block as any).title : null;
        const tip = typeof (block as any).tip === 'string' ? (block as any).tip : null;
        const itemsRaw = (block as any).items;
        const items = Array.isArray(itemsRaw)
          ? itemsRaw
            .map((item) => {
              if (!item || typeof item !== 'object') return null;
              const label = typeof (item as any).label === 'string' ? (item as any).label : null;
              const content = typeof (item as any).content === 'string' ? (item as any).content : null;
              const notes = Array.isArray((item as any).notes)
                ? ((item as any).notes as unknown[])
                  .filter((note) => typeof note === 'string')
                  .map((note) => note as string)
                : null;
              if (!label && !content) return null;
              return { label, content, notes };
            })
            .filter(Boolean) as { label: string | null; content: string | null; notes: string[] | null }[]
          : null;
        return { title, tip, items };
      }
      return null;
    };

    for (const block of visibleBlocks) {
      const value = extract(block);
      if (value) return value;
    }
    return null;
  }, [visibleBlocks]);

  const handleCopyExample = async (text: string | null, idx: number) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedExample(idx);
      setTimeout(() => setCopiedExample((current) => (current === idx ? null : current)), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleCopyPrompt = useCallback(async (text: string | null, idx: number) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPromptBlock(idx);
      setTimeout(
        () => setCopiedPromptBlock((current) => (current === idx ? null : current)),
        1500,
      );
    } catch {
      // ignore clipboard errors
    }
  }, []);

  const handleQuizSelect = useCallback(
    async (optionIndex: number, optionValue: string | null) => {
      setQuizAnswer(optionIndex);
      await applyProgressPatch({
        op: 'quiz_answer',
        lessonId: activeLesson.id,
        quizId: quizBlock?.id ?? 'default',
        answer: optionValue ?? optionIndex,
      });
    },
    [activeLesson.id, applyProgressPatch, quizBlock?.id],
  );

  const goToLesson = useCallback(
    (targetIndex: number, options?: { completeCurrent?: boolean }) => {
      if (targetIndex < 0 || targetIndex >= course.lessons.length) return;
      if (targetIndex === activeLessonIndex) return;

      const targetLesson = course.lessons[targetIndex];
      const targetLessonStatus = courseProgress?.lessons?.[targetLesson.id]?.status;
      const canAccessTarget = unlockedLessonIds.has(targetLesson.id) || options?.completeCurrent;
      if (!canAccessTarget) return;

      const currentLesson = course.lessons[activeLessonIndex];

      setActiveLessonIndex(targetIndex);
      setSidebarOpen(false);

      void (async () => {
        if (options?.completeCurrent && currentLesson) {
          await applyProgressPatch({
            op: 'lesson_status',
            lessonId: currentLesson.id,
            status: 'completed',
            completedAt: new Date().toISOString(),
          });
        }

        if (targetLessonStatus !== 'completed') {
          await applyProgressPatch({
            op: 'lesson_status',
            lessonId: targetLesson.id,
            status: 'in_progress',
          });
        }

        await applyProgressPatch({
          op: 'set_resume',
          lessonId: targetLesson.id,
        });
      })();
    },
    [activeLessonIndex, applyProgressPatch, course.lessons, courseProgress?.lessons, unlockedLessonIds],
  );

  const finishCourse = useCallback(async () => {
    try {
      const completedAt = new Date().toISOString();
      try {
        const updated = await patchCourseProgress(course.id, {
          op: 'finish_course',
          lessonId: activeLesson.id,
          completedAt,
        });
        syncProgress(updated ?? {});
        return;
      } catch (error) {
        const body = error instanceof ApiError ? (error.body as any) : null;
        const unsupported =
          body?.error === 'UNKNOWN_PATCH_OP' ||
          (typeof body?.details === 'string' && body.details.includes('finish_course'));
        if (!unsupported) throw error;
      }

      // Back-compat: if backend doesn't support finish_course yet, fall back to completing lessons.
      const inProgressIds = Object.entries(courseProgress?.lessons ?? {})
        .filter(([, value]) => (value as any)?.status === 'in_progress')
        .map(([lessonId]) => lessonId);

      for (const lessonId of inProgressIds) {
        await applyProgressPatch({
          op: 'lesson_status',
          lessonId,
          status: 'completed',
          completedAt,
        });
      }

      await applyProgressPatch({
        op: 'lesson_status',
        lessonId: activeLesson.id,
        status: 'completed',
        completedAt,
      });

      await applyProgressPatch({
        op: 'set_resume',
        lessonId: activeLesson.id,
      });
    } finally {
      onBack();
    }
  }, [activeLesson.id, applyProgressPatch, course.id, courseProgress?.lessons, onBack, syncProgress]);

  const parseSseEvent = useCallback((rawEvent: string): { event: string; data: string } => {
    let eventName = 'message';
    const dataLines: string[] = [];

    rawEvent.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('event:')) {
        eventName = trimmed.slice('event:'.length).trim();
      } else if (trimmed.startsWith('data:')) {
        dataLines.push(trimmed.slice('data:'.length).trim());
      }
    });

    return { event: eventName, data: dataLines.join('\n') };
  }, []);

  const parseJsonSafe = useCallback((value: string) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }, []);

  const extractKeysFromOutline = useCallback((outline: unknown): string[] => {
    if (!outline) return [];
    if (Array.isArray(outline)) {
      return outline
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            const candidate = (item as any).key ?? (item as any).id ?? (item as any).name;
            return typeof candidate === 'string' ? candidate : null;
          }
          return null;
        })
        .filter((key): key is string => Boolean(key));
    }
    if (typeof outline === 'object' && outline !== null && Array.isArray((outline as any).sections)) {
      return extractKeysFromOutline((outline as any).sections);
    }
    return [];
  }, []);

  const buildHtml = useCallback(
    (
      css: string | null,
      outline: unknown,
      sections: Record<string, string>,
      sectionOrder: string[],
    ): string => {
      const outlineKeys = extractKeysFromOutline(outline);
      const orderedKeys =
        outlineKeys.length > 0
          ? outlineKeys.filter((key) => sections[key])
          : sectionOrder.filter((key) => sections[key]);
      const keysToRender = orderedKeys.length ? orderedKeys : Object.keys(sections);

      const styleTag = css ? `<style>${css}</style>` : '';
      const body = keysToRender.map((key) => sections[key]).filter(Boolean).join('\n');
      return [styleTag, body].filter(Boolean).join('\n').trim();
    },
    [extractKeysFromOutline],
  );

  const liveHtmlFromParts = useMemo(
    () => buildHtml(llmCss ?? null, llmOutline, llmSections, llmSectionOrder),
    [buildHtml, llmCss, llmOutline, llmSections, llmSectionOrder],
  );

  const effectiveResultContainer = useMemo(() => {
    const courseHasResult =
      (courseProgress as any)?.result && typeof (courseProgress as any).result === 'object';
    const courseHasWorkspace =
      courseHasResult &&
      (((courseProgress as any).result.files &&
        typeof (courseProgress as any).result.files === 'object' &&
        !Array.isArray((courseProgress as any).result.files)) ||
        typeof (courseProgress as any).result.html === 'string');
    if (courseHasWorkspace) return courseProgress;

    const lessonResultOwner = (courseProgress as any)?.lessons?.[activeLesson.id];
    const lessonHasResult =
      lessonResultOwner &&
      typeof lessonResultOwner === 'object' &&
      (lessonResultOwner as any).result &&
      typeof (lessonResultOwner as any).result === 'object';
    return lessonHasResult ? lessonResultOwner : courseProgress;
  }, [activeLesson.id, courseProgress]);

  const storedWorkspace = useMemo(() => getWorkspace(effectiveResultContainer), [effectiveResultContainer]);

  const liveSingleHtml = useMemo(() => {
    const raw = (llmHtml ?? liveHtmlFromParts ?? '').trim();
    return raw.length > 0 ? raw : null;
  }, [llmHtml, liveHtmlFromParts]);

  const previewWorkspace = useMemo<Workspace>(() => {
    if (storedWorkspace.source === 'files') return storedWorkspace;
    const html = liveSingleHtml ?? storedWorkspace.files['index.html'] ?? '';
    return { files: { 'index.html': html }, activeFile: 'index.html', source: storedWorkspace.source };
  }, [liveSingleHtml, storedWorkspace]);

  const previewExtraCss = storedWorkspace.source === 'files' ? null : (llmCss ?? null);

  const [uiActiveFile, setUiActiveFile] = useState<string>('index.html');

  useEffect(() => {
    setUiActiveFile((current) => {
      if (current && Object.prototype.hasOwnProperty.call(previewWorkspace.files, current)) return current;
      return previewWorkspace.activeFile;
    });
  }, [activeLesson.id, previewWorkspace.activeFile, previewWorkspace.files]);

  const hasRenderablePreview = useMemo(() => {
    return Object.values(previewWorkspace.files).some((value) => typeof value === 'string' && value.trim().length > 0);
  }, [previewWorkspace.files]);

  const setActiveFileRemote = useCallback(
    async (fileRaw: string) => {
      const file = normalizeFileHref(fileRaw);
      if (!file || !Object.prototype.hasOwnProperty.call(previewWorkspace.files, file)) return;
      if (file === uiActiveFile) return;
      setUiActiveFile(file);
      try {
        const response = await apiFetch<any>('/api/v1/progress/active-file', {
          method: 'PATCH',
          body: JSON.stringify({ courseId: course.id, file }),
        });

        if (response && typeof response === 'object' && typeof (response as any).error === 'string') {
          throw new Error((response as any).error);
        }

        const nextProgressCandidate =
          response && typeof response === 'object' && (response as any).progress && typeof (response as any).progress === 'object'
            ? ((response as any).progress as CourseProgress)
            : null;
        const nextProgress = nextProgressCandidate ?? (await fetchCourseProgress(course.id));
        syncProgress(nextProgress ?? {});
      } catch (error) {
        console.error('Failed to update active file', error);
        setLlmError(describeApiError(error, 'Не удалось переключить страницу. Попробуйте ещё раз.'));
      }
    },
    [course.id, previewWorkspace.files, syncProgress, uiActiveFile],
  );

  const iframeSrcDoc = useMemo(() => {
    const html = previewWorkspace.files[uiActiveFile] ?? '';
    const decorated = decorateHtmlForPreview(html, previewExtraCss);
    return injectIframeRouter(decorated);
  }, [previewExtraCss, previewWorkspace.files, uiActiveFile]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== previewIframeRef.current?.contentWindow) return;
      // When sandboxed without allow-same-origin, srcdoc iframes have origin "null".
      // If the sandbox settings change, still accept same-origin messages.
      if (event.origin !== 'null' && event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if ((data as any).type !== 'NAVIGATE_FILE') return;
      const file = typeof (data as any).file === 'string' ? ((data as any).file as string) : null;
      if (!file) return;
      void setActiveFileRemote(file);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [setActiveFileRemote]);

  const cleanupStream = useCallback(() => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }
    streamingJobIdRef.current = null;
    streamLastEventAtRef.current = 0;
  }, []);

  const applyFinalPayload = useCallback(
    (payload: any, opts?: { final?: boolean }) => {
      const isFinal = opts?.final ?? true;
      const payloadSections: Record<string, string> = {};
      if (payload?.sections && typeof payload.sections === 'object') {
        Object.entries(payload.sections as Record<string, string | unknown>).forEach(([key, value]) => {
          if (typeof value === 'string') {
            const parsedSection = parseJsonSafe(value);
            if (parsedSection && typeof parsedSection === 'object' && typeof (parsedSection as any).html === 'string') {
              payloadSections[key] = (parsedSection as any).html as string;
            } else {
              payloadSections[key] = value;
            }
          } else if (value && typeof value === 'object') {
            const htmlValue =
              typeof (value as any).html === 'string'
                ? (value as any).html
                : typeof (value as any).content === 'string'
                  ? (value as any).content
                  : null;
            if (htmlValue) {
              payloadSections[key] = htmlValue;
            }
          }
        });
      }

      const mergedSections = { ...llmSectionsRef.current, ...payloadSections };
      llmSectionsRef.current = mergedSections;
      setLlmSections(mergedSections);

      const nextCss =
        typeof payload?.css === 'string' ? payload.css : llmCssRef.current;
      llmCssRef.current = nextCss ?? null;
      setLlmCss(nextCss ?? null);

      const nextOutline = payload?.outline ?? llmOutlineRef.current;
      llmOutlineRef.current = nextOutline ?? null;
      setLlmOutline(nextOutline ?? null);

      const outlineKeys = extractKeysFromOutline(nextOutline);
      const mergedOrder =
        outlineKeys.length > 0
          ? outlineKeys.filter((key) => mergedSections[key])
          : (() => {
            const base = [...llmSectionOrderRef.current];
            Object.keys(payloadSections).forEach((key) => {
              if (!base.includes(key)) base.push(key);
            });
            return base.filter((key) => mergedSections[key]);
          })();
      llmSectionOrderRef.current = mergedOrder;
      setLlmSectionOrder(mergedOrder);

      const htmlFromPayload = typeof payload?.html === 'string' ? payload.html : null;
      const workspaceFiles = (payload?.result?.files || payload?.files) as Record<string, string> | undefined;
      const activeFile = (payload?.result?.active_file || payload?.active_file) as string | undefined;

      // Update the progress object's result if we have a full workspace update
      if (workspaceFiles) {
        setCourseProgress((prev) => {
          if (!prev) return prev;
          const currentResult = (prev as any).result || {};
          const payloadMeta = (payload?.result?.meta || payload?.meta || {}) as Record<string, any>;

          return {
            ...prev,
            result: {
              ...currentResult,
              files: workspaceFiles,
              active_file: activeFile || currentResult.active_file || 'index.html',
              meta: {
                ...(currentResult.meta || {}),
                ...payloadMeta,
              },
            },
          };
        });

        // If we switched files or updated the active one, reflect that in UI
        if (activeFile) {
          setUiActiveFile(activeFile);
        }
      }

      const finalHtml =
        htmlFromPayload && htmlFromPayload.trim().length > 0
          ? htmlFromPayload
          : workspaceFiles && activeFile && workspaceFiles[activeFile]
            ? workspaceFiles[activeFile]
            : buildHtml(nextCss ?? null, nextOutline, mergedSections, mergedOrder);

      if (finalHtml?.trim().length) setLlmHtml(finalHtml);

      const errorMessage =
        typeof payload?.error === 'string'
          ? payload.error
          : typeof payload?.message === 'string'
            ? payload.message
            : null;
      if (errorMessage) setLlmError(errorMessage);

      if (isFinal) {
        setIsSendingPrompt(false);
        cleanupStream();
      }
    },
    [buildHtml, cleanupStream, extractKeysFromOutline, parseJsonSafe],
  );

  const handleStreamEvent = useCallback(
    (incomingEventName: string, data: string) => {
      streamLastEventAtRef.current = Date.now();
      const payload = parseJsonSafe(data);
      const payloadType =
        payload && typeof payload === 'object' && typeof (payload as any).type === 'string'
          ? ((payload as any).type as string)
          : null;
      const eventName = (incomingEventName || payloadType || 'message').toLowerCase();
      const extractHtml = (value: string) => {
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object' && typeof (parsed as any).html === 'string') {
            return (parsed as any).html as string;
          }
        } catch {
          // not json, ignore
        }
        return value;
      };

      if (eventName === 'status') {
        const message =
          payload && typeof payload === 'object'
            ? ((payload as any).message ?? (payload as any).content ?? (payload as any).status)
            : null;
        if (typeof message === 'string' && message.trim()) {
          setLlmStatusText(message.trim());
        }
        return;
      }

      if (eventName === 'css') {
        const cssValue =
          payload && typeof (payload as any).css === 'string'
            ? (payload as any).css
            : payload && typeof (payload as any).content === 'string'
              ? (payload as any).content
              : data;
        llmCssRef.current = cssValue;
        setLlmCss(cssValue);

        const partialHtml = buildHtml(
          llmCssRef.current,
          llmOutlineRef.current,
          llmSectionsRef.current,
          llmSectionOrderRef.current,
        );
        if (partialHtml) setLlmHtml(partialHtml);
        return;
      }

      if (eventName === 'section' || eventName.startsWith('section:')) {
        const key =
          eventName === 'section'
            ? ((payload as any)?.id ?? (payload as any)?.section ?? 'section')
            : eventName.slice('section:'.length) || (payload as any)?.id || 'section';
        const html =
          payload && typeof (payload as any).html === 'string'
            ? (payload as any).html
            : payload && typeof (payload as any).content === 'string'
              ? (payload as any).content
              : extractHtml(data);
        const nextSections = { ...llmSectionsRef.current, [key]: html };
        llmSectionsRef.current = nextSections;
        setLlmSections(nextSections);

        const nextOrder = llmSectionOrderRef.current.includes(key)
          ? llmSectionOrderRef.current
          : [...llmSectionOrderRef.current, key];
        llmSectionOrderRef.current = nextOrder;
        setLlmSectionOrder(nextOrder);

        const partialHtml = buildHtml(
          llmCssRef.current,
          llmOutlineRef.current,
          nextSections,
          nextOrder,
        );
        if (partialHtml) setLlmHtml(partialHtml);
        return;
      }

      if (eventName === 'html') {
        applyFinalPayload({
          ...(payload ?? {}),
          html:
            payload && typeof (payload as any).html === 'string'
              ? (payload as any).html
              : payload && typeof (payload as any).content === 'string'
                ? (payload as any).content
                : extractHtml(data),
        }, { final: false });
        return;
      }

      if (eventName === 'done') {
        const finalPayload =
          payload &&
            typeof payload === 'object' &&
            typeof (payload as any).html !== 'string' &&
            typeof (payload as any).content === 'string'
            ? { ...(payload as any), html: (payload as any).content }
            : payload ?? {};
        applyFinalPayload(finalPayload, { final: true });
        setLlmStatusText(null);
        // For edit/add_page jobs the SSE payload may not include full HTML; refresh progress to get updated workspace.
        void (async () => {
          try {
            const refreshedProgress = await fetchCourseProgress(course.id);
            syncProgress(refreshedProgress ?? {});
          } catch (progressError) {
            console.error('Failed to refresh progress after done', progressError);
          }
        })();
        return;
      }

      if (eventName === 'error') {
        const detailsRaw = (payload as any)?.details ?? (payload as any)?.error_details ?? null;
        const details =
          typeof detailsRaw === 'string'
            ? detailsRaw
            : detailsRaw && typeof detailsRaw === 'object'
              ? JSON.stringify(detailsRaw)
              : null;
        const baseMessage =
          ((payload as any)?.error ?? (payload as any)?.message ?? data) ||
          'Ошибка генерации HTML. Попробуйте ещё раз.';
        const message =
          details && typeof baseMessage === 'string' && baseMessage.trim()
            ? `${baseMessage}: ${details}`
            : baseMessage;
        const hasRenderablePayload =
          payload &&
          typeof payload === 'object' &&
          (typeof (payload as any).html === 'string' ||
            typeof (payload as any).css === 'string' ||
            (payload as any).sections);

        if (hasRenderablePayload) {
          applyFinalPayload({
            ...(payload as any),
            html:
              (payload as any)?.html && typeof (payload as any).html === 'string'
                ? (payload as any).html
                : extractHtml(data),
          }, { final: true });
          return;
        }

        setLlmError(typeof message === 'string' ? message : String(message));
        setIsSendingPrompt(false);
        cleanupStream();
        setLlmStatusText(null);
      }
    },
    [applyFinalPayload, buildHtml, cleanupStream, course.id, parseJsonSafe, syncProgress],
  );

  const startHtmlStream = useCallback(
    (jobId: string) => {
      streamingJobIdRef.current = jobId;
      streamLastEventAtRef.current = Date.now();
      const controller = new AbortController();
      streamControllerRef.current = controller;

      const run = async () => {
        try {
          const response = await fetch(
            `${apiBaseUrl}/api/v1/html/stream?jobId=${encodeURIComponent(jobId)}`,
            {
              method: 'GET',
              signal: controller.signal,
              credentials: 'include',
              headers: { Accept: 'text/event-stream' },
            },
          );

          if (!response.ok) {
            throw new Error(`Stream failed: ${response.status} ${response.statusText}`);
          }

          if (!response.body) {
            throw new Error('Пустой ответ от LLM при стриминге.');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { value, done } = await reader.read();
            streamLastEventAtRef.current = Date.now();
            buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
            const events = buffer.split('\n\n');
            buffer = events.pop() ?? '';

            for (const rawEvent of events) {
              const parsed = parseSseEvent(rawEvent);
              handleStreamEvent(parsed.event, parsed.data);
            }

            if (done) break;
          }

          if (buffer.trim().length > 0) {
            const parsed = parseSseEvent(buffer);
            handleStreamEvent(parsed.event, parsed.data);
          }
        } catch (error) {
          if (controller.signal.aborted) return;
          console.error('HTML stream error', error);
          setLlmError('Ошибка при получении потока. Попробуйте снова.');
          setIsSendingPrompt(false);
          setLlmStatusText(null);
        } finally {
          if (!controller.signal.aborted) {
            streamControllerRef.current = null;
          }
        }
      };

      void run();
    },
    [apiBaseUrl, handleStreamEvent, parseSseEvent],
  );

  // If stream stalls (no events) we fall back to /result polling to avoid infinite "Отправляем...".
  useEffect(() => {
    if (!isSendingPrompt) return;
    if (!streamControllerRef.current) return;
    const jobId = streamingJobIdRef.current;
    if (!jobId) return;

    const interval = window.setInterval(() => {
      const lastAt = streamLastEventAtRef.current;
      if (!lastAt) return;
      if (Date.now() - lastAt < 20000) return;

      // throttle polls
      streamLastEventAtRef.current = Date.now();
      void (async () => {
        try {
          const result = await apiFetch<any>(`/api/v1/html/result?jobId=${encodeURIComponent(jobId)}`);
          const status = typeof result?.status === 'string' ? result.status : null;
          if (status === 'done') {
            applyFinalPayload(result ?? {}, { final: true });
            setLlmStatusText(null);
          } else if (status === 'error') {
            const message =
              typeof result?.error === 'string'
                ? result.error
                : 'Ошибка генерации HTML. Попробуйте ещё раз.';
            setLlmError(message);
            setIsSendingPrompt(false);
            cleanupStream();
            setLlmStatusText(null);
          } else {
            setLlmStatusText((current) => current ?? 'Генерация продолжается...');
          }
        } catch (error) {
          console.error('Failed to poll html result', error);
        }
      })();
    }, 1000);

    return () => window.clearInterval(interval);
  }, [applyFinalPayload, cleanupStream, isSendingPrompt]);

  const handlePromptSubmit = useCallback(async () => {
    const prompt = promptInput.trim();
    if (!prompt || isSendingPrompt) return;
    if (!activeLessonContent) {
      setLlmError(
        activeLessonContentError
        || 'Контент урока ещё загружается. Подождите пару секунд и попробуйте снова.',
      );
      return;
    }
    if (quotaRequired && (courseQuotaLoading || !courseQuota)) {
      setLlmError(courseQuotaError || 'Не удалось проверить лимит запросов. Перезагрузите страницу и попробуйте ещё раз.');
      return;
    }
    if (courseQuota?.limit != null && courseQuota.remaining === 0) {
      setLlmError('Лимит запросов для этого курса исчерпан.');
      return;
    }

    cleanupStream();
    setIsSendingPrompt(true);
    setLlmError(null);
    setLlmStatusText(null);
    setLlmHtml(null);
    setLlmCss(null);
    setLlmSections({});
    setLlmSectionOrder([]);
    setLlmOutline(null);
    llmCssRef.current = null;
    llmSectionsRef.current = {};
    llmSectionOrderRef.current = [];
    llmOutlineRef.current = null;

    try {
      await applyProgressPatch({
        op: 'lesson_prompt',
        lessonId: activeLesson.id,
        prompt,
      });

      const response = await apiFetch<{ jobId?: string; outline?: unknown; quota?: CourseQuota }>(
        '/api/v1/html/start',
        {
          method: 'POST',
          body: JSON.stringify({ prompt, lessonId: activeLesson.id, mode: activeLessonMode, courseId: course.id }),
        },
      );

      if (response && typeof response === 'object' && typeof (response as any).error === 'string') {
        throw new Error((response as any).error);
      }

      if (!response?.jobId) {
        throw new Error('Сервер не вернул идентификатор задачи генерации.');
      }

      setLlmOutline(response.outline ?? null);
      if (response.quota && typeof response.quota === 'object') {
        setCourseQuota(response.quota);
      }
      try {
        const refreshedProgress = await fetchCourseProgress(course.id);
        syncProgress(refreshedProgress ?? {});
      } catch (progressError) {
        console.error('Failed to refresh progress after start', progressError);
      }
      startHtmlStream(response.jobId);
    } catch (error) {
      console.error('Failed to send prompt to LLM', error);
      let message = describeApiError(error, 'Ошибка при запросе LLM. Попробуйте ещё раз.');
      if (error instanceof ApiError && error.status === 502) {
        const code = (error.body as any)?.error;
        if (code === 'LLM_PLAN_NO_SECTIONS') {
          message =
            'Сервер вернул LLM_PLAN_NO_SECTIONS. Проверьте, что для этого урока корректно выставлен mode (edit/add_page) и что /api/v1/html/start поддерживает запуск с mode.';
        }
      }
      setLlmError(message);
      setIsSendingPrompt(false);
      setLlmStatusText(null);
    }
  }, [
    activeLesson.id,
    activeLessonMode,
    activeLessonContent,
    activeLessonContentError,
    applyProgressPatch,
    cleanupStream,
    course.id,
    courseQuota?.limit,
    courseQuota?.remaining,
    courseQuotaError,
    courseQuotaLoading,
    isSendingPrompt,
    promptInput,
    quotaRequired,
    startHtmlStream,
    syncProgress,
  ]);

  useEffect(() => {
    if (activeJobStatus !== 'running') {
      streamingJobIdRef.current = null;
      return;
    }
    if (!isActiveJobForLesson) return;
    if (!activeJobId) return;
    if (streamingJobIdRef.current === activeJobId) return;

    cleanupStream();
    setIsSendingPrompt(true);
    setLlmError(null);
    startHtmlStream(activeJobId);
  }, [activeJobId, activeJobStatus, cleanupStream, isActiveJobForLesson, startHtmlStream]);

  useEffect(() => {
    if (activeJobStatus !== 'done') return;
    if (!isActiveJobForLesson) return;
    if (!activeJobId) return;
    if (storedWorkspace.source === 'files' || hasStoredFilesResult) return;
    if (savedResultHtml && savedResultHtml.trim()) return;
    if (fetchedResultJobIdRef.current === activeJobId) return;

    fetchedResultJobIdRef.current = activeJobId;
    setIsSendingPrompt(true);

    const loadResult = async () => {
      try {
        const result = await apiFetch<any>(
          `/api/v1/html/result?jobId=${encodeURIComponent(activeJobId)}`,
        );
        applyFinalPayload(result ?? {}, { final: true });
        try {
          const refreshedProgress = await fetchCourseProgress(course.id);
          syncProgress(refreshedProgress ?? {});
        } catch (progressError) {
          console.error('Failed to refresh progress after result fetch', progressError);
        }
      } catch (error) {
        console.error('Failed to fetch html result', error);
        setLlmError('Не удалось загрузить результат генерации. Попробуйте ещё раз.');
        setIsSendingPrompt(false);
      }
    };

    void loadResult();
  }, [
    activeJobId,
    activeJobStatus,
    applyFinalPayload,
    course.id,
    isActiveJobForLesson,
    savedResultHtml,
    storedWorkspace.source,
    syncProgress,
  ]);

  useEffect(() => {
    if (!savedResultHtml || !savedResultHtml.trim()) return;
    if (storedWorkspace.source === 'files') return;
    setLlmHtml((current) => (current === savedResultHtml ? current : savedResultHtml));
    if (activeJobStatus !== 'running') {
      setIsSendingPrompt(false);
    }
  }, [activeJobStatus, savedResultHtml, storedWorkspace.source]);

  type LessonBlockItem = {
    key: string;
    content: string;
    prompt: string;
    blockType: string | null;
    items?: string[] | null;
  };

  const blockItems = useMemo<LessonBlockItem[]>(() => {
    if (!visibleBlocks.length) {
      const fallbackText = activeLessonContentLoading
        ? 'Загрузка контента урока...'
        : activeLessonContentError
          ? activeLessonContentError
          : (typeof activeLesson.description === 'string' ? activeLesson.description : '');
      return [
        {
          key: 'fallback-description',
          content: fallbackText,
          prompt: '',
          blockType: null,
        },
      ] as LessonBlockItem[];
    }

    return visibleBlocks
      .map((block, idx) => {
        const key = typeof (block as any)?.id === 'string' ? (block as any).id : `block-${idx}`;
        const blockType = typeof (block as any)?.type === 'string' ? (block as any).type : null;
        const items =
          block &&
            typeof block === 'object' &&
            blockType === 'list' &&
            Array.isArray((block as any).items)
            ? ((block as any).items as unknown[])
              .filter((item) => typeof item === 'string')
              .map((item) => (item as string).trimEnd())
              .filter((item) => item.trim().length > 0)
            : null;
        const content =
          typeof block === 'string'
            ? block
            : block && typeof block === 'object' && typeof (block as any).content === 'string'
              ? (block as any).content
              : '';
        const prompt =
          block && typeof block === 'object' && typeof (block as any).prompt === 'string'
            ? (block as any).prompt.trim()
            : '';

        if (blockType === 'divider') {
          return { key, content: '', prompt: '', blockType, items: null };
        }

        if (blockType === 'list') {
          if (!items || items.length === 0) return null;
          return { key, content, prompt, blockType, items };
        }

        if (!content && !prompt) return null;
        return { key, content, prompt, blockType, items: null };
      })
      .filter(Boolean) as LessonBlockItem[];
  }, [activeLesson.description, activeLessonContentError, activeLessonContentLoading, visibleBlocks]);

  // Render the Right Side Content based on Lesson Type
  const renderRightPanel = () => {
    switch (activeLesson.type) {
      case LessonType.INTERACTIVE_ANALYSIS:
        return <ImageAnalyzer />;
      case LessonType.INTERACTIVE_EDIT:
        return <ImageEditor />;
      case LessonType.VIDEO_TEXT:
      default:
        // Default interactive playground for text-based lessons
        return (
          <div className="flex flex-col h-full bg-[#050914] border-l border-white/5">
            <div className="flex-1 border-b border-white/5 relative overflow-hidden">
              {hasRenderablePreview && (
                <div className="absolute inset-0 flex flex-col">
                  <iframe
                    ref={previewIframeRef}
                    key={`${activeLesson.id}-${uiActiveFile}`}
                    srcDoc={iframeSrcDoc}
                    title="LLM Generated Site"
                    className="w-full flex-1 bg-black"
                    sandbox="allow-scripts"
                  />
                </div>
              )}

              {/* Enhanced Non-blocking Loading Widget */}
              {(isSendingPrompt || activeJobStatus === 'running') && (
                <div className="absolute bottom-6 right-6 z-40 w-80 pointer-events-none">
                  <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl ring-1 ring-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500 pointer-events-auto">
                    <div className="flex items-start gap-4">
                      <div className="relative mt-1">
                        <div className="w-10 h-10 rounded-xl bg-vibe-500/20 flex items-center justify-center border border-vibe-500/30">
                          <div className="w-4 h-4 border-2 border-vibe-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-vibe-500 rounded-full animate-pulse border-2 border-[#0f172a]"></div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-vibe-400 px-2 py-0.5 rounded-md bg-vibe-500/10 border border-vibe-500/20">
                            {(() => {
                              const jobLessonId = activeJobLessonId || activeLesson.id;
                              const jobLesson = course.lessons.find(l => l.id === jobLessonId);
                              const mode = jobLesson ? getLessonMode(jobLesson) : activeLessonMode;

                              if (mode === 'create') return 'Создание';
                              if (mode === 'edit') return 'Редактирование';
                              if (mode === 'add_page') return 'Добавление';
                              return 'Запрос к vibecoderai';
                            })()}
                          </span>
                          <div className="h-1 w-1 rounded-full bg-slate-600"></div>
                          <span className="text-[10px] text-slate-400 font-mono truncate">
                            v1.0.4
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-slate-100 mb-1 flex items-center gap-2">
                          <span className="opacity-50">Text to:</span>
                          <span className="truncate italic">"{(activeJobPrompt || promptInput || '').slice(0, 30)}{(activeJobPrompt || promptInput || '').length > 30 ? '...' : ''}"</span>
                        </h4>

                        <div className="space-y-1.5 mt-3">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-slate-400 truncate max-w-[180px]">
                              {llmStatusText || (activeJobStatus === 'running' ? 'Генерация продолжается...' : 'Инициализация...')}
                            </span>
                            <span className="text-vibe-400 animate-pulse">Running</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-vibe-600 via-vibe-400 to-vibe-600 animate-progress-glow transform-gpu"
                              style={{ backgroundSize: '200% 100%' }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!hasRenderablePreview && !isSendingPrompt && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3 p-6 text-center">
                  <FileText className="w-16 h-16 opacity-20" />
                  <p className="font-mono text-sm">Waiting for input...</p>
                  {!isWorkshopLesson && (
                    <p className="text-xs mt-1 opacity-50">
                      В этом уроке нет интерактивного задания AI.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="h-1/3 p-4 bg-[#02050e] flex flex-col">
              <div className="flex gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
              </div>
              {llmError && !hasRenderablePreview && (
                <div className="text-xs text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-2">
                  {llmError}
                </div>
              )}
              <div className="relative flex-1 mt-1">
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  disabled={isLectureLesson}
                  className={`w-full h-full bg-transparent text-sm resize-none font-mono focus:outline-none pr-28 ${isWorkshopLesson ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  placeholder={isLectureLesson ? '' : 'Console ready...'}
                />
                {isWorkshopLesson && promptInput.trim().length > 0 && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-3">
                    {quotaRequired && (
                      <span className="text-[11px] text-slate-400/80 font-mono">
                        {courseQuotaLoading
                          ? 'Проверяем лимит...'
                          : courseQuotaError
                            ? 'Лимит недоступен'
                            : !courseQuota
                              ? 'Проверяем лимит...'
                              : `Осталось запросов: ${courseQuota.remaining ?? 0}`}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handlePromptSubmit}
                      disabled={
                        isSendingPrompt ||
                        activeLessonContentLoading ||
                        !activeLessonContent ||
                        Boolean(activeLessonContentError) ||
                        (quotaRequired && (courseQuotaLoading || !courseQuota)) ||
                        (courseQuota?.limit != null && courseQuota.remaining === 0)
                      }
                      className="px-3 py-1.5 rounded-lg bg-vibe-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-vibe-900/30 hover:bg-vibe-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      style={{ cursor: 'pointer' }}
                    >
                      <Send className="w-4 h-4" />
                      {isSendingPrompt ? 'Отправляем...' : 'Отправить'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-void text-white overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-[#050914] flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider hover:bg-white/5 px-3 py-1.5 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" /> Назад
          </button>
          <div className="h-6 w-px bg-white/10 mx-2 hidden md:block"></div>
          <div className="hidden md:flex flex-col">
            <h1 className="font-bold text-lg font-display tracking-tight text-slate-200">{course.title}</h1>
            {activeModuleTitle ? (
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                Модуль: {activeModuleTitle}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-vibe-400 font-mono px-3 py-1 bg-vibe-500/10 border border-vibe-500/20 rounded-full">
            Урок {activeLessonIndex + 1} / {course.lessons.length}
          </span>
          <button
            className="md:hidden text-slate-300"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar (Lesson List) */}
        <aside className={`
                absolute md:relative z-20 w-72 bg-[#02050e] border-r border-white/5 h-full transition-transform duration-300 flex flex-col
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
          <div className="overflow-y-auto h-full pb-20 custom-scrollbar">
            {sidebarLessonGroups ? (
              <>
                {sortedCourseModules.map((module) => {
                  const items = sidebarLessonGroups.grouped.get(module.id) ?? [];
                  if (items.length === 0) return null;
                  const groupId = `module:${module.id}`;
                  const collapsed = collapsedSidebarGroups.has(groupId);
                  return (
                    <div key={module.id}>
                      <button
                        type="button"
                        onClick={() => toggleSidebarGroup(groupId)}
                        className="w-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-[#050914] border-b border-white/5 sticky top-0 z-10 flex items-center justify-between hover:text-slate-300 transition-colors"
                        aria-expanded={!collapsed}
                        aria-controls={`sidebar-group-${module.id}`}
                      >
                        <span className="truncate">{module.title}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-600 font-mono">{items.length}</span>
                          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </span>
                      </button>
                      {!collapsed ? (
                        <div id={`sidebar-group-${module.id}`}>
                          {items.map(({ lesson, idx }) => renderLessonNavButton(lesson, idx))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {sidebarLessonGroups.ungrouped.length > 0 ? (
                  <div>
                    {(() => {
                      const groupId = 'ungrouped';
                      const collapsed = collapsedSidebarGroups.has(groupId);
                      return (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleSidebarGroup(groupId)}
                            className="w-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-[#050914] border-b border-white/5 sticky top-0 z-10 flex items-center justify-between hover:text-slate-300 transition-colors"
                            aria-expanded={!collapsed}
                            aria-controls="sidebar-group-ungrouped"
                          >
                            <span className="truncate">Без модуля</span>
                            <span className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-600 font-mono">{sidebarLessonGroups.ungrouped.length}</span>
                              {collapsed ? (
                                <ChevronRight className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </span>
                          </button>
                          {!collapsed ? (
                            <div id="sidebar-group-ungrouped">
                              {sidebarLessonGroups.ungrouped.map(({ lesson, idx }) => renderLessonNavButton(lesson, idx))}
                            </div>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>
                ) : null}
              </>
            ) : (
              course.lessons.map((lesson, idx) => renderLessonNavButton(lesson, idx))
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">

          {/* Left Side: Description & Video */}
          <div className="w-full md:w-1/2 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-void">
            <div className="max-w-3xl mx-auto">
              <div className="mb-8">
                <span className="text-vibe-400 text-xs font-bold uppercase tracking-widest mb-2 block">
                  {activeLesson.lessonTypeRu ?? activeLesson.lessonType ?? activeLesson.type ?? 'Lesson'}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white font-display">{activeLesson.title}</h2>
                {heroSubtitle && (
                  <p className="text-slate-300 text-base md:text-lg leading-relaxed mt-3">
                    {heroSubtitle}
                  </p>
                )}
              </div>

              <div className="prose prose-invert prose-lg prose-headings:font-display prose-p:text-slate-400 prose-strong:text-white max-w-none space-y-6">
                {blockItems.map((block, idx) =>
                  block.blockType === 'divider' ? (
                    <div key={block.key} className="not-prose py-2">
                      <hr className="border-white/10" />
                    </div>
                  ) : block.blockType === 'list' ? (
                    <div key={block.key} className="not-prose">
                      {block.content && (
                        <p className="whitespace-pre-line leading-relaxed text-slate-300 mb-3">{block.content}</p>
                      )}
                      <ul className="list-disc pl-6 space-y-2 text-slate-300">
                        {(block.items ?? []).map((item, itemIdx) => (
                          <li key={itemIdx} className="whitespace-pre-line leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                      {block.prompt && (
                        <div className="relative mt-4 p-4 md:p-5 rounded-xl bg-[#0b1020] border border-vibe-500/30">
                          <button
                            type="button"
                            onClick={() => handleCopyPrompt(block.prompt, idx)}
                            className="absolute -top-3 right-4 text-[9px] md:text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-md border border-white/15 text-slate-200 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-vibe-400/40 hover:text-white transition-colors shadow-lg shadow-black/30"
                            style={{ cursor: 'pointer' }}
                          >
                            {copiedPromptBlock === idx ? 'Скопировано' : 'Скопировать'}
                          </button>
                          <p className="text-xs md:text-sm text-white whitespace-pre-line leading-relaxed">
                            {block.prompt}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : block.blockType === 'tip' ? (
                    <div key={block.key} className="not-prose space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400 font-semibold">
                        Практические советы
                      </p>
                      <div className="relative overflow-hidden rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-[#0c1613] via-[#0a1413] to-[#081012] shadow-lg shadow-emerald-900/30">
                        <div
                          className="absolute inset-0 pointer-events-none opacity-40"
                          style={{
                            background:
                              'radial-gradient(circle at 20% 30%, rgba(16,185,129,0.14), transparent 45%), radial-gradient(circle at 85% 20%, rgba(16,185,129,0.18), transparent 40%)',
                          }}
                          aria-hidden
                        />
                        <div className="relative flex items-start gap-3 p-4 md:p-5">
                          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-500/5 text-emerald-400">
                            <Info className="h-3.5 w-3.5" />
                          </div>
                          <p className="text-[16px] md:text-[17px] text-emerald-50 whitespace-pre-line leading-[1.35] font-medium">
                            {block.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={block.key} className="space-y-3">
                      {block.content && (
                        <p className="whitespace-pre-line leading-relaxed">{block.content}</p>
                      )}
                      {block.prompt && (
                        <div className="relative p-4 md:p-5 rounded-xl bg-[#0b1020] border border-vibe-500/30">
                          <button
                            type="button"
                            onClick={() => handleCopyPrompt(block.prompt, idx)}
                            className="absolute -top-3 right-4 text-[9px] md:text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-md border border-white/15 text-slate-200 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-vibe-400/40 hover:text-white transition-colors shadow-lg shadow-black/30"
                            style={{ cursor: 'pointer' }}
                          >
                            {copiedPromptBlock === idx ? 'Скопировано' : 'Скопировать'}
                          </button>
                          <p className="text-xs md:text-sm text-white whitespace-pre-line leading-relaxed">
                            {block.prompt}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              {examplesBlock && (
                <div className="mt-8 p-6 rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/15 text-purple-200 font-bold flex items-center justify-center border border-purple-500/20 text-lg">
                      ✦
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wider text-purple-200 font-semibold">Examples</p>
                      <p className="text-2xl font-display font-semibold text-white leading-tight">
                        {examplesBlock.title ?? 'Примеры'}
                      </p>
                      {examplesBlock.tip && (
                        <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed max-w-3xl">
                          {examplesBlock.tip}
                        </p>
                      )}
                    </div>
                  </div>

                  {examplesBlock.items && examplesBlock.items.length > 0 && (
                    <div className="space-y-3">
                      {examplesBlock.items.map((item, idx) => {
                        const label = (item.label ?? '').toLowerCase();
                        const isBad = label.includes('плох');
                        const accentClasses = isBad
                          ? 'bg-[#0b1020] border-slate-700/40 text-slate-200'
                          : 'bg-[#0c1a22] border-teal-500/25 text-teal-100';
                        const badgeClasses = isBad
                          ? 'bg-slate-700/40 text-slate-200 border border-slate-500/40'
                          : 'bg-teal-500/20 text-teal-100 border border-teal-400/30';
                        const noteColor = isBad ? 'text-slate-400' : 'text-teal-100/80';

                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border ${accentClasses} space-y-2`}
                          >
                            <div className="flex items-center gap-2">
                              {item.label && (
                                <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${badgeClasses}`}>
                                  {item.label}
                                </span>
                              )}
                            </div>
                            {item.content && (
                              <div className="rounded-lg bg-white/5 px-3 py-2 border border-white/5 relative">
                                <button
                                  type="button"
                                  onClick={() => handleCopyExample(item.content, idx)}
                                  className="absolute top-2 right-2 text-[11px] uppercase tracking-wide px-2 py-1 rounded-md border border-white/10 text-slate-300 hover:border-vibe-400/40 hover:text-white transition-colors"
                                  style={{ cursor: item.content ? 'pointer' : 'default' }}
                                >
                                  {copiedExample === idx ? 'Скопировано' : 'Копировать'}
                                </button>
                                <p className="text-sm text-white whitespace-pre-line leading-relaxed max-w-3xl pr-16">
                                  {item.content}
                                </p>
                              </div>
                            )}
                            {item.notes && item.notes.length > 0 && (
                              <ul className="space-y-1.5 text-sm leading-snug list-disc list-inside">
                                {item.notes.map((note, noteIdx) => (
                                  <li key={noteIdx} className={noteColor}>
                                    {note}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {quizBlock && (
                <div className="mt-8 p-6 rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-vibe-500/15 text-vibe-300 font-bold flex items-center justify-center border border-vibe-500/20">
                      ?
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-vibe-300 font-bold mb-1">Quiz</p>
                      <p className="text-xl font-display text-white leading-tight">
                        {quizBlock.title ?? 'Мини-эксперимент'}
                      </p>
                    </div>
                  </div>
                  {quizBlock.question && (
                    <p className="text-slate-300 whitespace-pre-line leading-relaxed">{quizBlock.question}</p>
                  )}
                  {quizBlock.options && quizBlock.options.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {quizBlock.options.map((option, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleQuizSelect(idx, option)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${quizAnswer === idx
                            ? 'bg-green-500/10 border-green-400/40 text-green-100'
                            : 'bg-[#070c18] border-white/5 text-slate-200 hover:border-vibe-500/30 hover:bg-white/5'
                            }`}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="text-sm">{option}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {quizBlock.note && (
                    <div className="mt-4 text-xs text-slate-400 italic">Note: {quizBlock.note}</div>
                  )}
                </div>
              )}

              <div className="mt-12 flex justify-between items-center pt-8 border-t border-white/10">
                <button
                  disabled={activeLessonIndex === 0}
                  onClick={() => goToLesson(activeLessonIndex - 1)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 disabled:opacity-30 hover:bg-white/5 transition-colors font-bold text-sm"
                >
                  Предыдущий
                </button>
                <button
                  disabled={(!isFinishCta && activeLessonIndex === course.lessons.length - 1) || !isCtaUnlocked}
                  onClick={() => (isFinishCta ? finishCourse() : goToLesson(activeLessonIndex + 1, { completeCurrent: true }))}
                  className="px-6 py-2.5 rounded-xl bg-vibe-600 text-white font-bold hover:bg-vibe-500 transition-colors shadow-lg shadow-vibe-900/20 disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  {ctaData.buttonText ?? 'Следующий'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Interactive Window */}
          <div className="w-full md:w-1/2 h-1/2 md:h-full border-t md:border-t-0 md:border-l border-white/5 bg-[#050914] z-10 shadow-2xl relative">
            {/* IDE Header Decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-vibe-500/50 to-transparent"></div>
            {renderRightPanel()}
          </div>

        </main>
      </div>
    </div>
  );
};
