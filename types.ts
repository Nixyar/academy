export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
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
  title: string;
  description: string; // Markdown supported
  videoUrl?: string;
  type: LessonType;
  initialCode?: string; // For code gen lessons
}

export interface User {
  id: string;
  name: string;
  email: string;
  isSubscribed: boolean;
  progress: Record<string, number>; // courseId -> lessonIndex
  completedCourses: string[];
}

export interface UserState {
  hasSubscription: boolean;
  completedLessons: string[];
}
