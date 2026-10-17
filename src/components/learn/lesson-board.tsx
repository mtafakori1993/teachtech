"use client";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tex } from "@/components/ui/tex";
import type { Lesson } from "@/data/types";
import { formatNumber } from "@/lib/format";

/** Honest fallback for lessons without footage: a step-through board of the lesson's key points and formulas. */
export function LessonBoard({ lesson, step, onStep }: { lesson: Lesson; step: number; onStep: (n: number) => void }) {
  const items = [...lesson.keyPoints.map((p) => ({ k: "p" as const, v: p })), ...lesson.formulas.map((f) => ({ k: "f" as const, v: f }))];
  const shown = items.slice(0, Math.max(1, Math.min(step + 1, items.length)));
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="grid-paper min-h-72 space-y-4 p-5 sm:p-8">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-sun-100 px-3 py-1 text-xs"><Info className="size-3.5" aria-hidden />ویدیوی این جلسه در این نسخه بارگذاری نشده است؛ خلاصهٔ گام‌به‌گام درس را ببینید.</p>
        <h3 className="text-xl font-bold">{lesson.title}</h3>
        <p className="text-ink-700">{lesson.summary}</p>
        <ul className="space-y-3">
          {shown.map((it, i) => it.k === "p"
            ? <li key={i} className="animate-rise flex gap-3 leading-8"><span className="mt-2 size-2.5 shrink-0 rounded-full bg-flame-400" aria-hidden />{it.v}</li>
            : <li key={i} className="animate-rise rounded-lg bg-card p-3 text-center text-lg"><Tex display>{it.v}</Tex></li>)}
        </ul>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line bg-card/50 px-4 py-2.5">
        <Button size="sm" variant="outline" disabled={step <= 0} onClick={() => onStep(step - 1)}><ChevronRight className="size-4" />قبلی</Button>
        <span className="tabular text-sm text-ink-600">گام {formatNumber(shown.length)} از {formatNumber(items.length)}</span>
        <Button size="sm" disabled={step >= items.length - 1} onClick={() => onStep(step + 1)}>بعدی<ChevronLeft className="size-4" /></Button>
      </div>
    </div>
  );
}
