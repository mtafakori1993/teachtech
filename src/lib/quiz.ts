import type { Question, Quiz, QuizAttempt } from "@/data/types";
import { toEnDigits } from "./format";

export type AnswerValue = string | number | boolean | null;

/** Normalise free-text answers: Persian/Arabic digits, decimal separators, minus signs, spaces. */
export function normalizeAnswer(raw: string): string {
  return toEnDigits(raw)
    .replace(/[٫،]/g, ".")
    .replace(/[٬,]/g, "")
    .replace(/[−–—]/g, "-")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function toNumber(s: string): number | null {
  const m = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/.exec(s);
  if (m) return Number(m[2]) === 0 ? null : Number(m[1]) / Number(m[2]);
  return /^-?\d+(?:\.\d+)?$/.test(s) ? Number(s) : null;
}

export function isCorrect(q: Question, answer: AnswerValue | undefined): boolean {
  if (answer === null || answer === undefined || answer === "") return false;
  if (q.type === "mcq") return typeof answer === "number" && answer === q.correct;
  if (q.type === "tf") return typeof answer === "boolean" && answer === q.correct;
  const given = normalizeAnswer(String(answer));
  const accepted = (q.correct as string[]).map(normalizeAnswer);
  if (accepted.includes(given)) return true;
  const g = toNumber(given);
  return g !== null && accepted.some((a) => {
    const n = toNumber(a);
    return n !== null && Math.abs(n - g) < 1e-9;
  });
}

export interface GradeResult {
  score: number; maxScore: number; percent: number; passed: boolean;
  items: { id: string; answered: boolean; correct: boolean; earned: number; max: number }[];
}

/** Scoring is derived only from the quiz questions and the given answers. */
export function gradeQuiz(quiz: Pick<Quiz, "passPercent">, questions: Question[], answers: Record<string, AnswerValue>): GradeResult {
  const items = questions.map((q) => {
    const a = answers[q.id];
    const answered = !(a === null || a === undefined || a === "");
    const correct = isCorrect(q, a);
    return { id: q.id, answered, correct, earned: correct ? q.points : 0, max: q.points };
  });
  const maxScore = items.reduce((s, i) => s + i.max, 0);
  const score = items.reduce((s, i) => s + i.earned, 0);
  const percent = maxScore === 0 ? 0 : Math.round((score / maxScore) * 1000) / 10;
  return { score, maxScore, percent, passed: maxScore > 0 && percent >= quiz.passPercent, items };
}

export const attemptsFor = (attempts: QuizAttempt[], userId: string, quizId: string) =>
  attempts.filter((a) => a.userId === userId && a.quizId === quizId).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

export const bestAttempt = (attempts: QuizAttempt[]) => attempts.reduce<QuizAttempt | null>((b, a) => (!b || a.percent > b.percent ? a : b), null);

export type StartCheck = { ok: true; attemptsUsed: number } | { ok: false; reason: string; attemptsUsed: number };

/** Retake rules: attempt cap, one pass per non-practice quiz unless the platform allows retakes, opening/closing window. */
export function canStartQuiz(quiz: Quiz, past: QuizAttempt[], opts: { allowRetakeAfterPass: boolean; now?: Date } = { allowRetakeAfterPass: false }): StartCheck {
  const used = past.length;
  const now = opts.now ?? new Date();
  if (!quiz.published) return { ok: false, reason: "این آزمون هنوز منتشر نشده است.", attemptsUsed: used };
  if (quiz.opensAt && new Date(quiz.opensAt) > now) return { ok: false, reason: "زمان شروع این آزمون هنوز فرا نرسیده است.", attemptsUsed: used };
  if (!quiz.practice) {
    if (quiz.maxAttempts !== null && used >= quiz.maxAttempts) return { ok: false, reason: "سقف تعداد دفعات مجاز شرکت در این آزمون تکمیل شده است.", attemptsUsed: used };
    if (!opts.allowRetakeAfterPass && past.some((a) => a.passed)) return { ok: false, reason: "شما این آزمون را با موفقیت گذرانده‌اید.", attemptsUsed: used };
  }
  return { ok: true, attemptsUsed: used };
}

export const remainingSeconds = (quiz: Quiz, startedAt: string, now: number = Date.now()) =>
  quiz.timeLimitMin === null ? null : Math.max(0, Math.floor((new Date(startedAt).getTime() + quiz.timeLimitMin * 60000 - now) / 1000));
