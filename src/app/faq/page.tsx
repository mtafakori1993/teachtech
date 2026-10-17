import type { Metadata } from "next";
import { FAQS } from "@/data/content";
import { PageHero } from "@/components/pages/prose";
import { JsonLd } from "@/components/json-ld";
export const metadata: Metadata = { title: "سؤالات متداول", description: "پاسخ پرسش‌های رایج دربارهٔ دوره‌ها، خرید، گواهی، نصب اپلیکیشن و حساب کاربری TeachTech.", alternates: { canonical: "/faq" } };
const GROUPS = { general: "عمومی", buying: "خرید و پرداخت", learning: "یادگیری و گواهی", technical: "فنی و نصب" } as const;
export default function Faq() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <PageHero eyebrow="راهنما" title="سؤالات متداول">پاسخ پرسش‌های رایج؛ اگر پاسخ خود را پیدا نکردید با پشتیبانی تماس بگیرید.</PageHero>
      <div className="container-x max-w-3xl space-y-10 py-12">
        {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => (
          <section key={g} aria-labelledby={`g-${g}`}>
            <h2 id={`g-${g}`} className="mb-3 text-xl font-bold">{GROUPS[g]}</h2>
            <div className="divide-y divide-line rounded-lg border border-line bg-white shadow-soft">
              {FAQS.filter((f) => f.group === g).map((f) => (
                <details key={f.q} className="group px-5 py-1"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">{f.q}<span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-card text-brand-700 transition-transform group-open:rotate-45">+</span></summary><p className="pb-4 leading-8 text-ink-600">{f.a}</p></details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
