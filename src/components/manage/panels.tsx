"use client";
import { useMemo, useState } from "react";
import { Award, Pencil, Plus, Trash2, Pin } from "lucide-react";
import { BarChart, HBar } from "./charts";
import { AnnouncementDialog } from "./forms";
import { Alert, Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { toast } from "@/components/ui/toast";
import { allLessons } from "@/lib/progress";
import { completionRate, paidOrders, revenueByCourse, revenueByMonth, totalRevenue } from "@/lib/analytics";
import { certificateEligibility } from "@/lib/certificates";
import { attemptsFor } from "@/lib/quiz";
import { formatDate, formatNumber, formatToman } from "@/lib/format";
import { useApp, useSessionUser } from "@/store/app";
import type { Announcement } from "@/data/types";

export function AnalyticsPanel({ courseIds }: { courseIds?: string[] }) {
  const orders = useApp((s) => s.orders); const courses = useApp((s) => s.courses); const enrollments = useApp((s) => s.enrollments); const completed = useApp((s) => s.completed);
  const scope = useMemo(() => courses.filter((c) => !courseIds || courseIds.includes(c.id)), [courses, courseIds]);
  const rows = useMemo(() => revenueByCourse(orders, scope), [orders, scope]);
  const months = useMemo(() => revenueByMonth(orders), [orders]);
  const max = Math.max(1, ...rows.map((r) => r.revenue));
  const paid = paidOrders(orders);
  return (
    <div className="space-y-6">
      <Alert tone="warning" title="داده‌های نمونه">مبالغ و فروش نمایش‌داده‌شده از سفارش‌های شبیه‌سازی‌شدهٔ همین مرورگر محاسبه می‌شود و گزارش مالی واقعی نیست.</Alert>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-sm text-ink-600">مجموع فروش (نمونه)</p><p className="tabular text-2xl font-bold">{formatToman(totalRevenue(orders))}</p></Card>
        <Card className="p-4"><p className="text-sm text-ink-600">سفارش‌های پرداخت‌شده</p><p className="tabular text-2xl font-bold">{formatNumber(paid.length)}</p></Card>
        <Card className="p-4"><p className="text-sm text-ink-600">میانگین سفارش</p><p className="tabular text-2xl font-bold">{formatToman(paid.length ? Math.round(totalRevenue(orders) / paid.length) : 0)}</p></Card>
      </div>
      <Card className="p-5"><h3 className="mb-4 font-bold">فروش ماهانه (تومان، نمونه)</h3>{months.length ? <BarChart data={months.map((m) => ({ label: m.label.split(" ")[0], value: m.revenue }))} label="فروش ماهانه به تومان" format={(n) => formatNumber(Math.round(n / 1000)) + "هزار"} color="#F2994A" /> : <p className="text-sm text-ink-500">فروشی ثبت نشده است.</p>}</Card>
      <Card className="space-y-3 p-5"><h3 className="font-bold">فروش به تفکیک دوره</h3>{rows.map((r) => <HBar key={r.course.id} label={r.course.title} value={r.revenue} max={max} text={`${formatNumber(r.sales)} فروش`} />)}</Card>
      <DataTable caption="عملکرد دوره‌ها" rows={rows} rowKey={(r) => r.course.id} searchText={(r) => r.course.title} pageSize={8}
        columns={[{ key: "c", header: "دوره", cell: (r) => <span className="font-medium">{r.course.title}</span> }, { key: "e", header: "ثبت‌نام", sort: (r) => enrollments.filter((e) => e.courseId === r.course.id).length, cell: (r) => <span className="tabular">{formatNumber(enrollments.filter((e) => e.courseId === r.course.id).length)}</span> }, { key: "r", header: "فروش (نمونه)", sort: (r) => r.revenue, cell: (r) => <span className="tabular">{formatToman(r.revenue)}</span> }, { key: "p", header: "نرخ تکمیل", sort: (r) => completionRate(enrollments, r.course.id, completed, allLessons(r.course).map((l) => l.id)), cell: (r) => <span className="tabular">{formatNumber(completionRate(enrollments, r.course.id, completed, allLessons(r.course).map((l) => l.id)))}٪</span>, hideOnMobile: true }]} />
    </div>
  );
}

export function AnnouncementsManager({ scopeCourseIds }: { scopeCourseIds?: string[] }) {
  const user = useSessionUser(); const all = useApp((s) => s.announcements); const courses = useApp((s) => s.courses); const del = useApp((s) => s.deleteAnnouncement);
  const [edit, setEdit] = useState<{ item?: Announcement } | null>(null); const [rm, setRm] = useState<Announcement | null>(null);
  const list = all.filter((a) => !scopeCourseIds || (a.courseId && scopeCourseIds.includes(a.courseId))).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setEdit({})}><Plus className="size-4" />اطلاعیهٔ جدید</Button></div>
      <Card className="divide-y divide-line">{list.length === 0 ? <p className="p-5 text-sm text-ink-500">اطلاعیه‌ای ثبت نشده است.</p> : list.map((a) => (
        <div key={a.id} className="flex items-start gap-3 p-4 text-sm"><div className="flex-1"><p className="flex flex-wrap items-center gap-2 font-bold">{a.pinned && <Pin className="size-4 text-flame-500" aria-label="سنجاق‌شده" />}{a.title}<Badge tone="neutral">{a.courseId ? courses.find((c) => c.id === a.courseId)?.title ?? "دوره" : "همه"}</Badge></p><p className="mt-1 leading-7 text-ink-600">{a.body}</p><p className="mt-1 text-xs text-ink-500">{formatDate(a.at)}</p></div><Button size="sm" variant="ghost" aria-label="ویرایش" onClick={() => setEdit({ item: a })}><Pencil className="size-4" /></Button><Button size="sm" variant="ghost" aria-label="حذف" onClick={() => setRm(a)}><Trash2 className="size-4 text-danger-600" /></Button></div>))}</Card>
      {edit && <AnnouncementDialog key={edit.item?.id ?? "new"} open onClose={() => setEdit(null)} item={edit.item} authorId={user?.id ?? ""} courseIds={scopeCourseIds} />}
      <ConfirmDialog open={!!rm} onClose={() => setRm(null)} onConfirm={() => { if (rm) { del(rm.id); toast.success("اطلاعیه حذف شد."); } }} title="حذف اطلاعیه" danger confirmLabel="حذف">اطلاعیهٔ «{rm?.title}» حذف شود؟</ConfirmDialog>
    </div>
  );
}

export function CertificatesPanel({ scopeCourseIds, manage }: { scopeCourseIds?: string[]; manage?: boolean }) {
  const users = useApp((s) => s.users); const courses = useApp((s) => s.courses); const enrollments = useApp((s) => s.enrollments); const completed = useApp((s) => s.completed);
  const quizzes = useApp((s) => s.quizzes); const attempts = useApp((s) => s.attempts); const certs = useApp((s) => s.certificates); const issue = useApp((s) => s.issueCertificate); const revoke = useApp((s) => s.revokeCertificate);
  const rows = useMemo(() => enrollments.filter((e) => !scopeCourseIds || scopeCourseIds.includes(e.courseId)).map((e) => {
    const course = courses.find((c) => c.id === e.courseId); const user = users.find((u) => u.id === e.userId); if (!course || !user) return null;
    const quiz = quizzes.find((q) => q.id === course.certificateQuizId);
    const el = certificateEligibility(course, completed[`${e.userId}:${e.courseId}`] ?? [], quiz, attemptsFor(attempts, e.userId, quiz?.id ?? ""));
    const cert = certs.find((c) => c.userId === e.userId && c.courseId === e.courseId);
    return { id: e.id, user, course, el, cert };
  }).filter((x): x is NonNullable<typeof x> => !!x), [enrollments, courses, users, quizzes, attempts, completed, certs, scopeCourseIds]);
  return (
    <DataTable caption="وضعیت گواهی دانش‌آموزان" rows={rows} rowKey={(r) => r.id} searchText={(r) => `${r.user.name} ${r.course.title}`} pageSize={8}
      filters={[{ id: "st", label: "وضعیت", options: [{ value: "issued", label: "صادرشده" }, { value: "ready", label: "آمادهٔ صدور" }, { value: "no", label: "شرایط ناقص" }, { value: "revoked", label: "ابطال‌شده" }], test: (r, v) => v === "issued" ? !!r.cert && !r.cert.revoked : v === "revoked" ? !!r.cert?.revoked : v === "ready" ? !r.cert && r.el.eligible : !r.cert && !r.el.eligible }]}
      columns={[{ key: "u", header: "دانش‌آموز", sort: (r) => r.user.name, cell: (r) => <span className="font-medium">{r.user.name}</span> }, { key: "c", header: "دوره", cell: (r) => r.course.title, hideOnMobile: true },
        { key: "s", header: "وضعیت", cell: (r) => r.cert ? <Badge tone={r.cert.revoked ? "danger" : "success"}>{r.cert.revoked ? "ابطال‌شده" : "صادرشده"}</Badge> : r.el.eligible ? <Badge tone="sun">آمادهٔ صدور</Badge> : <span className="text-xs text-ink-500">{r.el.reasons[0]}</span> },
        { key: "a", header: "", cell: (r) => <span className="flex gap-1">{r.cert ? <Button size="sm" variant="outline" href={`/certificate/${r.cert.id}`}>مشاهده</Button> : null}{manage && !r.cert && r.el.eligible && <Button size="sm" onClick={() => { const x = issue(r.user.id, r.course.id); if (x.ok) toast.success("گواهی صادر شد."); else toast.error(x.reason ?? ""); }}><Award className="size-4" />صدور</Button>}{manage && r.cert && <Button size="sm" variant="ghost" onClick={() => { revoke(r.cert!.id, !r.cert!.revoked); toast.info(r.cert!.revoked ? "ابطال لغو شد." : "گواهی ابطال شد."); }}>{r.cert.revoked ? "رفع ابطال" : "ابطال"}</Button>}</span> }]} />
  );
}
