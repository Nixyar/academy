import React from 'react';
import { Code2, Send } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="footer">
    <div className="container footer__content">
      <div className="footer__brand">
        <span className="footer__logo">
          <Code2 size={14} />
        </span>
        <span>VibeCoderAI</span>
      </div>
      <div className="footer__links">
        <span>AI Политика</span>
        <span>Условия</span>
        <a
          className="footer__social"
          href="https://t.me/vibecoderai"
          target="_blank"
          rel="noreferrer"
          aria-label="Telegram"
          title="Telegram"
        >
          <Send size={16} />
        </a>
        <span>Сообщество</span>
      </div>
      <p className="footer__copy">© 2024 VibeCoderAI. Будущее кода здесь.</p>
    </div>
  </footer>
);
