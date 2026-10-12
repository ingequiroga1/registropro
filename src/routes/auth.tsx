import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Footprints } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — PasoPOS" },
      { name: "description", content: "Accede a tu punto de venta de calzado." },
      { property: "og:title", content: "Iniciar sesión — PasoPOS" },
      { property: "og:description", content: "Accede a tu punto de venta de calzado." },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/dashboard" } });
        if (error) throw error;
        toast.success("Revisa tu correo para confirmar tu cuenta.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        toast.success("Te enviamos un enlace para recuperar tu contraseña.");
        setMode("login");
      }
    } catch (err) {
      const m = (err as Error).message;
      toast.error(m.includes("Invalid login") ? "Correo o contraseña incorrectos." : m);
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "login" ? "Iniciar sesión" : mode === "signup" ? "Crear cuenta" : "Recuperar contraseña";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Footprints className="h-5 w-5" /></div>
          <span className="text-xl font-extrabold">PasoPOS</span>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-bold">{title}</h1>
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label htmlFor="pw">Contraseña</Label>
              <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" />
            </div>
          )}
          <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl">{loading ? "Un momento…" : title}</Button>
          <div className="flex flex-col gap-1 pt-1 text-center text-sm">
            {mode === "login" && (
              <>
                <button type="button" className="text-primary" onClick={() => setMode("forgot")}>¿Olvidaste tu contraseña?</button>
                <button type="button" className="text-muted-foreground" onClick={() => setMode("signup")}>¿No tienes cuenta? <span className="text-primary">Regístrate</span></button>
              </>
            )}
            {mode !== "login" && <button type="button" className="text-primary" onClick={() => setMode("login")}>Volver a iniciar sesión</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
