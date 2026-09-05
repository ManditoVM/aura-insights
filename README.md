# Aura Insights

PROMPT MAESTRO — PROYECTO AURA AI

Quiero desarrollar una aplicación web profesional llamada AURA AI, una plataforma inteligente de gestión empresarial que combine gestión de clientes, pedidos, inventario, control transaccional, automatización, analítica avanzada y un asistente de Inteligencia Artificial.

Este proyecto será desarrollado como proyecto final universitario para una materia de Inteligencia Artificial, por lo que la IA debe ser una parte central del sistema y no simplemente un chatbot decorativo.

La aplicación debe sentirse como un producto SaaS empresarial real, moderno, profesional, escalable y preparado para una demostración académica.

1. CONCEPTO DEL PROYECTO

Nombre

AURA AI

Significado

AI Unified Resource Assistant

Propósito

AURA AI es una plataforma que permite a una empresa administrar sus operaciones comerciales y utilizar Inteligencia Artificial para analizar información, detectar problemas, generar recomendaciones y asistir al administrador en la toma de decisiones.

El sistema debe combinar:

Gestión de clientes.

Catálogo de productos.

Gestión de pedidos.

Gestión de inventario.

Entradas y salidas de inventario.

Control transaccional.

Automatización de procesos.

Dashboard analítico.

Predicción de demanda.

Alertas inteligentes.

Recomendaciones de abastecimiento.

Detección de anomalías.

Asistente empresarial mediante IA.

Chatbot para clientes.

Página web pública.

La filosofía principal del proyecto es:

La IA no solamente debe responder preguntas; debe analizar los datos de la empresa, detectar situaciones importantes, generar recomendaciones y, cuando sea seguro, ayudar a ejecutar acciones dentro del sistema.

2. OBJETIVO PRINCIPAL

Construir una plataforma empresarial inteligente capaz de centralizar las operaciones comerciales de una empresa y utilizar Inteligencia Artificial para convertir los datos de clientes, pedidos, inventario y transacciones en información útil para la toma de decisiones.

El sistema debe permitir demostrar claramente la diferencia entre:

Sistema tradicional

Datos → registros → reportes.

AURA AI

Datos → análisis → predicción → detección → recomendación → acción.

3. USUARIOS DEL SISTEMA

Debe existir una separación clara entre diferentes tipos de usuario.

Administrador

Tiene acceso completo a:

Dashboard.

Clientes.

Productos.

Inventario.

Pedidos.

Transacciones.

Automatizaciones.

Analítica.

IA.

Configuración.

Empleado

Puede:

Consultar productos.

Registrar entradas y salidas.

Gestionar pedidos.

Consultar clientes.

No debe tener acceso a configuraciones administrativas sensibles.

Cliente

Puede:

Consultar productos.

Ver disponibilidad.

Crear pedidos.

Consultar sus pedidos.

Utilizar el chatbot.

Recibir recomendaciones de productos.

Implementar autenticación y autorización mediante Supabase.

4. ARQUITECTURA GENERAL

La aplicación debe estar organizada siguiendo una arquitectura limpia y modular.

Utilizar preferentemente:

React + TypeScript.

Vite.

Tailwind CSS.

Componentes reutilizables.

Supabase como backend y base de datos.

PostgreSQL.

Supabase Auth.

Supabase Storage cuando sea necesario.

APIs para servicios de IA.

Arquitectura preparada para automatizaciones mediante webhooks/API.

No generar una aplicación monolítica difícil de mantener.

Separar claramente:

UI.

Componentes.

Páginas.

Servicios.

Tipos/interfaces.

Lógica de negocio.

Integración con Supabase.

Integración con IA.

5. DISEÑO VISUAL

Quiero una interfaz de nivel profesional tipo SaaS empresarial moderno.

Estilo:

Minimalista.

Elegante.

Tecnológico.

Profesional.

Limpio.

Alta legibilidad.

Responsive.

Desktop-first para el panel administrativo.

Mobile-friendly para la página pública y clientes.

Evitar:

Diseños excesivamente coloridos.

Gradientes exagerados.

Elementos decorativos innecesarios.

Interfaces que parezcan una plantilla escolar.

Animaciones excesivas.

Utilizar una identidad visual consistente para AURA AI.

La interfaz debe transmitir:

Inteligencia + confianza + tecnología + control empresarial.

6. DASHBOARD PRINCIPAL

Crear un dashboard ejecutivo.

Debe mostrar como mínimo:

KPIs

Ventas del día.

Ventas del mes.

Pedidos pendientes.

Clientes registrados.

Productos disponibles.

Productos con stock bajo.

Valor total del inventario.

Gráficas

Ventas por día.

Ventas por semana/mes.

Productos más vendidos.

Categorías con mayor venta.

Evolución del inventario.

Pedidos por estado.

Centro de inteligencia

Crear una sección llamada:

AURA Insights

Aquí la IA debe mostrar automáticamente:

Alertas importantes.

Productos próximos a agotarse.

Productos con baja rotación.

Incrementos o disminuciones inusuales de ventas.

Recomendaciones de abastecimiento.

Predicciones relevantes.

Ejemplo:

⚠️ Producto X presenta riesgo de agotamiento.

Actualmente existen 12 unidades y el promedio de ventas es de 8 unidades diarias.

AURA recomienda abastecer 40 unidades.

7. MÓDULO DE CLIENTES

Crear CRUD completo de clientes.

Campos sugeridos:

ID.

Nombre.

Apellidos.

Email.

Teléfono.

Dirección.

Fecha de registro.

Estado.

Total de compras.

Número de pedidos.

Cada cliente debe tener una vista detallada con:

Información personal.

Historial de pedidos.

Historial de compras.

Total gastado.

Productos comprados.

Última compra.

Frecuencia de compra.

Preparar estos datos para que posteriormente puedan ser utilizados por la IA.

8. MÓDULO DE PRODUCTOS

Crear CRUD completo.

Campos:

ID.

SKU.

Nombre.

Descripción.

Categoría.

Marca.

Precio.

Costo.

Stock actual.

Stock mínimo.

Stock máximo.

Estado.

Imagen.

Fecha de creación.

Debe existir:

Búsqueda.

Filtros.

Ordenamiento.

Paginación.

Vista de producto.

Control de disponibilidad.

9. MÓDULO DE INVENTARIO

Este es uno de los módulos principales.

Debe controlar:

Entradas

Cuando llegan productos al inventario.

Salidas

Cuando los productos salen por ventas u otras operaciones.

Existencias

Stock disponible en tiempo real.

Cada movimiento debe generar un registro transaccional.

Crear una tabla de movimientos de inventario con:

ID.

Producto.

Tipo de movimiento.

Cantidad.

Stock anterior.

Stock posterior.

Usuario.

Motivo.

Fecha.

Referencia de transacción.

Nunca modificar el stock sin registrar el movimiento correspondiente.

10. MÓDULO DE PEDIDOS

Crear un sistema completo de pedidos.

Cada pedido debe tener:

ID.

Cliente.

Fecha.

Productos.

Cantidades.

Subtotal.

Impuestos.

Total.

Estado.

Método de pago.

Usuario que creó el pedido.

Estados:

Pendiente.

Confirmado.

Preparando.

Enviado.

Entregado.

Cancelado.

Al confirmar un pedido:

Validar stock.

Registrar la transacción.

Descontar inventario.

Registrar movimiento de salida.

Actualizar estadísticas.

Generar información para analítica.

Permitir que AURA utilice el nuevo dato.

No permitir que un pedido confirmado genere stock negativo.

11. CONTROL TRANSACCIONAL

Crear un módulo de auditoría/transacciones.

Cada operación importante debe generar un registro.

Ejemplos:

Creación de pedido.

Confirmación de pedido.

Cancelación.

Entrada de inventario.

Salida de inventario.

Modificación de producto.

Creación de cliente.

Cambios administrativos.

Registrar:

Usuario.

Acción.

Entidad afectada.

ID de entidad.

Fecha.

Información relevante.

Estado anterior/nuevo cuando sea necesario.

Crear una interfaz para consultar el historial.

12. MOTOR DE INVENTARIO INTELIGENTE

Aquí comienza la parte importante de Inteligencia Artificial.

AURA debe analizar el comportamiento del inventario.

Crear indicadores como:

Riesgo de agotamiento

Calcular una estimación basada en:

Stock actual.

Promedio de ventas.

Tendencia de ventas.

Historial.

Ejemplo:

Stock actual: 20
Venta promedio: 5/día
Días estimados restantes: 4

Productos de baja rotación

Detectar productos que:

Tienen inventario alto.

Presentan pocas ventas.

Permanecen mucho tiempo sin movimiento.

Productos con alta demanda

Detectar:

Incrementos de ventas.

Tendencias.

Productos recurrentes.

13. PREDICCIÓN DE DEMANDA

Implementar un módulo de predicción.

La aplicación debe analizar el historial de ventas y generar una estimación de demanda futura.

Por ejemplo:

Producto:

Laptop Pro X

Historial:

Semana 1: 10 ventas.

Semana 2: 13 ventas.

Semana 3: 15 ventas.

Semana 4: 18 ventas.

AURA puede identificar una tendencia creciente y generar:

Demanda estimada próxima semana: 20–22 unidades.

Mostrar:

Demanda histórica.

Demanda estimada.

Tendencia.

Nivel de confianza cuando sea posible.

Si una predicción estadística/algorítmica real no puede ejecutarse directamente en el navegador, diseñar una arquitectura preparada para conectarse posteriormente a un servicio de IA/API.

No inventar predicciones presentándolas como datos reales.

14. RECOMENDACIÓN DE ABASTECIMIENTO

Crear una sección:

"Recomendaciones de compra"

AURA debe analizar:

Stock actual.

Stock mínimo.

Velocidad de ventas.

Demanda estimada.

Tendencia.

Tiempo estimado de agotamiento.

Y generar recomendaciones.

Ejemplo:

Producto: Smartphone X

Stock actual: 8

Venta promedio: 4/día

Agotamiento estimado: 2 días

Demanda estimada: 25 unidades

Cantidad recomendada: 30 unidades.

Mostrar claramente que es una recomendación de IA, no una orden automática.

15. DETECCIÓN DE ANOMALÍAS

Crear un sistema de detección de comportamientos inusuales.

Debe poder analizar:

Ventas extraordinariamente altas.

Ventas extraordinariamente bajas.

Movimientos de inventario inusuales.

Cambios bruscos de stock.

Pedidos con cantidades atípicas.

Comportamientos diferentes al historial.

Ejemplo:

🚨 Anomalía detectada

El producto X normalmente registra entre 5 y 10 unidades vendidas por día.

Hoy registra 47 unidades.

Permitir consultar:

Qué ocurrió.

Cuándo.

Qué producto.

Magnitud.

Posible explicación.

16. AURA — ASISTENTE DE INTELIGENCIA ARTIFICIAL

Crear un asistente central llamado:

AURA

Debe existir dentro del panel administrativo.

AURA debe poder responder preguntas utilizando información real de la base de datos.

Ejemplos:

"¿Cuáles son mis productos más vendidos?"

"¿Qué productos están próximos a agotarse?"

"¿Qué producto tiene menor rotación?"

"¿Cuánto vendimos este mes?"

"¿Qué clientes han comprado más?"

"¿Qué productos debería reabastecer?"

"¿Hay alguna anomalía en el inventario?"

"¿Por qué bajaron las ventas?"

La IA debe responder utilizando los datos disponibles y no inventar información.

Cuando una respuesta dependa de datos empresariales, consultar la base de datos antes de responder.

17. AURA COMO ASISTENTE ACCIONABLE

Una característica diferenciadora del proyecto será que AURA pueda ayudar a realizar acciones.

Ejemplos:

Usuario:

"Registra una entrada de 20 unidades del Producto X."

AURA debe:

Identificar el producto.

Mostrar la operación propuesta.

Pedir confirmación.

Ejecutar la operación.

Registrar el movimiento.

Actualizar inventario.

Registrar auditoría.

Otro ejemplo:

"Crea un pedido para Juan Pérez con 5 unidades del Producto X."

AURA debe preparar la operación y solicitar confirmación antes de ejecutarla.

IMPORTANTE:

Las operaciones que modifiquen datos críticos deben requerir confirmación explícita.

La IA nunca debe eliminar información o ejecutar acciones críticas sin autorización.

18. CHATBOT PARA CLIENTES

Crear un chatbot separado para la página pública.

Debe poder responder:

Qué productos existen.

Características.

Precios.

Disponibilidad.

Categorías.

Preguntas frecuentes.

Estado del pedido.

También puede recomendar productos.

Ejemplo:

Cliente:

"Tengo $10,000 y busco una laptop para programación."

El chatbot debe consultar el catálogo disponible y recomendar opciones reales.

Si un producto está agotado:

"Actualmente no tenemos disponibilidad. Te puedo mostrar alternativas."

19. PÁGINA WEB PÚBLICA

Crear una landing page profesional de AURA AI.

Secciones:

Hero

AURA AI

Inteligencia que convierte tus operaciones en decisiones.

Características

Gestión inteligente de inventario.

Predicción de demanda.

Automatización.

Analítica empresarial.

Asistente IA.

Cómo funciona

Datos → IA → Insights → Decisiones.

Beneficios

Menos errores.

Mejor control.

Decisiones más rápidas.

Prevención de agotamientos.

Mejor aprovechamiento del inventario.

CTA

Botones:

Iniciar sesión.

Explorar productos.

20. AUTOMATIZACIÓN

Preparar una capa de automatización.

Debe existir una arquitectura preparada para eventos como:

Cuando un producto llega al stock mínimo

→ generar alerta.

Cuando se crea un pedido

→ validar inventario.

Cuando se confirma un pedido

→ descontar inventario.

Cuando se detecta riesgo de agotamiento

→ generar recomendación.

Cuando se detecta una anomalía

→ generar alerta para administrador.

Cuando entra una nueva transacción

→ actualizar métricas.

La arquitectura debe permitir posteriormente conectar servicios externos como n8n mediante webhooks/API.

21. SISTEMA DE ALERTAS

Crear un centro de notificaciones.

Tipos:

🟡 Advertencia
🔴 Crítica
🔵 Información
🟢 Éxito
🤖 Insight de IA

Ejemplos:

"Producto X tiene solamente 5 unidades."

"AURA detectó un incremento inusual de ventas."

"Se recomienda reabastecer Producto Y."

22. REPORTES

Crear módulo de reportes.

Permitir consultar:

Ventas.

Inventario.

Pedidos.

Clientes.

Productos.

Movimientos.

Filtros:

Hoy.

Semana.

Mes.

Año.

Rango personalizado.

Preparar exportación de reportes a CSV/Excel/PDF si la arquitectura lo permite.

23. SEGURIDAD

Implementar:

Autenticación.

Autorización por roles.

Validación de formularios.

Protección de rutas.

Row Level Security de Supabase.

Validación de operaciones.

Confirmación para operaciones críticas.

No exponer claves privadas en frontend.

Las credenciales y secretos deben utilizar variables de entorno.

24. BASE DE DATOS

Diseñar una estructura relacional preparada para crecer.

Entidades principales:

users/profiles.

roles.

customers.

products.

categories.

orders.

order_items.

inventory.

inventory_movements.

transactions.

alerts.

ai_insights.

predictions.

audit_logs.

Crear relaciones correctamente.

Evitar duplicar información innecesariamente.

25. DATOS DEMO

Crear datos ficticios realistas para poder demostrar el sistema.

Por ejemplo:

30 clientes.

40 productos.

Historial de pedidos.

Historial de ventas.

Movimientos de inventario.

Productos con stock bajo.

Productos con alta rotación.

Productos con baja rotación.

Algunos comportamientos anómalos.

Esto es importante porque la IA necesita suficiente información para demostrar sus capacidades.

Los datos deben ser claramente ficticios.

26. EXPERIENCIA DE DEMOSTRACIÓN

El proyecto debe estar preparado para una demostración universitaria.

La demostración ideal será:

Paso 1

Ingresar al dashboard.

Paso 2

Mostrar las métricas actuales.

Paso 3

Crear un pedido.

Paso 4

Confirmarlo.

Paso 5

Demostrar cómo el inventario se actualiza automáticamente.

Paso 6

Mostrar el movimiento transaccional generado.

Paso 7

Mostrar cómo AURA detecta el riesgo de agotamiento.

Paso 8

Preguntar a AURA:

"¿Qué productos debería reabastecer?"

Paso 9

Mostrar las recomendaciones.

Paso 10

Preguntar:

"¿Detectaste alguna anomalía?"

Paso 11

Mostrar una anomalía detectada.

Paso 12

Utilizar el chatbot público como cliente.

La demostración debe mostrar una cadena completa:

Cliente → Pedido → Transacción → Inventario → Analítica → IA → Recomendación → Acción.

27. PRINCIPIOS IMPORTANTES DE DESARROLLO

No quiero una aplicación superficial que solamente simule las funcionalidades.

Las relaciones entre módulos deben ser reales.

Por ejemplo:

Un pedido confirmado debe afectar realmente al inventario.

Un movimiento de inventario debe afectar realmente las existencias.

Una transacción debe quedar registrada.

El dashboard debe utilizar información real de la base de datos.

Las recomendaciones deben basarse en datos existentes.

La IA debe diferenciar entre:

datos reales;

cálculos;

predicciones;

recomendaciones.

No presentar datos ficticios como si fueran resultados reales.

28. ESCALABILIDAD

Diseñar AURA AI para que posteriormente pueda incorporar:

Proveedores.

Compras.

Facturación.

Multiempresa.

Múltiples almacenes.

Predicciones más avanzadas.

Modelos ML externos.

WhatsApp.

Telegram.

Automatizaciones con n8n.

Notificaciones por correo.

Aplicación móvil.

No es necesario implementar todas estas funciones ahora.

La arquitectura solamente debe quedar preparada para crecer.

29. PRIORIDAD DEL DESARROLLO

No intentes construir todo de manera desordenada.

Quiero desarrollar el proyecto por fases.

FASE 1

Arquitectura + diseño + autenticación + base de datos.

FASE 2

Clientes + productos + inventario.

FASE 3

Pedidos + transacciones.

FASE 4

Dashboard + reportes.

FASE 5

Automatizaciones.

FASE 6

IA + AURA Insights.

FASE 7

Chatbot público.

FASE 8

AURA accionable.

FASE 9

Pruebas + seguridad + UX + datos demo.

No avances automáticamente a la siguiente fase sin verificar que la anterior funcione correctamente.

30. REGLA FUNDAMENTAL

Quiero que actúes como un equipo senior de desarrollo de software, UX/UI, arquitectura de sistemas e Inteligencia Artificial.

Antes de implementar funcionalidades complejas, analiza la arquitectura y evita soluciones improvisadas.

Cuando exista una limitación técnica de Lovable, Supabase o del proveedor de IA, propón la alternativa más profesional posible.

Prioriza:

Funcionalidad real.

Seguridad.

Arquitectura limpia.

Experiencia de usuario.

Inteligencia Artificial útil.

Escalabilidad.

Diseño profesional.

El resultado final debe parecer un producto empresarial real, no un proyecto escolar básico.

RESULTADO ESPERADO

Al finalizar quiero tener una plataforma llamada:

AURA AI

Intelligent Business Management Platform

Que permita demostrar que la Inteligencia Artificial puede utilizar datos empresariales para:

ANALIZAR → PREDECIR → DETECTAR → RECOMENDAR → ASISTIR → ACTUAR

Y que todos los módulos estén conectados entre sí de manera coherente.

IMPORTANTE: comienza por analizar esta especificación completa, proponiendo la arquitectura inicial, estructura de módulos, esquema de base de datos y plan de implementación. No generes todavía todo el proyecto de una sola vez. Primero presenta la arquitectura propuesta para validarla antes de comenzar el desarrollo.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7104f4f8-b56c-4c3a-93a7-9bfb38b26157).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
