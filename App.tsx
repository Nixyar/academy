import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { CourseViewer } from './components/CourseViewer';
import { AuthModal } from './components/AuthModal';
import { ProfilePage } from './components/ProfilePage';
import { Course, LessonType, User } from './types';

// Mock Data
const MOCK_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Основы Vibe Coding 🚀',
    description: 'Научитесь основам взаимодействия с ИИ. Первый шаг в мир быстрой разработки. Включает работу с анализом изображений и редактированием.',
    thumbnail: 'https://picsum.photos/400/250',
    isFree: true,
    lessons: [
      {
        id: 'l1',
        title: 'Что такое Vibe Coding?',
        type: LessonType.VIDEO_TEXT,
        videoUrl: 'placeholder',
        description: `
        # Добро пожаловать в эру Vibe Coding

        **Vibe Coding** — это не просто написание кода, это состояние потока, усиленное искусственным интеллектом.
        
        Вместо того чтобы тратить часы на поиск пропущенной запятой, вы управляете процессом, как дирижер оркестром. Ваши инструменты — это современные LLM, такие как Gemini.

        В этом курсе мы разберем:
        1. Как формулировать мысли для ИИ.
        2. Как использовать мультимодальность (картинки, видео, аудио).
        3. Как редактировать реальность с помощью Nano Banana.
        
        Нажмите "Следующий", чтобы перейти к практике.
        `
      },
      {
        id: 'l2',
        title: 'Практика: Gemini 3 Pro Vision',
        type: LessonType.INTERACTIVE_ANALYSIS,
        description: `
        # ИИ видит мир
        
        Модель **Gemini 3 Pro** обладает уникальной способностью "понимать" изображения.
        
        **Задание:**
        1. Загрузите любую фотографию (интерфейс, схема, пейзаж).
        2. В поле промпта справа спросите: *"Как бы ты сверстал этот интерфейс?"* или *"Опиши настроение этого фото"*.
        3. Посмотрите, как точно ИИ анализирует детали.
        
        Это ключевой навык для Vibe Coder'а: превращать визуал в код или текст мгновенно.
        `
      },
      {
        id: 'l3',
        title: 'Магия: Nano Banana Editor',
        type: LessonType.INTERACTIVE_EDIT,
        description: `
        # Редактирование реальности
        
        Используя модель **Gemini 2.5 Flash Image** (кодовое имя "Nano Banana"), мы можем менять изображения, просто описывая желания текстом.
        
        **Задание:**
        1. Загрузите фото.
        2. Напишите промпт на английском (модель лучше понимает его) или русском: *"Add sunglasses"* (Добавь очки) или *"Make it cyberpank style"* (Сделай стиль киберпанк).
        3. Нажмите кнопку магии.
        
        Это позволяет быстро создавать ассеты для ваших приложений, не открывая Photoshop.
        `
      }
    ]
  },
  {
    id: 'course-2',
    title: 'Продвинутые Паттерны ⚡',
    description: 'Глубокое погружение в архитектуру приложений с ИИ. Создание сложных систем.',
    thumbnail: 'https://picsum.photos/400/251',
    isFree: false,
    lessons: []
  }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'course' | 'profile'>('landing');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogin = (email: string, name?: string) => {
    // Mock user creation
    const newUser: User = {
        id: 'user-1',
        name: name || 'Vibe Coder',
        email: email,
        isSubscribed: false,
        progress: { 'course-1': 1 }, // Mock progress: 1 lesson done in course 1
        completedCourses: []
    };
    setUser(newUser);
    setCurrentView('profile');
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('landing');
  };

  const handleSelectCourse = (courseId: string) => {
    // If user is not logged in, ask them to login first
    if (!user) {
        handleOpenAuth('register');
        return;
    }

    const course = MOCK_COURSES.find(c => c.id === courseId);
    if (!course) return;

    if (!course.isFree && !user.isSubscribed) {
      alert("Этот курс доступен только по подписке! Пожалуйста, оформите Vibe Pro.");
      return;
    }

    setSelectedCourseId(courseId);
    setCurrentView('course');
  };

  const handleSubscribe = () => {
    if (!user) {
        handleOpenAuth('register');
        return;
    }
    const confirm = window.confirm("Оформить подписку за 1499₽ в месяц?");
    if (confirm) {
      setUser({ ...user, isSubscribed: true });
      alert("Поздравляем! Вы теперь Vibe Pro кодер. Доступ ко всем курсам открыт.");
    }
  };

  const activeCourse = MOCK_COURSES.find(c => c.id === selectedCourseId);

  return (
    <div className="font-sans antialiased text-slate-900">
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
        initialMode={authMode}
      />

      {currentView === 'landing' && (
        <LandingPage 
          courses={MOCK_COURSES} 
          user={user}
          onSelectCourse={handleSelectCourse} 
          onSubscribe={handleSubscribe}
          onOpenAuth={handleOpenAuth}
          onGoToProfile={() => setCurrentView('profile')}
        />
      )}

      {currentView === 'profile' && user && (
          <ProfilePage 
            user={user}
            courses={MOCK_COURSES}
            onLogout={handleLogout}
            onContinueCourse={(id) => {
                setSelectedCourseId(id);
                setCurrentView('course');
            }}
            onSubscribe={handleSubscribe}
          />
      )}

      {currentView === 'course' && activeCourse && user && (
        <CourseViewer 
          course={activeCourse} 
          onBack={() => setCurrentView('profile')}
          isSubscribed={user.isSubscribed}
        />
      )}
    </div>
  );
};

export default App;
