# Architecture

```
src/data      typed models + deterministic seed (courses-a/b, quizzes, catalog, content, seed.ts)
src/lib       pure, unit-tested logic: catalog filter/search, pricing & discounts, checkout, quiz grading, progress,
              certificates, role navigation, install-prompt state machine, analytics, storage adapter
src/store     zustand store (all mutable app state) + selector hooks
src/components ui primitives · layout · course · learn · quiz · dashboard · manage (instructor/admin) · pwa · pages
src/app       App Router routes (public pages are server-rendered/static; interactive areas are client components)
sw/           service-worker template;  scripts/ build helpers (icons, media, SW stamp, screenshots)
```

## State & persistence
One persisted store (`teachtech.state` in `localStorage`). `skipHydration` + rehydrate-after-mount means the first client render equals the
server render (no hydration mismatch). `merge` validates shape/version: malformed JSON, wrong types or an older `DATA_VERSION` fall back to the
seed. Storage failures (private mode/quota) fall back to memory. `safeLocalStorage` implements zustand's `StateStorage`, so a backend-backed
adapter can replace it. `resetAll()` restores the seed (profile → reset, admin → settings). Cross-tab changes are synced via the `storage` event.

## Roles and their limits
Student / instructor / admin are enforced **only in the UI** (`RoleGate`, `canEnter`). This is not a security boundary: anyone can edit
`localStorage`. Login is simulated and never handles real credentials. A real backend must re-implement authorisation server-side.

## Data model notes
Money = integer toman. Order totals use the same `computeTotals` as the cart. Seed attempts are graded by the same `gradeQuiz` used at runtime
(a unit test recomputes every seeded attempt). Sample ratings / enrolment counts are labelled as sample data in the UI.

## Known limitations
- No backend: data is per browser and not synchronised; nothing is verified server-side.
- Payments, login and certificate lookup are simulated; certificates are not official.
- Only the first lesson of each course has a (short, generic) sample video; no DRM.
- Contact form opens the user's mail client (`mailto:`); there is no message storage.
- Offline support is limited to repeat visits of public pages and the offline page.
