import { apiFetch } from './apiClient';
import type { CourseProgress, LessonStatus } from '../types';

// In-flight deduplication
const inFlightCourseProgress = new Map<string, Promise<CourseProgress>>();
const inFlightCourseProgressStatus = new Map<string, Promise<CourseProgress>>();
const inFlightCoursesProgress = new Map<string, Promise<Record<string, CourseProgress>>>();

// Short-term cache to avoid redundant requests (5 second TTL)
const PROGRESS_CACHE_TTL_MS = 5000;
const progressCache = new Map<string, { expiresAt: number; value: CourseProgress }>();
const progressStatusCache = new Map<string, { expiresAt: number; value: CourseProgress }>();

const coursesProgressCache = new Map<string, { expiresAt: number; value: Record<string, CourseProgress> }>();

export function invalidateProgressCache(courseId?: string): void {
  if (courseId) {
    progressCache.delete(String(courseId));
    progressStatusCache.delete(String(courseId));
  } else {
    progressCache.clear();
    progressStatusCache.clear();
  }
  coursesProgressCache.clear();
}

export type CourseProgressPatch =
  | { op: 'quiz_answer'; lessonId: string; quizId: string; answer: unknown }
  | { op: 'lesson_status'; lessonId: string; status: LessonStatus; completedAt?: string | null }
  | { op: 'course_feedback'; rating: number; comment?: string | null; updatedAt?: string | null }
  | { op: 'set_resume'; lessonId: string }
  | { op: 'lesson_prompt'; lessonId: string; prompt: string }
  | { op: 'touch_lesson'; lessonId: string }
  // HTML workspace navigation (multi-page preview)
  | { op: 'set_active_file'; lessonId: string; active_file: string; file?: string }
  // Allow backend to introduce new patch ops without breaking the frontend build.
  | { op: string;[key: string]: unknown };

type ProgressEnvelope = { course_id?: string; progress?: CourseProgress };
type ProgressMapResponse = { progress?: Record<string, CourseProgress | undefined> };
type ResumeResponse = { lesson_id: string | null };

function normalizeCourseProgress(payload: unknown): CourseProgress {
  if (!payload || typeof payload !== 'object') return {};
  const withProgress = (payload as ProgressEnvelope).progress;
  if (withProgress && typeof withProgress === 'object') {
    return withProgress;
  }
  return payload as CourseProgress;
}

export async function fetchCourseProgress(
  courseId: string,
  opts?: { skipCache?: boolean },
): Promise<CourseProgress> {
  const key = String(courseId);

  // Check cache first (unless skipCache is true)
  if (!opts?.skipCache) {
    const cached = progressCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
  }

  // Check for in-flight request
  const existing = inFlightCourseProgress.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const response = await apiFetch<ProgressEnvelope | CourseProgress | null>(
      `/api/courses/${courseId}/progress`,
    );
    const result = normalizeCourseProgress(response);

    // Update cache
    progressCache.set(key, {
      expiresAt: Date.now() + PROGRESS_CACHE_TTL_MS,
      value: result,
    });

    return result;
  })();

  inFlightCourseProgress.set(key, promise);

  try {
    return await promise;
  } finally {
    if (inFlightCourseProgress.get(key) === promise) {
      inFlightCourseProgress.delete(key);
    }
  }
}

export async function fetchCourseProgressStatus(
  courseId: string,
  opts?: { skipCache?: boolean },
): Promise<CourseProgress> {
  const key = String(courseId);

  if (!opts?.skipCache) {
    const cached = progressStatusCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
  }

  const existing = inFlightCourseProgressStatus.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const response = await apiFetch<ProgressEnvelope | CourseProgress | null>(
      `/api/courses/${key}/progress?onlyStatus=true`,
    );
    const result = normalizeCourseProgress(response);

    progressStatusCache.set(key, {
      expiresAt: Date.now() + PROGRESS_CACHE_TTL_MS,
      value: result,
    });

    return result;
  })();

  inFlightCourseProgressStatus.set(key, promise);

  try {
    return await promise;
  } finally {
    if (inFlightCourseProgressStatus.get(key) === promise) {
      inFlightCourseProgressStatus.delete(key);
    }
  }
}

export async function upsertCourseProgress(
  courseId: string,
  progress: CourseProgress,
): Promise<CourseProgress> {
  const response = await apiFetch<ProgressEnvelope | CourseProgress>(
    `/api/courses/${courseId}/progress`,
    {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    },
  );
  const result = normalizeCourseProgress(response);

  // Update cache with fresh data
  progressCache.set(String(courseId), {
    expiresAt: Date.now() + PROGRESS_CACHE_TTL_MS,
    value: result,
  });

  return result;
}

export async function patchCourseProgress(
  courseId: string,
  patch: CourseProgressPatch,
): Promise<CourseProgress> {
  const response = await apiFetch<ProgressEnvelope | CourseProgress>(
    `/api/courses/${courseId}/progress`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    },
  );
  const result = normalizeCourseProgress(response);

  // Update cache with fresh data
  progressCache.set(String(courseId), {
    expiresAt: Date.now() + PROGRESS_CACHE_TTL_MS,
    value: result,
  });

  return result;
}

export async function fetchCourseResume(courseId: string): Promise<ResumeResponse> {
  return apiFetch<ResumeResponse>(`/api/courses/${courseId}/resume`);
}

export async function fetchCoursesProgress(
  courseIds: string[],
  opts?: { skipCache?: boolean },
): Promise<Record<string, CourseProgress>> {
  if (courseIds.length === 0) return {};

  const uniqueIds = Array.from(new Set(courseIds.map((id) => String(id)).filter(Boolean)));
  const canonicalIds = [...uniqueIds].sort();
  const key = canonicalIds.join(',');

  if (!opts?.skipCache) {
    const cached = coursesProgressCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
  }

  const existing = inFlightCoursesProgress.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const query = encodeURIComponent(canonicalIds.join(','));
    const response = await apiFetch<ProgressMapResponse>(`/api/progress?courseIds=${query}`);
    const progressMap = response.progress ?? {};

    const result = courseIds.reduce<Record<string, CourseProgress>>((acc, id) => {
      acc[id] = normalizeCourseProgress(progressMap[id] ?? {});
      return acc;
    }, {});

    coursesProgressCache.set(canonicalIds.join(','), {
      expiresAt: Date.now() + PROGRESS_CACHE_TTL_MS,
      value: result,
    });

    return result;
  })();

  inFlightCoursesProgress.set(key, promise);

  try {
    return await promise;
  } finally {
    if (inFlightCoursesProgress.get(key) === promise) {
      inFlightCoursesProgress.delete(key);
    }
  }
}
