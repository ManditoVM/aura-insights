import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquare, Send, X, Loader2 } from "lucide-react";
import { publicChat } from "@/lib/aura.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

function clean(text: string) {
  return text
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/[*_`#>]/g, "")
    .replace(/^\s*[-•]\s?/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hola, soy el asistente de AURA AI. Puedo ayudarte con precios, disponibilidad y características de los productos del catálogo. ¿Qué buscas?",
};

const SUGGESTIONS = [
  "¿Qué productos tienen disponibles?",
  "Busco algo de menos de $2,000",
  "¿Tienen stock del producto más popular?",
];

export function PublicChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const send = useServerFn(publicChat);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = async (text: string) => {
    const clean = text.trim();
    if (!clean || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await send({
        data: { messages: next.filter((m) => m !== WELCOME).map((m) => ({ role: m.role, content: m.content })) },
      });
      setMessages([...next, { role: "assistant", content: reply.content }]);
    } catch (error) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `No pude responder: ${error.message}`
              : "No pude responder en este momento.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        className="fixed bottom-5 right-5 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-primary p-4 text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      {open && (
        <div className="panel fixed bottom-24 right-5 z-40 flex h-[30rem] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden">
          <div className="border-b border-border/60 px-4 py-3">
            <p className="text-display text-sm font-semibold">Asistente AURA</p>
            <p className="text-xs text-muted-foreground">Responde solo con el catálogo real</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Consultando el catálogo…
              </div>
            )}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void submit(s)}
                    className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit(input);
            }}
            className="flex items-center gap-2 border-t border-border/60 p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
