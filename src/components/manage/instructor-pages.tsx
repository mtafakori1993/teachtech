"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Eye, EyeOff, FileCheck, MessagesSquare, Pencil, Plus, Trash2, Users, Wallet, Download } from "lucide-react";
import { AnalyticsPanel, AnnouncementsManager, CertificatesPanel } from "./panels";
import { CourseFormDialog, LessonDialog, QuestionDialog, QuizDialog, SectionDialog } from "./forms";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, PageTitle, Progress, Stat } from "@/components/ui/primitives";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Tabs } from "@/components/ui/tabs";
import { MathText } from "@/components/ui/tex";
import { toast } from "@/components/ui/toast";
import { allLessons, courseMinutes, courseProgress, lessonCount } from "@/lib/progress";
import { revenueByCourse, totalRevenue } from "@/lib/analytics";
import { FORMAT_LABEL, GRADE_LABEL } from "@/lib/catalog";
import { formatDate, formatDateTime, formatDuration, formatNumber, formatPercent, formatToman } from "@/lib/format";
import { useApp, useSessionUser } from "@/store/app";
import type { Course, Lesson, Question, Quiz, Submission } from "@/data/types";

/** Courses taught by the signed-in instructor (matched through the instructor record linked to their user). */
export function useMyCourses() {
  const user = useSessionUser(); const instructors = useApp((s) => s.instructors); const courses = useApp((s) => s.courses);
  return useMemo(() => { const ins = instructors.find((i) => i.userId === user?.id); return courses.filter((c) => c.instructorId === ins?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }, [instructors, courses, user?.id]);
}

export function InstructorOverview() {
  const user = useSessionUser(); const mine = useMyCourses();
  const orders = useApp((s) => s.orders); const enrollments = useApp((s) => s.enrollments); const submissions = useApp((s) => s.submissions); const qa = useApp((s) => s.qa); const users = useApp((s) => s.users); const assignments = useApp((s) => s.assignments);
  const ids = new Set(mine.map((c) => c.id));
  const students = new Set(enrollments.filter((e) => ids.has(e.courseId)).map((e) => e.userId));
  const pending = submissions.filter((s) => ids.has(s.courseId) && s.status === "pending");
  const open = qa.filter((q) => ids.has(q.courseId) && !q.answer);
  const rev = revenueByCourse(orders, mine);
  return (
    <div className="space-y-8"><PageTitle title={`سلام ${user?.name.split(" ")[0] ?? ""}`}>خلاصهٔ وضعیت دوره‌ها و دانش‌آموزان شما.</PageTitle>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="دوره‌های شما" value={formatNumber(mine.length)} hint={`${formatNumber(mine.filter((c) => c.status === "published").length)} منتشرشده`} icon={<BookOpen className="size-5" />} />
        <Stat label="دانش‌آموزان" value={formatNumber(students.size)} icon={<Users className="size-5" />} tone="sun" />
        <Stat label="تکلیف در انتظار بررسی" value={formatNumber(pending.length)} icon={<FileCheck className="size-5" />} tone="flame" />
        <Stat label="پرسش بی‌پاسخ" value={formatNumber(open.length)} icon={<MessagesSquare className="size-5" />} tone="success" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="pa"><div className="mb-3 flex items-center justify-between"><h2 id="pa" className="text-xl font-bold">تکلیف‌های در انتظار</h2><Link href="/instructor/assignments" className="text-sm text-brand-700 underline underline-offset-4">همه</Link></div>
          <Card className="divide-y divide-line">{pending.length === 0 ? <p className="p-4 text-sm text-ink-500">تکلیفی در انتظار نیست.</p> : pending.slice(0, 4).map((s) => <div key={s.id} className="p-3 text-sm"><b>{users.find((u) => u.id === s.userId)?.name}</b> — {assignments.find((a) => a.id === s.assignmentId)?.title}<p className="text-xs text-ink-500">{formatDateTime(s.submittedAt)}</p></div>)}</Card></section>
        <section aria-labelledby="rv"><div className="mb-3 flex items-center justify-between"><h2 id="rv" className="text-xl font-bold">فروش (نمونه)</h2><Link href="/instructor/analytics" className="text-sm text-brand-700 underline underline-offset-4">گزارش کامل</Link></div>
          <Card className="space-y-2 p-4 text-sm"><p className="flex items-center gap-2 text-ink-600"><Wallet className="size-4" />مجموع (نمونه): <b className="tabular text-ink">{formatToman(totalRevenue(orders))}</b></p>{rev.slice(0, 4).map((r) => <p key={r.course.id} className="flex justify-between gap-3"><span className="truncate">{r.course.title}</span><span className="tabular text-ink-600">{formatToman(r.revenue)}</span></p>)}<p className="pt-1 text-xs text-ink-500">ارقام از سفارش‌های شبیه‌سازی‌شده محاسبه می‌شود.</p></Card></section>
      </div>
    </div>
  );
}

export function InstructorCourses() {
  const mine = useMyCourses(); const setStatus = useApp((s) => s.setCourseStatus); const del = useApp((s) => s.deleteCourse); const enrollments = useApp((s) => s.enrollments);
  const [form, setForm] = useState<{ course?: Course } | null>(null); const [rm, setRm] = useState<Course | null>(null);
  return (
    <div><PageTitle title="دوره‌ها" actions={<Button onClick={() => setForm({})}><Plus className="size-4" />دورهٔ جدید</Button>}>ساخت، ویرایش و انتشار دوره‌ها.</PageTitle>
      <DataTable caption="دوره‌های من" rows={mine} rowKey={(c) => c.id} searchText={(c) => c.title} pageSize={8} empty={{ title: "هنوز دوره‌ای ندارید", text: "با «دورهٔ جدید» شروع کنید." }}
        filters={[{ id: "st", label: "وضعیت", options: [{ value: "published", label: "منتشرشده" }, { value: "draft", label: "پیش‌نویس" }], test: (c, v) => c.status === v }]}
        columns={[{ key: "t", header: "دوره", sort: (c) => c.title, cell: (c) => <div><Link href={`/instructor/courses/${c.id}`} className="font-bold hover:text-brand-700">{c.title}</Link><p className="text-xs text-ink-500">{GRADE_LABEL[c.grade]} · {FORMAT_LABEL[c.format]} · {formatNumber(lessonCount(c))} درس</p></div> }, { key: "p", header: "قیمت", sort: (c) => c.price, cell: (c) => <span className="tabular">{formatToman(c.price)}</span>, hideOnMobile: true }, { key: "e", header: "ثبت‌نام", sort: (c) => enrollments.filter((e) => e.courseId === c.id).length, cell: (c) => <span className="tabular">{formatNumber(enrollments.filter((e) => e.courseId === c.id).length)}</span>, hideOnMobile: true }, { key: "s", header: "وضعیت", cell: (c) => <Badge tone={c.status === "published" ? "success" : "warning"}>{c.status === "published" ? "منتشرشده" : "پیش‌نویس"}</Badge> },
          { key: "a", header: "", cell: (c) => <span className="flex gap-1"><Button size="sm" variant="outline" onClick={() => { setStatus(c.id, c.status === "published" ? "draft" : "published"); toast.success(c.status === "published" ? "دوره از حالت انتشار خارج شد." : "دوره منتشر شد."); }}>{c.status === "published" ? <><EyeOff className="size-4" />لغو انتشار</> : <><Eye className="size-4" />انتشار</>}</Button><Button size="sm" variant="ghost" aria-label="ویرایش مشخصات" onClick={() => setForm({ course: c })}><Pencil className="size-4" /></Button><Button size="sm" variant="ghost" aria-label="حذف دوره" onClick={() => setRm(c)}><Trash2 className="size-4 text-danger-600" /></Button></span> }]} />
      {form && <CourseFormDialog key={form.course?.id ?? "new"} open onClose={() => setForm(null)} course={form.course} />}
      <ConfirmDialog open={!!rm} onClose={() => setRm(null)} onConfirm={() => { if (rm) { del(rm.id); toast.success("دوره حذف شد."); } }} title="حذف دوره" danger confirmLabel="حذف">دورهٔ «{rm?.title}» همراه با آزمون‌ها و منابعش حذف می‌شود. این کار در این مرورگر برگشت‌پذیر نیست (فقط با بازنشانی کل داده‌ها).</ConfirmDialog>
    </div>
  );
}

export function CourseEditor({ id }: { id: string }) {
  const course = useApp((s) => s.courses.find((c) => c.id === id)); const quizzes = useApp((s) => s.quizzes); const resources = useApp((s) => s.resources);
  const setStatus = useApp((s) => s.setCourseStatus); const delLesson = useApp((s) => s.deleteLesson); const delSection = useApp((s) => s.deleteSection); const move = useApp((s) => s.moveLesson); const delRes = useApp((s) => s.deleteResource); const addRes = useApp((s) => s.addResource); const delQuiz = useApp((s) => s.deleteQuiz);
  const [dlg, setDlg] = useState<{ kind: "course" } | { kind: "section"; section?: { id: string; title: string } } | { kind: "lesson"; sectionId: string; lesson?: Lesson } | { kind: "quiz"; quiz?: Quiz } | null>(null);
  const [rm, setRm] = useState<{ label: string; run: () => void } | null>(null); const [resTitle, setResTitle] = useState("");
  if (!course) return <EmptyState title="دوره پیدا نشد" action={<Button href="/instructor/courses">بازگشت</Button>} />;
  const cq = quizzes.filter((q) => q.courseId === id); const cr = resources.filter((r) => r.courseId === id);
  return (
    <div className="space-y-5">
      <PageTitle title={course.title} actions={<><Button variant="outline" href={`/courses/${course.slug}`}>مشاهدهٔ صفحهٔ عمومی</Button><Button variant="outline" onClick={() => setDlg({ kind: "course" })}><Pencil className="size-4" />مشخصات</Button><Button onClick={() => { setStatus(id, course.status === "published" ? "draft" : "published"); toast.success(course.status === "published" ? "از انتشار خارج شد." : "منتشر شد."); }}>{course.status === "published" ? "لغو انتشار" : "انتشار دوره"}</Button></>}>
        <Badge tone={course.status === "published" ? "success" : "warning"}>{course.status === "published" ? "منتشرشده" : "پیش‌نویس"}</Badge> <span className="ms-2">{formatNumber(lessonCount(course))} درس · {formatDuration(courseMinutes(course))} · {formatToman(course.price)}</span></PageTitle>
      <Tabs label="بخش‌های دوره" tabs={[
        { id: "cur", label: "سرفصل و درس‌ها", content: (
          <div className="space-y-4"><div className="flex justify-end"><Button size="sm" onClick={() => setDlg({ kind: "section" })}><Plus className="size-4" />بخش جدید</Button></div>
            {course.sections.length === 0 && <EmptyState title="هنوز بخشی ندارید" action={<Button onClick={() => setDlg({ kind: "section" })}>افزودن بخش</Button>}>برای شروع یک بخش بسازید و درس‌ها را به آن اضافه کنید.</EmptyState>}
            {course.sections.map((sec) => (
              <Card key={sec.id} className="overflow-hidden"><div className="flex items-center gap-2 border-b border-line bg-card/60 px-4 py-2.5"><h3 className="flex-1 font-bold">{sec.title}</h3><Button size="sm" variant="secondary" onClick={() => setDlg({ kind: "lesson", sectionId: sec.id })}><Plus className="size-4" />درس</Button><Button size="sm" variant="ghost" aria-label="ویرایش بخش" onClick={() => setDlg({ kind: "section", section: sec })}><Pencil className="size-4" /></Button><Button size="sm" variant="ghost" aria-label="حذف بخش" onClick={() => setRm({ label: `بخش «${sec.title}» و همهٔ درس‌هایش`, run: () => delSection(id, sec.id) })}><Trash2 className="size-4 text-danger-600" /></Button></div>
                <ul className="divide-y divide-line">{sec.lessons.length === 0 && <li className="p-4 text-sm text-ink-500">درسی ندارد.</li>}{sec.lessons.map((l, i) => <li key={l.id} className="flex items-center gap-2 px-4 py-2.5 text-sm"><span className="flex-1">{l.title}{l.isPreview && <Badge tone="sun" className="ms-2">پیش‌نمایش</Badge>}<span className="tabular ms-2 text-xs text-ink-500">{formatNumber(l.durationMin)} دقیقه</span></span><Button size="sm" variant="ghost" aria-label="بالا" disabled={i === 0} onClick={() => move(id, l.id, -1)}><ArrowUp className="size-4" /></Button><Button size="sm" variant="ghost" aria-label="پایین" disabled={i === sec.lessons.length - 1} onClick={() => move(id, l.id, 1)}><ArrowDown className="size-4" /></Button><Button size="sm" variant="ghost" aria-label="ویرایش درس" onClick={() => setDlg({ kind: "lesson", sectionId: sec.id, lesson: l })}><Pencil className="size-4" /></Button><Button size="sm" variant="ghost" aria-label="حذف درس" onClick={() => setRm({ label: `درس «${l.title}»`, run: () => delLesson(id, l.id) })}><Trash2 className="size-4 text-danger-600" /></Button></li>)}</ul>
              </Card>))}
          </div>) },
        { id: "res", label: "منابع", content: (
          <div className="space-y-4"><form className="flex max-w-xl gap-2" onSubmit={(e) => { e.preventDefault(); if (resTitle.trim().length < 3) return toast.error("عنوان منبع را وارد کنید."); addRes({ id: `${id}-r${Date.now().toString(36)}`, courseId: id, title: resTitle.trim(), kind: "جزوه", sizeKB: 200 }); setResTitle(""); toast.success("منبع افزوده شد."); }}><label className="sr-only" htmlFor="rt">عنوان منبع</label><Input id="rt" value={resTitle} onChange={(e) => setResTitle(e.target.value)} placeholder="عنوان منبع جدید" /><Button type="submit"><Plus className="size-4" />افزودن</Button></form>
            <Card className="divide-y divide-line">{cr.map((r) => <div key={r.id} className="flex items-center gap-3 p-3 text-sm"><Download className="size-4 text-brand-600" /><span className="flex-1">{r.title}</span><Badge tone="neutral">{r.kind}</Badge><Button size="sm" variant="ghost" aria-label="حذف منبع" onClick={() => setRm({ label: `منبع «${r.title}»`, run: () => delRes(r.id) })}><Trash2 className="size-4 text-danger-600" /></Button></div>)}</Card><p className="text-xs text-ink-500">فایل منبع هنگام دریافت توسط دانش‌آموز از محتوای دوره ساخته می‌شود.</p></div>) },
        { id: "qz", label: "آزمون‌ها", content: (
          <div className="space-y-4"><div className="flex justify-end"><Button size="sm" onClick={() => setDlg({ kind: "quiz" })}><Plus className="size-4" />آزمون جدید</Button></div>
            <Card className="divide-y divide-line">{cq.length === 0 ? <p className="p-4 text-sm text-ink-500">آزمونی ندارد.</p> : cq.map((q) => <div key={q.id} className="flex items-center gap-3 p-3 text-sm"><div className="flex-1"><b>{q.title}</b>{course.certificateQuizId === q.id && <Badge tone="sun" className="ms-2">آزمون گواهی</Badge>}<p className="text-xs text-ink-500">{formatNumber(q.questionIds.length)} سؤال · قبولی {formatPercent(q.passPercent)} · {q.published ? "منتشرشده" : "پیش‌نویس"}</p></div><Button size="sm" variant="ghost" aria-label="ویرایش آزمون" onClick={() => setDlg({ kind: "quiz", quiz: q })}><Pencil className="size-4" /></Button><Button size="sm" variant="ghost" aria-label="حذف آزمون" onClick={() => setRm({ label: `آزمون «${q.title}»`, run: () => delQuiz(q.id) })}><Trash2 className="size-4 text-danger-600" /></Button></div>)}</Card></div>) },
      ]} />
      {dlg?.kind === "course" && <CourseFormDialog open onClose={() => setDlg(null)} course={course} />}
      {dlg?.kind === "section" && <SectionDialog key={dlg.section?.id ?? "n"} open onClose={() => setDlg(null)} courseId={id} section={dlg.section} />}
      {dlg?.kind === "lesson" && <LessonDialog key={dlg.lesson?.id ?? "n"} open onClose={() => setDlg(null)} courseId={id} sectionId={dlg.sectionId} lesson={dlg.lesson} />}
      {dlg?.kind === "quiz" && <QuizDialog key={dlg.quiz?.id ?? "n"} open onClose={() => setDlg(null)} quiz={dlg.quiz ?? ({ courseId: id } as Quiz)} />}
      <ConfirmDialog open={!!rm} onClose={() => setRm(null)} onConfirm={() => { rm?.run(); toast.success("حذف شد."); }} title="تأیید حذف" danger confirmLabel="حذف">{rm?.label} حذف شود؟</ConfirmDialog>
    </div>
  );
}

export function InstructorQuizzes() {
  const mine = useMyCourses(); const ids = new Set(mine.map((c) => c.id));
  const quizzes = useApp((s) => s.quizzes).filter((q) => ids.has(q.courseId)); const bank = useApp((s) => s.questions).filter((q) => ids.has(q.courseId)); const attempts = useApp((s) => s.attempts); const users = useApp((s) => s.users); const delQ = useApp((s) => s.deleteQuestion); const delQuiz = useApp((s) => s.deleteQuiz);
  const [dlg, setDlg] = useState<{ q?: Question } | { quiz?: Quiz } | null>(null); const [rm, setRm] = useState<{ label: string; run: () => void } | null>(null);
  const TYPE = { mcq: "چندگزینه‌ای", tf: "درست/نادرست", short: "پاسخ کوتاه" };
  return (
    <div><PageTitle title="آزمون‌ها و بانک سؤال" />
      <Tabs label="آزمون‌ها" tabs={[
        { id: "quizzes", label: "آزمون‌ها", content: <div className="space-y-3"><div className="flex justify-end"><Button onClick={() => setDlg({ quiz: undefined })}><Plus className="size-4" />آزمون جدید</Button></div><DataTable caption="آزمون‌ها" rows={quizzes} rowKey={(q) => q.id} searchText={(q) => q.title} pageSize={8} columns={[{ key: "t", header: "آزمون", cell: (q) => <div><b>{q.title}</b><p className="text-xs text-ink-500">{mine.find((c) => c.id === q.courseId)?.title}</p></div> }, { key: "n", header: "سؤال", cell: (q) => formatNumber(q.questionIds.length), hideOnMobile: true }, { key: "p", header: "قبولی", cell: (q) => formatPercent(q.passPercent), hideOnMobile: true }, { key: "s", header: "وضعیت", cell: (q) => <Badge tone={q.published ? "success" : "warning"}>{q.published ? "منتشرشده" : "پیش‌نویس"}</Badge> }, { key: "a", header: "", cell: (q) => <span className="flex"><Button size="sm" variant="ghost" aria-label="ویرایش" onClick={() => setDlg({ quiz: q })}><Pencil className="size-4" /></Button><Button size="sm" variant="ghost" aria-label="حذف" onClick={() => setRm({ label: `آزمون «${q.title}»`, run: () => delQuiz(q.id) })}><Trash2 className="size-4 text-danger-600" /></Button></span> }]} /></div> },
        { id: "bank", label: "بانک سؤال", content: <div className="space-y-3"><div className="flex justify-end"><Button onClick={() => setDlg({ q: undefined })}><Plus className="size-4" />سؤال جدید</Button></div><DataTable caption="بانک سؤال" rows={bank} rowKey={(q) => q.id} searchText={(q) => `${q.prompt} ${q.topic}`} pageSize={8}
          filters={[{ id: "t", label: "نوع", options: Object.entries(TYPE).map(([value, label]) => ({ value, label })), test: (q, v) => q.type === v }, { id: "c", label: "دوره", options: mine.map((c) => ({ value: c.id, label: c.title })), test: (q, v) => q.courseId === v }]}
          columns={[{ key: "p", header: "سؤال", cell: (q) => <span className="line-clamp-2 max-w-md"><MathText text={q.prompt} /></span> }, { key: "t", header: "نوع", cell: (q) => <Badge tone="neutral">{TYPE[q.type]}</Badge>, hideOnMobile: true }, { key: "m", header: "مبحث", cell: (q) => q.topic, hideOnMobile: true }, { key: "a", header: "", cell: (q) => <span className="flex"><Button size="sm" variant="ghost" aria-label="ویرایش" onClick={() => setDlg({ q })}><Pencil className="size-4" /></Button><Button size="sm" variant="ghost" aria-label="حذف" onClick={() => setRm({ label: "این سؤال", run: () => delQ(q.id) })}><Trash2 className="size-4 text-danger-600" /></Button></span> }]} /></div> },
        { id: "results", label: "نتایج", content: <DataTable caption="نتایج آزمون‌ها" rows={attempts.filter((a) => ids.has(a.courseId))} rowKey={(a) => a.id} searchText={(a) => `${users.find((u) => u.id === a.userId)?.name} ${quizzes.find((q) => q.id === a.quizId)?.title}`} pageSize={8} empty={{ title: "هنوز نتیجه‌ای ثبت نشده" }}
          filters={[{ id: "r", label: "نتیجه", options: [{ value: "p", label: "قبول" }, { value: "f", label: "مردود" }], test: (a, v) => (v === "p") === a.passed }]}
          columns={[{ key: "u", header: "دانش‌آموز", sort: (a) => users.find((u) => u.id === a.userId)?.name ?? "", cell: (a) => users.find((u) => u.id === a.userId)?.name }, { key: "q", header: "آزمون", cell: (a) => quizzes.find((q) => q.id === a.quizId)?.title, hideOnMobile: true }, { key: "s", header: "نمره", sort: (a) => a.percent, cell: (a) => <span className="tabular">{formatPercent(a.percent)}</span> }, { key: "r", header: "نتیجه", cell: (a) => <Badge tone={a.passed ? "success" : "danger"}>{a.passed ? "قبول" : "مردود"}</Badge> }, { key: "d", header: "تاریخ", sort: (a) => a.submittedAt, cell: (a) => formatDate(a.submittedAt), hideOnMobile: true }]} /> },
      ]} />
      {dlg && "quiz" in dlg && <QuizDialog key={dlg.quiz?.id ?? "n"} open onClose={() => setDlg(null)} quiz={dlg.quiz} />}
      {dlg && "q" in dlg && <QuestionDialog key={dlg.q?.id ?? "n"} open onClose={() => setDlg(null)} question={dlg.q} courseId={mine[0]?.id} />}
      <ConfirmDialog open={!!rm} onClose={() => setRm(null)} onConfirm={() => { rm?.run(); toast.success("حذف شد."); }} title="تأیید حذف" danger confirmLabel="حذف">{rm?.label} حذف شود؟{rm?.label === "این سؤال" && " از آزمون‌هایی که شامل آن بود هم برداشته می‌شود."}</ConfirmDialog>
    </div>
  );
}

export function InstructorStudents() {
  const mine = useMyCourses(); const ids = new Set(mine.map((c) => c.id));
  const enrollments = useApp((s) => s.enrollments); const users = useApp((s) => s.users); const completed = useApp((s) => s.completed);
  const rows = enrollments.filter((e) => ids.has(e.courseId)).map((e) => { const course = mine.find((c) => c.id === e.courseId)!; return { e, user: users.find((u) => u.id === e.userId)!, course, prog: courseProgress(course, completed[`${e.userId}:${e.courseId}`] ?? []) }; }).filter((r) => r.user);
  return (
    <div><PageTitle title="دانش‌آموزان" >فهرست ثبت‌نام‌ها و پیشرفت هر دانش‌آموز (داده‌های نمونه).</PageTitle>
      <DataTable caption="دانش‌آموزان" rows={rows} rowKey={(r) => r.e.id} searchText={(r) => `${r.user.name} ${r.course.title}`} pageSize={10}
        filters={[{ id: "c", label: "دوره", options: mine.map((c) => ({ value: c.id, label: c.title })), test: (r, v) => r.course.id === v }, { id: "p", label: "پیشرفت", options: [{ value: "done", label: "تکمیل‌شده" }, { value: "mid", label: "در حال یادگیری" }, { value: "new", label: "شروع‌نشده" }], test: (r, v) => v === "done" ? r.prog.complete : v === "new" ? r.prog.done === 0 : r.prog.done > 0 && !r.prog.complete }]}
        columns={[{ key: "u", header: "دانش‌آموز", sort: (r) => r.user.name, cell: (r) => <div><b>{r.user.name}</b><p className="text-xs text-ink-500">{r.user.city}</p></div> }, { key: "c", header: "دوره", cell: (r) => r.course.title, hideOnMobile: true }, { key: "d", header: "ثبت‌نام", sort: (r) => r.e.enrolledAt, cell: (r) => formatDate(r.e.enrolledAt), hideOnMobile: true }, { key: "p", header: "پیشرفت", sort: (r) => r.prog.percent, cell: (r) => <div className="min-w-32"><Progress value={r.prog.percent} label={`پیشرفت ${r.user.name}`} /><span className="tabular text-xs text-ink-600">{formatNumber(r.prog.done)}/{formatNumber(r.prog.total)} · {formatNumber(r.prog.percent)}٪</span></div> }]} />
    </div>
  );
}

export function InstructorAssignments() {
  const mine = useMyCourses(); const ids = new Set(mine.map((c) => c.id));
  const subs = useApp((s) => s.submissions).filter((s) => ids.has(s.courseId)); const assignments = useApp((s) => s.assignments); const users = useApp((s) => s.users); const review = useApp((s) => s.reviewSubmission);
  const [sel, setSel] = useState<Submission | null>(null); const [score, setScore] = useState(""); const [fb, setFb] = useState(""); const [err, setErr] = useState("");
  const a = sel ? assignments.find((x) => x.id === sel.assignmentId) : undefined;
  const open = (s: Submission) => { setSel(s); setScore(s.score !== undefined ? String(s.score) : ""); setFb(s.feedback ?? ""); setErr(""); };
  return (
    <div><PageTitle title="بررسی تکلیف‌ها">پاسخ‌های نوشتاری دانش‌آموزان را نمره بدهید و بازخورد بنویسید.</PageTitle>
      <DataTable caption="تکلیف‌ها" rows={subs} rowKey={(s) => s.id} searchText={(s) => `${users.find((u) => u.id === s.userId)?.name} ${assignments.find((x) => x.id === s.assignmentId)?.title}`} pageSize={8} empty={{ title: "تکلیفی ارسال نشده است" }}
        filters={[{ id: "s", label: "وضعیت", options: [{ value: "pending", label: "در انتظار" }, { value: "reviewed", label: "بررسی‌شده" }], test: (s, v) => s.status === v }]}
        columns={[{ key: "u", header: "دانش‌آموز", cell: (s) => <b>{users.find((u) => u.id === s.userId)?.name}</b> }, { key: "a", header: "تکلیف", cell: (s) => assignments.find((x) => x.id === s.assignmentId)?.title, hideOnMobile: true }, { key: "d", header: "ارسال", sort: (s) => s.submittedAt, cell: (s) => formatDateTime(s.submittedAt), hideOnMobile: true }, { key: "st", header: "وضعیت", cell: (s) => s.status === "reviewed" ? <Badge tone="success">{formatNumber(s.score ?? 0)} نمره</Badge> : <Badge tone="warning">در انتظار</Badge> }, { key: "x", header: "", cell: (s) => <Button size="sm" variant={s.status === "pending" ? "primary" : "outline"} onClick={() => open(s)}>{s.status === "pending" ? "بررسی" : "مشاهده"}</Button> }]} />
      {sel && a && <Dialog open onClose={() => setSel(null)} size="lg" title={a.title} description={`پاسخ ${users.find((u) => u.id === sel.userId)?.name}`} footer={<><Button variant="ghost" onClick={() => setSel(null)}>بستن</Button><Button onClick={() => { const n = Number(score); if (score === "" || !(n >= 0 && n <= a.maxScore)) return setErr(`نمره باید بین ۰ تا ${formatNumber(a.maxScore)} باشد.`); review(sel.id, n, fb); toast.success("نمره و بازخورد ثبت شد."); setSel(null); }}>ثبت نمره</Button></>}>
        <div className="space-y-4"><p className="rounded-md bg-card p-3 text-sm leading-8"><b>صورت تکلیف: </b><MathText text={a.prompt} /></p><div><p className="mb-1 text-sm font-bold">پاسخ دانش‌آموز</p><p className="whitespace-pre-wrap rounded-md border border-line p-3 text-sm leading-8"><MathText text={sel.text} /></p></div>
          <Field label={`نمره (از ${formatNumber(a.maxScore)})`} error={err}>{(p) => <Input {...p} inputMode="numeric" dir="ltr" className="max-w-32 text-end" value={score} onChange={(e) => setScore(e.target.value)} />}</Field><Field label="بازخورد">{(p) => <Textarea {...p} rows={3} value={fb} onChange={(e) => setFb(e.target.value)} />}</Field></div></Dialog>}
    </div>
  );
}

export function InstructorQA() {
  const mine = useMyCourses(); const ids = new Set(mine.map((c) => c.id));
  const qa = useApp((s) => s.qa).filter((q) => ids.has(q.courseId)); const users = useApp((s) => s.users); const courses = useApp((s) => s.courses); const answer = useApp((s) => s.answerQuestion);
  const [txt, setTxt] = useState<Record<string, string>>({});
  const sorted = [...qa].sort((a, b) => Number(!!a.answer) - Number(!!b.answer) || b.at.localeCompare(a.at));
  const lessonTitle = (cid: string, lid: string) => { const c = courses.find((x) => x.id === cid); return c ? allLessons(c).find((l) => l.id === lid)?.title : ""; };
  return (
    <div><PageTitle title="پرسش و پاسخ درس‌ها" />
      {sorted.length === 0 ? <EmptyState icon={<MessagesSquare className="size-6" />} title="پرسشی ثبت نشده است" /> : <ul className="space-y-3">{sorted.map((q) => <Card as="li" key={q.id} className="p-4 text-sm"><p className="text-xs text-ink-500">{users.find((u) => u.id === q.userId)?.name} · {lessonTitle(q.courseId, q.lessonId)} · {formatDateTime(q.at)}</p><p className="mt-1 font-medium">{q.question}</p>
        {q.answer ? <p className="mt-2 rounded-md bg-card p-3 leading-7"><b>پاسخ شما: </b>{q.answer}</p> : <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); const t = txt[q.id]; if (!t?.trim()) return; answer(q.id, t); setTxt({ ...txt, [q.id]: "" }); toast.success("پاسخ ثبت شد."); }}><label className="sr-only" htmlFor={`a-${q.id}`}>پاسخ</label><Textarea id={`a-${q.id}`} rows={2} value={txt[q.id] ?? ""} onChange={(e) => setTxt({ ...txt, [q.id]: e.target.value })} placeholder="پاسخ خود را بنویسید…" /><Button size="sm" type="submit" disabled={!txt[q.id]?.trim()}>ارسال پاسخ</Button></form>}</Card>)}</ul>}
    </div>
  );
}

export function InstructorAnnouncements() { const mine = useMyCourses(); return <div><PageTitle title="اطلاعیه‌ها">اطلاعیه برای دانش‌آموزان یکی از دوره‌های شما.</PageTitle><AnnouncementsManager scopeCourseIds={mine.map((c) => c.id)} /></div>; }
export function InstructorAnalytics() { const mine = useMyCourses(); return <div><PageTitle title="تحلیل و فروش" /><AnalyticsPanel courseIds={mine.map((c) => c.id)} /></div>; }
export function InstructorCertificates() { const mine = useMyCourses(); return <div><PageTitle title="وضعیت گواهی دانش‌آموزان">شرط گواهی: تکمیل همهٔ درس‌ها و قبولی در آزمون پایانی.</PageTitle><CertificatesPanel scopeCourseIds={mine.map((c) => c.id)} /></div>; }
