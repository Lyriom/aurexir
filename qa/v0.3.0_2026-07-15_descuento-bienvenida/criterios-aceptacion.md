# Criterios de aceptación — v0.3.0 · Descuento de bienvenida 15%

- **Fecha:** 2026-07-15
- **Commit:** `ef2eac6`
- **Alcance:** popup de captura de email (15% de descuento), newsletter con
  código de un solo uso, campo de código en el carrito con línea de descuento, y
  descuento reflejado en pedidos (cliente y admin).

## Reglas de negocio

- El descuento es **% del subtotal**; **el envío no se descuenta** y el umbral
  de envío gratis se sigue evaluando sobre el subtotal **sin** descuento.
- El código es de **un solo uso**; al vaciarse el carrito (compra completada) se
  desaplica.
- El backend re-valida el código al pagar; un 409 lo desaplica en el front.

## Checklist de aceptación

- [ ] El popup aparece solo a **visitantes sin sesión**, con backend activo, a
      los ~8 s o por *exit intent*.
- [ ] Frecuencia: si se cierra sin dejar email, no reaparece en **7 días**; si
      se deja email, **no reaparece nunca**.
- [ ] Popup y newsletter del footer usan el **mismo endpoint** y muestran los
      **mismos mensajes** según la respuesta.
- [ ] El carrito valida el código contra `POST /discounts/validate` y muestra la
      línea "Descuento (CODE) −$XX.XX" cuando es válido.
- [ ] El código se puede quitar con la "X" y persiste entre recargas.
- [ ] En el checkout viaja `discount_code`; un 409 muestra el detalle y
      desaplica el código.
- [ ] "Mis pedidos" y admin muestran la línea de descuento cuando
      `discount_amount > 0`.

## Escenarios

### CA-0.3.0-01 — Aparición del popup (P1)
- **Dado** un visitante sin sesión y con backend activo,
- **Cuando** pasan ~8 s o mueve el cursor a salir,
- **Entonces** aparece el popup de 15%; **no** antes de esos 8 s.

### CA-0.3.0-02 — Frecuencia: cierre sin email (P1)
- **Dado** que cierro el popup sin dejar email,
- **Cuando** recargo dentro de 7 días,
- **Entonces** no reaparece; tras 7 días vuelve a poder mostrarse.

### CA-0.3.0-03 — Frecuencia: email dejado (P1)
- **Dado** que dejo mi email en el popup,
- **Cuando** recargo,
- **Entonces** no reaparece nunca (marca `aurexir_promo_done`).

### CA-0.3.0-04 — Mensajes del alta (P1)
- **Dado** el envío de email (popup o footer),
- **Cuando** el backend responde:
  - `subscribed` + `discount_email_sent:true` → "Revisa tu correo…"
  - `already_subscribed` → "Ya estabas suscrito, te reenviamos tu código"
  - `discount_email_sent:false` → "Estás suscrito; tu código llegará pronto"
  - `429` → "Demasiados intentos, espera un momento"
- **Entonces** se muestra el mensaje correspondiente.

### CA-0.3.0-05 — Código inválido (P1)
- **Dado** un código inexistente/usado,
- **Cuando** lo aplico en el carrito,
- **Entonces** veo "Código inválido o ya usado" y no se aplica descuento.

### CA-0.3.0-06 — Código válido y cálculo (P0)
- **Dado** un código válido `percent = 15` y subtotal $130,
- **Cuando** lo aplico,
- **Entonces** la línea muestra "Descuento (CODE) −$19.50" (15% de $130) y el
  total estimado la resta; el **envío no** cambia por el descuento.

### CA-0.3.0-07 — Envío gratis sobre subtotal sin descuento (P1)
- **Dado** un subtotal ≥ $200 con descuento aplicado,
- **Cuando** veo el carrito,
- **Entonces** el envío gratis se decide por el subtotal **sin** descuento (la
  barra/umbral no se ven afectados por el descuento).

### CA-0.3.0-08 — Quitar el código (P2)
- **Dado** un código aplicado,
- **Cuando** pulso la "X",
- **Entonces** desaparece la línea y reaparece el input; al recargar sin quitarlo,
  el código persiste.

### CA-0.3.0-09 — 409 al pagar (P0)
- **Dado** un código que el backend rechaza al crear la sesión,
- **Cuando** pulso pagar,
- **Entonces** se muestra el detalle del 409 y el código se desaplica.

### CA-0.3.0-10 — Descuento en pedidos (P1)
- **Dado** un pedido con `discount_amount > 0`,
- **Cuando** lo veo en "Mis pedidos" o en admin,
- **Entonces** aparece la línea "Descuento (CODE) −$XX.XX".
