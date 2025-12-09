import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Hero: React.FC = () => (
  <section className="hero">
    <div className="container hero__grid">
      <div className="hero__content">
        <span className="pill">
          <Sparkles size={14} /> Powered by VibeCoder AI
        </span>
        <h1 className="hero__title">
          Учись кодить. <span className="accent">Создавай с AI.</span>
        </h1>
        <p className="hero__subtitle">
          Платформа нового поколения, где ты пишешь код в паре с VibeCoder AI. Интерактивные песочницы, умный фидбек и никаких скучных лекций.
        </p>
        <div className="hero__actions">
          <Link to="/courses" className="btn btn-primary">
            Перейти к обучению <ArrowRight size={16} />
          </Link>
          <Link to="/pricing" className="btn btn-ghost">
            VibeCoder Pro
          </Link>
        </div>
      </div>
      <div className="hero__panel">
        <div className="hero__status">
          <div className="dot online" />
          <span>AI-ядро активно</span>
        </div>
        <div className="hero__card">
          <p>Live Editor</p>
          <code>&lt;VibeCoder /&gt;</code>
          <span className="chip">Neon mode</span>
        </div>
        <div className="hero__meta">
          <div>
            <p className="label">Спринты</p>
            <h4>5 мин</h4>
          </div>
          <div>
            <p className="label">Компилятор</p>
            <h4>Instant</h4>
          </div>
          <div>
            <p className="label">AI Review</p>
            <h4>Онлайн</h4>
          </div>
        </div>
      </div>
    </div>
  </section>
);
