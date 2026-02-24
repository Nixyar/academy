
import React, { useState, useEffect } from 'react';
import { PromptExample } from '../types';
import { Search, Hash, Code, PenTool, BarChart3, Copy, Check } from 'lucide-react';

/* ─── Cascading fade-in animation ─── */
const useCascadeReveal = (itemCount: number, baseDelay = 80) => {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    // Small raf delay so the component mounts first, then triggers CSS transitions
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const style = (index: number): React.CSSProperties => ({
    opacity: revealed ? 1 : 0,
    transform: revealed ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity 0.45s cubic-bezier(0.22,1,0.36,1) ${index * baseDelay}ms, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${index * baseDelay}ms`,
  });
  return style;
};

interface PromptLibraryProps {
  prompts: PromptExample[];
}

const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
  switch (category) {
    case 'Код': return <Code size={18} className="text-blue-400" />;
    case 'Творчество': return <Hash size={18} className="text-pink-400" />;
    case 'Анализ данных': return <BarChart3 size={18} className="text-green-400" />;
    case 'Генерация текста': return <PenTool size={18} className="text-yellow-400" />;
    default: return <Hash size={18} className="text-gray-400" />;
  }
};

const PromptCard: React.FC<{ prompt: PromptExample }> = ({ prompt }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-vibe-card border border-gray-800 rounded-xl p-6 hover:border-vibe-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-900/10 group flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900 border border-gray-700 text-xs font-medium text-gray-300">
          <CategoryIcon category={prompt.category} />
          {prompt.category}
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-white mb-2">{prompt.title}</h3>
      <p className="text-gray-400 text-sm mb-6 flex-grow">{prompt.description}</p>
      
      <div className="relative bg-black/30 rounded-lg p-4 font-mono text-sm text-indigo-200 border border-gray-800 group-hover:border-gray-600 transition-colors">
        <button 
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors z-10"
        >
          {copied ? <Check size={14} className="text-vibe-success" /> : <Copy size={14} />}
        </button>
        {/* Fixed height with scroll to prevent layout jumping */}
        <div className="h-32 overflow-y-auto custom-scrollbar pr-2 leading-relaxed">
          {prompt.prompt}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 italic">
          <span className="font-semibold text-gray-400">Почему это работает:</span> {prompt.explanation}
        </p>
      </div>
    </div>
  );
};

const PromptLibrary: React.FC<PromptLibraryProps> = ({ prompts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');

  const categories = ['Все', 'Генерация текста', 'Код', 'Анализ данных', 'Творчество'];

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Все' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // header=0, search bar=1, cards start at 2
  const cascade = useCascadeReveal(filteredPrompts.length + 2);

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-12" style={cascade(0)}>
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-vibe-primary via-vibe-accent to-pink-500 mb-4">
          Библиотека Промптов
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Коллекция проверенных шаблонов для общения с ИИ. Копируйте, адаптируйте и ускоряйте свою работу.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center" style={cascade(1)}>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Поиск промптов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-vibe-card border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-vibe-primary focus:ring-1 focus:ring-vibe-primary transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-vibe-primary text-white shadow-lg shadow-indigo-900/50'
                  : 'bg-vibe-card text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrompts.map((prompt, i) => (
          <div key={prompt.id} className="h-full" style={cascade(i + 2)}>
            <PromptCard prompt={prompt} />
          </div>
        ))}
      </div>

      {filteredPrompts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Промпты не найдены 😔</p>
          <button
            onClick={() => {setSearchTerm(''); setSelectedCategory('Все')}}
            className="text-vibe-primary hover:underline mt-2"
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
};

export default PromptLibrary;
