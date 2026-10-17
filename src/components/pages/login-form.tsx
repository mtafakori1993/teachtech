"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, ShieldCheck, UserCog, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
import { Field, Input } from "@/components/ui/form";
import { Logo } from "@/components/brand/logo";
import { canEnter, DASHBOARD_HOME, ROLE_LABEL } from "@/lib/nav";
import { useApp, useHydrated, useSessionUser } from "@/store/app";
import { DEMO_ADMIN_ID, DEMO_INSTRUCTOR_ID, DEMO_STUDENT_ID } from "@/data/seed";
import type { Role } from "@/data/types";

const DEMO_CODE = "teachtech";
const ACCOUNTS: { id: string; role: Role; Icon: typeof GraduationCap; hint: string }[] = [
  { id: DEMO_STUDENT_ID, role: "student", Icon: GraduationCap, hint: "دوره‌ها، پیشرفت، آزمون و گواهی" },
  { id: DEMO_INSTRUCTOR_ID, role: "instructor", Icon: Presentation, hint: "مدیریت دوره، آزمون و تکلیف‌ها" },
  { id: DEMO_ADMIN_ID, role: "admin", Icon: UserCog, hint: "سفارش‌ها، تخفیف‌ها و تنظیمات" },
];

const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : null);

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const users = useApp((s) => s.users);
  const login = useApp((s) => s.login);
  const hydrated = useHydrated();
  const current = useSessionUser();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<{ email?: string; code?: string; form?: string }>({});

  const enter = (id: string) => {
    login(id);
    const u = useApp.getState().users.find((x) => x.id === id)!;
    router.replace(next && canEnter(u.role, next) === "ok" ? next : DASHBOARD_HOME[u.role]);
  };
  useEffect(() => { if (hydrated && current) router.replace(next && canEnter(current.role, next) === "ok" ? next : DASHBOARD_HOME[current.role]); }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const e2: typeof err = {};
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) e2.email = "ایمیل معتبر وارد کنید.";
    if (code.length < 4) e2.code = "رمز نمایشی را وارد کنید (حداقل ۴ نویسه).";
    if (Object.keys(e2).length) return setErr(e2);
    const u = users.find((x) => x.email === em);
    if (!u || code !== DEMO_CODE) return setErr({ form: "حساب یا رمز نمایشی درست نیست. از حساب‌های نمونهٔ زیر استفاده کنید." });
    if (!u.active) return setErr({ form: "این حساب غیرفعال است." });
    enter(u.id);
  };

  return (
    <div className="container-x grid min-h-[70dvh] items-center gap-10 py-12 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <Logo className="mb-6" />
        <h1 className="text-3xl font-bold">ورود به حساب</h1>
        <p className="mt-2 text-ink-600">برای ادامه وارد شوید یا از حساب‌های نمونه استفاده کنید.</p>
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          {err.form && <Alert tone="danger">{err.form}</Alert>}
          <Field label="ایمیل" error={err.email}>{(p) => <Input {...p} type="email" dir="ltr" autoComplete="username" className="text-end" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@teachtech.example" />}</Field>
          <Field label="رمز نمایشی" error={err.code} hint="رمز واقعی دریافت نمی‌شود؛ رمز حساب‌های نمونه: teachtech">{(p) => <Input {...p} type="password" dir="ltr" autoComplete="off" className="text-end" value={code} onChange={(e) => setCode(e.target.value)} />}</Field>
          <Button type="submit" size="lg" className="w-full">ورود</Button>
        </form>
      </div>
      <div className="mx-auto w-full max-w-md rounded-xl border border-line bg-card/70 p-5">
        <h2 className="flex items-center gap-2 font-bold"><ShieldCheck className="size-5 text-brand-600" />ورود سریع با حساب نمونه</h2>
        <ul className="mt-4 space-y-2">
          {ACCOUNTS.map(({ id, role, Icon, hint }) => {
            const u = users.find((x) => x.id === id);
            return (
              <li key={id}><button onClick={() => enter(id)} className="flex min-h-16 w-full items-center gap-3 rounded-lg border border-line bg-white p-3 text-start shadow-soft transition hover:border-brand-400 hover:shadow-lift">
                <span className="grid size-11 shrink-0 place-items-center rounded-md bg-sun-100"><Icon className="size-5" /></span>
                <span><b className="block">{ROLE_LABEL[role]}: {u?.name}</b><span className="text-xs text-ink-600">{hint}</span></span>
              </button></li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs leading-6 text-ink-600">این ورود شبیه‌سازی‌شده است: هیچ رمز واقعی بررسی یا ذخیره نمی‌شود و جداسازی نقش‌ها مرز امنیتی نیست. وضعیت ورود فقط در این مرورگر می‌ماند.</p>
      </div>
    </div>
  );
}
