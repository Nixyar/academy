import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { 
  Code2, 
  Play, 
  CheckCircle, 
  Terminal, 
  Sparkles, 
  Cpu, 
  Zap, 
  Layout, 
  Menu, 
  X,
  CreditCard,
  User as UserIcon,
  MessageSquare,
  ArrowRight,
  Send,
  RefreshCw,
  Maximize2,
  Bot
} from 'lucide-react';
import { Course, Lesson, ChatMessage } from './types';
import { geminiService } from './services/geminiService';

// --- Mock Data (Translated & Rebranded) ---
const COURSES: Course[] = [
  {
    id: 'web-basics',
    title: 'HTML5 и Структура',
    description: 'Освой скелет веба. Изучи семантический HTML и доступность.',
    level: 'Новичок',
    tech: 'HTML',
    image: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?q=80&w=1632&auto=format&fit=crop',
    color: 'from-orange-400 to-red-500',
    lessons: [
      {
        id: 'l1',
        title: 'Твой первый тег',
        content: 'HTML-элементы — это нейроны веба. Узнай, как использовать теги для создания структуры.',
        initialCode: '<!-- VibeCoderAI Editor v1.0 -->\n<!-- Напиши свой код здесь -->\n<h1 class="title">Привет, VibeCoderAI</h1>\n<p>Я готов кодить с AI!</p>\n\n<style>\n  .title { color: white; font-family: sans-serif; }\n</style>',
        challenge: 'Добавь элемент button (кнопку) под параграфом с текстом «Запустить AI».'
      },
      {
        id: 'l2',
        title: 'Списки и ссылки',
        content: 'Узнай, как связывать узлы сети и создавать списки с помощью тегов <ul>, <ol> и <a>.',
        initialCode: '<h3>Мой Тех-Стек</h3>\n<ul>\n  <li>HTML5</li>\n  <li>VibeCoder</li>\n  <li>React</li>\n</ul>',
        challenge: 'Преврати маркированный список (ul) в нумерованный (ol) и добавь ссылку на документацию.'
      }
    ]
  },
  {
    id: 'css-styling',
    title: 'CSS Стили и Неон',
    description: 'Визуализируй код. Изучи Flexbox, Grid и эффекты свечения.',
    level: 'Средний',
    tech: 'CSS',
    image: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?q=80&w=1470&auto=format&fit=crop',
    color: 'from-blue-400 to-cyan-500',
    lessons: [
      {
        id: 'c1',
        title: 'Флексбокс Матрица',
        content: 'Flexbox — это система управления пространством.',
        initialCode: '<div class="container">\n  <div class="box">AI</div>\n  <div class="box">WEB</div>\n  <div class="box">VIBE</div>\n</div>\n\n<style>\n  .container {\n    display: flex;\n    gap: 10px;\n    background: #0f172a;\n    padding: 20px;\n    border: 1px solid #334155;\n  }\n  .box {\n    background: #8b5cf6;\n    width: 60px;\n    height: 60px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    color: white;\n    font-family: monospace;\n    font-weight: bold;\n    box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);\n  }\n</style>',
        challenge: 'Измени flex-direction на "column" или justify-content на "space-around".'
      }
    ]
  },
  {
    id: 'js-logic',
    title: 'JavaScript Логика',
    description: 'Программируй поведение. Интерактивность, DOM и нейросети (почти).',
    level: 'Продвинутый',
    tech: 'JS',
    image: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?q=80&w=1470&auto=format&fit=crop',
    color: 'from-yellow-400 to-amber-500',
    lessons: [
      {
        id: 'j1',
        title: 'Синтаксис и События',
        content: 'JavaScript — это язык, на котором говорит веб.',
        initialCode: '<button id="btn" style="padding: 10px 20px; font-size: 16px; background: #ec4899; color: white; border: none; cursor: pointer;">Инициализировать</button>\n<p id="msg" style="margin-top: 15px; font-family: monospace; color: #ec4899;"></p>\n\n<script>\n  const btn = document.getElementById("btn");\n  const msg = document.getElementById("msg");\n  \n  btn.addEventListener("click", () => {\n    msg.innerText = "> Система VibeCoderAI в норме...";\n  });\n</script>',
        challenge: 'Измени сообщение в параграфе на что-то другое при клике на кнопку.'
      }
    ]
  }
];

// --- Shared Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = window.location.hash; // Simple hash check for active state

  const isActive = (path: string) => location.includes(path) || (location === '#/' && path === '/');

  return (
    <nav className="fixed w-full z-50 bg-brand-dark/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                <Code2 className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                VibeCoder<span className="text-brand-primary">AI</span>
              </span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/') ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>Главная</Link>
              <Link to="/courses" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('courses') ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>Курсы</Link>
              <Link to="/pricing" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('pricing') ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>Тарифы</Link>
              <Link to="/profile" className="p-2 rounded-full bg-brand-surface hover:bg-brand-primary/20 transition-colors border border-white/5">
                <UserIcon className="w-5 h-5 text-gray-300" />
              </Link>
            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-brand-surface border-b border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10">Главная</Link>
            <Link to="/courses" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/10">Курсы</Link>
            <Link to="/pricing" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/10">Тарифы</Link>
            <Link to="/profile" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/10">Профиль</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-brand-dark border-t border-white/5 py-12 mt-auto">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
         <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
            <Code2 className="text-white w-3 h-3" />
         </div>
         <span className="font-bold text-white">VibeCoderAI</span>
      </div>
      <p className="text-gray-500 mb-4">© 2024 VibeCoderAI. Будущее кода здесь.</p>
      <div className="flex justify-center space-x-6 text-gray-400">
        <span className="hover:text-brand-primary cursor-pointer transition-colors">AI Политика</span>
        <span className="hover:text-brand-primary cursor-pointer transition-colors">Условия</span>
        <span className="hover:text-brand-primary cursor-pointer transition-colors">Сообщество</span>
      </div>
    </div>
  </footer>
);

// --- Page Components ---

const Hero = () => (
  <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
    {/* Background Effects */}
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-[128px] animate-blob"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-secondary/20 rounded-full blur-[128px] animate-blob animation-delay-2000"></div>
    </div>

    <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
      <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-sm font-semibold tracking-wide animate-fade-in flex items-center gap-2 w-fit mx-auto">
        <Sparkles className="w-4 h-4" /> POWERED BY VIBECODER AI
      </div>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 animate-fade-in">
        Учись Кодить.<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
          Создавай с AI.
        </span>
      </h1>
      <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
        Платформа нового поколения, где ты пишешь код в паре с VibeCoder AI.
        Интерактивные песочницы, умный фидбек и никаких скучных лекций.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <Link to="/courses" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold text-lg hover:shadow-lg hover:shadow-brand-primary/25 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
          Перейти к обучению <ArrowRight className="w-5 h-5" />
        </Link>
        <Link to="/pricing" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-surface border border-white/10 text-white font-bold text-lg hover:bg-white/5 transition-all flex items-center justify-center">
          VibeCoder Pro
        </Link>
      </div>
    </div>
  </div>
);

const MissionSection = () => (
  <section className="py-24 bg-brand-surface/50 relative">
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-6 text-white">Технология VibeCoder</h2>
          <p className="text-gray-400 text-lg mb-6 leading-relaxed">
            Мы не просто учим синтаксису. Мы интегрируем AI в процесс обучения. 
            VibeCoderAI анализирует твой стиль, помогает с ошибками в реальном времени и делает обучение похожим на игру в киберпространстве.
          </p>
          <ul className="space-y-4">
            {[
              "Нейросетевой анализ кода",
              "Адаптивная сложность",
              "Кибер-челленджи",
              "Персональный AI-компаньон"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-300">
                <CheckCircle className="text-brand-primary w-5 h-5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4 mt-8">
            <div className="bg-brand-dark p-6 rounded-2xl border border-white/5 hover:border-brand-primary/50 transition-colors group">
              <Zap className="w-8 h-8 text-yellow-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white">Турбо Режим</h3>
              <p className="text-sm text-gray-400">Спринты по 5 мин.</p>
            </div>
            <div className="bg-brand-dark p-6 rounded-2xl border border-white/5 hover:border-brand-primary/50 transition-colors group">
              <Bot className="w-8 h-8 text-brand-secondary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white">VibeCoder AI</h3>
              <p className="text-sm text-gray-400">Твой второй пилот.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-brand-dark p-6 rounded-2xl border border-white/5 hover:border-brand-primary/50 transition-colors group">
              <Terminal className="w-8 h-8 text-brand-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white">Live Editor</h3>
              <p className="text-sm text-gray-400">Кодь в браузере.</p>
            </div>
            <div className="bg-brand-dark p-6 rounded-2xl border border-white/5 hover:border-brand-primary/50 transition-colors group">
              <Layout className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white">Рендер</h3>
              <p className="text-sm text-gray-400">Мгновенный результат.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const CourseCard: React.FC<{ course: Course }> = ({ course }) => (
  <Link to={`/courses/${course.id}`} className="block group">
    <div className="bg-brand-surface rounded-2xl overflow-hidden border border-white/5 hover:border-brand-primary/50 transition-all hover:transform hover:scale-[1.02] shadow-xl">
      <div className="h-48 overflow-hidden relative">
        <div className={`absolute inset-0 bg-gradient-to-t from-brand-surface to-transparent opacity-60 z-10`}></div>
        <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute bottom-4 left-4 z-20">
          <span className={`px-2 py-1 rounded-md text-xs font-bold bg-gradient-to-r ${course.color} text-white uppercase tracking-wider`}>
            {course.tech}
          </span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-brand-primary font-medium">{course.level}</span>
          <span className="text-gray-500">{course.lessons.length} Модулей</span>
        </div>
      </div>
    </div>
  </Link>
);

const CoursesPage = () => (
  <div className="pt-24 pb-12 min-h-screen">
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">Матрица курсов</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Выбери свой путь развития. От основ до нейросетевых интеграций.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {COURSES.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  </div>
);

// --- Sandbox & Lesson Logic ---

const Sandbox = ({ initialCode }: { initialCode: string }) => {
  const [code, setCode] = useState(initialCode);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    updatePreview();
  }, [code]);

  useEffect(() => {
    // Reset state when lesson changes
    setCode(initialCode);
    setMessages([]);
  }, [initialCode]);

  const updatePreview = () => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  };

  const handleAiChat = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const helpText = await geminiService.getCodeHelp(code, input);
    
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'model', text: helpText }]);
  };

  const handleAiReview = async () => {
    setIsTyping(true);
    setChatOpen(true);
    const review = await geminiService.reviewCode(code);
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'model', text: review }]);
  };

  return (
    <div className="flex flex-col h-full bg-black/20 rounded-xl overflow-hidden border border-white/10">
      {/* Toolbar */}
      <div className="bg-brand-surface p-2 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 ml-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-xs text-gray-400 font-mono ml-4">main.vibe</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleAiReview}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-bold rounded-md transition-colors"
          >
            <Bot className="w-3.5 h-3.5" /> AI Скан
          </button>
          <button 
            onClick={updatePreview}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Компиляция
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-[500px]">
        {/* Editor */}
        <div className="flex-1 relative border-r border-white/5 bg-[#0f172a]">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full bg-transparent text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none"
            spellCheck="false"
          />
        </div>

        {/* Preview */}
        <div className="flex-1 bg-white relative">
          <iframe 
            ref={iframeRef} 
            title="preview"
            className="w-full h-full"
            sandbox="allow-scripts"
          />
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-[10px] rounded uppercase font-bold tracking-wider pointer-events-none">
            Превью
          </div>
        </div>
      </div>

      {/* AI Chat Overlay */}
      <div className={`fixed bottom-8 right-8 w-80 md:w-96 bg-brand-surface border border-brand-primary/30 rounded-2xl shadow-2xl transition-all duration-300 transform ${chatOpen ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-brand-primary/10 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-brand-primary" />
            <span className="font-bold text-white text-sm">VibeCoder Чат</span>
          </div>
          <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="h-64 overflow-y-auto p-4 space-y-3 bg-brand-dark/50">
          {messages.length === 0 && (
            <p className="text-xs text-gray-500 text-center mt-8">Я VibeCoder. Спрашивай.</p>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-xl text-xs ${msg.role === 'user' ? 'bg-brand-primary text-white rounded-br-none' : 'bg-brand-surface border border-white/10 text-gray-200 rounded-bl-none'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && <div className="text-xs text-gray-500 animate-pulse ml-2">VibeCoder генерирует ответ...</div>}
        </div>
        <div className="p-3 border-t border-white/10 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAiChat()}
            placeholder="Запрос к AI..."
            className="flex-1 bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
          />
          <button onClick={handleAiChat} className="p-2 bg-brand-primary rounded-lg hover:bg-brand-primary/80 transition-colors">
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Chat Toggle Button */}
      {!chatOpen && (
        <button 
          onClick={() => setChatOpen(true)}
          className="fixed bottom-8 right-8 p-4 bg-brand-primary rounded-full shadow-lg shadow-brand-primary/40 hover:scale-110 transition-transform z-40"
        >
          <Bot className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
};

const LessonPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  
  const course = COURSES.find(c => c.id === courseId);
  const activeLesson = course?.lessons[activeLessonIndex];

  if (!course || !activeLesson) return <div className="text-white pt-24 text-center">Данные не найдены в базе VibeCoder.</div>;

  return (
    <div className="pt-16 min-h-screen bg-brand-dark flex flex-col">
      {/* Course Header */}
      <div className={`h-16 border-b border-white/10 flex items-center px-6 justify-between bg-gradient-to-r ${course.color} bg-opacity-10`}>
        <div className="flex items-center gap-4">
          <Link to="/courses" className="text-gray-300 hover:text-white"><ArrowRight className="w-5 h-5 rotate-180" /></Link>
          <h1 className="text-white font-bold">{course.title}</h1>
          <span className="text-xs px-2 py-0.5 rounded bg-black/20 text-white/80">{activeLesson.title}</span>
        </div>
        <div className="text-xs text-white/70">
          Уровень {activeLessonIndex + 1} / {course.lessons.length}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-64px)]">
        {/* Left Panel: Content & Video */}
        <div className="lg:w-1/3 bg-brand-surface border-r border-white/10 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">
            {/* Video Placeholder */}
            <div className="aspect-video bg-black/40 rounded-xl flex items-center justify-center border border-white/5 relative group cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-brand-primary/10 group-hover:bg-brand-primary/20 transition-colors"></div>
              <Play className="w-12 h-12 text-white fill-current opacity-80 group-hover:scale-110 transition-transform" />
              <div className="absolute bottom-2 right-2 text-xs bg-black/60 px-2 py-1 rounded text-white">05:24</div>
            </div>

            <div className="prose prose-invert prose-sm">
              <h2 className="text-xl font-bold text-white mb-2">{activeLesson.title}</h2>
              <p className="text-gray-400">{activeLesson.content}</p>
            </div>

            <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4">
              <h3 className="font-bold text-brand-primary flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4" /> Миссия
              </h3>
              <p className="text-sm text-gray-300">{activeLesson.challenge}</p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t border-white/5">
              <button 
                onClick={() => setActiveLessonIndex(Math.max(0, activeLessonIndex - 1))}
                disabled={activeLessonIndex === 0}
                className="px-4 py-2 text-sm rounded-lg border border-white/10 text-gray-400 disabled:opacity-50 hover:bg-white/5"
              >
                Назад
              </button>
              <button 
                onClick={() => setActiveLessonIndex(Math.min(course.lessons.length - 1, activeLessonIndex + 1))}
                disabled={activeLessonIndex === course.lessons.length - 1}
                className="px-4 py-2 text-sm rounded-lg bg-brand-primary text-white disabled:opacity-50 hover:bg-brand-primary/80"
              >
                Далее
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Sandbox */}
        <div className="lg:w-2/3 p-4 bg-[#0f172a] overflow-hidden">
          <Sandbox initialCode={activeLesson.initialCode} />
        </div>
      </div>
    </div>
  );
};

const PricingPage = () => (
  <div className="pt-32 pb-20 min-h-screen">
    <div className="max-w-3xl mx-auto px-4 text-center">
      <h2 className="text-4xl font-bold text-white mb-6">Инвестируй в VibeCoderAI</h2>
      <p className="text-gray-400 mb-12">Полный доступ к нейросети, курсам и pro-функциям.</p>

      <div className="relative bg-brand-surface rounded-3xl p-8 border border-brand-primary/30 shadow-2xl shadow-brand-primary/20 overflow-hidden">
        <div className="absolute top-0 right-0 bg-brand-secondary text-white text-xs font-bold px-3 py-1 rounded-bl-xl uppercase">
          Популярный
        </div>
        
        <div className="mb-8">
          <span className="text-5xl font-bold text-white">1499₽</span>
          <span className="text-gray-400">/месяц</span>
        </div>

        <ul className="text-left space-y-4 mb-8 max-w-xs mx-auto">
          <li className="flex items-center gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-brand-primary" /> Безлимит к VibeCoder AI</li>
          <li className="flex items-center gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-brand-primary" /> Все продвинутые курсы</li>
          <li className="flex items-center gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-brand-primary" /> Генератор портфолио</li>
          <li className="flex items-center gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-brand-primary" /> Сертификат VibeCoder Pro</li>
        </ul>

        <button className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold text-lg hover:shadow-lg hover:shadow-brand-primary/25 transition-transform transform hover:scale-[1.02]">
          Попробовать AI бесплатно
        </button>
        <p className="mt-4 text-xs text-gray-500">Отмена в любой момент. Безопасная оплата.</p>
      </div>

      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {[
          { label: "UI Киты", price: "499₽" },
          { label: "React + AI Курс", price: "999₽" },
          { label: "Ревью Профиля", price: "2499₽" },
          { label: "Менторство", price: "4999₽" }
        ].map((addon, i) => (
          <div key={i} className="bg-brand-surface border border-white/5 rounded-xl p-4 hover:border-white/20 transition-colors">
            <h4 className="font-bold text-white">{addon.label}</h4>
            <p className="text-brand-primary text-sm mt-1">{addon.price}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ProfilePage = () => {
  // Mock User Data
  const user = {
    name: "Alex Coder",
    email: "alex@vibecoder.ai",
    isPro: true,
    streak: 12,
    xp: 4500
  };

  return (
    <div className="pt-24 pb-12 min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-brand-surface rounded-2xl p-8 border border-white/5 mb-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-3xl font-bold text-white shadow-xl relative overflow-hidden">
             <div className="absolute inset-0 bg-black/20 z-0"></div>
             <span className="relative z-10">AC</span>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">{user.name} <span className="text-xs bg-brand-primary px-2 py-0.5 rounded ml-2 align-middle">AI PRO</span></h2>
            <p className="text-gray-400 mb-4">{user.email}</p>
            <div className="flex justify-center md:justify-start gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{user.streak} 🔥</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">AI Стрик</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{user.xp}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Vibe очки</div>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-6">Синхронизация прогресса</h3>
        <div className="space-y-4">
          {COURSES.map(course => (
            <div key={course.id} className="bg-brand-surface border border-white/5 p-4 rounded-xl flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${course.color} flex items-center justify-center text-white font-bold`}>
                {course.tech}
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium">{course.title}</h4>
                <div className="w-full bg-brand-dark h-2 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${course.color}`} style={{ width: '45%' }}></div>
                </div>
              </div>
              <span className="text-white font-bold">45%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

const Home = () => (
  <>
    <Hero />
    <MissionSection />
  </>
);

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      {children}
    </main>
    <Footer />
  </div>
);

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/courses" element={<MainLayout><CoursesPage /></MainLayout>} />
        <Route path="/courses/:courseId" element={<LessonPage />} /> {/* No layout for immersive feel */}
        <Route path="/pricing" element={<MainLayout><PricingPage /></MainLayout>} />
        <Route path="/profile" element={<MainLayout><ProfilePage /></MainLayout>} />
      </Routes>
    </HashRouter>
  );
};

export default App;