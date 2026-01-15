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
  const normalizedLabels = Array.isArray(row.labels)
    ? row.labels
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  const normalizedLabel = typeof row.label === 'string' && row.label.trim() ? row.label.trim() : null;
  const label: Course['label'] = normalizedLabels.length > 0 ? normalizedLabels : normalizedLabel;

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
  const courseId = (row as any).course_id ?? (row as any).courseId ?? '';
  const sortOrder = (row as any).sort_order ?? (row as any).sortOrder ?? null;
  return {
    id: row.id,
    courseId: String(courseId),
    sortOrder: typeof sortOrder === 'number' ? sortOrder : sortOrder == null ? null : Number(sortOrder),
    title: row.title ?? 'Без названия',
  };
}

function mapLesson(row: BackendLesson): Lesson {
  const courseId = (row as any).course_id ?? (row as any).courseId ?? '';
  const moduleIdRaw = (row as any).module_id ?? (row as any).moduleId ?? null;
  const altModuleIdRaw = (row as any).course_module_id ?? (row as any).courseModuleId ?? null;
  const effectiveModuleIdRaw = moduleIdRaw ?? altModuleIdRaw ?? null;
  const moduleId = effectiveModuleIdRaw == null ? null : String(effectiveModuleIdRaw);
  const sortOrder = (row as any).sort_order ?? (row as any).sortOrder ?? null;
  return {
    id: row.id,
    courseId: String(courseId),
    moduleId,
    slug: row.slug ?? row.id,
    title: row.title ?? 'Без названия',
    description: extractDescription(row.blocks),
    type: mapLessonType(row.lesson_type),
    lessonType: row.lesson_type ?? null,
    lessonTypeRu: row.lesson_type_ru ?? null,
    sortOrder: typeof sortOrder === 'number' ? sortOrder : sortOrder == null ? null : Number(sortOrder),
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
      try {
        const result = await apiFetch<{ lessons?: BackendLesson[]; modules?: BackendCourseModule[] }>(
          `/api/courses/${encodeURIComponent(id)}/content`,
        );
        const lessons = Array.isArray(result?.lessons) ? result.lessons : [];
        const modules = Array.isArray(result?.modules) ? result.modules : [];

        const content: CourseContent = {
          lessons: lessons.map(mapLesson),
          modules: modules.map(mapCourseModule),
        };
        contentCache.set(id, content);
        return content;
      } catch {
        // Back-compat fallback for older backends.
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
