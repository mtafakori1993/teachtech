import type { Metadata } from "next";
import { ProfilePage } from "@/components/dashboard/student-pages";
export const metadata: Metadata = { title: "پروفایل و تنظیمات" };
export default function Page() { return <ProfilePage />; }
