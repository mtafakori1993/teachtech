"use client";
import Link from "next/link";
import { BookOpen, Check, Clock, Heart, ShoppingCart, Star } from "lucide-react";
import { CourseCover } from "@/components/brand/course-cover";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Price } from "./price";
import { AVAILABILITY_LABEL, FORMAT_LABEL, GRADE_LABEL, LEVEL_LABEL } from "@/lib/catalog";
import { courseMinutes, lessonCount } from "@/lib/progress";
import { formatDuration, formatNumber, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app";
import { useEnrolledCourseIds, useInstructorOf } from "@/store/hooks";
import type { Course } from "@/data/types";

const NONE: string[] = [];

export function CourseCard({ course, className, priority }: { course: Course; className?: string; priority?: boolean }) {
  const enrolled = useEnrolledCourseIds().has(course.id);
  const inCart = useApp((s) => s.cart.includes(course.id));
  const add = useApp((s) => s.addToCart);
  const savedList = useApp((s) => s.saved[s.sessionUserId ?? "guest"] ?? NONE);
  const toggleSaved = useApp((s) => s.toggleSaved);
  const instructor = useInstructorOf(course);
  const saved = savedList.includes(course.id);
  const full = course.availability === "full";
  void priority;

  const onAdd = () => {
    const r = add(course.id);
    if (r.ok) toast.success("به سبد خرید اضافه شد.", { label: "مشاهدهٔ سبد", href: "/cart" });
    else toast.error(r.reason ?? "افزودن ممکن نشد.");
  };

  return (
    <article className={cn("group flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-soft transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lift", className)}>
      <div className="relative">
        <Link href={`/courses/${course.slug}`} tabIndex={-1} aria-hidden>
          <CourseCover art={course.art} seed={course.id} alt="" className="aspect-[8/5] w-full" />
        </Link>
        <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
          <Badge tone="sun" className="shadow-sm">{GRADE_LABEL[course.grade]}</Badge>
          {course.availability !== "open" && <Badge tone={full ? "danger" : "flame"} className="bg-white shadow-sm">{AVAILABILITY_LABEL[course.availability]}</Badge>}
        </div>
        <button onClick={() => toggleSaved(course.id)} aria-pressed={saved} aria-label={saved ? "حذف از ذخیره‌شده‌ها" : "ذخیرهٔ دوره"} className="absolute end-2 top-2 grid size-10 place-items-center rounded-full bg-white/90 text-ink-600 shadow-sm hover:text-flame-600">
          <Heart className={cn("size-5", saved && "fill-flame-400 text-flame-500")} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-600">
          <span>{FORMAT_LABEL[course.format]}</span><span aria-hidden>·</span><span>{LEVEL_LABEL[course.level]}</span>
        </div>
        <h3 className="text-[1.05rem] font-bold leading-7">
          <Link href={`/courses/${course.slug}`} className="after:absolute-none hover:text-brand-700">{course.title}</Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-600">{course.subtitle}</p>
        <p className="mt-2 text-sm text-ink-700">مدرس: {instructor?.name ?? "—"}</p>
        <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
          <li className="flex items-center gap-1"><BookOpen className="size-4" aria-hidden />{formatNumber(lessonCount(course))} درس</li>
          <li className="flex items-center gap-1"><Clock className="size-4" aria-hidden />{formatDuration(courseMinutes(course))}</li>
          {course.sampleRating > 0 && (
            <li className="flex items-center gap-1" title="امتیاز نمونه برای نمایش چیدمان"><Star className="size-4 fill-sun-400 text-sun-500" aria-hidden /><span className="tabular">{toFaDigits(course.sampleRating.toFixed(1))}</span><span className="sr-only">امتیاز نمونه</span></li>
          )}
        </ul>
        <div className="mt-auto pt-4">
          <Price price={course.price} comparePrice={course.comparePrice} />
          <div className="mt-3 flex items-center gap-2">
            {enrolled ? (
              <Button href={`/learn/${course.slug}`} size="sm" className="flex-1"><Check className="size-4" />ادامهٔ یادگیری</Button>
            ) : (
              <>
                <Button href={`/courses/${course.slug}`} size="sm" variant="secondary" className="flex-1">مشاهدهٔ دوره</Button>
                <Button size="sm" variant={inCart ? "outline" : "cta"} disabled={full} onClick={inCart ? undefined : onAdd} href={inCart ? "/cart" : undefined} aria-label={inCart ? "در سبد خرید؛ رفتن به سبد" : full ? "ظرفیت تکمیل" : "افزودن به سبد خرید"}>
                  {inCart ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
