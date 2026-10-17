import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "آفلاین", robots: { index: false } };

export default function OfflinePage() {
  return (
    <div className="container-x grid min-h-[60dvh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-card text-brand-600"><WifiOff className="size-9" aria-hidden /></div>
        <h1 className="text-2xl font-bold">اتصال به اینترنت برقرار نیست</h1>
        <p className="mt-3 text-ink-600">برای دیدن دوره‌ها، پخش درس‌ها و شرکت در آزمون‌ها به اینترنت نیاز دارید. صفحه‌هایی را که قبلاً باز کرده‌اید ممکن است همچنان در دسترس باشند.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button href="/">صفحهٔ اصلی</Button>
          <Button href="/courses" variant="outline">دوره‌ها</Button>
        </div>
        <p className="mt-6 text-xs text-ink-500">پخش ویدیو و دسترسی آفلاین به همهٔ دوره‌ها پشتیبانی نمی‌شود.</p>
      </div>
    </div>
  );
}
