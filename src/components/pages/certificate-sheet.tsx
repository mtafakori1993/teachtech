import { LogoMark } from "@/components/brand/logo";
import { formatDate, formatPercent } from "@/lib/format";
import type { Certificate } from "@/data/types";

/** Printable certificate. Locally modelled; carries an explicit non-official disclaimer. */
export function CertificateSheet({ c, requirement }: { c: Certificate; requirement?: string }) {
  return (
    <div className="cert-sheet relative mx-auto aspect-[297/210] w-full max-w-4xl overflow-hidden rounded-xl bg-white p-3 shadow-lift sm:p-5">
      <div className="relative flex h-full flex-col items-center justify-between rounded-lg border-[3px] border-brand-600 p-4 text-center sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-2 rounded-md border border-sun-400" />
        <div aria-hidden className="pointer-events-none absolute -top-16 -start-16 size-48 rounded-full bg-sun-400/30" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -end-16 size-56 rounded-full bg-brand-500/15" />
        <header className="relative flex flex-col items-center gap-1">
          <LogoMark className="size-12 sm:size-16" />
          <p className="text-[0.7rem] font-bold tracking-wide text-brand-700 sm:text-sm" dir="ltr">TeachTech</p>
          <p className="text-[0.65rem] text-ink-600 sm:text-sm">{c.academy}</p>
        </header>
        <div className="relative">
          <h1 className="text-xl font-bold text-brand-800 sm:text-4xl">گواهی پایان دوره</h1>
          <p className="mt-2 text-xs text-ink-600 sm:mt-4 sm:text-base">این گواهی تأیید می‌کند که</p>
          <p className="my-1 text-2xl font-bold sm:my-3 sm:text-5xl">{c.studentName}</p>
          <p className="text-xs text-ink-700 sm:text-lg">دورهٔ <b>«{c.courseTitle}»</b> را با موفقیت به پایان رسانده است.</p>
          <p className="mt-1 text-[0.65rem] text-ink-600 sm:mt-2 sm:text-sm">نمرهٔ آزمون پایانی: {formatPercent(c.scorePercent)}{requirement ? ` · ${requirement}` : ""}</p>
        </div>
        <footer className="relative grid w-full grid-cols-3 items-end gap-2 text-[0.6rem] sm:text-sm">
          <div><p className="font-bold">{c.instructorName}</p><p className="text-ink-600">مدرس دوره</p></div>
          <div><p className="font-bold">{formatDate(c.issuedAt)}</p><p className="text-ink-600">تاریخ صدور</p></div>
          <div><p className="font-bold tabular" dir="ltr">{c.id}</p><p className="text-ink-600">شناسهٔ گواهی</p></div>
        </footer>
        <p className="relative mt-2 text-[0.55rem] leading-4 text-ink-500 sm:text-xs">این گواهی از طرف آموزشگاه صادر شده و مدرک رسمی دولتی نیست؛ شناسهٔ آن به‌صورت محلی ثبت شده و از طریق سرور مستقل تأیید نمی‌شود.</p>
      </div>
    </div>
  );
}
