import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Variant = "primary" | "cta" | "secondary" | "outline" | "ghost" | "danger";
export type Size = "sm" | "md" | "lg" | "icon";

const base = "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background,color,box-shadow,transform,border-color] duration-150 select-none active:translate-y-px disabled:pointer-events-none disabled:bg-disabled disabled:text-disabled-text disabled:shadow-none aria-disabled:pointer-events-none aria-disabled:opacity-60";
const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-soft hover:bg-brand-700",
  cta: "bg-flame-400 text-ink font-bold shadow-soft hover:bg-flame-500",
  secondary: "bg-card text-brand-800 hover:bg-brand-100",
  outline: "border border-line-strong bg-white text-ink hover:border-brand-400 hover:bg-card",
  ghost: "text-ink-700 hover:bg-card",
  danger: "bg-danger-600 text-white hover:bg-red-800",
};
const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-5 text-[0.95rem]",
  lg: "min-h-12 px-7 text-base",
  icon: "size-11",
};
export const buttonClass = (v: Variant = "primary", s: Size = "md", extra?: string) => cn(base, variants[v], sizes[s], extra);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; href?: string; loading?: boolean; children?: ReactNode };

export const Button = forwardRef<HTMLButtonElement, Props>(function Button({ variant = "primary", size = "md", href, loading, className, children, disabled, type = "button", ...rest }, ref) {
  const cls = buttonClass(variant, size, className);
  if (href) {
    return (
      <Link href={href} className={cls} aria-disabled={disabled || undefined}>
        {children}
      </Link>
    );
  }
  return (
    <button ref={ref} type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
});
