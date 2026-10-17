"use client";
import { create } from "zustand";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "success" | "info" | "error";
interface T { id: number; message: string; tone: Tone; action?: { label: string; href: string } }
const useToasts = create<{ list: T[]; push: (m: string, tone?: Tone, action?: T["action"]) => void; dismiss: (id: number) => void }>((set) => ({
  list: [],
  push: (message, tone = "info", action) => {
    const id = Date.now() + Math.random();
    set((s) => ({ list: [...s.list.slice(-3), { id, message, tone, action }] }));
    setTimeout(() => set((s) => ({ list: s.list.filter((t) => t.id !== id) })), 5200);
  },
  dismiss: (id) => set((s) => ({ list: s.list.filter((t) => t.id !== id) })),
}));
export const toast = {
  success: (m: string, action?: T["action"]) => useToasts.getState().push(m, "success", action),
  info: (m: string) => useToasts.getState().push(m, "info"),
  error: (m: string) => useToasts.getState().push(m, "error"),
};

export function Toaster() {
  const { list, dismiss } = useToasts();
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-center gap-2 px-3 lg:bottom-6 lg:items-start lg:ps-6">
      {list.map((t) => {
        const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "error" ? TriangleAlert : Info;
        return (
          <div key={t.id} className={cn("pointer-events-auto flex max-w-md animate-rise items-start gap-3 rounded-lg border bg-white px-4 py-3 text-sm shadow-lift", t.tone === "error" ? "border-danger-600/40" : t.tone === "success" ? "border-success-600/40" : "border-brand-200")}>
            <Icon className={cn("mt-0.5 size-5 shrink-0", t.tone === "error" ? "text-danger-600" : t.tone === "success" ? "text-success-600" : "text-brand-600")} aria-hidden />
            <div className="flex-1">
              <p>{t.message}</p>
              {t.action && <a href={t.action.href} className="mt-1 inline-block font-bold text-brand-700 underline underline-offset-4">{t.action.label}</a>}
            </div>
            <button onClick={() => dismiss(t.id)} aria-label="بستن اعلان" className="-m-1 grid size-8 place-items-center rounded text-ink-500 hover:bg-card"><X className="size-4" /></button>
          </div>
        );
      })}
    </div>
  );
}
