import type { Course, Discount, Order, OrderLine } from "@/data/types";
import { toEnDigits } from "./format";

export interface CartLine { courseId: string; title: string; unitPrice: number; listPrice: number }

export const normalizeCode = (code: string) => toEnDigits(code).trim().toUpperCase().replace(/\s+/g, "");

export const lineFromCourse = (c: Pick<Course, "id" | "title" | "price" | "comparePrice">): CartLine => ({
  courseId: c.id,
  title: c.title,
  unitPrice: c.price,
  listPrice: Math.max(c.price, c.comparePrice ?? c.price),
});

export type DiscountCheck =
  | { ok: true; discount: Discount; amount: number }
  | { ok: false; reason: string };

/** Amount a code takes off the given lines. Percent codes are capped by `maxOff`; fixed codes never exceed the eligible subtotal. */
export function discountAmount(d: Discount, lines: CartLine[]): number {
  const eligible = d.courseIds?.length ? lines.filter((l) => d.courseIds!.includes(l.courseId)) : lines;
  const base = eligible.reduce((s, l) => s + l.unitPrice, 0);
  if (base <= 0) return 0;
  const raw = d.kind === "percent" ? Math.floor((base * d.value) / 100) : Math.min(d.value, base);
  return d.maxOff ? Math.min(raw, d.maxOff) : raw;
}

export function checkDiscount(rawCode: string, discounts: Discount[], lines: CartLine[], now: Date = new Date()): DiscountCheck {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, reason: "کد تخفیف را وارد کنید." };
  if (lines.length === 0) return { ok: false, reason: "ابتدا یک دوره به سبد خرید اضافه کنید." };
  const d = discounts.find((x) => normalizeCode(x.code) === code);
  if (!d) return { ok: false, reason: "این کد تخفیف معتبر نیست." };
  if (!d.active) return { ok: false, reason: "این کد تخفیف فعلاً غیرفعال است." };
  if (d.expiresAt && new Date(d.expiresAt).getTime() < now.getTime()) return { ok: false, reason: "مهلت استفاده از این کد به پایان رسیده است." };
  const subtotal = lines.reduce((s, l) => s + l.unitPrice, 0);
  if (d.minSubtotal && subtotal < d.minSubtotal) return { ok: false, reason: `حداقل مبلغ سفارش برای این کد ${new Intl.NumberFormat("fa-IR").format(d.minSubtotal)} تومان است.` };
  const amount = discountAmount(d, lines);
  if (amount <= 0) return { ok: false, reason: "این کد روی دوره‌های سبد شما اعمال نمی‌شود." };
  return { ok: true, discount: d, amount };
}

export interface Totals { listTotal: number; courseSavings: number; subtotal: number; discountAmount: number; total: number }

export function computeTotals(lines: CartLine[], discount?: Discount | null): Totals {
  const listTotal = lines.reduce((s, l) => s + l.listPrice, 0);
  const subtotal = lines.reduce((s, l) => s + l.unitPrice, 0);
  const off = discount ? Math.min(discountAmount(discount, lines), subtotal) : 0;
  return { listTotal, courseSavings: listTotal - subtotal, subtotal, discountAmount: off, total: subtotal - off };
}

export const toOrderLines = (lines: CartLine[]): OrderLine[] => lines.map((l) => ({ ...l }));

export function makeOrder(args: {
  id: string; number: string; userId: string; lines: CartLine[]; discount?: Discount | null;
  status: Order["status"]; createdAt: string; billing: Order["billing"];
}): Order {
  const t = computeTotals(args.lines, args.discount);
  return {
    id: args.id, number: args.number, userId: args.userId, lines: toOrderLines(args.lines),
    subtotal: t.subtotal, listTotal: t.listTotal, discountCode: args.discount?.code, discountAmount: t.discountAmount,
    total: t.total, status: args.status, createdAt: args.createdAt, billing: args.billing, simulated: true,
  };
}
