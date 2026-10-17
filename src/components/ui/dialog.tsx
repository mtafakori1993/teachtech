"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

/** Native <dialog>: focus is trapped, Esc closes, background is inert. On phones it becomes a bottom sheet. */
export function Dialog({ open, onClose, title, description, children, footer, size = "md" }: {
  open: boolean; onClose: () => void; title: string; description?: string; children?: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const tid = useId();
  const did = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const w = { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl" }[size];
  return (
    <dialog
      ref={ref}
      aria-labelledby={tid}
      aria-describedby={description ? did : undefined}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={cn("fixed m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] overflow-visible rounded-xl border border-line bg-white p-0 text-ink shadow-pop backdrop:bg-ink/50 backdrop:backdrop-blur-[2px] open:animate-[sheet_0.25s_ease-out] max-sm:!mb-0 max-sm:!w-full max-sm:max-w-none max-sm:rounded-b-none", w)}
    >
      {open && (
        <div className="flex max-h-[92dvh] flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 id={tid} className="text-lg font-bold">{title}</h2>
              {description && <p id={did} className="mt-0.5 text-sm text-ink-600">{description}</p>}
            </div>
            <button type="button" onClick={onClose} aria-label="بستن" className="-m-1 grid size-10 place-items-center rounded-md text-ink-600 hover:bg-card"><X className="size-5" /></button>
          </header>
          <div className="scroll-thin overflow-y-auto px-5 py-4">{children}</div>
          {footer && <footer className="safe-b flex flex-wrap justify-end gap-2 border-t border-line bg-card/50 px-5 py-3">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, children, confirmLabel = "تأیید", danger }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; children?: ReactNode; confirmLabel?: string; danger?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <Button variant="ghost" onClick={onClose}>انصراف</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </>}>
      <div className="text-sm leading-7 text-ink-700">{children}</div>
    </Dialog>
  );
}
