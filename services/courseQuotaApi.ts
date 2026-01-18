import { apiFetch } from './apiClient';

export type CourseQuota = {
  courseId: string;
  limit: number | null;
  used: number;
  remaining: number | null;
};

const QUOTA_CACHE_TTL_MS = 5000;
const quotaCache = new Map<string, { expiresAt: number; value: CourseQuota }>();
const inFlightQuota = new Map<string, Promise<CourseQuota>>();

export async function fetchCourseQuota(courseId: string): Promise<CourseQuota> {
  const id = String(courseId || '').trim();
  if (!id) return { courseId: '', limit: null, used: 0, remaining: null };

  const cached = quotaCache.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const existing = inFlightQuota.get(id);
  if (existing) return existing;

  const promise = (async () => {
    // Important: quota is a gating call. Avoid retries that can flood the backend on 503.
    const result = await apiFetch<CourseQuota>(`/api/courses/${encodeURIComponent(id)}/quota`, {}, { retry: false });
    quotaCache.set(id, { expiresAt: Date.now() + QUOTA_CACHE_TTL_MS, value: result });
    return result;
  })();

  inFlightQuota.set(id, promise);
  try {
    return await promise;
  } finally {
    if (inFlightQuota.get(id) === promise) {
      inFlightQuota.delete(id);
    }
  }
}
