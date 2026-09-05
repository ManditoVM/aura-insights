import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Brain,
  LineChart,
  ShieldCheck,
  Boxes,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Bot,
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { AuraMark } from "@/components/aura-mark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AURA AI — Gestión empresarial con inteligencia artificial" },
      {
        name: "description",
        content:
          "Plataforma que unifica clientes, inventario, pedidos y analítica, y usa IA para predecir demanda, detectar anomalías y recomendar abastecimiento.",
      },
      { property: "og:title", content: "AURA AI — Gestión empresarial con inteligencia artificial" },
      {
        property: "og:description",
        content:
          "Analizar, predecir, detectar, recomendar y asistir: la operación completa de tu negocio en una sola plataforma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Boxes,
    title: "Inventario transaccional",
    text: "Cada entrada, salida y ajuste queda registrado con stock anterior, posterior, motivo y responsable. El stock nunca cambia sin evidencia.",
  },
  {
    icon: LineChart,
    title: "Predicción de demanda",
    text: "Regresión sobre el historial real de ventas para estimar la demanda de los próximos 7 días, con tendencia y nivel de confianza.",
  },
  {
    icon: AlertTriangle,
    title: "Detección de anomalías",
    text: "Identifica picos y caídas atípicas de venta mediante puntuación z sobre la serie diaria de cada producto.",
  },
  {
    icon: Brain,
    title: "Recomendación de abastecimiento",
    text: "Sugiere cuánto comprar según stock, mínimo, velocidad de venta y días estimados hasta el agotamiento, con justificación.",
  },
  {
    icon: Sparkles,
    title: "Asistente AURA accionable",
    text: "Responde con datos reales de la base y puede proponer entradas de inventario o pedidos, siempre con confirmación explícita.",
  },
  {
    icon: ShieldCheck,
    title: "Seguridad por rol",
    text: "Administrador, empleado y cliente con permisos separados, reglas de acceso a nivel de fila y auditoría de operaciones críticas.",
  },
];

const STEPS = [
  { n: "01", t: "Registra la operación", d: "Clientes, catálogo, pedidos y movimientos de inventario en un solo lugar." },
  { n: "02", t: "AURA analiza", d: "Calcula rotación, tendencia, riesgo de agotamiento y anomalías sobre datos reales." },
  { n: "03", t: "Recibe recomendaciones", d: "Alertas priorizadas y sugerencias de compra con justificación transparente." },
  { n: "04", t: "Ejecuta con control", d: "Confirmas la acción y el sistema registra transacción, movimiento y auditoría." },
];

function Landing() {
  return (
    <PublicShell>
      <section className="grid-backdrop border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
              <AuraMark className="h-4 w-4" /> AI Unified Resource Assistant
            </span>
            <h1 className="text-display mt-6 text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
              La operación de tu negocio, <span className="text-primary">entendida por una IA</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
              AURA AI unifica clientes, catálogo, inventario, pedidos y control transaccional; después
              convierte esos datos en predicciones, alertas y recomendaciones accionables.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Iniciar sesión <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/catalogo"
                className="inline-flex items-center gap-2 rounded-md border border-border/60 px-5 py-3 text-sm font-medium transition-colors hover:bg-accent/40"
              >
                Explorar productos
              </Link>
            </div>
            <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                ["Módulos operativos", "11"],
                ["Modelos analíticos", "4"],
                ["Roles con permisos", "3"],
                ["Auditoría", "100%"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dd className="text-numeric text-2xl font-semibold text-foreground">{value}</dd>
                  <dt className="mt-1 text-xs text-muted-foreground">{label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Características
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Cada capacidad opera sobre la misma base de datos: sin métricas simuladas ni cifras inventadas.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="panel p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Cómo funciona
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n}>
                <p className="text-numeric text-sm text-primary">{s.n}</p>
                <h3 className="mt-2 text-sm font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Beneficios
            </h2>
            <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
              {[
                "Menos quiebres de stock: el sistema avisa antes de que el producto se agote.",
                "Compras justificadas: cada sugerencia indica el dato que la respalda.",
                "Trazabilidad total: cualquier cambio de existencias tiene su movimiento y su auditoría.",
                "Decisiones más rápidas: preguntas en lenguaje natural y respuestas con cifras reales.",
                "Atención continua: el asistente público resuelve dudas del catálogo a cualquier hora.",
              ].map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel flex flex-col justify-between gap-6 p-6">
            <div>
              <Bot className="h-6 w-6 text-primary" />
              <h3 className="text-display mt-4 text-lg font-semibold">
                ¿Dudas sobre un producto?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                El asistente de la esquina inferior consulta el catálogo real: precios, disponibilidad
                y alternativas cuando algo está agotado.
              </p>
            </div>
            <Link
              to="/catalogo"
              className="inline-flex w-fit items-center gap-2 rounded-md border border-border/60 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/40"
            >
              Ver catálogo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
