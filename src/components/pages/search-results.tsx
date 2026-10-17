"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { SearchX } from "lucide-react";
import { CourseCard } from "@/components/course/course-card";
import { EmptyState, PageTitle } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ARTICLES } from "@/data/content";
import { filterCourses, normalizeText } from "@/lib/catalog";
import { useApp } from "@/store/app";
import { formatNumber } from "@/lib/format";

export function SearchResults() {
  const q = useSearchParams().get("q")?.trim() ?? "";
  const courses = useApp((s) => s.courses);
  const res = useMemo(() => (q ? filterCourses(courses, { q }) : []), [courses, q]);
  const articles = useMemo(() => ARTICLES.filter((a) => !!q && normalizeText([a.title, a.excerpt, a.tags.join(" ")].join(" ")).includes(normalizeText(q))), [q]);
  return (
    <>
      <PageTitle title={q ? `نتایج «${q}»` : "جستجو"}>{q ? `${formatNumber(res.length)} دوره و ${formatNumber(articles.length)} مقاله` : "عبارتی را در نوار جستجوی بالای صفحه وارد کنید."}</PageTitle>
      {q && res.length === 0 && articles.length === 0 && <EmptyState icon={<SearchX className="size-6" />} title="نتیجه‌ای پیدا نشد" action={<Button href="/courses">مشاهدهٔ همهٔ دوره‌ها</Button>}>عبارت دیگری امتحان کنید؛ مثلاً «حد»، «هندسه» یا «کنکور».</EmptyState>}
      {res.length > 0 && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{res.map((c) => <CourseCard key={c.id} course={c} />)}</div>}
      {articles.length > 0 && <section className="mt-12"><h2 className="mb-3 text-xl font-bold">مقاله‌ها</h2><ul className="space-y-2">{articles.map((a) => <li key={a.slug}><Link className="text-brand-700 underline underline-offset-4" href={`/resources/${a.slug}`}>{a.title}</Link></li>)}</ul></section>}
    </>
  );
}
