
import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Lightbulb, 
  Copy, 
  Check, 
  BrainCircuit, 
  XCircle, 
  CheckCircle, 
  Star,
  Terminal,
  Play,
  FileText,
  Lock,
  Code,
  Layout,
  Eye,
  Monitor,
  Edit3
} from 'lucide-react';
import { 
  DividerBlock, 
  ListBlock, 
  TipBlock, 
  ComparisonBlock, 
  PracticeStepBlock, 
  ReflectionTaskBlock, 
  InteractiveTableBlock, 
  FeedbackBlock 
} from '../types';

// Helper for Copy Button
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="absolute top-2 right-2 p-2 rounded-md bg-vibe-card hover:bg-white/10 transition-colors text-vibe-muted hover:text-white"
      title="Копировать промпт"
    >
      {copied ? <Check size={16} className="text-vibe-success" /> : <Copy size={16} />}
    </button>
  );
};

export const Divider: React.FC<{ block: DividerBlock }> = ({ block }) => (
  <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
);

export const List: React.FC<{ block: ListBlock }> = ({ block }) => (
  <div className="my-6 space-y-4">
    {block.content && <p className="text-gray-300 mb-2">{block.content}</p>}
    <ul className="space-y-2">
      {block.items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-vibe-accent shrink-0 mt-0.5" />
          <span className="text-gray-200">{item}</span>
        </li>
      ))}
    </ul>
    {block.prompt && (
      <div data-copyable className="mt-4 relative bg-gray-900/50 border border-gray-700 rounded-lg p-4 font-mono text-sm text-blue-200" style={{ userSelect: 'text' }}>
        <CopyButton text={block.prompt} />
        {block.prompt}
      </div>
    )}
  </div>
);

export const Tip: React.FC<{ block: TipBlock }> = ({ block }) => (
  <div className="my-6 p-4 rounded-lg bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 flex gap-4 items-start">
    <div className="bg-indigo-500/20 p-2 rounded-full shrink-0">
      <Lightbulb className="w-6 h-6 text-indigo-400" />
    </div>
    <div>
      <h4 className="font-semibold text-indigo-200 mb-1">Совет эксперта</h4>
      <p className="text-indigo-100/80 text-sm leading-relaxed">{block.content}</p>
    </div>
  </div>
);

export const Comparison: React.FC<{ block: ComparisonBlock }> = ({ block }) => (
  <div className="my-8">
    <h3 className="text-xl font-bold text-white mb-4 text-center">{block.title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2 text-red-400 font-semibold">
          <XCircle size={18} />
          {block.leftTitle}
        </div>
        <p className="text-gray-400 text-sm">{block.leftContent}</p>
      </div>
      <div className="bg-green-900/10 border border-green-900/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2 text-vibe-success font-semibold">
          <CheckCircle size={18} />
          {block.rightTitle}
        </div>
        <p className="text-gray-300 text-sm">{block.rightContent}</p>
      </div>
    </div>
  </div>
);

// --- INTERACTIVE TERMINAL COMPONENT ---

// Mock HTML for the website generator
const MOCK_GENERATED_WEBSITE = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Inter', sans-serif; }
    .hero-pattern { background-color: #fff7ed; background-image: radial-gradient(#fdba74 0.5px, transparent 0.5px); background-size: 10px 10px; }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
</head>
<body class="bg-white text-gray-900">
  <div class="min-h-screen flex flex-col">
    <nav class="flex justify-between items-center p-6 max-w-6xl mx-auto w-full">
      <div class="text-2xl font-black text-orange-600 tracking-tighter">VibeCoffee.</div>
      <div class="hidden md:flex gap-8 text-sm font-bold text-gray-500">
        <a href="#" class="hover:text-orange-600 transition">MENU</a>
        <a href="#" class="hover:text-orange-600 transition">LOCATIONS</a>
        <a href="#" class="hover:text-orange-600 transition">OUR STORY</a>
      </div>
      <button class="bg-gray-900 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-orange-600 transition">Order App</button>
    </nav>

    <main class="flex-grow">
      <section class="hero-pattern py-20 px-6">
        <div class="max-w-4xl mx-auto text-center">
          <span class="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6 inline-block">Brewed by AI</span>
          <h1 class="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-tight">
            Code needs <br/><span class="text-orange-500">Fuel.</span>
          </h1>
          <p class="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Experience the future of coffee. Optimized caffeine blends for developers, designers, and creators.
          </p>
          <div class="flex gap-4 justify-center">
            <button class="bg-orange-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-orange-700 hover:shadow-orange-500/30 transition transform hover:-translate-y-1">Get Caffeinated</button>
            <button class="bg-white text-gray-900 px-8 py-4 rounded-full font-bold shadow-md border border-gray-100 hover:border-gray-200 transition">View Menu</button>
          </div>
        </div>
      </section>

      <section class="py-20 px-6 max-w-6xl mx-auto">
         <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Card 1 -->
            <div class="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all duration-300">
               <div class="h-48 bg-orange-50 rounded-xl mb-6 relative overflow-hidden">
                  <div class="absolute inset-0 flex items-center justify-center text-4xl group-hover:scale-110 transition">☕️</div>
               </div>
               <h3 class="text-xl font-bold mb-2">Latte.js</h3>
               <p class="text-gray-500 text-sm mb-4">Smooth, creamy, and non-blocking. Perfect for asynchronous mornings.</p>
               <span class="text-orange-600 font-bold">$4.50</span>
            </div>
             <!-- Card 2 -->
            <div class="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all duration-300">
               <div class="h-48 bg-gray-50 rounded-xl mb-6 relative overflow-hidden">
                  <div class="absolute inset-0 flex items-center justify-center text-4xl group-hover:scale-110 transition">🌑</div>
               </div>
               <h3 class="text-xl font-bold mb-2">Dark Mode Roast</h3>
               <p class="text-gray-500 text-sm mb-4">Strong, bold, and easy on the eyes. For the late night commits.</p>
               <span class="text-orange-600 font-bold">$3.50</span>
            </div>
             <!-- Card 3 -->
            <div class="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all duration-300">
               <div class="h-48 bg-green-50 rounded-xl mb-6 relative overflow-hidden">
                   <div class="absolute inset-0 flex items-center justify-center text-4xl group-hover:scale-110 transition">🍵</div>
               </div>
               <h3 class="text-xl font-bold mb-2">Matcha Script</h3>
               <p class="text-gray-500 text-sm mb-4">Typed, strictly checked, and full of antioxidants. No runtime errors.</p>
               <span class="text-orange-600 font-bold">$5.00</span>
            </div>
         </div>
      </section>
    </main>
    <footer class="border-t border-gray-100 py-12 text-center text-gray-400 text-sm">
      &copy; 2025 VibeCoffee. Generated by Vibecoder AI.
    </footer>
  </div>
</body>
</html>
`;

interface PracticeStepProps {
  block: PracticeStepBlock;
  isGuest: boolean;
  onOpenAuth: () => void;
  onRequest: () => void;
  requestsRemaining: number;
}

export const PracticeStep: React.FC<PracticeStepProps> = ({ 
  block, 
  isGuest, 
  onOpenAuth,
  onRequest,
  requestsRemaining
}) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState(''); // Text output or Code output
  const [loading, setLoading] = useState(false);
  
  // New state for website generation mode
  const outputMode = block.outputMode || 'text';
  // 'prompt' is the initial state where user types. 'preview' is result.
  const [activeTab, setActiveTab] = useState<'prompt' | 'code' | 'preview'>('prompt'); 
  const [generatedHtml, setGeneratedHtml] = useState('');
  
  const handleRun = async () => {
    if (loading || !input.trim()) return;
    setLoading(true);
    onRequest();

    // Reset states
    setOutput('');
    setGeneratedHtml('');

    try {
      const { generateVibeCode } = await import('../services/geminiService');

      if (outputMode === 'website') {
        setActiveTab('preview');

        // Generate real HTML from Gemini
        const prompt = `${block.prompt}\n\nЗапрос пользователя: ${input}\n\nСгенерируй полный HTML-документ с inline CSS и JavaScript. Используй Tailwind CSS CDN. Верни ТОЛЬКО HTML-код, без пояснений.`;
        const result = await generateVibeCode(prompt);

        // Extract HTML from response (may be wrapped in markdown code block)
        let html = result;
        const htmlMatch = result.match(/```html\s*([\s\S]*?)```/);
        if (htmlMatch) html = htmlMatch[1].trim();

        // Stream-like display
        let currentIndex = 0;
        const interval = setInterval(() => {
          currentIndex += 25;
          setOutput(html.substring(0, currentIndex));
          if (currentIndex >= html.length) {
            clearInterval(interval);
            setLoading(false);
            setGeneratedHtml(html);
          }
        }, 10);

      } else {
        // Standard Text Mode — generate via Gemini
        const prompt = `${block.prompt}\n\nЗапрос пользователя: ${input}\n\nОтветь на русском языке.`;
        const result = await generateVibeCode(prompt);
        setOutput(result);
        setLoading(false);
      }
    } catch (err: any) {
      setOutput(`Ошибка: ${err?.message || 'Не удалось получить ответ от ИИ'}`);
      setLoading(false);
    }
  };

  return (
    <div className={`my-10 border border-gray-700 rounded-2xl overflow-hidden bg-[#0d1117] flex flex-col ${outputMode === 'website' ? 'h-[650px]' : 'min-h-[400px]'}`}>
      
      {/* Header Bar */}
      <div className="bg-gray-900 border-b border-gray-800 p-3 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-4">
            <div className="flex gap-1.5 ml-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>
            
            <div className="h-4 w-px bg-gray-800" />
            
            <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Terminal size={14} className="text-vibe-primary" />
                <span>AI Песочница</span>
                {outputMode === 'website' && (
                  <span className="text-xs bg-vibe-primary/20 text-vibe-primary px-2 py-0.5 rounded ml-2">Веб-генератор</span>
                )}
            </div>
         </div>

         {/* View Toggle for Website Mode */}
         {outputMode === 'website' && !loading && (
            <div className="flex bg-black/50 p-1 rounded-lg border border-gray-800">
               <button 
                  onClick={() => setActiveTab('prompt')}
                  className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-2 transition-all ${activeTab === 'prompt' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
               >
                  <Edit3 size={12} /> Промпт
               </button>
               {generatedHtml && (
                 <>
                   <button 
                      onClick={() => setActiveTab('code')}
                      className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-2 transition-all ${activeTab === 'code' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                   >
                      <Code size={12} /> Код
                   </button>
                   <button 
                      onClick={() => setActiveTab('preview')}
                      className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-2 transition-all ${activeTab === 'preview' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                   >
                      <Eye size={12} /> Просмотр
                   </button>
                 </>
               )}
            </div>
         )}
      </div>

      <div className="flex flex-1 overflow-hidden">
         {/* Left: Instructions (Collapsible/Scrollable on mobile) */}
         <div className="w-1/3 min-w-[250px] border-r border-gray-800 bg-vibe-card/20 flex flex-col overflow-y-auto hidden md:flex">
            <div className="p-6">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Задание</h4>
                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                   {block.content}
                </p>
                
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Шаблон промпта</h4>
                <div className="relative bg-black/40 border border-gray-800 rounded-lg p-3 font-mono text-xs text-green-300">
                   <CopyButton text={block.prompt} />
                   <div className="pr-6 whitespace-pre-wrap">{block.prompt}</div>
                </div>
            </div>
         </div>

         {/* Right: Interactive Area */}
         <div className="flex-1 relative flex flex-col bg-[#0d1117] overflow-hidden">
            {isGuest ? (
               // GUEST LOCK STATE
               <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6 bg-[#0d1117]/90 backdrop-blur-[1px]">
                  <div className="w-16 h-16 rounded-2xl bg-gray-800/50 border border-gray-700 flex items-center justify-center mb-4">
                     <Lock size={32} className="text-gray-600" />
                  </div>
                  <h3 className="text-xl font-mono text-gray-300 mb-2">Доступ ограничен</h3>
                  <p className="text-gray-500 text-sm mb-6 max-w-xs">
                     Интерактивная генерация доступна только зарегистрированным студентам.
                  </p>
                  <button 
                     onClick={onOpenAuth}
                     className="px-6 py-2 bg-vibe-primary hover:bg-indigo-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                  >
                     Войти в аккаунт
                  </button>
               </div>
            ) : (
               // ACTIVE STATE
               <>
                  <div className="flex-1 overflow-hidden relative">
                      {/* Website Mode Views */}
                      {outputMode === 'website' ? (
                          <>
                             {/* 1. Prompt Input View */}
                             <div className={`absolute inset-0 flex flex-col p-6 transition-all duration-300 ${activeTab === 'prompt' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                                 <label className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                    <Terminal size={16} />
                                    Ввод промпта
                                 </label>
                                 <div className="flex-1 relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-vibe-primary to-vibe-accent rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-500 blur"></div>
                                    <textarea 
                                      value={input}
                                      onChange={(e) => setInput(e.target.value)}
                                      placeholder="Опишите сайт, который нужно создать (например: 'Лендинг для кофейни с темной темой...')"
                                      className="relative w-full h-full bg-[#161b22] rounded-xl p-4 text-gray-200 font-mono text-sm resize-none focus:outline-none placeholder-gray-600"
                                    />
                                 </div>
                                 <p className="text-xs text-gray-500 mt-3 text-center">
                                    Нажмите "ЗАПУСТИТЬ" внизу, чтобы сгенерировать сайт
                                 </p>
                             </div>

                             {/* 2. Preview View (Iframe) */}
                             <div className={`absolute inset-0 bg-white w-full h-full transition-all duration-300 ${activeTab === 'preview' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                                {generatedHtml ? (
                                    <iframe 
                                      srcDoc={generatedHtml}
                                      title="Preview"
                                      className="w-full h-full border-none"
                                      sandbox="allow-scripts"
                                    />
                                ) : loading && activeTab === 'preview' ? (
                                    <div className="flex flex-col items-center justify-center h-full bg-[#0d1117] text-white">
                                       <div className="w-12 h-12 border-4 border-vibe-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                       <p className="text-sm font-mono text-vibe-primary animate-pulse">Генерация кода...</p>
                                       <div className="w-64 h-1 bg-gray-800 rounded-full mt-6 overflow-hidden">
                                          <div className="h-full bg-vibe-primary animate-[shimmer_1.5s_infinite] w-1/2"></div>
                                       </div>
                                    </div>
                                ) : (
                                   <div className="flex items-center justify-center h-full bg-[#0d1117] text-gray-600">
                                      <Monitor size={48} className="opacity-20" />
                                   </div>
                                )}
                             </div>

                             {/* 3. Code View */}
                             <div className={`absolute inset-0 bg-[#0d1117] overflow-y-auto p-4 transition-all duration-300 ${activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                                <pre className="text-indigo-300 whitespace-pre-wrap font-mono text-xs leading-relaxed" style={{ userSelect: 'text' }}>
                                   {output || generatedHtml || "// Здесь появится код..."}
                                </pre>
                             </div>
                          </>
                      ) : (
                          // Standard Text Mode (Chat style)
                          <div className="h-full flex flex-col">
                             <div className="flex-1 p-4 overflow-y-auto font-mono text-sm relative">
                                {!output && !loading && !input && (
                                   <div className="absolute top-4 left-4 text-gray-600 pointer-events-none">
                                      // Напишите ваш промпт здесь...
                                   </div>
                                )}
                                <textarea
                                   value={input}
                                   onChange={(e) => setInput(e.target.value)}
                                   placeholder=""
                                   className={`w-full bg-transparent text-gray-300 font-mono text-sm resize-none focus:outline-none placeholder-gray-700 ${output ? 'h-32 border-b border-gray-800 pb-4 mb-4' : 'h-full'}`}
                                />
                                {(output || loading) && (
                                   <div className="mt-4 animate-fade-in">
                                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                         <span className="text-green-500">➜</span>
                                         Ответ ИИ:
                                      </div>
                                      <pre className="text-indigo-300 whitespace-pre-wrap font-mono text-xs leading-relaxed" style={{ userSelect: 'text' }}>
                                        {output}
                                        {loading && <span className="inline-block w-2 h-4 bg-indigo-500 ml-1 animate-pulse"/>}
                                      </pre>
                                   </div>
                                )}
                             </div>
                          </div>
                      )}
                  </div>

                  {/* Input & Controls */}
                  <div className="p-3 border-t border-gray-800 bg-gray-900 flex justify-between items-center shrink-0 z-20">
                     <span className="text-xs text-gray-500 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${requestsRemaining > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        Осталось запросов: {requestsRemaining}
                     </span>
                     <button
                        onClick={handleRun}
                        disabled={loading || !input.trim() || requestsRemaining <= 0}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                           loading || !input.trim() || requestsRemaining <= 0
                              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/20'
                        }`}
                     >
                        {loading ? 'Генерация...' : (
                           <>
                              <Play size={12} className="fill-current" />
                              ЗАПУСТИТЬ
                           </>
                        )}
                     </button>
                  </div>
               </>
            )}
         </div>
      </div>
    </div>
  );
};

export const ReflectionTask: React.FC<{ block: ReflectionTaskBlock }> = ({ block }) => (
  <div className="my-6 p-6 rounded-lg bg-slate-800 border-l-4 border-vibe-primary shadow-lg">
    <div className="flex items-center gap-2 mb-3 text-vibe-primary">
      <BrainCircuit size={24} />
      <h3 className="text-lg font-bold">{block.title}</h3>
    </div>
    <p className="text-gray-300 italic">"{block.content}"</p>
  </div>
);

export const InteractiveTable: React.FC<{ block: InteractiveTableBlock }> = ({ block }) => (
  <div className="my-8 overflow-hidden rounded-lg border border-gray-700">
    <div className="bg-gray-800 p-4 border-b border-gray-700">
      <h3 className="font-bold text-white">{block.title}</h3>
      <p className="text-sm text-gray-400">{block.description}</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-400">
        <thead className="bg-gray-900 text-gray-200 uppercase font-medium">
          <tr>
            <th className="px-4 py-3">Элемент</th>
            <th className="px-4 py-3">Вопросы</th>
            <th className="px-4 py-3">Пример</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {block.rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
              <td className="px-4 py-3 font-medium text-indigo-300">{row.element}</td>
              <td className="px-4 py-3">{row.questions}</td>
              <td className="px-4 py-3 text-gray-300 italic">{row.example}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const Feedback: React.FC<{ 
  block: FeedbackBlock, 
  onRate: (rating: number) => void 
}> = ({ 
  block, 
  onRate 
}) => {
  const [rating, setRating] = useState(0);

  const handleRate = (r: number) => {
    setRating(r);
    onRate(r);
  };

  return (
    <div className="my-10 text-center p-6 border border-gray-800 rounded-2xl bg-gray-900/50">
      <h4 className="text-lg font-medium text-white mb-4">Насколько полезен был урок?</h4>
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            className={`transition-all transform hover:scale-110 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
          >
            <Star size={32} />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <p className="text-vibe-success animate-pulse">Спасибо за оценку!</p>
      )}
    </div>
  );
};
