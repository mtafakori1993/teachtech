# TeachTech — آموزش آنلاین و یادگیری هوشمند

Persian (RTL) online mathematics learning platform, commissioned by آموزشگاه کاویان for آقای امیر کاویان. Built by Tafakor Pardazan.
Target domain: `https://teachtech.shomaaa.ir`.

**Frontend-only.** There is no backend, database, payment gateway, real authentication or certificate-verification service.
All data is a deterministic seed (`src/data`) plus per-browser state persisted in `localStorage`.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS 4 · zustand (persisted store) · zod · lucide-react · KaTeX · Vazir (bundled locally) · Vitest · Playwright (+axe).

## Run
```bash
npm install
npm run dev          # http://localhost:3000   (service worker is registered in production only)
npm run build && npm start
npm run typecheck && npm run lint
npm test             # unit tests (Vitest)
npm run test:e2e     # Playwright against `next start` (starts it automatically on :3712)
```
`npm run icons` regenerates icons/OG image; `node scripts/generate-media.mjs` regenerates the sample lesson clip (needs ffmpeg);
`node scripts/capture.mjs <baseUrl>` captures the screenshots in `screenshots/`.

## Demo accounts (simulated login — see limitations)
| Role | Email | Lands on |
|---|---|---|
| Student (سارا موسوی) | `student@teachtech.example` | `/dashboard` |
| Instructor (امیر کاویان) | `instructor@teachtech.example` | `/instructor` |
| Academy admin | `admin@teachtech.example` | `/admin` |
Shared demo code: `teachtech` (not a secret). One-click buttons are on `/login`; the account menu has a role switcher.

## Discount codes (documented behaviour)
| Code | Rule |
|---|---|
| `TEACH10` | 10% of the whole cart, capped at 250,000 toman |
| `KAVIAN20` | 20% on c07/c10/c11/c13 lines only, cap 600,000 toman, min cart 1,000,000 toman |
| `WELCOME50` | 50,000 toman off, min cart 500,000 toman |
| `NOWRUZ` | expired · `STUDENT15` inactive (both are rejected with a reason) |
All money is integer **toman**, never rial. Codes are re-validated when the order is placed.

## Key behaviours
- **Checkout** is simulated: the user picks success / failed / cancelled. Only *success* creates enrollments and consumes the code; failed/cancelled orders are recorded but grant no access. No card data is collected.
- **Progress** counts completed lessons that still exist in the course. **Quizzes** are graded only from question data (MCQ, true/false, short answer with Persian-digit/fraction tolerance), with timer, autosave, marking, retake rules, practice mode.
- **Certificates** need all lessons completed **and** a pass (≥ course threshold) on the final quiz. IDs are locally generated and checked only against local data — not cryptographic, not government-recognised.
- **Video:** a short locally generated sample clip (`public/media/sample-lesson.webm`, Persian captions) demonstrates the player on the first lesson of each course. Other lessons show an honest step-by-step lesson board; no DRM or secure streaming is claimed.
- **Math** is rendered with KaTeX (`$...$` in questions/assignments).

## PWA
`app/manifest.ts` (id, scope `/`, standalone, maskable icons, shortcuts) · `sw/sw.template.js` stamped to `public/sw.js` at build (`scripts/stamp-sw.mjs`) so every release updates the worker ·
caches only the shell/static assets and *public* pages (network-first) · never caches `/api`, dashboards, learn/quiz/orders/certificates/cart/checkout/login or media/Range requests · offline fallback `/offline` ·
update prompt (user chooses when to reload) · install banner driven by `beforeinstallprompt` (captured early, shown once after a delay, native prompt only on click, 14-day dismissal memory, hidden when standalone) ·
iOS/other browsers get manual instructions (`/install`, footer, profile). Full offline video/course access is **not** supported.

## Documentation
- `docs/ARCHITECTURE.md` — structure, state model, persistence, security limitations
- `docs/DEPLOYMENT.md` — k3s deployment, DNS/TLS prerequisites, rollback
- `docs/QA-REPORT.md` — what was tested and the results
