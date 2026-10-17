import Link from "next/link";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden className={cn("size-9", className)}>
      <rect width="512" height="512" rx="116" fill="#2F80ED" />
      <path d="M118 138h276a20 20 0 0 1 20 20v44a20 20 0 0 1-20 20h-96v150a20 20 0 0 1-20 20h-44a20 20 0 0 1-20-20V222h-96a20 20 0 0 1-20-20v-44a20 20 0 0 1 20-20z" fill="#FFFDF5" />
      <path d="M92 408C150 296 214 296 256 352c42 56 106 56 164-56" fill="none" stroke="#F2C94C" strokeWidth="30" strokeLinecap="round" />
      <circle cx="404" cy="112" r="30" fill="#F2994A" />
    </svg>
  );
}

export function Logo({ className, tagline = false }: { className?: string; tagline?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 rounded-md", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span dir="ltr" className="text-xl font-bold tracking-tight text-ink">Teach<span className="text-brand-600">Tech</span></span>
        {tagline && <span className="mt-1 text-[0.68rem] text-ink-600">آموزش آنلاین و یادگیری هوشمند</span>}
      </span>
    </Link>
  );
}
