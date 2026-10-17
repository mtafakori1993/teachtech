import type { Metadata } from "next";
import { MyCertificates } from "@/components/dashboard/student-pages";
export const metadata: Metadata = { title: "گواهی‌های من" };
export default function Page() { return <MyCertificates />; }
