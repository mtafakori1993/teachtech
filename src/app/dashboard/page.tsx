import type { Metadata } from "next";
import { StudentOverview } from "@/components/dashboard/student-overview";
export const metadata: Metadata = { title: "داشبورد دانش‌آموز" };
export default function Page() { return <StudentOverview />; }
