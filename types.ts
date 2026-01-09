export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  access?: string | null;
  status?: string | null;
  label?: string | string[] | null;
  sortOrder?: number | null;
  isFree: boolean;
  lessons: Lesson[];
}

export type LessonStatus = 'in_progress' | 'completed';

export interface LessonProgress {
  status?: LessonStatus;
  completed_at?: string | null;
  quiz_answers?: Record<string, unknown>;
  prompt?: string | null;
}

export interface CourseProgress {
  lessons?: Record<string, LessonProgress | undefined>;
  resume_lesson_id?: string | null;
  last_viewed_lesson_id?: string | null;
  [key: string]: unknown;
}

export enum LessonType {
  VIDEO_TEXT = 'VIDEO_TEXT',
  INTERACTIVE_ANALYSIS = 'INTERACTIVE_ANALYSIS', // Image understanding
  INTERACTIVE_EDIT = 'INTERACTIVE_EDIT', // Image editing
  CODE_GENERATION = 'CODE_GENERATION'
}

export interface Lesson {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  description: string; // Markdown supported
  videoUrl?: string | null;
  type: LessonType;
  lessonType?: string | null; // raw backend lesson_type (en)
  lessonTypeRu?: string | null; // localized lesson_type_ru for display
  sortOrder?: number | null;
  blocks?: unknown;
  initialCode?: string; // For code gen lessons
  unlock_rule?: unknown; // unlock conditions from backend (raw shape)
  // Backend-controlled behavior flags (e.g. edit/add_page/create)
  settings?: unknown;
  mode?: string | null;
  settings_mode?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  isSubscribed: boolean;
  plan?: string;
  dailyLimit?: number;
  dailyUsed?: number;
  progress: Record<string, CourseProgress>; // courseId -> progress object
  completedCourses: string[];
}

export interface UserState {
  hasSubscription: boolean;
  completedLessons: string[];
}
