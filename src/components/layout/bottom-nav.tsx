"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, ShoppingCart, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { DASHBOARD_HOME } from "@/lib/nav";
import { formatNumber } from "@/lib/format";
import { useApp, useSessionUser } from "@/store/app";

const HIDE = [/^\/learn\//, /^\/quiz\//, /^\/certificate\//, /^\/login/];

/** Phone-only bottom navigation (thumb reach). */
export function BottomNav() {
  const path = usePathname();
  const user = useSessionUser();
  const n = useApp((s) => s.cart.length);
  if (HIDE.some((r) => r.test(path))) return null;
  const items = [
    { href: "/", label: "خانه", Icon: Home, active: path === "/" },
    { href: "/courses", label: "دوره‌ها", Icon: BookOpen, active: path.startsWith("/courses") },
    { href: "/cart", label: "سبد", Icon: ShoppingCart, active: path === "/cart" || path === "/checkout", badge: n },
    { href: user ? DASHBOARD_HOME[user.role] : "/login", label: user ? "حساب من" : "ورود", Icon: UserRound, active: /^\/(dashboard|instructor|admin|login)/.test(path) },
  ];
  return (
    <nav aria-label="ناوبری پایین" className="safe-b fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 pt-1 backdrop-blur lg:hidden print:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map(({ href, label, Icon, active, badge }) => (
          <li key={href}>
            <Link href={href} aria-current={active ? "page" : undefined} className={cn("relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-md text-[0.72rem] font-medium", active ? "text-brand-700" : "text-ink-600")}>
              <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-card")}><Icon className="size-5" /></span>
              {label}
              {!!badge && <span className="absolute end-[28%] top-0.5 grid min-w-4 place-items-center rounded-full bg-flame-400 px-1 text-[0.65rem] font-bold leading-4 text-ink">{formatNumber(badge)}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
