import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Alta idempotente de la cuenta: crea el perfil, asigna el rol inicial y
 * genera la ficha de cliente cuando corresponde.
 *
 * Regla de negocio para la demostración académica: el primer usuario que se
 * registra en la instancia se convierte en administrador; el resto entra como
 * cliente. Los roles nunca se asignan desde el navegador.
 */
export const bootstrapAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fullName?: string } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const email = (claims as { email?: string }).email ?? null;
    const fullName = data.fullName?.trim() || email?.split("@")[0] || "Usuario";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, full_name: fullName, email }, { onConflict: "id" });

    const { data: existingRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (!existingRoles || existingRoles.length === 0) {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");

      const role = (count ?? 0) === 0 ? "admin" : "customer";
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });

      if (role === "customer") {
        const { data: linked } = await supabaseAdmin
          .from("customers")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (!linked) {
          const [first, ...rest] = fullName.split(" ");
          await supabaseAdmin.from("customers").insert({
            user_id: userId,
            first_name: first ?? fullName,
            last_name: rest.join(" "),
            email,
          });
        }
      }
      return { role };
    }

    return { role: existingRoles[0].role };
  });
