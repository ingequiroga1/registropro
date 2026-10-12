import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña — PasoPOS" },
      { name: "description", content: "Define una nueva contraseña para tu cuenta." },
      { property: "og:title", content: "Nueva contraseña — PasoPOS" },
      { property: "og:description", content: "Define una nueva contraseña para tu cuenta." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return void toast.error(error.message);
    toast.success("Contraseña actualizada.");
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6">
        <h1 className="text-xl font-bold">Nueva contraseña</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Contraseña</Label>
          <Input id="pw" type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} className="h-11 rounded-xl" />
        </div>
        <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl">Guardar</Button>
      </form>
    </div>
  );
}
