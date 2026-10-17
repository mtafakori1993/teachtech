import { discountPercent, formatNumber, formatToman } from "@/lib/format";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export function Price({ price, comparePrice, size = "md", className }: { price: number; comparePrice?: number; size?: "md" | "lg"; className?: string }) {
  const off = comparePrice && comparePrice > price ? discountPercent(comparePrice, price) : 0;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("tabular font-bold text-ink", size === "lg" ? "text-3xl" : "text-lg")}>{formatToman(price)}</span>
      {off > 0 && (
        <>
          <s className="tabular text-sm text-ink-500" aria-label={`قیمت قبل از تخفیف ${formatToman(comparePrice!)}`}>{formatNumber(comparePrice!)}</s>
          <Badge tone="flame">{formatNumber(off)}٪ تخفیف</Badge>
        </>
      )}
    </div>
  );
}
