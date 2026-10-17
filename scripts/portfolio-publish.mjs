#!/usr/bin/env node
/**
 * Registers TeachTech as linked Persian + English "tp_project" entries on tafakorpardazan.ir (WordPress + Polylang REST API).
 * Credentials come from the environment only (never committed):
 *   PORTFOLIO_USER=… PORTFOLIO_APP_PASSWORD="xxxx xxxx …" node scripts/portfolio-publish.mjs [--publish] [--live-url=https://…]
 * Default status is `draft`. Idempotent: media are reused by slug, projects are updated by slug (never duplicated).
 * Language linking uses the site's own POST /tp/v1/translations endpoint.
 */
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SITE = process.env.PORTFOLIO_SITE ?? "https://tafakorpardazan.ir";
if (!process.env.PORTFOLIO_USER || !process.env.PORTFOLIO_APP_PASSWORD) { console.error("PORTFOLIO_USER / PORTFOLIO_APP_PASSWORD required"); process.exit(1); }
const AUTH = "Basic " + Buffer.from(`${process.env.PORTFOLIO_USER}:${process.env.PORTFOLIO_APP_PASSWORD}`).toString("base64");
const STATUS = process.argv.includes("--publish") ? "publish" : "draft";
const LIVE = process.argv.find((a) => a.startsWith("--live-url="))?.split("=")[1] ?? "https://teachtech.shomaaa.ir";

async function api(p, init = {}, tries = 8) {
  let last;
  for (let i = 1; i <= tries; i++) {
    try {
      const r = await fetch(`${SITE}/wp-json${p}`, { ...init, headers: { Authorization: AUTH, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(120_000) });
      const text = await r.text();
      const json = text ? JSON.parse(text.slice(text.indexOf(text.trimStart()[0] === "[" ? "[" : "{"))) : null;
      if (!r.ok) throw Object.assign(new Error(`${r.status} ${json?.message ?? ""}`), { status: r.status });
      return json;
    } catch (e) { last = e; if (e.status && e.status < 500) break; await new Promise((r) => setTimeout(r, 1500 * i)); }
  }
  throw last;
}
const post = (p, o) => api(p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) });

// Genuine screenshots of https://teachtech.shomaaa.ir (scripts/capture.mjs). The 4:3 cover is a photographic scene generated through
// OpenRouter whose device screens were filled with real screenshots (scripts/generate-mockup-scene.mjs + compose-mockup.mjs).
const images = [
  { src: "screenshots/portfolio/teachtech-mockup-4x3.webp", name: "teachtech-mockup-4x3", raw: true, alt: { fa: "TeachTech روی لپ‌تاپ و موبایل: صفحه اصلی سامانه آموزش آنلاین", en: "TeachTech on a laptop and a phone: the online learning platform homepage" } },
  { src: "screenshots/02-catalog-desktop.png", name: "teachtech-catalog", alt: { fa: "فهرست دوره‌ها با فیلتر پایه، سطح و قیمت", en: "Course catalog with grade, level and price filters" }, w: 1440 },
  { src: "screenshots/03-course-detail-desktop.png", name: "teachtech-course", alt: { fa: "صفحه دوره با سرفصل‌ها و پیش‌نمایش رایگان", en: "Course page with curriculum and free previews" }, w: 1440, crop: 1700 },
  { src: "screenshots/06-video-learning-desktop.png", name: "teachtech-learning", alt: { fa: "صفحه یادگیری با پخش‌کننده و سرفصل‌ها", en: "Learning page with the player and curriculum" }, w: 1440 },
  { src: "screenshots/05-student-dashboard-desktop.png", name: "teachtech-student-dashboard", alt: { fa: "داشبورد دانش‌آموز با پیشرفت و آزمون‌های پیش‌رو", en: "Student dashboard with progress and upcoming quizzes" }, w: 1440, crop: 1500 },
  { src: "screenshots/10-quiz-results-desktop.png", name: "teachtech-quiz-results", alt: { fa: "نتیجه آزمون با مرور پاسخ‌ها و فرمول‌ها", en: "Quiz results with answer review and equations" }, w: 1440, crop: 1700 },
  { src: "screenshots/12-certificate-desktop.png", name: "teachtech-certificate", alt: { fa: "گواهی پایان دوره قابل چاپ", en: "Printable completion certificate" }, w: 1440, crop: 900 },
  { src: "screenshots/14-instructor-dashboard-desktop.png", name: "teachtech-instructor", alt: { fa: "داشبورد مدرس", en: "Instructor dashboard" }, w: 1440, crop: 1100 },
  { src: "screenshots/17-admin-dashboard-desktop.png", name: "teachtech-admin", alt: { fa: "داشبورد مدیر آموزشگاه", en: "Academy admin dashboard" }, w: 1440, crop: 1100 },
  { src: "screenshots/20-home-mobile.png", name: "teachtech-mobile-home", alt: { fa: "صفحه اصلی در موبایل", en: "Homepage on mobile" }, w: 390, crop: 1700 },
  { src: "screenshots/24-pwa-install-banner-mobile.png", name: "teachtech-pwa-install", alt: { fa: "پیشنهاد نصب اپلیکیشن در موبایل", en: "App install suggestion on mobile" }, w: 390 },
];

async function uploadImage(img) {
  const found = await api(`/wp/v2/media?search=${img.name}&per_page=20&_fields=id,source_url,slug`);
  const hit = found.find((m) => m.slug === img.name || m.slug.replace(/-\d+$/, "") === img.name);
  if (hit) return hit;
  let buf;
  if (img.raw) buf = await sharp(path.join(ROOT, img.src)).toBuffer();
  else {
    let s = sharp(path.join(ROOT, img.src));
    if (img.crop) { const meta = await s.metadata(); s = s.extract({ left: 0, top: 0, width: meta.width, height: Math.min(meta.height, Math.round(img.crop * (meta.width / img.w))) }); }
    buf = await s.resize({ width: img.w, withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
  }
  const media = await api("/wp/v2/media", { method: "POST", headers: { "Content-Type": "image/webp", "Content-Disposition": `attachment; filename="${img.name}.webp"` }, body: buf });
  await post(`/wp/v2/media/${media.id}`, { alt_text: img.alt.fa, title: img.alt.fa });
  return { id: media.id, source_url: media.source_url };
}

const TECH = [
  { fa: ["Next.js", 218], en: ["Next.js", 295] }, { fa: ["React", 202], en: ["React", 249] }, { fa: ["TypeScript", 204], en: ["TypeScript", 257] },
  { fa: ["Tailwind CSS", 214], en: ["Tailwind CSS", 289] }, { fa: ["Docker", 210], en: ["Docker", 255] }, { fa: ["Kubernetes", 208], en: ["Kubernetes", 245] },
  { fa: ["PWA"], en: ["PWA"] }, { fa: ["Playwright"], en: ["Playwright"] },
];
async function ensureTerm(lang, name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + (lang === "en" ? "-en" : "");
  const found = await api(`/wp/v2/tp_technology?slug=${slug}&_fields=id,slug`);
  return found.length ? found[0].id : (await post(`/wp/v2/tp_technology?lang=${lang}`, { name, slug })).id;
}
const techIds = { fa: [], en: [] };
for (const t of TECH) {
  const fa = t.fa[1] ?? (await ensureTerm("fa", t.fa[0])); const en = t.en[1] ?? (await ensureTerm("en", t.en[0]));
  techIds.fa.push(fa); techIds.en.push(en);
  if (!t.fa[1]) await post("/tp/v1/translations", { kind: "term", translations: { fa, en } }).catch((e) => console.warn("term link", t.fa[0], e.message));
}

const media = {};
for (const img of images) { media[img.name] = await uploadImage(img); console.log("media", img.name, media[img.name].id); }
const byName = Object.fromEntries(images.map((i) => [i.name, i]));
const fig = (n, lang) => `<figure style="margin:0"><img src="${media[n].source_url}" alt="${byName[n].alt[lang]}" loading="lazy" style="width:100%;height:auto;display:block;border-radius:18px;border:1px solid rgba(47,128,237,.2);box-shadow:0 18px 40px -18px rgba(0,0,0,.5)"/></figure>`;
const shots = (names, lang) => `<!-- wp:html -->\n<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-block:24px">${names.map((n) => fig(n, lang)).join("")}</div>\n<!-- /wp:html -->`;
const h = (t) => `<!-- wp:heading -->\n<h2>${t}</h2>\n<!-- /wp:heading -->`;
const p = (t) => `<!-- wp:paragraph -->\n<p>${t}</p>\n<!-- /wp:paragraph -->`;
const ul = (items) => `<!-- wp:list -->\n<ul class="wp-block-list">${items.map((i) => `<li>${i}</li>`).join("")}</ul>\n<!-- /wp:list -->`;
const btn = (label) => `<!-- wp:html -->\n<p style="margin-block:24px"><a href="${LIVE}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#F2994A;color:#1F2937;font-weight:700;text-decoration:none">${label}</a></p>\n<!-- /wp:html -->`;

const CONTENT = {
  fa: [
    p("<strong>سامانه جامع آموزش مجازی و مدیریت دوره‌های آموزشی ویژه آموزشگاه کاویان</strong>"),
    btn("مشاهده سامانه TeachTech: teachtech.shomaaa.ir"),
    p("سامانه TeachTech با هدف ایجاد تجربه‌ای یکپارچه برای ارائه دوره‌های آموزشی، مدیریت فرایند یادگیری و دسترسی آسان دانش‌آموزان به محتوای آموزشی طراحی و توسعه یافته است. این پلتفرم با تمرکز بر آموزش ریاضی و نیازهای آموزشگاه کاویان، بستری منظم برای معرفی دوره‌ها، مشاهده محتوای آموزشی و پیگیری پیشرفت تحصیلی فراهم می‌کند."),
    p("در طراحی این سامانه، تجربه کاربری فارسی، نمایش صحیح راست‌چین، سازگاری با دستگاه‌های مختلف و دسترسی آسان از طریق موبایل مورد توجه قرار گرفته است."),
    p("این پروژه به سفارش <strong>آموزشگاه کاویان</strong> و <strong>آقای امیر کاویان</strong>، مدرس ریاضی، توسط شرکت <strong>تفکر پردازان</strong> توسعه داده شده است."),
    shots(["teachtech-mockup-4x3"], "fa"),
    h("قابلیت‌های پروژه"),
    ul(["طراحی و پیاده‌سازی فروشگاه دوره‌های آموزشی: فهرست دوره‌ها با جست‌وجو و فیلتر پایه، مبحث، سطح و قیمت، سبد خرید و کد تخفیف (پرداخت در این نسخه شبیه‌سازی‌شده است)", "معرفی دوره‌ها، سرفصل‌ها، درس‌های پیش‌نمایش رایگان و پروفایل مدرس", "رابط یادگیری: مشاهده جلسات با پخش‌کننده ویدیو (سرعت پخش، زیرنویس، ادامه از آخرین نقطه)، یادداشت، نشانه‌گذاری و پرسش و پاسخ هر درس", "داشبورد دانش‌آموز: پیشرفت یادگیری، ادامه درس، تقویم و برنامه مطالعه، سفارش‌ها و پروفایل", "آزمون‌های آنلاین زمان‌دار با تصحیح خودکار، حالت تمرین و نمایش نتایج و توضیح پاسخ‌ها", "گواهی پایان دوره با شرط تکمیل درس‌ها و قبولی در آزمون، قابل چاپ یا ذخیره به‌صورت PDF (گواهی رسمی دولتی نیست)", "پنل‌های مدیریت: داشبورد مدرس (دوره‌ها، سرفصل‌ها، بانک سؤال، بررسی تکلیف) و داشبورد مدیر آموزشگاه (دوره‌ها، سفارش‌ها، کد تخفیف، گواهی‌ها، تنظیمات)", "طراحی واکنش‌گرا و راست‌چین برای موبایل، تبلت و دسکتاپ", "وب‌اپلیکیشن قابل نصب (PWA): مانیفست، آیکون، سرویس‌ورکر، صفحه آفلاین و راهنمای نصب برای iPhone؛ پخش ویدیو و دسترسی کامل به دوره‌ها در حالت آفلاین پشتیبانی نمی‌شود"]),
    shots(["teachtech-catalog", "teachtech-course", "teachtech-learning", "teachtech-quiz-results"], "fa"),
    shots(["teachtech-student-dashboard", "teachtech-instructor", "teachtech-admin", "teachtech-certificate"], "fa"),
    shots(["teachtech-mobile-home", "teachtech-pwa-install"], "fa"),
    h("فناوری و کیفیت"),
    p("Next.js (App Router)، React، TypeScript سخت‌گیر، Tailwind CSS و فونت وزیر (محلی). ۵۰ تست واحد و ۷۵ تست انتها‌به‌انتها با Playwright (شامل PWA، واکنش‌گرایی از ۳۶۰ تا ۱۴۴۰ پیکسل و بررسی دسترس‌پذیری با axe). استقرار دستی با Docker روی Kubernetes (k3s) و HTTPS."),
    h("وضعیت و محدودیت‌ها"),
    p("نسخه فعلی <strong>فقط فرانت‌اند</strong> است: ورود، پرداخت و استعلام گواهی شبیه‌سازی‌شده‌اند، داده‌ها فقط در مرورگر کاربر ذخیره می‌شوند و سرور یا درگاه پرداخت واقعی متصل نیست. امتیازها و آمار نمایش‌داده‌شده نمونه هستند."),
    h("مشخصات پروژه"),
    ul(["سفارش‌دهنده: آموزشگاه کاویان · مدرس ریاضی: آقای امیر کاویان", "حوزه: آموزش آنلاین ریاضی · زبان: فارسی · طراحی: واکنش‌گرا و راست‌چین", `وب‌سایت: <a href="${LIVE}" target="_blank" rel="noopener">${LIVE}</a>`, "طراحی و توسعه: تفکر پردازان — <a href=\"https://tafakorpardazan.ir\">tafakorpardazan.ir</a>"]),
    btn("مشاهده سامانه TeachTech"),
  ].join("\n\n"),
  en: [
    p("<strong>A Persian-first online education platform designed for mathematics courses and digital learning.</strong>"),
    btn("Visit TeachTech: teachtech.shomaaa.ir"),
    p("TeachTech is an online learning platform developed to provide a structured and accessible educational experience for Kavian Academy. Focused initially on mathematics education, the platform brings course discovery, learning content, student progress, and educational workflows together in a responsive interface."),
    p("The project emphasizes Persian-language usability, right-to-left layouts, mobile accessibility, and a consistent learning experience across desktop and mobile devices."),
    p("TeachTech was commissioned by <strong>Kavian Academy</strong> and <strong>Mr. Amir Kavian</strong>, a mathematics teacher, and developed by <strong>Tafakor Pardazan</strong>."),
    shots(["teachtech-mockup-4x3"], "en"),
    h("Key features"),
    ul(["A course storefront: catalog with search and grade, topic, level and price filters, a cart and discount codes (payment is simulated in this release)", "Course introductions, curricula, free preview lessons and an instructor profile", "A learning interface: lessons with a video player (playback speed, captions, resume position), notes, bookmarks and per-lesson Q&A", "A student dashboard: learning progress, continue learning, calendar and study plan, orders and profile", "Timed online quizzes with automatic grading, a practice mode, results and answer explanations", "Completion certificates that require finished lessons and a passing quiz; printable or savable as PDF (not an official government credential)", "Management panels: an instructor dashboard (courses, curriculum, question bank, assignment review) and an academy-admin dashboard (courses, orders, discount codes, certificates, settings)", "A responsive, right-to-left design for mobile, tablet and desktop", "An installable web app (PWA): manifest, icons, service worker, offline page and iPhone install instructions; video playback and full offline course access are not supported offline"]),
    shots(["teachtech-catalog", "teachtech-course", "teachtech-learning", "teachtech-quiz-results"], "en"),
    shots(["teachtech-student-dashboard", "teachtech-instructor", "teachtech-admin", "teachtech-certificate"], "en"),
    shots(["teachtech-mobile-home", "teachtech-pwa-install"], "en"),
    h("Technology and quality"),
    p("Next.js (App Router), React, strict TypeScript, Tailwind CSS and a locally bundled Vazir font. 50 unit tests and 75 end-to-end tests with Playwright (covering the PWA, responsiveness from 360 to 1440px and accessibility checks with axe). Manually deployed with Docker on Kubernetes (k3s) over HTTPS."),
    h("Status and limitations"),
    p("The current release is <strong>frontend-only</strong>: login, payment and certificate lookup are simulated, data is stored only in the user's browser, and no server or real payment gateway is connected. Displayed ratings and counts are sample data."),
    h("Project details"),
    ul(["Commissioned by: Kavian Academy · Mathematics teacher: Mr. Amir Kavian", "Industry: Online education (mathematics) · Language: Persian · Design: responsive, right-to-left", `Website: <a href="${LIVE}" target="_blank" rel="noopener">${LIVE}</a>`, "Designed and developed by Tafakor Pardazan — <a href=\"https://tafakorpardazan.ir/en/home/\">tafakorpardazan.ir</a>"]),
    btn("Visit TeachTech"),
  ].join("\n\n"),
};

// Category: the existing "Web apps" term (FA 186 / EN 224). Excerpt doubles as the meta description (the site's Yoast setup derives it from the excerpt).
const META = {
  fa: { title: "طراحی و توسعه سامانه آموزش آنلاین TeachTech", slug: "teachtech", cat: [186],
    seoTitle: "طراحی سامانه آموزش آنلاین TeachTech | تفکر پردازان",
    excerpt: "معرفی پروژه TeachTech، سامانه آموزش آنلاین و مدیریت دوره‌های آموزشی به سفارش آموزشگاه کاویان و آقای امیر کاویان، توسعه‌یافته توسط تفکر پردازان." },
  en: { title: "TeachTech — Online Learning Platform for Kavian Academy", slug: "teachtech-online-learning-platform", cat: [224],
    seoTitle: "TeachTech Online Learning Platform | Tafakor Pardazan",
    excerpt: "Explore TeachTech, an online learning platform developed by Tafakor Pardazan for Kavian Academy, commissioned by mathematics teacher Amir Kavian." },
};

const ids = {};
for (const lang of ["fa", "en"]) {
  const m = META[lang];
  const body = { title: m.title, slug: m.slug, status: STATUS, excerpt: m.excerpt, content: CONTENT[lang], featured_media: media["teachtech-mockup-4x3"].id, tp_project_category: m.cat, tp_technology: techIds[lang], meta: { _yoast_wpseo_title: m.seoTitle, _yoast_wpseo_metadesc: m.excerpt } };
  const existing = await api(`/wp/v2/tp_project?slug=${m.slug}&status=any&context=edit&_fields=id`);
  const res = existing.length ? await post(`/wp/v2/tp_project/${existing[0].id}`, body) : await post(`/wp/v2/tp_project?lang=${lang}`, body);
  ids[lang] = res.id;
  console.log(lang, JSON.stringify(await api(`/wp/v2/tp_project/${res.id}?context=edit&_fields=id,status,meta`)));
}
await post("/tp/v1/translations", { kind: "post", translations: ids });
for (const lang of ["fa", "en"]) console.log("final", lang, JSON.stringify(await api(`/wp/v2/tp_project/${ids[lang]}?context=edit&_fields=id,status,link,permalink_template,yoast_head_json.title`)));
