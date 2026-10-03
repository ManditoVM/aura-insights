import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AuraAction =
  | {
      kind: "entrada_inventario";
      product_id: string;
      product_name: string;
      quantity: number;
      reason: string;
    }
  | {
      kind: "crear_pedido";
      customer_id: string;
      customer_name: string;
      items: { product_id: string; product_name: string; quantity: number; unit_price: number }[];
      total: number;
    };

export type AuraReply = {
  content: string;
  action?: AuraAction;
};

const SYSTEM_PROMPT = `Eres AURA, el asistente de inteligencia empresarial de la plataforma AURA AI.

REGLAS ESTRICTAS:
- Responde ÚNICAMENTE con base en el CONTEXTO EMPRESARIAL en JSON que se te entrega. Es información real extraída de la base de datos en este momento.
- Nunca inventes cifras, productos ni clientes. Si un dato no está en el contexto, dilo con claridad y sugiere dónde consultarlo.
- Distingue siempre entre: dato real, cálculo, predicción y recomendación. Etiqueta las predicciones como estimaciones y menciona la confianza cuando exista.
- Responde en español, con formato markdown breve, listas y cifras concretas. Máximo ~180 palabras salvo que se pida detalle.
- Cuando el usuario pida ejecutar una operación (registrar entrada de inventario o crear un pedido), NO la ejecutes: usa la herramienta correspondiente para PROPONERLA. El administrador debe confirmarla en la interfaz.
- Nunca propongas eliminar información.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "proponer_entrada_inventario",
      description:
        "Propone registrar una entrada de inventario para un producto. Requiere confirmación del usuario.",
      parameters: {
        type: "object",
        properties: {
          sku: { type: "string", description: "SKU exacto del producto tomado del contexto" },
          quantity: { type: "number", description: "Unidades a ingresar" },
          reason: { type: "string", description: "Motivo del movimiento" },
        },
        required: ["sku", "quantity"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "proponer_pedido",
      description: "Propone crear un pedido para un cliente. Requiere confirmación del usuario.",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Nombre del cliente" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sku: { type: "string" },
                quantity: { type: "number" },
              },
              required: ["sku", "quantity"],
              additionalProperties: false,
            },
          },
        },
        required: ["customer_name", "items"],
        additionalProperties: false,
      },
    },
  },
];

/** Asistente administrativo: responde con datos reales y puede proponer acciones. */
export const auraChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messages: { role: "user" | "assistant"; content: string }[] }) => {
    if (!Array.isArray(input?.messages) || input.messages.length === 0) {
      throw new Error("Conversación vacía");
    }
    return { messages: input.messages.slice(-12) };
  })
  .handler(async ({ data, context }): Promise<AuraReply> => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Solo el personal autorizado puede usar el asistente AURA.");

    const { buildContextPack, callGateway } = await import("./aura.server");
    const pack = await buildContextPack(supabase);

    const result = await callGateway({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "system",
          content: `CONTEXTO EMPRESARIAL (JSON, datos reales):\n${JSON.stringify(pack)}`,
        },
        ...data.messages,
      ],
      tools: TOOLS,
    });

    const message = result.choices?.[0]?.message;
    const call = message?.tool_calls?.[0];

    if (!call) {
      return { content: message?.content ?? "No pude generar una respuesta." };
    }

    const args = JSON.parse(call.function.arguments || "{}");

    if (call.function.name === "proponer_entrada_inventario") {
      const { data: product } = await supabase
        .from("products")
        .select("id,name,sku")
        .eq("sku", args.sku)
        .maybeSingle();
      if (!product) {
        return { content: `No encontré el producto con SKU ${args.sku} en el catálogo.` };
      }
      const quantity = Math.max(1, Math.round(Number(args.quantity) || 0));
      return {
        content: `Preparé una **entrada de inventario** de ${quantity} unidades de **${product.name}**. Revisa y confirma la operación para ejecutarla.`,
        action: {
          kind: "entrada_inventario",
          product_id: product.id,
          product_name: product.name,
          quantity,
          reason: args.reason || "Entrada registrada por el asistente AURA",
        },
      };
    }

    if (call.function.name === "proponer_pedido") {
      const name: string = args.customer_name ?? "";
      const { data: customers } = await supabase
        .from("customers")
        .select("id,first_name,last_name")
        .limit(400);
      const match = (customers ?? []).find((c) =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(name.toLowerCase().trim()),
      );
      if (!match) return { content: `No encontré al cliente "${name}" en la base de datos.` };

      const skus: string[] = (args.items ?? []).map((i: { sku: string }) => i.sku);
      const { data: products } = await supabase
        .from("products")
        .select("id,name,sku,price,stock")
        .in("sku", skus);

      const items = (args.items ?? [])
        .map((i: { sku: string; quantity: number }) => {
          const p = (products ?? []).find((x) => x.sku === i.sku);
          if (!p) return null;
          return {
            product_id: p.id,
            product_name: p.name,
            quantity: Math.max(1, Math.round(Number(i.quantity) || 1)),
            unit_price: Number(p.price),
          };
        })
        .filter(Boolean) as {
        product_id: string;
        product_name: string;
        quantity: number;
        unit_price: number;
      }[];

      if (items.length === 0) return { content: "No identifiqué productos válidos para el pedido." };

      const subtotal = items.reduce((a, i) => a + i.quantity * i.unit_price, 0);
      return {
        content: `Preparé un **pedido** para **${match.first_name} ${match.last_name}**. Revisa las líneas y confirma para crearlo en estado pendiente.`,
        action: {
          kind: "crear_pedido",
          customer_id: match.id,
          customer_name: `${match.first_name} ${match.last_name}`,
          items,
          total: Math.round(subtotal * 1.16 * 100) / 100,
        },
      };
    }

    return { content: message?.content ?? "No pude interpretar la solicitud." };
  });

/** Redacta y prioriza los insights del centro de inteligencia (AURA Insights). */
export const auraInsightsBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { force?: boolean } | undefined) => ({ force: input?.force === true }))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("No autorizado");

    if (!data.force) {
      const { data: saved, error } = await supabase.from("ai_insights")
        .select("body,generated_at")
        .eq("type", "resumen")
        .gte("generated_at", new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
        .order("generated_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw new Error(error.message);
      if (saved) return { briefing: saved.body, generatedAt: saved.generated_at };
    }
    const { buildContextPack } = await import("./aura.server");
    const { writeExecutiveBriefing } = await import("./aura-ai.server");
    const pack = await buildContextPack(supabase);
    const briefing = await writeExecutiveBriefing(pack);
    const { data: saved, error } = await supabase.from("ai_insights").insert({
      type: "resumen", severity: "insight", title: "Informe ejecutivo AURA",
      body: briefing, source: "ia", data: { ventas_mes_actual: pack.kpis.ventas_mes_actual },
    }).select("generated_at").single();
    if (error) throw new Error(`No se pudo guardar el informe: ${error.message}`);
    return { briefing, generatedAt: saved.generated_at };
  });

/** Reutiliza la instantánea reciente, o recalcula y registra todas las predicciones. */
export const auraPredictions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { force?: boolean } | undefined) => ({ force: input?.force === true }))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("No autorizado");
    const { data: latest, error: latestError } = await supabase.from("predictions")
      .select("generated_at").eq("horizon_days", 7).order("generated_at", { ascending: false }).limit(1).maybeSingle();
    if (latestError) throw new Error(latestError.message);
    if (!data.force && latest && new Date(latest.generated_at).getTime() > Date.now() - 4 * 60 * 60 * 1000) {
      const { data: rows, error } = await supabase.from("predictions")
        .select("product_id,estimated_demand,trend,confidence,generated_at")
        .eq("horizon_days", 7).eq("generated_at", latest.generated_at);
      if (error) throw new Error(error.message);
      if (rows?.length) return rows;
    }
    const { computeProductMetrics } = await import("./analytics");
    const since = new Date(Date.now() - 90 * 86_400_000).toISOString();
    const [{ data: products, error: productsError }, { data: items, error: itemsError }] = await Promise.all([
      supabase.from("products").select("id,sku,name,stock,min_stock,max_stock,price,cost,category_id"),
      supabase.from("order_items").select("product_id,quantity,line_total,created_at,orders!inner(status)")
        .gte("created_at", since).not("orders.status", "in", "(cancelado,pendiente)").limit(5000),
    ]);
    if (productsError || itemsError) throw new Error(productsError?.message ?? itemsError?.message);
    const metrics = computeProductMetrics((products ?? []).map((p) => ({ ...p, price: Number(p.price), cost: Number(p.cost) })),
      (items ?? []).map((r) => ({ ...r, line_total: Number(r.line_total) })));
    if (!metrics.length) return [];
    const generatedAt = new Date().toISOString();
    const { data: rows, error } = await supabase.from("predictions").insert(metrics.map((m) => ({
      product_id: m.product.id, horizon_days: 7, estimated_demand: m.forecast7,
      trend: m.trend, confidence: m.confidence, method: "regresion_lineal", generated_at: generatedAt,
    }))).select("product_id,estimated_demand,trend,confidence,generated_at");
    if (error) throw new Error(`No se pudieron guardar las predicciones: ${error.message}`);
    return rows;
  });

/** Ejecuta una acción propuesta por AURA, solo tras confirmación explícita. */
export const executeAuraAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { action: AuraAction }) => {
    if (!input?.action?.kind) throw new Error("Acción inválida");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("No autorizado");

    const action = data.action;

    if (action.kind === "entrada_inventario") {
      const { error } = await supabase.rpc("register_movement", {
        _product_id: action.product_id,
        _type: "entrada",
        _quantity: action.quantity,
        _reason: action.reason,
        _reference: "AURA",
      });
      if (error) throw new Error(error.message);
      return { ok: true, message: `Entrada de ${action.quantity} unidades registrada.` };
    }

    const subtotal = action.items.reduce((a, i) => a + i.quantity * i.unit_price, 0);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_id: action.customer_id,
        subtotal,
        tax: Math.round(subtotal * 0.16 * 100) / 100,
        total: Math.round(subtotal * 1.16 * 100) / 100,
        created_by: userId,
        notes: "Pedido preparado por el asistente AURA y confirmado por el usuario",
      })
      .select("id,code")
      .single();
    if (error) throw new Error(error.message);

    const { error: itemsError } = await supabase.from("order_items").insert(
      action.items.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: Math.round(i.quantity * i.unit_price * 100) / 100,
      })),
    );
    if (itemsError) throw new Error(itemsError.message);

    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "crear_pedido_aura",
      entity: "order",
      entity_id: order.id,
      new_data: { total: Math.round(subtotal * 1.16 * 100) / 100 },
    });

    return { ok: true, message: `Pedido ${order.code} creado en estado pendiente.` };
  });

/** Chatbot público del sitio: solo catálogo real, sin datos internos. */
export const publicChat = createServerFn({ method: "POST" })
  .inputValidator((input: { messages: { role: "user" | "assistant"; content: string }[] }) => {
    if (!Array.isArray(input?.messages) || input.messages.length === 0) {
      throw new Error("Conversación vacía");
    }
    return { messages: input.messages.slice(-10) };
  })
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const { callGateway } = await import("./aura.server");

    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: products } = await client
      .from("products")
      .select("sku,name,description,brand,price,stock,categories(name)")
      .eq("active", true)
      .limit(200);

    const catalog = (products ?? []).map((p) => ({
      sku: p.sku,
      nombre: p.name,
      marca: p.brand,
      categoria: Array.isArray(p.categories)
        ? (p.categories[0]?.name ?? null)
        : ((p.categories as { name: string } | null)?.name ?? null),
      precio: Number(p.price),
      disponible: p.stock > 0,
      unidades_disponibles: p.stock,
    }));

    const result = await callGateway({
      messages: [
        {
          role: "system",
          content:
            "Eres el asistente comercial de AURA AI. Respondes en español, breve y cordial. Usa ÚNICAMENTE el catálogo JSON entregado: precios, disponibilidad y características. Nunca inventes productos ni precios. Si algo está agotado, dilo y ofrece alternativas reales del catálogo dentro del mismo rango de precio. No compartas información interna de la empresa (inventarios completos, costos, clientes ni ventas).",
        },
        { role: "system", content: `CATÁLOGO:\n${JSON.stringify(catalog)}` },
        ...data.messages,
      ],
    });

    return { content: result.choices?.[0]?.message?.content ?? "No pude responder en este momento." };
  });
