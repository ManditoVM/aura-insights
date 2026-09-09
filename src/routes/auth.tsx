import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { bootstrapAccount } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuraMark } from "@/components/aura-mark";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceder a AURA AI — Panel inteligente" },
      {
        name: "description",
        content:
          "Inicia sesión o crea tu cuenta para acceder al panel de gestión inteligente de AURA AI.",
      },
      { property: "og:title", content: "Acceder a AURA AI" },
      { property: "og:description", content: "Acceso al panel de gestión inteligente AURA AI." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const bootstrap = useServerFn(bootstrapAccount);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const finish = async (name?: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    let role: string = "customer";

    if (user) {
      // Camino rápido: si la cuenta ya tiene rol, evitamos la llamada de alta.
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (roles && roles.length > 0) {
        role = roles.find((r) => r.role === "admin")?.role ?? roles[0]!.role;
      } else {
        const result = await bootstrap({ data: name ? { fullName: name } : {} });
        role = result.role;
      }
    }

    toast.success("Sesión iniciada");
    await navigate({ to: role === "customer" ? "/mis-pedidos" : "/dashboard" });
  };

  const translate = (message: string) => {
    if (/invalid login credentials/i.test(message)) return "Correo o contraseña incorrectos.";
    if (/email not confirmed/i.test(message)) return "Tu correo aún no está confirmado.";
    if (/already registered/i.test(message)) return "Ese correo ya tiene una cuenta.";
    if (/at least 6 characters/i.test(message)) return "La contraseña debe tener al menos 6 caracteres.";
    return message;
  };

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      toast.error(translate(error.message));
      setLoading(false);
      return;
    }
    await finish();
    setLoading(false);
  };


  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast.success("Cuenta creada. Revisa tu correo para confirmarla.");
      setLoading(false);
      return;
    }
    await finish(fullName);
    setLoading(false);
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("No fue posible iniciar sesión con Google");
      return;
    }
    if (result.redirected) return;
    await finish();
  };

  return (
    <main className="grid-backdrop flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <AuraMark className="size-9" />
          <span className="text-display text-xl font-semibold">AURA AI</span>
        </Link>

        <div className="panel p-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={onSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={onSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nombre y apellido"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Correo</Label>
                  <Input
                    id="email2"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Contraseña</Label>
                  <Input
                    id="password2"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  Crear cuenta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />o continúa con
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={onGoogle}>
            Google
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          El primer usuario registrado obtiene el rol de administrador para la demostración. El
          resto ingresa como cliente.
        </p>
      </div>
    </main>
  );
}
