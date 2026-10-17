# Portfolio entry (tafakorpardazan.ir)

Published as linked Persian + English `tp_project` entries (WordPress + Polylang), category "Web apps":
- FA: https://tafakorpardazan.ir/projects/teachtech/  (post 267)
- EN: https://tafakorpardazan.ir/en/projects/teachtech-online-learning-platform/  (post 268)

## Re-publishing (idempotent: media reused by slug, posts updated by slug, never duplicated)
```bash
PORTFOLIO_USER=… PORTFOLIO_APP_PASSWORD="…" node scripts/portfolio-publish.mjs [--publish]
```
Credentials are environment-only. Default is draft.

## Cover (4:3 mockup)
1. `scripts/generate-mockup-scene.mjs` — OpenRouter (`openai/gpt-image-2.5-flare` via `/images`, or Gemini via chat) renders a *photographic* desk scene with a laptop and a phone whose screens are flat chroma-key green. The AI never draws the product UI.
2. `scripts/capture-portfolio.mjs` — genuine viewport screenshots of the live site (2×).
3. `scripts/compose-mockup.mjs` — fills the green screens with the real screenshots (`--crop` keeps devices inside the central ~75%, because the theme serves a 16:9 derivative into a 4:3 frame with `object-fit: cover`).
Gallery images come from `scripts/capture.mjs https://teachtech.shomaaa.ir`.

## SEO
Title = post title + " - تفکر پردازان" (site template, same as every project); meta description = excerpt; canonical, hreflang fa/en, Open Graph and breadcrumb schema are produced by the site's Yoast setup. A custom SEO-title override is not available through the REST API.
