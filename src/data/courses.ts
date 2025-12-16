import { Course } from '@/types';

export const courses: Course[] = [
  {
    id: 'web-basics',
    title: 'HTML5 и Структура',
    description: 'Освой скелет веба. Изучи семантический HTML и доступность.',
    level: 'Новичок',
    tech: 'HTML',
    image: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?q=80&w=1632&auto=format&fit=crop',
    accent: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316, #ef4444)',
    lessons: [
      {
        id: 'l1',
        title: 'Твой первый тег',
        content: 'HTML-элементы — это нейроны веба. Узнай, как использовать теги для создания структуры.',
        initialCode: '\n<h1 class="title">Привет, VibeCoderAI</h1>\n<p>Я готов кодить с AI!</p>\n\n<style>\n  .title { color: white; font-family: sans-serif; }\n</style>',
        challenge: 'Добавь элемент button (кнопку) под параграфом с текстом «Запустить AI».'
      },
      {
        id: 'l2',
        title: 'Списки и ссылки',
        content: 'Узнай, как связывать узлы сети и создавать списки с помощью тегов <ul>, <ol> и <a>.',
        initialCode: '<h3>Мой Тех-Стек</h3>\n<ul>\n  <li>HTML5</li>\n  <li>VibeCoder</li>\n  <li>React</li>\n</ul>',
        challenge: 'Преврати маркированный список (ul) в нумерованный (ol) и добавь ссылку на документацию.'
      }
    ]
  },
  {
    id: 'css-styling',
    title: 'CSS Стили и Неон',
    description: 'Визуализируй код. Изучи Flexbox, Grid и эффекты свечения.',
    level: 'Средний',
    tech: 'CSS',
    image: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?q=80&w=1470&auto=format&fit=crop',
    accent: '#38bdf8',
    gradient: 'linear-gradient(135deg, #38bdf8, #22d3ee)',
    lessons: [
      {
        id: 'c1',
        title: 'Флексбокс Матрица',
        content: 'Flexbox — это система управления пространством.',
        initialCode: '<div class="container">\n  <div class="box">AI</div>\n  <div class="box">WEB</div>\n  <div class="box">VIBE</div>\n</div>\n\n<style>\n  .container {\n    display: flex;\n    gap: 10px;\n    background: #0f172a;\n    padding: 20px;\n    border: 1px solid #334155;\n  }\n  .box {\n    background: #8b5cf6;\n    width: 60px;\n    height: 60px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    color: white;\n    font-family: monospace;\n    font-weight: bold;\n    box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);\n  }\n</style>',
        challenge: 'Измени flex-direction на \"column\" или justify-content на \"space-around\".'
      }
    ]
  },
  {
    id: 'js-logic',
    title: 'JavaScript Логика',
    description: 'Программируй поведение. Интерактивность, DOM и нейросети (почти).',
    level: 'Продвинутый',
    tech: 'JS',
    image: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?q=80&w=1470&auto=format&fit=crop',
    accent: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
    lessons: [
      {
        id: 'j1',
        title: 'Синтаксис и События',
        content: 'JavaScript — это язык, на котором говорит веб.',
        initialCode: '<button id="btn" style="padding: 10px 20px; font-size: 16px; background: #ec4899; color: white; border: none; cursor: pointer;">Инициализировать</button>\n<p id="msg" style="margin-top: 15px; font-family: monospace; color: #ec4899;"></p>\n\n<script>\n  const btn = document.getElementById(\"btn\");\n  const msg = document.getElementById(\"msg\");\n  \n  btn.addEventListener(\"click\", () => {\n    msg.innerText = \"> Система VibeCoderAI в норме...\";\n  });\n</script>',
        challenge: 'Измени сообщение в параграфе на что-то другое при клике на кнопку.'
      }
    ]
  }
];
