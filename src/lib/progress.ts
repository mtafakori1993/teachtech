import type { Course, Lesson } from "@/data/types";

export const allLessons = (c: Pick<Course, "sections">): Lesson[] => c.sections.flatMap((s) => s.lessons);
export const lessonCount = (c: Pick<Course, "sections">) => allLessons(c).length;
export const courseMinutes = (c: Pick<Course, "sections">) => allLessons(c).reduce((s, l) => s + l.durationMin, 0);

export interface Progress { done: number; total: number; percent: number; remaining: number; minutesLeft: number; complete: boolean }

/** Progress counts only lessons that still exist in the course, so editing a curriculum never yields >100%. */
export function courseProgress(c: Pick<Course, "sections">, completedIds: readonly string[]): Progress {
  const lessons = allLessons(c);
  const set = new Set(completedIds);
  const doneLessons = lessons.filter((l) => set.has(l.id));
  const total = lessons.length;
  return {
    done: doneLessons.length,
    total,
    percent: total === 0 ? 0 : Math.round((doneLessons.length / total) * 100),
    remaining: total - doneLessons.length,
    minutesLeft: lessons.filter((l) => !set.has(l.id)).reduce((s, l) => s + l.durationMin, 0),
    complete: total > 0 && doneLessons.length === total,
  };
}

export const nextLesson = (c: Pick<Course, "sections">, completedIds: readonly string[]): Lesson | null => {
  const set = new Set(completedIds);
  return allLessons(c).find((l) => !set.has(l.id)) ?? null;
};

export function neighbours(c: Pick<Course, "sections">, lessonId: string): { prev: Lesson | null; next: Lesson | null; index: number } {
  const ls = allLessons(c);
  const i = ls.findIndex((l) => l.id === lessonId);
  return { prev: i > 0 ? ls[i - 1] : null, next: i >= 0 && i < ls.length - 1 ? ls[i + 1] : null, index: i };
}

/** A lesson is reachable if it is a free preview or the user is enrolled. */
export const canAccessLesson = (lesson: Pick<Lesson, "isPreview">, enrolled: boolean) => enrolled || lesson.isPreview;
