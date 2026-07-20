# Casos de prueba — v0.5.0 · Correos de pedido y seguimiento

Fecha: 2026-07-17 · Commit: `5ccae56`
Estado ✅ = verificado end-to-end en navegador contra backend simulado.

| ID | Título | Prioridad | Estado |
|---|---|---|---|
| CP-0.5.0-01 | Checkout envía locale ("es") | P0 | ✅ |
| CP-0.5.0-02 | Success menciona correo de confirmación | P2 | ✅ |
| CP-0.5.0-03 | Pedido shipped muestra bloque de tracking | P0 | ✅ |
| CP-0.5.0-04 | Botón "Seguir mi envío" abre en pestaña nueva | P1 | ✅ |
| CP-0.5.0-05 | Pedido no enviado sin bloque de tracking | P1 | ✅ |
| CP-0.5.0-06 | Admin: paid ofrece "Añadir seguimiento" | P1 | ✅ |
| CP-0.5.0-07 | Admin: URL sin http/https → error | P1 | ✅ |
| CP-0.5.0-08 | Admin: guardar → shipped + éxito + "Editar" | P0 | ✅ |
| CP-0.5.0-09 | Admin: pending no ofrece tracking (evita 409) | P1 | ✅ |
| CP-0.5.0-10 | Admin: editar tracking precarga el número | P1 | ✅ |
| CP-0.5.0-11 | Admin: 409 sobre pedido no pagado (API directa) | P1 | ✅ |
| CP-0.5.0-12 | Nº de seguimiento obligatorio | P2 | ⬜ |

---

### CP-0.5.0-01 — Locale en checkout (P0)
1. Cambiar el idioma de la web a español.
2. Con sesión y carrito, pulsar pagar.

**Esperado:** el body de `POST /checkout/session` incluye `locale: "es"`.

### CP-0.5.0-02 — Mención del correo (P2)
1. Completar un pago y llegar a `/checkout/success`.

**Esperado:** se muestra la nota "Te enviamos un correo de confirmación. Tu
pedido llegará en 3–5 días laborables." (o su versión EN).

### CP-0.5.0-03 — Bloque de tracking (P0)
**Precondición:** pedido `shipped` con `tracking_number` y `tracking_carrier`.
1. Abrir "Mis pedidos" y localizar ese pedido.

**Esperado:** bloque "Shipment on its way / Envío en camino" con el
transportista (p. ej. UPS) y el número de seguimiento.

### CP-0.5.0-04 — Botón "Seguir mi envío" (P1)
1. En un pedido con `tracking_url`, pulsar "Seguir mi envío".

**Esperado:** el enlace tiene `href` = tracking_url, `target=_blank` y
`rel=noopener`; abre en pestaña nueva.

### CP-0.5.0-05 — Sin bloque si no aplica (P1)
1. Revisar un pedido `paid`/`pending`.

**Esperado:** no se muestra el bloque de seguimiento.

### CP-0.5.0-06 — Admin: "Añadir seguimiento" (P1)
1. Como admin, en Pedidos localizar un pedido `paid`.

**Esperado:** botón "Add tracking / Añadir seguimiento".

### CP-0.5.0-07 — URL inválida (P1)
1. Abrir el formulario de tracking, poner número y URL `ftp://nope`, guardar.

**Esperado:** error "La URL de seguimiento debe empezar por http o https"; no se
envía al backend.

### CP-0.5.0-08 — Guardar tracking OK (P0)
1. En un pedido `paid`, abrir tracking, poner número, transportista y URL válida
   (https://…), guardar.

**Esperado:** respuesta 200; la fila pasa a "Shipped", aparece el banner
"Seguimiento guardado, se avisó al cliente" y el botón cambia a "Editar
seguimiento". No se llamó a `PATCH /admin/orders/{id}` con status.

### CP-0.5.0-09 — pending no ofrece tracking (P1)
1. Observar un pedido `pending` en admin.

**Esperado:** no hay botón de tracking (solo transiciones de estado), evitando
el 409 desde la UI.

### CP-0.5.0-10 — Editar precargado (P1)
1. En un pedido `shipped`, pulsar "Editar seguimiento".

**Esperado:** el formulario precarga el número (y transportista/URL) actuales.

### CP-0.5.0-11 — 409 no pagado (llamada directa) (P1)
1. Con token admin, `PATCH /admin/orders/{id}/tracking` sobre un pedido
   `pending`.

**Esperado:** respuesta 409 con detalle "El pedido no está pagado"; si se
originara desde UI, se mostraría ese detalle.

### CP-0.5.0-12 — Número obligatorio (P2)
1. Abrir el formulario de tracking y dejar el número vacío.

**Esperado:** el botón "Guardar" permanece deshabilitado.
