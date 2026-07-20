# Criterios de aceptación — v0.4.0 · Envíos Standard / Eco

- **Fecha:** 2026-07-15
- **Commit:** `f5b1498`
- **Alcance:** nuevo sistema de envíos. `POST /shipping/quote` recibe
  `{items, method}` (sin ZIP). Métodos `standard` ($20) y `eco` ($30);
  `express` ya no es válido (422). Cotización automática, sin botón "Calcular".

## Checklist de aceptación

- [ ] Se elimina el input de ZIP y toda su validación del carrito.
- [ ] El selector ofrece dos tarjetas: **Standard $20 (3–5 días)** y
      **Eco $30 🌿 (envío ecológico carbono neutro)**, bilingües.
- [ ] La cotización se solicita **automáticamente** al abrir el carrito y al
      cambiar de método o de cantidades (sin botón "Calcular").
- [ ] El checkout envía `shipping_method: "standard" | "eco"`.
- [ ] El envío gratis desde $200 de subtotal se mantiene igual.
- [ ] Los pedidos muestran la etiqueta de método; "Express" se conserva legible
      para pedidos históricos.

## Escenarios

### CA-0.4.0-01 — Sin ZIP ni botón "Calcular" (P1)
- **Dado** el carrito con backend activo,
- **Cuando** lo abro,
- **Entonces** no hay campo de código postal ni botón "Calcular"; el resumen de
  envío se calcula solo.

### CA-0.4.0-02 — Selector de dos métodos (P1)
- **Dado** el pie del carrito,
- **Cuando** veo el selector,
- **Entonces** aparecen "Standard — $20 (3–5 días)" y "Eco — $30 🌿 (envío
  ecológico carbono neutro)", con acento verde en Eco.

### CA-0.4.0-03 — Cotización automática al abrir (P0)
- **Dado** un carrito con ítems,
- **Cuando** se abre,
- **Entonces** se llama a `POST /shipping/quote` con `{items, method}` (sin
  `zip`) y la línea de envío muestra el importe (Standard → $20).

### CA-0.4.0-04 — Recotización al cambiar método (P0)
- **Dado** un envío cotizado,
- **Cuando** cambio a "Eco",
- **Entonces** se recotiza solo y el envío pasa a $30, actualizando el total
  estimado.

### CA-0.4.0-05 — Recotización al cambiar cantidades (P1)
- **Dado** un envío cotizado,
- **Cuando** cambio la cantidad de un ítem,
- **Entonces** el quote se vuelve a pedir (con *debounce*) y el subtotal se
  actualiza.

### CA-0.4.0-06 — Envío gratis desde $200 (P1)
- **Dado** un subtotal ≥ $200,
- **Cuando** veo la línea de envío,
- **Entonces** figura GRATIS aunque la tarjeta del método muestre su tarifa base.

### CA-0.4.0-07 — Método en el checkout (P0)
- **Dado** el método elegido,
- **Cuando** pulso pagar,
- **Entonces** `POST /checkout/session` incluye `shipping_method` con
  `"standard"` o `"eco"`.

### CA-0.4.0-08 — Etiqueta de método en pedidos (P1)
- **Dado** pedidos con método `standard`, `eco` o `express` (histórico),
- **Cuando** los veo en "Mis pedidos" o admin,
- **Entonces** se muestra la etiqueta correcta: "Envío estándar", "Envío
  ecológico 🌿" o "Envío exprés".

### CA-0.4.0-09 — express ya no es seleccionable (P2)
- **Dado** la UI actual,
- **Cuando** elijo un método,
- **Entonces** solo puedo elegir standard/eco (el backend responde 422 si
  llegara `express`, caso que la UI ya no produce).
