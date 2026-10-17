"use client";
import { CourseCard } from "@/components/course/course-card";
import { usePublishedCourses } from "@/store/hooks";
export function InstructorCourses() {
  const list = usePublishedCourses();
  return <section aria-labelledby="courses"><h2 id="courses" className="mb-4 text-2xl font-bold">دوره‌های موجود</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((c) => <CourseCard key={c.id} course={c} />)}</div></section>;
}
