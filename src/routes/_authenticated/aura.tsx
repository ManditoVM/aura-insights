import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/data-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auraChat, executeAuraAction, type AuraAction } from "@/lib/aura.functions";
import { currency } from "@/lib/format";
import { Markdown } from "@/components/markdown";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/aura")({
  head: () => ({ meta: [
    { title: "Asistente AURA — AURA AI" },
    { name: "description", content: "Asistente empresarial con consultas de inventario, clientes y ventas en tiempo real." },
    { property: "og:title", content: "Asistente AURA — AURA AI" },
    { property: "og:description", content: "Consultas empresariales y operaciones supervisadas con AURA AI." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AuraPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "¿Qué productos están en riesgo de agotarse esta semana?",
  "¿Cómo van las ventas del mes comparadas con la tendencia?",
  "¿Detectaste alguna anomalía en las ventas?",
  "Registra una entrada de 20 unidades del producto con mayor riesgo",
];

function AuraPage() {
  const chat = useServerFn(auraChat);
  const execute = useServerFn(executeAuraAction);
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hola, soy **AURA**. Consulto la base de datos en tiempo real para responder sobre ventas, inventario, clientes y riesgos. También puedo preparar entradas de inventario o pedidos para que los confirmes.",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<AuraAction | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [messages, pending, send.isPending]);

  const send = useMutation({
    mutationFn: async (text: string) => {
      const next: Msg[] = [...messages, { role: "user", content: text }];
      setMessages(next);
      return chat({ data: { messages: next } });
    },
    onSuccess: (reply) => {
      setMessages((m) => [...m, { role: "assistant", content: reply.content }]);
      setPending(reply.action ?? null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirm = useMutation({
    mutationFn: (action: AuraAction) => execute({ data: { action } }),
    onSuccess: (r) => {
      toast.success(r.message);
      setMessages((m) => [...m, { role: "assistant", content: `✅ ${r.message}` }]);
      setPending(null);
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || send.isPending) return;
    setInput("");
    send.mutate(value);
  };

  return (
    <AppShell
      require="staff"
      title="Asistente AURA"
      description="Respuestas basadas en datos reales de la base de datos · las acciones requieren tu confirmación"
    >
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="panel flex h-[min(700px,calc(100dvh-11rem))] min-h-80 min-w-0 flex-col overflow-hidden p-4">
          <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden pr-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[80%] break-words rounded-lg bg-primary/15 px-3 py-2 text-sm"
                    : "max-w-[85%] break-words rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm leading-relaxed"
                }
              >
                {m.role === "user" ? m.content : <Markdown>{m.content}</Markdown>}
              </div>
            ))}
            {send.isPending && (
              <p className="text-xs text-muted-foreground">AURA está consultando la base de datos…</p>
            )}

            {pending && (
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <p className="text-sm font-medium">Confirmación requerida</p>
                </div>
                {pending.kind === "entrada_inventario" ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Entrada de <strong>{pending.quantity}</strong> unidades de{" "}
                    <strong>{pending.product_name}</strong>. Motivo: {pending.reason}
                  </p>
                ) : (
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>
                      Pedido para <strong>{pending.customer_name}</strong>
                    </p>
                    {pending.items.map((i) => (
                      <p key={i.product_id}>
                        · {i.quantity} × {i.product_name} ({currency(i.unit_price)})
                      </p>
                    ))}
                    <p className="text-foreground">Total con IVA: {currency(pending.total)}</p>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => confirm.mutate(pending)} disabled={confirm.isPending}>
                    Confirmar y ejecutar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
                    Descartar
                  </Button>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="mt-4 flex shrink-0 gap-2 border-t border-border pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre ventas, inventario, clientes o pide una operación…"
            />
            <Button type="submit" disabled={send.isPending}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>

        <Panel title="Sugerencias" description="Consultas de ejemplo para la demostración">
          <div className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <Button
                key={s}
                onClick={() => submit(s)}
                variant="outline"
                className="h-auto w-full justify-start whitespace-normal text-left text-xs text-muted-foreground"
              >
                {s}
              </Button>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
