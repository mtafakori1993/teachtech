import { z } from "zod";
import type { ActivityEvent, AppNotification, Course, Discount, Enrollment, Order } from "@/data/types";
import { checkDiscount, computeTotals, lineFromCourse, makeOrder } from "./pricing";
import { toEnDigits } from "./format";

export type PaymentOutcome = "success" | "failed" | "cancelled";
export const OUTCOME_STATUS: Record<PaymentOutcome, Order["status"]> = { success: "paid", failed: "failed", cancelled: "cancelled" };

const phoneRe = /^09\d{9}$/;
export const billingSchema = z.object({
  fullName: z.string().trim().min(3, "نام و نام خانوادگی را کامل وارد کنید.").max(60, "نام بیش از حد طولانی است."),
  email: z.string().trim().toLowerCase().pipe(z.email("ایمیل معتبر وارد کنید.")),
  phone: z.string().transform((v) => toEnDigits(v).replace(/[\s-]/g, "")).pipe(z.string().regex(phoneRe, "شمارهٔ موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.")),
});
export type Billing = z.infer<typeof billingSchema>;

export interface OrderDataSlice {
  orders: Order[]; enrollments: Enrollment[]; discounts: Discount[]; courses: Course[];
  activity: ActivityEvent[]; notifications: AppNotification[];
}
export type PlaceResult =
  | { ok: true; order: Order; patch: Partial<OrderDataSlice> }
  | { ok: false; reason: string };

/**
 * Simulated checkout. Only a "success" outcome creates enrollments and consumes a discount.
 * Failed/cancelled attempts are kept in order history but grant NO access.
 */
export function placeOrder(data: OrderDataSlice, input: {
  userId: string; courseIds: string[]; discountCode?: string | null; billing: Billing; outcome: PaymentOutcome; now?: Date;
}): PlaceResult {
  const now = input.now ?? new Date();
  if (input.courseIds.length === 0) return { ok: false, reason: "سبد خرید خالی است." };
  const lines = [];
  for (const id of input.courseIds) {
    const c = data.courses.find((x) => x.id === id);
    if (!c || c.status !== "published") return { ok: false, reason: "یکی از دوره‌های سبد دیگر در دسترس نیست." };
    if (c.availability === "full") return { ok: false, reason: `ظرفیت «${c.title}» تکمیل شده است.` };
    if (data.enrollments.some((e) => e.userId === input.userId && e.courseId === id)) return { ok: false, reason: `شما قبلاً در «${c.title}» ثبت‌نام کرده‌اید.` };
    lines.push(lineFromCourse(c));
  }
  let discount: Discount | null = null;
  if (input.discountCode) {
    const chk = checkDiscount(input.discountCode, data.discounts, lines, now);
    if (!chk.ok) return { ok: false, reason: chk.reason };
    discount = chk.discount;
  }
  const status = OUTCOME_STATUS[input.outcome];
  const n = data.orders.length + 1;
  const order = makeOrder({
    id: `o-${1000 + n}`, number: `TT-${10000 + n}`, userId: input.userId, lines, discount, status,
    createdAt: now.toISOString(), billing: input.billing,
  });
  const patch: Partial<OrderDataSlice> = { orders: [order, ...data.orders] };
  if (status === "paid") {
    patch.enrollments = [
      ...data.enrollments,
      ...lines.map((l): Enrollment => ({ id: `en-${input.userId}-${l.courseId}`, userId: input.userId, courseId: l.courseId, enrolledAt: now.toISOString(), source: "order", orderId: order.id })),
    ];
    if (discount) patch.discounts = data.discounts.map((d) => (d.id === discount!.id ? { ...d, usedCount: d.usedCount + 1 } : d));
    patch.activity = [{ id: `ac-${order.id}`, userId: input.userId, type: "purchase", label: `سفارش ${order.number} را ثبت کردید`, at: now.toISOString(), minutes: 0, href: `/order/${order.id}` }, ...data.activity];
    patch.notifications = [{ id: `nt-${order.id}`, userId: input.userId, title: "ثبت‌نام شما انجام شد", body: `دسترسی به ${lines.length} دوره در حساب شما فعال شد (پرداخت شبیه‌سازی‌شده).`, at: now.toISOString(), read: false, href: "/dashboard/courses" }, ...data.notifications];
  }
  return { ok: true, order, patch };
}

export { computeTotals };
