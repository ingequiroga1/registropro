import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Minus, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sortTallas, stockLevel, type ProductWithVariants, type Variant } from "@/lib/data";

export type PickedItem = { product: ProductWithVariants; variant: Variant; cantidad: number };

/** Fast search → color → talla → qty picker. Keeps the model selected after adding. */
export function ProductPicker({
  products, reserved, onAdd, priceOf, addLabel = "Agregar",
}: {
  products: ProductWithVariants[];
  reserved: Record<string, number>;
  onAdd: (item: PickedItem) => boolean | void;
  priceOf?: (p: ProductWithVariants) => number;
  addLabel?: string;
}) {
  const [q, setQ] = useState("");
  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    const active = products.filter((p) => p.activo && p.product_variants.length > 0);
    if (!s) return active.slice(0, 8);
    return active.filter((p) =>
      [p.codigo, p.modelo, p.nombre, p.categoria].some((f) => f?.toLowerCase().includes(s)),
    ).slice(0, 8);
  }, [q, products]);

  // keep product fresh when catalog refetches
  useEffect(() => {
    if (product) setProduct(products.find((p) => p.id === product.id) ?? null);
  }, [products]); // eslint-disable-line react-hooks/exhaustive-deps

  const colors = useMemo(
    () => (product ? [...new Set(product.product_variants.map((v) => v.color))].sort() : []),
    [product],
  );
  useEffect(() => {
    if (product && colors.length === 1) setColor(colors[0] ?? null);
  }, [product, colors]);

  const sizes = useMemo(
    () => (product && color ? product.product_variants.filter((v) => v.color === color).sort((a, b) => sortTallas(a.talla, b.talla)) : []),
    [product, color],
  );
  const variant = sizes.find((v) => v.id === variantId) ?? null;
  const available = variant ? variant.stock_actual - (reserved[variant.id] ?? 0) : 0;

  function pick(p: ProductWithVariants) {
    setProduct(p); setColor(null); setVariantId(null); setQty(1); setQ("");
  }
  function add() {
    if (!product || !variant) return;
    const ok = onAdd({ product, variant, cantidad: qty });
    if (ok !== false) { setVariantId(null); setQty(1); }
  }

  if (!product) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) pick(matches[0]); }}
            placeholder="Buscar modelo o código… ej. 520"
            className="h-12 rounded-xl pl-11 text-base"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {matches.map((p) => {
            const total = p.product_variants.reduce((a, v) => a + v.stock_actual, 0);
            return (
              <button
                key={p.id}
                onClick={() => pick(p)}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:border-primary hover:bg-primary-soft"
              >
                <div>
                  <div className="font-semibold">{p.modelo}</div>
                  <div className="text-xs text-muted-foreground">{p.codigo} · {p.categoria}</div>
                </div>
                <div className="text-right text-xs text-muted-foreground"><span className="tabular text-sm font-semibold text-foreground">{total}</span> pares</div>
              </button>
            );
          })}
          {matches.length === 0 && <p className="text-sm text-muted-foreground">Sin resultados.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-primary-soft px-4 py-3">
        <div>
          <div className="font-bold text-accent-foreground">{product.modelo}</div>
          <div className="text-xs text-muted-foreground">{product.codigo}{priceOf ? ` · ${priceOf(product).toFixed(2)} por par` : ""}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setProduct(null)}><X className="mr-1 h-4 w-4" />Cambiar</Button>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Color</div>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setVariantId(null); }}
              className={cn("rounded-xl border px-4 py-2 text-sm font-medium", color === c ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary")}
            >{c}</button>
          ))}
        </div>
      </div>

      {color && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Talla</div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((v) => {
              const free = v.stock_actual - (reserved[v.id] ?? 0);
              const lvl = stockLevel({ stock_actual: free, stock_minimo: v.stock_minimo });
              return (
                <button
                  key={v.id}
                  disabled={free <= 0}
                  onClick={() => { setVariantId(v.id); setQty(1); }}
                  className={cn(
                    "flex min-w-16 flex-col items-center rounded-xl border px-3 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    variantId === v.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary",
                  )}
                >
                  <span className="text-base font-bold">{v.talla}</span>
                  <span className={cn("text-[11px] font-medium", variantId === v.id ? "" : lvl === "ok" ? "text-success" : lvl === "low" ? "text-warning" : "text-destructive")}>
                    {free <= 0 ? "Agotado" : `${free} disp.`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {variant && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/50 p-3">
          <div>
            <div className="mb-1.5 text-xs font-semibold text-muted-foreground">Cantidad · Disponible: {available} pares</div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
              <Input
                type="number" min={1} value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                onKeyDown={(e) => e.key === "Enter" && add()}
                className="tabular h-11 w-16 rounded-xl text-center text-lg font-bold"
              />
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl" onClick={() => setQty(qty + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          <Button className="h-11 flex-1 rounded-xl text-base" onClick={add}>
            <Plus className="mr-1 h-5 w-5" /> {addLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
