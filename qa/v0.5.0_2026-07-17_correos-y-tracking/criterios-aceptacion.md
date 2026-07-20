# Criterios de aceptación — v0.5.0 · Correos de pedido y seguimiento

- **Fecha:** 2026-07-17
- **Commit:** `5ccae56`
- **Alcance:** envío de `locale` en el checkout (para los correos que manda el
  backend), mención del correo de confirmación en `/checkout/success`, bloque de
  seguimiento en "Mis pedidos" y alta/edición de tracking en el panel admin.

## Reglas de negocio

- Los correos (confirmación y tracking) los envía **el backend**; el front no
  manda ningún email, solo el `locale`.
- Al guardar tracking el backend pone el pedido en **`shipped`** y avisa al
  cliente; el front **no** llama además a cambiar el estado.
- La URL de seguimiento, si se proporciona, debe empezar por `http`/`https`.

## Checklist de aceptación

- [ ] `POST /checkout/session` incluye `locale` con el idioma activo (en/es).
- [ ] `/checkout/success` menciona que se envió un correo de confirmación.
- [ ] En "Mis pedidos", los pedidos `shipped` con `tracking_number` muestran el
      bloque "Envío en camino" con transportista y número.
- [ ] Si hay `tracking_url`, aparece "Seguir mi envío" que abre la URL en
      **pestaña nueva**.
- [ ] El indicador de estado cubre pending/paid/shipped/delivered/canceled.
- [ ] Admin: en pedidos `paid` hay "Añadir seguimiento"; en `shipped`, "Editar
      seguimiento" (precargado).
- [ ] Guardar tracking: 200 → fila a `shipped` + "Seguimiento guardado, se avisó
      al cliente"; 409 → detalle del error (no pagado); 422 → URL inválida.

## Escenarios

### CA-0.5.0-01 — Locale en el checkout (P0)
- **Dado** el idioma activo (p. ej. español),
- **Cuando** creo la sesión de pago,
- **Entonces** `POST /checkout/session` incluye `locale: "es"`.

### CA-0.5.0-02 — Mención del correo de confirmación (P2)
- **Dado** un pago exitoso,
- **Cuando** llego a `/checkout/success`,
- **Entonces** se menciona que se envió un correo de confirmación.

### CA-0.5.0-03 — Bloque de tracking en pedido enviado (P0)
- **Dado** un pedido `shipped` con `tracking_number`,
- **Cuando** lo veo en "Mis pedidos",
- **Entonces** aparece "Envío en camino" con transportista (si viene) y número.

### CA-0.5.0-04 — Botón "Seguir mi envío" (P1)
- **Dado** un pedido `shipped` con `tracking_url`,
- **Cuando** veo su bloque de tracking,
- **Entonces** hay un botón "Seguir mi envío" que abre la URL en pestaña nueva
  (`target=_blank`, `rel=noopener`).

### CA-0.5.0-05 — Sin tracking, sin bloque (P1)
- **Dado** un pedido que no está `shipped` o sin `tracking_number`,
- **Cuando** lo veo,
- **Entonces** no se muestra el bloque de seguimiento.

### CA-0.5.0-06 — Admin: acción según estado (P1)
- **Dado** el listado de pedidos admin,
- **Cuando** un pedido está `paid` veo "Añadir seguimiento"; si está `shipped`,
  "Editar seguimiento" (con datos precargados); si está `pending`, **no** hay
  acción de tracking.

### CA-0.5.0-07 — Guardar tracking OK → shipped (P0)
- **Dado** un pedido `paid`,
- **Cuando** guardo un número (y opcionalmente transportista/URL) válidos,
- **Entonces** `PATCH /admin/orders/{id}/tracking` responde 200, la fila pasa a
  `shipped`, se muestra "Seguimiento guardado, se avisó al cliente" y el botón
  cambia a "Editar seguimiento". **No** se llama a cambiar estado por separado.

### CA-0.5.0-08 — Validación de URL (P1)
- **Dado** una URL que no empieza por http/https,
- **Cuando** intento guardar,
- **Entonces** se muestra el error de URL inválida (validación en cliente; el
  backend además responde 422).

### CA-0.5.0-09 — 409 pedido no pagado (P1)
- **Dado** un intento de tracking sobre un pedido no pagado,
- **Cuando** el backend responde 409,
- **Entonces** se muestra el detalle del error. *(La UI ya evita ofrecer la
  acción en `pending`, reduciendo este caso.)*

### CA-0.5.0-10 — Nº obligatorio (P2)
- **Dado** el formulario de tracking,
- **Cuando** el número está vacío,
- **Entonces** el botón "Guardar" permanece deshabilitado.
