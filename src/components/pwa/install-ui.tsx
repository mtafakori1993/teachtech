"use client";
import { usePathname } from "next/navigation";
import { Download, MoreVertical, PlusSquare, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { LogoMark } from "@/components/brand/logo";
import { canPromptNatively, useInstall } from "./install-provider";

const QUIET = [/^\/learn\//, /^\/quiz\//, /^\/certificate\//, /^\/checkout/, /^\/login/, /^\/offline/];

/** Non-intrusive bottom card. Never a blocking modal; shown once, dismissible, remembered. */
export function InstallBanner() {
  const { state, showBanner, install, dismissBanner, openHelp } = useInstall();
  const path = usePathname();
  if (!showBanner || QUIET.some((r) => r.test(path))) return null;
  const native = canPromptNatively(state);
  return (
    <aside aria-label="نصب اپلیکیشن" className="fixed inset-x-3 bottom-[4.75rem] z-50 mx-auto max-w-md animate-[sheet_0.4s_ease-out] rounded-xl border border-line bg-white p-4 shadow-pop lg:bottom-6 lg:end-6 lg:start-auto lg:mx-0">
      <button onClick={dismissBanner} aria-label="بستن پیشنهاد نصب" className="absolute end-2 top-2 grid size-9 place-items-center rounded-md text-ink-500 hover:bg-card"><X className="size-4" /></button>
      <div className="flex items-start gap-3 pe-6">
        <LogoMark className="size-12 shrink-0" />
        <div>
          <p className="font-bold">TeachTech را روی دستگاهتان نصب کنید</p>
          <p className="mt-0.5 text-sm text-ink-600">دسترسی سریع‌تر به دوره‌ها و میان‌بر روی صفحهٔ اصلی گوشی.</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {native ? (
          <Button size="sm" onClick={install}><Download className="size-4" />نصب اپلیکیشن</Button>
        ) : (
          <Button size="sm" onClick={openHelp}><Smartphone className="size-4" />راهنمای نصب</Button>
        )}
        <Button size="sm" variant="ghost" onClick={dismissBanner}>بعداً</Button>
      </div>
    </aside>
  );
}

export function InstallSteps() {
  const { state } = useInstall();
  const ios = state.phase === "ios-manual";
  return (
    <div className="space-y-5 text-sm leading-7">
      {ios ? (
        <ol className="space-y-3">
          <li className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-card font-bold text-brand-700">۱</span><span>در Safari روی دکمهٔ <b>اشتراک‌گذاری</b> <Share className="inline size-4 align-text-bottom text-brand-600" aria-label="آیکون اشتراک‌گذاری" /> بزنید.</span></li>
          <li className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-card font-bold text-brand-700">۲</span><span>گزینهٔ <b>Add to Home Screen</b> <PlusSquare className="inline size-4 align-text-bottom text-brand-600" aria-label="آیکون افزودن" /> را انتخاب کنید.</span></li>
          <li className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-card font-bold text-brand-700">۳</span><span>روی <b>Add</b> بزنید؛ آیکون TeachTech به صفحهٔ اصلی اضافه می‌شود.</span></li>
        </ol>
      ) : (
        <>
          <div>
            <p className="font-bold">Chrome / Edge / Samsung Internet (اندروید و رایانه)</p>
            <p className="text-ink-600">اگر دکمهٔ «نصب اپلیکیشن» دیده نمی‌شود، از منوی مرورگر <MoreVertical className="inline size-4 align-text-bottom" aria-label="منوی سه‌نقطه" /> گزینهٔ «Install app» یا «Add to Home screen» را بزنید.</p>
          </div>
          <div>
            <p className="font-bold">Safari در iPhone و iPad</p>
            <p className="text-ink-600">دکمهٔ اشتراک‌گذاری <Share className="inline size-4 align-text-bottom" aria-label="آیکون اشتراک‌گذاری" /> ← Add to Home Screen.</p>
          </div>
        </>
      )}
      <p className="rounded-md bg-card px-3 py-2 text-xs text-ink-600">نصب‌شده، مانند یک اپلیکیشن باز می‌شود. دسترسی کامل به دوره‌ها و پخش ویدیو در حالت آفلاین پشتیبانی نمی‌شود و به اینترنت نیاز دارید.</p>
    </div>
  );
}

export function InstallDialog() {
  const { helpOpen, closeHelp, state, install } = useInstall();
  return (
    <Dialog open={helpOpen} onClose={closeHelp} title="نصب TeachTech" description="افزودن به صفحهٔ اصلی دستگاه" size="sm"
      footer={<>
        {canPromptNatively(state) && <Button onClick={() => { closeHelp(); void install(); }}><Download className="size-4" />نصب اپلیکیشن</Button>}
        <Button variant="ghost" onClick={closeHelp}>بستن</Button>
      </>}>
      {state.phase === "installed" ? <p className="text-sm">TeachTech قبلاً روی این دستگاه نصب شده یا در حالت اپلیکیشن در حال اجراست.</p> : <InstallSteps />}
    </Dialog>
  );
}
