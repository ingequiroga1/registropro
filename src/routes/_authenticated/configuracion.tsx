import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/pos/StockBadge";
import { errMsg, useCustomers, useInvalidateAll, useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — PasoPOS" }, { name: "description", content: "Datos del negocio, docenas y clientes." }] }),
  component: Config,
});

function Config() {
  const profile = useProfile();
  const invalidate = useInvalidateAll();
  const [f, setF] = useState({ negocio: "", nombre: "", telefono: "", moneda: "MXN", stock_minimo_default: "2", pares_media_docena: "6", pares_docena: "12", meta_modelos: "150" });
  useEffect(() => {
    const p = profile.data;
    if (p) setF({ negocio: p.negocio ?? "", nombre: p.nombre ?? "", telefono: p.telefono ?? "", moneda: p.moneda, stock_minimo_default: String(p.stock_minimo_default), pares_media_docena: String(p.pares_media_docena), pares_docena: String(p.pares_docena), meta_modelos: String(p.meta_modelos) });
  }, [profile.data]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile.data) return;
    const { error } = await supabase.from("profiles").update({
      negocio: f.negocio, nombre: f.nombre, telefono: f.telefono, moneda: f.moneda.toUpperCase() || "MXN",
      stock_minimo_default: parseInt(f.stock_minimo_default) || 2, pares_media_docena: parseInt(f.pares_media_docena) || 6,
      pares_docena: parseInt(f.pares_docena) || 12, meta_modelos: parseInt(f.meta_modelos) || 150,
    }).eq("id", profile.data.id);
    if (error) return void toast.error(errMsg(error));
    toast.success("Configuración guardada.");
    invalidate();
  }

  return (
    <>
      <PageHeader title="Configuración" />
      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={save} className="grid grid-cols-2 gap-3 rounded-2xl border bg-card p-5">
          <h2 className="col-span-2 font-semibold">Negocio</h2>
          <F l="Nombre del negocio"><Input value={f.negocio} onChange={set("negocio")} /></F>
          <F l="Tu nombre"><Input value={f.nombre} onChange={set("nombre")} /></F>
          <F l="Teléfono"><Input value={f.telefono} onChange={set("telefono")} /></F>
          <F l="Moneda"><Input value={f.moneda} onChange={set("moneda")} maxLength={3} /></F>
          <F l="Stock mínimo predeterminado"><Input type="number" value={f.stock_minimo_default} onChange={set("stock_minimo_default")} /></F>
          <F l="Meta de modelos (conteo)"><Input type="number" value={f.meta_modelos} onChange={set("meta_modelos")} /></F>
          <F l="Pares por media docena"><Input type="number" value={f.pares_media_docena} onChange={set("pares_media_docena")} /></F>
          <F l="Pares por docena"><Input type="number" value={f.pares_docena} onChange={set("pares_docena")} /></F>
          <Button className="col-span-2 h-11 rounded-xl">Guardar</Button>
        </form>
        <Clientes />
      </div>
    </>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{l}</Label>{children}</div>;
}

function Clientes() {
  const customers = useCustomers();
  const invalidate = useInvalidateAll();
  const [c, setC] = useState({ nombre: "", telefono: "", whatsapp: "", direccion: "", notas: "" });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!c.nombre.trim()) return;
    const { error } = await supabase.from("customers").insert({ ...c, whatsapp: c.whatsapp || null, direccion: c.direccion || null, notas: c.notas || null });
    if (error) return void toast.error(errMsg(error));
    setC({ nombre: "", telefono: "", whatsapp: "", direccion: "", notas: "" });
    invalidate();
  }
  async function del(id: string) {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) toast.error(errMsg(error)); else invalidate();
  }
  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="mb-3 font-semibold">Clientes</h2>
      <form onSubmit={add} className="grid grid-cols-2 gap-2">
        <Input placeholder="Nombre *" value={c.nombre} onChange={(e) => setC({ ...c, nombre: e.target.value })} />
        <Input placeholder="Teléfono" value={c.telefono} onChange={(e) => setC({ ...c, telefono: e.target.value })} />
        <Input placeholder="WhatsApp" value={c.whatsapp} onChange={(e) => setC({ ...c, whatsapp: e.target.value })} />
        <Input placeholder="Dirección" value={c.direccion} onChange={(e) => setC({ ...c, direccion: e.target.value })} />
        <Input className="col-span-2" placeholder="Notas" value={c.notas} onChange={(e) => setC({ ...c, notas: e.target.value })} />
        <Button className="col-span-2 rounded-xl" variant="outline"><UserPlus className="mr-2 h-4 w-4" />Agregar cliente</Button>
      </form>
      <div className="mt-4 divide-y rounded-xl border">
        {customers.data?.map((x) => (
          <div key={x.id} className="flex items-center gap-2 px-3 py-2 text-sm">
            <span className="font-medium">{x.nombre}</span><span className="text-muted-foreground">{x.telefono}</span>
            <button onClick={() => del(x.id)} className="ml-auto text-muted-foreground hover:text-destructive" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {customers.data?.length === 0 && <p className="p-3 text-sm text-muted-foreground">Sin clientes. Las ventas usan “Cliente general”.</p>}
      </div>
    </div>
  );
}
