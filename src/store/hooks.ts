"use client";
import { useMemo } from "react";
import { useApp, useSessionUser } from "./app";
import type { Course, Instructor } from "@/data/types";

/** Selectors derive from raw slices with useMemo (selectors returning fresh arrays would loop in React 19). */
export function useEnrolledCourseIds(): Set<string> {
  const user = useSessionUser();
  const enrollments = useApp((s) => s.enrollments);
  return useMemo(() => new Set(enrollments.filter((e) => e.userId === user?.id).map((e) => e.courseId)), [enrollments, user?.id]);
}
export const usePublishedCourses = (): Course[] => {
  const courses = useApp((s) => s.courses);
  return useMemo(() => courses.filter((c) => c.status === "published"), [courses]);
};
export const useCourse = (idOrSlug: string): Course | undefined => {
  const courses = useApp((s) => s.courses);
  return useMemo(() => courses.find((c) => c.id === idOrSlug || c.slug === idOrSlug), [courses, idOrSlug]);
};
export const useInstructorOf = (c: Pick<Course, "instructorId">): Instructor | undefined => {
  const list = useApp((s) => s.instructors);
  return useMemo(() => list.find((i) => i.id === c.instructorId), [list, c.instructorId]);
};
export const useCompleted = (courseId: string): string[] => {
  const user = useSessionUser();
  const completed = useApp((s) => s.completed);
  return useMemo(() => (user ? completed[`${user.id}:${courseId}`] ?? [] : []), [completed, user, courseId]);
};
