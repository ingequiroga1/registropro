import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Layers, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, StockBadge } from "@/components/pos/StockBadge";
import { errMsg, money, moverInventario, sortTallas, stockLevel, useCatalog, useInvalidateAll, useProfile, type ProductWithVariants } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/productos")({
  head: () => ({ meta: [{ title: "Productos — PasoPOS" }, { name: "description", content: "Modelos de calzado, precios y variantes." }] }),
  component: Productos,
});

function Productos() {
  const catalog = useCatalog();
  const profile = useProfile();
  const [edit, setEdit] = useState<ProductWithVariants | "new" | null>(null);
  const [vars, setVars] = useState<string | null>(null);
  const cur = profile.data?.moneda ?? "MXN";
  const varProduct = catalog.data?.find((p) => p.id === vars) ?? null;

  return (
    <>
      <PageHeader title="Productos" subtitle={`${catalog.data?.length ?? 0} modelos registrados`}>
        <Button onClick={() => setEdit("new")} className="rounded-xl"><Plus className="mr-1 h-4 w-4" />Agregar producto</Button>
      </PageHeader>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {catalog.data?.map((p) => {
          const pares = p.product_variants.reduce((a, v) => a + v.stock_actual, 0);
          return (
            <div key={p.id} className="flex flex-col rounded-2xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{p.modelo}</div>
                  <div className="text-xs text-muted-foreground">{p.codigo} · {p.categoria}{p.marca ? ` · ${p.marca}` : ""}</div>
                </div>
                {!p.activo && <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Inactivo</span>}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                {[["Par", p.precio_par], ["½ docena", p.precio_media_docena], ["Docena", p.precio_docena]].map(([l, v]) => (
                  <div key={l as string} className="rounded-xl bg-muted/60 py-2">
                    <div className="text-muted-foreground">{l}</div>
                    <div className="tabular font-semibold">{money(Number(v), cur)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm text-muted-foreground">{p.product_variants.length} variantes · <span className="font-semibold text-foreground">{pares}</span> pares</div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => setVars(p.id)}><Layers className="mr-1 h-4 w-4" />Variantes</Button>
                <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setEdit(p)}><Pencil className="h-4 w-4" /></Button>
              </div>
            </div>
          );
        })}
      </div>
      {edit && <ProductForm product={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
      {varProduct && <VariantsDialog product={varProduct} onClose={() => setVars(null)} />}
    </>
  );
}

function ProductForm({ product, onClose }: { product: ProductWithVariants | null; onClose: () => void }) {
  const invalidate = useInvalidateAll();
  const [f, setF] = useState({
    codigo: product?.codigo ?? "", modelo: product?.modelo ?? "", nombre: product?.nombre ?? "", marca: product?.marca ?? "",
    categoria: product?.categoria ?? "Tenis", descripcion: product?.descripcion ?? "",
    precio_par: String(product?.precio_par ?? ""), precio_media_docena: String(product?.precio_media_docena ?? ""),
    precio_docena: String(product?.precio_docena ?? ""), costo: product?.costo != null ? String(product.costo) : "",
    imagen_url: product?.imagen_url ?? "", activo: product?.activo ?? true,
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const row = {
      codigo: f.codigo.trim(), modelo: f.modelo.trim(), nombre: f.nombre.trim() || f.modelo.trim(), marca: f.marca || null,
      categoria: f.categoria || "General", descripcion: f.descripcion || null,
      precio_par: Number(f.precio_par) || 0, precio_media_docena: Number(f.precio_media_docena) || 0, precio_docena: Number(f.precio_docena) || 0,
      costo: f.costo ? Number(f.costo) : null, imagen_url: f.imagen_url || null, activo: f.activo,
    };
    const { error } = product
      ? await supabase.from("products").update(row).eq("id", product.id)
      : await supabase.from("products").insert(row);
    if (error) return void toast.error(error.code === "23505" ? "Ya existe un producto con ese código." : errMsg(error));
    toast.success("Producto guardado.");
    invalidate();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader><DialogTitle>{product ? "Editar producto" : "Nuevo producto"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid grid-cols-2 gap-3">
          <Field label="Código *"><Input required value={f.codigo} onChange={set("codigo")} placeholder="TEN520" /></Field>
          <Field label="Modelo *"><Input required value={f.modelo} onChange={set("modelo")} placeholder="Tenis 520" /></Field>
          <Field label="Nombre"><Input value={f.nombre} onChange={set("nombre")} /></Field>
          <Field label="Marca"><Input value={f.marca} onChange={set("marca")} /></Field>
          <Field label="Categoría"><Input value={f.categoria} onChange={set("categoria")} /></Field>
          <Field label="Costo"><Input type="number" step="0.01" value={f.costo} onChange={set("costo")} /></Field>
          <Field label="Precio por par"><Input type="number" step="0.01" value={f.precio_par} onChange={set("precio_par")} /></Field>
          <Field label="Precio media docena"><Input type="number" step="0.01" value={f.precio_media_docena} onChange={set("precio_media_docena")} /></Field>
          <Field label="Precio docena"><Input type="number" step="0.01" value={f.precio_docena} onChange={set("precio_docena")} /></Field>
          <Field label="Foto (enlace)"><Input value={f.imagen_url} onChange={set("imagen_url")} /></Field>
          <div className="col-span-2"><Field label="Descripción"><Textarea value={f.descripcion} onChange={set("descripcion")} /></Field></div>
          <label className="col-span-2 flex items-center gap-2 text-sm"><Switch checked={f.activo} onCheckedChange={(v) => setF({ ...f, activo: v })} /> Activo</label>
          <Button type="submit" className="col-span-2 h-11 rounded-xl">Guardar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}

function VariantsDialog({ product, onClose }: { product: ProductWithVariants; onClose: () => void }) {
  const invalidate = useInvalidateAll();
  const [color, setColor] = useState("");
  const [tallas, setTallas] = useState("");
  const vs = [...product.product_variants].sort((a, b) => a.color.localeCompare(b.color) || sortTallas(a.talla, b.talla));

  async function addVariants(e: React.FormEvent) {
    e.preventDefault();
    const list = tallas.split(/[,\s]+/).filter(Boolean);
    if (!color.trim() || !list.length) return void toast.error("Escribe un color y al menos una talla.");
    try {
      for (const t of list) await moverInventario({ productId: product.id, color, talla: t, cantidad: 0, tipo: "ajuste", modo: "sumar", referencia: "Alta de variante" });
      toast.success("Variantes agregadas.");
      setTallas("");
      invalidate();
    } catch (err) { toast.error(errMsg(err)); }
  }
  async function updMin(id: string, v: number) {
    const { error } = await supabase.from("product_variants").update({ stock_minimo: v }).eq("id", id);
    if (error) toast.error(errMsg(error)); else invalidate();
  }
  async function del(id: string) {
    const { error } = await supabase.from("product_variants").delete().eq("id", id);
    if (error) toast.error("No se puede eliminar: tiene ventas registradas."); else invalidate();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader><DialogTitle>Variantes · {product.modelo}</DialogTitle></DialogHeader>
        <form onSubmit={addVariants} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} />
          <Input placeholder="Tallas: 23, 24, 25" value={tallas} onChange={(e) => setTallas(e.target.value)} />
          <Button type="submit"><Plus className="h-4 w-4" /></Button>
        </form>
        <p className="text-xs text-muted-foreground">Las existencias se cargan en Conteo físico o Entradas.</p>
        <div className="divide-y rounded-xl border">
          {vs.map((v) => (
            <div key={v.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="w-20 font-medium">{v.color}</span>
              <span className="w-10">T{v.talla}</span>
              <span className="tabular w-10 font-bold">{v.stock_actual}</span>
              <StockBadge level={stockLevel(v)} />
              <label className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">Mín
                <Input type="number" min={0} defaultValue={v.stock_minimo} onBlur={(e) => updMin(v.id, parseInt(e.target.value) || 0)} className="h-8 w-14" />
              </label>
              <button onClick={() => del(v.id)} className="text-muted-foreground hover:text-destructive" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {vs.length === 0 && <p className="p-3 text-sm text-muted-foreground">Sin variantes.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
