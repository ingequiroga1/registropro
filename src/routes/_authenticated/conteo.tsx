import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Save, Lightbulb, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/pos/StockBadge";
import { errMsg, moverInventario, useCatalog, useInvalidateAll, useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/conteo")({
  head: () => ({ meta: [{ title: "Conteo físico — PasoPOS" }, { name: "description", content: "Carga tu inventario inicial poco a poco." }] }),
  component: Conteo,
});

function Conteo() {
  const catalog = useCatalog();
  const profile = useProfile();
  const invalidate = useInvalidateAll();
  const [pid, setPid] = useState("");
  const [color, setColor] = useState("");
  const [talla, setTalla] = useState("");
  const [cant, setCant] = useState("");
  const [saving, setSaving] = useState(false);
  const [log, setLog] = useState<{ modelo: string; color: string; talla: string; cant: number }[]>([]);
  const tallaRef = useRef<HTMLInputElement>(null);

  const meta = profile.data?.meta_modelos ?? 150;
  const registered = catalog.data?.filter((p) => p.product_variants.some((v) => v.stock_actual > 0)).length ?? 0;
  const pct = Math.min(100, Math.round((registered / meta) * 100));
  const product = catalog.data?.find((p) => p.id === pid);
  const colors = [...new Set(product?.product_variants.map((v) => v.color) ?? [])];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(cant);
    if (!product || !color.trim() || !talla.trim() || isNaN(n) || n < 0) return void toast.error("Completa modelo, color, talla y cantidad.");
    setSaving(true);
    try {
      await moverInventario({ productId: product.id, color, talla, cantidad: n, tipo: "conteo", modo: "fijar", referencia: "Conteo físico" });
      setLog((l) => [{ modelo: product.modelo, color: color.trim(), talla: talla.trim(), cant: n }, ...l].slice(0, 20));
      setTalla(""); setCant("");
      invalidate();
      tallaRef.current?.focus();
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader title="Conteo físico inicial" subtitle="Registra lo que tienes en tienda, modelo por modelo." />
      <div className="mb-5 rounded-2xl border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">{registered} de {meta} modelos registrados</span>
          <span className="tabular text-2xl font-extrabold text-primary">{pct}%</span>
        </div>
        <Progress value={pct} className="mt-3 h-3" />
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4 text-warning" /> Puedes empezar cargando únicamente tus modelos más vendidos.
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <form onSubmit={save} className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="space-y-1.5">
            <Label>Modelo</Label>
            <Select value={pid} onValueChange={(v) => { setPid(v); setColor(""); }}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selecciona un modelo" /></SelectTrigger>
              <SelectContent>{catalog.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.modelo} · {p.codigo}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">¿No aparece? <Link to="/productos" className="text-primary">Agrégalo en Productos</Link>.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <Input list="conteo-colors" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Negro" className="h-12 rounded-xl" />
            <datalist id="conteo-colors">{colors.map((c) => <option key={c} value={c} />)}</datalist>
            {colors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {colors.map((c) => <button type="button" key={c} onClick={() => setColor(c)} className={`rounded-lg border px-2.5 py-1 text-xs ${color === c ? "border-primary bg-primary-soft text-accent-foreground" : ""}`}>{c}</button>)}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Talla</Label><Input ref={tallaRef} value={talla} onChange={(e) => setTalla(e.target.value)} placeholder="23" className="h-12 rounded-xl text-lg" /></div>
            <div className="space-y-1.5"><Label>Cantidad de pares</Label><Input type="number" min={0} value={cant} onChange={(e) => setCant(e.target.value)} placeholder="6" className="h-12 rounded-xl text-lg" /></div>
          </div>
          <Button disabled={saving} className="h-12 w-full rounded-xl text-base"><Save className="mr-2 h-5 w-5" />Guardar y continuar</Button>
        </form>

        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 font-semibold">Registrado en esta sesión</div>
          {log.length === 0 ? <p className="text-sm text-muted-foreground">Aún nada.</p> : (
            <ul className="space-y-2 text-sm">
              {log.map((l, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="font-medium">{l.modelo}</span><span className="text-muted-foreground">{l.color} · T{l.talla}</span>
                  <span className="tabular ml-auto font-bold">{l.cant}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
