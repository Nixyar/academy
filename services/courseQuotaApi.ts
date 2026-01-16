import { apiFetch } from './apiClient';

export type CourseQuota = {
  courseId: string;
  limit: number | null;
  used: number;
  remaining: number | null;
};

export async function fetchCourseQuota(courseId: string): Promise<CourseQuota> {
  const id = String(courseId || '').trim();
  if (!id) return { courseId: '', limit: null, used: 0, remaining: null };
  return apiFetch<CourseQuota>(`/api/courses/${encodeURIComponent(id)}/quota`);
}

