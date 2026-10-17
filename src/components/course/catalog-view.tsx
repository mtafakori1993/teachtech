"use client";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, SearchX, X } from "lucide-react";
import { CourseCard } from "./course-card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/primitives";
import { AVAILABILITY_LABEL, FORMAT_LABEL, GRADE_LABEL, LEVEL_LABEL, PRICE_BUCKETS, SORT_LABEL, activeFilterCount, filterCourses, type CourseFilters, type SortKey } from "@/lib/catalog";
import { CATEGORIES } from "@/data/catalog";
import { formatNumber } from "@/lib/format";
import { useApp } from "@/store/app";
import type { Availability, CourseFormat, Grade, Level } from "@/data/types";

const KEYS = ["q", "grade", "category", "level", "format", "availability", "instructor", "price", "sort"] as const;

export function CatalogView() {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const courses = useApp((s) => s.courses);
  const instructors = useApp((s) => s.instructors);
  const [sheet, setSheet] = useState(false);

  const get = (k: string) => sp.get(k) ?? "";
  const bucket = PRICE_BUCKETS.find((b) => b.id === get("price")) ?? PRICE_BUCKETS[0];
  const filters: CourseFilters = {
    q: get("q"), grade: get("grade") as Grade, categoryId: get("category"), level: get("level") as Level, format: get("format") as CourseFormat,
    availability: get("availability") as Availability, instructorId: get("instructor"), minPrice: bucket.min, maxPrice: bucket.max, sort: (get("sort") || "relevance") as SortKey,
  };
  const results = useMemo(() => filterCourses(courses, filters), [courses, sp]); // eslint-disable-line react-hooks/exhaustive-deps
  const count = activeFilterCount(filters);

  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp.toString());
    if (v) n.set(k, v); else n.delete(k);
    router.replace(`${path}${n.size ? `?${n}` : ""}`, { scroll: false });
  };
  const clear = () => router.replace(path, { scroll: false });

  const panel = (
    <div className="space-y-4">
      <Field label="جستجو">{(p) => <Input {...p} type="search" value={get("q")} onChange={(e) => set("q", e.target.value)} placeholder="نام دوره یا مبحث…" />}</Field>
      <Field label="پایهٔ تحصیلی">{(p) => <Select {...p} value={get("grade")} onChange={(e) => set("grade", e.target.value)}><option value="">همه</option>{(["10", "11", "12", "konkur"] as Grade[]).map((g) => <option key={g} value={g}>{GRADE_LABEL[g]}</option>)}</Select>}</Field>
      <Field label="مبحث">{(p) => <Select {...p} value={get("category")} onChange={(e) => set("category", e.target.value)}><option value="">همه</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select>}</Field>
      <Field label="سطح دشواری">{(p) => <Select {...p} value={get("level")} onChange={(e) => set("level", e.target.value)}><option value="">همه</option>{Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>}</Field>
      <Field label="شکل برگزاری">{(p) => <Select {...p} value={get("format")} onChange={(e) => set("format", e.target.value)}><option value="">همه</option>{Object.entries(FORMAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>}</Field>
      <Field label="محدودهٔ قیمت">{(p) => <Select {...p} value={get("price")} onChange={(e) => set("price", e.target.value)}>{PRICE_BUCKETS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</Select>}</Field>
      <Field label="مدرس">{(p) => <Select {...p} value={get("instructor")} onChange={(e) => set("instructor", e.target.value)}><option value="">همه</option>{instructors.filter((i) => i.active).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select>}</Field>
      <Field label="وضعیت ثبت‌نام">{(p) => <Select {...p} value={get("availability")} onChange={(e) => set("availability", e.target.value)}><option value="">همه</option>{Object.entries(AVAILABILITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>}</Field>
      {count > 0 && <Button variant="outline" className="w-full" onClick={clear}><X className="size-4" />پاک‌کردن فیلترها</Button>}
    </div>
  );

  return (
    <div className="grid gap-8 grid-cols-[minmax(0,1fr)] lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="hidden self-start rounded-lg border border-line bg-white p-5 shadow-soft lg:sticky lg:top-24 lg:block" aria-label="فیلترها">
        <h2 className="mb-4 flex items-center gap-2 font-bold"><SlidersHorizontal className="size-4" />فیلترها</h2>
        {panel}
      </aside>
      <section aria-label="نتایج">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <p role="status" aria-live="polite" className="me-auto text-sm text-ink-600"><b className="text-ink">{formatNumber(results.length)}</b> دوره پیدا شد</p>
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setSheet(true)}><SlidersHorizontal className="size-4" />فیلترها{count > 0 && ` (${formatNumber(count)})`}</Button>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-ink-600">مرتب‌سازی:</label>
            <Select id="sort" value={get("sort") || "relevance"} onChange={(e) => set("sort", e.target.value === "relevance" ? "" : e.target.value)} className="min-w-36">
              {Object.entries(SORT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
        </div>
        {results.length === 0 ? (
          <EmptyState icon={<SearchX className="size-6" />} title="دوره‌ای با این فیلترها پیدا نشد" action={<Button onClick={clear}>پاک‌کردن فیلترها</Button>}>
            عبارت جستجو را ساده‌تر کنید یا یکی از فیلترها را بردارید. اگر دوره‌ای در ذهن دارید، از صفحهٔ تماس به ما بگویید.
          </EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{results.map((c) => <CourseCard key={c.id} course={c} />)}</div>
        )}
        <p className="mt-6 text-xs text-ink-500">امتیازها و تعداد ثبت‌نام‌ها نمونه هستند و آمار واقعی آموزشگاه نیستند.</p>
      </section>
      <Dialog open={sheet} onClose={() => setSheet(false)} title="فیلتر دوره‌ها" footer={<Button onClick={() => setSheet(false)}>نمایش {formatNumber(results.length)} دوره</Button>}>{panel}</Dialog>
    </div>
  );
}
export { KEYS };
