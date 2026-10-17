import type { Metadata } from "next";
import { Mail, Phone, Clock } from "lucide-react";
import { PageHero } from "@/components/pages/prose";
import { ContactForm } from "@/components/pages/contact-form";
import { SITE } from "@/lib/config";
export const metadata: Metadata = { title: "تماس با ما", description: "راه‌های ارتباط با پشتیبانی TeachTech و آموزشگاه کاویان.", alternates: { canonical: "/contact" } };
export default function Contact() {
  return (
    <>
      <PageHero eyebrow="پشتیبانی" title="تماس با ما">برای انتخاب دوره، مشکل فنی یا لیست انتظار دوره‌های تکمیل‌شده پیام بدهید.</PageHero>
      <div className="container-x grid gap-8 py-12 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_20rem]">
        <ContactForm />
        <aside className="space-y-4 text-sm">
          {[[Mail, "ایمیل", SITE.supportEmail], [Phone, "تلفن / پیام‌رسان", SITE.supportPhone], [Clock, "ساعت پاسخ‌گویی", "همهٔ روزهای هفته، ۹ تا ۲۱"]].map(([I, t, v]) => {
            const Icon = I as typeof Mail;
            return <div key={t as string} className="flex items-start gap-3 rounded-lg border border-line bg-white p-4 shadow-soft"><Icon className="mt-1 size-5 text-brand-600" aria-hidden /><div><p className="font-bold">{t as string}</p><p className="text-ink-600" dir={t === "ایمیل" ? "ltr" : undefined}><a className="hover:text-brand-700 hover:underline" href={t === "ایمیل" ? `mailto:${v}` : `tel:${SITE.supportPhoneTel}`}>{v as string}</a></p></div></div>;
          })}
        </aside>
      </div>
    </>
  );
}
