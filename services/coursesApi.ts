import { apiFetch } from './apiClient';
import { Course, CourseModule, Lesson, LessonType } from '../types';

interface BackendCourse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  access?: string | null;
  status?: string | null;
  label?: string | null;
  labels?: string[] | null;
  sort_order?: number | null;
  price?: number | null;
  sale_price?: number | null;
  currency?: string | null;
  is_purchased?: boolean | null;
}

interface BackendLesson {
  id: string;
  course_id: string;
  module_id?: string | null;
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

interface BackendCourseModule {
  id: string;
  course_id: string;
  sort_order?: number | null;
  title: string | null;
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
  const label =
    (typeof row.label === 'string' && row.label.trim() ? row.label.trim() : null) ??
    (Array.isArray(row.labels)
      ? (row.labels.find((value) => typeof value === 'string' && value.trim())?.trim() ?? null)
      : null);

  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title || 'Без названия',
    description: row.description ?? '',
    coverUrl: row.cover_url ?? null,
    access: row.access,
    status: row.status,
    label,
    sortOrder: row.sort_order ?? null,
    price: row.price ?? null,
    salePrice: row.sale_price ?? null,
    currency: row.currency ?? null,
    isPurchased: Boolean(row.is_purchased),
    isFree: access !== 'pro',
    lessons: [],
    modules: [],
  };
}

function mapCourseModule(row: BackendCourseModule): CourseModule {
  return {
    id: row.id,
    courseId: row.course_id,
    sortOrder: row.sort_order ?? null,
    title: row.title ?? 'Без названия',
  };
}

function mapLesson(row: BackendLesson): Lesson {
  return {
    id: row.id,
    courseId: row.course_id,
    moduleId: row.module_id ?? null,
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
        `/api/rest/v1/lessons?course_id=eq.${id}&order=sort_order.asc`,
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

const modulesCache = new Map<string, CourseModule[]>();
const modulesInFlight = new Map<string, Promise<CourseModule[]>>();

export async function fetchCourseModules(courseId: string): Promise<CourseModule[]> {
  const id = String(courseId || '').trim();
  if (!id) return [];

  const cached = modulesCache.get(id);
  if (cached) return cached;

  const inflight = modulesInFlight.get(id);
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      const modules = await apiFetch<BackendCourseModule[]>(
        `/api/rest/v1/course_modules?course_id=eq.${id}&order=sort_order.asc`,
      );
      const mapped = modules.map(mapCourseModule);
      modulesCache.set(id, mapped);
      return mapped;
    } finally {
      modulesInFlight.delete(id);
    }
  })();

  modulesInFlight.set(id, promise);
  return promise;
}
