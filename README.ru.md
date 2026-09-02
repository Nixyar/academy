# VibeCoderAI — Frontend

[English](README.md) · **Русский**

SPA на React 19 и Vite для [vibecoderai.ru](https://vibecoderai.ru) —
образовательной платформы по ИИ, промпт-инжинирингу и вайбкодингу. Курсы и
уроки, интерактивный плеер с квизами и ИИ-заданиями, отслеживание прогресса,
библиотека промптов и покупка платных курсов.

API вынесен в отдельный репозиторий:
[Nixyar/academy-backend](https://github.com/Nixyar/academy-backend).

> **Лицензия:** исходники открыты для чтения, но это **не** open source.
> Прежде чем что-то переиспользовать, посмотрите [LICENSE](LICENSE).

---

## Содержание

- [Стек](#стек)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Переменные окружения](#переменные-окружения)
- [Команды](#команды)
- [Структура проекта](#структура-проекта)
- [Маршрутизация](#маршрутизация)
- [Работа с бэкендом](#работа-с-бэкендом)
- [Авторизация](#авторизация)
- [Сборка и деплой](#сборка-и-деплой)
- [Безопасность](#безопасность)

---

## Стек

| Задача | Решение |
| --- | --- |
| UI | React 19, иконки `lucide-react`, графики `recharts` |
| Сборка | Vite 6, TypeScript 5.8, минификация terser |
| Авторизация | Supabase JS (PKCE) + сессии в httpOnly-куках от бэкенда |
| Маршрутизация | Своя, на `history.pushState` — без роутера |
| Стили | Tailwind, подключён в `index.html` |

Тесты и линтер в репозитории пока не настроены.

---

## Требования

- Node.js **20.11.0** (см. [`.nvmrc`](.nvmrc)) и npm
- Запущенный бэкенд
- Проект Supabase (URL и anon-ключ)

```bash
nvm use
```

---

## Быстрый старт

```bash
npm install
cp .env.example .env.local
cp .env.development.local.example .env.development.local   # локальные переопределения, по желанию
npm run dev
```

Dev-сервер поднимется на <http://127.0.0.1:5173>. Запросы к `/api` проксируются
на `http://localhost:3001` (адрес меняется переменной `VITE_DEV_API`), поэтому
фронтенд можно разрабатывать против локального бэкенда без настройки CORS.

---

## Переменные окружения

Vite читает `.env.local` во всех режимах, а в режиме разработки дополнительно
`.env.development.local` — и он имеет приоритет. Скопируйте файлы `*.example` и
заполните их; настоящие файлы уже в `.gitignore`.

> **Всё, что начинается на `VITE_`, попадает в браузерный бандл на этапе сборки
> и становится публичным.** Приватные ключи сюда класть нельзя.

| Переменная | Обязательная | Описание |
| --- | --- | --- |
| `VITE_API_BASE_URL` | да (в прод-сборке) | Базовый адрес бэкенда. В dev игнорируется — там работает прокси Vite. |
| `VITE_SUPABASE_URL` | да | URL проекта Supabase. |
| `VITE_SUPABASE_ANON_KEY` | да | **Anon**-ключ Supabase. Никогда не service_role. |
| `VITE_GEMINI_API_KEY` | нет | Включает прямые запросы из браузера в Gemini. См. [Безопасность](#безопасность). |
| `GEMINI_API_KEY` | нет | Подставляется в `vite.config.ts` как `process.env.API_KEY`. Та же оговорка. |
| `VITE_DEV_HOST` | нет | Хост, на котором слушает dev-сервер. По умолчанию `127.0.0.1`. |
| `VITE_DEV_API` | нет | Куда проксировать `/api` в разработке. По умолчанию `http://localhost:3001`. |
| `SITE_URL` | нет | Канонический адрес для генерации sitemap. По умолчанию `https://vibecoderai.ru`. |

Если `VITE_SUPABASE_URL` или `VITE_SUPABASE_ANON_KEY` не задан,
`services/supabaseClient.ts` возвращает `null`, и приложение не падает, а просто
работает без входа через Google.

---

## Команды

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Dev-сервер Vite на порту 5173 с прокси `/api`. |
| `npm start` | То же, что `dev`. |
| `npm run build` | Прод-сборка в `dist/`, затем генерация `dist/sitemap.xml`. |
| `npm run preview` | Локальный просмотр прод-сборки. |

---

## Структура проекта

```
├─ index.html               # Каркас страницы, SEO-теги, Tailwind
├─ index.tsx                # Точка входа React
├─ App.tsx                  # Маршрутизация, инициализация сессии, общее состояние
├─ types.ts                 # Общие типы предметной области
├─ data.ts                  # Статический контент библиотеки промптов
├─ metadata.json            # Название и описание приложения
├─ components/
│  ├─ Dashboard.tsx         # Список курсов и сводка прогресса
│  ├─ CourseViewer.tsx      # Плеер уроков
│  ├─ BlockComponents.tsx   # Рендеринг блоков урока (текст, квиз, ИИ-задание, ...)
│  ├─ AiHelper.tsx          # ИИ-помощник внутри урока
│  ├─ PromptLibrary.tsx     # Библиотека промптов
│  ├─ Profile.tsx           # Страница профиля
│  ├─ AuthModal.tsx  AuthCallback.tsx  ConsentModal.tsx
│  ├─ CourseModal.tsx  PurchaseCourseModal.tsx  PaymentResultModal.tsx
│  └─ useBodyScrollLock.ts
├─ services/
│  ├─ apiClient.ts          # Обёртка над fetch: ретраи, обновление токена по 401, ApiError
│  ├─ authApi.ts            # login/register/refresh/logout/me
│  ├─ supabaseClient.ts     # Клиент Supabase (PKCE) и очистка сессии
│  ├─ coursesApi.ts  lessonsApi.ts  progressApi.ts  localProgressApi.ts
│  ├─ purchasesApi.ts  paymentsApi.ts  subscriptionApi.ts
│  ├─ courseQuotaApi.ts  feedbackApi.ts  userFromProfile.ts
│  └─ geminiService.ts      # Прямые запросы в Gemini из браузера (ленивая загрузка)
├─ scripts/generate-sitemap.mjs
└─ public/                  # Иконки, манифест, robots.txt, юридические PDF
```

---

## Маршрутизация

Роутер-библиотека не используется. `App.tsx` сопоставляет `location.pathname` с
экраном и работает через `history.pushState`:

| Путь | Экран |
| --- | --- |
| `/` | Дашборд |
| `/courses/:slug` | Просмотр курса |
| `/library` | Библиотека промптов |
| `/profile` | Профиль |
| `/auth/callback` | Обработчик OAuth-редиректа |

Это SPA, поэтому **хостинг обязан отдавать `index.html` на любой неизвестный
путь**, иначе обновление страницы на `/profile` вернёт 404.

---

## Работа с бэкендом

Все запросы идут через `apiFetch` из [`services/apiClient.ts`](services/apiClient.ts),
который берёт на себя:

- **Базовый URL** — пустой в разработке (работает прокси Vite) и
  `VITE_API_BASE_URL` в прод-сборке.
- **Куки** — отправляются с каждым запросом.
- **Ретраи** — до 2 повторов с задержками 500 мс и 1000 мс на `502`, `503` и `504`.
- **Обновление токена** — по `401` вызывается `POST /api/auth/refresh`, после
  чего исходный запрос повторяется один раз.
- **Ошибки** — на ответ вне 2xx бросается `ApiError` с полями `status` и телом
  ответа.

Прогресс дублируется в `localStorage` через
[`services/localProgressApi.ts`](services/localProgressApi.ts): анонимный
посетитель не теряет прогресс, а после входа его можно смержить с серверным.

---

## Авторизация

1. **Почта и пароль** — `POST /api/auth/login`, куки выставляет бэкенд.
2. **Google** — клиент Supabase запускает PKCE-поток и редиректит на
   `/auth/callback`; `AuthCallback.tsx` обменивает код и отправляет токены в
   `POST /api/auth/session`, где они сохраняются в куки.
3. Состояние сессии приходит из `GET /api/me`.
4. При `401` `apiClient` незаметно обновляет токен и повторяет запрос.
5. Выход вызывает `POST /api/auth/logout` и чистит ключи `sb-*` из
   `localStorage` и `sessionStorage`.

У Supabase выставлен `detectSessionInUrl: false` — колбэк обрабатывается вручную,
чтобы PKCE-verifier пережил редирект.

---

## Сборка и деплой

```bash
npm run build     # → dist/ (минификация, вырезаны console и debugger) + sitemap.xml
npm run preview
```

`.github/workflows/deploy.yml` собирает проект при каждом пуше в `master` и
заливает `dist/` на Reg.ru по FTP.

Нужные секреты GitHub Actions:

| Секрет | Назначение |
| --- | --- |
| `FTP_SERVER` | Хост FTP. |
| `FTP_USERNAME` | Пользователь FTP. |
| `FTP_PASSWORD` | Пароль FTP. |
| `FTP_SERVER_DIR` | Целевая папка на сервере. |

Значения `VITE_*` должны присутствовать в окружении воркфлоу на момент сборки,
иначе бандл соберётся без них. Поскольку они всё равно становятся публичными,
для них лучше использовать *variables* GitHub Actions, а не *secrets*.

Чек-лист перед деплоем:

- [ ] `VITE_API_BASE_URL` указывает на боевой API
- [ ] Этот адрес добавлен в `WEB_ORIGIN` на бэкенде
- [ ] На хостинге настроен SPA-фолбэк на `index.html`
- [ ] В списке redirect-адресов Supabase есть `https://<домен>/auth/callback`

---

## Безопасность

- **Не коммитьте настоящие `.env*.local`.** В репозитории должны лежать только
  файлы `*.example`. Раньше `.env.local` попадал в коммиты — сейчас он снят с
  отслеживания, а правила `.gitignore` не дадут ему вернуться.
- **Anon**-ключ Supabase публичен по замыслу: он и должен уезжать в бандл, а
  защищает данные Row Level Security. Ключ **service_role** в этом репозитории
  появляться не должен никогда.
- ⚠️ **`VITE_GEMINI_API_KEY` и `GEMINI_API_KEY` встраиваются в бандл.** Любой
  желающий достанет их из опубликованного JavaScript и потратит вашу квоту.
  `services/geminiService.ts` подгружается лениво из `AiHelper.tsx` и
  `BlockComponents.tsx`; если обе переменные пустые, этот путь отключён.
  Безопасная альтернатива — прокси на бэкенде с авторизацией и лимитами:
  `POST /api/lessons/:lessonId/llm`.
- Токены авторизации лежат в httpOnly-куках, которые ставит бэкенд, а не в
  `localStorage`, поэтому скрипты страницы их не прочитают.
