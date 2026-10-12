import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DollarSign, Footprints, Layers, AlertTriangle, ShoppingCart, PackagePlus, Plus, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageHeader, StockBadge } from "@/components/pos/StockBadge";
import { errMsg, money, stockLevel, useCatalog, useInvalidateAll, useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Inicio — PasoPOS" }, { name: "description", content: "Resumen del día de tu zapatería." }] }),
  component: Dashboard,
});

function Dashboard() {
  const catalog = useCatalog();
  const profile = useProfile();
  const invalidate = useInvalidateAll();
  const [seeding, setSeeding] = useState(false);
  const today = useQuery({
    queryKey: ["sales", "today"],
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data, error } = await supabase.from("sales").select("total,total_pares").gte("created_at", start.toISOString());
      if (error) throw error;
      return data;
    },
  });

  const products = catalog.data ?? [];
  const low = products.flatMap((p) => p.product_variants.filter((v) => stockLevel(v) !== "ok").map((v) => ({ p, v })))
    .sort((a, b) => a.v.stock_actual - b.v.stock_actual);
  const cur = profile.data?.moneda ?? "MXN";
  const stats = [
    { label: "Ventas de hoy", value: money(today.data?.reduce((a, s) => a + Number(s.total), 0) ?? 0, cur), icon: DollarSign, tone: "bg-primary-soft text-primary" },
    { label: "Pares vendidos hoy", value: today.data?.reduce((a, s) => a + s.total_pares, 0) ?? 0, icon: Footprints, tone: "bg-success-soft text-success" },
    { label: "Modelos activos", value: products.filter((p) => p.activo).length, icon: Layers, tone: "bg-secondary text-secondary-foreground" },
    { label: "Inventario bajo", value: low.length, icon: AlertTriangle, tone: "bg-warning-soft text-warning" },
  ];

  async function seed() {
    setSeeding(true);
    const { error } = await supabase.rpc("cargar_demo");
    setSeeding(false);
    if (error) return void toast.error(errMsg(error));
    toast.success("Datos de demostración cargados.");
    invalidate();
  }

  return (
    <>
      <PageHeader title={`Hola${profile.data?.negocio ? `, ${profile.data.negocio}` : ""}`} subtitle={new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })} />

      {catalog.isSuccess && products.length === 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary-soft p-5">
          <div>
            <div className="font-semibold">Aún no tienes productos</div>
            <div className="text-sm text-muted-foreground">Carga Tenis 520, Bota 310 y Tenis 410 con inventario de ejemplo para probar.</div>
          </div>
          <Button onClick={seed} disabled={seeding} className="rounded-xl"><Sparkles className="mr-1.5 h-4 w-4" />Cargar datos demo</Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-4 md:p-5">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.tone}`}><s.icon className="h-[18px] w-[18px]" /></div>
            <div className="tabular text-xl font-bold md:text-2xl">{s.value}</div>
            <div className="text-xs text-muted-foreground md:text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { to: "/venta", label: "Nueva venta", icon: ShoppingCart, primary: true },
          { to: "/inventario", label: "Registrar inventario", icon: PackagePlus },
          { to: "/productos", label: "Agregar producto", icon: Plus },
          { to: "/inventario", label: "Consultar inventario", icon: Search },
        ].map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className={`flex items-center gap-3 rounded-2xl border p-4 font-semibold transition-colors ${a.primary ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : "bg-card hover:border-primary"}`}
          >
            <a.icon className="h-5 w-5" /> <span className="text-sm">{a.label}</span>
          </Link>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border bg-card">
        <div className="border-b px-5 py-4 font-semibold">Productos con inventario bajo</div>
        {low.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Todo en orden. 👟</p>
        ) : (
          <div className="divide-y">
            {low.slice(0, 12).map(({ p, v }) => (
              <div key={v.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-5 py-3 text-sm">
                <span className="font-medium">{p.modelo}</span>
                <span className="text-muted-foreground">{v.color}</span>
                <span className="text-muted-foreground">T{v.talla}</span>
                <span className="flex items-center gap-2"><span className="tabular font-bold">{v.stock_actual}</span><StockBadge level={stockLevel(v)} /></span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
