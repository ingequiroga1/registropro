import { createFileRoute, Link } from "@tanstack/react-router";
import { Footprints, Layers, Boxes, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PasoPOS — Inventario y ventas para zapaterías" },
      { name: "description", content: "Controla tu calzado por modelo, talla y color. Vende por pieza, media docena y docena mixta." },
      { property: "og:title", content: "PasoPOS — Inventario y ventas para zapaterías" },
      { property: "og:description", content: "Docenas mixtas de diferentes modelos, tallas y colores con inventario exacto." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Footprints className="h-7 w-7" />
      </div>
      <h1 className="max-w-xl text-4xl font-extrabold tracking-tight md:text-5xl">El punto de venta que sí entiende la docena mixta</h1>
      <p className="mt-4 max-w-md text-muted-foreground">Inventario exacto por modelo, talla y color. Vende por pieza, media docena o docena en segundos.</p>
      <div className="mt-8 flex gap-3">
        <Button asChild size="lg" className="rounded-xl"><Link to="/dashboard">Entrar</Link></Button>
        <Button asChild size="lg" variant="outline" className="rounded-xl"><Link to="/auth">Crear cuenta</Link></Button>
      </div>
      <div className="mt-14 grid max-w-2xl gap-4 sm:grid-cols-3">
        {[
          { i: Layers, t: "Docena mixta", d: "Combina modelos, tallas y colores hasta 12/12." },
          { i: Boxes, t: "Stock exacto", d: "Cada par se descuenta al vender." },
          { i: ShoppingCart, t: "Captura rápida", d: "Busca “520”, elige talla y listo." },
        ].map((f) => (
          <div key={f.t} className="rounded-2xl border bg-card p-5 text-left">
            <f.i className="h-5 w-5 text-primary" />
            <div className="mt-3 font-semibold">{f.t}</div>
            <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
