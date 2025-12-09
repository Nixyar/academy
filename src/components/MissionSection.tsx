import React from 'react';
import { Bot, Cpu, Layout, Terminal, Zap } from 'lucide-react';

const items = [
  { icon: <Zap size={22} />, title: 'Турбо режим', text: 'Спринты по 5 мин.' },
  { icon: <Bot size={22} />, title: 'VibeCoder AI', text: 'Твой второй пилот.' },
  { icon: <Terminal size={22} />, title: 'Live Editor', text: 'Кодь в браузере.' },
  { icon: <Layout size={22} />, title: 'Рендер', text: 'Мгновенный результат.' },
];

export const MissionSection: React.FC = () => (
  <section className="section mission">
    <div className="container mission__grid">
      <div className="mission__copy">
        <p className="eyebrow">Технология VibeCoder</p>
        <h2>AI + практика</h2>
        <p className="muted">
          Мы не просто учим синтаксису. Мы интегрируем AI в процесс обучения. VibeCoderAI анализирует твой стиль, помогает с ошибками в реальном времени и делает обучение похожим на игру в киберпространстве.
        </p>
        <ul className="bullet-list">
          <li>Нейросетевой анализ кода</li>
          <li>Адаптивная сложность</li>
          <li>Кибер-челленджи</li>
          <li>Персональный AI-компаньон</li>
        </ul>
      </div>
      <div className="mission__tiles">
        {items.map((item, index) => (
          <div key={item.title} className={`tile ${index % 2 === 0 ? 'lifted' : ''}`}>
            <div className="icon">{item.icon}</div>
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
