"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Award, BookOpen, Check, Heart, Plus, Printer, RotateCcw, Smartphone, Target, Trash2, Bell } from "lucide-react";
import { useStudentData } from "./student-data";
import { CourseCover } from "@/components/brand/course-cover";
import { CourseCard } from "@/components/course/course-card";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, PageTitle, Progress } from "@/components/ui/primitives";
import { Field, Input, Select, Switch } from "@/components/ui/form";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { Tabs } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { STATUS } from "@/components/pages/order-view";
import { useInstall } from "@/components/pwa/install-provider";
import { attemptsFor, bestAttempt } from "@/lib/quiz";
import { GRADE_LABEL } from "@/lib/catalog";
import { formatDate, formatDateTime, formatNumber, formatPercent, formatToman, formatWeekday } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app";
import type { Grade } from "@/data/types";

/* ---------- My courses ---------- */
export function MyCourses() {
  const { enrolled } = useStudentData();
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const list = enrolled.filter((e) => filter === "all" || (filter === "done" ? e.prog.complete : !e.prog.complete));
  return (
    <div>
      <PageTitle title="دوره‌های من">{formatNumber(enrolled.length)} دورهٔ ثبت‌نام‌شده</PageTitle>
      <div role="group" aria-label="فیلتر وضعیت" className="mb-5 flex gap-2">{([["all", "همه"], ["active", "در حال یادگیری"], ["done", "تکمیل‌شده"]] as const).map(([k, l]) => <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)} className={cn("min-h-10 rounded-full border px-4 text-sm font-medium", filter === k ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-white hover:bg-card")}>{l}</button>)}</div>
      {list.length === 0 ? <EmptyState icon={<BookOpen className="size-6" />} title="دوره‌ای در این بخش نیست" action={<Button href="/courses" variant="cta">مشاهدهٔ دوره‌ها</Button>} /> : (
        <ul className="space-y-4">{list.map(({ course, prog, next, hasCert, elig }) => (
          <Card as="li" key={course.id} className="flex flex-col gap-4 p-4 sm:flex-row">
            <CourseCover art={course.art} seed={course.id} alt="" className="aspect-[8/5] w-full shrink-0 rounded-md sm:w-48" />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{course.title}</h2>{prog.complete ? <Badge tone="success"><Check className="size-3" />تکمیل‌شده</Badge> : <Badge>در حال یادگیری</Badge>}{hasCert && <Badge tone="sun"><Award className="size-3" />گواهی صادر شد</Badge>}</div>
              <div><div className="mb-1 flex justify-between text-sm"><span className="tabular">{formatNumber(prog.done)} درس تکمیل · {formatNumber(prog.remaining)} باقی‌مانده</span><span className="tabular font-bold">{formatNumber(prog.percent)}٪</span></div><Progress value={prog.percent} tone={prog.complete ? "success" : "brand"} label={`پیشرفت ${course.title}`} /></div>
              {!prog.complete && next && <p className="text-sm text-ink-600">درس بعد: {next.title}</p>}
              {prog.complete && !hasCert && <p className="text-sm text-ink-600">{elig.reasons[0] ?? "برای گواهی آمادهٔ صدور است."}</p>}
              <div className="mt-auto flex flex-wrap gap-2"><Button size="sm" href={`/learn/${course.slug}${next ? `?lesson=${next.id}` : ""}`}>{prog.done === 0 ? "شروع یادگیری" : prog.complete ? "مرور دوره" : "ادامهٔ یادگیری"}</Button>{elig.quizPassed || !hasCert ? null : null}<Button size="sm" variant="outline" href={`/courses/${course.slug}`}>صفحهٔ دوره</Button></div>
            </div>
          </Card>))}</ul>)}
    </div>
  );
}

/* ---------- Calendar ---------- */
const DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
export function LearningCalendar() {
  const { user, enrolled } = useStudentData();
  const plan = useApp((s) => s.studyPlan); const goals = useApp((s) => s.goals); const activity = useApp((s) => s.activity); const prefs = useApp((s) => s.prefs);
  const quizzes = useApp((s) => s.quizzes); const attempts = useApp((s) => s.attempts); const assignments = useApp((s) => s.assignments); const subs = useApp((s) => s.submissions);
  const add = useApp((s) => s.addStudyItem); const toggle = useApp((s) => s.toggleStudyItem); const del = useApp((s) => s.deleteStudyItem);
  const addGoal = useApp((s) => s.addGoal); const bump = useApp((s) => s.bumpGoal); const delGoal = useApp((s) => s.deleteGoal);
  const [open, setOpen] = useState(false); const [gOpen, setGOpen] = useState(false);
  const [form, setForm] = useState({ title: "", weekday: "0", time: "17:00", courseId: "" }); const [gForm, setGForm] = useState({ title: "", target: "5", unit: "درس" }); const [err, setErr] = useState("");
  const ids = new Set(enrolled.map((e) => e.course.id));
  const mine = plan.filter((p) => p.userId === user?.id); const myGoals = goals.filter((g) => g.userId === user?.id);
  const events = useMemo(() => [
    ...quizzes.filter((q) => ids.has(q.courseId) && q.dueAt && !q.practice && !attemptsFor(attempts, user?.id ?? "", q.id).some((a) => a.passed)).map((q) => ({ id: q.id, at: q.dueAt!, title: `آزمون: ${q.title}`, href: `/quiz/${q.id}` })),
    ...assignments.filter((a) => ids.has(a.courseId) && !subs.some((s) => s.assignmentId === a.id && s.userId === user?.id)).map((a) => ({ id: a.id, at: a.dueAt, title: `تکلیف: ${a.title}`, href: `/learn/${enrolled.find((e) => e.course.id === a.courseId)?.course.slug}` })),
  ].sort((a, b) => a.at.localeCompare(b.at)), [quizzes, assignments, attempts, subs, enrolled, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (6 - i)); return d; });
    return days.map((d) => { const key = d.toISOString().slice(0, 10); const min = activity.filter((a) => a.userId === user?.id && new Date(a.at).toLocaleDateString("sv", { timeZone: "Asia/Tehran" }) === d.toLocaleDateString("sv", { timeZone: "Asia/Tehran" })).reduce((t, a) => t + a.minutes, 0); return { key, label: formatWeekday(d.toISOString()), min }; });
  }, [activity, user?.id]);
  const total = week.reduce((t, d) => t + d.min, 0); const max = Math.max(60, ...week.map((d) => d.min));
  return (
    <div className="space-y-8">
      <PageTitle title="تقویم یادگیری">برنامهٔ هفتگی، مهلت آزمون‌ها و هدف‌های شما.</PageTitle>
      <section aria-labelledby="wk"><h2 id="wk" className="mb-3 text-xl font-bold">فعالیت ۷ روز گذشته</h2>
        <Card className="p-5"><div className="flex items-end justify-between gap-2 sm:gap-4" role="img" aria-label={`مجموع ${formatNumber(total)} دقیقه یادگیری در هفتهٔ گذشته`}>{week.map((d) => <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5"><span className="tabular text-xs text-ink-600">{d.min ? formatNumber(d.min) : "—"}</span><div className="flex h-32 w-full items-end rounded-md bg-card"><div className="w-full rounded-md bg-brand-500 transition-[height]" style={{ height: `${(d.min / max) * 100}%` }} /></div><span className="text-center text-[0.7rem] text-ink-600">{d.label}</span></div>)}</div>
          <div className="mt-4 text-sm"><div className="mb-1 flex justify-between"><span>هدف هفتگی: {formatNumber(prefs.weeklyGoalMin)} دقیقه</span><span className="tabular">{formatNumber(total)} دقیقه</span></div><Progress value={(total / prefs.weeklyGoalMin) * 100} tone="flame" label="هدف هفتگی" /></div></Card>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="plan"><div className="mb-3 flex items-center justify-between"><h2 id="plan" className="text-xl font-bold">برنامهٔ مطالعه</h2><Button size="sm" variant="secondary" onClick={() => setOpen(true)}><Plus className="size-4" />افزودن</Button></div>
          <Card className="divide-y divide-line">{mine.length === 0 ? <p className="p-4 text-sm text-ink-500">برنامه‌ای ثبت نشده است.</p> : [...mine].sort((a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time)).map((p) => <div key={p.id} className="flex items-center gap-3 p-3 text-sm"><input type="checkbox" checked={p.done} onChange={() => toggle(p.id)} aria-label={`انجام شد: ${p.title}`} className="size-5 accent-brand-600" /><div className={cn("flex-1", p.done && "text-ink-500 line-through")}><b>{p.title}</b><p className="text-xs text-ink-500">{DAYS[p.weekday]} · ساعت <span className="tabular">{formatNumber(Number(p.time.slice(0, 2)))}:{p.time.slice(3)}</span></p></div><button onClick={() => del(p.id)} aria-label="حذف" className="grid size-9 place-items-center rounded-md text-ink-500 hover:bg-danger-100 hover:text-danger-600"><Trash2 className="size-4" /></button></div>)}</Card>
        </section>
        <section aria-labelledby="goals"><div className="mb-3 flex items-center justify-between"><h2 id="goals" className="flex items-center gap-2 text-xl font-bold"><Target className="size-5 text-brand-600" />هدف‌ها</h2><Button size="sm" variant="secondary" onClick={() => setGOpen(true)}><Plus className="size-4" />هدف جدید</Button></div>
          <Card className="divide-y divide-line">{myGoals.length === 0 ? <p className="p-4 text-sm text-ink-500">هدفی تعریف نشده است.</p> : myGoals.map((g) => <div key={g.id} className="space-y-2 p-3 text-sm"><div className="flex items-center justify-between gap-2"><b>{g.title}</b><button onClick={() => delGoal(g.id)} aria-label="حذف هدف" className="grid size-8 place-items-center rounded-md text-ink-500 hover:bg-danger-100"><Trash2 className="size-4" /></button></div><Progress value={(g.progress / g.target) * 100} label={g.title} tone={g.progress >= g.target ? "success" : "brand"} /><div className="flex items-center justify-between"><span className="tabular text-xs text-ink-600">{formatNumber(g.progress)} از {formatNumber(g.target)} {g.unit}</span><span className="flex gap-1"><Button size="sm" variant="outline" aria-label="کم کردن" onClick={() => bump(g.id, -1)}>−</Button><Button size="sm" variant="outline" aria-label="زیاد کردن" onClick={() => bump(g.id, 1)}>+</Button></span></div></div>)}</Card>
        </section>
      </div>
      <section aria-labelledby="ev"><h2 id="ev" className="mb-3 text-xl font-bold">ارزیابی‌های پیش‌رو</h2>
        <Card className="divide-y divide-line">{events.length === 0 ? <p className="p-4 text-sm text-ink-500">مهلتی در پیش نیست.</p> : events.map((e) => <Link key={e.id} href={e.href} className="flex items-center gap-3 p-3 text-sm hover:bg-card/60"><span className="flex-1 font-medium">{e.title}</span><Badge tone="flame">{formatDate(e.at)}</Badge></Link>)}</Card>
      </section>
      <Dialog open={open} onClose={() => setOpen(false)} title="افزودن به برنامهٔ مطالعه" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>انصراف</Button><Button onClick={() => { if (form.title.trim().length < 3) return setErr("عنوان را وارد کنید (حداقل ۳ نویسه)."); add({ title: form.title.trim(), weekday: Number(form.weekday), time: form.time, courseId: form.courseId || undefined }); setForm({ ...form, title: "" }); setErr(""); setOpen(false); toast.success("به برنامه اضافه شد."); }}>افزودن</Button></>}>
        <div className="space-y-4"><Field label="عنوان" error={err}>{(p) => <Input {...p} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />}</Field><div className="grid grid-cols-2 gap-3"><Field label="روز">{(p) => <Select {...p} value={form.weekday} onChange={(e) => setForm({ ...form, weekday: e.target.value })}>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</Select>}</Field><Field label="ساعت">{(p) => <Input {...p} type="time" dir="ltr" className="text-end" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />}</Field></div><Field label="دوره (اختیاری)">{(p) => <Select {...p} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}><option value="">بدون دوره</option>{enrolled.map((e) => <option key={e.course.id} value={e.course.id}>{e.course.title}</option>)}</Select>}</Field></div>
      </Dialog>
      <Dialog open={gOpen} onClose={() => setGOpen(false)} title="هدف جدید" footer={<><Button variant="ghost" onClick={() => setGOpen(false)}>انصراف</Button><Button onClick={() => { const t = Number(gForm.target); if (gForm.title.trim().length < 3 || !(t >= 1 && t <= 500)) return setErr("عنوان و عدد هدف (۱ تا ۵۰۰) را درست وارد کنید."); addGoal({ title: gForm.title.trim(), target: Math.floor(t), unit: gForm.unit }); setErr(""); setGForm({ title: "", target: "5", unit: "درس" }); setGOpen(false); toast.success("هدف افزوده شد."); }}>ثبت هدف</Button></>}>
        <div className="space-y-4"><Field label="عنوان هدف" error={err}>{(p) => <Input {...p} value={gForm.title} onChange={(e) => setGForm({ ...gForm, title: e.target.value })} />}</Field><div className="grid grid-cols-2 gap-3"><Field label="مقدار هدف">{(p) => <Input {...p} type="number" min={1} max={500} value={gForm.target} onChange={(e) => setGForm({ ...gForm, target: e.target.value })} />}</Field><Field label="واحد">{(p) => <Select {...p} value={gForm.unit} onChange={(e) => setGForm({ ...gForm, unit: e.target.value })}><option>درس</option><option>آزمون</option><option>ساعت</option></Select>}</Field></div></div>
      </Dialog>
    </div>
  );
}

/* ---------- Quizzes ---------- */
export function MyQuizzes() {
  const { user, enrolled } = useStudentData();
  const quizzes = useApp((s) => s.quizzes); const attempts = useApp((s) => s.attempts); const courses = useApp((s) => s.courses); const settings = useApp((s) => s.settings);
  const ids = new Set(enrolled.map((e) => e.course.id));
  const mine = attempts.filter((a) => a.userId === user?.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const avail = quizzes.filter((q) => q.published && ids.has(q.courseId));
  return (
    <div className="space-y-8">
      <PageTitle title="آزمون‌های من" />
      <section aria-labelledby="av"><h2 id="av" className="mb-3 text-xl font-bold">آزمون‌های در دسترس</h2>
        {avail.length === 0 ? <EmptyState title="آزمونی در دسترس نیست" action={<Button href="/courses">دوره‌ها</Button>}>پس از ثبت‌نام در دوره، آزمون‌های آن اینجا دیده می‌شود.</EmptyState> : (
          <div className="grid gap-3 md:grid-cols-2">{avail.map((q) => { const mineQ = attemptsFor(attempts, user?.id ?? "", q.id); const best = bestAttempt(mineQ); const passed = mineQ.some((a) => a.passed); const blocked = !q.practice && ((q.maxAttempts !== null && mineQ.length >= q.maxAttempts) || (passed && !settings.allowRetakeAfterPass));
            return <Card key={q.id} className="flex flex-col gap-2 p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="font-bold">{q.title}</h3><p className="text-xs text-ink-500">{courses.find((c) => c.id === q.courseId)?.title}</p></div>{q.practice ? <Badge tone="sun">تمرین</Badge> : passed ? <Badge tone="success">قبول</Badge> : mineQ.length ? <Badge tone="danger">مردود</Badge> : <Badge>جدید</Badge>}</div><p className="text-xs text-ink-600">{formatNumber(q.questionIds.length)} سؤال · {q.timeLimitMin ? `${formatNumber(q.timeLimitMin)} دقیقه` : "بدون زمان"} · {q.maxAttempts === null ? "تلاش نامحدود" : `${formatNumber(mineQ.length)} از ${formatNumber(q.maxAttempts)} تلاش`}{best && ` · بهترین: ${formatPercent(best.percent)}`}</p><div className="mt-auto pt-2"><Button size="sm" variant={blocked ? "outline" : "primary"} href={`/quiz/${q.id}`}>{blocked ? "مشاهدهٔ سابقه" : mineQ.length ? "تلاش مجدد" : "شروع"}</Button></div></Card>; })}</div>)}
      </section>
      <section aria-labelledby="hist"><h2 id="hist" className="mb-3 text-xl font-bold">سابقهٔ تلاش‌ها</h2>
        <DataTable caption="سابقهٔ آزمون‌ها" rows={mine} rowKey={(a) => a.id} searchText={(a) => quizzes.find((q) => q.id === a.quizId)?.title ?? ""} pageSize={6} empty={{ title: "هنوز آزمونی نداده‌اید" }}
          filters={[{ id: "r", label: "نتیجه", options: [{ value: "p", label: "قبول" }, { value: "f", label: "مردود" }], test: (a, v) => (v === "p") === a.passed }]}
          columns={[{ key: "q", header: "آزمون", cell: (a) => <span className="font-medium">{quizzes.find((q) => q.id === a.quizId)?.title}</span> }, { key: "d", header: "تاریخ", sort: (a) => a.submittedAt, cell: (a) => formatDateTime(a.submittedAt), hideOnMobile: true }, { key: "s", header: "نمره", sort: (a) => a.percent, cell: (a) => <span className="tabular">{formatPercent(a.percent)} ({formatNumber(a.score)}/{formatNumber(a.maxScore)})</span> }, { key: "r", header: "نتیجه", cell: (a) => <Badge tone={a.passed ? "success" : "danger"}>{a.passed ? "قبول" : "مردود"}</Badge> }, { key: "a", header: "", cell: (a) => <Link className="text-brand-700 underline underline-offset-4" href={`/quiz/${a.quizId}?attempt=${a.id}`}>مرور</Link> }]} />
      </section>
    </div>
  );
}

/* ---------- Certificates ---------- */
export function MyCertificates() {
  const { user, enrolled } = useStudentData();
  const certs = useApp((s) => s.certificates); const issue = useApp((s) => s.issueCertificate);
  const mine = certs.filter((c) => c.userId === user?.id);
  const eligible = enrolled.filter((e) => e.elig.eligible && !e.hasCert);
  const pending = enrolled.filter((e) => !e.elig.eligible && !e.hasCert && e.course.certificate);
  return (
    <div className="space-y-8">
      <PageTitle title="گواهی‌های من">گواهی با تکمیل همهٔ درس‌ها و قبولی در آزمون پایانی صادر می‌شود.</PageTitle>
      {eligible.length > 0 && <section aria-labelledby="el"><h2 id="el" className="mb-3 text-xl font-bold">آمادهٔ دریافت</h2><div className="grid gap-3 md:grid-cols-2">{eligible.map(({ course }) => <Card key={course.id} className="flex items-center gap-3 border-success-600/40 bg-success-100 p-4"><Award className="size-8 shrink-0 text-success-600" /><div className="flex-1"><b>{course.title}</b><p className="text-xs text-ink-600">شرایط تکمیل شده است.</p></div><Button size="sm" onClick={() => { const r = issue(user!.id, course.id); if (r.ok) toast.success("گواهی صادر شد."); else toast.error(r.reason ?? ""); }}>دریافت گواهی</Button></Card>)}</div></section>}
      <section aria-labelledby="is"><h2 id="is" className="mb-3 text-xl font-bold">گواهی‌های صادرشده</h2>
        {mine.length === 0 ? <EmptyState icon={<Award className="size-6" />} title="هنوز گواهی‌ای ندارید" action={<Button href="/dashboard/courses">دوره‌های من</Button>}>پس از تکمیل شرایط یک دوره، گواهی آن اینجا نمایش داده می‌شود.</EmptyState> : (
          <div className="grid gap-4 md:grid-cols-2">{mine.map((c) => <Card key={c.id} className={cn("p-5", c.revoked && "opacity-70")}><div className="flex items-start justify-between gap-2"><h3 className="font-bold">{c.courseTitle}</h3>{c.revoked ? <Badge tone="danger">ابطال‌شده</Badge> : <Badge tone="success">معتبر (محلی)</Badge>}</div><dl className="mt-3 grid grid-cols-2 gap-2 text-sm"><div><dt className="text-ink-500">شناسه</dt><dd className="font-medium tabular" dir="ltr">{c.id}</dd></div><div><dt className="text-ink-500">تاریخ صدور</dt><dd>{formatDate(c.issuedAt)}</dd></div><div><dt className="text-ink-500">نمرهٔ آزمون</dt><dd>{formatPercent(c.scorePercent)}</dd></div><div><dt className="text-ink-500">مدرس</dt><dd>{c.instructorName}</dd></div></dl><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" href={`/certificate/${c.id}`}><Printer className="size-4" />مشاهده و چاپ / PDF</Button><Button size="sm" variant="outline" href={`/verify/${c.id}`}>استعلام</Button></div></Card>)}</div>)}
      </section>
      {pending.length > 0 && <section aria-labelledby="pe"><h2 id="pe" className="mb-3 text-xl font-bold">در مسیر دریافت</h2><Card className="divide-y divide-line">{pending.map(({ course, prog, elig }) => <div key={course.id} className="space-y-2 p-4 text-sm"><div className="flex items-center justify-between"><b>{course.title}</b><span className="tabular text-xs">{formatNumber(prog.percent)}٪</span></div><Progress value={prog.percent} label={course.title} /><ul className="list-disc ps-5 text-xs text-ink-600">{elig.reasons.map((r) => <li key={r}>{r}</li>)}</ul></div>)}</Card></section>}
    </div>
  );
}

/* ---------- Orders ---------- */
export function MyOrders() {
  const user = useApp((s) => s.users.find((u) => u.id === s.sessionUserId));
  const orders = useApp((s) => s.orders);
  const mine = orders.filter((o) => o.userId === user?.id);
  return (
    <div><PageTitle title="سفارش‌ها">همهٔ سفارش‌ها شبیه‌سازی‌شده‌اند و مبلغی کسر نشده است.</PageTitle>
      <DataTable caption="سفارش‌ها" rows={mine} rowKey={(o) => o.id} searchText={(o) => `${o.number} ${o.lines.map((l) => l.title).join(" ")}`} pageSize={8} empty={{ title: "سفارشی ثبت نشده است" }}
        filters={[{ id: "s", label: "وضعیت", options: Object.entries(STATUS).map(([k, v]) => ({ value: k, label: v.label })), test: (o, v) => o.status === v }]}
        columns={[{ key: "n", header: "شمارهٔ سفارش", sort: (o) => o.number, cell: (o) => <span className="font-bold tabular" dir="ltr">{o.number}</span> }, { key: "d", header: "تاریخ", sort: (o) => o.createdAt, cell: (o) => formatDate(o.createdAt), hideOnMobile: true }, { key: "i", header: "دوره‌ها", cell: (o) => <span className="line-clamp-2 max-w-64">{o.lines.map((l) => l.title).join("، ")}</span>, hideOnMobile: true }, { key: "t", header: "مبلغ", sort: (o) => o.total, cell: (o) => <span className="tabular">{formatToman(o.total)}</span> }, { key: "s", header: "وضعیت", cell: (o) => <Badge tone={STATUS[o.status].tone}>{STATUS[o.status].label}</Badge> }, { key: "a", header: "", cell: (o) => <Link className="text-brand-700 underline underline-offset-4" href={`/order/${o.id}`}>جزئیات</Link> }]} />
    </div>
  );
}

/* ---------- Profile ---------- */
export function ProfilePage() {
  const user = useApp((s) => s.users.find((u) => u.id === s.sessionUserId));
  const update = useApp((s) => s.updateProfile); const prefs = useApp((s) => s.prefs); const setPrefs = useApp((s) => s.setPrefs);
  const notifications = useApp((s) => s.notifications); const mark = useApp((s) => s.markNotification); const markAll = useApp((s) => s.markAllNotifications);
  const savedMap = useApp((s) => s.saved); const courses = useApp((s) => s.courses); const reset = useApp((s) => s.resetAll);
  const { openHelp, state } = useInstall();
  const [f, setF] = useState({ name: user?.name ?? "", city: user?.city ?? "", phone: user?.phone ?? "", grade: (user?.grade ?? "") as Grade | "" });
  const [errs, setErrs] = useState<Record<string, string>>({}); const [rs, setRs] = useState(false);
  if (!user) return null;
  const mineNotes = notifications.filter((n) => n.userId === user.id).sort((a, b) => b.at.localeCompare(a.at));
  const savedCourses = (savedMap[user.id] ?? []).map((id) => courses.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c && c.status === "published");
  const save = () => { const e: Record<string, string> = {}; if (f.name.trim().length < 3) e.name = "نام را کامل وارد کنید."; if (f.phone && !/^09\d{9}$/.test(f.phone.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))))) e.phone = "شمارهٔ موبایل معتبر نیست (مثال: 09123456789)."; setErrs(e); if (Object.keys(e).length) return; update(user.id, { name: f.name.trim(), city: f.city.trim(), phone: f.phone, grade: f.grade || undefined }); toast.success("پروفایل ذخیره شد."); };
  return (
    <div className="space-y-6"><PageTitle title="پروفایل و تنظیمات" />
      <Tabs label="بخش‌های پروفایل" tabs={[
        { id: "info", label: "اطلاعات", content: <div className="max-w-xl space-y-4"><Field label="نام و نام خانوادگی" error={errs.name}>{(p) => <Input {...p} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field><div className="grid gap-4 sm:grid-cols-2"><Field label="شهر">{(p) => <Input {...p} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />}</Field><Field label="پایهٔ تحصیلی">{(p) => <Select {...p} value={f.grade} onChange={(e) => setF({ ...f, grade: e.target.value as Grade })}><option value="">—</option>{(["10", "11", "12", "konkur"] as Grade[]).map((g) => <option key={g} value={g}>{GRADE_LABEL[g]}</option>)}</Select>}</Field></div><Field label="موبایل" error={errs.phone}>{(p) => <Input {...p} dir="ltr" className="text-end" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />}</Field><Field label="ایمیل (نمایشی)">{(p) => <Input {...p} dir="ltr" className="text-end" value={user.email} readOnly />}</Field><Button onClick={save}>ذخیرهٔ تغییرات</Button></div> },
        { id: "prefs", label: "تنظیمات", content: <div className="max-w-xl space-y-1"><Switch checked={prefs.reminders} onChange={(v) => setPrefs({ reminders: v })} label="یادآوری برنامهٔ مطالعه" hint="نمایش یادآوری در داشبورد" /><Switch checked={prefs.emailDigest} onChange={(v) => setPrefs({ emailDigest: v })} label="خلاصهٔ هفتگی" hint="ذخیره می‌شود؛ ایمیلی ارسال نمی‌شود چون سرور متصل نیست" /><Field label="هدف هفتگی (دقیقه)" className="py-3">{(p) => <Input {...p} type="number" min={30} max={2000} step={30} className="max-w-40" value={prefs.weeklyGoalMin} onChange={(e) => setPrefs({ weeklyGoalMin: Math.min(2000, Math.max(30, Number(e.target.value) || 30)) })} />}</Field>
          <div className="mt-4 space-y-3 border-t border-line pt-5"><h3 className="font-bold">اپلیکیشن</h3>{state.phase === "installed" ? <p className="text-sm text-success-600">TeachTech نصب شده است.</p> : <Button variant="secondary" onClick={openHelp}><Smartphone className="size-4" />نصب اپلیکیشن</Button>}</div>
          <div className="mt-4 space-y-3 border-t border-line pt-5"><h3 className="font-bold">داده‌های محلی</h3><p className="text-sm text-ink-600">همهٔ اطلاعات فقط در این مرورگر است. با بازنشانی، همه چیز به حالت اولیه برمی‌گردد.</p><Button variant="danger" onClick={() => setRs(true)}><RotateCcw className="size-4" />بازنشانی به حالت اولیه</Button></div></div> },
        { id: "notes", label: <span className="flex items-center gap-1.5"><Bell className="size-4" />اعلان‌ها{mineNotes.some((n) => !n.read) && <span className="size-2 rounded-full bg-flame-500" aria-label="خوانده‌نشده" />}</span>, content: <div><div className="mb-3 flex justify-end"><Button size="sm" variant="outline" onClick={markAll}><Check className="size-4" />علامت‌گذاری همه به‌عنوان خوانده‌شده</Button></div><Card className="divide-y divide-line">{mineNotes.length === 0 ? <p className="p-4 text-sm text-ink-500">اعلانی ندارید.</p> : mineNotes.map((n) => <div key={n.id} className={cn("flex items-start gap-3 p-3 text-sm", !n.read && "bg-sun-100/50")}><span className={cn("mt-2 size-2 shrink-0 rounded-full", n.read ? "bg-line-strong" : "bg-flame-500")} aria-hidden /><div className="flex-1"><p className="font-bold">{n.href ? <Link href={n.href} onClick={() => mark(n.id, true)} className="hover:text-brand-700">{n.title}</Link> : n.title}</p><p className="text-ink-600">{n.body}</p><p className="text-xs text-ink-500">{formatDateTime(n.at)}</p></div><button className="text-xs text-brand-700 underline" onClick={() => mark(n.id, !n.read)}>{n.read ? "ناخوانده" : "خوانده"}</button></div>)}</Card></div> },
        { id: "saved", label: <span className="flex items-center gap-1.5"><Heart className="size-4" />ذخیره‌شده‌ها</span>, content: savedCourses.length === 0 ? <EmptyState icon={<Heart className="size-6" />} title="دورهٔ ذخیره‌شده‌ای ندارید" action={<Button href="/courses">دوره‌ها</Button>}>با زدن قلب روی هر دوره، آن را اینجا ذخیره کنید.</EmptyState> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{savedCourses.map((c) => <CourseCard key={c.id} course={c} />)}</div> },
      ]} />
      <ConfirmDialog open={rs} onClose={() => setRs(false)} onConfirm={() => { reset(); toast.success("داده‌ها بازنشانی شد."); }} title="بازنشانی همهٔ داده‌ها" danger confirmLabel="بازنشانی">سبد خرید، پیشرفت، یادداشت‌ها، آزمون‌ها و تغییرات این مرورگر پاک می‌شود و از حساب خارج می‌شوید.</ConfirmDialog>
    </div>
  );
}
