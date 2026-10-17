# QA report (local production build, 2026-10-18)

| Check | Command | Result |
|---|---|---|
| Type check | `npx tsc --noEmit` | pass |
| Lint | `npx eslint` | pass, 0 warnings |
| Production build | `npm run build` | pass (all routes) |
| Unit tests | `npm test` | 50 / 50 pass |
| E2E (Playwright, desktop + mobile) | `npm run test:e2e` | 75 / 75 pass (1 retry allowed) |
| E2E vs. hardened Docker image | `BASE_URL=… playwright test pwa public` | 14 / 14 pass |

Unit coverage: filtering/search/sort, cart totals, discount rules, simulated checkout outcomes, enrollment, quiz grading + retake + timer,
progress, certificate eligibility, role navigation, install-prompt state machine, store transitions (purchase → enroll → complete → quiz → certificate),
seed integrity (relations, totals, determinism, recomputed attempts).

E2E coverage: homepage, catalog filters/sort/empty state, course detail, 404, instructor profile, contact validation, login validation/session restore,
role denial, student dashboard sections, cart → discount → failed then successful checkout, lesson completion, notes persistence, resource download,
video playback/speed/resume, timed quiz with draft persistence and results, practice mode, certificate + print media + verification,
calendar, profile, corrupted storage, instructor CRUD (course, lesson, question, assignment review), admin (discount, order, enrollment, homepage, certificates),
PWA (manifest + icons, SW scope/headers/control, offline fallback, private-route non-caching, install banner, standalone suppression, iOS guidance, robots/sitemap),
no horizontal overflow at 360/390/430/768/1024/1440 on public + dashboard + learn + quiz pages, axe (WCAG A/AA, serious+critical) on public and student pages.

Defects found and fixed during QA: render loop from an unstable selector; SW first-install triggering a page reload; install event lost before hydration;
colour contrast (muted text, success tint); logo/account-button accessible names; decorative SVGs exposed as images; header overflow at 360px; implicit grid
columns causing overflow; seed inconsistency (practice attempt for a non-enrolled student); new courses hidden on later table pages.

## Not tested / not claimed
- The browser's *native* install UI (the page-level `beforeinstallprompt` flow is tested with a synthetic event) and real iOS Safari (UA emulation only).
- Lighthouse scores, Firefox/Safari engines, real screen readers. axe covers only automatically detectable issues.
- Production HTTPS and live-site behaviour: not deployed (see DEPLOYMENT.md — DNS record for `teachtech.shomaaa.ir` does not exist yet).
