import { formatNumber } from "@/lib/format";

/** Accessible SVG bar chart; the values are also exposed as a visually-hidden table. */
export function BarChart({ data, label, format = formatNumber, color = "#2F80ED" }: { data: { label: string; value: number }[]; label: string; format?: (n: number) => string; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure>
      <div className="flex h-44 items-end gap-2 sm:gap-3" aria-hidden>
        {data.map((d) => (
          <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span className="tabular truncate text-[0.68rem] text-ink-600">{format(d.value)}</span>
            <div className="w-full rounded-t-md transition-[height] duration-500" style={{ height: `${Math.max(2, (d.value / max) * 100)}%`, background: color, maxHeight: "8.5rem" }} />
            <span className="w-full truncate text-center text-[0.68rem] text-ink-600">{d.label}</span>
          </div>
        ))}
      </div>
      <figcaption className="sr-only">{label}</figcaption>
      <table className="sr-only"><caption>{label}</caption><tbody>{data.map((d) => <tr key={d.label}><th scope="row">{d.label}</th><td>{format(d.value)}</td></tr>)}</tbody></table>
    </figure>
  );
}

export function HBar({ label, value, max, text }: { label: string; value: number; max: number; text: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[minmax(0,14rem)_1fr_auto]">
      <span className="truncate" title={label}>{label}</span>
      <div className="h-3 overflow-hidden rounded-full bg-card" role="presentation"><div className="h-full rounded-full bg-brand-500" style={{ width: `${max ? (value / max) * 100 : 0}%` }} /></div>
      <span className="tabular w-28 text-end text-xs text-ink-600">{text}</span>
    </div>
  );
}
