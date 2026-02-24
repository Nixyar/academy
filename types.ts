// =============================================
// Lesson Block Types (from redesign — used in BlockComponents)
// =============================================

export type BlockType =
  | 'divider'
  | 'list'
  | 'tip'
  | 'comparison'
  | 'practice_step'
  | 'reflection_task'
  | 'interactive_table'
  | 'feedback';

export interface BaseBlock {
  type: BlockType;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  content: string;
  items: string[];
  prompt?: string;
}

export interface TipBlock extends BaseBlock {
  type: 'tip';
  content: string;
}

export interface ComparisonBlock extends BaseBlock {
  type: 'comparison';
  title: string;
  leftTitle: string;
  leftContent: string;
  rightTitle: string;
  rightContent: string;
}

export interface PracticeStepBlock extends BaseBlock {
  type: 'practice_step';
  content: string;
  prompt: string;
  outputMode?: 'text' | 'website';
}

export interface ReflectionTaskBlock extends BaseBlock {
  type: 'reflection_task';
  title: string;
  content: string;
}

export interface InteractiveTableBlock extends BaseBlock {
  type: 'interactive_table';
  title: string;
  description: string;
  rows: Array<{
    element: string;
    questions: string;
    example: string;
  }>;
}

export interface FeedbackBlock extends BaseBlock {
  type: 'feedback';
}

export type LessonBlock =
  | DividerBlock
  | ListBlock
  | TipBlock
  | ComparisonBlock
  | PracticeStepBlock
  | ReflectionTaskBlock
  | InteractiveTableBlock
  | FeedbackBlock;

// =============================================
// Lesson Types (backend enum)
// =============================================

export enum LessonType {
  VIDEO_TEXT = 'VIDEO_TEXT',
  INTERACTIVE_ANALYSIS = 'INTERACTIVE_ANALYSIS',
  INTERACTIVE_EDIT = 'INTERACTIVE_EDIT',
  CODE_GENERATION = 'CODE_GENERATION',
}

// =============================================
// Course Module
// =============================================

export interface CourseModule {
  id: string;
  courseId: string;
  sortOrder: number | null;
  title: string;
}

// =============================================
// Lesson (unified: redesign UI + backend API fields)
// =============================================

export interface Lesson {
  id: string;
  courseId: string;
  moduleId?: string | null;
  slug: string;
  title: string;
  description: string;
  videoUrl?: string | null;
  type: LessonType;
  lessonType?: string | null;
  lessonTypeRu?: string | null;
  sortOrder?: number | null;
  blocks?: LessonBlock[] | unknown;
  initialCode?: string;
  unlock_rule?: unknown;
  settings?: unknown;
  mode?: string | null;
  settings_mode?: string | null;
  // UI-only fields (optional, can be computed)
  duration?: string; // e.g., "10 мин"
}

// =============================================
// Course (unified: redesign UI + backend API fields)
// =============================================

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  access?: string | null; // 'free' | 'paid'
  status?: string | null; // 'draft' | 'active' | 'hidden'
  label?: string | string[] | null;
  sortOrder?: number | null;
  price?: number | null;
  salePrice?: number | null;
  currency?: string | null;
  llmLimit?: number | null;
  isPurchased?: boolean;
  isFree: boolean;
  lessons: Lesson[];
  modules?: CourseModule[];
  // UI-only fields from redesign (optional)
  imageUrl?: string; // alias for coverUrl (backward compat)
  level?: string;
  features?: string[];
  aiRequestsAllowed?: number; // alias for llmLimit
}

// =============================================
// User & Auth
// =============================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  isSubscribed: boolean;
  plan?: string;
  dailyLimit?: number;
  dailyUsed?: number;
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  progress: Record<string, CourseProgress>;
  completedCourses: string[];
}

// =============================================
// Progress (server-side)
// =============================================

export type LessonStatus = 'in_progress' | 'completed';

export interface LessonProgress {
  status?: LessonStatus;
  completed_at?: string | null;
  quiz_answers?: Record<string, unknown>;
  prompt?: string | null;
  result?: {
    html?: string;
    files?: Record<string, string>;
    active_file?: string;
  };
  [key: string]: unknown;
}

export interface CourseProgress {
  lessons?: Record<string, LessonProgress | undefined>;
  resume_lesson_id?: string | null;
  last_viewed_lesson_id?: string | null;
  [key: string]: unknown;
}

// =============================================
// Course Quota
// =============================================

export interface CourseQuota {
  courseId: string;
  limit: number | null;
  used: number;
  remaining: number | null;
}

// =============================================
// Course Feedback
// =============================================

export interface CourseFeedback {
  rating?: number;
  comment?: string;
  updated_at?: string;
}

// =============================================
// Subscription
// =============================================

export interface Subscription {
  id: string;
  userId: string;
  plan: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'past_due';
  provider: string;
  amountKopeks: number;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// Prompt Library (static, from data.ts)
// =============================================

export interface PromptExample {
  id: string;
  title: string;
  category: string;
  description: string;
  prompt: string;
  explanation: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  technique?: string;
  tags?: string[];
  recommendedBy?: string;
  sourceUrl?: string;
  isNew?: boolean;
}
