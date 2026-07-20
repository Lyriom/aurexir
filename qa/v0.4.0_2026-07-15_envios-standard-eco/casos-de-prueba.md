# Casos de prueba — v0.4.0 · Envíos Standard / Eco

Fecha: 2026-07-15 · Commit: `f5b1498`
Estado ✅ = verificado end-to-end en navegador contra backend simulado.

| ID | Título | Prioridad | Estado |
|---|---|---|---|
| CP-0.4.0-01 | Carrito sin ZIP ni botón "Calcular" | P1 | ✅ |
| CP-0.4.0-02 | Selector Standard $20 + Eco $30 🌿 con subtítulos | P1 | ✅ |
| CP-0.4.0-03 | Cotización auto al abrir (body {items,method}) | P0 | ✅ |
| CP-0.4.0-04 | Cambiar a Eco recotiza a $30 | P0 | ✅ |
| CP-0.4.0-05 | Cambiar cantidades recotiza solo | P1 | ✅ |
| CP-0.4.0-06 | Subtotal ≥ $200 → envío GRATIS | P1 | ✅ |
| CP-0.4.0-07 | Checkout envía shipping_method "eco" | P0 | ✅ |
| CP-0.4.0-08 | Pedidos: etiqueta standard/eco/express | P1 | ✅ |

---

### CP-0.4.0-01 — Sin ZIP ni "Calcular" (P1)
1. Añadir un producto y abrir el carrito.

**Esperado:** no existe input de ZIP ni botón "Calculate/Calcular".

### CP-0.4.0-02 — Selector de métodos (P1)
1. Observar el bloque "Método de envío".

**Esperado:** dos tarjetas → "Standard $20.00 · 3–5 days/días" y
"🌿 Eco $30.00 · Carbon-neutral shipping / Envío ecológico carbono neutro";
Eco resalta en verde al seleccionarla.

### CP-0.4.0-03 — Cotización automática (P0)
1. Abrir el carrito con un ítem ($130).

**Esperado:** se llama a `POST /shipping/quote` con `{items, method:"standard"}`
**sin** `zip`; la línea de envío muestra $20.00.

### CP-0.4.0-04 — Cambiar a Eco (P0)
1. Con la cotización mostrada, pulsar "Eco".

**Esperado:** se recotiza automáticamente; envío = $30.00 y total estimado sube
(p. ej. $160.00 sobre $130).

### CP-0.4.0-05 — Cambiar cantidades (P1)
1. Pulsar "+" en un ítem.

**Esperado:** el quote se vuelve a solicitar (con debounce) y el subtotal se
actualiza (p. ej. $260.00).

### CP-0.4.0-06 — Envío gratis ≥ $200 (P1)
1. Llevar el subtotal a ≥ $200.

**Esperado:** la línea de envío muestra "FREE/GRATIS" aunque la tarjeta del
método siga mostrando su tarifa base.

### CP-0.4.0-07 — Método en checkout (P0)
1. Elegir "Eco", iniciar sesión y pulsar pagar.

**Esperado:** el body de `POST /checkout/session` incluye
`shipping_method: "eco"`; se llega a `/checkout/success`.

### CP-0.4.0-08 — Etiquetas en pedidos (P1)
1. Revisar pedidos con método standard, eco y uno histórico express, en "Mis
   pedidos" y en admin.

**Esperado:** "Envío estándar / Standard", "Envío ecológico 🌿 / Eco 🌿" y
"Envío exprés / Express" respectivamente.
