"use client";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const control = "w-full rounded-md border border-line-strong bg-white px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink-500 transition-colors hover:border-brand-300 focus:border-brand-500 focus:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/30 disabled:bg-disabled disabled:text-disabled-text aria-[invalid=true]:border-danger-600 aria-[invalid=true]:focus-visible:ring-danger-600/25";

export function Field({ label, hint, error, children, className, htmlFor }: { label: string; hint?: string; error?: string; children: (p: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode; className?: string; htmlFor?: string }) {
  const rid = useId();
  const id = htmlFor ?? rid;
  const desc = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink-700">{label}</label>
      {children({ id, "aria-describedby": desc, "aria-invalid": error ? true : undefined })}
      {error ? <p id={`${id}-err`} role="alert" className="text-sm text-danger-600">{error}</p> : hint ? <p id={`${id}-hint`} className="text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(control, className)} {...p} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, rows = 4, ...p }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(control, "resize-y leading-7", className)} {...p} />;
});
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...p }, ref) {
  return (
    <select ref={ref} className={cn(control, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%234b5563%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[position:left_0.85rem_center] bg-no-repeat pe-3.5 ps-9", className)} {...p}>
      {children}
    </select>
  );
});

export function Checkbox({ label, className, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cn("inline-flex min-h-8 cursor-pointer items-center gap-2.5 text-sm", className)}>
      <input type="checkbox" className="size-5 shrink-0 cursor-pointer rounded border-line-strong accent-brand-600" {...p} />
      <span>{label}</span>
    </label>
  );
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <label htmlFor={id} className="cursor-pointer text-sm font-medium">{label}</label>
        {hint && <p className="text-xs text-ink-500">{hint}</p>}
      </div>
      <button id={id} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-brand-600" : "bg-line-strong")}>
        <span className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow transition-[inset-inline-start]", checked ? "start-[1.4rem]" : "start-0.5")} />
      </button>
    </div>
  );
}
