"use client";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleX, Undo2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Card, EmptyState, PageTitle, Skeleton } from "@/components/ui/primitives";
import { Field, Input } from "@/components/ui/form";
import { OrderSummary } from "./order-summary";
import { billingSchema, type PaymentOutcome } from "@/lib/checkout";
import { checkDiscount, computeTotals, lineFromCourse } from "@/lib/pricing";
import { formatToman } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useApp, useHydrated, useSessionUser } from "@/store/app";
import type { Course } from "@/data/types";

const OUTCOMES: { id: PaymentOutcome; label: string; hint: string; Icon: typeof CircleCheck }[] = [
  { id: "success", label: "پرداخت موفق", hint: "ثبت‌نام فعال می‌شود", Icon: CircleCheck },
  { id: "failed", label: "پرداخت ناموفق", hint: "دسترسی داده نمی‌شود", Icon: CircleX },
  { id: "cancelled", label: "انصراف از پرداخت", hint: "دسترسی داده نمی‌شود", Icon: Undo2 },
];

export function CheckoutView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useSessionUser();
  const cart = useApp((s) => s.cart);
  const courses = useApp((s) => s.courses);
  const discounts = useApp((s) => s.discounts);
  const code = useApp((s) => s.discountCode);
  const checkout = useApp((s) => s.checkout);
  const [outcome, setOutcome] = useState<PaymentOutcome>("success");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState("");
  const [busy, setBusy] = useState(false);

  const items = useMemo(() => cart.map((id) => courses.find((c) => c.id === id)).filter((c): c is Course => !!c), [cart, courses]);
  const lines = useMemo(() => items.map(lineFromCourse), [items]);
  const chk = code ? checkDiscount(code, discounts, lines) : null;
  const discount = chk && chk.ok ? chk.discount : null;
  const totals = computeTotals(lines, discount);

  if (!hydrated) return <Skeleton className="h-96" />;
  if (!user) return <EmptyState title="برای ثبت سفارش وارد شوید" action={<Button href="/login?next=/checkout">ورود به حساب</Button>}>سفارش به حساب شما متصل می‌شود تا دوره‌ها در داشبورد دیده شوند.</EmptyState>;
  if (user.role !== "student") return <EmptyState title="ثبت سفارش مخصوص دانش‌آموزان است" action={<Button onClick={() => useApp.getState().switchRole("student")}>تغییر به نقش دانش‌آموز (نمایشی)</Button>}>شما با نقش مدرس یا مدیر وارد شده‌اید.</EmptyState>;
  if (items.length === 0) return <EmptyState title="سبد خرید خالی است" action={<Button href="/courses">مشاهدهٔ دوره‌ها</Button>} />;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = billingSchema.safeParse({ fullName: fd.fullName, email: fd.email, phone: fd.phone });
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]))); return; }
    setErrors({}); setFormErr(""); setBusy(true);
    // short pause so the simulated "gateway" step is perceptible
    setTimeout(() => {
      const r = checkout({ billing: parsed.data, outcome });
      if (!r.ok) { setBusy(false); setFormErr(r.reason); return; }
      router.push(`/order/${r.order.id}`);
    }, 700);
  };

  return (
    <>
      <PageTitle title="ثبت سفارش">اطلاعات تماس را بررسی و نتیجهٔ پرداخت شبیه‌سازی‌شده را انتخاب کنید.</PageTitle>
      <form onSubmit={submit} noValidate className="grid gap-8 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Alert tone="warning" title="پرداخت شبیه‌سازی‌شده"><FlaskConical className="me-1 inline size-4" />درگاه پرداخت واقعی متصل نیست، اطلاعات کارت دریافت نمی‌شود و مبلغی کسر نمی‌شود. فقط «پرداخت موفق» دسترسی به دوره را فعال می‌کند.</Alert>
          {formErr && <Alert tone="danger">{formErr}</Alert>}
          <Card className="space-y-4 p-5">
            <h2 className="font-bold">اطلاعات تماس</h2>
            <Field label="نام و نام خانوادگی" error={errors.fullName}>{(p) => <Input {...p} name="fullName" defaultValue={user.name} autoComplete="name" />}</Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ایمیل" error={errors.email}>{(p) => <Input {...p} name="email" type="email" dir="ltr" className="text-end" defaultValue={user.email} autoComplete="email" />}</Field>
              <Field label="شمارهٔ موبایل" error={errors.phone} hint="مثال: ۰۹۱۲۳۴۵۶۷۸۹">{(p) => <Input {...p} name="phone" inputMode="numeric" dir="ltr" className="text-end" defaultValue={user.phone ?? ""} autoComplete="tel" />}</Field>
            </div>
          </Card>
          <fieldset className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <legend className="px-1 font-bold">نتیجهٔ پرداخت شبیه‌سازی‌شده</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {OUTCOMES.map(({ id, label, hint, Icon }) => (
                <label key={id} className={cn("flex min-h-20 cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand-500", outcome === id ? "border-brand-500 bg-card" : "border-line hover:border-brand-300")}>
                  <input type="radio" name="outcome" value={id} checked={outcome === id} onChange={() => setOutcome(id)} className="mt-1.5 size-4 accent-brand-600" />
                  <span><span className="flex items-center gap-1.5 font-medium"><Icon className="size-4" aria-hidden />{label}</span><span className="text-xs text-ink-600">{hint}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
          <Card className="p-5"><h2 className="mb-3 font-bold">دوره‌های سفارش</h2><ul className="divide-y divide-line text-sm">{items.map((c) => <li key={c.id} className="flex justify-between gap-3 py-2"><span>{c.title}</span><span className="tabular">{formatToman(c.price)}</span></li>)}</ul></Card>
        </div>
        <aside className="self-start lg:sticky lg:top-24"><Card className="space-y-5 p-5">
          <h2 className="font-bold">خلاصهٔ مبلغ</h2>
          <OrderSummary t={totals} code={discount?.code} />
          <Button type="submit" size="lg" variant="cta" className="w-full" loading={busy}>{outcome === "success" ? "ثبت سفارش (شبیه‌سازی‌شده)" : "ثبت نتیجهٔ آزمایشی"}</Button>
          <p className="text-xs text-ink-500">مبالغ به تومان است.</p>
        </Card></aside>
      </form>
    </>
  );
}
