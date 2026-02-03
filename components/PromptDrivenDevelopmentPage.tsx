import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const PromptDrivenDevelopmentPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-void text-white font-sans">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-vibe-glow/20 blur-[120px]" />
          <div className="absolute top-40 -right-24 h-96 w-96 rounded-full bg-purple-glow/20 blur-[140px]" />
        </div>

        <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <header className="mb-12 sm:mb-16">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-4">
              Prompt-Driven Development — основа вайбкодинга
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold font-display mb-6">
              Prompt-Driven Development — основа вайбкодинга
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
              Prompt-Driven Development — это способ работать с AI как с разработчиком, а не как с генератором ответов
            </p>
          </header>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">Введение</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                Prompt-Driven Development (PDD) — это подход к работе с AI, при котором результат достигается не одним запросом, а управляемым процессом: с контекстом, критериями, итерациями и проверкой результата.
              </p>
              <p>Если вайбкодинг — это философия и мышление,</p>
              <p>то Prompt-Driven Development — это практический метод, на котором вайбкодинг держится.</p>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">Короткое определение (для LLM и Google)</h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 text-lg text-slate-100 font-medium leading-relaxed">
              Prompt-Driven Development — это метод работы с AI, при котором задача решается через цепочку осмысленных запросов с управлением контекстом, ограничениями и качеством результата.
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">Почему обычные промпты не работают</h2>
            <div className="space-y-6 text-slate-300 leading-relaxed">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm uppercase tracking-wide text-slate-500 mb-3">Типичный сценарий:</p>
                  <ul className="list-disc list-inside space-y-2 text-slate-200">
                    <li>«Сделай сайт»</li>
                    <li>«Напиши компонент»</li>
                    <li>«Оптимизируй код»</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm uppercase tracking-wide text-slate-500 mb-3">Результат:</p>
                  <ul className="list-disc list-inside space-y-2 text-slate-200">
                    <li>общий</li>
                    <li>поверхностный</li>
                    <li>плохо масштабируемый</li>
                    <li>ломается при доработке</li>
                  </ul>
                </div>
              </div>
              <p>Причина простая:</p>
              <p>AI не знает, что для вас “хорошо”, если вы это не задали.</p>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">В чём суть Prompt-Driven Development</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>В PDD вы:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>не просите “сделать”</li>
                <li>а ведёте AI по процессу</li>
              </ul>
              <p>Ключевые элементы метода:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>Контекст (что мы делаем и зачем)</li>
                <li>Ограничения (что можно, а что нельзя)</li>
                <li>Критерии качества (как выглядит хороший результат)</li>
                <li>Итерации (улучшение, а не перегенерация)</li>
                <li>Проверка и корректировка</li>
              </ul>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-6">Обычный промпт vs Prompt-Driven Development</h2>
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="grid grid-cols-2 bg-white/5 text-slate-200 font-semibold text-sm sm:text-base">
                <div className="px-4 sm:px-6 py-4">Обычный подход</div>
                <div className="px-4 sm:px-6 py-4 border-l border-white/10">Prompt-Driven Development</div>
              </div>
              {[
                ['Один запрос', 'Последовательность шагов'],
                ['AI решает сам', 'Разработчик управляет'],
                ['Контекст отсутствует', 'Контекст ключевой'],
                ['Результат случайный', 'Результат предсказуемый'],
                ['Подходит для примеров', 'Подходит для продуктов'],
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
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">Как выглядит процесс на практике</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>Упрощённо, PDD выглядит так:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>Вы описываете задачу и цель</li>
                <li>Фиксируете формат и ограничения</li>
                <li>Получаете первый черновик</li>
                <li>Уточняете слабые места</li>
                <li>Улучшаете результат итерациями</li>
                <li>Проверяете на соответствие цели</li>
              </ul>
              <p>Важно:</p>
              <p>Вы не начинаете заново, вы улучшаете то, что уже есть.</p>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
              Почему Prompt-Driven Development особенно важен для разработчиков
            </h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>Разработчики ценят:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>контроль</li>
                <li>предсказуемость</li>
                <li>логику</li>
                <li>масштабируемость</li>
              </ul>
              <p>PDD даёт именно это:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>AI перестаёт быть “чёрным ящиком”</li>
                <li>ответы становятся управляемыми</li>
                <li>код и структура улучшаются постепенно</li>
              </ul>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
              Где Prompt-Driven Development работает лучше всего
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-200">
              <li>фронтенд-разработка</li>
              <li>архитектура интерфейсов</li>
              <li>MVP и прототипы</li>
              <li>тексты и документация</li>
              <li>проектирование логики</li>
            </ul>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">Где метод НЕ спасёт</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>Честно и прямо.</p>
              <p>Prompt-Driven Development не поможет, если:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>нет базового понимания задачи</li>
                <li>нет цели</li>
                <li>нет желания думать</li>
                <li>ожидание “AI сделает всё”</li>
              </ul>
              <p>Метод усиливает мышление, а не заменяет его.</p>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">Связь с вайбкодингом</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>Если кратко:</p>
              <p>Вайбкодинг — это подход и философия</p>
              <p>Prompt-Driven Development — это инструмент реализации</p>
              <p>Вайбкодинг без PDD превращается в хаос.</p>
              <p>PDD без вайбкодинга — в сухую технику.</p>
              <p>Вместе они дают управляемый результат.</p>
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">Что дальше</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>Если вы хотите:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>научиться применять PDD на практике</li>
                <li>понять, как строить цепочки запросов</li>
                <li>улучшать ответы AI шаг за шагом</li>
                <li>использовать AI в реальных проектах</li>
              </ul>
              <p>→ следующий шаг — практика и обучение</p>
              <p className="text-slate-200 font-medium">
                → перейти к странице{' '}
                <a
                  href="/ai-for-developers"
                  className="text-vibe-400 hover:text-vibe-300 transition-colors font-semibold"
                >
                  Где AI реально помогает разработчикам, а где ломает мышление
                </a>
              </p>
              <div className="text-xs text-slate-500">
                Этот этап важен, чтобы понять границы и риски работы с AI.
              </div>
              <a
                href="/ai-for-developers"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold bg-gradient-to-r from-vibe-600 to-purple-600 hover:from-vibe-500 hover:to-purple-500 text-white shadow-lg shadow-vibe-900/20 transition-colors w-full sm:w-auto"
              >
                Где AI помогает разработчикам →
              </a>
              <div className="pt-3 border-t border-white/10">
                <a
                  href="/vibe-coding"
                  className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" /> Назад на страницу вайбкодинга
                </a>
              </div>
            </div>
          </section>

          <section className="border-t border-white/10 pt-10">
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-6">FAQ</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-slate-300">
                <h3 className="text-base font-semibold text-slate-100 mb-2">Что такое Prompt-Driven Development?</h3>
                <p className="text-sm leading-relaxed">
                  Это метод работы с AI, при котором результат достигается через управляемый процесс, а не один запрос.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-slate-300">
                <h3 className="text-base font-semibold text-slate-100 mb-2">Чем он отличается от обычных промптов?</h3>
                <p className="text-sm leading-relaxed">
                  Обычный промпт — разовый запрос. PDD — цепочка итераций с управлением контекстом и качеством результата.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-slate-300">
                <h3 className="text-base font-semibold text-slate-100 mb-2">Можно ли использовать PDD без опыта разработки?</h3>
                <p className="text-sm leading-relaxed">
                  Можно, но без базового мышления результат будет ограничен. Метод усиливает понимание, а не заменяет его.
                </p>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};
