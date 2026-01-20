<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1F1_d45RhWruLCmKeX7obitjFCETvuH3h

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set env vars in `.env.local`:
   - `GEMINI_API_KEY` (Gemini API key)
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Supabase project settings → API)
   - `VITE_API_BASE_URL=https://api.vibecoderai.ru` (текущий прод-бэкенд)
3. Run the app:
   `npm run start`

## Auth (frontend ↔ backend)

- OAuth callback route: `/auth/callback` (добавьте в Supabase Auth → URL Configuration → Redirect URLs)
- After Supabase login, frontend calls:
  - `POST /api/auth/session` with `{ access_token, refresh_token }` to store httpOnly cookies
  - `POST /api/auth/login` with `{ email, password }` to authenticate via email/password
  - `POST /api/auth/register` with `{ name, email, password }` to create an account
  - `GET /api/me` to load the user profile
  - `POST /api/auth/logout` to clear auth cookies
  - `POST /api/auth/refresh` to refresh cookies on 401 (used internally by the frontend)

### Important about local dev

Если запускать фронтенд на `http://localhost:5173` и бэкенд на `https://api.vibecoderai.ru`, то cookies с `SameSite=Lax` не будут отправляться в XHR/fetch (это разные “site”). Для работы нужно:
- либо поднять фронт на домене внутри `vibecoderai.ru` (например, `https://app.vibecoderai.ru`), тогда `app.*` ↔ `api.*` — same-site и cookies будут ходить,
- либо иметь dev-бэкенд, который ставит cookies с `SameSite=None; Secure` для кросс-сайта.

### Prod checklist

- Supabase Auth → URL Configuration:
  - Site URL: ваш реальный origin фронта (например `https://vibecoderai.ru` или `https://www.vibecoderai.ru`)
  - Redirect URLs: добавьте `https://<frontend-origin>/auth/callback`
- Backend CORS (если фронт и API на разных origin):
  - `Access-Control-Allow-Origin` должен быть ровно `<frontend-origin>` (не `*`, если вы используете cookies)
  - `Access-Control-Allow-Credentials: true`

## Lesson Blocks (JSON Format)

The `CourseViewer` component supports the following lesson block types:

### 1. Divider
A simple horizontal line.
```json
{ "type": "divider" }
```

### 2. List
A bulleted list with an optional copyable prompt.
```json
{
  "type": "list",
  "content": "Description before list",
  "items": ["Item 1", "Item 2"],
  "prompt": "Optional prompt to copy"
}
```

### 3. Tip
Highlighted box for practical advice.
```json
{
  "type": "tip",
  "content": "The advice text"
}
```

### 4. Comparison
Side-by-side comparison of two examples (e.g., bad vs good).
```json
{
  "type": "comparison",
  "title": "Comparison Title",
  "leftTitle": "Bad",
  "leftContent": "Ineffective prompt",
  "rightTitle": "Good",
  "rightContent": "Optimized prompt"
}
```

### 5. Practice Step
A task for the student with a copyable prompt.
```json
{
  "type": "practice_step",
  "content": "Instructions for the student",
  "prompt": "The prompt to use in AI"
}
```

### 6. Reflection Task
Indigo-highlighted card for thought exercises.
```json
{
  "type": "reflection_task",
  "title": "Exercise Title",
  "content": "Reflection description"
}
```

### 7. Interactive Table (Cheat Sheet)
A structured table with columns for Element, Questions, and Example.
```json
{
  "type": "interactive_table",
  "title": "Table Title",
  "description": "Subtitle",
  "rows": [
    {
      "element": "Step 1",
      "questions": "Questions to ask",
      "example": "Sample answer"
    }
  ]
}
```
