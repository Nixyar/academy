import React, { useState } from 'react';
import { Course, Lesson, LessonType } from '../types';
import { ImageAnalyzer } from './ImageAnalyzer';
import { ImageEditor } from './ImageEditor';
import { Play, FileText, CheckCircle, Lock, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface CourseViewerProps {
  course: Course;
  onBack: () => void;
  isSubscribed: boolean;
}

export const CourseViewer: React.FC<CourseViewerProps> = ({ course, onBack, isSubscribed }) => {
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const activeLesson = course.lessons[activeLessonIndex];
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock function to render video placeholder
  const renderVideo = (url?: string) => (
    <div className="aspect-video bg-black rounded-xl mb-6 flex items-center justify-center relative overflow-hidden group border border-white/10 shadow-2xl">
      {url ? (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 to-void flex flex-col items-center justify-center text-slate-400">
               <div className="w-20 h-20 rounded-full bg-vibe-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 fill-vibe-500 text-vibe-500" />
               </div>
               <span className="font-display font-bold text-lg">Видео: {activeLesson.title}</span>
          </div>
      ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500">
            Видео недоступно
          </div>
      )}
    </div>
  );

  // Render the Right Side Content based on Lesson Type
  const renderRightPanel = () => {
    switch (activeLesson.type) {
      case LessonType.INTERACTIVE_ANALYSIS:
        return <ImageAnalyzer />;
      case LessonType.INTERACTIVE_EDIT:
        return <ImageEditor />;
      case LessonType.VIDEO_TEXT:
      default:
        // Default interactive playground for text-based lessons
        return (
          <div className="flex flex-col h-full bg-[#050914] border-l border-white/5">
             <div className="flex-1 p-6 border-b border-white/5 flex flex-col items-center justify-center text-slate-600">
                <FileText className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-mono text-sm">Waiting for input...</p>
                <p className="text-xs mt-2 opacity-50">В этом уроке нет интерактивного задания AI.</p>
             </div>
             <div className="h-1/3 p-4 bg-[#02050e]">
                <div className="flex gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                </div>
                <textarea 
                    disabled 
                    className="w-full h-full bg-transparent text-slate-500 text-sm resize-none font-mono focus:outline-none"
                    placeholder="// Console ready..."
                />
             </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-void text-white overflow-hidden font-sans">
        {/* Header */}
        <header className="h-16 border-b border-white/5 bg-[#050914] flex items-center justify-between px-4 shrink-0 z-30">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack} 
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider hover:bg-white/5 px-3 py-1.5 rounded-lg"
                >
                    <ChevronLeft className="w-4 h-4" /> Назад
                </button>
                <div className="h-6 w-px bg-white/10 mx-2 hidden md:block"></div>
                <h1 className="font-bold text-lg hidden md:block font-display tracking-tight text-slate-200">{course.title}</h1>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-xs text-vibe-400 font-mono px-3 py-1 bg-vibe-500/10 border border-vibe-500/20 rounded-full">
                    Lesson {activeLessonIndex + 1} / {course.lessons.length}
                </span>
                <button 
                    className="md:hidden text-slate-300"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? <X /> : <Menu />}
                </button>
            </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
            {/* Sidebar (Lesson List) */}
            <aside className={`
                absolute md:relative z-20 w-72 bg-[#02050e] border-r border-white/5 h-full transition-transform duration-300 flex flex-col
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-5 border-b border-white/5">
                    <h2 className="font-bold font-display text-slate-300 uppercase text-xs tracking-widest">Syllabus</h2>
                </div>
                <div className="overflow-y-auto h-full pb-20 custom-scrollbar">
                    {course.lessons.map((lesson, idx) => (
                        <button
                            key={lesson.id}
                            onClick={() => {
                                setActiveLessonIndex(idx);
                                setSidebarOpen(false);
                            }}
                            className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-all flex items-start gap-3 group
                                ${activeLessonIndex === idx ? 'bg-white/5 border-l-2 border-l-vibe-500' : 'border-l-2 border-l-transparent'}
                            `}
                        >
                            <div className={`mt-0.5 w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors
                                ${activeLessonIndex === idx ? 'bg-vibe-500 text-white shadow-lg shadow-vibe-500/20' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}
                            `}>
                                {idx + 1}
                            </div>
                            <div>
                                <h4 className={`text-sm font-medium mb-1 transition-colors ${activeLessonIndex === idx ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                    {lesson.title}
                                </h4>
                                <span className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">
                                    {lesson.type === LessonType.VIDEO_TEXT ? 'Lecture' : 'Workshop'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                
                {/* Left Side: Description & Video */}
                <div className="w-full md:w-1/2 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-void">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-8">
                             <span className="text-vibe-400 text-xs font-bold uppercase tracking-widest mb-2 block">Current Module</span>
                             <h2 className="text-3xl md:text-4xl font-bold text-white font-display">{activeLesson.title}</h2>
                        </div>
                        
                        {renderVideo(activeLesson.videoUrl)}

                        <div className="prose prose-invert prose-lg prose-headings:font-display prose-p:text-slate-400 prose-strong:text-white max-w-none">
                            <p className="whitespace-pre-line leading-relaxed">
                                {activeLesson.description}
                            </p>
                        </div>
                        
                        <div className="mt-12 flex justify-between items-center pt-8 border-t border-white/10">
                            <button 
                                disabled={activeLessonIndex === 0}
                                onClick={() => setActiveLessonIndex(prev => prev - 1)}
                                className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 disabled:opacity-30 hover:bg-white/5 transition-colors font-bold text-sm"
                            >
                                Предыдущий
                            </button>
                            <button 
                                disabled={activeLessonIndex === course.lessons.length - 1}
                                onClick={() => setActiveLessonIndex(prev => prev + 1)}
                                className="px-6 py-2.5 rounded-xl bg-vibe-600 text-white font-bold hover:bg-vibe-500 transition-colors shadow-lg shadow-vibe-900/20 disabled:opacity-50 text-sm flex items-center gap-2"
                            >
                                Следующий <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side: Interactive Window */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full border-t md:border-t-0 md:border-l border-white/5 bg-[#050914] z-10 shadow-2xl relative">
                    {/* IDE Header Decoration */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-vibe-500/50 to-transparent"></div>
                    {renderRightPanel()}
                </div>

            </main>
        </div>
    </div>
  );
};