import type { Metadata } from "next";
import { VerifyForm } from "@/components/pages/verify";
import { PageHero } from "@/components/pages/prose";
export const metadata: Metadata = { title: "نتیجهٔ استعلام گواهی", robots: { index: false } };
export default async function VerifyResult({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (<><PageHero eyebrow="گواهی" title="نتیجهٔ استعلام" /><div className="container-x max-w-2xl py-10"><VerifyForm initial={decodeURIComponent(id)} /></div></>);
}
