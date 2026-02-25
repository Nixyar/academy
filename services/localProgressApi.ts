/**
 * LocalProgress API
 * Stores course progress for unauthenticated (guest) users in localStorage.
 * On registration/login, this progress is synced to the server and then cleared.
 */

const STORAGE_KEY = 'vca_guest_progress';

interface LocalLessonProgress {
  status: 'completed';
  completedAt: string;
}

export interface LocalCourseProgress {
  lessons: Record<string, LocalLessonProgress>;
}

export type LocalProgress = Record<string, LocalCourseProgress>;

function readStorage(): LocalProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorage(data: LocalProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}

/** Returns all local progress data (all courses) */
export function getAllLocalCourseProgress(): LocalProgress {
  return readStorage();
}

/** Returns progress for a single course */
export function getLocalCourseProgress(courseId: string): LocalCourseProgress {
  const all = readStorage();
  return all[courseId] ?? { lessons: {} };
}

/** Marks a lesson as completed in localStorage */
export function setLocalLessonCompleted(courseId: string, lessonId: string): void {
  const all = readStorage();
  if (!all[courseId]) {
    all[courseId] = { lessons: {} };
  }
  all[courseId].lessons[lessonId] = {
    status: 'completed',
    completedAt: new Date().toISOString(),
  };
  writeStorage(all);
}

/** Removes all guest progress from localStorage */
export function clearLocalProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
