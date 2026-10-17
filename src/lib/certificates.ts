import type { Certificate, Course, Quiz, QuizAttempt } from "@/data/types";
import { courseProgress } from "./progress";

export interface Eligibility {
  eligible: boolean;
  lessonsDone: boolean;
  quizPassed: boolean;
  bestPercent: number | null;
  requiredPercent: number;
  reasons: string[];
}

/** Certificate conditions: every lesson completed AND the course's final quiz passed at (or above) the course threshold. */
export function certificateEligibility(course: Course, completedIds: readonly string[], quiz: Quiz | undefined, attempts: QuizAttempt[]): Eligibility {
  const required = Math.max(course.passPercent, quiz?.passPercent ?? 0);
  const prog = courseProgress(course, completedIds);
  const mine = quiz ? attempts.filter((a) => a.quizId === quiz.id) : [];
  const best = mine.length ? Math.max(...mine.map((a) => a.percent)) : null;
  const quizPassed = best !== null && best >= required;
  const reasons: string[] = [];
  if (!course.certificate) reasons.push("برای این دوره گواهی تعریف نشده است.");
  if (!prog.complete) reasons.push(`هنوز ${prog.remaining} درس باقی مانده است.`);
  if (!quiz) reasons.push("آزمون پایانی برای این دوره تنظیم نشده است.");
  else if (!quizPassed) reasons.push(`برای صدور گواهی باید حداقل ${required}٪ نمرهٔ آزمون پایانی را کسب کنید.`);
  return { eligible: course.certificate && prog.complete && !!quiz && quizPassed, lessonsDone: prog.complete, quizPassed, bestPercent: best, requiredPercent: required, reasons };
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Deterministic-looking local identifier. Locally generated: NOT cryptographic and NOT verified by any server. */
export function makeCertificateId(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  let out = "";
  for (let i = 0; i < 8; i++) { out += ALPHABET[h % ALPHABET.length]; h = (Math.imul(h, 1103515245) + 12345) >>> 0; }
  return `TT-${out}`;
}

export const findCertificate = (certs: Certificate[], rawId: string) => {
  const id = rawId.trim().toUpperCase().replace(/\s+/g, "");
  return certs.find((c) => c.id.toUpperCase() === id) ?? null;
};
