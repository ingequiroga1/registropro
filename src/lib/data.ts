import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;
export type Variant = Tables<"product_variants">;
export type Profile = Tables<"profiles">;
export type ProductWithVariants = Product & { product_variants: Variant[] };

export type StockLevel = "ok" | "low" | "out";
export function stockLevel(v: Pick<Variant, "stock_actual" | "stock_minimo">): StockLevel {
  if (v.stock_actual <= 0) return "out";
  if (v.stock_actual <= v.stock_minimo) return "low";
  return "ok";
}

export function sortTallas(a: string, b: string) {
  const na = parseFloat(a), nb = parseFloat(b);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  return a.localeCompare(b);
}

export function money(n: number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency, maximumFractionDigits: 2 }).format(n || 0);
}

export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: string }).message);
  return "Ocurrió un error";
}

export const TIPO_LABEL: Record<string, string> = {
  pieza: "Pieza",
  media_docena: "Media docena",
  docena: "Docena",
};

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("No autenticado");
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (data) return data;
      const { data: created, error } = await supabase.from("profiles").insert({ id: u.user.id }).select("*").single();
      if (error) throw error;
      return created;
    },
  });
}

export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .order("modelo");
      if (error) throw error;
      return data as ProductWithVariants[];
    },
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("nombre");
      if (error) throw error;
      return data;
    },
  });
}

export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export async function moverInventario(args: {
  productId: string; color: string; talla: string; cantidad: number;
  tipo: "entrada" | "conteo" | "ajuste" | "devolucion"; modo: "sumar" | "fijar"; referencia?: string;
}) {
  const { data, error } = await supabase.rpc("mover_inventario", {
    p_product_id: args.productId, p_color: args.color, p_talla: args.talla,
    p_cantidad: args.cantidad, p_tipo: args.tipo, p_modo: args.modo, ...(args.referencia ? { p_referencia: args.referencia } : {}),
  });
  if (error) throw error;
  return data;
}
