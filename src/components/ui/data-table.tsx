"use client";
import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search, SearchX } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { normalizeText } from "@/lib/catalog";
import { Button } from "./button";
import { EmptyState } from "./primitives";
import { Input, Select } from "./form";

export interface Column<T> { key: string; header: string; cell: (row: T) => ReactNode; sort?: (row: T) => string | number; className?: string; hideOnMobile?: boolean }
export interface TableFilter<T> { id: string; label: string; options: { value: string; label: string }[]; test: (row: T, value: string) => boolean }

/** Searchable, filterable, sortable, paginated table. Scrolls horizontally only inside its own container. */
export function DataTable<T>({ rows, columns, rowKey, searchText, filters = [], pageSize = 8, empty, caption, toolbar }: {
  rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string; searchText: (r: T) => string; filters?: TableFilter<T>[]; pageSize?: number;
  empty?: { title: string; text?: string }; caption: string; toolbar?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [fv, setFv] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const nq = normalizeText(q);
    let out = rows.filter((r) => (!nq || normalizeText(searchText(r)).includes(nq)) && filters.every((f) => !fv[f.id] || f.test(r, fv[f.id])));
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sort) out = [...out].sort((a, b) => { const x = col.sort!(a), y = col.sort!(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir; });
    }
    return out;
  }, [rows, q, fv, sort, filters, columns, searchText]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * pageSize, cur * pageSize);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative min-w-52 flex-1">
          <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
          <Input aria-label={`جستجو در ${caption}`} placeholder="جستجو…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="ps-9" />
        </div>
        {filters.map((f) => (
          <Select key={f.id} aria-label={f.label} value={fv[f.id] ?? ""} onChange={(e) => { setFv({ ...fv, [f.id]: e.target.value }); setPage(1); }} className="w-auto min-w-36">
            <option value="">{f.label}: همه</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        ))}
        {toolbar}
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={<SearchX className="size-6" />} title={empty?.title ?? "موردی پیدا نشد"}>{empty?.text ?? "جستجو یا فیلترها را تغییر دهید."}</EmptyState>
      ) : (
        <div className="scroll-thin overflow-x-auto rounded-lg border border-line bg-white shadow-soft">
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead className="bg-card text-ink-700">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} scope="col" aria-sort={sort?.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined} className={cn("px-4 py-3 text-start font-bold", c.hideOnMobile && "max-sm:hidden", c.className)}>
                    {c.sort ? (
                      <button type="button" onClick={() => setSort(sort?.key === c.key ? { key: c.key, dir: sort.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 })} className="inline-flex items-center gap-1 hover:text-brand-700">
                        {c.header}<span aria-hidden className="text-xs text-ink-500">{sort?.key === c.key ? (sort.dir === 1 ? "▲" : "▼") : "↕"}</span>
                      </button>
                    ) : c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {slice.map((r) => (
                <tr key={rowKey(r)} className="transition-colors hover:bg-card/50">
                  {columns.map((c) => <td key={c.key} className={cn("px-4 py-3 align-middle", c.hideOnMobile && "max-sm:hidden", c.className)}>{c.cell(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 text-sm text-ink-600">
        <span aria-live="polite">{formatNumber(filtered.length)} مورد</span>
        {pages > 1 && (
          <nav aria-label="صفحه‌بندی" className="flex items-center gap-1">
            <Button size="sm" variant="outline" disabled={cur <= 1} onClick={() => setPage(cur - 1)} aria-label="صفحهٔ قبل"><ChevronRight className="size-4" /></Button>
            <span className="tabular px-2">صفحهٔ {formatNumber(cur)} از {formatNumber(pages)}</span>
            <Button size="sm" variant="outline" disabled={cur >= pages} onClick={() => setPage(cur + 1)} aria-label="صفحهٔ بعد"><ChevronLeft className="size-4" /></Button>
          </nav>
        )}
      </div>
    </div>
  );
}
