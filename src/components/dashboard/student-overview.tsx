"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Award, BookOpen, CalendarClock, CheckCheck, Clock, Megaphone, PlayCircle, Sparkles, TrendingUp } from "lucide-react";
import { useStudentData } from "./student-data";
import { CourseCover } from "@/components/brand/course-cover";
import { CourseCard } from "@/components/course/course-card";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, PageTitle, Progress, Stat } from "@/components/ui/primitives";
import { formatDate, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { attemptsFor } from "@/lib/quiz";
import { useApp } from "@/store/app";

export function StudentOverview() {
  const { user, enrolled, overall } = useStudentData();
  const activity = useApp((s) => s.activity);
  const announcements = useApp((s) => s.announcements);
  const quizzes = useApp((s) => s.quizzes);
  const attempts = useApp((s) => s.attempts);
  const certs = useApp((s) => s.certificates);
  const courses = useApp((s) => s.courses);
  const ids = new Set(enrolled.map((e) => e.course.id));
  const mineActivity = useMemo(() => activity.filter((a) => a.userId === user?.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6), [activity, user?.id]);
  const news = useMemo(() => announcements.filter((a) => a.courseId === null || ids.has(a.courseId)).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at.localeCompare(a.at)).slice(0, 3), [announcements, enrolled]); // eslint-disable-line react-hooks/exhaustive-deps
  const upcoming = useMemo(() => quizzes.filter((q) => q.published && ids.has(q.courseId) && !q.practice && !attemptsFor(attempts, user?.id ?? "", q.id).some((a) => a.passed)).sort((a, b) => (a.dueAt ?? "9").localeCompare(b.dueAt ?? "9")).slice(0, 4), [quizzes, attempts, enrolled, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const active = enrolled.filter((e) => !e.prog.complete);
  const recommended = useMemo(() => courses.filter((c) => c.status === "published" && !ids.has(c.id) && c.availability !== "full").slice(0, 2), [courses, enrolled]); // eslint-disable-line react-hooks/exhaustive-deps
  const myCerts = certs.filter((c) => c.userId === user?.id && !c.revoked).length;
  const doneLessons = enrolled.reduce((t, e) => t + e.prog.done, 0);
  const first = user?.name.split(" ")[0] ?? "";

  return (
    <div className="space-y-8">
      <PageTitle title={`سلام ${first}، خوش آمدی`}>امروز می‌توانی از همان‌جایی که مانده بودی ادامه بدهی.</PageTitle>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="دوره‌های فعال" value={formatNumber(active.length)} icon={<BookOpen className="size-5" />} />
        <Stat label="پیشرفت کلی" value={formatPercent(overall)} icon={<TrendingUp className="size-5" />} tone="sun" />
        <Stat label="درس‌های تکمیل‌شده" value={formatNumber(doneLessons)} icon={<CheckCheck className="size-5" />} tone="success" />
        <Stat label="گواهی‌های صادرشده" value={formatNumber(myCerts)} icon={<Award className="size-5" />} tone="flame" />
      </div>

      <section aria-labelledby="cont"><h2 id="cont" className="mb-3 text-xl font-bold">ادامهٔ یادگیری</h2>
        {active.length === 0 ? <EmptyState icon={<BookOpen className="size-6" />} title="دورهٔ فعالی ندارید" action={<Button href="/courses" variant="cta">انتخاب دوره</Button>}>پس از ثبت‌نام، دوره‌های شما اینجا نمایش داده می‌شوند.</EmptyState> : (
          <div className="grid gap-4 md:grid-cols-2">{active.slice(0, 4).map(({ course, prog, next }) => (
            <Card key={course.id} className="flex gap-3 p-3">
              <CourseCover art={course.art} seed={course.id} alt="" className="hidden aspect-[8/5] w-32 shrink-0 rounded-md sm:block" />
              <div className="flex min-w-0 flex-1 flex-col"><h3 className="truncate font-bold">{course.title}</h3><p className="truncate text-xs text-ink-600">{next ? `درس بعد: ${next.title}` : "همهٔ درس‌ها تکمیل شده"}</p>
                <div className="mt-2"><Progress value={prog.percent} label={`پیشرفت ${course.title}`} /><p className="mt-1 text-xs text-ink-600 tabular">{formatNumber(prog.done)} از {formatNumber(prog.total)} درس · {formatNumber(prog.percent)}٪</p></div>
                <Button size="sm" className="mt-3 self-start" href={`/learn/${course.slug}${next ? `?lesson=${next.id}` : ""}`}><PlayCircle className="size-4" />ادامه</Button></div>
            </Card>))}</div>)}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="upc"><h2 id="upc" className="mb-3 flex items-center gap-2 text-xl font-bold"><CalendarClock className="size-5 text-brand-600" />آزمون‌های پیش‌رو</h2>
          <Card className="divide-y divide-line">{upcoming.length === 0 ? <p className="p-4 text-sm text-ink-500">آزمون در انتظاری ندارید.</p> : upcoming.map((q) => <div key={q.id} className="flex items-center gap-3 p-3 text-sm"><div className="flex-1"><Link href={`/quiz/${q.id}`} className="font-medium hover:text-brand-700">{q.title}</Link><p className="text-xs text-ink-500">{q.dueAt ? `مهلت: ${formatDate(q.dueAt)}` : "بدون مهلت مشخص"}</p></div><Button size="sm" variant="secondary" href={`/quiz/${q.id}`}>شروع</Button></div>)}</Card>
        </section>
        <section aria-labelledby="ann"><h2 id="ann" className="mb-3 flex items-center gap-2 text-xl font-bold"><Megaphone className="size-5 text-brand-600" />اطلاعیه‌ها</h2>
          <Card className="divide-y divide-line">{news.length === 0 ? <p className="p-4 text-sm text-ink-500">اطلاعیه‌ای نیست.</p> : news.map((a) => <div key={a.id} className="p-3 text-sm"><p className="font-bold">{a.pinned && <Badge tone="sun" className="me-2">سنجاق‌شده</Badge>}{a.title}</p><p className="mt-1 leading-7 text-ink-600">{a.body}</p><p className="mt-1 text-xs text-ink-500">{formatDateTime(a.at)}</p></div>)}</Card>
        </section>
        <section aria-labelledby="act"><h2 id="act" className="mb-3 flex items-center gap-2 text-xl font-bold"><Clock className="size-5 text-brand-600" />فعالیت اخیر</h2>
          <Card className="divide-y divide-line">{mineActivity.length === 0 ? <p className="p-4 text-sm text-ink-500">هنوز فعالیتی ثبت نشده است.</p> : mineActivity.map((a) => <div key={a.id} className="flex items-center gap-3 p-3 text-sm"><span className="size-2 shrink-0 rounded-full bg-brand-500" aria-hidden />{a.href ? <Link href={a.href} className="flex-1 hover:text-brand-700">{a.label}</Link> : <span className="flex-1">{a.label}</span>}<time className="text-xs text-ink-500" dateTime={a.at}>{formatDate(a.at)}</time></div>)}</Card>
        </section>
        <section aria-labelledby="rec"><h2 id="rec" className="mb-3 flex items-center gap-2 text-xl font-bold"><Sparkles className="size-5 text-brand-600" />درس‌های پیشنهادی بعدی</h2>
          <Card className="divide-y divide-line">{active.filter((e) => e.next).length === 0 ? <p className="p-4 text-sm text-ink-500">همهٔ درس‌ها را تمام کرده‌اید.</p> : active.filter((e) => e.next).slice(0, 4).map(({ course, next }) => <Link key={course.id} href={`/learn/${course.slug}?lesson=${next!.id}`} className="flex items-center gap-3 p-3 text-sm hover:bg-card/60"><PlayCircle className="size-5 text-brand-600" aria-hidden /><span className="flex-1"><b className="block">{next!.title}</b><span className="text-xs text-ink-500">{course.title}</span></span><span className="tabular text-xs text-ink-500">{formatNumber(next!.durationMin)} دقیقه</span></Link>)}</Card>
        </section>
      </div>

      {recommended.length > 0 && <section aria-labelledby="more"><h2 id="more" className="mb-3 text-xl font-bold">پیشنهاد برای شما</h2><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{recommended.map((c) => <CourseCard key={c.id} course={c} />)}</div></section>}
    </div>
  );
}
