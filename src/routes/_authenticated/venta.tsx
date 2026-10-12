import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Trash2, Package, Layers, Boxes } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/pos/StockBadge";
import { ProductPicker, type PickedItem } from "@/components/pos/ProductPicker";
import { cn } from "@/lib/utils";
import { errMsg, money, useCatalog, useCustomers, useInvalidateAll, useProfile, type ProductWithVariants } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/venta")({
  head: () => ({ meta: [{ title: "Nueva venta — PasoPOS" }, { name: "description", content: "Venta por pieza, media docena o docena mixta." }] }),
  component: NuevaVenta,
});

type Tipo = "pieza" | "media_docena" | "docena";
type Line = PickedItem & { key: string };

const PAGOS = ["Efectivo", "Transferencia", "Tarjeta", "Otro"];

function NuevaVenta() {
  const catalog = useCatalog();
  const profile = useProfile();
  const customers = useCustomers();
  const invalidate = useInvalidateAll();
  const [tipo, setTipo] = useState<Tipo>("pieza");
  const [lines, setLines] = useState<Line[]>([]);
  const [pago, setPago] = useState("Efectivo");
  const [cliente, setCliente] = useState("general");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ folio: string; total: number; id: string } | null>(null);

  const cur = profile.data?.moneda ?? "MXN";
  const target = tipo === "docena" ? profile.data?.pares_docena ?? 12 : tipo === "media_docena" ? profile.data?.pares_media_docena ?? 6 : null;
  const pares = lines.reduce((a, l) => a + l.cantidad, 0);
  const reserved = useMemo(() => {
    const r: Record<string, number> = {};
    lines.forEach((l) => (r[l.variant.id] = (r[l.variant.id] ?? 0) + l.cantidad));
    return r;
  }, [lines]);

  const unit = (p: ProductWithVariants) =>
    tipo === "pieza" ? Number(p.precio_par)
      : tipo === "media_docena" ? Number(p.precio_media_docena)
        : Number(p.precio_docena);
  const total = lines.reduce((a, l) => a + unit(l.product) * l.cantidad, 0);

  function changeTipo(t: Tipo) {
    if (t === tipo) return;
    setTipo(t); setLines([]); setDone(null);
  }

  function add(item: PickedItem) {
    const free = item.variant.stock_actual - (reserved[item.variant.id] ?? 0);
    if (item.cantidad > free) {
      toast.error(`Solo tienes ${free} pares disponibles.`);
      return false;
    }
    if (target && pares + item.cantidad > target) {
      toast.error(tipo === "docena" ? `Una docena solamente puede contener ${target} pares.` : `Una media docena solamente puede contener ${target} pares.`);
      return false;
    }
    setLines((ls) => {
      const ex = ls.find((l) => l.variant.id === item.variant.id);
      if (ex) return ls.map((l) => (l === ex ? { ...l, cantidad: l.cantidad + item.cantidad } : l));
      return [...ls, { ...item, key: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}` }];
    });
    setDone(null);
    return true;
  }

  const ready = lines.length > 0 && (target ? pares === target : true);

  async function finalizar() {
    setSaving(true);
    const { data, error } = await supabase.rpc("registrar_venta", {
      p_tipo: tipo,
      p_forma_pago: pago,
      p_customer_id: (cliente === "general" ? null : cliente) as string,
      p_items: lines.map((l) => ({ variant_id: l.variant.id, cantidad: l.cantidad })),
    });
    setSaving(false);
    if (error) return void toast.error(errMsg(error));
    const r = data as { folio: string; total: number; id: string };
    toast.success("Venta registrada correctamente.");
    setDone(r);
    setLines([]);
    invalidate();
  }

  const tipos: { k: Tipo; label: string; icon: typeof Package; sub: string }[] = [
    { k: "pieza", label: "Pieza", icon: Package, sub: "Por par" },
    { k: "media_docena", label: "Media docena", icon: Layers, sub: `${profile.data?.pares_media_docena ?? 6} pares mixtos` },
    { k: "docena", label: "Docena", icon: Boxes, sub: `${profile.data?.pares_docena ?? 12} pares mixtos` },
  ];

  const btnLabel = tipo === "docena" ? "Finalizar docena" : tipo === "media_docena" ? "Finalizar media docena" : "Confirmar venta";

  return (
    <>
      <PageHeader title={tipo === "docena" ? "Armar docena mixta" : tipo === "media_docena" ? "Armar media docena" : "Nueva venta"} subtitle={new Date().toLocaleDateString("es-MX", { dateStyle: "full" })} />

      <div className="mb-5 grid grid-cols-3 gap-2 md:gap-3">
        {tipos.map((t) => (
          <button
            key={t.k}
            onClick={() => changeTipo(t.k)}
            className={cn("rounded-2xl border p-3 text-left transition-colors md:p-4", tipo === t.k ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary")}
          >
            <t.icon className="mb-2 h-5 w-5" />
            <div className="text-sm font-bold md:text-base">{t.label}</div>
            <div className={cn("hidden text-xs md:block", tipo === t.k ? "opacity-80" : "text-muted-foreground")}>{t.sub}</div>
          </button>
        ))}
      </div>

      {done && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success/30 bg-success-soft p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <div>
              <div className="font-semibold">Venta registrada correctamente.</div>
              <div className="text-sm text-muted-foreground">Folio {done.folio} · {money(Number(done.total), cur)} · inventario actualizado</div>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-xl"><Link to="/ventas/$id" params={{ id: done.id }}>Ver e imprimir comprobante</Link></Button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
        <div className="rounded-2xl border bg-card p-4 md:p-5">
          <div className="mb-3 font-semibold">Agregar pares</div>
          <ProductPicker products={catalog.data ?? []} reserved={reserved} onAdd={add} priceOf={unit} addLabel={target ? "Agregar par" : "Agregar"} />
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border bg-card p-4 md:p-5">
            {target ? (
              <div className="mb-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Pares agregados</span>
                  <span className={cn("tabular text-3xl font-extrabold", pares === target ? "text-success" : "text-foreground")}>{pares} / {target}</span>
                </div>
                <Progress value={(pares / target) * 100} className="mt-2 h-3" />
              </div>
            ) : (
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-sm font-medium text-muted-foreground">Pares</span>
                <span className="tabular text-2xl font-bold">{pares}</span>
              </div>
            )}

            {lines.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Busca un modelo para empezar.</p>
            ) : (
              <div className="divide-y rounded-xl border">
                <div className="grid grid-cols-[1fr_40px_1fr_40px_80px_32px] gap-2 bg-muted/60 px-3 py-2 text-[11px] font-semibold uppercase text-muted-foreground">
                  <span>Modelo</span><span>Talla</span><span>Color</span><span className="text-right">Cant.</span><span className="text-right">Precio</span><span />
                </div>
                {lines.map((l) => (
                  <div key={l.key} className="grid grid-cols-[1fr_40px_1fr_40px_80px_32px] items-center gap-2 px-3 py-2 text-sm">
                    <span className="truncate font-medium">{l.product.modelo}</span>
                    <span>{l.variant.talla}</span>
                    <span className="truncate">{l.variant.color}</span>
                    <span className="tabular text-right font-bold">{l.cantidad}</span>
                    <span className="tabular text-right">{money(unit(l.product), cur)}</span>
                    <button aria-label="Eliminar" onClick={() => setLines((ls) => ls.filter((x) => x !== l))} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Select value={cliente} onValueChange={setCliente}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Cliente general</SelectItem>
                  {customers.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={pago} onValueChange={setPago}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{PAGOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t pt-4">
              <span className="font-semibold">Total</span>
              <span className="tabular text-2xl font-extrabold">{money(total, cur)}</span>
            </div>
            <Button disabled={!ready || saving} onClick={finalizar} className="mt-3 h-12 w-full rounded-xl bg-success text-base text-success-foreground hover:bg-success/90">
              <CheckCircle2 className="mr-2 h-5 w-5" /> {saving ? "Guardando…" : btnLabel}
            </Button>
            {target && pares < target && lines.length > 0 && (
              <p className="mt-2 text-center text-xs text-warning">Faltan {target - pares} pares para completar.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
