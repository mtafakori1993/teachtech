import type { Metadata } from "next";
import { MyQuizzes } from "@/components/dashboard/student-pages";
export const metadata: Metadata = { title: "آزمون‌های من" };
export default function Page() { return <MyQuizzes />; }
