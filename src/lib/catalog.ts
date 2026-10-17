import type { Availability, Course, CourseFormat, Grade, Level } from "@/data/types";
import { toEnDigits } from "./format";

export const GRADE_LABEL: Record<Grade, string> = { "10": "پایهٔ دهم", "11": "پایهٔ یازدهم", "12": "پایهٔ دوازدهم", konkur: "کنکور", all: "همهٔ پایه‌ها" };
export const LEVEL_LABEL: Record<Level, string> = { beginner: "مقدماتی", intermediate: "متوسط", advanced: "پیشرفته" };
export const FORMAT_LABEL: Record<CourseFormat, string> = { recorded: "ضبط‌شده", live: "کلاس زنده", hybrid: "ترکیبی", workshop: "کارگاه" };
export const AVAILABILITY_LABEL: Record<Availability, string> = { open: "ثبت‌نام باز", upcoming: "به‌زودی", full: "تکمیل ظرفیت" };

export type SortKey = "relevance" | "newest" | "price-asc" | "price-desc" | "popular";
export const SORT_LABEL: Record<SortKey, string> = { relevance: "مرتبط‌ترین", newest: "جدیدترین", "price-asc": "ارزان‌ترین", "price-desc": "گران‌ترین", popular: "محبوب‌ترین" };

export interface CourseFilters {
  q?: string;
  grade?: Grade | "";
  categoryId?: string;
  level?: Level | "";
  format?: CourseFormat | "";
  availability?: Availability | "";
  instructorId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortKey;
}

export const PRICE_BUCKETS = [
  { id: "", label: "همهٔ قیمت‌ها", min: undefined, max: undefined },
  { id: "lt700", label: "تا ۷۰۰ هزار تومان", min: 0, max: 700000 },
  { id: "700-1500", label: "۷۰۰ هزار تا ۱٫۵ میلیون", min: 700000, max: 1500000 },
  { id: "gt1500", label: "بیش از ۱٫۵ میلیون", min: 1500000, max: undefined },
] as const;

/** Make Persian search forgiving: Arabic letter variants, digits, ZWNJ, diacritics, case. */
export function normalizeText(s: string): string {
  return toEnDigits(s)
    .replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/[‌‏‎]/g, "")
    .replace(/[ً-ٰٟ]/g, "").replace(/[ۀة]/g, "ه").replace(/أ|إ/g, "ا")
    .replace(/\s+/g, " ").trim().toLowerCase();
}

function relevance(c: Course, terms: string[]): number {
  if (terms.length === 0) return c.sampleRating * Math.log10(c.sampleEnrolled + 10);
  const title = normalizeText(c.title), sub = normalizeText(c.subtitle), tags = normalizeText(c.tags.join(" ")), desc = normalizeText(c.description);
  let score = 0;
  for (const t of terms) {
    if (title.includes(t)) score += 10;
    if (tags.includes(t)) score += 6;
    if (sub.includes(t)) score += 3;
    if (desc.includes(t)) score += 1;
  }
  return score;
}

export function matchesQuery(c: Course, q: string): boolean {
  const terms = normalizeText(q).split(" ").filter(Boolean);
  if (terms.length === 0) return true;
  const hay = normalizeText([c.title, c.subtitle, c.tags.join(" "), c.description, GRADE_LABEL[c.grade]].join(" "));
  return terms.every((t) => hay.includes(t));
}

export function filterCourses(courses: Course[], f: CourseFilters, opts: { includeDrafts?: boolean } = {}): Course[] {
  const terms = normalizeText(f.q ?? "").split(" ").filter(Boolean);
  const list = courses.filter((c) => {
    if (!opts.includeDrafts && c.status !== "published") return false;
    if (f.q && !matchesQuery(c, f.q)) return false;
    if (f.grade && c.grade !== f.grade && c.grade !== "all") return false;
    if (f.categoryId && c.categoryId !== f.categoryId) return false;
    if (f.level && c.level !== f.level) return false;
    if (f.format && c.format !== f.format) return false;
    if (f.availability && c.availability !== f.availability) return false;
    if (f.instructorId && c.instructorId !== f.instructorId) return false;
    if (f.minPrice !== undefined && c.price < f.minPrice) return false;
    if (f.maxPrice !== undefined && c.price > f.maxPrice) return false;
    return true;
  });
  const sort = f.sort ?? "relevance";
  const by: Record<SortKey, (a: Course, b: Course) => number> = {
    relevance: (a, b) => relevance(b, terms) - relevance(a, terms),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    popular: (a, b) => b.sampleEnrolled - a.sampleEnrolled,
  };
  return [...list].sort((a, b) => by[sort](a, b) || a.id.localeCompare(b.id));
}

export const activeFilterCount = (f: CourseFilters) =>
  [f.q, f.grade, f.categoryId, f.level, f.format, f.availability, f.instructorId, f.minPrice, f.maxPrice].filter((v) => v !== undefined && v !== "").length;
