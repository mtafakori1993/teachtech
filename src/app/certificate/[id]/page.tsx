import type { Metadata } from "next";
import { CertificateView } from "@/components/pages/certificate-view";
export const metadata: Metadata = { title: "گواهی پایان دوره", robots: { index: false, follow: false } };
export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CertificateView id={decodeURIComponent(id)} />;
}
