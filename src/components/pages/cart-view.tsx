"use client";
import { useMemo, useState } from "react";
import { ShoppingCart, Tag, Trash2, X } from "lucide-react";
import { CourseCover } from "@/components/brand/course-cover";
import { Price } from "@/components/course/price";
import { Button } from "@/components/ui/button";
import { EmptyState, PageTitle, Card, Alert } from "@/components/ui/primitives";
import { Input } from "@/components/ui/form";
import { OrderSummary } from "./order-summary";
import { toast } from "@/components/ui/toast";
import { computeTotals, lineFromCourse, checkDiscount } from "@/lib/pricing";
import { useApp } from "@/store/app";
import type { Course } from "@/data/types";
import { formatNumber } from "@/lib/format";

export function CartView() {
  const cart = useApp((s) => s.cart);
  const courses = useApp((s) => s.courses);
  const discounts = useApp((s) => s.discounts);
  const code = useApp((s) => s.discountCode);
  const remove = useApp((s) => s.removeFromCart);
  const apply = useApp((s) => s.applyDiscount);
  const removeDiscount = useApp((s) => s.removeDiscount);
  const [input, setInput] = useState("");
  const [err, setErr] = useState("");

  const items = useMemo(() => cart.map((id) => courses.find((c) => c.id === id)).filter((c): c is Course => !!c), [cart, courses]);
  const lines = useMemo(() => items.map(lineFromCourse), [items]);
  const applied = code ? checkDiscount(code, discounts, lines) : null;
  const discount = applied && applied.ok ? applied.discount : null;
  const totals = computeTotals(lines, discount);

  if (items.length === 0) return (<><PageTitle title="سبد خرید" /><EmptyState icon={<ShoppingCart className="size-6" />} title="سبد خرید شما خالی است" action={<Button href="/courses" variant="cta">مشاهدهٔ دوره‌ها</Button>}>دوره‌ای را انتخاب کنید و به سبد اضافه کنید.</EmptyState></>);

  return (
    <>
      <PageTitle title="سبد خرید">{formatNumber(items.length)} دوره در سبد شما است. هر دوره فقط یک‌بار قابل‌خرید است، پس تعداد ندارد.</PageTitle>
      <div className="grid gap-8 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_22rem]">
        <ul className="space-y-3">
          {items.map((c) => (
            <Card as="li" key={c.id} className="flex gap-4 p-3">
              <CourseCover art={c.art} seed={c.id} alt="" className="hidden aspect-[8/5] w-36 shrink-0 rounded-md sm:block" />
              <div className="flex-1"><h2 className="font-bold leading-7">{c.title}</h2><p className="text-sm text-ink-600">{c.subtitle}</p><Price className="mt-2" price={c.price} comparePrice={c.comparePrice} /></div>
              <Button variant="ghost" size="icon" aria-label={`حذف ${c.title} از سبد`} onClick={() => { remove(c.id); toast.info("از سبد خرید حذف شد."); }}><Trash2 className="size-5" /></Button>
            </Card>
          ))}
        </ul>
        <aside className="self-start lg:sticky lg:top-24" aria-label="خلاصهٔ سفارش">
          <Card className="space-y-5 p-5">
            <div>
              <label htmlFor="code" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"><Tag className="size-4" />کد تخفیف</label>
              {discount ? (
                <div className="flex items-center justify-between rounded-md bg-success-100 px-3 py-2 text-sm"><span><b dir="ltr">{discount.code}</b> اعمال شد</span><button onClick={removeDiscount} aria-label="حذف کد تخفیف" className="grid size-8 place-items-center rounded hover:bg-white"><X className="size-4" /></button></div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); const r = apply(input); if (r.ok) { setErr(""); setInput(""); toast.success("کد تخفیف اعمال شد."); } else setErr(r.reason ?? "کد معتبر نیست."); }} className="flex gap-2">
                  <Input id="code" dir="ltr" value={input} onChange={(e) => setInput(e.target.value)} placeholder="TEACH10" aria-invalid={!!err} aria-describedby={err ? "code-err" : undefined} className="text-end" />
                  <Button type="submit" variant="secondary">اعمال</Button>
                </form>
              )}
              {err && <p id="code-err" role="alert" className="mt-1.5 text-sm text-danger-600">{err}</p>}
              {code && applied && !applied.ok && <Alert tone="warning" className="mt-2">{applied.reason}<button className="ms-2 underline" onClick={removeDiscount}>حذف کد</button></Alert>}
              <p className="mt-2 text-xs text-ink-500">کدهای نمونه: TEACH10، KAVIAN20 (دوره‌های امتحان نهایی و کنکور)، WELCOME50</p>
            </div>
            <OrderSummary t={totals} code={discount?.code} />
            <Button href="/checkout" size="lg" variant="cta" className="w-full">ادامه و ثبت سفارش</Button>
          </Card>
        </aside>
      </div>
    </>
  );
}
