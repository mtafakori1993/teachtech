"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, BadgeX, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Alert, Card } from "@/components/ui/primitives";
import { findCertificate } from "@/lib/certificates";
import { formatDate } from "@/lib/format";
import { useApp, useHydrated } from "@/store/app";

export function VerifyForm({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const certs = useApp((s) => s.certificates);
  const [v, setV] = useState(initial);
  const result = initial && hydrated ? findCertificate(certs, initial) : null;
  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); const t = v.trim(); if (t) router.push(`/verify/${encodeURIComponent(t)}`); }} className="flex items-end gap-2">
        <Field label="شناسهٔ گواهی" className="flex-1">{(p) => <Input {...p} dir="ltr" className="text-end uppercase" value={v} onChange={(e) => setV(e.target.value)} placeholder="TT-XXXXXXXX" />}</Field>
        <Button type="submit"><Search className="size-4" />استعلام</Button>
      </form>
      {initial && hydrated && (result ? (
        <Card className={`p-5 ${result.revoked ? "border-danger-600/40" : "border-success-600/40"}`}>
          <p className={`flex items-center gap-2 font-bold ${result.revoked ? "text-danger-600" : "text-success-600"}`}>{result.revoked ? <BadgeX className="size-6" /> : <BadgeCheck className="size-6" />}{result.revoked ? "این گواهی ابطال شده است" : "گواهی در داده‌های محلی ثبت شده است"}</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {[["نام دارندهٔ گواهی", result.studentName], ["دوره", result.courseTitle], ["مدرس", result.instructorName], ["تاریخ صدور", formatDate(result.issuedAt)]].map(([k, val]) => <div key={k}><dt className="text-ink-500">{k}</dt><dd className="font-medium">{val}</dd></div>)}
          </dl>
          <Button href={`/certificate/${encodeURIComponent(result.id)}`} variant="outline" size="sm" className="mt-4">مشاهدهٔ گواهی</Button>
        </Card>
      ) : <Alert tone="danger" title="گواهی‌ای با این شناسه پیدا نشد">شناسه را بررسی کنید. فقط گواهی‌های ثبت‌شده در همین مرورگر قابل استعلام هستند.</Alert>)}
      <Alert tone="info" title="محدودیت استعلام">این استعلام فقط داده‌های ذخیره‌شده در همین مرورگر را جست‌وجو می‌کند؛ تأیید رمزنگاری‌شده یا مستقل از سرور نیست و گواهی‌ها مدرک رسمی دولتی نیستند.</Alert>
    </div>
  );
}
