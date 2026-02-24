import { PromptExample } from './types';

// Courses now come from API (fetchCourses) — no static data needed.

export const promptLibrary: PromptExample[] = [
  {
    id: 'prompt-1',
    title: 'Генератор SEO-статей',
    category: 'Генерация текста',
    description: 'Создает оптимизированную статью с ключевыми словами.',
    prompt: 'Напиши статью на тему "[ТЕМА]" длиной 1000 слов. Используй ключевые слова: [СПИСОК]. Структура: H1, введение, 3 раздела H2, заключение. Тон экспертный.',
    explanation: 'Четкое задание структуры и объема помогает модели не "лить воду".'
  },
  {
    id: 'prompt-2',
    title: 'React Компонент с Tailwind',
    category: 'Код',
    description: 'Быстрое создание UI компонентов.',
    prompt: 'Создай React компонент "Card" с использованием Tailwind CSS. Он должен принимать props: title, image, description. Добавь эффект hover с увеличением тени. Используй TypeScript.',
    explanation: 'Указание стека технологий (React, Tailwind, TS) критично для рабочего кода.'
  },
  {
    id: 'prompt-3',
    title: 'Объяснение сложной концепции',
    category: 'Творчество',
    description: 'Для обучения и понимания нового.',
    prompt: 'Объясни мне квантовую запутанность так, как будто я 10-летний школьник, который любит видеоигры. Используй аналогии.',
    explanation: 'Техника "ELI5" (Explain Like I\'m 5) с привязкой к интересам пользователя.'
  },
  {
    id: 'prompt-4',
    title: 'SWOT Анализ',
    category: 'Анализ данных',
    description: 'Стратегический анализ продукта или идеи.',
    prompt: 'Проведи SWOT-анализ для [ИДЕЯ ПРОДУКТА]. Представь результат в виде таблицы. Укажи по 3 пункта в каждой категории.',
    explanation: 'Требование табличного вывода структурирует ответ для удобного чтения.'
  }
];
