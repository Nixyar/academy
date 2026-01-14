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

type BackendLessonWithModule = BackendLesson & {
  course_modules?: BackendCourseModule | null;
};

type CourseContent = { lessons: Lesson[]; modules: CourseModule[] };

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

const contentCache = new Map<string, CourseContent>();
const contentInFlight = new Map<string, Promise<CourseContent>>();

export async function fetchCourseContent(courseId: string): Promise<CourseContent> {
  const id = String(courseId || '').trim();
  if (!id) return { lessons: [], modules: [] };

  const cached = contentCache.get(id);
  if (cached) return cached;

  const inflight = contentInFlight.get(id);
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      // Preferred path: single request via PostgREST embedding (lessons -> course_modules).
      try {
        const lessons = await apiFetch<BackendLessonWithModule[]>(
          `/api/rest/v1/lessons?course_id=eq.${id}&select=id,course_id,module_id,slug,title,lesson_type,lesson_type_ru,sort_order,blocks,unlock_rule,settings,mode,settings_mode,course_modules(id,course_id,sort_order,title)&order=sort_order.asc`,
        );

        const modulesById = new Map<string, CourseModule>();
        lessons.forEach((row) => {
          const module = row.course_modules;
          if (module && typeof module.id === 'string') {
            modulesById.set(module.id, mapCourseModule(module));
          }
        });

        const mappedLessons = lessons.map(mapLesson);
        const mappedModules = [...modulesById.values()].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        const content: CourseContent = { lessons: mappedLessons, modules: mappedModules };
        contentCache.set(id, content);
        return content;
      } catch {
        // Fallback: 2 requests (keeps app working if embed relationship isn't configured).
        const [lessons, modules] = await Promise.all([
          apiFetch<BackendLesson[]>(
            `/api/rest/v1/lessons?course_id=eq.${id}&order=sort_order.asc`,
          ),
          apiFetch<BackendCourseModule[]>(
            `/api/rest/v1/course_modules?course_id=eq.${id}&order=sort_order.asc`,
          ),
        ]);
        const content: CourseContent = { lessons: lessons.map(mapLesson), modules: modules.map(mapCourseModule) };
        contentCache.set(id, content);
        return content;
      }
    } finally {
      contentInFlight.delete(id);
    }
  })();

  contentInFlight.set(id, promise);
  return promise;
}

export async function fetchCourseLessons(courseId: string): Promise<Lesson[]> {
  return (await fetchCourseContent(courseId)).lessons;
}

export async function fetchCourseModules(courseId: string): Promise<CourseModule[]> {
  return (await fetchCourseContent(courseId)).modules;
}
