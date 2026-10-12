import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/pos/StockBadge";
import { money, TIPO_LABEL, useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/ventas/")({
  head: () => ({ meta: [{ title: "Ventas — PasoPOS" }, { name: "description", content: "Historial de ventas." }] }),
  component: Ventas,
});

function Ventas() {
  const profile = useProfile();
  const sales = useQuery({
    queryKey: ["sales", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("*, customers(nombre)").order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      return data;
    },
  });
  const cur = profile.data?.moneda ?? "MXN";
  return (
    <>
      <PageHeader title="Ventas" subtitle="Toca una venta para ver su contenido." />
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>{["Folio", "Fecha", "Cliente", "Tipo", "Pares", "Total", "Pago"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-2.5 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {sales.data?.map((s) => (
              <tr key={s.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-semibold text-primary"><Link to="/ventas/$id" params={{ id: s.id }}>{s.folio}</Link></td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString("es-MX")}</td>
                <td className="whitespace-nowrap px-4 py-3">{s.customers?.nombre ?? "Cliente general"}</td>
                <td className="px-4 py-3">{TIPO_LABEL[s.tipo_venta]}</td>
                <td className="tabular px-4 py-3">{s.total_pares}</td>
                <td className="tabular whitespace-nowrap px-4 py-3 font-semibold">{money(Number(s.total), cur)}</td>
                <td className="px-4 py-3">{s.forma_pago}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.isSuccess && sales.data.length === 0 && <p className="p-5 text-sm text-muted-foreground">Sin ventas todavía.</p>}
      </div>
    </>
  );
}
