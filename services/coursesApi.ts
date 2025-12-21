import { apiFetch } from './apiClient';

export interface BackendCourse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  access: string | null;
  status: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface BackendLessonBlock {
  type: string;
  value: unknown;
}

export interface BackendLesson {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  lesson_type: string | null;
  sort_order: number | null;
  blocks: BackendLessonBlock[] | null;
  created_at: string;
  updated_at: string;
}

const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;
const defaultHeaders = supabaseAnonKey
  ? { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }
  : undefined;

function withQuery(path: string, params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function fetchCourses(status: string = 'active'): Promise<BackendCourse[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);

  return apiFetch<BackendCourse[]>(
    withQuery('/api/rest/v1/courses', params),
    { method: 'GET', headers: defaultHeaders },
  );
}

export async function fetchLessonsByCourse(courseId: string): Promise<BackendLesson[]> {
  const params = new URLSearchParams();
  params.set('course_id', `eq.${courseId}`);

  return apiFetch<BackendLesson[]>(
    withQuery('/api/rest/v1/lessons', params),
    { method: 'GET', headers: defaultHeaders },
  );
}

export async function fetchLessonBySlug(courseId: string, slug: string): Promise<BackendLesson | null> {
  const params = new URLSearchParams();
  params.set('course_id', `eq.${courseId}`);
  params.set('slug', `eq.${slug}`);

  return apiFetch<BackendLesson[]>(
    withQuery('/api/rest/v1/lessons', params),
    { method: 'GET', headers: defaultHeaders },
  ).then((items) => items[0] ?? null);
}
