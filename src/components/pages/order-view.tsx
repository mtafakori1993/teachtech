"use client";
import { CircleAlert, CircleCheck, CircleX, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Badge, Card, EmptyState, Skeleton } from "@/components/ui/primitives";
import { OrderSummary } from "./order-summary";
import { formatDateTime, formatToman } from "@/lib/format";
import { useApp, useHydrated, useSessionUser } from "@/store/app";
import type { OrderStatus } from "@/data/types";

export const STATUS: Record<OrderStatus, { label: string; tone: "success" | "danger" | "warning" | "neutral" }> = {
  paid: { label: "پرداخت‌شده (شبیه‌سازی‌شده)", tone: "success" }, failed: { label: "ناموفق", tone: "danger" }, cancelled: { label: "لغوشده", tone: "warning" }, pending: { label: "در انتظار", tone: "neutral" },
};

export function OrderView({ id }: { id: string }) {
  const hydrated = useHydrated();
  const user = useSessionUser();
  const order = useApp((s) => s.orders.find((o) => o.id === id));
  const courses = useApp((s) => s.courses);
  if (!hydrated) return <Skeleton className="h-80" />;
  if (!user) return <EmptyState title="برای دیدن سفارش وارد شوید" action={<Button href={`/login?next=/order/${id}`}>ورود</Button>} />;
  if (!order) return <EmptyState title="سفارش پیدا نشد" action={<Button href="/dashboard/orders">سفارش‌های من</Button>} />;
  if (order.userId !== user.id && user.role !== "admin") return <EmptyState title="این سفارش متعلق به حساب شما نیست" action={<Button href="/">صفحهٔ اصلی</Button>} />;
  const st = STATUS[order.status];
  const Icon = order.status === "paid" ? CircleCheck : order.status === "failed" ? CircleX : CircleAlert;
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`mx-auto mb-3 grid size-16 place-items-center rounded-full ${order.status === "paid" ? "bg-success-100 text-success-600" : "bg-danger-100 text-danger-600"}`}><Icon className="size-8" aria-hidden /></div>
        <h1 className="text-2xl font-bold">{order.status === "paid" ? "ثبت‌نام شما انجام شد" : order.status === "failed" ? "پرداخت ناموفق بود" : "پرداخت لغو شد"}</h1>
        <p className="mt-1 text-ink-600">سفارش <b dir="ltr">{order.number}</b> · {formatDateTime(order.createdAt)}</p>
      </div>
      <Alert tone={order.status === "paid" ? "success" : "warning"} title={order.status === "paid" ? "دسترسی به دوره‌ها فعال شد" : "هیچ دسترسی‌ای فعال نشد"}>
        {order.status === "paid" ? "این یک پرداخت شبیه‌سازی‌شده است؛ مبلغی از حساب شما کسر نشده و تراکنش واقعی ثبت نشده است." : "سبد خرید شما حفظ شده است و می‌توانید دوباره تلاش کنید. این نتیجه آزمایشی است و مبلغی کسر نشده است."}
      </Alert>
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">اقلام سفارش</h2><Badge tone={st.tone}>{st.label}</Badge></div>
        <ul className="divide-y divide-line text-sm">{order.lines.map((l) => { const c = courses.find((x) => x.id === l.courseId); return <li key={l.courseId} className="flex items-center justify-between gap-3 py-2.5"><span>{c && order.status === "paid" ? <a className="hover:text-brand-700 hover:underline" href={`/learn/${c.slug}`}>{l.title}</a> : l.title}</span><span className="tabular">{formatToman(l.unitPrice)}</span></li>; })}</ul>
        <div className="mt-4 border-t border-line pt-4"><OrderSummary t={{ listTotal: order.listTotal, courseSavings: order.listTotal - order.subtotal, subtotal: order.subtotal, discountAmount: order.discountAmount, total: order.total }} code={order.discountCode} /></div>
      </Card>
      <Card className="p-5 text-sm"><h2 className="mb-2 font-bold">اطلاعات تماس</h2><p>{order.billing.fullName} · <span dir="ltr">{order.billing.email}</span> · <span dir="ltr">{order.billing.phone}</span></p></Card>
      <div className="flex flex-wrap justify-center gap-3">
        {order.status === "paid" ? <Button href="/dashboard/courses" variant="cta">رفتن به دوره‌های من</Button> : <Button href="/checkout" variant="cta">تلاش دوباره</Button>}
        <Button href="/dashboard/orders" variant="outline">سفارش‌های من</Button>
        <Button variant="ghost" onClick={() => window.print()}><Printer className="size-4" />چاپ</Button>
      </div>
    </div>
  );
}
