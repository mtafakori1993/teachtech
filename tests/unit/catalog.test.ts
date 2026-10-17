import { describe, expect, it } from "vitest";
import { buildSeed } from "@/data/seed";
import { filterCourses, normalizeText, matchesQuery } from "@/lib/catalog";

const { courses } = buildSeed();

describe("course filtering and search", () => {
  it("hides draft courses from the public catalog", () => {
    const all = filterCourses(courses, {});
    expect(all.every((c) => c.status === "published")).toBe(true);
    expect(all.length).toBe(courses.filter((c) => c.status === "published").length);
    expect(filterCourses(courses, {}, { includeDrafts: true }).length).toBe(courses.length);
  });
  it("filters by grade (keeping all-grade courses), level, format and availability", () => {
    expect(filterCourses(courses, { grade: "10" }).every((c) => c.grade === "10" || c.grade === "all")).toBe(true);
    expect(filterCourses(courses, { level: "beginner" }).every((c) => c.level === "beginner")).toBe(true);
    expect(filterCourses(courses, { format: "live" }).map((c) => c.id)).toEqual(["c16"]);
    expect(filterCourses(courses, { availability: "full" }).map((c) => c.id)).toEqual(["c16"]);
  });
  it("filters by price range inclusively", () => {
    const r = filterCourses(courses, { minPrice: 1000000, maxPrice: 1500000 });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((c) => c.price >= 1000000 && c.price <= 1500000)).toBe(true);
  });
  it("searches Persian text tolerant of Arabic letter variants and digits", () => {
    expect(normalizeText("كتاب ي ۱۲")).toBe("کتاب ی 12");
    expect(filterCourses(courses, { q: "حسابان" }).length).toBeGreaterThanOrEqual(2);
    expect(filterCourses(courses, { q: "ريـاضي" }).length).toBe(filterCourses(courses, { q: "ریـاضی" }).length);
    expect(matchesQuery(courses[0], "دهم مجموعه")).toBe(true);
    expect(filterCourses(courses, { q: "فیزیک کوانتوم" })).toEqual([]);
  });
  it("sorts by price, newest and popularity", () => {
    const asc = filterCourses(courses, { sort: "price-asc" }).map((c) => c.price);
    expect([...asc].sort((a, b) => a - b)).toEqual(asc);
    const desc = filterCourses(courses, { sort: "price-desc" }).map((c) => c.price);
    expect([...desc].sort((a, b) => b - a)).toEqual(desc);
    const newest = filterCourses(courses, { sort: "newest" }).map((c) => c.createdAt);
    expect([...newest].sort().reverse()).toEqual(newest);
    const pop = filterCourses(courses, { sort: "popular" }).map((c) => c.sampleEnrolled);
    expect([...pop].sort((a, b) => b - a)).toEqual(pop);
  });
  it("ranks title matches above description-only matches under relevance sort", () => {
    const r = filterCourses(courses, { q: "گراف", sort: "relevance" });
    expect(r[0].tags.concat(r[0].title).join(" ")).toContain("گراف");
  });
});

describe("seed data integrity", () => {
  const s = buildSeed();
  it("has 12–18 published-ish courses and valid relationships", () => {
    expect(courses.length).toBeGreaterThanOrEqual(12);
    expect(courses.length).toBeLessThanOrEqual(18);
    const ids = new Set(courses.map((c) => c.id));
    expect(new Set(courses.map((c) => c.slug)).size).toBe(courses.length);
    for (const e of s.enrollments) { expect(ids.has(e.courseId)).toBe(true); expect(s.users.some((u) => u.id === e.userId)).toBe(true); }
    for (const q of s.quizzes) { for (const qid of q.questionIds) expect(s.questions.some((x) => x.id === qid)).toBe(true); expect(ids.has(q.courseId)).toBe(true); }
    for (const c of courses) {
      if (c.certificateQuizId) expect(s.quizzes.some((q) => q.id === c.certificateQuizId)).toBe(true);
      if (c.comparePrice) expect(c.comparePrice).toBeGreaterThan(c.price);
      expect(s.instructors.some((i) => i.id === c.instructorId)).toBe(true);
    }
  });
  it("order totals add up and use only toman integers", () => {
    for (const o of s.orders) {
      expect(o.subtotal - o.discountAmount).toBe(o.total);
      expect(o.lines.reduce((t, l) => t + l.unitPrice, 0)).toBe(o.subtotal);
      expect(Number.isInteger(o.total)).toBe(true);
    }
  });
  it("is deterministic across builds", () => {
    expect(JSON.stringify(buildSeed())).toBe(JSON.stringify(buildSeed()));
  });
  it("only paid orders back enrollments that reference an order", () => {
    for (const e of s.enrollments.filter((x) => x.orderId)) expect(s.orders.find((o) => o.id === e.orderId)?.status).toBe("paid");
  });
});
