import type { Course, Enrollment, Order } from "@/data/types";

const monthFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long", year: "numeric", timeZone: "Asia/Tehran" });
const monthKey = (iso: string) => new Intl.DateTimeFormat("en-CA-u-ca-persian", { year: "numeric", month: "2-digit", timeZone: "Asia/Tehran" }).format(new Date(iso));

export const paidOrders = (orders: Order[]) => orders.filter((o) => o.status === "paid");

export function revenueByCourse(orders: Order[], courses: Course[]) {
  const map = new Map<string, { sales: number; revenue: number }>();
  for (const o of paidOrders(orders)) {
    // Spread the order-level discount proportionally so per-course revenue sums to the order total.
    const ratio = o.subtotal > 0 ? o.total / o.subtotal : 1;
    for (const l of o.lines) {
      const cur = map.get(l.courseId) ?? { sales: 0, revenue: 0 };
      map.set(l.courseId, { sales: cur.sales + 1, revenue: cur.revenue + Math.round(l.unitPrice * ratio) });
    }
  }
  return courses.map((c) => ({ course: c, ...(map.get(c.id) ?? { sales: 0, revenue: 0 }) })).sort((a, b) => b.revenue - a.revenue);
}

export function revenueByMonth(orders: Order[]) {
  const map = new Map<string, { label: string; revenue: number; orders: number }>();
  for (const o of paidOrders(orders)) {
    const k = monthKey(o.createdAt);
    const cur = map.get(k) ?? { label: monthFmt.format(new Date(o.createdAt)), revenue: 0, orders: 0 };
    map.set(k, { ...cur, revenue: cur.revenue + o.total, orders: cur.orders + 1 });
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
}

export const totalRevenue = (orders: Order[]) => paidOrders(orders).reduce((t, o) => t + o.total, 0);

export function completionRate(enrollments: Enrollment[], courseId: string, completed: Record<string, string[]>, lessonIds: string[]) {
  const mine = enrollments.filter((e) => e.courseId === courseId);
  if (mine.length === 0 || lessonIds.length === 0) return 0;
  const done = mine.filter((e) => lessonIds.every((id) => (completed[`${e.userId}:${courseId}`] ?? []).includes(id))).length;
  return Math.round((done / mine.length) * 100);
}
