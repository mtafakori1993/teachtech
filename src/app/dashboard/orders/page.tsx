import type { Metadata } from "next";
import { MyOrders } from "@/components/dashboard/student-pages";
export const metadata: Metadata = { title: "سفارش‌ها" };
export default function Page() { return <MyOrders />; }
