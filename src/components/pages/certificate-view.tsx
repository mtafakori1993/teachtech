"use client";
import Link from "next/link";
import { Printer, ShieldCheck, ArrowRight } from "lucide-react";
import { CertificateSheet } from "./certificate-sheet";
import { Button } from "@/components/ui/button";
import { Alert, EmptyState, Skeleton } from "@/components/ui/primitives";
import { findCertificate } from "@/lib/certificates";
import { useApp, useHydrated } from "@/store/app";

export function CertificateView({ id }: { id: string }) {
  const hydrated = useHydrated();
  const certs = useApp((s) => s.certificates);
  if (!hydrated) return <div className="container-x py-10"><Skeleton className="aspect-[297/210] w-full max-w-4xl" /></div>;
  const c = findCertificate(certs, id);
  if (!c) return <div className="container-x py-16"><EmptyState title="گواهی پیدا نشد" action={<Button href="/verify">استعلام گواهی</Button>}>شناسهٔ گواهی در داده‌های این مرورگر وجود ندارد.</EmptyState></div>;
  return (
    <div className="container-x py-8">
      <div className="no-print mb-5 flex flex-wrap items-center gap-3">
        <Link href="/dashboard/certificates" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"><ArrowRight className="size-4" />گواهی‌های من</Link>
        <span className="flex-1" />
        <Button variant="outline" href={`/verify/${encodeURIComponent(c.id)}`}><ShieldCheck className="size-4" />صفحهٔ استعلام</Button>
        <Button onClick={() => window.print()}><Printer className="size-4" />چاپ / ذخیره به‌صورت PDF</Button>
      </div>
      {c.revoked && <Alert tone="danger" className="no-print mb-4" title="این گواهی ابطال شده است" />}
      <CertificateSheet c={c} />
      <p className="no-print mx-auto mt-4 max-w-4xl text-sm text-ink-600">برای ذخیرهٔ PDF در پنجرهٔ چاپ مرورگر مقصد «Save as PDF» را انتخاب کنید و گزینهٔ «Background graphics» را فعال بگذارید.</p>
    </div>
  );
}
