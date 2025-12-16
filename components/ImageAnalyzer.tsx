import React, { useState } from 'react';
import { analyzeImage } from '../services/geminiService';
import { Upload, Loader2, Sparkles } from 'lucide-react';

export const ImageAnalyzer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult('');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setResult('');
    
    try {
      const analysis = await analyzeImage(selectedFile, prompt);
      setResult(analysis);
    } catch (error) {
      setResult("Произошла ошибка при анализе. Проверьте API ключ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
      {/* Result Area (Top) */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar border-b border-slate-700 min-h-0">
        <h3 className="text-vibe-500 font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Результат анализа (Gemini 3 Pro)
        </h3>
        
        {/* Preview */}
        <div className="mb-6 flex justify-center bg-slate-800/50 rounded-lg p-4 border border-slate-700 border-dashed">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-h-64 object-contain rounded shadow-lg" 
            />
          ) : (
            <div className="text-slate-500 text-sm py-10 flex flex-col items-center">
               <Upload className="w-12 h-12 mb-2 opacity-50" />
               <p>Загрузите изображение для анализа</p>
            </div>
          )}
        </div>

        {/* Text Output */}
        <div className="bg-slate-800 p-4 rounded-lg min-h-[100px] border border-slate-700">
          {loading ? (
             <div className="flex items-center justify-center h-full text-vibe-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Анализирую изображение...
             </div>
          ) : result ? (
             <p className="whitespace-pre-wrap text-slate-200 leading-relaxed text-sm">{result}</p>
          ) : (
             <span className="text-slate-500 italic">Результат появится здесь...</span>
          )}
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

        <textarea
          className="flex-1 w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 focus:border-vibe-500 focus:ring-1 focus:ring-vibe-500 outline-none resize-none text-sm font-mono"
          placeholder="Спросите что-нибудь об изображении (или оставьте пустым для общего описания)..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
        />
        
        <button 
          onClick={handleAnalyze}
          disabled={!selectedFile || loading}
          className="w-full bg-gradient-to-r from-vibe-600 to-vibe-500 hover:from-vibe-500 hover:to-vibe-400 text-white font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Анализировать Vibe"}
        </button>
      </div>
    </div>
  );
};
