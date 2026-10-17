"use client";
import Link from "next/link";
import { useMemo } from "react";
import { BookOpen, CalendarClock, Check, Clock, Download, Eye, GraduationCap, Heart, Lock, PlayCircle, ShoppingCart, Star, Target, Award } from "lucide-react";
import { CourseCover } from "@/components/brand/course-cover";
import { CourseCard } from "./course-card";
import { Price } from "./price";
import { Button } from "@/components/ui/button";
import { Alert, Badge, Card, Progress, SectionHeading, EmptyState } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";
import { FORMAT_LABEL, GRADE_LABEL, LEVEL_LABEL } from "@/lib/catalog";
import { courseMinutes, courseProgress, lessonCount, nextLesson } from "@/lib/progress";
import { formatDate, formatDuration, formatNumber, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useApp, useSessionUser } from "@/store/app";
import { useCompleted, useCourse, useEnrolledCourseIds, useInstructorOf, usePublishedCourses } from "@/store/hooks";
import { MathText } from "@/components/ui/tex";

export function CourseDetail({ slug }: { slug: string }) {
  const course = useCourse(slug);
  const user = useSessionUser();
  const enrolled = useEnrolledCourseIds();
  const inCart = useApp((s) => (course ? s.cart.includes(course.id) : false));
  const add = useApp((s) => s.addToCart);
  const saved = useApp((s) => (course ? (s.saved[s.sessionUserId ?? "guest"] ?? []).includes(course.id) : false));
  const toggleSaved = useApp((s) => s.toggleSaved);
  const resources = useApp((s) => s.resources);
  const published = usePublishedCourses();
  const done = useCompleted(course?.id ?? "");
  const instructor = useInstructorOf(course ?? { instructorId: "" });
  const related = useMemo(() => (course ? published.filter((c) => c.id !== course.id && (c.categoryId === course.categoryId || c.grade === course.grade)).slice(0, 3) : []), [published, course]);

  if (!course) return <div className="container-x py-16"><EmptyState title="دوره پیدا نشد" action={<Button href="/courses">بازگشت به دوره‌ها</Button>}>این دوره وجود ندارد یا حذف شده است.</EmptyState></div>;
  const staff = user?.role === "instructor" || user?.role === "admin";
  if (course.status !== "published" && !staff) return <div className="container-x py-16"><EmptyState title="این دوره هنوز منتشر نشده است" action={<Button href="/courses">مشاهدهٔ دوره‌های فعال</Button>} /></div>;

  const isEnrolled = enrolled.has(course.id);
  const prog = courseProgress(course, done);
  const full = course.availability === "full";
  const lessons = lessonCount(course);
  const courseResources = resources.filter((r) => r.courseId === course.id);
  const next = nextLesson(course, done);
  const onAdd = () => { const r = add(course.id); if (r.ok) toast.success("به سبد خرید اضافه شد.", { label: "مشاهدهٔ سبد", href: "/cart" }); else toast.error(r.reason ?? "افزودن ممکن نشد."); };

  return (
    <article>
      <header className="border-b border-line bg-gradient-to-b from-card to-cream">
        <div className="container-x grid gap-8 py-10 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <nav aria-label="مسیر صفحه" className="mb-4 text-sm text-ink-600"><Link href="/courses" className="hover:text-brand-700">دوره‌ها</Link> <span aria-hidden>›</span> <span>{GRADE_LABEL[course.grade]}</span></nav>
            <div className="mb-3 flex flex-wrap gap-2"><Badge tone="sun">{GRADE_LABEL[course.grade]}</Badge><Badge>{LEVEL_LABEL[course.level]}</Badge><Badge tone="neutral">{FORMAT_LABEL[course.format]}</Badge>{course.status === "draft" && <Badge tone="warning">پیش‌نویس (فقط برای مدرس)</Badge>}</div>
            <h1 className="text-3xl font-bold leading-[1.5] sm:text-4xl">{course.title}</h1>
            <p className="mt-3 text-lg text-ink-700">{course.subtitle}</p>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-700">
              <li className="flex items-center gap-1.5"><GraduationCap className="size-4 text-brand-600" aria-hidden />مدرس: <Link href="/instructors/amir-kavian" className="font-medium text-brand-700 hover:underline">{instructor?.name}</Link></li>
              <li className="flex items-center gap-1.5"><BookOpen className="size-4 text-brand-600" aria-hidden />{formatNumber(lessons)} درس</li>
              <li className="flex items-center gap-1.5"><Clock className="size-4 text-brand-600" aria-hidden />{formatDuration(courseMinutes(course))}</li>
              {course.sampleRating > 0 && <li className="flex items-center gap-1.5" title="امتیاز نمونه"><Star className="size-4 fill-sun-400 text-sun-500" aria-hidden /><span className="tabular">{toFaDigits(course.sampleRating.toFixed(1))}</span><span className="text-xs text-ink-500">(امتیاز نمونه)</span></li>}
            </ul>
            <CourseCover art={course.art} seed={course.id} alt={`تصویر دورهٔ ${course.title}`} className="mt-6 aspect-[8/4] w-full rounded-xl border border-line shadow-soft" />
          </div>
          <aside className="lg:row-span-2 lg:sticky lg:top-24 lg:self-start" aria-label="ثبت‌نام">
            <Card className="p-5">
              {isEnrolled ? (
                <div className="space-y-3">
                  <Badge tone="success"><Check className="size-3.5" />شما در این دوره ثبت‌نام کرده‌اید</Badge>
                  <div><div className="mb-1 flex justify-between text-sm"><span>پیشرفت شما</span><span className="tabular">{formatNumber(prog.percent)}٪</span></div><Progress value={prog.percent} label="پیشرفت دوره" /></div>
                  <Button href={next ? `/learn/${course.slug}?lesson=${next.id}` : `/learn/${course.slug}`} size="lg" className="w-full"><PlayCircle className="size-5" />{prog.done ? "ادامهٔ یادگیری" : "شروع یادگیری"}</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Price price={course.price} comparePrice={course.comparePrice} size="lg" />
                  {course.availability === "upcoming" && course.startsAt && <Alert tone="info"><CalendarClock className="me-1 inline size-4" />شروع: {formatDate(course.startsAt)}</Alert>}
                  {full ? <Alert tone="warning" title="ظرفیت تکمیل شده است">برای اطلاع از دورهٔ بعد با پشتیبانی تماس بگیرید.</Alert> : null}
                  {inCart ? <Button href="/cart" size="lg" variant="outline" className="w-full"><Check className="size-5" />در سبد خرید است؛ رفتن به سبد</Button>
                    : <Button size="lg" variant="cta" className="w-full" disabled={full} onClick={onAdd}><ShoppingCart className="size-5" />افزودن به سبد خرید</Button>}
                  <Button variant="ghost" className="w-full" onClick={() => toggleSaved(course.id)} aria-pressed={saved}><Heart className={cn("size-4", saved && "fill-flame-400 text-flame-500")} />{saved ? "ذخیره شد" : "ذخیرهٔ دوره"}</Button>
                </div>
              )}
              <ul className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm text-ink-700">
                <li className="flex gap-2"><Eye className="size-4 shrink-0 translate-y-1.5 text-brand-600" aria-hidden />پیش‌نمایش درس‌های رایگان پیش از خرید</li>
                <li className="flex gap-2"><Download className="size-4 shrink-0 translate-y-1.5 text-brand-600" aria-hidden />{formatNumber(courseResources.length)} منبع قابل‌دریافت</li>
                {course.certificate && <li className="flex gap-2"><Award className="size-4 shrink-0 translate-y-1.5 text-brand-600" aria-hidden />گواهی آموزشگاه با قبولی در آزمون پایانی (حداقل {formatNumber(course.passPercent)}٪)</li>}
              </ul>
              <p className="mt-4 text-xs text-ink-500">پرداخت در این نسخه شبیه‌سازی‌شده است و هیچ مبلغی کسر نمی‌شود.</p>
            </Card>
          </aside>
          <div className="space-y-12 lg:col-start-1">
            <section aria-labelledby="about"><h2 id="about" className="mb-3 text-xl font-bold">دربارهٔ این دوره</h2><p className="leading-9 text-ink-700">{course.description}</p></section>
            <section aria-labelledby="outcomes">
              <h2 id="outcomes" className="mb-3 flex items-center gap-2 text-xl font-bold"><Target className="size-5 text-brand-600" />در پایان دوره می‌توانید</h2>
              <ul className="grid gap-2.5 sm:grid-cols-2">{course.outcomes.map((o) => <li key={o} className="flex gap-2.5 rounded-md bg-white p-3 text-sm leading-7 shadow-soft"><Check className="mt-1 size-4 shrink-0 text-success-600" aria-hidden />{o}</li>)}</ul>
            </section>
            <section aria-labelledby="prereq"><h2 id="prereq" className="mb-3 text-xl font-bold">پیش‌نیازها و مخاطب</h2>
              <ul className="list-disc space-y-1 ps-6 text-ink-700 marker:text-brand-500"><li>مناسب برای: {GRADE_LABEL[course.grade]}</li>{course.prerequisites.map((p) => <li key={p}>{p}</li>)}</ul>
            </section>
            <section aria-labelledby="curr">
              <h2 id="curr" className="mb-3 text-xl font-bold">سرفصل‌ها</h2>
              <p className="mb-3 text-sm text-ink-600">{formatNumber(course.sections.length)} بخش · {formatNumber(lessons)} درس · {formatDuration(courseMinutes(course))}</p>
              <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white shadow-soft">
                {course.sections.map((s, si) => (
                  <details key={s.id} open={si === 0} className="group">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 bg-card/50 px-4 font-bold [&::-webkit-details-marker]:hidden"><span>{s.title}</span><span className="text-xs font-normal text-ink-600">{formatNumber(s.lessons.length)} درس</span></summary>
                    <ul className="divide-y divide-line">
                      {s.lessons.map((l) => {
                        const open = l.isPreview || isEnrolled;
                        return (
                          <li key={l.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                            {open ? <PlayCircle className="size-5 shrink-0 text-brand-600" aria-hidden /> : <Lock className="size-5 shrink-0 text-ink-500" aria-label="قفل" />}
                            <span className="flex-1">{open ? <Link href={`/learn/${course.slug}?lesson=${l.id}`} className="hover:text-brand-700 hover:underline">{l.title}</Link> : l.title}</span>
                            {l.isPreview && !isEnrolled && <Badge tone="sun">پیش‌نمایش رایگان</Badge>}
                            <span className="tabular text-xs text-ink-500">{formatNumber(l.durationMin)} دقیقه</span>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                ))}
              </div>
            </section>
            {courseResources.length > 0 && (
              <section aria-labelledby="res"><h2 id="res" className="mb-3 text-xl font-bold">منابع دوره</h2>
                <ul className="grid gap-2 sm:grid-cols-2">{courseResources.map((r) => <li key={r.id} className="flex items-center gap-3 rounded-md border border-line bg-white p-3 text-sm"><Download className="size-4 text-brand-600" aria-hidden /><span className="flex-1">{r.title}</span><Badge tone="neutral">{r.kind}</Badge></li>)}</ul>
                <p className="mt-2 text-xs text-ink-500">دریافت منابع پس از ثبت‌نام در صفحهٔ یادگیری فعال می‌شود.</p>
              </section>
            )}
            <section aria-labelledby="faq"><h2 id="faq" className="mb-3 text-xl font-bold">سؤالات این دوره</h2>
              <div className="divide-y divide-line rounded-lg border border-line bg-white shadow-soft">{course.faq.map((f) => <details key={f.q} className="group px-4 py-1"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden">{f.q}<span aria-hidden className="text-brand-700 transition-transform group-open:rotate-45">+</span></summary><p className="pb-3 leading-8 text-ink-600"><MathText text={f.a} /></p></details>)}</div>
            </section>
          </div>
        </div>
      </header>
      {related.length > 0 && <section className="container-x py-12"><SectionHeading title="دوره‌های مرتبط" /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((c) => <CourseCard key={c.id} course={c} />)}</div></section>}
    </article>
  );
}
