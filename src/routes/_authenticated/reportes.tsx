import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { PageHeader, StockBadge } from "@/components/pos/StockBadge";
import { money, stockLevel, useCatalog, useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/reportes")({
  head: () => ({ meta: [{ title: "Reportes — PasoPOS" }, { name: "description", content: "Ventas, tallas y colores más vendidos." }] }),
  component: Reportes,
});

function Reportes() {
  const profile = useProfile();
  const catalog = useCatalog();
  const [day, setDay] = useState(() => new Date().toLocaleDateString("en-CA"));
  const cur = profile.data?.moneda ?? "MXN";

  const daily = useQuery({
    queryKey: ["report", "day", day],
    queryFn: async () => {
      const start = new Date(day + "T00:00:00"); const end = new Date(start); end.setDate(end.getDate() + 1);
      const { data, error } = await supabase.from("sales").select("total,total_pares").gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
      if (error) throw error;
      return data;
    },
  });
  const items = useQuery({
    queryKey: ["report", "items"],
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data, error } = await supabase.from("sale_items").select("modelo,talla,color,cantidad,subtotal").gte("created_at", since.toISOString());
      if (error) throw error;
      return data;
    },
  });

  const agg = (key: "modelo" | "talla" | "color") => {
    const m = new Map<string, { pares: number; ingresos: number }>();
    items.data?.forEach((i) => {
      const r = m.get(i[key]) ?? { pares: 0, ingresos: 0 };
      r.pares += i.cantidad; r.ingresos += Number(i.subtotal); m.set(i[key], r);
    });
    return [...m.entries()].sort((a, b) => b[1].pares - a[1].pares).slice(0, 10);
  };
  const low = (catalog.data ?? []).flatMap((p) => p.product_variants.filter((v) => stockLevel(v) !== "ok").map((v) => ({ p, v })));

  return (
    <>
      <PageHeader title="Reportes" subtitle="Rankings de los últimos 30 días." />
      <section className="mb-5 rounded-2xl border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Ventas por día</h2>
          <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="w-44 rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            ["Ventas totales", money(daily.data?.reduce((a, s) => a + Number(s.total), 0) ?? 0, cur)],
            ["Pares vendidos", daily.data?.reduce((a, s) => a + s.total_pares, 0) ?? 0],
            ["Operaciones", daily.data?.length ?? 0],
          ].map(([l, v]) => (
            <div key={l as string} className="rounded-xl bg-muted/60 p-3">
              <div className="tabular text-lg font-bold md:text-2xl">{v}</div>
              <div className="text-xs text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        <Rank title="Productos más vendidos" rows={agg("modelo")} extra={(r) => money(r.ingresos, cur)} />
        <Rank title="Tallas más vendidas" rows={agg("talla")} prefix="T" />
        <Rank title="Colores más vendidos" rows={agg("color")} />
      </div>

      <section className="mt-5 rounded-2xl border bg-card">
        <div className="border-b px-5 py-4 font-semibold">Inventario bajo ({low.length})</div>
        <div className="divide-y">
          {low.map(({ p, v }) => (
            <div key={v.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
              <span className="font-medium">{p.modelo}</span><span className="text-muted-foreground">{v.color} · T{v.talla}</span>
              <span className="tabular ml-auto font-bold">{v.stock_actual}</span><StockBadge level={stockLevel(v)} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Rank({ title, rows, prefix = "", extra }: { title: string; rows: [string, { pares: number; ingresos: number }][]; prefix?: string; extra?: (r: { pares: number; ingresos: number }) => string }) {
  const max = rows[0]?.[1].pares ?? 1;
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sin datos.</p> : (
        <ul className="space-y-3">
          {rows.map(([k, r]) => (
            <li key={k}>
              <div className="flex justify-between text-sm"><span className="font-medium">{prefix}{k}</span><span className="tabular text-muted-foreground">{r.pares} pares{extra ? ` · ${extra(r)}` : ""}</span></div>
              <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(r.pares / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
