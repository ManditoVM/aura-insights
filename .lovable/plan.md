# AURA AI — Arquitectura propuesta

Plataforma SaaS de gestión empresarial con IA integrada (analizar → predecir → detectar → recomendar → asistir → actuar).

## 1. Stack y capas

- React + TypeScript + Vite, Tailwind, TanStack Router/Query (routing por archivos, SSR).
- Lovable Cloud (Postgres + Auth + Storage + RLS) como backend.
- IA vía Lovable AI (sin claves del usuario): insights, chat administrativo, chatbot público, tool-calling para acciones.

Separación de capas:

```text
src/routes/        páginas públicas + panel (_authenticated)
src/components/    UI reutilizable + módulos (tablas, formularios, gráficas)
src/lib/*.functions.ts   RPC servidor (reglas de negocio, IA)
src/lib/*.server.ts      helpers solo-servidor
src/types/         entidades y contratos
```

Regla clave: toda mutación crítica (stock, pedidos) ocurre en funciones de servidor o funciones SQL transaccionales, nunca desde el navegador.

## 2. Esquema de base de datos

- `profiles` (id → auth.users, nombre, estado)
- `user_roles` (tabla separada + enum `admin | employee | customer`, función `has_role`)
- `categories`, `products` (sku, precio, costo, stock, mín/máx, imagen, estado)
- `customers` (datos, vinculable a `profiles`)
- `orders` (cliente, estado, subtotal, impuestos, total, método de pago, creado_por)
- `order_items` (pedido, producto, cantidad, precio unitario)
- `inventory_movements` (producto, tipo entrada/salida/ajuste, cantidad, stock anterior/posterior, motivo, usuario, referencia)
- `transactions` (registro de operaciones económicas)
- `audit_logs` (usuario, acción, entidad, id, estado anterior/nuevo)
- `alerts` (tipo, severidad, entidad, leída)
- `ai_insights` (tipo: riesgo_agotamiento, baja_rotación, anomalía, recomendación; payload, confianza, generado_en)
- `predictions` (producto, periodo, demanda estimada, tendencia, confianza, método)

Integridad: función SQL `confirm_order(order_id)` que dentro de una transacción valida stock, descuenta, inserta movimientos, transacción y auditoría. Trigger de stock mínimo → `alerts`. Todas las tablas con GRANTs + RLS por rol.

## 3. Módulos y rutas

Público: `/` landing, `/productos`, `/producto/$id`, chatbot flotante, `/auth`.
Panel (`_authenticated`): dashboard, clientes, productos, inventario, pedidos, transacciones/auditoría, analítica, alertas, reportes, AURA (asistente), configuración. Menú y acciones filtradas por rol.

## 4. Capa de inteligencia

- **Determinista (SQL/TS):** velocidad de venta, días a agotamiento, rotación, media/desviación para anomalías (z-score), regresión lineal simple para tendencia y demanda estimada. Resultados etiquetados como *cálculo* o *predicción*.
- **Generativa (Lovable AI):** AURA Insights redacta y prioriza sobre esos cálculos; el asistente responde con herramientas que consultan la BD (nunca inventa cifras); el chatbot público consulta catálogo real.
- **AURA accionable:** herramientas `registrar_entrada`, `crear_pedido`, `confirmar_pedido`. Siempre devuelven una propuesta que el usuario confirma en UI antes de ejecutar. Sin eliminaciones.

## 5. Automatización

Bus de eventos en BD (triggers + tabla de eventos) para: stock mínimo, pedido creado/confirmado, riesgo de agotamiento, anomalía, nueva transacción. Endpoint `/api/public/webhooks/*` firmado para conectar n8n más adelante.

## 6. Diseño

Identidad propia AURA: superficies oscuras profundas para el panel, acentos fríos técnicos (teal/azul acero), tipografía geométrica + texto neutro, densidad de datos alta, sin gradientes decorativos. Antes de codificar el panel te mostraré 3 direcciones visuales para elegir.

## 7. Plan por fases

1. Cloud + esquema + RLS + roles + auth + design system + landing.
2. Clientes, productos, categorías, inventario y movimientos.
3. Pedidos + confirmación transaccional + auditoría.
4. Dashboard, analítica, reportes y exportación CSV.
5. Alertas y capa de automatización.
6. Motor de inteligencia + AURA Insights.
7. Chatbot público.
8. AURA accionable (tool-calling con confirmación).
9. Datos demo realistas, seguridad, pulido UX.

Cada fase se verifica antes de pasar a la siguiente.
