import React, { useEffect, useRef, useState } from 'react';
import { Bot, RefreshCw, Send } from 'lucide-react';
import { geminiService } from '@/services/geminiService';
import { ChatMessage } from '@/types';

interface Props {
  initialCode: string;
}

export const Sandbox: React.FC<Props> = ({ initialCode }) => {
  const [code, setCode] = useState(initialCode);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setCode(initialCode);
    setMessages([]);
  }, [initialCode]);

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

  const handleAiChat = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const reply = await geminiService.getCodeHelp(code, userMsg.text);
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'model', text: reply }]);
    setChatOpen(true);
  };

  const handleAiReview = async () => {
    setIsTyping(true);
    setChatOpen(true);
    const review = await geminiService.reviewCode(code);
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'model', text: review }]);
  };

  return (
    <div className="sandbox">
      <div className="sandbox__toolbar">
        <div className="sandbox__file">main.vibe</div>
        <div className="sandbox__actions">
          <button className="btn btn-ghost" onClick={() => updatePreview(code)}>
            <RefreshCw size={16} /> Компиляция
          </button>
          <button className="btn btn-primary" onClick={handleAiReview}>
            <Bot size={16} /> AI скан
          </button>
        </div>
      </div>

      <div className="sandbox__grid">
        <div className="sandbox__editor">
          <textarea
            spellCheck={false}
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Напиши свой код здесь..."
          />
        </div>
        <div className="sandbox__preview">
          <iframe ref={iframeRef} title="preview" sandbox="allow-scripts" />
          <span className="sandbox__badge">Превью</span>
        </div>
      </div>

      <div className={`chat ${chatOpen ? 'is-open' : ''}`}>
        <div className="chat__header">
          <div className="chat__title">
            <Bot size={16} />
            <span>VibeCoder Чат</span>
          </div>
          <button className="btn-icon" onClick={() => setChatOpen(false)}>
            X
          </button>
        </div>
        <div className="chat__messages">
          {messages.length === 0 && <p className="muted">Я VibeCoder. Спрашивай.</p>}
          {messages.map((msg, idx) => (
            <div key={idx} className={`bubble ${msg.role === 'user' ? 'bubble--user' : ''}`}>
              {msg.text}
            </div>
          ))}
          {isTyping && <p className="muted">VibeCoder генерирует ответ...</p>}
        </div>
        <div className="chat__input">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAiChat()}
            placeholder="Запрос к AI..."
          />
          <button className="btn btn-primary" onClick={handleAiChat}>
            <Send size={14} />
          </button>
        </div>
      </div>

      {!chatOpen && (
        <button className="chat-toggle" onClick={() => setChatOpen(true)}>
          <Bot size={18} />
        </button>
      )}
    </div>
  );
};
