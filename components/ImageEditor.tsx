import React, { useState } from 'react';
import { editImage } from '../services/geminiService';
import { Upload, Loader2, Wand2, ArrowRight } from 'lucide-react';

export const ImageEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedImage(null);
    }
  };

  const handleEdit = async () => {
    if (!selectedFile || !prompt) return;
    
    setLoading(true);
    setGeneratedImage(null);
    
    try {
      const result = await editImage(selectedFile, prompt);
      if (result.startsWith('data:image')) {
          setGeneratedImage(result);
      } else {
          alert(`Ошибка: ${result}`);
      }
    } catch (error) {
      console.error(error);
      alert("Не удалось отредактировать изображение.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
      {/* Result Area (Top) */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar border-b border-slate-700 min-h-0">
        <h3 className="text-vibe-500 font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          Nano Banana Editor (Gemini 2.5 Flash)
        </h3>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center h-full max-h-[500px]">
             {/* Original */}
             <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-slate-800/50 rounded-lg p-2 border border-slate-700">
                <span className="text-xs text-slate-400 mb-2">Оригинал</span>
                {previewUrl ? (
                    <img src={previewUrl} alt="Original" className="max-h-full max-w-full object-contain rounded" />
                ) : (
                    <div className="text-slate-600 flex flex-col items-center">
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="text-xs">Нет фото</span>
                    </div>
                )}
             </div>

             <ArrowRight className="w-6 h-6 text-slate-600 hidden md:block" />

             {/* Result */}
             <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-slate-800/50 rounded-lg p-2 border border-slate-700">
                <span className="text-xs text-vibe-400 mb-2">Результат AI</span>
                {loading ? (
                    <Loader2 className="w-10 h-10 text-vibe-500 animate-spin" />
                ) : generatedImage ? (
                    <img src={generatedImage} alt="Generated" className="max-h-full max-w-full object-contain rounded shadow-lg shadow-vibe-900/50" />
                ) : (
                    <div className="text-slate-600 text-xs text-center p-4">
                        Ожидание генерации...
                    </div>
                )}
             </div>
        </div>
      </div>

      {/* Control Area (Bottom) */}
      <div className="h-1/3 p-4 bg-slate-900 flex flex-col gap-3">
        <div className="flex gap-2 items-center">
            <input 
                type="file" 
                onChange={handleFileChange}
                accept="image/*"
                className="block w-full text-sm text-slate-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-vibe-600 file:text-white
                hover:file:bg-vibe-500
                cursor-pointer"
            />
        </div>

        <p className="text-xs text-slate-500">Попробуйте: "Добавь ретро фильтр" или "Сделай в стиле киберпанк"</p>

        <textarea
          className="flex-1 w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 focus:border-vibe-500 focus:ring-1 focus:ring-vibe-500 outline-none resize-none text-sm font-mono"
          placeholder="Опишите желаемые изменения..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
        />
        
        <button 
          onClick={handleEdit}
          disabled={!selectedFile || !prompt || loading}
          className="w-full bg-gradient-to-r from-accent to-vibe-600 text-white font-bold py-2 px-4 rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Vibe Coding Magic ✨"}
        </button>
      </div>
    </div>
  );
};
