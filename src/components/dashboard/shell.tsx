"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RoleGate } from "@/components/layout/role-gate";
import { iconByName } from "@/components/ui/icons";
import { NAV, isActive, ROLE_LABEL } from "@/lib/nav";
import { cn } from "@/lib/cn";
import type { Role } from "@/data/types";

export function DashboardShell({ role, children }: { role: Role; children: ReactNode }) {
  const path = usePathname();
  const items = NAV[role];
  return (
    <RoleGate>
      <div className="container-x grid grid-cols-[minmax(0,1fr)] gap-6 py-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:py-8">
        <aside aria-label={`منوی ${ROLE_LABEL[role]}`} className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 hidden px-3 text-xs font-bold text-ink-500 lg:block">{ROLE_LABEL[role]}</p>
          <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {items.map((it) => {
              const Icon = iconByName(it.icon); const active = isActive(it, path);
              return <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors", active ? "bg-brand-600 text-white shadow-soft" : "text-ink-700 hover:bg-card")}><Icon className="size-[1.15rem]" aria-hidden />{it.label}</Link>;
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </RoleGate>
  );
}
