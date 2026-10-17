"use client";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Award, Bookmark, Check, CheckCircle2, ChevronLeft, ChevronRight, Download, ListChecks, Lock, MessageCircleQuestion, NotebookPen, PlayCircle, Trash2, FileText } from "lucide-react";
import { VideoPlayer, type PlayerHandle } from "./video-player";
import { LessonBoard } from "./lesson-board";
import { Button } from "@/components/ui/button";
import { Alert, Badge, Card, EmptyState, Progress, Skeleton } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/form";
import { MathText } from "@/components/ui/tex";
import { toast } from "@/components/ui/toast";
import { allLessons, canAccessLesson, courseProgress, neighbours, nextLesson } from "@/lib/progress";
import { certificateEligibility } from "@/lib/certificates";
import { attemptsFor } from "@/lib/quiz";
import { downloadResource } from "@/lib/resources";
import { formatClock, formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useApp, useHydrated, useSessionUser } from "@/store/app";
import { useCompleted, useCourse, useEnrolledCourseIds } from "@/store/hooks";
import type { Lesson } from "@/data/types";

export function LearnView({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  const course = useCourse(slug);
  const user = useSessionUser();
  const enrolledSet = useEnrolledCourseIds();
  const completed = useCompleted(course?.id ?? "");
  const router = useRouter();
  const sp = useSearchParams();
  const [stepOverride, setStepOverride] = useState<{ id: string; n: number } | null>(null);
  const playerRef = useRef<PlayerHandle | null>(null);

  const s = useApp();
  const lessons = useMemo(() => (course ? allLessons(course) : []), [course]);
  const enrolled = !!course && enrolledSet.has(course.id);
  const requested = sp.get("lesson");
  const lesson: Lesson | undefined = useMemo(() => {
    if (!course) return undefined;
    const byId = lessons.find((l) => l.id === requested);
    if (byId) return byId;
    return (enrolled ? nextLesson(course, completed) ?? lessons[0] : lessons.find((l) => l.isPreview)) ?? lessons[0];
  }, [course, lessons, requested, enrolled, completed]);

  const savedPos = user && lesson ? s.playback[`${user.id}:${lesson.id}`] ?? 0 : 0;
  const boardStep = stepOverride && stepOverride.id === lesson?.id ? stepOverride.n : Math.floor(savedPos);

  const go = useCallback((id: string) => router.replace(`/learn/${slug}?lesson=${id}`, { scroll: false }), [router, slug]);

  if (!hydrated) return <div className="container-x space-y-4 py-10"><Skeleton className="aspect-video w-full max-w-3xl" /><Skeleton className="h-40" /></div>;
  if (!course || !lesson) return <div className="container-x py-16"><EmptyState title="دوره پیدا نشد" action={<Button href="/courses">دوره‌ها</Button>} /></div>;

  const prog = courseProgress(course, completed);
  const done = completed.includes(lesson.id);
  const { prev, next } = neighbours(course, lesson.id);
  const open = canAccessLesson(lesson, enrolled);
  const quiz = s.quizzes.find((q) => q.id === course.certificateQuizId);
  const elig = user ? certificateEligibility(course, completed, quiz, attemptsFor(s.attempts, user.id, quiz?.id ?? "")) : null;
  const myCert = user ? s.certificates.find((c) => c.userId === user.id && c.courseId === course.id && !c.revoked) : undefined;

  const markDone = () => {
    if (!user) return toast.error("برای ثبت پیشرفت وارد شوید.");
    if (!enrolled) return toast.error("برای ثبت پیشرفت باید در دوره ثبت‌نام کنید.");
    if (done) { s.uncompleteLesson(course.id, lesson.id); toast.info("درس به حالت ناتمام برگشت."); return; }
    s.completeLesson(course.id, lesson.id);
    toast.success("درس تکمیل شد.");
    if (next && canAccessLesson(next, enrolled)) go(next.id);
  };

  return (
    <div className="container-x py-5 lg:py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0"><Link href={`/courses/${course.slug}`} className="text-sm text-brand-700 hover:underline">{course.title}</Link><h1 className="truncate text-xl font-bold sm:text-2xl">{lesson.title}</h1></div>
        {enrolled && <div className="w-full max-w-60"><div className="mb-1 flex justify-between text-xs text-ink-600"><span>پیشرفت دوره</span><span className="tabular">{formatNumber(prog.done)} از {formatNumber(prog.total)} · {formatNumber(prog.percent)}٪</span></div><Progress value={prog.percent} label="پیشرفت دوره" tone={prog.complete ? "success" : "brand"} /></div>}
      </div>

      {!enrolled && <Alert tone="info" className="mb-4">شما در حال دیدن پیش‌نمایش رایگان هستید. برای دسترسی به همهٔ درس‌ها، آزمون و گواهی <Link className="font-bold underline" href={`/courses/${course.slug}`}>در دوره ثبت‌نام کنید</Link>.</Alert>}

      <div className="grid gap-6 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          {open ? (
            lesson.videoSrc ? (
              <VideoPlayer key={lesson.id} src={lesson.videoSrc} captions={lesson.captionsSrc} title={lesson.title} resumeAt={savedPos}
                onProgress={(t) => s.setPlayback(lesson.id, t)} onEnded={() => { if (enrolled && !done) { s.completeLesson(course.id, lesson.id); toast.success("درس تکمیل شد."); } }} handleRef={playerRef} />
            ) : <LessonBoard lesson={lesson} step={boardStep} onStep={(n) => { setStepOverride({ id: lesson.id, n }); s.setPlayback(lesson.id, n); }} />
          ) : (
            <div className="grid aspect-video place-items-center rounded-xl bg-card text-center"><div><Lock className="mx-auto size-10 text-brand-600" /><p className="mt-3 font-bold">این درس قفل است</p><p className="text-sm text-ink-600">برای دسترسی در دوره ثبت‌نام کنید.</p><Button href={`/courses/${course.slug}`} className="mt-3">مشاهدهٔ دوره</Button></div></div>
          )}
          {lesson.videoSrc && open && <p className="text-xs text-ink-500">این یک ویدیوی نمونهٔ کوتاه برای نمایش پخش‌کننده است (ویدیوی کامل جلسه در این نسخه بارگذاری نشده). محافظت DRM یا پخش امن اعمال نشده است.</p>}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" disabled={!prev || !canAccessLesson(prev, enrolled)} onClick={() => prev && go(prev.id)}><ChevronRight className="size-4" />درس قبل</Button>
            <Button variant={done ? "secondary" : "primary"} onClick={markDone} disabled={!open}>{done ? <><CheckCircle2 className="size-4" />تکمیل شد (لغو)</> : <><Check className="size-4" />تکمیل این درس</>}</Button>
            <Button variant="outline" disabled={!next || !canAccessLesson(next, enrolled)} onClick={() => next && go(next.id)}>درس بعد<ChevronLeft className="size-4" /></Button>
          </div>

          {enrolled && prog.complete && (
            <Card className="border-success-600/30 bg-success-100 p-5">
              <h2 className="flex items-center gap-2 font-bold"><Award className="size-5 text-success-600" />همهٔ درس‌ها تکمیل شد</h2>
              {myCert ? <p className="mt-1 text-sm">گواهی شما صادر شده است. <Link href={`/certificate/${myCert.id}`} className="font-bold underline">مشاهدهٔ گواهی</Link></p>
                : elig?.quizPassed ? <div className="mt-2 flex flex-wrap items-center gap-3 text-sm"><span>آزمون پایانی را گذرانده‌اید.</span><Button size="sm" onClick={() => { const r = s.issueCertificate(user!.id, course.id); if (r.ok) toast.success("گواهی صادر شد.", { label: "مشاهده", href: `/certificate/${r.certificate!.id}` }); else toast.error(r.reason ?? "صدور ممکن نشد."); }}>دریافت گواهی</Button></div>
                : <p className="mt-1 text-sm">{quiz ? <>برای دریافت گواهی در آزمون پایانی حداقل {formatNumber(elig?.requiredPercent ?? 60)}٪ بگیرید. <Link href={`/quiz/${quiz.id}`} className="font-bold underline">شروع آزمون</Link></> : "آزمون پایانی تعریف نشده است."}</p>}
            </Card>
          )}

          <Tabs label="ابزارهای درس" tabs={[
            { id: "about", label: "دربارهٔ درس", content: <AboutTab lesson={lesson} /> },
            { id: "notes", label: <span className="flex items-center gap-1.5"><NotebookPen className="size-4" />یادداشت‌ها</span>, content: <NotesTab lessonId={lesson.id} courseId={course.id} enabled={enrolled} /> },
            { id: "bm", label: <span className="flex items-center gap-1.5"><Bookmark className="size-4" />نشانه‌ها</span>, content: <BookmarksTab lesson={lesson} courseId={course.id} enabled={enrolled} getTime={() => playerRef.current?.time() ?? 0} seek={(t) => playerRef.current?.seek(t)} /> },
            { id: "qa", label: <span className="flex items-center gap-1.5"><MessageCircleQuestion className="size-4" />پرسش و پاسخ</span>, content: <QaTab lessonId={lesson.id} courseId={course.id} enabled={enrolled} /> },
            { id: "res", label: <span className="flex items-center gap-1.5"><Download className="size-4" />منابع</span>, content: <ResourcesTab lesson={lesson} courseId={course.id} enabled={enrolled} /> },
            { id: "asg", label: <span className="flex items-center gap-1.5"><FileText className="size-4" />تکلیف</span>, content: <AssignmentTab courseId={course.id} enabled={enrolled} /> },
          ]} />
        </div>

        <aside aria-label="سرفصل‌های دوره" className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-card/60 px-4 py-3"><h2 className="font-bold">سرفصل‌ها</h2>{quiz && enrolled && <Button size="sm" variant="secondary" href={`/quiz/${quiz.id}`}><ListChecks className="size-4" />آزمون</Button>}</div>
            <div className="scroll-thin max-h-[32rem] overflow-y-auto">
              {course.sections.map((sec) => (
                <div key={sec.id}>
                  <p className="bg-cream-200/60 px-4 py-2 text-xs font-bold text-ink-600">{sec.title}</p>
                  <ul>
                    {sec.lessons.map((l) => {
                      const ok = canAccessLesson(l, enrolled); const isDone = completed.includes(l.id); const act = l.id === lesson.id;
                      return (
                        <li key={l.id}><button onClick={() => ok && go(l.id)} disabled={!ok} aria-current={act ? "true" : undefined} className={cn("flex min-h-12 w-full items-center gap-3 px-4 py-2 text-start text-sm transition-colors", act ? "bg-card font-bold text-brand-800" : "hover:bg-cream-200/50", !ok && "cursor-not-allowed text-ink-500")}>
                          {isDone ? <CheckCircle2 className="size-5 shrink-0 text-success-600" aria-label="تکمیل‌شده" /> : ok ? <PlayCircle className="size-5 shrink-0 text-brand-600" aria-hidden /> : <Lock className="size-4 shrink-0" aria-label="قفل" />}
                          <span className="flex-1">{l.title}</span><span className="tabular text-xs text-ink-500">{formatNumber(l.durationMin)}د</span>
                        </button></li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function AboutTab({ lesson }: { lesson: Lesson }) {
  return (<div className="space-y-3"><p className="leading-8 text-ink-700">{lesson.summary}</p>{lesson.keyPoints.length > 0 && <ul className="list-disc space-y-1 ps-6 text-ink-700 marker:text-brand-500">{lesson.keyPoints.map((k) => <li key={k}>{k}</li>)}</ul>}</div>);
}

function Gate({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const user = useSessionUser();
  if (!user) return <Alert tone="info">برای استفاده از این بخش <Link className="font-bold underline" href="/login">وارد شوید</Link>.</Alert>;
  if (!enabled) return <Alert tone="info">این بخش پس از ثبت‌نام در دوره فعال می‌شود.</Alert>;
  return <>{children}</>;
}

function NotesTab({ lessonId, courseId, enabled }: { lessonId: string; courseId: string; enabled: boolean }) {
  const user = useSessionUser();
  const notes = useApp((s) => s.notes);
  const add = useApp((s) => s.addNote);
  const del = useApp((s) => s.deleteNote);
  const [text, setText] = useState("");
  const mine = useMemo(() => notes.filter((n) => n.userId === user?.id && n.lessonId === lessonId), [notes, user?.id, lessonId]);
  return (
    <Gate enabled={enabled}>
      <form onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; add(courseId, lessonId, text); setText(""); toast.success("یادداشت ذخیره شد."); }} className="space-y-2">
        <label htmlFor="note" className="sr-only">یادداشت جدید</label>
        <Textarea id="note" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="نکته‌ای که می‌خواهید یادتان بماند…" maxLength={2000} />
        <Button type="submit" size="sm" disabled={!text.trim()}>ذخیرهٔ یادداشت</Button>
      </form>
      <ul className="mt-4 space-y-2">
        {mine.length === 0 && <li className="text-sm text-ink-500">هنوز یادداشتی برای این درس ندارید.</li>}
        {mine.map((n) => <li key={n.id} className="flex items-start gap-3 rounded-md border border-line bg-white p-3 text-sm"><div className="flex-1"><p className="whitespace-pre-wrap leading-7">{n.text}</p><p className="mt-1 text-xs text-ink-500">{formatDateTime(n.at)}</p></div><button onClick={() => del(n.id)} aria-label="حذف یادداشت" className="grid size-9 place-items-center rounded-md text-ink-500 hover:bg-danger-100 hover:text-danger-600"><Trash2 className="size-4" /></button></li>)}
      </ul>
    </Gate>
  );
}

function BookmarksTab({ lesson, courseId, enabled, getTime, seek }: { lesson: Lesson; courseId: string; enabled: boolean; getTime: () => number; seek: (t: number) => void }) {
  const user = useSessionUser();
  const list = useApp((s) => s.bookmarks);
  const add = useApp((s) => s.addBookmark);
  const rm = useApp((s) => s.removeBookmark);
  const mine = useMemo(() => list.filter((b) => b.userId === user?.id && b.lessonId === lesson.id), [list, user?.id, lesson.id]);
  return (
    <Gate enabled={enabled}>
      <Button size="sm" variant="secondary" onClick={() => { add(courseId, lesson.id, getTime(), `نشانه در ${formatClock(getTime())}`); toast.success("نشانه افزوده شد."); }}><Bookmark className="size-4" />نشانه‌گذاری {lesson.videoSrc ? "این لحظه" : "این درس"}</Button>
      <ul className="mt-4 space-y-2">
        {mine.length === 0 && <li className="text-sm text-ink-500">نشانه‌ای ندارید.</li>}
        {mine.map((b) => <li key={b.id} className="flex items-center gap-3 rounded-md border border-line bg-white p-3 text-sm"><button disabled={!lesson.videoSrc} onClick={() => seek(b.atSec)} className="flex-1 text-start hover:text-brand-700 disabled:cursor-default"><Badge tone="brand" className="me-2 tabular">{formatClock(b.atSec)}</Badge>{b.label}</button><button onClick={() => rm(b.id)} aria-label="حذف نشانه" className="grid size-9 place-items-center rounded-md text-ink-500 hover:bg-danger-100 hover:text-danger-600"><Trash2 className="size-4" /></button></li>)}
      </ul>
    </Gate>
  );
}

function QaTab({ lessonId, courseId, enabled }: { lessonId: string; courseId: string; enabled: boolean }) {
  const qa = useApp((s) => s.qa);
  const users = useApp((s) => s.users);
  const ask = useApp((s) => s.askQuestion);
  const [text, setText] = useState("");
  const list = useMemo(() => qa.filter((q) => q.lessonId === lessonId).sort((a, b) => b.at.localeCompare(a.at)), [qa, lessonId]);
  return (
    <div className="space-y-4">
      <Gate enabled={enabled}>
        <form onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; ask(courseId, lessonId, text); setText(""); toast.success("سؤال شما ثبت شد."); }} className="space-y-2">
          <label htmlFor="q" className="sr-only">سؤال</label>
          <Textarea id="q" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="سؤال خود را دربارهٔ این درس بنویسید…" maxLength={1500} />
          <Button type="submit" size="sm" disabled={!text.trim()}>ارسال سؤال</Button>
        </form>
      </Gate>
      <ul className="space-y-3">
        {list.length === 0 && <li className="text-sm text-ink-500">هنوز سؤالی برای این درس پرسیده نشده است.</li>}
        {list.map((q) => <li key={q.id} className="rounded-lg border border-line bg-white p-4 text-sm"><p className="font-medium"><span className="text-ink-500">{users.find((u) => u.id === q.userId)?.name ?? "کاربر"}:</span> {q.question}</p>{q.answer ? <p className="mt-2 rounded-md bg-card p-3 leading-7"><b>پاسخ مدرس:</b> {q.answer}</p> : <p className="mt-2 text-xs text-ink-500">در انتظار پاسخ مدرس</p>}</li>)}
      </ul>
    </div>
  );
}

function ResourcesTab({ lesson, courseId, enabled }: { lesson: Lesson; courseId: string; enabled: boolean }) {
  const resources = useApp((s) => s.resources);
  const course = useCourse(courseId);
  const list = resources.filter((r) => lesson.resourceIds.includes(r.id));
  const all = resources.filter((r) => r.courseId === courseId);
  return (
    <Gate enabled={enabled}>
      <h3 className="mb-2 text-sm font-bold">منابع این درس</h3>
      {list.length === 0 && <p className="mb-4 text-sm text-ink-500">این درس منبع جداگانه‌ای ندارد؛ منابع کل دوره را ببینید.</p>}
      <ul className="mb-5 space-y-2">{list.map((r) => <ResRow key={r.id} r={r} onGet={() => course && downloadResource(r, course)} />)}</ul>
      <h3 className="mb-2 text-sm font-bold">همهٔ منابع دوره</h3>
      <ul className="space-y-2">{all.map((r) => <ResRow key={r.id} r={r} onGet={() => course && downloadResource(r, course)} />)}</ul>
      <p className="mt-3 text-xs text-ink-500">منابع از محتوای دوره ساخته و به‌صورت فایل HTML قابل‌چاپ دریافت می‌شوند.</p>
    </Gate>
  );
}
function ResRow({ r, onGet }: { r: { id: string; title: string; kind: string; sizeKB: number }; onGet: () => void }) {
  return <li className="flex items-center gap-3 rounded-md border border-line bg-white p-3 text-sm"><FileText className="size-5 text-brand-600" aria-hidden /><span className="flex-1">{r.title}</span><Badge tone="neutral">{r.kind}</Badge><Button size="sm" variant="outline" onClick={onGet} aria-label={`دریافت ${r.title}`}><Download className="size-4" /></Button></li>;
}

function AssignmentTab({ courseId, enabled }: { courseId: string; enabled: boolean }) {
  const user = useSessionUser();
  const assignments = useApp((s) => s.assignments);
  const subs = useApp((s) => s.submissions);
  const submit = useApp((s) => s.submitAssignment);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const list = assignments.filter((a) => a.courseId === courseId);
  return (
    <Gate enabled={enabled}>
      {list.length === 0 && <p className="text-sm text-ink-500">برای این دوره تکلیف نوشتاری تعریف نشده است.</p>}
      <div className="space-y-5">
        {list.map((a) => {
          const mine = subs.find((x) => x.assignmentId === a.id && x.userId === user?.id);
          return (
            <section key={a.id} className="rounded-lg border border-line bg-white p-4"><h3 className="font-bold">{a.title}</h3><p className="mt-1 text-sm leading-8 text-ink-700"><MathText text={a.prompt} /></p><p className="mt-1 text-xs text-ink-500">مهلت: {formatDateTime(a.dueAt)} · نمرهٔ کل: {formatNumber(a.maxScore)}</p>
              {mine && <div className="mt-3 rounded-md bg-card p-3 text-sm"><p className="mb-1 text-xs text-ink-500">پاسخ ثبت‌شدهٔ شما ({formatDateTime(mine.submittedAt)}):</p><p className="whitespace-pre-wrap leading-7"><MathText text={mine.text} /></p>
                {mine.status === "reviewed" ? <p className="mt-2 border-t border-line pt-2"><Badge tone="success">بررسی شد: {formatNumber(mine.score ?? 0)} از {formatNumber(a.maxScore)}</Badge> <span className="mt-1 block"><MathText text={mine.feedback ?? ""} /></span></p> : <p className="mt-2"><Badge tone="warning">در انتظار بررسی مدرس</Badge></p>}</div>}
              {(!mine || mine.status === "pending") && <form onSubmit={(e) => { e.preventDefault(); const t = drafts[a.id]; if (!t?.trim()) return; submit(a.id, t); setDrafts({ ...drafts, [a.id]: "" }); toast.success("پاسخ ثبت شد."); }} className="mt-3 space-y-2"><label className="sr-only" htmlFor={`as-${a.id}`}>پاسخ</label><Textarea id={`as-${a.id}`} rows={4} value={drafts[a.id] ?? ""} onChange={(e) => setDrafts({ ...drafts, [a.id]: e.target.value })} placeholder="پاسخ خود را بنویسید (می‌توانید فرمول را بین $ بنویسید)" maxLength={5000} /><Button size="sm" type="submit" disabled={!drafts[a.id]?.trim()}>{mine ? "ویرایش پاسخ" : "ارسال پاسخ"}</Button></form>}
            </section>
          );
        })}
      </div>
    </Gate>
  );
}
