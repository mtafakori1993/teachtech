import type { Metadata } from "next";
import { LearningCalendar } from "@/components/dashboard/student-pages";
export const metadata: Metadata = { title: "تقویم یادگیری" };
export default function Page() { return <LearningCalendar />; }
