import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { geminiService } from '@/services/geminiService';

interface Props {
  prompt: string;
  starterCode: string;
  badge?: string;
}

export const HtmlSandbox: React.FC<Props> = ({ prompt, starterCode, badge }) => {
  const [code, setCode] = useState(starterCode);
  const [promptValue, setPromptValue] = useState(prompt);
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const cleanPrompt = useMemo(() => promptValue.trim(), [promptValue]);

  useEffect(() => {
    setCode(starterCode);
  }, [starterCode]);

  useEffect(() => {
    setPromptValue(prompt);
  }, [prompt]);

  useEffect(() => {
    updatePreview(code);
  }, [code]);

  const updatePreview = (value: string) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(value);
    doc.close();
  };

  const handleGenerate = async () => {
    if (!cleanPrompt) return;
    setLoading(true);
    const generated = await geminiService.buildLandingSection(cleanPrompt, code);
    setCode(generated);
    setLoading(false);
  };

  const handleReview = async () => {
    setLoading(true);
    const feedback = await geminiService.reviewCode(code);
    setReview(feedback);
    setLoading(false);
  };

  return (
    <div className="html-sandbox">
      <div className="html-sandbox__prompt">
        <div className="html-sandbox__prompt-head">
          <div>
            <p className="eyebrow">AI-промпт</p>
            <h3>Опиши желаемый блок</h3>
            <p className="muted small">
              Сформулируй, что должно получиться. AI вернет готовый HTML+CSS. Применяй и кастомизируй.
            </p>
          </div>
          {badge && <span className="chip">{badge}</span>}
        </div>
        <textarea
          value={promptValue}
          onChange={e => setPromptValue(e.target.value)}
          spellCheck={false}
          className="html-sandbox__prompt-input"
          placeholder="Добавь детали про анимацию, акценты и адаптив"
        />
        <div className="html-sandbox__actions">
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            <Sparkles size={16} /> {loading ? 'Генерирую...' : 'Сгенерировать HTML с AI'}
          </button>
          <button className="btn btn-ghost" onClick={() => updatePreview(code)} disabled={loading}>
            <RefreshCw size={16} /> Обновить превью
          </button>
          <button className="btn btn-ghost" onClick={handleReview} disabled={loading}>
            <Wand2 size={16} /> AI-ревью
          </button>
        </div>
        {review && (
          <div className="html-sandbox__review">
            <div className="html-sandbox__review-title">
              <Bot size={14} /> VibeCoder ревью
            </div>
            <p className="muted">{review}</p>
          </div>
        )}
      </div>

      <div className="sandbox">
        <div className="sandbox__toolbar">
          <div className="sandbox__file">landing.html</div>
          <div className="sandbox__actions">
            <button className="btn btn-ghost" onClick={() => setCode(starterCode)} disabled={loading}>
              Сбросить
            </button>
            <button className="btn btn-primary" onClick={() => updatePreview(code)} disabled={loading}>
              <RefreshCw size={16} /> Пересобрать
            </button>
          </div>
        </div>

        <div className="sandbox__grid">
          <div className="sandbox__editor">
            <textarea
              spellCheck={false}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="HTML + CSS"
            />
          </div>
          <div className="sandbox__preview">
            <iframe ref={iframeRef} title="preview" sandbox="allow-scripts" />
            <span className="sandbox__badge">Live Preview</span>
          </div>
        </div>
      </div>
    </div>
  );
};
