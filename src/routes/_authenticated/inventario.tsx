import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, SizeChip } from "@/components/pos/StockBadge";
import { errMsg, moverInventario, sortTallas, stockLevel, useCatalog, useInvalidateAll, useUser, type Variant } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/inventario")({
  head: () => ({ meta: [{ title: "Inventario — PasoPOS" }, { name: "description", content: "Existencias por modelo, color y talla." }] }),
  component: Inventario,
});

const MOV_LABEL: Record<string, string> = { entrada: "Entrada", venta: "Venta", ajuste: "Ajuste", conteo: "Conteo físico", devolucion: "Devolución" };

function Inventario() {
  return (
    <>
      <PageHeader title="Inventario" subtitle="Verde suficiente · Naranja bajo · Rojo agotado" />
      <Tabs defaultValue="stock">
        <TabsList className="mb-4">
          <TabsTrigger value="stock">Existencias</TabsTrigger>
          <TabsTrigger value="entrada">Entrada de mercancía</TabsTrigger>
          <TabsTrigger value="movs">Movimientos</TabsTrigger>
        </TabsList>
        <TabsContent value="stock"><Existencias /></TabsContent>
        <TabsContent value="entrada"><Entrada /></TabsContent>
        <TabsContent value="movs"><Movimientos /></TabsContent>
      </Tabs>
    </>
  );
}

function Existencias() {
  const catalog = useCatalog();
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out: { key: string; modelo: string; codigo: string; color: string; vs: Variant[] }[] = [];
    for (const p of catalog.data ?? []) {
      const colors = [...new Set(p.product_variants.map((v) => v.color))].sort();
      for (const c of colors) {
        let vs = p.product_variants.filter((v) => v.color === c);
        const hay = [p.modelo, p.codigo, c].some((f) => f.toLowerCase().includes(s));
        if (s && !hay) {
          vs = vs.filter((v) => v.talla.toLowerCase() === s);
          if (!vs.length) continue;
        }
        out.push({ key: p.id + c, modelo: p.modelo, codigo: p.codigo, color: c, vs: [...vs].sort((a, b) => sortTallas(a.talla, b.talla)) });
      }
    }
    return out;
  }, [catalog.data, q]);

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por modelo, código, talla o color" className="h-12 rounded-xl pl-11" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g.key} className="rounded-2xl border bg-card p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <div className="font-bold">{g.modelo}</div>
                <div className="text-xs text-muted-foreground">{g.codigo} · Color: <span className="font-medium text-foreground">{g.color}</span></div>
              </div>
              <div className="text-sm text-muted-foreground"><span className="tabular font-bold text-foreground">{g.vs.reduce((a, v) => a + v.stock_actual, 0)}</span> pares</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {g.vs.map((v) => <SizeChip key={v.id} talla={v.talla} stock={v.stock_actual} level={stockLevel(v)} />)}
            </div>
          </div>
        ))}
        {catalog.isSuccess && groups.length === 0 && <p className="text-sm text-muted-foreground">No hay resultados.</p>}
      </div>
    </div>
  );
}

function Entrada() {
  const catalog = useCatalog();
  const invalidate = useInvalidateAll();
  const [pid, setPid] = useState("");
  const [color, setColor] = useState("");
  const [talla, setTalla] = useState("");
  const [cant, setCant] = useState("");
  const [saving, setSaving] = useState(false);
  const product = catalog.data?.find((p) => p.id === pid);
  const colors = [...new Set(product?.product_variants.map((v) => v.color) ?? [])];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(cant);
    if (!pid || !color.trim() || !talla.trim() || !(n > 0)) return void toast.error("Completa todos los campos.");
    setSaving(true);
    try {
      const nuevo = await moverInventario({ productId: pid, color, talla, cantidad: n, tipo: "entrada", modo: "sumar", referencia: "Entrada de mercancía" });
      toast.success(`Entrada registrada. Nuevo stock: ${nuevo} pares.`);
      setTalla(""); setCant("");
      invalidate();
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={save} className="max-w-xl space-y-3 rounded-2xl border bg-card p-5">
      <Select value={pid} onValueChange={(v) => { setPid(v); setColor(""); }}>
        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Modelo" /></SelectTrigger>
        <SelectContent>{catalog.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.modelo} · {p.codigo}</SelectItem>)}</SelectContent>
      </Select>
      <Input list="entrada-colors" placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 rounded-xl" />
      <datalist id="entrada-colors">{colors.map((c) => <option key={c} value={c} />)}</datalist>
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Talla" value={talla} onChange={(e) => setTalla(e.target.value)} className="h-11 rounded-xl" />
        <Input type="number" min={1} placeholder="Pares" value={cant} onChange={(e) => setCant(e.target.value)} className="h-11 rounded-xl" />
      </div>
      <Button disabled={saving} className="h-11 w-full rounded-xl"><PackagePlus className="mr-2 h-4 w-4" />Registrar entrada</Button>
    </form>
  );
}

function Movimientos() {
  const user = useUser();
  const movs = useQuery({
    queryKey: ["movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_movements")
        .select("*, product_variants(talla,color, products(modelo,codigo))")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
          <tr>{["Fecha", "Modelo", "Talla", "Color", "Cantidad", "Movimiento", "Anterior", "Nuevo", "Usuario"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y">
          {movs.data?.map((m) => (
            <tr key={m.id}>
              <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{new Date(m.created_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</td>
              <td className="whitespace-nowrap px-3 py-2.5 font-medium">{m.product_variants?.products?.modelo}</td>
              <td className="px-3 py-2.5">{m.product_variants?.talla}</td>
              <td className="px-3 py-2.5">{m.product_variants?.color}</td>
              <td className={`tabular px-3 py-2.5 font-bold ${m.cantidad < 0 ? "text-destructive" : "text-success"}`}>{m.cantidad > 0 ? "+" : ""}{m.cantidad}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{MOV_LABEL[m.tipo]}{m.referencia ? <span className="text-muted-foreground"> · {m.referencia}</span> : null}</td>
              <td className="tabular px-3 py-2.5">{m.stock_anterior}</td>
              <td className="tabular px-3 py-2.5 font-semibold">{m.stock_nuevo}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{user.data?.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {movs.isSuccess && movs.data.length === 0 && <p className="p-5 text-sm text-muted-foreground">Sin movimientos todavía.</p>}
    </div>
  );
}
