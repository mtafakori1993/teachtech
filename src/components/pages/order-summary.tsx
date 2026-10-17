import { formatToman } from "@/lib/format";
import type { Totals } from "@/lib/pricing";
export function OrderSummary({ t, code }: { t: Totals; code?: string | null }) {
  const rows: [string, string, boolean?][] = [["مجموع قیمت اصلی", formatToman(t.listTotal)]];
  if (t.courseSavings > 0) rows.push(["تخفیف دوره‌ها", `−${formatToman(t.courseSavings)}`, true]);
  if (t.discountAmount > 0) rows.push([`کد تخفیف ${code ?? ""}`, `−${formatToman(t.discountAmount)}`, true]);
  return (
    <dl className="space-y-2 text-sm">
      {rows.map(([k, v, good]) => <div key={k} className="flex justify-between gap-3"><dt className="text-ink-600">{k}</dt><dd className={`tabular ${good ? "text-success-600" : ""}`}>{v}</dd></div>)}
      <div className="flex justify-between gap-3 border-t border-line pt-3 text-lg font-bold"><dt>مبلغ نهایی</dt><dd className="tabular">{formatToman(t.total)}</dd></div>
    </dl>
  );
}
