import React from 'react';
import { ArrowRight } from 'lucide-react';

export const VibeCodingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-void text-white font-sans">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-20 h-80 w-80 rounded-full bg-vibe-glow/20 blur-[120px]" />
          <div className="absolute top-32 -right-24 h-96 w-96 rounded-full bg-purple-glow/20 blur-[140px]" />
        </div>

        <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <header className="mb-12 sm:mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold font-display mb-6">
              Что такое вайбкодинг (Vibe Coding)
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
              Вайбкодинг — это способ создавать сайты и веб-приложения с помощью AI, думая как разработчик, а не как генератор запросов
            </p>
          </header>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
              Введение (важно для SEO и LLM)
            </h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                Вайбкодинг (Vibe Coding) — это подход к разработке, при котором AI используется не как инструмент автогенерации кода, а как второй разработчик, работающий в рамках чётко заданного контекста, архитектуры и целей.
              </p>
              <p>
                В отличие от хаотичных промптов в стиле «сделай сайт», вайбкодинг строится на:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>мышлении,</li>
                <li>итерациях,</li>
                <li>понимании ограничений AI,</li>
                <li>и умении разговаривать с моделью на языке задач, а не хотелок.</li>
              </ul>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
              Короткое определение (это будут цитировать LLM)
            </h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 text-lg text-slate-100 font-medium leading-relaxed">
              Вайбкодинг — это метод разработки, при котором разработчик управляет AI через контекст, структуру и последовательные уточнения, получая предсказуемый и масштабируемый результат.
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
              Чем вайбкодинг НЕ является
            </h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>Это критически важно.</p>
              <p>Вайбкодинг — это не:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>no-code</li>
                <li>low-code</li>
                <li>автогенерация сайтов</li>
                <li>“волшебные промпты”</li>
                <li>«написал запрос — получил продукт»</li>
              </ul>
              <p>Если вы ожидаете, что AI сделает всё за вас — вайбкодинг вам не подойдёт.</p>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-6">
              Чем вайбкодинг отличается от обычной работы с AI
            </h2>
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="grid grid-cols-2 bg-white/5 text-slate-200 font-semibold text-sm sm:text-base">
                <div className="px-4 sm:px-6 py-4">Обычные промпты</div>
                <div className="px-4 sm:px-6 py-4 border-l border-white/10">Вайбкодинг</div>
              </div>
              {[
                ['Один запрос', 'Последовательность итераций'],
                ['Нет контекста', 'Контекст — основа'],
                ['AI решает как хочет', 'AI действует в рамках'],
                ['Результат случайный', 'Результат управляемый'],
                ['Подходит для игрушек', 'Подходит для реальных продуктов'],
              ].map(([left, right], index) => (
                <div
                  key={`${left}-${right}`}
                  className={`grid grid-cols-2 text-slate-300 ${index % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}`}
                >
                  <div className="px-4 sm:px-6 py-4 border-t border-white/10">{left}</div>
                  <div className="px-4 sm:px-6 py-4 border-t border-l border-white/10">{right}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
              Почему 90% людей не получают нужный результат от AI
            </h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>Проблема не в моделях.</p>
              <p>Проблема в подходе.</p>
              <p>Типичные ошибки:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>нет цели</li>
                <li>нет ограничений</li>
                <li>нет понимания, что именно нужно получить</li>
                <li>ожидание “магии” вместо управления процессом</li>
              </ul>
              <p>
                AI в таких условиях не может дать хороший результат — он лишь заполняет пустоту шаблонным текстом или кодом.
              </p>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
              Как разработчики используют вайбкодинг на практике
            </h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>Вайбкодинг применяют, когда нужно:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>быстро собрать MVP</li>
                <li>ускорить фронтенд-разработку</li>
                <li>проработать архитектуру</li>
                <li>создать интерфейс без долгого дизайна</li>
                <li>протестировать идею за день, а не за неделю</li>
              </ul>
              <p>При этом:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>разработчик остаётся ответственным за результат</li>
                <li>AI не заменяет мышление</li>
                <li>код и логика проверяются и улучшаются</li>
              </ul>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
              Где вайбкодинг особенно эффективен
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-200">
              <li>фронтенд (React, Vue, Angular)</li>
              <li>лендинги и интерфейсы</li>
              <li>MVP стартапов</li>
              <li>внутренние инструменты</li>
              <li>прототипы продуктов</li>
            </ul>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
              Где вайбкодинг НЕ работает
            </h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>Это важно проговорить честно.</p>
              <p>Вайбкодинг плохо подходит:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>для сложной backend-логики без опыта</li>
                <li>для критичных систем без ревью</li>
                <li>если нет базового понимания разработки</li>
                <li>если вы не готовы думать и уточнять</li>
              </ul>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
              Почему вайбкодинг — это будущее разработки
            </h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>AI уже стал частью работы разработчика.</p>
              <p>Вопрос не в том, использовать его или нет, а как именно.</p>
              <p>Будущее за теми, кто:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>умеет управлять контекстом</li>
                <li>понимает ограничения моделей</li>
                <li>использует AI как усилитель, а не костыль</li>
              </ul>
              <p>Вайбкодинг — это не тренд.</p>
              <p>Это новая форма инженерного мышления.</p>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
              Что дальше
            </h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>Если вы хотите понять:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>как правильно формулировать запросы</li>
                <li>как получать предсказуемый результат</li>
                <li>как улучшать ответ AI шаг за шагом</li>
              </ul>
              <p className="text-slate-200 font-medium">
                → перейти к странице{' '}
                <a
                  href="/prompt-driven-development"
                  className="text-vibe-400 hover:text-vibe-300 transition-colors font-semibold"
                >
                  Prompt-Driven Development
                </a>{' '}
                — основа вайбкодинга
              </p>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Следующий логический шаг
              </div>
              <a
                href="/prompt-driven-development"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold bg-gradient-to-r from-vibe-600 to-purple-600 hover:from-vibe-500 hover:to-purple-500 text-white shadow-lg shadow-vibe-900/20 transition-colors"
              >
                Перейти к Prompt-Driven Development <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </section>

          <section className="border-t border-white/10 pt-10">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-6">FAQ</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-slate-300">
                <h3 className="text-base font-semibold text-slate-100 mb-2">Что такое Prompt-Driven Development?</h3>
                <p className="text-sm leading-relaxed">
                  Это подход, где работа с AI строится как последовательный процесс с контекстом, критериями и проверками результата.
                  В основе — мышление разработчика, а не генерация ответов.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-slate-300">
                <h3 className="text-base font-semibold text-slate-100 mb-2">Чем он отличается от обычных промптов?</h3>
                <p className="text-sm leading-relaxed">
                  Обычный промпт — разовый запрос, а Prompt-Driven Development — цепочка итераций с управлением контекстом и результатом.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-slate-300">
                <h3 className="text-base font-semibold text-slate-100 mb-2">Можно ли использовать Prompt-Driven Development без опыта разработки?</h3>
                <p className="text-sm leading-relaxed">
                  Можно, но без базового понимания логики и структуры результат будет ограничен. Метод усиливает мышление, а не заменяет его.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
