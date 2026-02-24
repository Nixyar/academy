
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';

interface AiHelperProps {
  isVisible: boolean;
  selectedText: string;
  lessonContext: string;
  onClose: () => void;
  dailyHintsUsed: number;
  isPro: boolean;
  onUseHint: () => void;
}

const AiHelper: React.FC<AiHelperProps> = ({ 
  isVisible, 
  selectedText, 
  lessonContext,
  onClose,
  dailyHintsUsed,
  isPro,
  onUseHint
}) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible && inputRef.current) {
        inputRef.current.focus();
    }
    // Reset state on open
    if (isVisible) {
        setResponse('');
        setQuery('');
        setError(null);
    }
  }, [isVisible]);

  const handleAsk = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!isPro) {
        setError("Эта функция доступна только по подписке Vibecoder Pro.");
        return;
    }

    if (dailyHintsUsed >= 30) {
        setError("Вы исчерпали лимит (30/30) подсказок на сегодня.");
        return;
    }

    if (!query.trim() && !selectedText) return;

    setLoading(true);
    setError(null);
    onUseHint();

    try {
      const { generateVibeCode } = await import('../services/geminiService');

      let prompt = '';
      if (selectedText && query) {
        prompt = `Контекст урока: ${lessonContext}\n\nВыделенный фрагмент: "${selectedText}"\n\nВопрос студента: ${query}\n\nДай краткий полезный ответ на русском языке.`;
      } else if (selectedText) {
        prompt = `Контекст урока: ${lessonContext}\n\nСтудент выделил текст: "${selectedText}"\n\nОбъясни этот фрагмент простыми словами на русском языке.`;
      } else {
        prompt = `Контекст урока: ${lessonContext}\n\nВопрос студента: ${query}\n\nДай краткий полезный ответ на русском языке.`;
      }

      const answer = await generateVibeCode(prompt);
      setResponse(answer);
    } catch (err: any) {
      setError(err?.message || 'Ошибка при запросе к ИИ');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <div className="bg-vibe-card border border-gray-700 shadow-2xl rounded-2xl w-80 sm:w-96 overflow-hidden pointer-events-auto animate-fade-in flex flex-col max-h-[500px]">
        {/* Header */}
        <div className="bg-gradient-to-r from-vibe-primary to-vibe-accent p-3 flex justify-between items-center text-white">
           <div className="flex items-center gap-2 font-bold text-sm">
              <Sparkles size={16} />
              Vibecoder AI
           </div>
           <div className="flex items-center gap-2">
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                 {isPro ? `${30 - dailyHintsUsed} left` : 'PRO only'}
              </span>
              <button onClick={onClose} className="hover:bg-white/20 rounded p-1 transition-colors">
                 <X size={14} />
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="p-4 bg-vibe-dark flex-grow overflow-y-auto min-h-[150px] flex flex-col">
            {selectedText && (
                <div className="bg-gray-800/50 border-l-2 border-vibe-primary p-2 mb-4 text-xs text-gray-400 italic line-clamp-3">
                    "{selectedText}"
                </div>
            )}

            {response ? (
                <div className="text-sm text-gray-200 leading-relaxed animate-fade-in bg-indigo-900/20 p-3 rounded-lg border border-indigo-500/20">
                    {response}
                </div>
            ) : error ? (
                <div className="flex items-start gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    {error}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center flex-grow text-center text-gray-600 gap-2 py-4">
                    <MessageSquare size={32} className="opacity-20" />
                    <p className="text-xs">
                        {selectedText ? 'Спросите что-то об этом фрагменте...' : 'Задайте вопрос по уроку...'}
                    </p>
                </div>
            )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleAsk} className="p-3 bg-vibe-card border-t border-gray-800 flex gap-2">
            <input
               ref={inputRef}
               type="text"
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               placeholder={selectedText ? "Что это значит?" : "Задайте вопрос..."}
               className="flex-grow bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-vibe-primary transition-colors"
               disabled={loading}
            />
            <button 
               type="submit" 
               disabled={loading || (!query && !selectedText)}
               className="bg-vibe-primary hover:bg-indigo-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
               {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
        </form>
      </div>
    </div>
  );
};

export default AiHelper;
