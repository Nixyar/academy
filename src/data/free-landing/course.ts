export interface FreeMission {
  id: string;
  title: string;
  hook: string;
  goal: string;
  prompt: string;
  checklist: string[];
  starterCode: string;
  aiNotes: string;
  badge: string;
}

export interface FreeLandingCourse {
  slug: string;
  title: string;
  subtitle: string;
  heroPitch: string;
  missions: FreeMission[];
  proUpsell: {
    title: string;
    subtitle: string;
    perks: string[];
    cta: string;
    price: string;
  };
}

export const freeLandingCourse: FreeLandingCourse = {
  slug: 'free-landing',
  title: 'Vibe Landing: сайт за 30 минут через AI',
  subtitle: 'Бесплатная миссия, где ты собираешь лендинг уровня студии с помощью промптов.',
  heroPitch:
    'Увидишь, как AI превращает промпты в дизайн, а тебя — в разработчика с чит-кодом. Без React, без Figma, только HTML/CSS + VibeCoderAI.',
  missions: [
    {
      id: 'hero-block',
      title: 'Hero-блок уровня SaaS-стартапа',
      hook: 'Неоновый hero в духе Framer/Linear за один запрос.',
      goal: 'Собрать красивый hero-блок с динамической типографикой, градиентом и адаптивностью.',
      prompt:
        'Сгенерируй hero-блок для AI платформы VibeCoderAI. Стиль: Framer/Linear, неоновый градиент, плавный blur, адаптивность. Внутри: тег main, слева — заголовок с подсветкой и подзаголовком, кнопки CTA (основная + ghost), справа — панель с кодовым превью и статусом AI. Без внешних библиотек, только HTML+CSS в одном файле.',
      checklist: [
        'Заголовок с динамическим выделением ключевых слов.',
        'Неоновый градиент фона + подсветка панели.',
        'Адаптив: стэк колонкой на ширине < 960px.',
        'Кнопки с эффектом свечения и hover-сдвига.',
      ],
      starterCode:
        '<main class="vibe-landing">\n  <section class="hero">\n    <div class="hero-copy">\n      <p class="pill">AI Sprint · VibeCoder</p>\n      <h1>Создай лендинг с чит-кодом</h1>\n      <p class="lead">Запусти платформу, попроси AI — и получи дизайн уровня студии.</p>\n      <div class="cta-row">\n        <button class="btn primary">Стартуем</button>\n        <button class="btn ghost">Смотреть демо</button>\n      </div>\n    </div>\n    <div class="hero-panel">\n      <div class="badge">AI Core · Online</div>\n      <div class="glass">&lt;VibeCoder /&gt;</div>\n    </div>\n  </section>\n</main>\n\n<style>\n  body { background: #050915; color: #e2e8f0; font-family: "Inter", system-ui; }\n  .vibe-landing { min-height: 100vh; padding: 56px 24px; background: radial-gradient(circle at 20% 20%, rgba(124, 58, 237, 0.25), transparent 40%), radial-gradient(circle at 80% 0%, rgba(236, 72, 153, 0.22), transparent 35%), #050915; }\n  .hero { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 32px; max-width: 1100px; margin: 0 auto; align-items: center; }\n  .pill { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; background: rgba(124, 58, 237, 0.14); color: #c084fc; letter-spacing: 0.08em; text-transform: uppercase; font-size: 12px; }\n  h1 { font-size: clamp(32px, 4vw, 48px); line-height: 1.05; margin: 12px 0; }\n  .lead { color: #94a3b8; max-width: 520px; }\n  .cta-row { display: flex; gap: 12px; margin-top: 18px; }\n  .btn { border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 14px; padding: 12px 16px; font-weight: 700; background: rgba(255, 255, 255, 0.04); color: #e2e8f0; cursor: pointer; transition: transform 0.16s ease, box-shadow 0.2s ease; }\n  .btn.primary { background: linear-gradient(135deg, #8b5cf6, #ec4899); box-shadow: 0 15px 40px rgba(124, 58, 237, 0.35); border: none; }\n  .btn:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25); }\n  .btn.ghost { background: rgba(255, 255, 255, 0.04); }\n  .hero-panel { position: relative; background: linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(27, 35, 60, 0.9)); border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 20px; padding: 20px; box-shadow: 0 20px 70px rgba(0, 0, 0, 0.45), 0 0 40px rgba(139, 92, 246, 0.35); }\n  .badge { display: inline-flex; padding: 6px 10px; border-radius: 10px; background: rgba(16, 185, 129, 0.1); color: #34d399; font-size: 12px; letter-spacing: 0.05em; }\n  .glass { margin-top: 18px; height: 200px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.08); background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)); display: grid; place-items: center; color: #c084fc; font-weight: 800; font-size: 22px; text-shadow: 0 0 24px rgba(139, 92, 246, 0.9); }\n  @media (max-width: 960px) { .hero { grid-template-columns: 1fr; } .hero-panel { order: -1; } }\n</style>',
      aiNotes: 'Попроси AI усиливать контраст, анимацию и адаптивность. Говори, что это hero для SaaS.',
      badge: 'Вау-момент #1',
    },
    {
      id: 'benefits',
      title: 'Карточки преимуществ с анимацией',
      hook: '3 карточки с hover-свечением и fade-in, будто из будущего.',
      goal: 'Показать, что AI умеет писать нескучные карточки с motion и нейронным стилем.',
      prompt:
        'Сгенерируй секцию преимуществ для VibeCoderAI. 3 карточки в строку, стиль минималистичный нейронный: полупрозрачные панели, неоновый обвод, плавный градиент. Добавь hover-сдвиг, свечение и анимацию появления (fade + translateY). Цветовой акцент — фиолетовый/бирюзовый. HTML+CSS в одном файле, без внешних библиотек.',
      checklist: [
        '3 карточки с уникальными заголовками и описанием.',
        'Hover: лёгкий подъем и подсветка границ.',
        'Fade-in + translateY через keyframes или transition-delay.',
        'Нейронный градиент и акцент на шрифт.',
      ],
      starterCode:
        '<section class="benefits">\n  <div class="container">\n    <p class="eyebrow">VibeCoder AI</p>\n    <h2>Преимущества</h2>\n    <div class="cards">\n      <article class="card">\n        <h3>AI-пилот</h3>\n        <p>Встроенный наставник, который дописывает за тебя.</p>\n      </article>\n      <article class="card">\n        <h3>Live Sandbox</h3>\n        <p>Мгновенный рендер и обзор ошибок.</p>\n      </article>\n      <article class="card">\n        <h3>Готовые промпты</h3>\n        <p>Коллекция паттернов для фронта, бэка и дизайна.</p>\n      </article>\n    </div>\n  </div>\n</section>\n\n<style>\n  body { background: #050915; color: #e2e8f0; font-family: "Inter", system-ui; }\n  .benefits { padding: 72px 24px; }\n  .container { max-width: 1100px; margin: 0 auto; }\n  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-top: 24px; }\n  .card { padding: 20px; border-radius: 16px; border: 1px solid rgba(124, 58, 237, 0.3); background: linear-gradient(145deg, rgba(124, 58, 237, 0.08), rgba(14, 165, 233, 0.08)); color: #e2e8f0; }\n  h2 { margin: 10px 0; }\n  p { color: #94a3b8; }\n</style>',
      aiNotes: 'Проси про анимацию появления и hover-свечения. Можно добавить иконки или blur.',
      badge: 'UI уровня 2026',
    },
    {
      id: 'how-it-works',
      title: 'Динамическая секция «Как это работает»',
      hook: 'AI как арт-директор: шаги, иконки, motion.',
      goal: 'Собрать сетку из 3 шагов с микроанимациями, blur/glow и плавными hover-эффектами.',
      prompt:
        'Сгенерируй секцию “Как работает VibeCoderAI” в стиле минималистичной техно-анимации. 3 шага в сетке, у каждого — SVG-иконка (можно через inline SVG), заголовок, короткий текст. Добавь blur/glow в фоне, smooth hover-motion (translate + shadow), легкий motion при появлении. HTML и CSS в одном файле, адаптив до мобильного.',
      checklist: [
        '3 шага с иконкой в кружке.',
        'Hover-motion: translateY(-6px) + свечение.',
        'Фоновый blur/gradient, но не мешающий тексту.',
        'Адаптивная сетка на мобайле.',
      ],
      starterCode:
        '<section class="how">\n  <div class="wrap">\n    <p class="eyebrow">Процесс</p>\n    <h2>Как работает VibeCoderAI</h2>\n    <div class="steps">\n      <div class="step">\n        <div class="icon">1</div>\n        <h3>Запрос</h3>\n        <p>Ты пишешь промпт — AI понимает задачу.</p>\n      </div>\n      <div class="step">\n        <div class="icon">2</div>\n        <h3>Генерация</h3>\n        <p>AI создает HTML/CSS с анимациями.</p>\n      </div>\n      <div class="step">\n        <div class="icon">3</div>\n        <h3>Доставка</h3>\n        <p>Получаешь готовую секцию и дорабатываешь.</p>\n      </div>\n    </div>\n  </div>\n</section>\n\n<style>\n  body { background: #050915; color: #e2e8f0; font-family: "Inter", system-ui; }\n  .wrap { max-width: 1100px; margin: 0 auto; padding: 72px 24px; position: relative; }\n  .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 24px; }\n  .step { padding: 18px; border-radius: 16px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(148, 163, 184, 0.18); }\n  .icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(124, 58, 237, 0.18); display: grid; place-items: center; font-weight: 800; color: #c084fc; }\n  p { color: #94a3b8; }\n</style>',
      aiNotes: 'Уточняй про blur/glow и плавные hover-motion, чтобы AI делал анимированный tech-вайб.',
      badge: 'AI как арт-директор',
    },
    {
      id: 'footer-cta',
      title: 'Финальный штрих: футер + CTA + адаптив',
      hook: 'Цельный низ страницы с call-to-action и мобильной адаптацией.',
      goal: 'Получить завершенный лендинг: футер, CTA, мобильный вид и легкая динамика.',
      prompt:
        'Сгенерируй футер с CTA для VibeCoderAI. Нужны: заголовок + кнопка, список ссылок/соцсетей, адаптивность (стек на мобайле), легкая анимация наведения и фон с шумом/blur. Типографика аккуратная, в стиле современного SaaS. Только HTML и CSS в одном файле.',
      checklist: [
        'CTA-блок поверх футера, контрастный фон.',
        'Колонки ссылок и соцсети.',
        'Адаптив: вертикальный стек на мобайле.',
        'Легкая динамика при hover.',
      ],
      starterCode:
        '<footer class="vibe-footer">\n  <div class="cta">\n    <div>\n      <p class="pill">Финальный шаг</p>\n      <h2>Готово? Запусти свой лендинг</h2>\n      <p>Закрой проект с футером и CTA, который ведет на регистрацию.</p>\n    </div>\n    <button class="btn primary">Собрать с AI</button>\n  </div>\n  <div class="footer-grid">\n    <div>\n      <h4>VibeCoderAI</h4>\n      <p>AI → твой второй пилот в коде.</p>\n    </div>\n    <div>\n      <h5>Навигация</h5>\n      <a href="#">Главная</a>\n      <a href="#">Курсы</a>\n      <a href="#">Pro</a>\n    </div>\n    <div>\n      <h5>Соцсети</h5>\n      <a href="#">Telegram</a>\n      <a href="#">YouTube</a>\n      <a href="#">Discord</a>\n    </div>\n  </div>\n</footer>\n\n<style>\n  body { background: #050915; color: #e2e8f0; font-family: "Inter", system-ui; }\n  .vibe-footer { max-width: 1100px; margin: 0 auto; padding: 72px 24px 96px; display: grid; gap: 32px; }\n  .cta { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-radius: 18px; background: linear-gradient(135deg, rgba(124, 58, 237, 0.18), rgba(236, 72, 153, 0.16)); border: 1px solid rgba(124, 58, 237, 0.35); }\n  .pill { display: inline-flex; padding: 8px 12px; border-radius: 999px; background: rgba(255, 255, 255, 0.08); color: #c084fc; letter-spacing: 0.08em; text-transform: uppercase; font-size: 12px; }\n  .btn.primary { border: none; border-radius: 14px; padding: 12px 16px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff; font-weight: 800; cursor: pointer; }\n  .footer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; border-top: 1px solid rgba(148, 163, 184, 0.18); padding-top: 18px; }\n  a { color: #94a3b8; text-decoration: none; display: block; margin: 6px 0; }\n  a:hover { color: #c084fc; }\n  @media (max-width: 780px) { .cta { flex-direction: column; align-items: flex-start; gap: 14px; } }\n</style>',
      aiNotes: 'Попроси AI добавить шум/blur в фон и эффекты hover. Дополни адаптив до мобильного.',
      badge: 'Готовый продукт',
    },
  ],
  proUpsell: {
    title: 'Хочешь проект уровня Senior?',
    subtitle: 'Разблокируй PRO и построишь UI-систему через промпты, React-компоненты и AI-архитектуру.',
    perks: [
      'Генерация React-компонентов с AI',
      'UI-система и дизайн-токены через промпты',
      'Готовые промпты-паттерны для продакшена',
      'AI-архитектурные решения и пайплайны',
    ],
    cta: 'Разблокировать PRO',
    price: '1499 ₽ / месяц',
  },
};
