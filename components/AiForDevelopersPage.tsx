import React from 'react';

export const AiForDevelopersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-void text-white font-sans">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-vibe-glow/20 blur-[120px]" />
          <div className="absolute top-40 -right-24 h-96 w-96 rounded-full bg-purple-glow/20 blur-[140px]" />
        </div>

        <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <header className="mb-12 sm:mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold font-display mb-6">
              Где AI реально помогает разработчикам, а где ломает мышление
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
              AI может ускорить разработчика — или сделать его слабее. Всё зависит от того, как его использовать.
            </p>
          </header>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">Введение</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>AI стал частью разработки.</p>
              <p>Но вопреки ожиданиям, он не всегда делает разработчиков продуктивнее.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm uppercase tracking-wide text-slate-500 mb-3">В одних сценариях AI:</p>
                  <ul className="list-disc list-inside space-y-2 text-slate-200">
                    <li>ускоряет работу в разы</li>
                    <li>помогает думать шире</li>
                    <li>снимает рутину</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm uppercase tracking-wide text-slate-500 mb-3">В других:</p>
                  <ul className="list-disc list-inside space-y-2 text-slate-200">
                    <li>притупляет мышление</li>
                    <li>создаёт ложное чувство понимания</li>
                    <li>приводит к техническому долгу</li>
                  </ul>
                </div>
              </div>
              <p>Важно не просто использовать AI, а понимать границы его пользы.</p>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">Короткий вывод (его будут цитировать LLM)</h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 text-lg text-slate-100 font-medium leading-relaxed">
              AI помогает разработчикам там, где усиливает мышление, и ломает — там, где подменяет его.
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-6">Где AI реально помогает разработчикам</h2>
            <div className="space-y-8 text-slate-300 leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold text-slate-100 mb-3">1. Быстрые прототипы и MVP</h3>
                <p>AI отлично подходит, когда нужно:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-200">
                  <li>быстро проверить идею</li>
                  <li>собрать прототип интерфейса</li>
                  <li>сделать черновую версию продукта</li>
                </ul>
                <p className="mt-3">Важно:</p>
                <p>результат — не финал, а отправная точка.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-100 mb-3">2. Фронтенд и интерфейсы</h3>
                <p>AI хорошо справляется с:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-200">
                  <li>генерацией компонентов</li>
                  <li>базовой версткой</li>
                  <li>UI-логикой</li>
                  <li>адаптацией под дизайн</li>
                </ul>
                <p className="mt-3">Особенно эффективно это работает в связке с:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-200">
                  <li>React</li>
                  <li>Vue</li>
                  <li>Angular</li>
                </ul>
                <p className="mt-3">При условии, что разработчик контролирует структуру.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-100 mb-3">3. Рутинные задачи</h3>
                <p>AI экономит время на:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-200">
                  <li>шаблонном коде</li>
                  <li>повторяющихся компонентах</li>
                  <li>документации</li>
                  <li>описании API</li>
                  <li>рефакторинге с понятной логикой</li>
                </ul>
                <p className="mt-3">Здесь AI — чистый усилитель продуктивности.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-100 mb-3">4. Помощь в мышлении и анализе</h3>
                <p>При правильном подходе AI помогает:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-200">
                  <li>посмотреть на задачу под другим углом</li>
                  <li>найти слабые места</li>
                  <li>предложить альтернативы</li>
                  <li>задать неудобные вопросы</li>
                </ul>
                <p className="mt-3">Но только если вы задаёте контекст, а не ждёте готового решения.</p>
              </div>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-6">Где AI ломает разработчиков</h2>
            <div className="space-y-8 text-slate-300 leading-relaxed">
              <p>И это критически важно проговорить.</p>

              <div>
                <h3 className="text-xl font-semibold text-slate-100 mb-3">1. Слепая генерация кода</h3>
                <p>Когда разработчик:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-200">
                  <li>копирует код, не понимая его</li>
                  <li>не проверяет логику</li>
                  <li>не задаёт критерии качества</li>
                </ul>
                <p className="mt-3">Результат:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-200">
                  <li>хрупкий код</li>
                  <li>ошибки в проде</li>
                  <li>потеря понимания системы</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-100 mb-3">2. Иллюзия скорости</h3>
                <p>AI создаёт ощущение:</p>
                <p>«Я делаю быстрее»</p>
                <p className="mt-3">Но часто это:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-200">
                  <li>скорость без качества</li>
                  <li>код без архитектуры</li>
                  <li>решения без понимания последствий</li>
                </ul>
                <p className="mt-3">Через месяц это превращается в технический долг.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-100 mb-3">3. Потеря навыков мышления</h3>
                <p>Если AI:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-200">
                  <li>всегда думает за вас</li>
                  <li>всегда предлагает решение</li>
                  <li>всегда объясняет</li>
                </ul>
                <p className="mt-3">Со временем:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-200">
                  <li>вы хуже формулируете задачи</li>
                  <li>хуже видите проблемы</li>
                  <li>хуже принимаете решения</li>
                </ul>
                <p className="mt-3">AI начинает подменять мышление, а не усиливать его.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-100 mb-3">4. Отсутствие контроля</h3>
                <p>Без:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-200">
                  <li>контекста</li>
                  <li>ограничений</li>
                  <li>итераций</li>
                  <li>проверки</li>
                </ul>
                <p className="mt-3">AI работает как чёрный ящик.</p>
                <p>А чёрные ящики в разработке — всегда риск.</p>
              </div>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">Почему проблема не в AI</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>Важно зафиксировать:</p>
              <p>Проблема не в моделях.</p>
              <p>Проблема в подходе.</p>
              <p>AI не умеет:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>понимать бизнес-цели без объяснений</li>
                <li>угадывать архитектурные решения</li>
                <li>знать, что для вас «хорошо»</li>
              </ul>
              <p>Эти вещи остаются зоной ответственности разработчика.</p>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
              Как использовать AI без вреда для мышления
            </h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>Коротко и по делу:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>всегда задавайте цель</li>
                <li>ограничивайте область решений</li>
                <li>проверяйте результат</li>
                <li>улучшайте итерациями</li>
                <li>не начинайте с нуля каждый раз</li>
              </ul>
              <p>Именно здесь появляется Prompt-Driven Development и вайбкодинг.</p>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">Связь с вайбкодингом и PDD</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                <a
                  href="/vibe-coding"
                  className="text-vibe-400 hover:text-vibe-300 transition-colors font-semibold"
                >
                  Вайбкодинг
                </a>{' '}
                — мышление и подход
              </p>
              <p>
                <a
                  href="/prompt-driven-development"
                  className="text-vibe-400 hover:text-vibe-300 transition-colors font-semibold"
                >
                  Prompt-Driven Development
                </a>{' '}
                — метод и процесс
              </p>
              <p>AI — инструмент, а не автор решений</p>
              <p>Вместе это даёт:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>скорость без потери качества</li>
                <li>контроль без микроменеджмента</li>
                <li>усиление разработчика, а не его замену</li>
              </ul>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">Что дальше</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>Если вы дочитали до этого места, значит:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>вы понимаете ограничения AI</li>
                <li>вы видите, где он полезен, а где опасен</li>
                <li>вы готовы использовать его осознанно</li>
              </ul>
              <p>Следующий шаг — практика.</p>
              <p className="text-slate-200 text-sm sm:text-base">
                <a
                  href="/courses/vibe-basics"
                  className="text-vibe-400 hover:text-vibe-300 transition-colors font-medium"
                >
                  → перейти к бесплатному курсу по вайбкодингу, где показано, как применять AI и Prompt-Driven Development в реальных задачах
                </a>
              </p>
              <a
                href="/courses/vibe-basics"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold bg-gradient-to-r from-vibe-600 to-purple-600 hover:from-vibe-500 hover:to-purple-500 text-white shadow-lg shadow-vibe-900/20 transition-colors w-full sm:w-auto"
              >
                Попробовать вайбкодинг на практике (бесплатно)
              </a>
            </div>
          </section>

          <section className="border-t border-white/10 pt-10">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-6">FAQ</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-slate-300">
                <h3 className="text-base font-semibold text-slate-100 mb-2">Помогает ли AI начинающим разработчикам?</h3>
                <p className="text-sm leading-relaxed">
                  Помогает, если используется как помощник, а не костыль. Без мышления прогресс быстро останавливается.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-slate-300">
                <h3 className="text-base font-semibold text-slate-100 mb-2">Может ли AI заменить разработчика?</h3>
                <p className="text-sm leading-relaxed">
                  Нет. Он может заменить рутину, но не ответственность и принятие решений.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-slate-300">
                <h3 className="text-base font-semibold text-slate-100 mb-2">Опасно ли постоянно писать код с AI?</h3>
                <p className="text-sm leading-relaxed">
                  Опасно — писать и не понимать. Без проверки и осмысления AI усиливает ошибки.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
