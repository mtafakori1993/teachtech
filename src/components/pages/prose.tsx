import type { ReactNode } from "react";
export function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-3xl space-y-4 leading-9 text-ink-700 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:ps-6 [&_ul]:marker:text-brand-500 [&_a]:text-brand-700 [&_a]:underline [&_a]:underline-offset-4">{children}</div>;
}
export function PageHero({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="border-b border-line bg-gradient-to-b from-card to-cream">
      <div className="container-x py-12">
        {eyebrow && <p className="mb-2 text-sm font-bold text-brand-700">{eyebrow}</p>}
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {children && <p className="mt-3 max-w-2xl text-lg text-ink-700">{children}</p>}
      </div>
    </div>
  );
}
