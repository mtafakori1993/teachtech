import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="container-x grid min-h-[60dvh] place-items-center py-16 text-center">
      <div className="max-w-md"><div className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-card text-brand-600"><SearchX className="size-9" aria-hidden /></div>
        <h1 className="text-2xl font-bold">صفحه‌ای که دنبالش بودید پیدا نشد</h1><p className="mt-2 text-ink-600">ممکن است نشانی را اشتباه وارد کرده باشید یا صفحه جابه‌جا شده باشد.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2"><Button href="/">صفحهٔ اصلی</Button><Button href="/courses" variant="outline">دوره‌ها</Button></div></div>
    </div>
  );
}
