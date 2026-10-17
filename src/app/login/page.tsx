import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/pages/login-form";
export const metadata: Metadata = { title: "ورود", robots: { index: false } };
export default function LoginPage() { return <Suspense fallback={null}><LoginForm /></Suspense>; }
