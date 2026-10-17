import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Badge({ tone = "brand", children, className }: { tone?: "brand" | "sun" | "flame" | "success" | "warning" | "danger" | "neutral"; children: ReactNode; className?: string }) {
  const t = {
    brand: "bg-card text-brand-800 border-brand-200",
    sun: "bg-sun-100 text-ink border-sun-300",
    flame: "bg-flame-100 text-warning-700 border-flame-400/40",
    success: "bg-success-100 text-success-600 border-success-600/20",
    warning: "bg-warning-100 text-warning-700 border-warning-700/20",
    danger: "bg-danger-100 text-danger-600 border-danger-600/20",
    neutral: "bg-white text-ink-600 border-line-strong",
  }[tone];
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-6", t, className)}>{children}</span>;
}

export function Card({ children, className, as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" | "li" }) {
  return <Tag className={cn("rounded-lg border border-line bg-white shadow-soft", className)}>{children}</Tag>;
}

export function Progress({ value, label, tone = "brand", className }: { value: number; label?: string; tone?: "brand" | "success" | "flame"; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const bar = { brand: "bg-brand-500", success: "bg-success-600", flame: "bg-flame-400" }[tone];
  return (
    <div role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "پیشرفت"} className={cn("h-2.5 w-full overflow-hidden rounded-full bg-card", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", bar)} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-card", className)} />;
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-line-strong bg-card/50 px-6 py-12 text-center">
      {icon && <div className="mb-3 grid size-14 place-items-center rounded-full bg-white text-brand-600 shadow-soft">{icon}</div>}
      <h3 className="text-lg font-bold">{title}</h3>
      {children && <p className="mt-1 max-w-md text-sm text-ink-600">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Alert({ tone = "info", title, children, className, role }: { tone?: "info" | "success" | "warning" | "danger"; title?: string; children?: ReactNode; className?: string; role?: "alert" | "status" }) {
  const t = {
    info: "border-brand-200 bg-card text-brand-900",
    success: "border-success-600/30 bg-success-100 text-ink",
    warning: "border-warning-700/30 bg-warning-100 text-ink",
    danger: "border-danger-600/30 bg-danger-100 text-ink",
  }[tone];
  return (
    <div role={role ?? (tone === "danger" ? "alert" : "status")} className={cn("rounded-md border px-4 py-3 text-sm leading-7", t, className)}>
      {title && <p className="font-bold">{title}</p>}
      {children}
    </div>
  );
}

export function Stat({ label, value, hint, icon, tone = "brand" }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode; tone?: "brand" | "sun" | "flame" | "success" }) {
  const tn = { brand: "bg-card text-brand-700", sun: "bg-sun-100 text-ink", flame: "bg-flame-100 text-warning-700", success: "bg-success-100 text-success-600" }[tone];
  return (
    <div className="flex items-start gap-3 rounded-lg border border-line bg-white p-4 shadow-soft">
      {icon && <div className={cn("grid size-11 shrink-0 place-items-center rounded-md", tn)}>{icon}</div>}
      <div className="min-w-0">
        <p className="text-sm text-ink-600">{label}</p>
        <p className="tabular text-2xl font-bold leading-tight">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
      </div>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, children, action, className }: { eyebrow?: string; title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-1 text-sm font-bold text-brand-700">{eyebrow}</p>}
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        {children && <p className="mt-2 text-ink-600">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageTitle({ title, children, actions }: { title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {children && <p className="mt-1 text-sm text-ink-600 sm:text-base">{children}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
