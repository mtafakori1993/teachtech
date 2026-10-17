"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Flag, Lightbulb, RotateCcw, XCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Badge, Card, EmptyState, Progress, Skeleton } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/form";
import { MathText } from "@/components/ui/tex";
import { toast } from "@/components/ui/toast";
import { attemptsFor, bestAttempt, canStartQuiz, gradeQuiz, isCorrect, remainingSeconds, type AnswerValue } from "@/lib/quiz";
import { quizQuestions } from "@/data/quizzes";
import { certificateEligibility } from "@/lib/certificates";
import { formatClock, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useApp, useHydrated, useSessionUser } from "@/store/app";
import type { Question, Quiz, QuizAttempt } from "@/data/types";

export function QuizView({ id }: { id: string }) {
  const hydrated = useHydrated();
  const user = useSessionUser();
  const quiz = useApp((s) => s.quizzes.find((q) => q.id === id));
  const course = useApp((s) => s.courses.find((c) => c.id === quiz?.courseId));
  const enrolled = useApp((s) => !!user && s.enrollments.some((e) => e.userId === user.id && e.courseId === quiz?.courseId));
  const bank = useApp((s) => s.questions);
  const allAttempts = useApp((s) => s.attempts);
  const settings = useApp((s) => s.settings);
  const draft = useApp((s) => (user ? s.drafts[`${user.id}:${id}`] : undefined));
  const start = useApp((s) => s.startQuiz);
  const sp = useSearchParams();
  const questions = useMemo(() => (quiz ? quizQuestions(quiz, bank) : []), [quiz, bank]);
  const mine = useMemo(() => attemptsFor(allAttempts, user?.id ?? "", id), [allAttempts, user?.id, id]);

  if (!hydrated) return <div className="container-x py-10"><Skeleton className="h-80" /></div>;
  if (!quiz || !course) return <div className="container-x py-16"><EmptyState title="آزمون پیدا نشد" action={<Button href="/dashboard/quizzes">آزمون‌های من</Button>} /></div>;
  if (!user) return <div className="container-x py-16"><EmptyState title="برای شرکت در آزمون وارد شوید" action={<Button href={`/login?next=/quiz/${id}`}>ورود</Button>} /></div>;
  if (!enrolled) return <div className="container-x py-16"><EmptyState title="شما در این دوره ثبت‌نام نکرده‌اید" action={<Button href={`/courses/${course.slug}`}>مشاهدهٔ دوره</Button>}>برای شرکت در آزمون ابتدا در دوره ثبت‌نام کنید.</EmptyState></div>;

  const reviewId = sp.get("attempt");
  const reviewing = reviewId ? mine.find((a) => a.id === reviewId) : undefined;
  if (reviewing) return <Results quiz={quiz} questions={questions} attempt={reviewing} courseSlug={course.slug} />;
  if (draft) return <Runner quiz={quiz} questions={questions} />;

  const chk = canStartQuiz(quiz, mine, { allowRetakeAfterPass: settings.allowRetakeAfterPass });
  const best = bestAttempt(mine);
  return (
    <div className="container-x max-w-3xl py-8">
      <Link href={`/courses/${course.slug}`} className="text-sm text-brand-700 hover:underline">{course.title}</Link>
      <h1 className="mt-1 text-3xl font-bold">{quiz.title}</h1>
      <p className="mt-2 text-ink-600">{quiz.description}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-4">
        {[["تعداد سؤال", formatNumber(questions.length)], ["زمان", quiz.timeLimitMin ? `${formatNumber(quiz.timeLimitMin)} دقیقه` : "بدون محدودیت"], ["نمرهٔ قبولی", formatPercent(quiz.passPercent)], ["دفعات مجاز", quiz.maxAttempts === null ? "نامحدود" : formatNumber(quiz.maxAttempts)]].map(([k, v]) => <li key={k} className="rounded-lg border border-line bg-white p-3 text-center shadow-soft"><p className="text-xs text-ink-500">{k}</p><p className="font-bold">{v}</p></li>)}
      </ul>
      <Card className="mt-6 space-y-2 p-5 text-sm leading-7">
        <h2 className="font-bold">قوانین</h2>
        <ul className="list-disc space-y-1 ps-6 text-ink-700 marker:text-brand-500">
          <li>پاسخ‌ها خودکار ذخیره می‌شوند؛ در صورت بستن صفحه می‌توانید ادامه دهید.</li>
          {quiz.timeLimitMin && <li>با پایان زمان، آزمون خودکار ثبت می‌شود.</li>}
          <li>{quiz.practice ? "این آزمون در حالت تمرین است: بعد از پاسخ‌دادن می‌توانید پاسخ صحیح را ببینید." : "پاسخ صحیح و توضیح‌ها پس از ثبت نهایی نمایش داده می‌شوند."}</li>
          {!quiz.practice && <li>با قبولی در آزمون، نتیجه برای گواهی پایان دوره لحاظ می‌شود.</li>}
        </ul>
      </Card>
      {!chk.ok && <Alert tone="warning" className="mt-4">{chk.reason}</Alert>}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button size="lg" variant="cta" disabled={!chk.ok || questions.length === 0} onClick={() => { const r = start(id); if (!r.ok) toast.error(r.reason ?? "شروع ممکن نشد."); }}>{mine.length ? "شروع تلاش جدید" : "شروع آزمون"}</Button>
        <Button size="lg" variant="outline" href={`/learn/${course.slug}`}>بازگشت به درس‌ها</Button>
      </div>
      <section className="mt-10" aria-labelledby="hist"><h2 id="hist" className="mb-3 text-xl font-bold">سابقهٔ تلاش‌ها</h2>
        {mine.length === 0 ? <p className="text-sm text-ink-500">هنوز در این آزمون شرکت نکرده‌اید.</p> : (
          <ul className="space-y-2">{[...mine].reverse().map((a, i) => <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white p-3 text-sm"><span className="font-medium">تلاش {formatNumber(mine.length - i)}</span><span className="text-ink-500">{formatDateTime(a.submittedAt)}</span><Badge tone={a.passed ? "success" : "danger"}>{a.passed ? "قبول" : "مردود"}</Badge><span className="tabular me-auto">{formatPercent(a.percent)} ({formatNumber(a.score)} از {formatNumber(a.maxScore)})</span><Link className="font-medium text-brand-700 underline underline-offset-4" href={`/quiz/${id}?attempt=${a.id}`}>مرور</Link></li>)}</ul>
        )}
        {best && <p className="mt-3 text-sm text-ink-600">بهترین نمره: <b>{formatPercent(best.percent)}</b></p>}
      </section>
    </div>
  );
}

function Runner({ quiz, questions }: { quiz: Quiz; questions: Question[] }) {
  const router = useRouter();
  const user = useSessionUser()!;
  const draft = useApp((s) => s.drafts[`${user.id}:${quiz.id}`])!;
  const save = useApp((s) => s.saveDraft);
  const submit = useApp((s) => s.submitQuiz);
  const discard = useApp((s) => s.discardDraft);
  const [confirm, setConfirm] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState<number | null>(() => remainingSeconds(quiz, draft.startedAt));
  const finished = useRef(false);

  const finish = (timedOut: boolean) => {
    if (finished.current) return;
    finished.current = true;
    const a = submit(quiz.id, timedOut);
    if (a) { toast[a.passed ? "success" : "info"](timedOut ? "زمان به پایان رسید و آزمون ثبت شد." : "آزمون ثبت شد."); router.replace(`/quiz/${quiz.id}?attempt=${a.id}`); }
  };
  useEffect(() => {
    if (quiz.timeLimitMin === null) return;
    const tick = () => { const r = remainingSeconds(quiz, draft.startedAt); setLeft(r); if (r === 0) finish(true); };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [quiz.id, draft.startedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = questions[Math.min(draft.current, questions.length - 1)];
  const idx = questions.indexOf(q);
  const answered = (qq: Question) => { const a = draft.answers[qq.id]; return !(a === undefined || a === null || a === ""); };
  const unanswered = questions.filter((x) => !answered(x)).length;
  const setAns = (v: AnswerValue) => save(quiz.id, { answers: { ...draft.answers, [q.id]: v } });
  const marked = draft.marked.includes(q.id);
  const showKey = quiz.practice && reveal[q.id] && answered(q);
  const urgent = left !== null && left <= 60;

  return (
    <div className="container-x max-w-5xl py-6">
      <div className="sticky top-16 z-30 -mx-4 mb-5 flex items-center gap-3 border-b border-line bg-cream/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0 flex-1"><p className="truncate font-bold">{quiz.title}</p><Progress value={((questions.length - unanswered) / questions.length) * 100} label="سؤال‌های پاسخ‌داده‌شده" /></div>
        {left !== null && <div role="timer" aria-label="زمان باقی‌مانده" className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 font-bold tabular", urgent ? "bg-danger-100 text-danger-600" : "bg-card text-brand-800")}><Clock className="size-4" aria-hidden />{formatClock(left)}</div>}
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_15rem]">
        <section aria-labelledby="qtitle">
          <Card className="p-5 sm:p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 id="qtitle" className="font-bold">سؤال {formatNumber(idx + 1)} از {formatNumber(questions.length)}</h2><div className="flex gap-2"><Badge tone="neutral">{formatNumber(q.points)} نمره</Badge>{marked && <Badge tone="flame"><Flag className="size-3" />علامت‌گذاری‌شده</Badge>}</div></div>
            <p className="text-lg leading-10"><MathText text={q.prompt} /></p>
            <div className="mt-5">
              {q.type === "mcq" && (
                <fieldset><legend className="sr-only">گزینه‌ها</legend><div className="space-y-2.5">{q.options!.map((o, i) => {
                  const sel = draft.answers[q.id] === i; const key = showKey ? (i === q.correct ? "ok" : sel ? "bad" : "") : "";
                  return <label key={i} className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand-500", sel ? "border-brand-500 bg-card" : "border-line hover:border-brand-300", key === "ok" && "border-success-600 bg-success-100", key === "bad" && "border-danger-600 bg-danger-100")}>
                    <input type="radio" name={q.id} checked={sel} onChange={() => setAns(i)} className="size-5 accent-brand-600" /><span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-bold ring-1 ring-line-strong">{"الف ب ج د".split(" ")[i]}</span><span className="flex-1"><MathText text={o} /></span>
                  </label>;
                })}</div></fieldset>
              )}
              {q.type === "tf" && (
                <fieldset><legend className="sr-only">درست یا نادرست</legend><div className="grid grid-cols-2 gap-3">{[true, false].map((v) => {
                  const sel = draft.answers[q.id] === v; const key = showKey ? (v === q.correct ? "ok" : sel ? "bad" : "") : "";
                  return <label key={String(v)} className={cn("flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand-500", sel ? "border-brand-500 bg-card" : "border-line hover:border-brand-300", key === "ok" && "border-success-600 bg-success-100", key === "bad" && "border-danger-600 bg-danger-100")}><input type="radio" name={q.id} checked={sel} onChange={() => setAns(v)} className="size-5 accent-brand-600" />{v ? "درست" : "نادرست"}</label>;
                })}</div></fieldset>
              )}
              {q.type === "short" && (<div><label htmlFor="short" className="mb-1.5 block text-sm text-ink-600">پاسخ کوتاه (عدد یا کسر؛ ارقام فارسی هم پذیرفته می‌شود)</label><Input id="short" dir="ltr" inputMode="decimal" className="max-w-xs text-end" value={String(draft.answers[q.id] ?? "")} onChange={(e) => setAns(e.target.value)} /></div>)}
            </div>
            {showKey && <Alert tone={isCorrect(q, draft.answers[q.id]) ? "success" : "warning"} className="mt-4" title={isCorrect(q, draft.answers[q.id]) ? "درست است" : "پاسخ درست نبود"}><MathText text={q.explanation} /></Alert>}
          </Card>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="outline" disabled={idx === 0} onClick={() => save(quiz.id, { current: idx - 1 })}><ChevronRight className="size-4" />قبلی</Button>
            <Button variant="outline" disabled={idx === questions.length - 1} onClick={() => save(quiz.id, { current: idx + 1 })}>بعدی<ChevronLeft className="size-4" /></Button>
            <Button variant={marked ? "secondary" : "ghost"} aria-pressed={marked} onClick={() => save(quiz.id, { marked: marked ? draft.marked.filter((x) => x !== q.id) : [...draft.marked, q.id] })}><Flag className="size-4" />{marked ? "حذف علامت" : "علامت‌گذاری برای مرور"}</Button>
            {quiz.practice && <Button variant="ghost" disabled={!answered(q)} onClick={() => setReveal({ ...reveal, [q.id]: true })}><Lightbulb className="size-4" />نمایش پاسخ</Button>}
            <span className="flex-1" />
            <Button variant="cta" onClick={() => setConfirm(true)}>پایان و ثبت نهایی</Button>
          </div>
        </section>
        <aside aria-label="پیمایش سؤال‌ها" className="self-start rounded-lg border border-line bg-white p-4 shadow-soft md:sticky md:top-40">
          <h3 className="mb-3 text-sm font-bold">سؤال‌ها</h3>
          <ol className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-4">{questions.map((x, i) => {
            const a = answered(x); const m = draft.marked.includes(x.id); const cur = i === idx;
            return <li key={x.id}><button onClick={() => save(quiz.id, { current: i })} aria-current={cur ? "step" : undefined} aria-label={`سؤال ${formatNumber(i + 1)}${a ? "، پاسخ داده شده" : "، بدون پاسخ"}${m ? "، علامت‌گذاری‌شده" : ""}`} className={cn("relative grid size-10 w-full place-items-center rounded-md border text-sm font-bold", cur && "ring-2 ring-brand-500 ring-offset-1", a ? "border-brand-500 bg-brand-600 text-white" : "border-line-strong bg-white text-ink-700")}>{formatNumber(i + 1)}{m && <Flag className="absolute -end-1 -top-1 size-4 rounded-full bg-flame-400 p-0.5 text-ink" aria-hidden />}</button></li>;
          })}</ol>
          <dl className="mt-4 space-y-1 text-xs text-ink-600"><div className="flex items-center gap-2"><span className="size-3 rounded bg-brand-600" />پاسخ‌داده‌شده</div><div className="flex items-center gap-2"><span className="size-3 rounded border border-line-strong bg-white" />بدون پاسخ</div><div className="flex items-center gap-2"><Flag className="size-3 text-flame-500" />علامت‌گذاری‌شده</div></dl>
          <Button variant="ghost" size="sm" className="mt-3 w-full text-danger-600" onClick={() => setCancel(true)}><RotateCcw className="size-4" />انصراف از این تلاش</Button>
        </aside>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => finish(false)} title="ثبت نهایی آزمون" confirmLabel="ثبت نهایی">
        {unanswered > 0 ? <p><b>{formatNumber(unanswered)}</b> سؤال بدون پاسخ دارید. پس از ثبت نهایی امکان تغییر نیست. ادامه می‌دهید؟</p> : <p>همهٔ سؤال‌ها پاسخ داده شده‌اند. پس از ثبت نهایی امکان تغییر نیست.</p>}
        {draft.marked.length > 0 && <p className="mt-2 text-warning-700">{formatNumber(draft.marked.length)} سؤال علامت‌گذاری‌شده دارید.</p>}
      </ConfirmDialog>
      <ConfirmDialog open={cancel} onClose={() => setCancel(false)} onConfirm={() => { discard(quiz.id); toast.info("تلاش لغو شد و در سابقه ثبت نشد."); }} title="انصراف از تلاش" danger confirmLabel="انصراف و حذف پاسخ‌ها">پاسخ‌های این تلاش حذف می‌شود و در سابقه ثبت نخواهد شد.</ConfirmDialog>
    </div>
  );
}

function Results({ quiz, questions, attempt, courseSlug }: { quiz: Quiz; questions: Question[]; attempt: QuizAttempt; courseSlug: string }) {
  const user = useSessionUser()!;
  const course = useApp((s) => s.courses.find((c) => c.id === quiz.courseId))!;
  const completed = useApp((s) => s.completed[`${user.id}:${quiz.courseId}`] ?? []);
  const attempts = useApp((s) => s.attempts);
  const cert = useApp((s) => s.certificates.find((c) => c.userId === user.id && c.courseId === quiz.courseId && !c.revoked));
  const issue = useApp((s) => s.issueCertificate);
  const g = gradeQuiz({ passPercent: quiz.passPercent }, questions, attempt.answers as Record<string, AnswerValue>);
  const elig = certificateEligibility(course, completed, quiz.id === course.certificateQuizId ? quiz : undefined, attemptsFor(attempts, user.id, quiz.id));
  return (
    <div className="container-x max-w-3xl py-8">
      <div className="text-center">
        <div className={cn("mx-auto grid size-24 place-items-center rounded-full text-3xl font-bold", attempt.passed ? "bg-success-100 text-success-600" : "bg-danger-100 text-danger-600")}>{formatPercent(attempt.percent)}</div>
        <h1 className="mt-4 text-2xl font-bold">{attempt.passed ? "قبول شدید" : "این بار قبول نشدید"}</h1>
        <p className="mt-1 text-ink-600">{formatNumber(attempt.score)} از {formatNumber(attempt.maxScore)} نمره · نمرهٔ قبولی {formatPercent(quiz.passPercent)} · {formatDateTime(attempt.submittedAt)}{attempt.timedOut && " · پایان زمان"}</p>
      </div>
      {quiz.id === course.certificateQuizId && attempt.passed && (
        <Alert tone={cert ? "success" : elig.eligible ? "success" : "info"} className="mt-6" title="گواهی پایان دوره">
          {cert ? <>گواهی شما صادر شده است. <Link className="font-bold underline" href={`/certificate/${cert.id}`}>مشاهده</Link></> : elig.eligible ? <Button size="sm" className="mt-2" onClick={() => { const r = issue(user.id, course.id); if (r.ok) toast.success("گواهی صادر شد.", { label: "مشاهده", href: `/certificate/${r.certificate!.id}` }); else toast.error(r.reason ?? ""); }}><Award className="size-4" />دریافت گواهی</Button> : <>برای صدور گواهی هنوز {elig.reasons[0]}</>}
        </Alert>
      )}
      <section className="mt-8" aria-labelledby="review"><h2 id="review" className="mb-3 text-xl font-bold">مرور پاسخ‌ها</h2>
        <ol className="space-y-4">{questions.map((q, i) => {
          const it = g.items[i]; const given = attempt.answers[q.id];
          const givenText = !it.answered ? "بدون پاسخ" : q.type === "mcq" ? q.options![given as number] : q.type === "tf" ? (given ? "درست" : "نادرست") : String(given);
          const rightText = q.type === "mcq" ? q.options![q.correct as number] : q.type === "tf" ? (q.correct ? "درست" : "نادرست") : (q.correct as string[])[0];
          return <li key={q.id} className={cn("rounded-lg border bg-white p-4 shadow-soft", it.correct ? "border-success-600/40" : "border-danger-600/40")}>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold">{it.correct ? <CheckCircle2 className="size-5 text-success-600" aria-label="درست" /> : <XCircle className="size-5 text-danger-600" aria-label="نادرست" />}سؤال {formatNumber(i + 1)}<span className="me-auto" /><Badge tone={it.correct ? "success" : "danger"}>{formatNumber(it.earned)} از {formatNumber(it.max)}</Badge></div>
            <p className="leading-9"><MathText text={q.prompt} /></p>
            <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2"><div><dt className="text-ink-500">پاسخ شما</dt><dd className={cn("font-medium", !it.correct && "text-danger-600")}><MathText text={givenText} /></dd></div>{!it.correct && <div><dt className="text-ink-500">پاسخ درست</dt><dd className="font-medium text-success-600"><MathText text={rightText} /></dd></div>}</dl>
            <p className="mt-3 rounded-md bg-card p-3 text-sm leading-7"><b>توضیح: </b><MathText text={q.explanation} /></p>
          </li>;
        })}</ol>
      </section>
      <div className="mt-8 flex flex-wrap gap-3"><Button href={`/quiz/${quiz.id}`} variant="cta">سابقه و تلاش مجدد</Button><Button href={`/learn/${courseSlug}`} variant="outline">بازگشت به درس‌ها</Button><Button href="/dashboard/quizzes" variant="ghost">آزمون‌های من</Button></div>
    </div>
  );
}
