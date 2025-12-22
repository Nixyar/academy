export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  access?: string | null;
  status?: string | null;
  sortOrder?: number | null;
  isFree: boolean;
  lessons: Lesson[];
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
  sortOrder?: number | null;
  blocks?: unknown;
  initialCode?: string; // For code gen lessons
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
  progress: Record<string, number>; // courseId -> lessonIndex
  completedCourses: string[];
}

export interface UserState {
  hasSubscription: boolean;
  completedLessons: string[];
}
