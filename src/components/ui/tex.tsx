"use client";
import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

function render(tex: string, display: boolean) {
  try { return katex.renderToString(tex, { throwOnError: false, displayMode: display, strict: "ignore", trust: false, output: "html" }); }
  catch { return null; }
}

/** Block or inline formula. KaTeX output is generated from the formula string only (no HTML passthrough). */
export function Tex({ children, display = false, className }: { children: string; display?: boolean; className?: string }) {
  const html = useMemo(() => render(children, display), [children, display]);
  if (html === null) return <code dir="ltr" className={className}>{children}</code>;
  return <span dir="ltr" className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Plain Persian text with inline $…$ formulas. Everything outside formulas is rendered as escaped React text. */
export function MathText({ text, className }: { text: string; className?: string }) {
  const parts = useMemo(() => text.split(/(\$[^$]+\$)/g).filter(Boolean), [text]);
  return (
    <span className={className}>
      {parts.map((p, i) => p.startsWith("$") && p.endsWith("$") && p.length > 2 ? <Tex key={i}>{p.slice(1, -1)}</Tex> : <span key={i}>{p}</span>)}
    </span>
  );
}
