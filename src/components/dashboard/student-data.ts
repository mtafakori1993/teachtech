"use client";
import { useMemo } from "react";
import { useApp, useSessionUser } from "@/store/app";
import { courseProgress, nextLesson } from "@/lib/progress";
import { attemptsFor } from "@/lib/quiz";
import { certificateEligibility } from "@/lib/certificates";
import type { Course, Quiz } from "@/data/types";

export interface EnrolledCourse { course: Course; enrolledAt: string; prog: ReturnType<typeof courseProgress>; next: ReturnType<typeof nextLesson>; quiz?: Quiz; elig: ReturnType<typeof certificateEligibility>; hasCert: boolean }

/** Everything the student dashboard needs, derived once from raw store slices. */
export function useStudentData() {
  const user = useSessionUser();
  const s = {
    enrollments: useApp((x) => x.enrollments), courses: useApp((x) => x.courses), completed: useApp((x) => x.completed), quizzes: useApp((x) => x.quizzes),
    attempts: useApp((x) => x.attempts), certificates: useApp((x) => x.certificates),
  };
  return useMemo(() => {
    const uid = user?.id ?? "";
    const enrolled = s.enrollments.filter((e) => e.userId === uid).map((e): EnrolledCourse | null => {
      const course = s.courses.find((c) => c.id === e.courseId);
      if (!course) return null;
      const done = s.completed[`${uid}:${course.id}`] ?? [];
      const quiz = s.quizzes.find((q) => q.id === course.certificateQuizId);
      return { course, enrolledAt: e.enrolledAt, prog: courseProgress(course, done), next: nextLesson(course, done), quiz, elig: certificateEligibility(course, done, quiz, attemptsFor(s.attempts, uid, quiz?.id ?? "")), hasCert: s.certificates.some((c) => c.userId === uid && c.courseId === course.id && !c.revoked) };
    }).filter((x): x is EnrolledCourse => !!x).sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));
    const overall = enrolled.length ? Math.round(enrolled.reduce((t, c) => t + c.prog.percent, 0) / enrolled.length) : 0;
    return { user, enrolled, overall };
  }, [user, s.enrollments, s.courses, s.completed, s.quizzes, s.attempts, s.certificates]);
}
