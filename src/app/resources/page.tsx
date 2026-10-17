import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES } from "@/data/content";
import { CourseCover } from "@/components/brand/course-cover";
import { Badge } from "@/components/ui/primitives";
import { PageHero } from "@/components/pages/prose";
import { formatDate, formatNumber } from "@/lib/format";
export const metadata: Metadata = { title: "منابع آموزشی", description: "مقاله‌ها، راهنماها و برگه‌های کار رایگان برای یادگیری ریاضی دبیرستان.", alternates: { canonical: "/resources" } };
export default function Resources() {
  return (
    <>
      <PageHero eyebrow="منابع آموزشی" title="مقاله و راهنمای ریاضی">نکته‌های کوتاه و کاربردی برای یادگیری بهتر؛ بدون نیاز به ثبت‌نام.</PageHero>
      <div className="container-x grid gap-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {ARTICLES.map((a) => (
          <Link key={a.slug} href={`/resources/${a.slug}`} className="group overflow-hidden rounded-lg border border-line bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
            <CourseCover art={a.art} seed={a.slug} alt="" className="aspect-[16/7] w-full" />
            <div className="p-4"><Badge tone="neutral">{a.kind}</Badge><h2 className="mt-2 text-lg font-bold leading-7 group-hover:text-brand-700">{a.title}</h2><p className="mt-1 text-sm text-ink-600">{a.excerpt}</p><p className="mt-3 text-xs text-ink-500">{formatDate(a.publishedAt)} · {formatNumber(a.readMin)} دقیقه مطالعه</p></div>
          </Link>
        ))}
      </div>
    </>
  );
}
