import type { Metadata } from "next";
import { VerifyForm } from "@/components/pages/verify";
import { PageHero } from "@/components/pages/prose";
export const metadata: Metadata = { title: "استعلام گواهی", description: "بررسی شناسهٔ گواهی‌های ثبت‌شده در TeachTech.", alternates: { canonical: "/verify" } };
export default function VerifyPage() { return (<><PageHero eyebrow="گواهی" title="استعلام گواهی">شناسهٔ گواهی (مثل TT-XXXXXXXX) را وارد کنید.</PageHero><div className="container-x max-w-2xl py-10"><VerifyForm /></div></>); }
