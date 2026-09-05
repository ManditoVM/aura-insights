import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AuraMark } from "@/components/aura-mark";
import { PublicChat } from "@/components/public-chat";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <AuraMark className="h-7 w-7" />
            <span className="text-display text-base font-semibold tracking-tight">AURA AI</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/catalogo"
              className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
            >
              Catálogo
            </Link>
            <Link
              to="/auth"
              className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Iniciar sesión
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-20 border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>AURA AI — AI Unified Resource Assistant. Proyecto académico con datos demostrativos ficticios.</p>
          <p>Analizar · Predecir · Detectar · Recomendar · Asistir</p>
        </div>
      </footer>

      <PublicChat />
    </div>
  );
}
