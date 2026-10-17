"use client";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { AVAILABILITY_LABEL, FORMAT_LABEL, GRADE_LABEL, LEVEL_LABEL } from "@/lib/catalog";
import { CATEGORIES } from "@/data/catalog";
import { toEnDigits } from "@/lib/format";
import { uid, useApp } from "@/store/app";
import type { Announcement, Course, Lesson, Question, Quiz, QuestionType } from "@/data/types";

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const num = (s: string) => Number(toEnDigits(s).replace(/[,٬\s]/g, ""));
type Errs = Record<string, string>;
const collect = (r: z.ZodError): Errs => Object.fromEntries(r.issues.map((i) => [String(i.path[0]), i.message]));

/* ---------------- Course ---------------- */
const courseSchema = z.object({
  title: z.string().trim().min(5, "عنوان دوره حداقل ۵ نویسه باشد.").max(100),
  subtitle: z.string().trim().min(5, "زیرعنوان را وارد کنید.").max(160),
  description: z.string().trim().min(30, "توضیحات حداقل ۳۰ نویسه باشد.").max(2000),
  price: z.number({ message: "قیمت را به‌صورت عدد (تومان) وارد کنید." }).int().min(0, "قیمت نمی‌تواند منفی باشد.").max(100_000_000),
  comparePrice: z.number().int().min(0).optional(),
  passPercent: z.number().int().min(1, "بین ۱ تا ۱۰۰").max(100, "بین ۱ تا ۱۰۰"),
}).refine((d) => d.comparePrice === undefined || d.comparePrice > d.price, { message: "قیمت قبل از تخفیف باید بیشتر از قیمت فعلی باشد.", path: ["comparePrice"] });

export function CourseFormDialog({ open, onClose, course }: { open: boolean; onClose: () => void; course?: Course }) {
  const upsert = useApp((s) => s.upsertCourse);
  const instructors = useApp((s) => s.instructors);
  const blank = { title: "", subtitle: "", description: "", grade: "11", categoryId: "cat-11", level: "intermediate", format: "recorded", availability: "open", price: "", comparePrice: "", instructorId: instructors[0]?.id ?? "", status: "draft", certificate: true, passPercent: "60", outcomes: "", prerequisites: "" };
  const init = course ? { ...blank, ...course, price: String(course.price), comparePrice: course.comparePrice ? String(course.comparePrice) : "", passPercent: String(course.passPercent), outcomes: course.outcomes.join("\n"), prerequisites: course.prerequisites.join("\n") } : blank;
  const [f, setF] = useState(init as typeof blank);
  const [errs, setErrs] = useState<Errs>({});
  const set = (k: string, v: string | boolean) => setF({ ...f, [k]: v });
  const save = () => {
    const r = courseSchema.safeParse({ title: f.title, subtitle: f.subtitle, description: f.description, price: num(String(f.price)), comparePrice: f.comparePrice ? num(String(f.comparePrice)) : undefined, passPercent: num(String(f.passPercent)) });
    if (!r.success) { setErrs(collect(r.error)); return; }
    const outcomes = lines(f.outcomes); if (outcomes.length === 0) return setErrs({ outcomes: "حداقل یک هدف یادگیری وارد کنید." });
    setErrs({});
    const id = course?.id ?? uid("c");
    const next: Course = {
      sections: [], faq: [], art: "numbers", tags: [], sampleRating: 0, sampleEnrolled: 0, createdAt: new Date().toISOString(), ...course,
      id, slug: course?.slug ?? `local-${id}`, title: r.data.title, subtitle: r.data.subtitle, description: r.data.description,
      grade: f.grade as Course["grade"], categoryId: f.categoryId, level: f.level as Course["level"], format: f.format as Course["format"], availability: f.availability as Course["availability"],
      price: r.data.price, comparePrice: r.data.comparePrice, instructorId: f.instructorId, status: f.status as Course["status"], certificate: !!f.certificate, passPercent: r.data.passPercent,
      outcomes, prerequisites: lines(f.prerequisites),
    };
    upsert(next); toast.success(course ? "دوره به‌روز شد." : "دوره ساخته شد (پیش‌نویس)."); onClose();
  };
  return (
    <Dialog open={open} onClose={onClose} size="lg" title={course ? "ویرایش دوره" : "دورهٔ جدید"} footer={<><Button variant="ghost" onClick={onClose}>انصراف</Button><Button onClick={save}>{course ? "ذخیرهٔ تغییرات" : "ساخت دوره"}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="عنوان دوره" error={errs.title} className="sm:col-span-2">{(p) => <Input {...p} value={f.title} onChange={(e) => set("title", e.target.value)} />}</Field>
        <Field label="زیرعنوان" error={errs.subtitle} className="sm:col-span-2">{(p) => <Input {...p} value={f.subtitle} onChange={(e) => set("subtitle", e.target.value)} />}</Field>
        <Field label="توضیحات" error={errs.description} className="sm:col-span-2">{(p) => <Textarea {...p} rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} />}</Field>
        <Field label="پایه">{(p) => <Select {...p} value={f.grade} onChange={(e) => set("grade", e.target.value)}>{Object.entries(GRADE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>}</Field>
        <Field label="دسته">{(p) => <Select {...p} value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select>}</Field>
        <Field label="سطح">{(p) => <Select {...p} value={f.level} onChange={(e) => set("level", e.target.value)}>{Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>}</Field>
        <Field label="شکل برگزاری">{(p) => <Select {...p} value={f.format} onChange={(e) => set("format", e.target.value)}>{Object.entries(FORMAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>}</Field>
        <Field label="وضعیت ثبت‌نام">{(p) => <Select {...p} value={f.availability} onChange={(e) => set("availability", e.target.value)}>{Object.entries(AVAILABILITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>}</Field>
        <Field label="مدرس">{(p) => <Select {...p} value={f.instructorId} onChange={(e) => set("instructorId", e.target.value)}>{instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select>}</Field>
        <Field label="قیمت (تومان)" error={errs.price}>{(p) => <Input {...p} inputMode="numeric" dir="ltr" className="text-end" value={f.price} onChange={(e) => set("price", e.target.value)} />}</Field>
        <Field label="قیمت قبل از تخفیف (اختیاری)" error={errs.comparePrice}>{(p) => <Input {...p} inputMode="numeric" dir="ltr" className="text-end" value={f.comparePrice} onChange={(e) => set("comparePrice", e.target.value)} />}</Field>
        <Field label="حداقل نمرهٔ گواهی (٪)" error={errs.passPercent}>{(p) => <Input {...p} inputMode="numeric" dir="ltr" className="text-end" value={f.passPercent} onChange={(e) => set("passPercent", e.target.value)} />}</Field>
        <Field label="وضعیت انتشار">{(p) => <Select {...p} value={f.status} onChange={(e) => set("status", e.target.value)}><option value="draft">پیش‌نویس</option><option value="published">منتشرشده</option></Select>}</Field>
        <Field label="اهداف یادگیری (هر خط یک مورد)" error={errs.outcomes} className="sm:col-span-2">{(p) => <Textarea {...p} rows={3} value={f.outcomes} onChange={(e) => set("outcomes", e.target.value)} />}</Field>
        <Field label="پیش‌نیازها (هر خط یک مورد)" className="sm:col-span-2">{(p) => <Textarea {...p} rows={2} value={f.prerequisites} onChange={(e) => set("prerequisites", e.target.value)} />}</Field>
        <Checkbox label="این دوره گواهی پایان دوره دارد" checked={!!f.certificate} onChange={(e) => set("certificate", e.target.checked)} className="sm:col-span-2" />
      </div>
    </Dialog>
  );
}

/* ---------------- Lesson / Section ---------------- */
export function SectionDialog({ open, onClose, courseId, section }: { open: boolean; onClose: () => void; courseId: string; section?: { id: string; title: string } }) {
  const upsert = useApp((s) => s.upsertSection);
  const [t, setT] = useState(section?.title ?? ""); const [e, setE] = useState("");
  return (
    <Dialog open={open} onClose={onClose} size="sm" title={section ? "ویرایش بخش" : "بخش جدید"} footer={<><Button variant="ghost" onClick={onClose}>انصراف</Button><Button onClick={() => { if (t.trim().length < 3) return setE("عنوان بخش حداقل ۳ نویسه باشد."); const cur = useApp.getState().courses.find((c) => c.id === courseId)?.sections.find((s) => s.id === section?.id); upsert(courseId, { id: section?.id ?? uid("s"), title: t.trim(), lessons: cur?.lessons ?? [] }); toast.success("بخش ذخیره شد."); onClose(); }}>ذخیره</Button></>}>
      <Field label="عنوان بخش" error={e}>{(p) => <Input {...p} value={t} onChange={(x) => setT(x.target.value)} />}</Field>
    </Dialog>
  );
}

export function LessonDialog({ open, onClose, courseId, sectionId, lesson }: { open: boolean; onClose: () => void; courseId: string; sectionId: string; lesson?: Lesson }) {
  const upsert = useApp((s) => s.upsertLesson);
  const [f, setF] = useState({ title: lesson?.title ?? "", min: String(lesson?.durationMin ?? 15), summary: lesson?.summary ?? "", points: lesson?.keyPoints.join("\n") ?? "", formulas: lesson?.formulas.join("\n") ?? "", preview: lesson?.isPreview ?? false });
  const [errs, setErrs] = useState<Errs>({});
  const save = () => {
    const r = z.object({ title: z.string().trim().min(3, "عنوان درس حداقل ۳ نویسه باشد."), min: z.number().int().min(1, "مدت باید حداقل ۱ دقیقه باشد.").max(300, "حداکثر ۳۰۰ دقیقه"), summary: z.string().trim().min(5, "خلاصه را وارد کنید.") }).safeParse({ title: f.title, min: num(f.min), summary: f.summary });
    if (!r.success) return setErrs(collect(r.error));
    upsert(courseId, sectionId, { ...lesson, id: lesson?.id ?? uid("l"), title: r.data.title, durationMin: r.data.min, summary: r.data.summary, keyPoints: lines(f.points), formulas: lines(f.formulas), isPreview: f.preview, resourceIds: lesson?.resourceIds ?? [] });
    toast.success("درس ذخیره شد."); onClose();
  };
  return (
    <Dialog open={open} onClose={onClose} title={lesson ? "ویرایش درس" : "درس جدید"} footer={<><Button variant="ghost" onClick={onClose}>انصراف</Button><Button onClick={save}>ذخیره</Button></>}>
      <div className="space-y-4">
        <Field label="عنوان درس" error={errs.title}>{(p) => <Input {...p} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
        <Field label="مدت (دقیقه)" error={errs.min}>{(p) => <Input {...p} inputMode="numeric" dir="ltr" className="max-w-32 text-end" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} />}</Field>
        <Field label="خلاصهٔ درس" error={errs.summary}>{(p) => <Textarea {...p} rows={2} value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} />}</Field>
        <Field label="نکته‌های کلیدی (هر خط یک مورد)">{(p) => <Textarea {...p} rows={3} value={f.points} onChange={(e) => setF({ ...f, points: e.target.value })} />}</Field>
        <Field label="فرمول‌ها (LaTeX، هر خط یک فرمول)">{(p) => <Textarea {...p} rows={2} dir="ltr" className="text-start font-mono text-sm" value={f.formulas} onChange={(e) => setF({ ...f, formulas: e.target.value })} />}</Field>
        <Checkbox label="پیش‌نمایش رایگان (بدون ثبت‌نام قابل مشاهده است)" checked={f.preview} onChange={(e) => setF({ ...f, preview: e.target.checked })} />
      </div>
    </Dialog>
  );
}

/* ---------------- Question ---------------- */
export function QuestionDialog({ open, onClose, courseId, question }: { open: boolean; onClose: () => void; courseId?: string; question?: Question }) {
  const upsert = useApp((s) => s.upsertQuestion);
  const courses = useApp((s) => s.courses);
  const [f, setF] = useState({
    courseId: question?.courseId ?? courseId ?? courses[0]?.id ?? "", type: (question?.type ?? "mcq") as QuestionType, prompt: question?.prompt ?? "", options: question?.options ?? ["", "", "", ""],
    correct: question?.type === "mcq" ? String(question.correct) : "0", tf: question?.type === "tf" ? String(question.correct) : "true", accepted: question?.type === "short" ? (question.correct as string[]).join("\n") : "",
    explanation: question?.explanation ?? "", points: String(question?.points ?? 2), topic: question?.topic ?? "", difficulty: question?.difficulty ?? "intermediate",
  });
  const [errs, setErrs] = useState<Errs>({});
  const save = () => {
    const e: Errs = {};
    if (f.prompt.trim().length < 5) e.prompt = "متن سؤال را وارد کنید.";
    if (f.explanation.trim().length < 5) e.explanation = "توضیح پاسخ را وارد کنید.";
    const pts = num(f.points); if (!(pts >= 1 && pts <= 20)) e.points = "نمره بین ۱ تا ۲۰ باشد.";
    if (f.type === "mcq" && f.options.filter((o) => o.trim()).length < 2) e.options = "حداقل دو گزینه لازم است.";
    if (f.type === "mcq" && !f.options[Number(f.correct)]?.trim()) e.options = "گزینهٔ درست نباید خالی باشد.";
    if (f.type === "short" && lines(f.accepted).length === 0) e.accepted = "حداقل یک پاسخ پذیرفته‌شده وارد کنید.";
    if (Object.keys(e).length) return setErrs(e);
    const base = { id: question?.id ?? uid("qq"), courseId: f.courseId, prompt: f.prompt.trim(), explanation: f.explanation.trim(), points: Math.floor(pts), topic: f.topic.trim() || "عمومی", difficulty: f.difficulty };
    const q: Question = f.type === "mcq" ? { ...base, type: "mcq", options: f.options.map((o) => o.trim()), correct: Number(f.correct) } : f.type === "tf" ? { ...base, type: "tf", correct: f.tf === "true" } : { ...base, type: "short", correct: lines(f.accepted) };
    upsert(q); toast.success("سؤال ذخیره شد."); onClose();
  };
  return (
    <Dialog open={open} onClose={onClose} size="lg" title={question ? "ویرایش سؤال" : "سؤال جدید"} description="فرمول‌ها را بین علامت $ بنویسید؛ مثلاً $x^2+1$" footer={<><Button variant="ghost" onClick={onClose}>انصراف</Button><Button onClick={save}>ذخیره</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="دوره">{(p) => <Select {...p} value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value })}>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select>}</Field>
        <Field label="نوع سؤال">{(p) => <Select {...p} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as QuestionType })}><option value="mcq">چندگزینه‌ای</option><option value="tf">درست/نادرست</option><option value="short">پاسخ کوتاه</option></Select>}</Field>
        <Field label="متن سؤال" error={errs.prompt} className="sm:col-span-2">{(p) => <Textarea {...p} rows={3} value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} />}</Field>
        {f.type === "mcq" && <div className="space-y-2 sm:col-span-2"><p className="text-sm font-medium">گزینه‌ها (گزینهٔ درست را انتخاب کنید)</p>{f.options.map((o, i) => <div key={i} className="flex items-center gap-2"><input type="radio" name="correct" aria-label={`گزینهٔ ${i + 1} درست است`} checked={f.correct === String(i)} onChange={() => setF({ ...f, correct: String(i) })} className="size-5 accent-brand-600" /><Input aria-label={`گزینهٔ ${i + 1}`} value={o} onChange={(e) => setF({ ...f, options: f.options.map((x, j) => (j === i ? e.target.value : x)) })} /></div>)}{errs.options && <p role="alert" className="text-sm text-danger-600">{errs.options}</p>}</div>}
        {f.type === "tf" && <Field label="پاسخ درست">{(p) => <Select {...p} value={f.tf} onChange={(e) => setF({ ...f, tf: e.target.value })}><option value="true">درست</option><option value="false">نادرست</option></Select>}</Field>}
        {f.type === "short" && <Field label="پاسخ‌های پذیرفته‌شده (هر خط یکی)" error={errs.accepted} hint="ارقام فارسی و کسر/اعشار معادل هم پذیرفته می‌شود." className="sm:col-span-2">{(p) => <Textarea {...p} rows={2} dir="ltr" className="text-start" value={f.accepted} onChange={(e) => setF({ ...f, accepted: e.target.value })} />}</Field>}
        <Field label="توضیح پاسخ" error={errs.explanation} className="sm:col-span-2">{(p) => <Textarea {...p} rows={2} value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} />}</Field>
        <Field label="نمره" error={errs.points}>{(p) => <Input {...p} inputMode="numeric" dir="ltr" className="text-end" value={f.points} onChange={(e) => setF({ ...f, points: e.target.value })} />}</Field>
        <Field label="مبحث">{(p) => <Input {...p} value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} />}</Field>
        <Field label="دشواری">{(p) => <Select {...p} value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value as Question["difficulty"] })}>{Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>}</Field>
      </div>
    </Dialog>
  );
}

/* ---------------- Quiz ---------------- */
export function QuizDialog({ open, onClose, quiz }: { open: boolean; onClose: () => void; quiz?: Quiz }) {
  const upsert = useApp((s) => s.upsertQuiz); const courses = useApp((s) => s.courses); const bank = useApp((s) => s.questions);
  const [f, setF] = useState({ title: quiz?.title ?? "", courseId: quiz?.courseId ?? courses[0]?.id ?? "", description: quiz?.description ?? "", time: quiz?.timeLimitMin ? String(quiz.timeLimitMin) : "", pass: String(quiz?.passPercent ?? 60), max: quiz?.maxAttempts ? String(quiz.maxAttempts) : "", practice: quiz?.practice ?? false, published: quiz?.published ?? false, ids: quiz?.questionIds ?? [] as string[] });
  const [errs, setErrs] = useState<Errs>({});
  const pool = bank.filter((q) => q.courseId === f.courseId);
  const save = () => {
    const e: Errs = {};
    if (f.title.trim().length < 3) e.title = "عنوان آزمون را وارد کنید.";
    const pass = num(f.pass); if (!(pass >= 1 && pass <= 100)) e.pass = "بین ۱ تا ۱۰۰";
    if (f.time && !(num(f.time) >= 1 && num(f.time) <= 300)) e.time = "زمان بین ۱ تا ۳۰۰ دقیقه (یا خالی برای بدون محدودیت)";
    if (f.max && !(num(f.max) >= 1)) e.max = "حداقل ۱ (یا خالی برای نامحدود)";
    if (f.ids.length === 0) e.ids = "حداقل یک سؤال انتخاب کنید.";
    if (Object.keys(e).length) return setErrs(e);
    upsert({ ...quiz, id: quiz?.id ?? uid("q"), courseId: f.courseId, title: f.title.trim(), description: f.description.trim() || "آزمون دوره", timeLimitMin: f.time ? num(f.time) : null, passPercent: pass, maxAttempts: f.max ? num(f.max) : null, practice: f.practice, published: f.published, questionIds: f.ids });
    toast.success("آزمون ذخیره شد."); onClose();
  };
  return (
    <Dialog open={open} onClose={onClose} size="lg" title={quiz ? "ویرایش آزمون" : "آزمون جدید"} footer={<><Button variant="ghost" onClick={onClose}>انصراف</Button><Button onClick={save}>ذخیره</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="عنوان" error={errs.title} className="sm:col-span-2">{(p) => <Input {...p} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
        <Field label="دوره">{(p) => <Select {...p} value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value, ids: [] })}>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select>}</Field>
        <Field label="توضیح">{(p) => <Input {...p} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}</Field>
        <Field label="زمان (دقیقه، خالی = نامحدود)" error={errs.time}>{(p) => <Input {...p} inputMode="numeric" dir="ltr" className="text-end" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />}</Field>
        <Field label="نمرهٔ قبولی (٪)" error={errs.pass}>{(p) => <Input {...p} inputMode="numeric" dir="ltr" className="text-end" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} />}</Field>
        <Field label="حداکثر تلاش (خالی = نامحدود)" error={errs.max}>{(p) => <Input {...p} inputMode="numeric" dir="ltr" className="text-end" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} />}</Field>
        <div className="flex flex-col justify-end gap-1"><Checkbox label="حالت تمرین (نمایش پاسخ حین آزمون)" checked={f.practice} onChange={(e) => setF({ ...f, practice: e.target.checked })} /><Checkbox label="منتشرشده" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} /></div>
        <fieldset className="sm:col-span-2"><legend className="mb-2 text-sm font-medium">سؤال‌های آزمون</legend>
          {pool.length === 0 ? <p className="text-sm text-ink-500">برای این دوره سؤالی در بانک نیست.</p> : <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-line p-2">{pool.map((q) => <li key={q.id}><Checkbox label={<span className="line-clamp-1">{q.prompt.replace(/\$/g, "")}</span>} checked={f.ids.includes(q.id)} onChange={(e) => setF({ ...f, ids: e.target.checked ? [...f.ids, q.id] : f.ids.filter((x) => x !== q.id) })} /></li>)}</ul>}
          {errs.ids && <p role="alert" className="mt-1 text-sm text-danger-600">{errs.ids}</p>}</fieldset>
      </div>
    </Dialog>
  );
}

/* ---------------- Announcement ---------------- */
export function AnnouncementDialog({ open, onClose, item, authorId, courseIds }: { open: boolean; onClose: () => void; item?: Announcement; authorId: string; courseIds?: string[] }) {
  const upsert = useApp((s) => s.upsertAnnouncement); const courses = useApp((s) => s.courses);
  const [f, setF] = useState({ title: item?.title ?? "", body: item?.body ?? "", courseId: item?.courseId ?? "", pinned: item?.pinned ?? false });
  const [errs, setErrs] = useState<Errs>({});
  return (
    <Dialog open={open} onClose={onClose} title={item ? "ویرایش اطلاعیه" : "اطلاعیهٔ جدید"} footer={<><Button variant="ghost" onClick={onClose}>انصراف</Button><Button onClick={() => { const e: Errs = {}; if (f.title.trim().length < 3) e.title = "عنوان را وارد کنید."; if (f.body.trim().length < 10) e.body = "متن اطلاعیه حداقل ۱۰ نویسه باشد."; if (Object.keys(e).length) return setErrs(e); upsert({ id: item?.id ?? uid("an"), title: f.title.trim(), body: f.body.trim(), courseId: f.courseId || null, pinned: f.pinned, authorId: item?.authorId ?? authorId, at: item?.at ?? new Date().toISOString() }); toast.success("اطلاعیه ذخیره شد."); onClose(); }}>انتشار</Button></>}>
      <div className="space-y-4">
        <Field label="عنوان" error={errs.title}>{(p) => <Input {...p} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
        <Field label="متن" error={errs.body}>{(p) => <Textarea {...p} rows={4} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />}</Field>
        <Field label="مخاطب">{(p) => <Select {...p} value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value })}>{!courseIds && <option value="">همهٔ دانش‌آموزان</option>}{courses.filter((c) => !courseIds || courseIds.includes(c.id)).map((c) => <option key={c.id} value={c.id}>دانش‌آموزان «{c.title}»</option>)}</Select>}</Field>
        <Checkbox label="سنجاق‌شده" checked={f.pinned} onChange={(e) => setF({ ...f, pinned: e.target.checked })} />
      </div>
    </Dialog>
  );
}
