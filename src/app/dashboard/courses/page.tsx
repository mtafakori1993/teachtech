import type { Metadata } from "next";
import { MyCourses } from "@/components/dashboard/student-pages";
export const metadata: Metadata = { title: "دوره‌های من" };
export default function Page() { return <MyCourses />; }
