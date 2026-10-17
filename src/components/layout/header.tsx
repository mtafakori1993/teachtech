"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronDown, LogIn, LogOut, Menu, Search, ShoppingCart, UserRound, Megaphone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { DASHBOARD_HOME, ROLE_LABEL } from "@/lib/nav";
import { formatNumber } from "@/lib/format";
import { useApp, useSessionUser } from "@/store/app";
import type { Role } from "@/data/types";

export const PUBLIC_NAV = [
  { href: "/courses", label: "دوره‌ها" },
  { href: "/instructors/amir-kavian", label: "مدرس" },
  { href: "/resources", label: "منابع آموزشی" },
  { href: "/about", label: "درباره" },
  { href: "/contact", label: "تماس" },
];

export function AnnouncementBar() {
  const hp = useApp((s) => s.homepage);
  if (!hp.showAnnouncement || !hp.announcement) return null;
  return (
    <div className="bg-brand-800 text-center text-sm text-white">
      <p className="container-x flex items-center justify-center gap-2 py-1.5"><Megaphone className="size-4 shrink-0 text-sun-400" aria-hidden /><span>{hp.announcement}</span></p>
    </div>
  );
}

function CartLink() {
  const n = useApp((s) => s.cart.length);
  return (
    <Link href="/cart" aria-label={`سبد خرید${n ? `، ${formatNumber(n)} مورد` : ""}`} className="relative grid size-11 place-items-center rounded-md text-ink-700 hover:bg-card">
      <ShoppingCart className="size-5" />
      {n > 0 && <span className="absolute end-1 top-1 grid min-w-5 place-items-center rounded-full bg-flame-400 px-1 text-[0.7rem] font-bold leading-5 text-ink">{formatNumber(n)}</span>}
    </Link>
  );
}

export function AccountMenu() {
  const user = useSessionUser();
  const logout = useApp((s) => s.logout);
  const switchRole = useApp((s) => s.switchRole);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  if (!user) return <Button href="/login" size="sm" variant="primary" className="max-sm:min-h-11 max-sm:min-w-11 max-sm:px-0"><LogIn className="size-4" /><span className="max-sm:sr-only">ورود</span></Button>;
  const go = (role: Role) => { switchRole(role); setOpen(false); router.push(DASHBOARD_HOME[role]); };
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" className="flex min-h-11 items-center gap-2 rounded-md px-1 hover:bg-card sm:px-2">
        <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white" aria-hidden>{user.name.trim()[0]}</span>
        <span className="sr-only lg:hidden">حساب کاربری</span><span className="hidden max-w-28 truncate text-sm font-medium lg:block">{user.name}</span>
        <ChevronDown className="hidden size-4 text-ink-500 sm:block" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute end-0 top-full z-50 mt-1 w-64 animate-rise rounded-lg border border-line bg-white p-2 shadow-lift">
          <div className="px-3 py-2">
            <p className="font-bold">{user.name}</p>
            <p className="text-xs text-ink-500">{ROLE_LABEL[user.role]} · ورود نمایشی</p>
          </div>
          <Link role="menuitem" href={DASHBOARD_HOME[user.role]} onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm hover:bg-card"><UserRound className="size-4" />داشبورد من</Link>
          <div className="my-1 border-t border-line" />
          <p className="px-3 pt-1 text-xs font-bold text-ink-500">تغییر نقش (نمایشی)</p>
          {(["student", "instructor", "admin"] as Role[]).map((r) => (
            <button key={r} role="menuitemradio" aria-checked={user.role === r} onClick={() => go(r)} className={cn("flex min-h-10 w-full items-center justify-between rounded-md px-3 text-sm hover:bg-card", user.role === r && "font-bold text-brand-700")}>
              {ROLE_LABEL[r]}{user.role === r && <span aria-hidden>●</span>}
            </button>
          ))}
          <div className="my-1 border-t border-line" />
          <button role="menuitem" onClick={() => { logout(); setOpen(false); router.push("/"); }} className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-sm text-danger-600 hover:bg-danger-100"><LogOut className="size-4" />خروج</button>
        </div>
      )}
    </div>
  );
}

function SearchBox({ className, onDone, autoFocus }: { className?: string; onDone?: () => void; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => { e.preventDefault(); const t = q.trim(); if (t) { router.push(`/search?q=${encodeURIComponent(t)}`); onDone?.(); } };
  return (
    <form onSubmit={submit} role="search" className={cn("relative", className)}>
      <label htmlFor="site-search" className="sr-only">جستجوی دوره‌ها</label>
      <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
      <input id="site-search" autoFocus={autoFocus} value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی دوره، مبحث یا مقاله…"
        className="h-11 w-full rounded-full border border-line-strong bg-white ps-9 pe-4 text-sm placeholder:text-ink-500 hover:border-brand-300 focus:border-brand-500 focus:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/30" />
    </form>
  );
}

export function Header() {
  const path = usePathname();
  // Panels are keyed to the path they were opened on, so navigating closes them without an effect.
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const [searchAt, setSearchAt] = useState<string | null>(null);
  const menu = menuAt === path, searchOpen = searchAt === path;
  const setMenu = (v: boolean) => setMenuAt(v ? path : null);
  const setSearchOpen = (v: boolean) => setSearchAt(v ? path : null);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/80 print:hidden">
      <div className="container-x flex h-16 items-center gap-1 sm:gap-2 lg:gap-5">
        <Logo />
        <nav aria-label="ناوبری اصلی" className="ms-3 hidden items-center gap-1 lg:flex">
          {PUBLIC_NAV.map((n) => {
            const active = path === n.href || path.startsWith(n.href + "/");
            return <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cn("rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-card", active ? "bg-card text-brand-800" : "text-ink-700")}>{n.label}</Link>;
          })}
        </nav>
        <SearchBox className="ms-auto hidden max-w-xs flex-1 md:block lg:max-w-sm" />
        <div className="ms-auto flex items-center gap-0.5 md:ms-0">
          <button onClick={() => setSearchOpen(true)} aria-label="جستجو" className="grid size-11 place-items-center rounded-md hover:bg-card md:hidden"><Search className="size-5" /></button>
          <CartLink />
          <AccountMenu />
          <button onClick={() => setMenu(true)} aria-label="باز کردن منو" className="grid size-11 place-items-center rounded-md hover:bg-card lg:hidden"><Menu className="size-5" /></button>
        </div>
      </div>
      <Dialog open={menu} onClose={() => setMenu(false)} title="منو" size="sm">
        <nav aria-label="منوی موبایل" className="-mx-2 flex flex-col">
          {[{ href: "/", label: "صفحهٔ اصلی" }, ...PUBLIC_NAV, { href: "/faq", label: "سؤالات متداول" }, { href: "/cart", label: "سبد خرید" }].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setMenu(false)} className="flex min-h-12 items-center rounded-md px-3 font-medium hover:bg-card">{n.label}</Link>
          ))}
        </nav>
      </Dialog>
      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} title="جستجو" size="sm">
        <SearchBox autoFocus onDone={() => setSearchOpen(false)} />
      </Dialog>
    </header>
  );
}

