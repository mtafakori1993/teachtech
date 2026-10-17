#!/usr/bin/env node
/**
 * Registers TeachTech as linked Persian + English "tp_project" entries on tafakorpardazan.ir (WordPress REST API).
 * Credentials come from the environment only (never committed):
 *   PORTFOLIO_USER=… PORTFOLIO_APP_PASSWORD="xxxx xxxx …" node scripts/portfolio-publish.mjs [--publish] [--live-url=https://…]
 * Default status is `draft`. Pass --live-url only after the deployment has been verified; without it no live link or "live" wording is added.
 * Idempotent: media are reused by slug, projects are updated by slug. Same conventions as the SHOMAAA publisher.
 */
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SITE = process.env.PORTFOLIO_SITE ?? "https://tafakorpardazan.ir";
if (!process.env.PORTFOLIO_USER || !process.env.PORTFOLIO_APP_PASSWORD) { console.error("PORTFOLIO_USER / PORTFOLIO_APP_PASSWORD required"); process.exit(1); }
const AUTH = "Basic " + Buffer.from(`${process.env.PORTFOLIO_USER}:${process.env.PORTFOLIO_APP_PASSWORD}`).toString("base64");
const STATUS = process.argv.includes("--publish") ? "publish" : "draft";
const LIVE = process.argv.find((a) => a.startsWith("--live-url="))?.split("=")[1];

async function api(p, init = {}, tries = 4) {
  let last;
  for (let i = 1; i <= tries; i++) {
    try {
      const r = await fetch(`${SITE}/wp-json${p}`, { ...init, headers: { Authorization: AUTH, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(120_000) });
      const text = await r.text();
      const json = text ? JSON.parse(text.slice(text.indexOf(text.trimStart()[0] === "[" ? "[" : "{"))) : null;
      if (!r.ok) throw Object.assign(new Error(`${r.status} ${json?.message ?? ""}`), { status: r.status });
      return json;
    } catch (e) { last = e; if (e.status && e.status < 500) break; await new Promise((r) => setTimeout(r, 2000 * i)); }
  }
  throw last;
}
const post = (p, o) => api(p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) });

const images = [
  { src: "screenshots/01-home-desktop.png", name: "teachtech-home", alt: { fa: "صفحه اصلی TeachTech در نسخه دسکتاپ", en: "TeachTech homepage on desktop" }, w: 1440, crop: 1500 },
  { src: "screenshots/02-catalog-desktop.png", name: "teachtech-catalog", alt: { fa: "فهرست دوره‌ها با فیلتر پایه، سطح و قیمت", en: "Course catalog with grade, level and price filters" }, w: 1440 },
  { src: "screenshots/03-course-detail-desktop.png", name: "teachtech-course", alt: { fa: "صفحه دوره با سرفصل‌ها و پیش‌نمایش رایگان", en: "Course page with curriculum and free previews" }, w: 1440, crop: 1700 },
  { src: "screenshots/05-student-dashboard-desktop.png", name: "teachtech-student-dashboard", alt: { fa: "داشبورد دانش‌آموز با پیشرفت و آزمون‌های پیش‌رو", en: "Student dashboard with progress and upcoming quizzes" }, w: 1440, crop: 1500 },
  { src: "screenshots/06-video-learning-desktop.png", name: "teachtech-learning", alt: { fa: "صفحه یادگیری با پخش‌کننده و سرفصل‌ها", en: "Learning page with the player and curriculum" }, w: 1440 },
  { src: "screenshots/10-quiz-results-desktop.png", name: "teachtech-quiz-results", alt: { fa: "نتیجه آزمون با مرور پاسخ‌ها و فرمول‌ها", en: "Quiz results with answer review and equations" }, w: 1440, crop: 1700 },
  { src: "screenshots/12-certificate-desktop.png", name: "teachtech-certificate", alt: { fa: "گواهی پایان دوره قابل چاپ", en: "Printable completion certificate" }, w: 1440, crop: 900 },
  { src: "screenshots/14-instructor-dashboard-desktop.png", name: "teachtech-instructor", alt: { fa: "داشبورد مدرس", en: "Instructor dashboard" }, w: 1440, crop: 1100 },
  { src: "screenshots/17-admin-dashboard-desktop.png", name: "teachtech-admin", alt: { fa: "داشبورد مدیر آموزشگاه", en: "Academy admin dashboard" }, w: 1440, crop: 1100 },
  { src: "screenshots/20-home-mobile.png", name: "teachtech-mobile-home", alt: { fa: "صفحه اصلی در موبایل", en: "Homepage on mobile" }, w: 390, crop: 1700 },
  { src: "screenshots/24-pwa-install-banner-mobile.png", name: "teachtech-pwa-install", alt: { fa: "پیشنهاد نصب اپلیکیشن در موبایل", en: "App install suggestion on mobile" }, w: 390 },
];

async function uploadImage(img) {
  const found = await api(`/wp/v2/media?search=${img.name}&per_page=20&_fields=id,source_url,slug`);
  const hit = found.find((m) => m.slug === img.name);
  if (hit) return hit;
  let s = sharp(path.join(ROOT, img.src));
  if (img.crop) { const meta = await s.metadata(); s = s.extract({ left: 0, top: 0, width: meta.width, height: Math.min(meta.height, Math.round(img.crop * (meta.width / img.w))) }); }
  const buf = await s.resize({ width: img.w, withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
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
const btn = (label) => LIVE ? `<!-- wp:html -->\n<p style="margin-block:24px"><a href="${LIVE}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#F2994A;color:#1F2937;font-weight:700;text-decoration:none">${label}</a></p>\n<!-- /wp:html -->` : "";

const CONTENT = {
  fa: [
    btn("مشاهده TeachTech"),
    p("TeachTech یک پلتفرم آموزش آنلاین ریاضی (راست‌چین و فارسی) است با دوره‌های ویدیویی، آزمون‌های تعاملی، داشبورد دانش‌آموز، مدرس و مدیر آموزشگاه و گواهی پایان دوره."),
    p("<strong>سفارش آموزشگاه کاویان</strong> · مدرس ریاضی: آقای امیر کاویان · طراحی و توسعه: تفکر پردازان"),
    shots(["teachtech-home"], "fa"),
    h("تجربهٔ یادگیری"),
    ul(["فهرست دوره‌ها با جست‌وجو و فیلتر پایه، مبحث، سطح، قیمت و مرتب‌سازی", "صفحهٔ دوره با سرفصل، درس‌های پیش‌نمایش رایگان، منابع و سؤالات متداول", "صفحهٔ یادگیری با پخش‌کنندهٔ ویدیو (سرعت، زیرنویس، ادامه از آخرین نقطه)، یادداشت، نشانه‌گذاری و پرسش و پاسخ هر درس", "آزمون زمان‌دار با تصحیح خودکار، علامت‌گذاری سؤال، حالت تمرین و مرور پاسخ‌ها همراه با فرمول‌های ریاضی (KaTeX)", "گواهی پایان دوره با شرط تکمیل درس‌ها و قبولی در آزمون، قابل چاپ یا ذخیره به‌صورت PDF"]),
    shots(["teachtech-catalog", "teachtech-course", "teachtech-learning", "teachtech-quiz-results"], "fa"),
    h("داشبوردها"),
    ul(["دانش‌آموز: پیشرفت، ادامهٔ یادگیری، تقویم و برنامهٔ مطالعه، آزمون‌ها، گواهی‌ها، سفارش‌ها و پروفایل", "مدرس: مدیریت دوره و سرفصل، بانک سؤال و آزمون، بررسی تکلیف نوشتاری، پرسش و پاسخ، اطلاعیه و تحلیل", "مدیر آموزشگاه: دوره‌ها، مدرسان، دانش‌آموزان، ثبت‌نام‌ها، سفارش‌ها، کد تخفیف، گواهی‌ها و تنظیمات"]),
    shots(["teachtech-student-dashboard", "teachtech-instructor", "teachtech-admin", "teachtech-certificate"], "fa"),
    h("اپلیکیشن قابل نصب (PWA) و موبایل"),
    p("مانیفست، آیکون‌ها (شامل maskable)، سرویس‌ورکر با کش محدود و صفحهٔ آفلاین، اعلان نسخهٔ جدید و بنر نصب غیرمزاحم برای مرورگرهای پشتیبان؛ برای iPhone راهنمای افزودن به صفحهٔ اصلی نمایش داده می‌شود. ویدیو و دوره‌ها به‌صورت آفلاین پشتیبانی نمی‌شوند."),
    shots(["teachtech-mobile-home", "teachtech-pwa-install"], "fa"),
    h("فناوری و کیفیت"),
    p("Next.js (App Router)، React، TypeScript سخت‌گیر، Tailwind CSS، فونت وزیر (محلی). ۵۰ تست واحد و ۷۵ تست انتها‌به‌انتها (Playwright) از جمله PWA، واکنش‌گرایی از ۳۶۰ تا ۱۴۴۰ پیکسل و بررسی دسترس‌پذیری با axe. استقرار دستی با Docker روی Kubernetes (k3s) آماده شده است."),
    h("وضعیت و محدودیت‌ها"),
    p("این نسخه <strong>فقط فرانت‌اند</strong> است: ورود، پرداخت و استعلام گواهی شبیه‌سازی‌شده‌اند، داده‌ها فقط در مرورگر کاربر ذخیره می‌شوند، درگاه پرداخت واقعی یا سرور متصل نیست و گواهی‌ها مدرک رسمی نیستند. امتیازها و آمار نمایش‌داده‌شده نمونه هستند."),
    h("مشخصات پروژه"),
    ul(["سفارش‌دهنده: آموزشگاه کاویان (مدرس: آقای امیر کاویان)", "حوزه: آموزش آنلاین ریاضی · زبان: فارسی · طراحی: واکنش‌گرا و راست‌چین", "طراحی و توسعه: تفکر پردازان — <a href=\"https://tafakorpardazan.ir\">tafakorpardazan.ir</a>"]),
    btn("مشاهده TeachTech"),
  ].join("\n\n"),
  en: [
    btn("Visit TeachTech"),
    p("TeachTech is a Persian, right-to-left online mathematics learning platform with video lessons, interactive quizzes, student, instructor and academy-admin dashboards, and completion certificates."),
    p("<strong>Commissioned by Kavian Academy</strong> · Mathematics instructor: Mr. Amir Kavian · Designed and developed by Tafakor Pardazan"),
    shots(["teachtech-home"], "en"),
    h("Learning experience"),
    ul(["Course catalog with search, grade/topic/level/price filters and sorting", "Course pages with curriculum, free preview lessons, resources and FAQs", "A learning page with a video player (speed, captions, resume position), notes, bookmarks and per-lesson Q&A", "Timed quizzes with automatic grading, question marking, practice mode and answer review with typeset equations (KaTeX)", "Completion certificates that require finished lessons and a passing final quiz; printable or savable as PDF"]),
    shots(["teachtech-catalog", "teachtech-course", "teachtech-learning", "teachtech-quiz-results"], "en"),
    h("Dashboards"),
    ul(["Student: progress, continue learning, calendar and study plan, quizzes, certificates, orders and profile", "Instructor: course and curriculum management, question bank and quizzes, written-assignment review, Q&A, announcements and analytics", "Academy admin: courses, instructors, students, enrollments, orders, discount codes, certificates and settings"]),
    shots(["teachtech-student-dashboard", "teachtech-instructor", "teachtech-admin", "teachtech-certificate"], "en"),
    h("Installable app (PWA) and mobile"),
    p("Web app manifest, icons (including maskable), a service worker with deliberately limited caching and an offline page, an update notice, and a non-intrusive install banner on supporting browsers; iPhone users get add-to-home-screen instructions. Offline video or full offline course access is not supported."),
    shots(["teachtech-mobile-home", "teachtech-pwa-install"], "en"),
    h("Technology and quality"),
    p("Next.js (App Router), React, strict TypeScript, Tailwind CSS and a locally bundled Vazir font. 50 unit tests and 75 end-to-end tests (Playwright) covering the PWA, responsiveness from 360 to 1440px and accessibility checks with axe. A manual Docker/Kubernetes (k3s) deployment has been prepared."),
    h("Status and limitations"),
    p("This release is <strong>frontend-only</strong>: login, payment and certificate lookup are simulated, data lives only in the user's browser, no payment gateway or server is connected, and certificates are not official credentials. Displayed ratings and counts are sample data."),
    h("Project details"),
    ul(["Commissioned by: Kavian Academy (instructor: Mr. Amir Kavian)", "Industry: Online education (mathematics) · Language: Persian · Design: responsive, right-to-left", "Designed and developed by Tafakor Pardazan — <a href=\"https://tafakorpardazan.ir/en/home/\">tafakorpardazan.ir</a>"]),
    btn("Visit TeachTech"),
  ].join("\n\n"),
};

// No category ids are hard-coded: the education category on the portfolio site must be assigned in wp-admin (or added here once known).
const META = {
  fa: { title: "TeachTech؛ پلتفرم آموزش آنلاین ریاضی", slug: "teachtech", excerpt: "پلتفرم آموزش آنلاین ریاضی با دوره‌های ویدیویی، آزمون تعاملی، داشبورد دانش‌آموز/مدرس/مدیر، گواهی پایان دوره و اپلیکیشن قابل نصب؛ به سفارش آموزشگاه کاویان." },
  en: { title: "TeachTech — Online Mathematics Learning Platform", slug: "teachtech-online-learning-platform", excerpt: "An online mathematics learning platform with video lessons, interactive quizzes, student/instructor/admin dashboards, certificates and an installable app. Commissioned by Kavian Academy." },
};

const ids = {};
for (const lang of ["fa", "en"]) {
  const m = META[lang];
  const body = { title: m.title, slug: m.slug, status: STATUS, excerpt: m.excerpt, content: CONTENT[lang], featured_media: media["teachtech-home"].id, tp_technology: techIds[lang] };
  const existing = await api(`/wp/v2/tp_project?slug=${m.slug}&status=any&context=edit&_fields=id`);
  const res = existing.length ? await post(`/wp/v2/tp_project/${existing[0].id}`, body) : await post(`/wp/v2/tp_project?lang=${lang}`, body);
  ids[lang] = res.id;
  console.log(lang, JSON.stringify(await api(`/wp/v2/tp_project/${res.id}?context=edit&_fields=id,status,permalink_template`)));
}
await post("/tp/v1/translations", { kind: "post", translations: ids });
for (const lang of ["fa", "en"]) console.log("final", lang, JSON.stringify(await api(`/wp/v2/tp_project/${ids[lang]}?context=edit&_fields=id,status,link,permalink_template`)));
