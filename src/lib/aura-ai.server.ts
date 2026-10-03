import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

const MODEL = "openai/gpt-6-astra";

export async function writeExecutiveBriefing(context: unknown) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("El servicio de IA no está configurado.");
  let runId: string | undefined;
  const openai = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
      return response;
    },
  });
  const messages: ModelMessage[] = [
    { role: "system", content: "Eres AURA. Redacta un informe ejecutivo profesional en español, claro y conciso, con hasta cinco prioridades. Usa solo cifras del contexto, sin inventar. Identifica dato real, estimación y recomendación. No incluyas bloques de código ni JSON. No muestres caracteres de formato sin propósito." },
    { role: "user", content: JSON.stringify(context) },
  ];
  const result = streamText({
    model: openai.responses(MODEL), messages, maxRetries: 0,
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: "medium", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
  });
  const text = (await result.text).trim();
  if (!text) throw new Error("AURA no devolvió un informe. Intenta de nuevo más tarde.");
  return text;
}