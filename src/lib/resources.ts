import type { Course, Resource } from "@/data/types";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Builds a printable HTML study sheet from the course data (resources are modelled, not stored files). */
export function buildResourceHtml(r: Resource, course: Course): string {
  const body = course.sections.map((s) => `<h2>${esc(s.title)}</h2>` + s.lessons.map((l) =>
    `<h3>${esc(l.title)}</h3><p>${esc(l.summary)}</p><ul>${l.keyPoints.map((k) => `<li>${esc(k)}</li>`).join("")}</ul>` +
    (l.formulas.length ? `<pre dir="ltr">${l.formulas.map(esc).join("\n")}</pre>` : "")).join("")).join("");
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>${esc(r.title)}</title><style>body{font-family:Vazirmatn,Tahoma,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem;line-height:1.9;color:#1f2937}h1{color:#1e6bd8}pre{background:#eaf2ff;padding:.75rem;border-radius:8px;white-space:pre-wrap}</style></head><body><h1>${esc(r.title)}</h1><p>${esc(course.title)} — TeachTech، آموزشگاه کاویان</p>${body}</body></html>`;
}

export function downloadResource(r: Resource, course: Course) {
  const blob = new Blob([buildResourceHtml(r, course)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${course.slug}-${r.id}.html`; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
