import { apiFetch } from './apiClient';

export async function fetchPurchasedCourseIds(): Promise<string[]> {
  const res = await apiFetch<{ courseIds?: string[] }>('/api/purchases/courses', { method: 'GET' });
  return Array.isArray(res?.courseIds) ? res.courseIds.filter(Boolean) : [];
}

