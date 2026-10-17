import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/shell";

export const metadata: Metadata = { title: { default: "داشبورد", template: "%s | TeachTech" }, robots: { index: false, follow: false } };

export default function Layout({ children }: { children: ReactNode }) {
  return <DashboardShell role="student">{children}</DashboardShell>;
}
