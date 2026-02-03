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
  llm_limit?: number | null;
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
    llmLimit: null,
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
    description: '',
    type: mapLessonType(row.lesson_type),
    lessonType: row.lesson_type ?? null,
    lessonTypeRu: row.lesson_type_ru ?? null,
    sortOrder: typeof sortOrder === 'number' ? sortOrder : sortOrder == null ? null : Number(sortOrder),
    videoUrl: null,
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
