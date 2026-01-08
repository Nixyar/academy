import { apiFetch } from './apiClient';
import { Course, Lesson, LessonType } from '../types';

interface BackendCourse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  access?: string | null;
  status?: string | null;
  sort_order?: number | null;
}

interface BackendLesson {
  id: string;
  course_id: string;
  slug: string | null;
  title: string | null;
  lesson_type: string | null;
  lesson_type_ru?: string | null;
  sort_order?: number | null;
  blocks?: unknown;
  unlock_rule?: unknown;
  settings?: unknown;
  mode?: string | null;
  settings_mode?: string | null;
}

function mapLessonType(lessonType?: string | null): LessonType {
  switch ((lessonType ?? '').toUpperCase()) {
    case LessonType.INTERACTIVE_ANALYSIS:
      return LessonType.INTERACTIVE_ANALYSIS;
    case LessonType.INTERACTIVE_EDIT:
      return LessonType.INTERACTIVE_EDIT;
    case LessonType.CODE_GENERATION:
      return LessonType.CODE_GENERATION;
    case LessonType.VIDEO_TEXT:
    default:
      return LessonType.VIDEO_TEXT;
  }
}

function extractDescription(blocks: unknown): string {
  if (!blocks) return 'Описание появится позже.';
  if (typeof blocks === 'string') return blocks;
  if (Array.isArray(blocks)) {
    const joined = blocks
      .map((block) => {
        if (typeof block === 'string') return block;
        if (block && typeof block === 'object' && 'content' in block && typeof (block as any).content === 'string') {
          return (block as any).content;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n')
      .trim();
    if (joined) return joined;
  }
  if (blocks && typeof blocks === 'object') {
    if ('content' in blocks && typeof (blocks as any).content === 'string') {
      return (blocks as any).content as string;
    }
  }
  return 'Описание появится позже.';
}

function mapCourse(row: BackendCourse): Course {
  const access = row.access?.toLowerCase() ?? 'free';

  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title || 'Без названия',
    description: row.description ?? '',
    coverUrl: row.cover_url ?? null,
    access: row.access,
    status: row.status,
    sortOrder: row.sort_order ?? null,
    isFree: access !== 'pro',
    lessons: [],
  };
}

function mapLesson(row: BackendLesson): Lesson {
  return {
    id: row.id,
    courseId: row.course_id,
    slug: row.slug ?? row.id,
    title: row.title ?? 'Без названия',
    description: extractDescription(row.blocks),
    type: mapLessonType(row.lesson_type),
    lessonType: row.lesson_type ?? null,
    lessonTypeRu: row.lesson_type_ru ?? null,
    sortOrder: row.sort_order ?? null,
    blocks: row.blocks,
    unlock_rule: row.unlock_rule,
    videoUrl: null,
    settings: row.settings,
    mode: row.mode ?? null,
    settings_mode: row.settings_mode ?? null,
  };
}

export async function fetchCourses(): Promise<Course[]> {
  const courses = await apiFetch<BackendCourse[]>(`/api/rest/v1/courses`);

  return courses.map(mapCourse);
}

const lessonsCache = new Map<string, Lesson[]>();
const lessonsInFlight = new Map<string, Promise<Lesson[]>>();

export async function fetchCourseLessons(courseId: string): Promise<Lesson[]> {
  const id = String(courseId || '').trim();
  if (!id) return [];

  const cached = lessonsCache.get(id);
  if (cached) return cached;

  const inflight = lessonsInFlight.get(id);
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      const lessons = await apiFetch<BackendLesson[]>(
        `/api/rest/v1/lessons?course_id=eq.${id}`,
      );
      const mapped = lessons.map(mapLesson);
      lessonsCache.set(id, mapped);
      return mapped;
    } finally {
      lessonsInFlight.delete(id);
    }
  })();

  lessonsInFlight.set(id, promise);
  return promise;
}
