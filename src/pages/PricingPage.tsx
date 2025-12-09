import React from 'react';
import { CheckCircle } from 'lucide-react';

const perks = [
  'Безлимит к VibeCoder AI',
  'Все продвинутые курсы',
  'Генератор портфолио',
  'Сертификат VibeCoder Pro',
];

export const PricingPage: React.FC = () => (
  <section className="section">
    <div className="container pricing">
      <div className="section__header">
        <p className="eyebrow">Инвестируй в VibeCoderAI</p>
        <h2>Полный доступ к нейросети, курсам и pro-функциям.</h2>
      </div>

      <div className="pricing__card">
        <div className="badge">Популярный</div>
        <div className="pricing__price">
          <span>1499₽</span>
          <small>/месяц</small>
        </div>
        <ul className="pricing__list">
          {perks.map(item => (
            <li key={item}>
              <CheckCircle size={16} /> {item}
            </li>
          ))}
        </ul>
        <button className="btn btn-primary full">Попробовать AI бесплатно</button>
        <p className="muted small">Отмена в любой момент. Безопасная оплата.</p>
      </div>

      <div className="pricing__addons">
        {[
          { label: 'UI Киты', price: '499₽' },
          { label: 'React + AI Курс', price: '999₽' },
          { label: 'Ревью Профиля', price: '2499₽' },
          { label: 'Менторство', price: '4999₽' },
        ].map(addon => (
          <div key={addon.label} className="addon">
            <h4>{addon.label}</h4>
            <p>{addon.price}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
