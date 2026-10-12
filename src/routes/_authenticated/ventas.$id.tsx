import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { money, TIPO_LABEL, useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/ventas/$id")({
  head: () => ({ meta: [{ title: "Detalle de venta — PasoPOS" }, { name: "description", content: "Contenido de la venta." }] }),
  component: Detalle,
});

function Detalle() {
  const { id } = Route.useParams();
  const profile = useProfile();
  const q = useQuery({
    queryKey: ["sale", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("*, customers(nombre), sale_items(*)").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const s = q.data;
  const cur = profile.data?.moneda ?? "MXN";
  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link to="/ventas" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Ventas</Link>
        {s && <Button onClick={() => window.print()} className="rounded-xl"><Printer className="mr-2 h-4 w-4" />Imprimir comprobante</Button>}
      </div>
      {s && (
        <div id="comprobante" className="rounded-2xl border bg-card p-5 md:p-6">
          <div className="mb-3 text-center">
            <div className="text-lg font-bold">{profile.data?.negocio ?? "Mi zapatería"}</div>
            {profile.data?.telefono && <div className="text-xs text-muted-foreground">Tel. {profile.data.telefono}</div>}
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Comprobante de venta</div>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-2xl font-bold">Folio {s.folio}</h1>
            <span className="text-sm text-muted-foreground">{new Date(s.created_at).toLocaleString("es-MX")}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-primary-soft px-3 py-1 font-semibold text-accent-foreground">{TIPO_LABEL[s.tipo_venta]}</span>
            <span className="rounded-full bg-muted px-3 py-1">{s.customers?.nombre ?? "Cliente general"}</span>
            <span className="rounded-full bg-muted px-3 py-1">{s.forma_pago}</span>
          </div>
          <div className="mt-5 divide-y rounded-xl border text-sm">
            <div className="grid grid-cols-[1fr_50px_1fr_50px_90px] gap-2 bg-muted/60 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
              <span>Modelo</span><span>Talla</span><span>Color</span><span className="text-right">Cant.</span><span className="text-right">Subtotal</span>
            </div>
            {s.sale_items.map((it) => (
              <div key={it.id} className="grid grid-cols-[1fr_50px_1fr_50px_90px] gap-2 px-3 py-2.5">
                <span className="font-medium">{it.modelo}</span><span>{it.talla}</span><span>{it.color}</span>
                <span className="tabular text-right font-bold">{it.cantidad}</span>
                <span className="tabular text-right">{money(Number(it.subtotal), cur)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between border-t pt-4">
            <span className="text-muted-foreground">Total pares: <b className="text-foreground">{s.total_pares}</b></span>
            <span className="tabular text-2xl font-extrabold">{money(Number(s.total), cur)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
