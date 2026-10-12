import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Home, ShoppingCart, Boxes, Footprints, ClipboardCheck, Receipt, BarChart3, Settings, LogOut, MoreHorizontal,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useProfile } from "@/lib/data";

const NAV = [
  { to: "/dashboard", label: "Inicio", icon: Home },
  { to: "/venta", label: "Nueva venta", icon: ShoppingCart },
  { to: "/inventario", label: "Inventario", icon: Boxes },
  { to: "/productos", label: "Productos", icon: Footprints },
  { to: "/conteo", label: "Conteo físico", icon: ClipboardCheck },
  { to: "/ventas", label: "Ventas", icon: Receipt },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
  { to: "/configuracion", label: "Configuración", icon: Settings },
] as const;

const MOBILE_MAIN = NAV.filter((n) => ["/dashboard", "/venta", "/inventario", "/ventas"].includes(n.to));
const MOBILE_MORE = NAV.filter((n) => !MOBILE_MAIN.includes(n));

const linkCls =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-muted";
const activeCls = "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useProfile();
  const [more, setMore] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-sidebar p-4 lg:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Footprints className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-extrabold leading-tight">PasoPOS</div>
            <div className="truncate text-xs text-muted-foreground">{profile.data?.negocio ?? "Mi zapatería"}</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={linkCls} activeProps={{ className: activeCls }}>
              <n.icon className="h-[18px] w-[18px]" />
              {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={signOut} className={linkCls}>
          <LogOut className="h-[18px] w-[18px]" /> Cerrar sesión
        </button>
      </aside>

      <main className="px-4 pb-28 pt-6 md:px-8 lg:ml-64 lg:pb-10 lg:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {MOBILE_MAIN.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <n.icon className="h-5 w-5" />
            {n.label === "Nueva venta" ? "Vender" : n.label}
          </Link>
        ))}
        <button onClick={() => setMore(true)} className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground">
          <MoreHorizontal className="h-5 w-5" /> Más
        </button>
      </nav>

      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader><SheetTitle>Menú</SheetTitle></SheetHeader>
          <div className="grid gap-1 p-4 pt-0">
            {MOBILE_MORE.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setMore(false)} className={linkCls} activeProps={{ className: activeCls }}>
                <n.icon className="h-5 w-5" /> {n.label}
              </Link>
            ))}
            <button onClick={signOut} className={linkCls}><LogOut className="h-5 w-5" /> Cerrar sesión</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
