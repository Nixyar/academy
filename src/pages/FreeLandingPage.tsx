import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Flame, LayoutPanelLeft, Sparkles } from 'lucide-react';
import { HtmlSandbox } from '@/components/HtmlSandbox';
import { freeLandingCourse } from '@/data/free-landing/course';

export const FreeLandingPage: React.FC = () => {
  const [missionIndex, setMissionIndex] = useState(0);
  const mission = useMemo(() => freeLandingCourse.missions[missionIndex], [missionIndex]);

  return (
    <div className="free-landing">
      <section className="section free-landing__hero">
        <div className="container free-landing__hero-grid">
          <div className="free-landing__copy">
            <p className="pill">Бесплатный модуль</p>
            <h1>
              {freeLandingCourse.title} <span className="accent">в песочнице</span>
            </h1>
            <p className="muted">
              {freeLandingCourse.heroPitch}
            </p>
            <div className="free-landing__stats">
              <div>
                <p className="label">Джун → Мидл</p>
                <h3>за 4 шага</h3>
              </div>
              <div>
                <p className="label">Сеньор →</p>
                <h3>ускорение ×5</h3>
              </div>
              <div>
                <p className="label">Сборка</p>
                <h3>30 минут</h3>
              </div>
            </div>
            <div className="free-landing__actions">
              <button className="btn btn-primary" onClick={() => setMissionIndex(0)}>
                Запустить миссию <ArrowRight size={16} />
              </button>
              <span className="pill ghost">AI → это чит-код</span>
            </div>
          </div>
          <div className="free-landing__panel">
            <div className="free-landing__panel-head">
              <Sparkles size={16} /> Vibe Landing: сайт за 30 минут
            </div>
            <p className="free-landing__panel-text">{freeLandingCourse.subtitle}</p>
            <div className="free-landing__panel-meta">
              <div className="chip">4 миссии</div>
              <div className="chip">HTML/CSS + AI</div>
              <div className="chip">Gemini/DeepSeek ready</div>
            </div>
            <div className="free-landing__panel-footer">
              <span className="muted">Скопируй промпт → Получи готовую секцию → Отредактируй.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section free-landing__missions">
        <div className="container">
          <div className="section__header">
            <p className="eyebrow">4 быстрых миссии</p>
            <h2>Выбери блок, который AI сгенерирует первым</h2>
            <p className="muted">Каждая миссия — законченный кусок лендинга с промптом, стартовым кодом и чек-листом.</p>
          </div>

          <div className="free-landing__mission-list">
            {freeLandingCourse.missions.map((item, index) => (
              <button
                key={item.id}
                className={`mission-card ${index === missionIndex ? 'is-active' : ''}`}
                onClick={() => setMissionIndex(index)}
              >
                <div className="mission-card__top">
                  <span className="chip">{item.badge}</span>
                  <span className="muted small">{index + 1} / 4</span>
                </div>
                <h3>{item.title}</h3>
                <p className="muted">{item.hook}</p>
                <div className="mission-card__meta">
                  <Flame size={14} /> {item.goal}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section free-landing__workspace">
        <div className="container">
          <div className="free-landing__workspace-grid">
            <div className="mission-details">
              <p className="eyebrow">Миссия {missionIndex + 1}</p>
              <h2>{mission.title}</h2>
              <p className="muted">{mission.goal}</p>

              <div className="mission-details__block">
                <div className="mission-details__title">
                  <LayoutPanelLeft size={16} /> Промпт для AI
                </div>
                <p className="muted small">{mission.prompt}</p>
              </div>

              <div className="mission-details__block">
                <div className="mission-details__title">
                  <CheckCircle2 size={16} /> Чек-лист результата
                </div>
                <ul className="bullet-list">
                  {mission.checklist.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="mission-details__note">
                <p className="label">AI совет</p>
                <p className="muted">{mission.aiNotes}</p>
              </div>
            </div>

            <div className="mission-sandbox">
              <HtmlSandbox prompt={mission.prompt} starterCode={mission.starterCode} badge={mission.badge} />
            </div>
          </div>
        </div>
      </section>

      <section className="section free-landing__cta">
        <div className="container free-landing__cta-card">
          <div>
            <p className="pill">Финальный шаг</p>
            <h2>{freeLandingCourse.proUpsell.title}</h2>
            <p className="muted">{freeLandingCourse.proUpsell.subtitle}</p>
            <div className="free-landing__perks">
              {freeLandingCourse.proUpsell.perks.map(perk => (
                <span key={perk} className="chip">
                  <ArrowRight size={14} /> {perk}
                </span>
              ))}
            </div>
          </div>
          <div className="free-landing__cta-actions">
            <span className="price">{freeLandingCourse.proUpsell.price}</span>
            <button className="btn btn-primary">{freeLandingCourse.proUpsell.cta}</button>
            <p className="muted small">Без навязчивости: просто нажми, когда почувствуешь силу.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
