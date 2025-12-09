export interface Lesson {
  id: string;
  title: string;
  videoUrl?: string; // Placeholder for video
  content: string;
  initialCode: string;
  challenge: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: 'Новичок' | 'Средний' | 'Продвинутый';
  tech: 'HTML' | 'CSS' | 'JS';
  image: string;
  lessons: Lesson[];
  accent: string;
  gradient: string;
}

export interface User {
  name: string;
  email: string;
  isPro: boolean;
  progress: Record<string, number>; // CourseID -> % complete
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
