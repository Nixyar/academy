# VibeCoderAI — Frontend

**English** · [Русский](README.ru.md)

React 19 + Vite single-page app for [vibecoderai.ru](https://vibecoderai.ru) —
an education platform for AI, prompt engineering and "vibe coding". Courses and
lessons, an interactive viewer with quizzes and AI exercises, progress tracking,
a prompt library, and paid course purchases.

The API it talks to lives in a separate repository:
[Nixyar/academy-backend](https://github.com/Nixyar/academy-backend).

> **Licensing:** this repository is source-visible but **not** open source.
> See [LICENSE](LICENSE) before reusing anything.

---

## Table of contents

- [Stack](#stack)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project layout](#project-layout)
- [Routing](#routing)
- [Talking to the backend](#talking-to-the-backend)
- [Auth flow](#auth-flow)
- [Build & deployment](#build--deployment)
- [Security notes](#security-notes)

---

## Stack

| Concern | Choice |
| --- | --- |
| UI | React 19, `lucide-react` icons, `recharts` |
| Build | Vite 6, TypeScript 5.8, terser minification |
| Auth | Supabase JS (PKCE) + httpOnly cookie sessions issued by the backend |
| Routing | Hand-rolled `history.pushState` routing — no router dependency |
| Styling | Tailwind, loaded in `index.html` |

There is no test runner and no linter wired up in this repository yet.

---

## Requirements

- Node.js **20.11.0** (see [`.nvmrc`](.nvmrc)) and npm
- A running instance of the backend API
- A Supabase project (URL + anon key)

```bash
nvm use
```

---

## Quick start

```bash
npm install
cp .env.example .env.local
cp .env.development.local.example .env.development.local   # optional local overrides
npm run dev
```

The dev server starts on <http://127.0.0.1:5173>. Requests to `/api` are proxied
to `http://localhost:3001` (override with `VITE_DEV_API`), so you can run the
frontend against a local backend without any CORS setup.

---

## Environment variables

Vite loads `.env.local` in every mode, and `.env.development.local` additionally
in development — the latter wins. Copy the `*.example` files and fill them in;
the real files are gitignored.

> **Everything prefixed `VITE_` is inlined into the browser bundle at build
> time and is therefore public.** Never put a private key here.

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | yes (prod) | Backend base URL. Ignored in dev, where the Vite proxy handles `/api`. |
| `VITE_SUPABASE_URL` | yes | Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | yes | Supabase **anon** key. Never the service_role key. |
| `VITE_GEMINI_API_KEY` | no | Enables direct browser→Gemini calls. See [Security notes](#security-notes). |
| `GEMINI_API_KEY` | no | Inlined by `vite.config.ts` as `process.env.API_KEY`. Same caveat. |
| `VITE_DEV_HOST` | no | Dev server bind host. Default `127.0.0.1`. |
| `VITE_DEV_API` | no | Dev proxy target. Default `http://localhost:3001`. |
| `SITE_URL` | no | Canonical origin for the generated sitemap. Default `https://vibecoderai.ru`. |

If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing,
`services/supabaseClient.ts` exports `null` and the app degrades gracefully
instead of crashing — but Google sign-in will not work.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 5173 with the `/api` proxy. |
| `npm start` | Alias for `dev`. |
| `npm run build` | Production build into `dist/`, then generates `dist/sitemap.xml`. |
| `npm run preview` | Serves the production build locally. |

---

## Project layout

```
├─ index.html               # Shell, SEO meta tags, Tailwind
├─ index.tsx                # React root
├─ App.tsx                  # Routing, session bootstrap, global state
├─ types.ts                 # Shared domain types
├─ data.ts                  # Static prompt library content
├─ metadata.json            # App name/description
├─ components/
│  ├─ Dashboard.tsx         # Course list and progress overview
│  ├─ CourseViewer.tsx      # Lesson player
│  ├─ BlockComponents.tsx   # Lesson block renderers (text, quiz, AI task, ...)
│  ├─ AiHelper.tsx          # In-lesson AI assistant
│  ├─ PromptLibrary.tsx     # Browsable prompt collection
│  ├─ Profile.tsx           # Account page
│  ├─ AuthModal.tsx  AuthCallback.tsx  ConsentModal.tsx
│  ├─ CourseModal.tsx  PurchaseCourseModal.tsx  PaymentResultModal.tsx
│  └─ useBodyScrollLock.ts
├─ services/
│  ├─ apiClient.ts          # fetch wrapper: retries, 401 refresh, ApiError
│  ├─ authApi.ts            # login/register/refresh/logout/me
│  ├─ supabaseClient.ts     # Supabase client (PKCE) + session cleanup
│  ├─ coursesApi.ts  lessonsApi.ts  progressApi.ts  localProgressApi.ts
│  ├─ purchasesApi.ts  paymentsApi.ts  subscriptionApi.ts
│  ├─ courseQuotaApi.ts  feedbackApi.ts  userFromProfile.ts
│  └─ geminiService.ts      # Direct browser→Gemini calls (lazy-loaded)
├─ scripts/generate-sitemap.mjs
└─ public/                  # Icons, manifest, robots.txt, legal PDFs
```

---

## Routing

There is no router library. `App.tsx` maps `location.pathname` to a view and
uses `history.pushState`:

| Path | View |
| --- | --- |
| `/` | Dashboard |
| `/courses/:slug` | Course viewer |
| `/library` | Prompt library |
| `/profile` | Profile |
| `/auth/callback` | OAuth callback handler |

Because this is an SPA, **the host must rewrite every unknown path to
`index.html`**, otherwise a hard refresh on `/profile` returns a 404.

---

## Talking to the backend

All calls go through `apiFetch` in [`services/apiClient.ts`](services/apiClient.ts),
which handles a few things for you:

- **Base URL** — empty in dev (the Vite proxy takes over), `VITE_API_BASE_URL`
  in production builds.
- **Credentials** — cookies are sent with every request.
- **Retries** — up to 2 retries with 500 ms / 1000 ms backoff on `502`, `503`
  and `504`.
- **Token refresh** — a `401` triggers `POST /api/auth/refresh`, then the
  original request is replayed once.
- **Errors** — non-2xx responses throw an `ApiError` carrying `status` and the
  parsed response body.

Progress is also mirrored to `localStorage` via
[`services/localProgressApi.ts`](services/localProgressApi.ts), so anonymous
visitors keep their progress and it can be merged after they sign in.

---

## Auth flow

1. **Email/password** — `POST /api/auth/login`; the backend sets httpOnly cookies.
2. **Google** — the Supabase client starts a PKCE flow and redirects to
   `/auth/callback`; `AuthCallback.tsx` exchanges the code and posts the tokens
   to `POST /api/auth/session`, which stores them as cookies.
3. Session state comes from `GET /api/me`.
4. On `401`, `apiClient` refreshes and retries transparently.
5. Logout calls `POST /api/auth/logout` and clears any `sb-*` keys from
   `localStorage` / `sessionStorage`.

Supabase is configured with `detectSessionInUrl: false` — the callback is
handled explicitly so the PKCE verifier survives the redirect round trip.

---

## Build & deployment

```bash
npm run build     # → dist/ (minified, console/debugger stripped) + sitemap.xml
npm run preview
```

`.github/workflows/deploy.yml` builds on every push to `master` and uploads
`dist/` to Reg.ru over FTP.

Required GitHub Actions secrets:

| Secret | Purpose |
| --- | --- |
| `FTP_SERVER` | FTP host. |
| `FTP_USERNAME` | FTP user. |
| `FTP_PASSWORD` | FTP password. |
| `FTP_SERVER_DIR` | Remote target directory. |

Build-time `VITE_*` values must be present in the workflow environment, or the
bundle ships without them. Since they end up public anyway, GitHub Actions
*variables* are a better fit than *secrets* for these.

Deployment checklist:

- [ ] `VITE_API_BASE_URL` points at the production API
- [ ] That origin is in the backend's `WEB_ORIGIN` allowlist
- [ ] SPA fallback rewrite to `index.html` is configured on the host
- [ ] The Supabase redirect URL list includes `https://<domain>/auth/callback`

---

## Security notes

- **Never commit a real `.env*.local`.** Only the `*.example` files belong here.
  `.env.local` was tracked in earlier history; it is untracked now and the
  `.gitignore` rules keep it that way.
- The Supabase **anon** key is public by design — it is meant to ship in the
  bundle and is protected by Row Level Security. The **service_role** key must
  never appear in this repository.
- ⚠️ **`VITE_GEMINI_API_KEY` / `GEMINI_API_KEY` are inlined into the bundle.**
  Anyone can extract them from the deployed JavaScript and spend your quota.
  `services/geminiService.ts` is lazy-loaded from `AiHelper.tsx` and
  `BlockComponents.tsx`; leaving both variables empty disables that path.
  The safe alternative is the backend's authenticated, rate-limited proxy at
  `POST /api/lessons/:lessonId/llm`.
- Auth tokens live in httpOnly cookies set by the backend, not in
  `localStorage`, so page scripts cannot read them.
