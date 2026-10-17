import { describe, expect, it } from "vitest";
import { buildSeed, DEMO_STUDENT_ID } from "@/data/seed";
import { quizQuestions } from "@/data/quizzes";
import { canStartQuiz, gradeQuiz, isCorrect, normalizeAnswer, remainingSeconds, attemptsFor } from "@/lib/quiz";
import { allLessons, canAccessLesson, courseProgress, neighbours, nextLesson } from "@/lib/progress";
import { certificateEligibility, findCertificate, makeCertificateId } from "@/lib/certificates";

const s = buildSeed();
const quiz = (id: string) => s.quizzes.find((q) => q.id === id)!;
const course = (id: string) => s.courses.find((c) => c.id === id)!;

describe("quiz scoring", () => {
  it("grades every question type from the data (no forced pass)", () => {
    const q = quiz("q-c01-final");
    const qs = quizQuestions(q, s.questions);
    const none = gradeQuiz(q, qs, {});
    expect(none.score).toBe(0); expect(none.passed).toBe(false);
    const perfect = gradeQuiz(q, qs, { "c01-1": 2, "c01-2": 0, "c01-3": true, "c01-4": "۴" });
    expect(perfect.percent).toBe(100); expect(perfect.passed).toBe(true);
    const partial = gradeQuiz(q, qs, { "c01-1": 2, "c01-2": 1, "c01-3": false, "c01-4": "4" });
    expect(partial.score).toBe(4); expect(partial.maxScore).toBe(7);
    expect(partial.passed).toBe(false); // 57.1% < 60
  });
  it("threshold boundary is inclusive (3/5 = 60% passes at 60, fails at 61)", () => {
    const qs = quizQuestions(quiz("q-c01-practice"), s.questions); // 2+1+2 = 5 points
    const answers = { "c01-1": 2, "c01-3": true }; // 3 of 5
    expect(gradeQuiz({ passPercent: 60 }, qs, answers)).toMatchObject({ percent: 60, passed: true });
    expect(gradeQuiz({ passPercent: 61 }, qs, answers).passed).toBe(false);
  });
  it("short answers accept Persian digits, fractions and decimals", () => {
    const sa = s.questions.find((x) => x.id === "c06-4")!;
    expect(isCorrect(sa, "1/2")).toBe(true);
    expect(isCorrect(sa, "۰٫۵")).toBe(true);
    expect(isCorrect(sa, "0.5")).toBe(true);
    expect(isCorrect(sa, "0.6")).toBe(false);
    expect(isCorrect(sa, "")).toBe(false);
    expect(normalizeAnswer(" ۱۲ ")).toBe("12");
  });
  it("seeded attempts match recomputed grades", () => {
    for (const a of s.attempts) {
      const q = quiz(a.quizId);
      const g = gradeQuiz(q, quizQuestions(q, s.questions), a.answers);
      expect(a.score).toBe(g.score); expect(a.percent).toBe(g.percent); expect(a.passed).toBe(g.passed);
    }
  });
});

describe("retake rules and timer", () => {
  it("caps attempts, blocks retake after pass, and allows unlimited practice", () => {
    const q = quiz("q-c14-final");
    const mk = (passed: boolean, i: number) => ({ ...s.attempts[1], id: `x${i}`, passed });
    expect(canStartQuiz(q, [mk(false, 1), mk(false, 2)]).ok).toBe(true);
    expect(canStartQuiz(q, [mk(false, 1), mk(false, 2), mk(false, 3)]).ok).toBe(false);
    expect(canStartQuiz(q, [mk(true, 1)]).ok).toBe(false);
    expect(canStartQuiz(q, [mk(true, 1)], { allowRetakeAfterPass: true }).ok).toBe(true);
    const p = quiz("q-c01-practice");
    expect(canStartQuiz(p, Array.from({ length: 20 }, (_, i) => mk(true, i))).ok).toBe(true);
  });
  it("computes remaining seconds and clamps at zero", () => {
    const q = quiz("q-c01-final"); // 12 min
    const start = "2026-10-17T10:00:00.000Z";
    expect(remainingSeconds(q, start, new Date("2026-10-17T10:05:00.000Z").getTime())).toBe(420);
    expect(remainingSeconds(q, start, new Date("2026-10-17T11:00:00.000Z").getTime())).toBe(0);
    expect(remainingSeconds(quiz("q-c01-practice"), start)).toBeNull();
  });
});

describe("lesson progress", () => {
  it("computes percentage from existing lessons only", () => {
    const c = course("c03");
    const ls = allLessons(c);
    expect(ls.length).toBe(8);
    const p = courseProgress(c, ls.slice(0, 6).map((l) => l.id));
    expect(p).toMatchObject({ done: 6, total: 8, percent: 75, remaining: 2, complete: false });
    expect(courseProgress(c, [...ls.map((l) => l.id), "ghost-lesson"]).percent).toBe(100);
    expect(courseProgress(c, []).percent).toBe(0);
  });
  it("finds next lesson and neighbours", () => {
    const c = course("c03");
    const ls = allLessons(c);
    expect(nextLesson(c, ls.slice(0, 6).map((l) => l.id))?.id).toBe(ls[6].id);
    expect(nextLesson(c, ls.map((l) => l.id))).toBeNull();
    expect(neighbours(c, ls[0].id).prev).toBeNull();
    expect(neighbours(c, ls[ls.length - 1].id).next).toBeNull();
  });
  it("locks non-preview lessons for non-enrolled users", () => {
    const [first, , third] = allLessons(course("c03"));
    expect(canAccessLesson(first, false)).toBe(true);
    expect(canAccessLesson(third, false)).toBe(false);
    expect(canAccessLesson(third, true)).toBe(true);
  });
});

describe("certificate eligibility", () => {
  const el = (userId: string, courseId: string) => {
    const c = course(courseId);
    const q = s.quizzes.find((x) => x.id === c.certificateQuizId);
    return certificateEligibility(c, s.completed[`${userId}:${courseId}`] ?? [], q, attemptsFor(s.attempts, userId, q?.id ?? ""));
  };
  it("requires all lessons AND a passing final quiz", () => {
    expect(el(DEMO_STUDENT_ID, "c10").eligible).toBe(true);
    expect(el(DEMO_STUDENT_ID, "c03").eligible).toBe(false); // lessons incomplete, no attempt
    expect(el("u-parsa", "c07").eligible).toBe(false); // lessons incomplete
    expect(el("u-arian", "c07").eligible).toBe(true); // complete + passed but not yet issued
    expect(el(DEMO_STUDENT_ID, "c14").quizPassed).toBe(false);
  });
  it("is not eligible when the course has no certificate", () => {
    const c = { ...course("c10"), certificate: false };
    const r = certificateEligibility(c, allLessons(c).map((l) => l.id), quiz("q-c10-final"), s.attempts.filter((a) => a.quizId === "q-c10-final" && a.userId === DEMO_STUDENT_ID));
    expect(r.eligible).toBe(false);
  });
  it("ids are stable, prefixed, and lookups are case/space tolerant", () => {
    expect(makeCertificateId("a")).toBe(makeCertificateId("a"));
    expect(makeCertificateId("a")).toMatch(/^TT-[A-Z2-9]{8}$/);
    const c = s.certificates[0];
    expect(findCertificate(s.certificates, ` ${c.id.toLowerCase()} `)?.id).toBe(c.id);
    expect(findCertificate(s.certificates, "TT-NOPE")).toBeNull();
  });
});
