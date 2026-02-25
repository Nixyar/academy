import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Course, CourseProgress, CourseModule, Lesson, LessonBlock, User } from '../types';
import {
  Divider,
  List,
  Tip,
  Comparison,
  PracticeStep,
  ReflectionTask,
  InteractiveTable,
  Feedback,
} from './BlockComponents';
import AiHelper from './AiHelper';
import { ChevronLeft, CheckCircle2, Circle, Zap, ArrowRight, Menu, Sparkles, Loader2, FolderOpen } from 'lucide-react';
import { fetchLessonContent, getCachedLessonContent } from '../services/lessonsApi';
import { patchCourseProgress } from '../services/progressApi';
import { fetchCourseQuota } from '../services/courseQuotaApi';
import { submitCourseFeedback } from '../services/feedbackApi';
import { setLocalLessonCompleted, getLocalCourseProgress } from '../services/localProgressApi';

/* ─── Copy-protection for lesson content ─── */
const COPYABLE_SELECTOR = [
  'pre', 'code', 'textarea', 'input',
  '[data-copyable]', '.copyable',
  '[contenteditable="true"]',
].join(',');

function useContentProtection(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isInsideCopyable = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      return !!target.closest(COPYABLE_SELECTOR);
    };

    const onCopy = (e: ClipboardEvent) => {
      if (isInsideCopyable(e.target)) return;         // allow copy in code/inputs
      e.preventDefault();
    };
    const onCut = (e: ClipboardEvent) => {
      if (isInsideCopyable(e.target)) return;
      e.preventDefault();
    };
    const onContextMenu = (e: MouseEvent) => {
      if (isInsideCopyable(e.target)) return;
      e.preventDefault();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isInsideCopyable(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      // Block Ctrl+C, Ctrl+A, Ctrl+S, Ctrl+U, Ctrl+P
      if (mod && ['c','a','s','u','p'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      // Block F12 / Ctrl+Shift+I (DevTools)
      if (e.key === 'F12' || (mod && e.shiftKey && e.key.toLowerCase() === 'i')) {
        e.preventDefault();
      }
    };
    const onDragStart = (e: DragEvent) => {
      if (isInsideCopyable(e.target)) return;
      e.preventDefault();
    };

    el.addEventListener('copy', onCopy);
    el.addEventListener('cut', onCut);
    el.addEventListener('contextmenu', onContextMenu);
    el.addEventListener('keydown', onKeyDown);
    el.addEventListener('dragstart', onDragStart);

    return () => {
      el.removeEventListener('copy', onCopy);
      el.removeEventListener('cut', onCut);
      el.removeEventListener('contextmenu', onContextMenu);
      el.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('dragstart', onDragStart);
    };
  }, [ref]);
}

interface CourseViewerProps {
  course: Course;
  user: User | null;
  courseProgress: CourseProgress;
  purchasedCourseIds: Set<string>;
  onBack: () => void;
  onProgressChange: (courseId: string, progress: CourseProgress) => void;
  onOpenAuth: () => void;
}

const CourseViewer: React.FC<CourseViewerProps> = ({
  course,
  user,
  courseProgress,
  purchasedCourseIds,
  onBack,
  onProgressChange,
  onOpenAuth,
}) => {
  const lessons = course.lessons ?? [];
  const modules = course.modules ?? [];
  const hasModules = modules.length > 0;

  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Copy-protection ref
  const protectedRef = useRef<HTMLDivElement>(null);
  useContentProtection(protectedRef);

  // Lesson content (blocks loaded from API)
  const [lessonBlocks, setLessonBlocks] = useState<LessonBlock[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);

  // AI Quota
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [quotaLimit, setQuotaLimit] = useState<number | null>(course.llmLimit ?? null);

  // AI Helper State
  const [selection, setSelection] = useState('');
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [showAiTrigger, setShowAiTrigger] = useState(false);

  const currentLesson = lessons[currentLessonIndex];
  const isGuest = !user;
  const isCompleted = courseProgress?.lessons?.[currentLesson?.id]?.status === 'completed';

  const requestsRemaining = quotaLimit !== null ? Math.max(0, quotaLimit - quotaUsed) : 999;

  // Load lesson content from API
  const loadLessonContent = useCallback(async (lessonId: string) => {
    // Check if blocks are already inline in the lesson object
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson?.blocks && Array.isArray(lesson.blocks) && lesson.blocks.length > 0) {
      setLessonBlocks(lesson.blocks as LessonBlock[]);
      return;
    }

    // Check local cache first
    const cached = getCachedLessonContent(lessonId);
    if (cached?.blocks && Array.isArray(cached.blocks)) {
      setLessonBlocks(cached.blocks as LessonBlock[]);
      return;
    }

    // Fetch from API
    setBlocksLoading(true);
    try {
      const content = await fetchLessonContent(lessonId);
      if (content?.blocks && Array.isArray(content.blocks)) {
        setLessonBlocks(content.blocks as LessonBlock[]);
      } else {
        setLessonBlocks([]);
      }
    } catch (e) {
      console.error('Failed to load lesson content', e);
      setLessonBlocks([]);
    } finally {
      setBlocksLoading(false);
    }
  }, [lessons]);

  // Load quota
  useEffect(() => {
    if (!user || !course.id) return;
    fetchCourseQuota(course.id)
      .then(q => {
        setQuotaUsed(q.used);
        setQuotaLimit(q.limit);
      })
      .catch(() => {});
  }, [user, course.id]);

  // Load content when lesson changes
  useEffect(() => {
    if (!currentLesson) return;
    window.scrollTo(0, 0);
    setIsSidebarOpen(false);
    setShowAiHelper(false);
    setShowAiTrigger(false);
    setSelection('');
    loadLessonContent(currentLesson.id);

    // Track lesson view on server (touch)
    if (user) {
      patchCourseProgress(course.id, { op: 'touch_lesson', lessonId: currentLesson.id })
        .then(updated => onProgressChange(course.id, updated))
        .catch(() => {});
    }
  }, [currentLesson?.id]);

  // Handle Text Selection
  useEffect(() => {
    const handleSelection = () => {
      const text = window.getSelection()?.toString().trim();
      if (text && text.length > 0) {
        setSelection(text);
        setShowAiTrigger(true);
      } else {
        setTimeout(() => {
          if (!showAiHelper) {
            setShowAiTrigger(false);
          }
        }, 200);
      }
    };
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [showAiHelper]);

  const handleContextMenu = (e: React.MouseEvent) => {
    const text = window.getSelection()?.toString().trim();
    if (text && text.length > 0) {
      e.preventDefault();
      setSelection(text);
      setShowAiHelper(true);
    }
  };

  const handleNextAndComplete = async () => {
    // Mark current as complete
    if (!isCompleted && currentLesson) {
      if (!isGuest) {
        // Authenticated: save to server
        try {
          const updated = await patchCourseProgress(course.id, {
            op: 'lesson_status',
            lessonId: currentLesson.id,
            status: 'completed',
            completedAt: new Date().toISOString(),
          });
          onProgressChange(course.id, updated);
        } catch (e) {
          console.error('Failed to save progress', e);
        }
      } else {
        // Guest: save to localStorage
        setLocalLessonCompleted(course.id, currentLesson.id);
        onProgressChange(course.id, getLocalCourseProgress(course.id) as any);
      }
    }

    // Move to next
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(prev => prev + 1);
    } else {
      onBack();
    }
  };

  const handleRateLesson = async (rating: number) => {
    if (isGuest) return;
    try {
      await submitCourseFeedback(course.id, rating);
    } catch {
      // Fallback: save via progress patch
      try {
        await patchCourseProgress(course.id, {
          op: 'course_feedback',
          rating,
        });
      } catch {}
    }
  };

  const handleUseRequest = () => {
    setQuotaUsed(prev => prev + 1);
  };

  const renderBlock = (block: LessonBlock, index: number) => {
    switch (block.type) {
      case 'divider': return <Divider key={index} block={block} />;
      case 'list': return <List key={index} block={block} />;
      case 'tip': return <Tip key={index} block={block} />;
      case 'comparison': return <Comparison key={index} block={block} />;
      case 'practice_step':
        return (
          <PracticeStep
            key={index}
            block={block}
            isGuest={isGuest}
            onOpenAuth={onOpenAuth}
            onRequest={() => {
              if (!isGuest && requestsRemaining > 0) {
                handleUseRequest();
              }
            }}
            requestsRemaining={requestsRemaining}
          />
        );
      case 'reflection_task': return <ReflectionTask key={index} block={block} />;
      case 'interactive_table': return <InteractiveTable key={index} block={block} />;
      case 'feedback': return <Feedback key={index} block={block} onRate={handleRateLesson} />;
      default: return null;
    }
  };

  // Group lessons by module
  const renderSidebarLessons = () => {
    if (hasModules) {
      // Lessons with modules
      const moduleLessons = modules
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map(mod => ({
          module: mod,
          lessons: lessons.filter(l => l.moduleId === mod.id),
        }));

      // Lessons without a module
      const orphanLessons = lessons.filter(l => !l.moduleId);

      return (
        <>
          {orphanLessons.length > 0 && orphanLessons.map((lesson, idx) => renderLessonItem(lesson, lessons.indexOf(lesson)))}
          {moduleLessons.map(({ module: mod, lessons: modLessons }) => (
            <div key={mod.id} className="mt-4">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <FolderOpen size={12} />
                {mod.title}
              </div>
              {modLessons
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map(lesson => renderLessonItem(lesson, lessons.indexOf(lesson)))}
            </div>
          ))}
        </>
      );
    }

    // Flat list (no modules)
    return lessons.map((lesson, idx) => renderLessonItem(lesson, idx));
  };

  const renderLessonItem = (lesson: Lesson, idx: number) => {
    const isFinished = courseProgress?.lessons?.[lesson.id]?.status === 'completed';
    const isActive = idx === currentLessonIndex;
    return (
      <button
        key={lesson.id}
        onClick={() => { setCurrentLessonIndex(idx); setIsSidebarOpen(false); }}
        className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-all ${
          isActive
            ? 'bg-vibe-primary/20 text-indigo-300 border border-vibe-primary/50'
            : 'hover:bg-gray-800 text-gray-400'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-xs font-mono opacity-50 shrink-0">{(idx + 1).toString().padStart(2, '0')}</span>
          <span className="text-sm font-medium truncate">{lesson.title}</span>
        </div>
        {isFinished ? (
          <CheckCircle2 size={16} className="text-vibe-success shrink-0" />
        ) : (
          <Circle size={16} className="opacity-20 shrink-0" />
        )}
      </button>
    );
  };

  if (!currentLesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Уроки не найдены</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-vibe-dark relative">

      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden p-4 border-b border-gray-800 bg-vibe-card flex items-center justify-between sticky top-16 z-30">
        <span className="font-bold text-white">{currentLessonIndex + 1}. {currentLesson.title}</span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400">
          <Menu size={20} />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-vibe-card border-r border-gray-800 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:top-16 lg:h-[calc(100vh-4rem)]
        ${isSidebarOpen ? 'translate-x-0 top-0 h-full' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col p-4 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h2 className="text-xl font-bold text-white">Меню курса</h2>
            <button onClick={() => setIsSidebarOpen(false)}><Menu size={20} /></button>
          </div>

          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
            Назад к курсам
          </button>

          <div className="mb-6 shrink-0">
            <h2 className="text-xl font-bold text-white mb-1 leading-tight">{course.title}</h2>
            {isGuest && (
              <span className="inline-block px-2 py-0.5 mt-2 rounded text-[10px] font-bold bg-gray-700 text-gray-300 border border-gray-600">
                ГОСТЕВОЙ РЕЖИМ
              </span>
            )}
          </div>

          <div className="space-y-2 pb-8 flex-grow">
            {renderSidebarLessons()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full lg:pl-80 relative">
        <div
          className="max-w-4xl mx-auto p-4 md:p-8 lg:p-12 pb-32"
          onContextMenu={handleContextMenu}
        >
          {/* Lesson Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-vibe-accent font-mono text-sm uppercase tracking-wider">Урок {currentLessonIndex + 1}</span>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-2">{currentLesson.title}</h1>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                requestsRemaining === 0
                  ? 'bg-red-900/20 border-red-900/50 text-red-400'
                  : 'bg-indigo-900/20 border-indigo-500/30 text-indigo-300'
              }`}>
                <Zap size={14} className={requestsRemaining > 0 ? "fill-current" : ""} />
                <span className="text-xs font-bold font-mono">
                  {isGuest ? '0' : requestsRemaining}/{quotaLimit ?? '∞'}
                </span>
              </div>

              {currentLesson.duration && (
                <div className="text-gray-500 font-mono text-sm border border-gray-700 px-3 py-1 rounded-full whitespace-nowrap">
                  {currentLesson.duration}
                </div>
              )}
            </div>
          </div>

          {/* Lesson Blocks (copy-protected) */}
          <div
            ref={protectedRef}
            className="prose prose-invert max-w-none mb-12"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            {blocksLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-vibe-primary animate-spin" />
              </div>
            ) : lessonBlocks.length > 0 ? (
              lessonBlocks.map((block, index) => renderBlock(block, index))
            ) : (
              <div className="text-center py-16 text-gray-500">
                <p>Контент урока загружается...</p>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-800 gap-4">
            <button
              disabled={currentLessonIndex === 0}
              onClick={() => setCurrentLessonIndex(prev => prev - 1)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 self-start sm:self-auto ${
                currentLessonIndex === 0 ? 'opacity-0 cursor-default' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <ChevronLeft size={16} />
              Предыдущий урок
            </button>

            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
              <button
                onClick={handleNextAndComplete}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-r from-vibe-primary to-vibe-accent hover:shadow-indigo-500/25"
              >
                {currentLessonIndex === lessons.length - 1 ? (
                  <>
                    Завершить курс
                    <CheckCircle2 size={18} />
                  </>
                ) : (
                  <>
                    {isCompleted ? 'Далее' : 'Завершить и далее'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
              {isGuest && (
                <span className="text-[10px] text-gray-500 text-center sm:text-right w-full">
                  Гостевой режим: прогресс не сохраняется
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Floating AI Trigger */}
        {showAiTrigger && !showAiHelper && (
          <button
            onMouseDown={(e) => { e.preventDefault(); setShowAiHelper(true); }}
            className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-vibe-primary to-pink-500 text-white px-4 py-2.5 rounded-full font-bold shadow-xl shadow-pink-500/30 flex items-center gap-2 animate-bounce cursor-pointer hover:scale-105 transition-transform"
          >
            <Sparkles size={16} className="fill-white" />
            Спросить AI
          </button>
        )}

        {/* Global AI Button */}
        {!showAiTrigger && !showAiHelper && user && (
          <button
            onClick={() => setShowAiHelper(true)}
            className="fixed bottom-8 right-8 z-40 bg-gray-800 border border-gray-600 text-gray-300 p-3 rounded-full shadow-lg hover:bg-gray-700 hover:text-white transition-all"
            title="Vibecoder Assistant"
          >
            <Sparkles size={20} />
          </button>
        )}

        {/* AI Helper Widget */}
        <AiHelper
          isVisible={showAiHelper}
          onClose={() => setShowAiHelper(false)}
          selectedText={selection}
          lessonContext={JSON.stringify(lessonBlocks)}
          dailyHintsUsed={user?.dailyUsed ?? 0}
          isPro={user?.isSubscribed ?? false}
          onUseHint={() => {}}
        />
      </div>
    </div>
  );
};

export default CourseViewer;
