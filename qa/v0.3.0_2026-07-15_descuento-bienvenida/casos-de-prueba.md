# Casos de prueba — v0.3.0 · Descuento de bienvenida 15%

Fecha: 2026-07-15 · Commit: `ef2eac6`
Estado ✅ = verificado end-to-end en navegador contra backend simulado.

| ID | Título | Prioridad | Estado |
|---|---|---|---|
| CP-0.3.0-01 | Popup aparece a los ~8 s (y no antes) | P1 | ✅ |
| CP-0.3.0-02 | Alta nueva → "Revisa tu correo" + promo_done | P1 | ✅ |
| CP-0.3.0-03 | No reaparece si ya dejó email | P1 | ✅ |
| CP-0.3.0-04 | Snooze de 7 días y exit-intent tras expirar | P1 | ✅ |
| CP-0.3.0-05 | Footer: mensajes "resent" y "pending" | P1 | ✅ |
| CP-0.3.0-06 | Código inválido → mensaje de error | P1 | ✅ |
| CP-0.3.0-07 | Código válido → línea −$19.50 (15% de $130) | P0 | ✅ |
| CP-0.3.0-08 | Envío no se descuenta; total estimado correcto | P0 | ✅ |
| CP-0.3.0-09 | Quitar el código con la X | P2 | ✅ |
| CP-0.3.0-10 | 409 al pagar desaplica el código | P0 | ✅ |
| CP-0.3.0-11 | Pago OK envía discount_code y limpia al éxito | P0 | ✅ |
| CP-0.3.0-12 | Descuento visible en Mis pedidos | P1 | ✅ |
| CP-0.3.0-13 | Descuento visible en admin | P1 | ✅ |
| CP-0.3.0-14 | Popup NO aparece con sesión iniciada | P1 | ⬜ |
| CP-0.3.0-15 | Envío gratis con descuento y subtotal ≥ $200 | P1 | ⬜ |

---

### CP-0.3.0-01 — Popup a los ~8 s (P1)
**Precondición:** invitado, sin `aurexir_promo_seen/done`.
1. Abrir `/` y esperar < 8 s → verificar que NO hay popup.
2. Esperar a superar los 8 s.

**Esperado:** el popup de 15% aparece tras ~8 s.

### CP-0.3.0-02 — Alta nueva (P1)
1. En el popup, escribir un email nuevo y enviar.

**Esperado:** mensaje "Check your inbox / Revisa tu correo…" y se marca
`aurexir_promo_done = 1`.

### CP-0.3.0-03 — No reaparece si ya dejó email (P1)
1. Con `aurexir_promo_done`, recargar y esperar > 8 s.

**Esperado:** el popup no reaparece.

### CP-0.3.0-04 — Snooze 7 días + exit-intent (P1)
1. Con `aurexir_promo_seen = ahora` (sin done), recargar y esperar > 8 s → no
   aparece.
2. Poner `aurexir_promo_seen` = hace 8 días, recargar y disparar *mouseout*
   hacia arriba.

**Esperado:** con snooze vigente no aparece; expirado, el exit-intent lo dispara.

### CP-0.3.0-05 — Footer: resent / pending (P1)
1. En el footer, suscribir un email ya existente → mensaje "already subscribed".
2. Suscribir un email cuyo envío de correo falle → mensaje "on its way / llegará
   pronto".

**Esperado:** cada respuesta del backend produce su mensaje.

### CP-0.3.0-06 — Código inválido (P1)
1. En el carrito, aplicar un código inexistente.

**Esperado:** "Invalid or already used code / Código inválido o ya usado"; sin
descuento aplicado.

### CP-0.3.0-07 — Código válido y cálculo (P0)
**Precondición:** carrito con subtotal $130.
1. Aplicar un código válido (`percent = 15`).

**Esperado:** línea "Descuento (CODE) −$19.50" y persiste al recargar.

### CP-0.3.0-08 — Envío no se descuenta (P0)
1. Con el código aplicado, cotizar envío estándar.

**Esperado:** el envío mantiene su tarifa; el total estimado = subtotal −
descuento + envío (p. ej. 130 − 19.50 + 20 = **$130.50**).

### CP-0.3.0-09 — Quitar código (P2)
1. Con un código aplicado, pulsar la "X".

**Esperado:** desaparece la línea de descuento y reaparece el input.

### CP-0.3.0-10 — 409 al pagar (P0)
1. Aplicar un código que el backend rechaza al crear la sesión y pulsar pagar.

**Esperado:** se muestra el detalle del 409 ("Código de descuento inválido o ya
usado") y el código se desaplica.

### CP-0.3.0-11 — Pago OK envía discount_code (P0)
1. Con código válido y sesión, pulsar pagar.

**Esperado:** el body de `POST /checkout/session` incluye `discount_code`;
`/checkout/success` vacía el carrito y elimina el código de localStorage.

### CP-0.3.0-12 / 13 — Descuento en pedidos (P1)
1. Abrir un pedido con descuento en "Mis pedidos" (12) y en admin (13).

**Esperado:** aparece la línea "Descuento (CODE) −$XX.XX".

### CP-0.3.0-14 — Popup no aparece con sesión (P1)
1. Con sesión iniciada, abrir `/` y esperar > 8 s.

**Esperado:** el popup no se muestra (es solo para invitados).

### CP-0.3.0-15 — Envío gratis con descuento (P1)
1. Con subtotal ≥ $200 y un código aplicado, revisar el carrito.

**Esperado:** el envío figura GRATIS por el subtotal sin descuento; la línea de
descuento sigue restando del total.
