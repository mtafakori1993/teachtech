import { describe, expect, it } from "vitest";
import { buildSeed, DEMO_STUDENT_ID } from "@/data/seed";
import { checkDiscount, computeTotals, lineFromCourse, normalizeCode } from "@/lib/pricing";
import { billingSchema, placeOrder } from "@/lib/checkout";

const s = buildSeed();
const line = (id: string) => lineFromCourse(s.courses.find((c) => c.id === id)!);
const D = (code: string) => s.discounts.find((d) => d.code === code)!;
const billing = { fullName: "سارا موسوی", email: "student@teachtech.example", phone: "09120000001" };

describe("cart calculations", () => {
  it("totals list price, course savings, subtotal and final amount", () => {
    const t = computeTotals([line("c01"), line("c02")]);
    expect(t.subtotal).toBe(1450000 + 690000);
    expect(t.listTotal).toBe(1800000 + 690000);
    expect(t.courseSavings).toBe(350000);
    expect(t.total).toBe(t.subtotal);
  });
  it("empty cart is zero", () => expect(computeTotals([]).total).toBe(0));
});

describe("discount codes", () => {
  it("percent code is capped by maxOff", () => {
    const c = checkDiscount("teach10", s.discounts, [line("c11")]);
    expect(c.ok && c.amount).toBe(250000); // 10% of 3.2M = 320k → capped at 250k
  });
  it("percent code applies to the total with floor rounding", () => {
    const c = checkDiscount("TEACH10", s.discounts, [line("c04")]);
    expect(c.ok && c.amount).toBe(115000);
  });
  it("course-restricted code only discounts eligible lines", () => {
    const c = checkDiscount("KAVIAN20", s.discounts, [line("c10"), line("c02")]);
    expect(c.ok && c.amount).toBe(270000); // 20% of 1,350,000 only
  });
  it("enforces minimum subtotal, expiry, inactive and unknown codes", () => {
    expect(checkDiscount("WELCOME50", s.discounts, [line("c15")]).ok).toBe(false); // 420k < 500k
    expect(checkDiscount("NOWRUZ", s.discounts, [line("c01")], new Date("2026-10-17")).ok).toBe(false);
    expect(checkDiscount("STUDENT15", s.discounts, [line("c01")]).ok).toBe(false);
    expect(checkDiscount("NOPE", s.discounts, [line("c01")]).ok).toBe(false);
    expect(checkDiscount("", s.discounts, [line("c01")]).ok).toBe(false);
  });
  it("fixed code never exceeds the subtotal and total never goes negative", () => {
    const t = computeTotals([line("c14")], { ...D("WELCOME50"), value: 99999999, minSubtotal: undefined });
    expect(t.total).toBe(0);
  });
  it("normalizes code input (case, spaces, Persian digits)", () => expect(normalizeCode(" teach ۱۰ ")).toBe("TEACH10"));
});

describe("simulated checkout", () => {
  const data = () => { const x = buildSeed(); return { orders: x.orders, enrollments: x.enrollments, discounts: x.discounts, courses: x.courses, activity: x.activity, notifications: x.notifications }; };
  it("successful payment creates a paid order and enrolls the user", () => {
    const d = data();
    const r = placeOrder(d, { userId: DEMO_STUDENT_ID, courseIds: ["c04"], discountCode: "TEACH10", billing, outcome: "success" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.order.status).toBe("paid");
    expect(r.order.total).toBe(1150000 - 115000);
    expect(r.patch.enrollments!.some((e) => e.userId === DEMO_STUDENT_ID && e.courseId === "c04")).toBe(true);
    expect(r.patch.discounts!.find((x) => x.code === "TEACH10")!.usedCount).toBe(D("TEACH10").usedCount + 1);
  });
  it("failed and cancelled payments are recorded but grant no access", () => {
    for (const outcome of ["failed", "cancelled"] as const) {
      const d = data();
      const r = placeOrder(d, { userId: DEMO_STUDENT_ID, courseIds: ["c04"], billing, outcome });
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      expect(r.order.status).toBe(outcome);
      expect(r.patch.enrollments).toBeUndefined();
      expect(r.patch.orders![0].id).toBe(r.order.id);
    }
  });
  it("rejects already-enrolled, full, draft and empty carts", () => {
    const d = data();
    expect(placeOrder(d, { userId: DEMO_STUDENT_ID, courseIds: ["c03"], billing, outcome: "success" }).ok).toBe(false);
    expect(placeOrder(d, { userId: DEMO_STUDENT_ID, courseIds: ["c16"], billing, outcome: "success" }).ok).toBe(false);
    expect(placeOrder(d, { userId: DEMO_STUDENT_ID, courseIds: ["c17"], billing, outcome: "success" }).ok).toBe(false);
    expect(placeOrder(d, { userId: DEMO_STUDENT_ID, courseIds: [], billing, outcome: "success" }).ok).toBe(false);
  });
  it("re-validates the discount at order time", () => {
    const r = placeOrder(data(), { userId: DEMO_STUDENT_ID, courseIds: ["c04"], discountCode: "NOWRUZ", billing, outcome: "success" });
    expect(r.ok).toBe(false);
  });
  it("validates billing and never accepts card data fields", () => {
    expect(billingSchema.safeParse(billing).success).toBe(true);
    expect(billingSchema.safeParse({ ...billing, email: "bad" }).success).toBe(false);
    expect(billingSchema.safeParse({ ...billing, phone: "0912" }).success).toBe(false);
    expect(billingSchema.safeParse({ ...billing, phone: "۰۹۱۲۰۰۰۰۰۰۱" }).success).toBe(true);
    expect(Object.keys(billingSchema.shape)).toEqual(["fullName", "email", "phone"]);
  });
});
