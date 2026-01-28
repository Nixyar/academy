import { apiFetch } from './apiClient';

export interface CourseFeedback {
  rating?: number;
  comment?: string;
  updated_at?: string;
}

/**
 * Получить отзыв пользователя для курса
 */
export async function getCourseFeedback(courseId: string): Promise<CourseFeedback> {
  const response = await apiFetch(`/api/feedback/${encodeURIComponent(courseId)}`, {
    method: 'GET',
  });

  return response as CourseFeedback;
}

/**
 * Создать или обновить отзыв для курса
 */
export async function submitCourseFeedback(
  courseId: string,
  rating: number,
  comment: string
): Promise<{ ok: boolean; updated_at: string }> {
  const response = await apiFetch(`/api/feedback/${encodeURIComponent(courseId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rating, comment }),
  });

  return response as { ok: boolean; updated_at: string };
}
