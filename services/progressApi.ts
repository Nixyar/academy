import { apiFetch } from './apiClient';
import type { CourseProgress, LessonStatus } from '../types';

const inFlightCourseProgress = new Map<string, Promise<CourseProgress>>();
const inFlightCoursesProgress = new Map<string, Promise<Record<string, CourseProgress>>>();

export type CourseProgressPatch =
  | { op: 'quiz_answer'; lessonId: string; quizId: string; answer: unknown }
  | { op: 'lesson_status'; lessonId: string; status: LessonStatus; completedAt?: string | null }
  | { op: 'set_resume'; lessonId: string }
  | { op: 'lesson_prompt'; lessonId: string; prompt: string }
  | { op: 'touch_lesson'; lessonId: string }
  // HTML workspace navigation (multi-page preview)
  | { op: 'set_active_file'; lessonId: string; active_file: string; file?: string }
  // Allow backend to introduce new patch ops without breaking the frontend build.
  | { op: string; [key: string]: unknown };

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

export async function fetchCourseProgress(courseId: string): Promise<CourseProgress> {
  const key = String(courseId);
  const existing = inFlightCourseProgress.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const response = await apiFetch<ProgressEnvelope | CourseProgress | null>(
      `/api/courses/${courseId}/progress`,
    );
    return normalizeCourseProgress(response);
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
  return normalizeCourseProgress(response);
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
  return normalizeCourseProgress(response);
}

export async function fetchCourseResume(courseId: string): Promise<ResumeResponse> {
  return apiFetch<ResumeResponse>(`/api/courses/${courseId}/resume`);
}

export async function fetchCoursesProgress(
  courseIds: string[],
): Promise<Record<string, CourseProgress>> {
  if (courseIds.length === 0) return {};

  const uniqueIds = Array.from(new Set(courseIds.map((id) => String(id)).filter(Boolean)));
  const canonicalIds = [...uniqueIds].sort();
  const key = canonicalIds.join(',');

  const existing = inFlightCoursesProgress.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const query = encodeURIComponent(canonicalIds.join(','));
    const response = await apiFetch<ProgressMapResponse>(`/api/progress?courseIds=${query}`);
    const progressMap = response.progress ?? {};

    return courseIds.reduce<Record<string, CourseProgress>>((acc, id) => {
      acc[id] = normalizeCourseProgress(progressMap[id] ?? {});
      return acc;
    }, {});
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
