"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { z } from "zod";
import { BookOpen, Eye, EyeOff, Pencil, Plus, Trash2, UserPlus, Users, Wallet, Ban, CheckCircle2 } from "lucide-react";
import { AnalyticsPanel, AnnouncementsManager, CertificatesPanel } from "./panels";
import { CourseFormDialog } from "./forms";
import { STATUS } from "@/components/pages/order-view";
import { OrderSummary } from "@/components/pages/order-summary";
import { Button } from "@/components/ui/button";
import { Alert, Badge, Card, PageTitle, Stat } from "@/components/ui/primitives";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { Checkbox, Field, Input, Select, Switch, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { totalRevenue } from "@/lib/analytics";
import { courseProgress, lessonCount } from "@/lib/progress";
import { GRADE_LABEL } from "@/lib/catalog";
import { formatDate, formatDateTime, formatNumber, formatToman, toEnDigits } from "@/lib/format";
import { uid, useApp } from "@/store/app";
import type { Course, Discount, Instructor, Order, OrderStatus, User } from "@/data/types";

export function AdminOverview() {
  const users = useApp((s) => s.users); const courses = useApp((s) => s.courses); const orders = useApp((s) => s.orders); const enrollments = useApp((s) => s.enrollments); const certs = useApp((s) => s.certificates);
  const recent = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  return (
    <div className="space-y-8"><PageTitle title="مدیریت آموزشگاه">نمای کلی پلتفرم؛ همهٔ آمار از داده‌های نمونهٔ این مرورگر است.</PageTitle>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="دوره‌ها" value={formatNumber(courses.length)} hint={`${formatNumber(courses.filter((c) => c.status === "published").length)} منتشرشده`} icon={<BookOpen className="size-5" />} />
        <Stat label="دانش‌آموزان" value={formatNumber(users.filter((u) => u.role === "student").length)} icon={<Users className="size-5" />} tone="sun" />
        <Stat label="ثبت‌نام‌ها" value={formatNumber(enrollments.length)} hint={`${formatNumber(certs.filter((c) => !c.revoked).length)} گواهی`} icon={<CheckCircle2 className="size-5" />} tone="success" />
        <Stat label="فروش (نمونه)" value={formatToman(totalRevenue(orders))} icon={<Wallet className="size-5" />} tone="flame" />
      </div>
      <section aria-labelledby="ro"><div className="mb-3 flex items-center justify-between"><h2 id="ro" className="text-xl font-bold">آخرین سفارش‌ها</h2><Link href="/admin/orders" className="text-sm text-brand-700 underline underline-offset-4">همه</Link></div>
        <Card className="divide-y divide-line">{recent.map((o) => <div key={o.id} className="flex flex-wrap items-center gap-3 p-3 text-sm"><b className="tabular" dir="ltr">{o.number}</b><span className="flex-1 truncate text-ink-600">{users.find((u) => u.id === o.userId)?.name} · {o.lines.map((l) => l.title).join("، ")}</span><span className="tabular">{formatToman(o.total)}</span><Badge tone={STATUS[o.status].tone}>{STATUS[o.status].label}</Badge></div>)}</Card></section>
    </div>
  );
}

export function AdminCourses() {
  const all = useApp((s) => s.courses); const courses = useMemo(() => [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [all]); const instructors = useApp((s) => s.instructors); const enrollments = useApp((s) => s.enrollments); const setStatus = useApp((s) => s.setCourseStatus); const del = useApp((s) => s.deleteCourse);
  const [form, setForm] = useState<{ course?: Course } | null>(null); const [rm, setRm] = useState<Course | null>(null);
  return (
    <div><PageTitle title="دوره‌ها" actions={<Button onClick={() => setForm({})}><Plus className="size-4" />دورهٔ جدید</Button>} />
      <DataTable caption="دوره‌ها" rows={courses} rowKey={(c) => c.id} searchText={(c) => c.title} pageSize={8}
        filters={[{ id: "s", label: "وضعیت", options: [{ value: "published", label: "منتشرشده" }, { value: "draft", label: "پیش‌نویس" }], test: (c, v) => c.status === v }, { id: "g", label: "پایه", options: Object.entries(GRADE_LABEL).map(([value, label]) => ({ value, label })), test: (c, v) => c.grade === v }]}
        columns={[{ key: "t", header: "دوره", sort: (c) => c.title, cell: (c) => <div><b>{c.title}</b><p className="text-xs text-ink-500">{instructors.find((i) => i.id === c.instructorId)?.name} · {formatNumber(lessonCount(c))} درس</p></div> }, { key: "p", header: "قیمت", sort: (c) => c.price, cell: (c) => <span className="tabular">{formatToman(c.price)}</span>, hideOnMobile: true }, { key: "e", header: "ثبت‌نام", cell: (c) => <span className="tabular">{formatNumber(enrollments.filter((e) => e.courseId === c.id).length)}</span>, hideOnMobile: true }, { key: "s", header: "وضعیت", cell: (c) => <Badge tone={c.status === "published" ? "success" : "warning"}>{c.status === "published" ? "منتشرشده" : "پیش‌نویس"}</Badge> },
          { key: "a", header: "", cell: (c) => <span className="flex"><Button size="sm" variant="ghost" aria-label={c.status === "published" ? "لغو انتشار" : "انتشار"} onClick={() => { setStatus(c.id, c.status === "published" ? "draft" : "published"); toast.success("وضعیت دوره تغییر کرد."); }}>{c.status === "published" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button><Button size="sm" variant="ghost" aria-label="ویرایش" onClick={() => setForm({ course: c })}><Pencil className="size-4" /></Button><Button size="sm" variant="ghost" aria-label="حذف" onClick={() => setRm(c)}><Trash2 className="size-4 text-danger-600" /></Button></span> }]} />
      {form && <CourseFormDialog key={form.course?.id ?? "n"} open onClose={() => setForm(null)} course={form.course} />}
      <ConfirmDialog open={!!rm} onClose={() => setRm(null)} onConfirm={() => { if (rm) { del(rm.id); toast.success("دوره حذف شد."); } }} title="حذف دوره" danger confirmLabel="حذف">دورهٔ «{rm?.title}» حذف شود؟ ثبت‌نام‌ها و سفارش‌های قبلی در سابقه می‌مانند.</ConfirmDialog>
    </div>
  );
}

export function AdminInstructors() {
  const list = useApp((s) => s.instructors); const courses = useApp((s) => s.courses); const upsert = useApp((s) => s.upsertInstructor); const upsertUser = useApp((s) => s.upsertUser);
  const [edit, setEdit] = useState<{ i?: Instructor } | null>(null); const [f, setF] = useState({ name: "", title: "مدرس ریاضی", bio: "", areas: "", email: "" }); const [errs, setErrs] = useState<Record<string, string>>({});
  const open = (i?: Instructor) => { setEdit({ i }); setErrs({}); setF({ name: i?.name ?? "", title: i?.title ?? "مدرس ریاضی", bio: i?.bio ?? "", areas: i?.areas.join("\n") ?? "", email: "" }); };
  const save = () => {
    const e: Record<string, string> = {}; if (f.name.trim().length < 3) e.name = "نام را وارد کنید."; if (f.bio.trim().length < 20) e.bio = "معرفی حداقل ۲۰ نویسه باشد."; if (!edit?.i && !z.email().safeParse(f.email.trim()).success) e.email = "ایمیل معتبر وارد کنید.";
    if (Object.keys(e).length) return setErrs(e);
    const id = edit?.i?.id ?? uid("ins"); let userId = edit?.i?.userId;
    if (!userId) { userId = uid("u"); upsertUser({ id: userId, name: f.name.trim(), email: f.email.trim().toLowerCase(), role: "instructor", joinedAt: new Date().toISOString(), active: true }); }
    upsert({ id, userId, name: f.name.trim(), title: f.title.trim(), bio: f.bio.trim(), areas: f.areas.split("\n").map((x) => x.trim()).filter(Boolean), active: edit?.i?.active ?? true });
    toast.success("مدرس ذخیره شد."); setEdit(null);
  };
  return (
    <div><PageTitle title="مدرسان" actions={<Button onClick={() => open()}><UserPlus className="size-4" />مدرس جدید</Button>} />
      <DataTable caption="مدرسان" rows={list} rowKey={(i) => i.id} searchText={(i) => i.name} pageSize={8} columns={[{ key: "n", header: "مدرس", cell: (i) => <div><b>{i.name}</b><p className="text-xs text-ink-500">{i.title}</p></div> }, { key: "c", header: "دوره‌ها", cell: (i) => formatNumber(courses.filter((c) => c.instructorId === i.id).length) }, { key: "s", header: "وضعیت", cell: (i) => <Badge tone={i.active ? "success" : "neutral"}>{i.active ? "فعال" : "غیرفعال"}</Badge> }, { key: "a", header: "", cell: (i) => <span className="flex"><Button size="sm" variant="ghost" aria-label="ویرایش" onClick={() => open(i)}><Pencil className="size-4" /></Button><Button size="sm" variant="outline" onClick={() => { upsert({ ...i, active: !i.active }); toast.info("وضعیت تغییر کرد."); }}>{i.active ? "غیرفعال‌سازی" : "فعال‌سازی"}</Button></span> }]} />
      {edit && <Dialog open onClose={() => setEdit(null)} title={edit.i ? "ویرایش مدرس" : "مدرس جدید"} footer={<><Button variant="ghost" onClick={() => setEdit(null)}>انصراف</Button><Button onClick={save}>ذخیره</Button></>}>
        <div className="space-y-4"><Field label="نام" error={errs.name}>{(p) => <Input {...p} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field><Field label="عنوان">{(p) => <Input {...p} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>{!edit.i && <Field label="ایمیل ورود نمایشی" error={errs.email}>{(p) => <Input {...p} dir="ltr" className="text-end" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />}</Field>}<Field label="معرفی" error={errs.bio} hint="فقط اطلاعات تأییدشده بنویسید؛ مدرک یا سابقهٔ ادعایی ثبت نکنید.">{(p) => <Textarea {...p} rows={4} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} />}</Field><Field label="حوزه‌های تدریس (هر خط یکی)">{(p) => <Textarea {...p} rows={3} value={f.areas} onChange={(e) => setF({ ...f, areas: e.target.value })} />}</Field></div></Dialog>}
    </div>
  );
}

export function AdminStudents() {
  const users = useApp((s) => s.users).filter((u) => u.role === "student"); const enrollments = useApp((s) => s.enrollments); const courses = useApp((s) => s.courses); const completed = useApp((s) => s.completed); const orders = useApp((s) => s.orders); const setActive = useApp((s) => s.setUserActive); const upsertUser = useApp((s) => s.upsertUser);
  const [sel, setSel] = useState<User | null>(null); const [add, setAdd] = useState(false); const [f, setF] = useState({ name: "", email: "", city: "" }); const [errs, setErrs] = useState<Record<string, string>>({}); const all = useApp((s) => s.users);
  return (
    <div><PageTitle title="دانش‌آموزان" actions={<Button onClick={() => { setAdd(true); setErrs({}); }}><UserPlus className="size-4" />دانش‌آموز جدید</Button>}>فهرست دانش‌آموزان (داده‌های نمونه).</PageTitle>
      <DataTable caption="دانش‌آموزان" rows={users} rowKey={(u) => u.id} searchText={(u) => `${u.name} ${u.email} ${u.city}`} pageSize={8}
        filters={[{ id: "a", label: "وضعیت", options: [{ value: "1", label: "فعال" }, { value: "0", label: "غیرفعال" }], test: (u, v) => (v === "1") === u.active }, { id: "g", label: "پایه", options: Object.entries(GRADE_LABEL).filter(([k]) => k !== "all").map(([value, label]) => ({ value, label })), test: (u, v) => u.grade === v }]}
        columns={[{ key: "n", header: "نام", sort: (u) => u.name, cell: (u) => <button className="text-start font-bold hover:text-brand-700" onClick={() => setSel(u)}>{u.name}</button> }, { key: "c", header: "شهر", cell: (u) => u.city ?? "—", hideOnMobile: true }, { key: "g", header: "پایه", cell: (u) => (u.grade ? GRADE_LABEL[u.grade] : "—"), hideOnMobile: true }, { key: "e", header: "دوره‌ها", cell: (u) => formatNumber(enrollments.filter((e) => e.userId === u.id).length) }, { key: "s", header: "وضعیت", cell: (u) => <Badge tone={u.active ? "success" : "neutral"}>{u.active ? "فعال" : "غیرفعال"}</Badge> }, { key: "a", header: "", cell: (u) => <Button size="sm" variant="outline" onClick={() => { setActive(u.id, !u.active); toast.info(u.active ? "حساب غیرفعال شد." : "حساب فعال شد."); }}>{u.active ? <><Ban className="size-4" />غیرفعال</> : "فعال‌سازی"}</Button> }]} />
      {sel && <Dialog open onClose={() => setSel(null)} size="lg" title={sel.name} description={sel.email}>
        <div className="space-y-4 text-sm"><dl className="grid grid-cols-2 gap-3"><div><dt className="text-ink-500">شهر</dt><dd>{sel.city ?? "—"}</dd></div><div><dt className="text-ink-500">عضویت</dt><dd>{formatDate(sel.joinedAt)}</dd></div><div><dt className="text-ink-500">موبایل</dt><dd dir="ltr" className="text-end">{sel.phone ?? "—"}</dd></div><div><dt className="text-ink-500">سفارش‌ها</dt><dd>{formatNumber(orders.filter((o) => o.userId === sel.id).length)}</dd></div></dl>
          <h3 className="font-bold">دوره‌ها و پیشرفت</h3><ul className="divide-y divide-line rounded-md border border-line">{enrollments.filter((e) => e.userId === sel.id).map((e) => { const c = courses.find((x) => x.id === e.courseId); if (!c) return null; const p = courseProgress(c, completed[`${sel.id}:${c.id}`] ?? []); return <li key={e.id} className="flex justify-between gap-3 p-2.5"><span>{c.title}</span><span className="tabular text-ink-600">{formatNumber(p.percent)}٪</span></li>; })}</ul></div></Dialog>}
      {add && <Dialog open onClose={() => setAdd(false)} title="دانش‌آموز جدید" size="sm" footer={<><Button variant="ghost" onClick={() => setAdd(false)}>انصراف</Button><Button onClick={() => { const e: Record<string, string> = {}; if (f.name.trim().length < 3) e.name = "نام را وارد کنید."; if (!z.email().safeParse(f.email.trim()).success) e.email = "ایمیل معتبر وارد کنید."; else if (all.some((u) => u.email === f.email.trim().toLowerCase())) e.email = "این ایمیل قبلاً ثبت شده است."; if (Object.keys(e).length) return setErrs(e); upsertUser({ id: uid("u"), name: f.name.trim(), email: f.email.trim().toLowerCase(), role: "student", city: f.city.trim() || undefined, joinedAt: new Date().toISOString(), active: true }); toast.success("دانش‌آموز افزوده شد."); setAdd(false); setF({ name: "", email: "", city: "" }); }}>افزودن</Button></>}>
        <div className="space-y-4"><Field label="نام" error={errs.name}>{(p) => <Input {...p} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field><Field label="ایمیل" error={errs.email}>{(p) => <Input {...p} dir="ltr" className="text-end" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />}</Field><Field label="شهر">{(p) => <Input {...p} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />}</Field></div></Dialog>}
    </div>
  );
}

export function AdminEnrollments() {
  const enrollments = useApp((s) => s.enrollments); const users = useApp((s) => s.users); const courses = useApp((s) => s.courses); const grant = useApp((s) => s.grantEnrollment); const revoke = useApp((s) => s.revokeEnrollment);
  const [open, setOpen] = useState(false); const [u, setU] = useState(""); const [c, setC] = useState(""); const [rm, setRm] = useState<string | null>(null);
  const rows = enrollments.map((e) => ({ e, user: users.find((x) => x.id === e.userId), course: courses.find((x) => x.id === e.courseId) })).filter((r) => r.user && r.course);
  return (
    <div><PageTitle title="ثبت‌نام‌ها" actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" />ثبت‌نام دستی</Button>}>ثبت‌نام‌های ناشی از سفارش یا واگذاری مدیر.</PageTitle>
      <DataTable caption="ثبت‌نام‌ها" rows={rows} rowKey={(r) => r.e.id} searchText={(r) => `${r.user!.name} ${r.course!.title}`} pageSize={10}
        filters={[{ id: "s", label: "منبع", options: [{ value: "order", label: "سفارش" }, { value: "grant", label: "واگذاری" }], test: (r, v) => r.e.source === v }]}
        columns={[{ key: "u", header: "دانش‌آموز", sort: (r) => r.user!.name, cell: (r) => <b>{r.user!.name}</b> }, { key: "c", header: "دوره", cell: (r) => r.course!.title, hideOnMobile: true }, { key: "d", header: "تاریخ", sort: (r) => r.e.enrolledAt, cell: (r) => formatDate(r.e.enrolledAt), hideOnMobile: true }, { key: "s", header: "منبع", cell: (r) => <Badge tone={r.e.source === "order" ? "brand" : "sun"}>{r.e.source === "order" ? "سفارش" : "واگذاری"}</Badge> }, { key: "a", header: "", cell: (r) => <Button size="sm" variant="ghost" aria-label="لغو ثبت‌نام" onClick={() => setRm(r.e.id)}><Trash2 className="size-4 text-danger-600" /></Button> }]} />
      {open && <Dialog open onClose={() => setOpen(false)} size="sm" title="ثبت‌نام دستی" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>انصراف</Button><Button onClick={() => { if (!u || !c) return toast.error("دانش‌آموز و دوره را انتخاب کنید."); const r = grant(u, c); if (r.ok) { toast.success("ثبت‌نام انجام شد."); setOpen(false); } else toast.error(r.reason ?? ""); }}>ثبت‌نام</Button></>}>
        <div className="space-y-4"><Field label="دانش‌آموز">{(p) => <Select {...p} value={u} onChange={(e) => setU(e.target.value)}><option value="">انتخاب کنید</option>{users.filter((x) => x.role === "student" && x.active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>}</Field><Field label="دوره">{(p) => <Select {...p} value={c} onChange={(e) => setC(e.target.value)}><option value="">انتخاب کنید</option>{courses.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</Select>}</Field></div></Dialog>}
      <ConfirmDialog open={!!rm} onClose={() => setRm(null)} onConfirm={() => { if (rm) { revoke(rm); toast.success("ثبت‌نام لغو شد."); } }} title="لغو ثبت‌نام" danger confirmLabel="لغو ثبت‌نام">دسترسی دانش‌آموز به این دوره از بین می‌رود (پیشرفت او حفظ می‌شود).</ConfirmDialog>
    </div>
  );
}

export function AdminOrders() {
  const orders = useApp((s) => s.orders); const users = useApp((s) => s.users); const setStatus = useApp((s) => s.setOrderStatus);
  const [sel, setSel] = useState<Order | null>(null); const cur = sel ? orders.find((o) => o.id === sel.id) ?? null : null;
  return (
    <div><PageTitle title="سفارش‌ها">همهٔ سفارش‌ها شبیه‌سازی‌شده‌اند؛ تغییر وضعیت فقط در داده‌های محلی اعمال می‌شود.</PageTitle>
      <DataTable caption="سفارش‌ها" rows={orders} rowKey={(o) => o.id} searchText={(o) => `${o.number} ${users.find((u) => u.id === o.userId)?.name} ${o.discountCode ?? ""}`} pageSize={10}
        filters={[{ id: "s", label: "وضعیت", options: Object.entries(STATUS).map(([value, v]) => ({ value, label: v.label })), test: (o, v) => o.status === v }]}
        columns={[{ key: "n", header: "شماره", sort: (o) => o.number, cell: (o) => <button className="font-bold tabular hover:text-brand-700" dir="ltr" onClick={() => setSel(o)}>{o.number}</button> }, { key: "u", header: "دانش‌آموز", cell: (o) => users.find((u) => u.id === o.userId)?.name, hideOnMobile: true }, { key: "d", header: "تاریخ", sort: (o) => o.createdAt, cell: (o) => formatDate(o.createdAt), hideOnMobile: true }, { key: "t", header: "مبلغ", sort: (o) => o.total, cell: (o) => <span className="tabular">{formatToman(o.total)}</span> }, { key: "s", header: "وضعیت", cell: (o) => <Badge tone={STATUS[o.status].tone}>{STATUS[o.status].label}</Badge> }]} />
      {cur && <Dialog open onClose={() => setSel(null)} size="lg" title={`سفارش ${cur.number}`} description={formatDateTime(cur.createdAt)} footer={<Button variant="ghost" onClick={() => setSel(null)}>بستن</Button>}>
        <div className="space-y-4 text-sm"><p>{users.find((u) => u.id === cur.userId)?.name} · <span dir="ltr">{cur.billing.email}</span></p><ul className="divide-y divide-line rounded-md border border-line">{cur.lines.map((l) => <li key={l.courseId} className="flex justify-between gap-3 p-2.5"><span>{l.title}</span><span className="tabular">{formatToman(l.unitPrice)}</span></li>)}</ul><OrderSummary t={{ listTotal: cur.listTotal, courseSavings: cur.listTotal - cur.subtotal, subtotal: cur.subtotal, discountAmount: cur.discountAmount, total: cur.total }} code={cur.discountCode} />
          <Field label="وضعیت سفارش">{(p) => <Select {...p} value={cur.status} onChange={(e) => { setStatus(cur.id, e.target.value as OrderStatus); toast.success("وضعیت سفارش تغییر کرد."); }}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select>}</Field><Alert tone="info">تغییر وضعیت سفارش، ثبت‌نام‌ها را خودکار تغییر نمی‌دهد؛ برای لغو دسترسی از بخش «ثبت‌نام‌ها» استفاده کنید.</Alert></div></Dialog>}
    </div>
  );
}

export function AdminDiscounts() {
  const list = useApp((s) => s.discounts); const courses = useApp((s) => s.courses); const upsert = useApp((s) => s.upsertDiscount); const del = useApp((s) => s.deleteDiscount);
  const [edit, setEdit] = useState<{ d?: Discount } | null>(null); const [rm, setRm] = useState<Discount | null>(null);
  const [f, setF] = useState({ code: "", kind: "percent", value: "10", maxOff: "", minSubtotal: "", expiresAt: "", active: true, description: "", courseIds: [] as string[] }); const [errs, setErrs] = useState<Record<string, string>>({});
  const open = (d?: Discount) => { setEdit({ d }); setErrs({}); setF({ code: d?.code ?? "", kind: d?.kind ?? "percent", value: String(d?.value ?? 10), maxOff: d?.maxOff ? String(d.maxOff) : "", minSubtotal: d?.minSubtotal ? String(d.minSubtotal) : "", expiresAt: d?.expiresAt?.slice(0, 10) ?? "", active: d?.active ?? true, description: d?.description ?? "", courseIds: d?.courseIds ?? [] }); };
  const n = (s: string) => Number(toEnDigits(s).replace(/[,٬\s]/g, ""));
  const save = () => {
    const e: Record<string, string> = {}; const code = toEnDigits(f.code).trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) e.code = "کد ۳ تا ۲۰ نویسهٔ لاتین/عدد (بدون فاصله) باشد.";
    else if (list.some((d) => d.code === code && d.id !== edit?.d?.id)) e.code = "این کد قبلاً تعریف شده است.";
    const v = n(f.value); if (!(v > 0) || (f.kind === "percent" && v > 100)) e.value = f.kind === "percent" ? "درصد بین ۱ تا ۱۰۰" : "مبلغ مثبت (تومان)";
    if (Object.keys(e).length) return setErrs(e);
    upsert({ id: edit?.d?.id ?? uid("d"), code, kind: f.kind as Discount["kind"], value: v, maxOff: f.maxOff ? n(f.maxOff) : undefined, minSubtotal: f.minSubtotal ? n(f.minSubtotal) : undefined, courseIds: f.courseIds.length ? f.courseIds : undefined, expiresAt: f.expiresAt ? `${f.expiresAt}T23:59:59+03:30` : undefined, active: f.active, usedCount: edit?.d?.usedCount ?? 0, description: f.description.trim() || (f.kind === "percent" ? `${v}٪ تخفیف` : `${v} تومان تخفیف`) });
    toast.success("کد تخفیف ذخیره شد."); setEdit(null);
  };
  const expired = (d: Discount) => !!d.expiresAt && new Date(d.expiresAt) < new Date();
  return (
    <div><PageTitle title="کدهای تخفیف" actions={<Button onClick={() => open()}><Plus className="size-4" />کد جدید</Button>}>درصدی با سقف مبلغ، یا مبلغ ثابت؛ با حداقل سفارش و محدودیت دوره.</PageTitle>
      <DataTable caption="کدهای تخفیف" rows={list} rowKey={(d) => d.id} searchText={(d) => `${d.code} ${d.description}`} pageSize={8}
        columns={[{ key: "c", header: "کد", sort: (d) => d.code, cell: (d) => <span className="font-bold" dir="ltr">{d.code}</span> }, { key: "v", header: "مقدار", cell: (d) => d.kind === "percent" ? `${formatNumber(d.value)}٪${d.maxOff ? ` (تا ${formatToman(d.maxOff)})` : ""}` : formatToman(d.value), hideOnMobile: true }, { key: "u", header: "استفاده", sort: (d) => d.usedCount, cell: (d) => formatNumber(d.usedCount), hideOnMobile: true }, { key: "s", header: "وضعیت", cell: (d) => expired(d) ? <Badge tone="danger">منقضی</Badge> : <Badge tone={d.active ? "success" : "neutral"}>{d.active ? "فعال" : "غیرفعال"}</Badge> }, { key: "a", header: "", cell: (d) => <span className="flex"><Button size="sm" variant="ghost" aria-label="ویرایش" onClick={() => open(d)}><Pencil className="size-4" /></Button><Button size="sm" variant="ghost" aria-label="حذف" onClick={() => setRm(d)}><Trash2 className="size-4 text-danger-600" /></Button></span> }]} />
      {edit && <Dialog open onClose={() => setEdit(null)} size="lg" title={edit.d ? "ویرایش کد تخفیف" : "کد تخفیف جدید"} footer={<><Button variant="ghost" onClick={() => setEdit(null)}>انصراف</Button><Button onClick={save}>ذخیره</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="کد" error={errs.code}>{(p) => <Input {...p} dir="ltr" className="text-end uppercase" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />}</Field><Field label="نوع">{(p) => <Select {...p} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="percent">درصدی</option><option value="fixed">مبلغ ثابت (تومان)</option></Select>}</Field><Field label={f.kind === "percent" ? "درصد" : "مبلغ (تومان)"} error={errs.value}>{(p) => <Input {...p} inputMode="numeric" dir="ltr" className="text-end" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />}</Field>{f.kind === "percent" && <Field label="سقف تخفیف (تومان، اختیاری)">{(p) => <Input {...p} inputMode="numeric" dir="ltr" className="text-end" value={f.maxOff} onChange={(e) => setF({ ...f, maxOff: e.target.value })} />}</Field>}<Field label="حداقل مبلغ سفارش (اختیاری)">{(p) => <Input {...p} inputMode="numeric" dir="ltr" className="text-end" value={f.minSubtotal} onChange={(e) => setF({ ...f, minSubtotal: e.target.value })} />}</Field><Field label="تاریخ انقضا (میلادی، اختیاری)">{(p) => <Input {...p} type="date" dir="ltr" className="text-end" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} />}</Field><Field label="توضیح" className="sm:col-span-2">{(p) => <Input {...p} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}</Field>
          <fieldset className="sm:col-span-2"><legend className="mb-1 text-sm font-medium">محدود به دوره‌ها (خالی = همه)</legend><ul className="grid max-h-40 gap-1 overflow-y-auto rounded-md border border-line p-2 sm:grid-cols-2">{courses.map((c) => <li key={c.id}><Checkbox label={c.title} checked={f.courseIds.includes(c.id)} onChange={(e) => setF({ ...f, courseIds: e.target.checked ? [...f.courseIds, c.id] : f.courseIds.filter((x) => x !== c.id) })} /></li>)}</ul></fieldset><Checkbox label="فعال" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /></div></Dialog>}
      <ConfirmDialog open={!!rm} onClose={() => setRm(null)} onConfirm={() => { if (rm) { del(rm.id); toast.success("کد حذف شد."); } }} title="حذف کد تخفیف" danger confirmLabel="حذف">کد «{rm?.code}» حذف شود؟</ConfirmDialog>
    </div>
  );
}

export function AdminCertificates() { return <div><PageTitle title="گواهی‌ها">صدور دستی برای دانش‌آموزان واجد شرایط و ابطال گواهی.</PageTitle><CertificatesPanel manage /></div>; }
export function AdminAnnouncements() { return <div><PageTitle title="اطلاعیه‌ها" /><AnnouncementsManager /></div>; }
export function AdminAnalytics() { return <div><PageTitle title="تحلیل" /><AnalyticsPanel /></div>; }

export function AdminHomepage() {
  const hp = useApp((s) => s.homepage); const set = useApp((s) => s.setHomepage); const courses = useApp((s) => s.courses).filter((c) => c.status === "published");
  const [f, setF] = useState(hp); const [errs, setErrs] = useState<Record<string, string>>({});
  const feat = useMemo(() => new Set(f.featuredCourseIds), [f.featuredCourseIds]);
  return (
    <div className="max-w-3xl"><PageTitle title="محتوای صفحهٔ اصلی">تغییرات بلافاصله در صفحهٔ اصلی اعمال می‌شود. <Link href="/" className="text-brand-700 underline">مشاهده</Link></PageTitle>
      <div className="space-y-4"><Field label="تیتر اصلی" error={errs.heroTitle}>{(p) => <Input {...p} value={f.heroTitle} onChange={(e) => setF({ ...f, heroTitle: e.target.value })} />}</Field><Field label="توضیح زیر تیتر" error={errs.heroSubtitle}>{(p) => <Textarea {...p} rows={3} value={f.heroSubtitle} onChange={(e) => setF({ ...f, heroSubtitle: e.target.value })} />}</Field><Field label="متن نوار اطلاعیه">{(p) => <Input {...p} value={f.announcement} onChange={(e) => setF({ ...f, announcement: e.target.value })} />}</Field><Switch checked={f.showAnnouncement} onChange={(v) => setF({ ...f, showAnnouncement: v })} label="نمایش نوار اطلاعیه" />
        <fieldset><legend className="mb-2 text-sm font-medium">دوره‌های منتخب (حداکثر ۴)</legend><ul className="grid gap-1 sm:grid-cols-2">{courses.map((c) => <li key={c.id}><Checkbox label={c.title} checked={feat.has(c.id)} disabled={!feat.has(c.id) && feat.size >= 4} onChange={(e) => setF({ ...f, featuredCourseIds: e.target.checked ? [...f.featuredCourseIds, c.id] : f.featuredCourseIds.filter((x) => x !== c.id) })} /></li>)}</ul></fieldset>
        <Button onClick={() => { const e: Record<string, string> = {}; if (f.heroTitle.trim().length < 5) e.heroTitle = "تیتر حداقل ۵ نویسه باشد."; if (f.heroSubtitle.trim().length < 15) e.heroSubtitle = "توضیح حداقل ۱۵ نویسه باشد."; setErrs(e); if (Object.keys(e).length) return; if (f.featuredCourseIds.length === 0) return toast.error("حداقل یک دورهٔ منتخب انتخاب کنید."); set({ ...f, heroTitle: f.heroTitle.trim(), heroSubtitle: f.heroSubtitle.trim() }); toast.success("صفحهٔ اصلی به‌روز شد."); }}>ذخیرهٔ تغییرات</Button></div>
    </div>
  );
}

export function AdminSettings() {
  const st = useApp((s) => s.settings); const set = useApp((s) => s.setSettings); const reset = useApp((s) => s.resetAll);
  const [f, setF] = useState({ ...st, pass: String(st.certificatePassPercent) }); const [errs, setErrs] = useState<Record<string, string>>({}); const [rs, setRs] = useState(false);
  return (
    <div className="max-w-2xl space-y-8"><PageTitle title="تنظیمات پلتفرم" />
      <div className="space-y-4"><Field label="نام آموزشگاه (روی گواهی‌ها)" error={errs.academyName}>{(p) => <Input {...p} value={f.academyName} onChange={(e) => setF({ ...f, academyName: e.target.value })} />}</Field><div className="grid gap-4 sm:grid-cols-2"><Field label="ایمیل پشتیبانی" error={errs.supportEmail}>{(p) => <Input {...p} dir="ltr" className="text-end" value={f.supportEmail} onChange={(e) => setF({ ...f, supportEmail: e.target.value })} />}</Field><Field label="تلفن پشتیبانی">{(p) => <Input {...p} value={f.supportPhone} onChange={(e) => setF({ ...f, supportPhone: e.target.value })} />}</Field></div><Field label="پیش‌فرض حداقل نمرهٔ گواهی (٪)" error={errs.pass}>{(p) => <Input {...p} inputMode="numeric" dir="ltr" className="max-w-32 text-end" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} />}</Field>
        <Switch checked={f.allowRetakeAfterPass} onChange={(v) => setF({ ...f, allowRetakeAfterPass: v })} label="اجازهٔ تلاش مجدد پس از قبولی" hint="برای آزمون‌های غیرتمرینی" /><Switch checked={f.maintenance} onChange={(v) => setF({ ...f, maintenance: v })} label="حالت تعمیر (فقط ذخیره می‌شود)" hint="در این نسخه اثر نمایشی ندارد" />
        <Button onClick={() => { const e: Record<string, string> = {}; if (f.academyName.trim().length < 3) e.academyName = "نام آموزشگاه را وارد کنید."; if (!z.email().safeParse(f.supportEmail.trim()).success) e.supportEmail = "ایمیل معتبر وارد کنید."; const p = Number(toEnDigits(f.pass)); if (!(p >= 1 && p <= 100)) e.pass = "بین ۱ تا ۱۰۰"; setErrs(e); if (Object.keys(e).length) return; set({ academyName: f.academyName.trim(), supportEmail: f.supportEmail.trim(), supportPhone: f.supportPhone, certificatePassPercent: p, allowRetakeAfterPass: f.allowRetakeAfterPass, maintenance: f.maintenance }); toast.success("تنظیمات ذخیره شد."); }}>ذخیرهٔ تنظیمات</Button></div>
      <Card className="space-y-3 p-5"><h2 className="font-bold">محدودیت‌های نسخهٔ فعلی</h2><ul className="list-disc space-y-1 ps-5 text-sm leading-7 text-ink-700"><li>همهٔ داده‌ها فقط در این مرورگر نگهداری می‌شود و بین کاربران یا دستگاه‌ها همگام نمی‌شود.</li><li>نقش‌ها (دانش‌آموز، مدرس، مدیر) فقط در رابط کاربری اعمال می‌شوند و مرز امنیتی نیستند.</li><li>پرداخت، ورود و استعلام گواهی شبیه‌سازی‌شده‌اند.</li></ul>
        <Button variant="danger" onClick={() => setRs(true)}>بازنشانی همهٔ داده‌ها به حالت اولیه</Button></Card>
      <ConfirmDialog open={rs} onClose={() => setRs(false)} onConfirm={() => { reset(); toast.success("داده‌ها بازنشانی شد."); }} title="بازنشانی همهٔ داده‌ها" danger confirmLabel="بازنشانی">همهٔ تغییرات محلی پاک و داده‌های اولیه بازیابی می‌شود. از حساب خارج می‌شوید.</ConfirmDialog>
    </div>
  );
}
