"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, LogIn } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { canEnter, DASHBOARD_HOME, ROLE_LABEL } from "@/lib/nav";
import { useApp, useHydrated, useSessionUser } from "@/store/app";

/** Frontend-only access rule for role areas. It improves UX; it is NOT a security boundary (see docs). */
export function RoleGate({ children }: { children: ReactNode }) {
  const path = usePathname();
  const user = useSessionUser();
  const hydrated = useHydrated();
  const switchRole = useApp((s) => s.switchRole);
  if (!hydrated) return <div className="container-x space-y-4 py-10" aria-busy><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>;
  const verdict = canEnter(user?.role, path);
  if (verdict === "ok") return <>{children}</>;
  if (verdict === "login") {
    return (
      <div className="container-x grid min-h-[50dvh] place-items-center py-16 text-center">
        <div className="max-w-md"><div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-card text-brand-600"><LogIn className="size-7" /></div>
          <h1 className="text-2xl font-bold">برای ادامه وارد شوید</h1><p className="mt-2 text-ink-600">این بخش مخصوص کاربران واردشده است.</p>
          <Button href={`/login?next=${encodeURIComponent(path)}`} className="mt-5">ورود به حساب</Button></div>
      </div>
    );
  }
  const need = path.startsWith("/admin") ? "admin" : path.startsWith("/instructor") ? "instructor" : "student";
  return (
    <div className="container-x grid min-h-[50dvh] place-items-center py-16 text-center">
      <div className="max-w-md"><div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-danger-100 text-danger-600"><ShieldAlert className="size-7" /></div>
        <h1 className="text-2xl font-bold">دسترسی به این بخش مجاز نیست</h1>
        <p className="mt-2 text-ink-600">این صفحه مخصوص نقش «{ROLE_LABEL[need]}» است و شما با نقش «{user ? ROLE_LABEL[user.role] : ""}» وارد شده‌اید.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {user && <Button href={DASHBOARD_HOME[user.role]}>بازگشت به داشبورد خودم</Button>}
          <Button variant="outline" onClick={() => switchRole(need)}>تغییر به نقش {ROLE_LABEL[need]} (نمایشی)</Button>
        </div>
        <p className="mt-4 text-xs text-ink-500">تفکیک نقش‌ها در این نسخه فقط در رابط کاربری اعمال می‌شود و مرز امنیتی نیست. <Link className="underline" href="/terms">بیشتر</Link></p>
      </div>
    </div>
  );
}
