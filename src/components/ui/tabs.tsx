"use client";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabDef { id: string; label: ReactNode; content: ReactNode }

/** WAI-ARIA tabs with roving tabindex and arrow-key navigation (RTL-aware: ArrowRight moves to the previous tab). */
export function Tabs({ tabs, initial, label, className, onChange }: { tabs: TabDef[]; initial?: string; label: string; className?: string; onChange?: (id: string) => void }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  const base = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const select = (id: string) => { setActive(id); onChange?.(id); refs.current[id]?.focus(); };
  const onKey = (e: KeyboardEvent, i: number) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const next = e.key === "ArrowLeft" ? (rtl ? 1 : -1) : e.key === "ArrowRight" ? (rtl ? -1 : 1) : e.key === "Home" ? -99 : e.key === "End" ? 99 : 0;
    if (!next) return;
    e.preventDefault();
    const j = next === -99 ? 0 : next === 99 ? tabs.length - 1 : (i + next + tabs.length) % tabs.length;
    select(tabs[j].id);
  };
  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b border-line px-1">
        {tabs.map((t, i) => (
          <button key={t.id} ref={(el) => { refs.current[t.id] = el; }} role="tab" id={`${base}-t-${t.id}`} aria-selected={active === t.id} aria-controls={`${base}-p-${t.id}`}
            tabIndex={active === t.id ? 0 : -1} onClick={() => select(t.id)} onKeyDown={(e) => onKey(e, i)}
            className={cn("relative min-h-11 shrink-0 whitespace-nowrap px-4 text-sm font-medium transition-colors", active === t.id ? "text-brand-700 after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-brand-500" : "text-ink-600 hover:text-ink")}>
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`${base}-p-${t.id}`} aria-labelledby={`${base}-t-${t.id}`} hidden={active !== t.id} tabIndex={0} className="pt-5 focus-visible:outline-offset-4">
          {active === t.id && t.content}
        </div>
      ))}
    </div>
  );
}
