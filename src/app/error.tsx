"use client";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Generic boundary: never shows stack traces or internals to the user. */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x grid min-h-[60dvh] place-items-center py-16 text-center">
      <div className="max-w-md"><div className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-danger-100 text-danger-600"><TriangleAlert className="size-9" aria-hidden /></div>
        <h1 className="text-2xl font-bold">مشکلی پیش آمد</h1><p className="mt-2 text-ink-600">صفحه به‌درستی بارگذاری نشد. دوباره تلاش کنید؛ اگر ادامه داشت داده‌های محلی را از بخش پروفایل بازنشانی کنید.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2"><Button onClick={reset}>تلاش دوباره</Button><Button href="/" variant="outline">صفحهٔ اصلی</Button></div></div>
    </div>
  );
}
