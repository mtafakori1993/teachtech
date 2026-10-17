"use client";
import Link from "next/link";
import { Download, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SITE } from "@/lib/config";
import { useInstall } from "@/components/pwa/install-provider";

const COLS = [
  { title: "یادگیری", links: [["/courses", "همهٔ دوره‌ها"], ["/courses?grade=12", "پایهٔ دوازدهم"], ["/courses?grade=11", "پایهٔ یازدهم"], ["/courses?grade=10", "پایهٔ دهم"], ["/resources", "منابع آموزشی"]] },
  { title: "TeachTech", links: [["/about", "دربارهٔ آموزشگاه"], ["/instructors/amir-kavian", "مدرس: امیر کاویان"], ["/verify", "استعلام گواهی"], ["/faq", "سؤالات متداول"], ["/contact", "تماس و پشتیبانی"]] },
  { title: "حساب کاربری", links: [["/login", "ورود"], ["/dashboard", "داشبورد دانش‌آموز"], ["/cart", "سبد خرید"], ["/dashboard/orders", "سفارش‌ها"]] },
] as const;

export function Footer() {
  const { openHelp, state } = useInstall();
  return (
    <footer className="mt-20 border-t border-line bg-card/60 pb-24 pt-12 lg:pb-10 print:hidden">
      <div className="container-x grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo tagline />
          <p className="mt-4 max-w-xs text-sm leading-7 text-ink-600">دوره‌های ریاضی دبیرستان با تدریس آقای امیر کاویان؛ به سفارش آموزشگاه کاویان.</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            <li className="flex items-center gap-2"><Mail className="size-4 text-brand-600" aria-hidden /><a href={`mailto:${SITE.supportEmail}`} dir="ltr" className="hover:text-brand-700">{SITE.supportEmail}</a></li>
            <li className="flex items-center gap-2"><Phone className="size-4 text-brand-600" aria-hidden /><a href={`tel:${SITE.supportPhoneTel}`} className="hover:text-brand-700">{SITE.supportPhone}</a></li>
            <li className="flex items-center gap-2"><MapPin className="size-4 text-brand-600" aria-hidden />پشتیبانی آنلاین · همهٔ روزهای هفته</li>
          </ul>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="mb-3 text-sm font-bold text-ink">{c.title}</h2>
            <ul className="space-y-2 text-sm">
              {c.links.map(([href, label]) => <li key={href}><Link href={href} className="inline-block py-1 text-ink-600 hover:text-brand-700">{label}</Link></li>)}
              {c.title === "TeachTech" && state.phase !== "installed" && (
                <li><button onClick={openHelp} className="inline-flex items-center gap-1.5 py-1 text-ink-600 hover:text-brand-700"><Download className="size-4" aria-hidden />نصب اپلیکیشن</button></li>
              )}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container-x mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-ink-600 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(1405)} TeachTech · طراحی و توسعه: {SITE.developer}</p>
        <p className="flex flex-wrap gap-x-4 gap-y-1"><Link href="/privacy" className="hover:text-brand-700">حریم خصوصی</Link><Link href="/terms" className="hover:text-brand-700">شرایط استفاده</Link></p>
      </div>
      <p className="container-x mt-3 text-xs leading-6 text-ink-500">در این نسخه ورود به حساب و پرداخت به‌صورت شبیه‌سازی‌شده انجام می‌شود؛ درگاه پرداخت واقعی متصل نیست و گواهی‌ها مدرک رسمی دولتی نیستند.</p>
    </footer>
  );
}
