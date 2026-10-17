import type { Metadata } from "next";
import { LearnView } from "@/components/learn/learn-view";
export const metadata: Metadata = { title: "صفحهٔ یادگیری", robots: { index: false, follow: false } };
export default async function LearnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LearnView slug={slug} />;
}
