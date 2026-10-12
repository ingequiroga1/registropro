import { cn } from "@/lib/utils";
import type { StockLevel } from "@/lib/data";

const styles: Record<StockLevel, string> = {
  ok: "bg-success-soft text-success",
  low: "bg-warning-soft text-warning",
  out: "bg-destructive-soft text-destructive",
};

export function StockBadge({ level, className }: { level: StockLevel; className?: string }) {
  if (level === "ok") return null;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", styles[level], className)}>
      {level === "out" ? "Agotado" : "Stock bajo"}
    </span>
  );
}

export function SizeChip({ talla, stock, level }: { talla: string; stock: number; level: StockLevel }) {
  return (
    <div className={cn("flex min-w-14 flex-col items-center rounded-xl px-2.5 py-1.5", styles[level])}>
      <span className="text-[11px] font-medium opacity-80">T{talla}</span>
      <span className="tabular text-base font-bold leading-tight">{stock}</span>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
