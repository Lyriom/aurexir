# Criterios de aceptación — v0.6.0 · Stripe Checkout + compra con un clic

Fecha: 2026-07-27 · Alcance: página `/checkout` propia (resumen y envío) con
redirección a **Stripe Checkout alojado** para dirección y pago, compra con un clic
("Comprar ahora"), y correo de recibo + factura tras el pago.

Requiere backend: `POST /checkout/session`, webhook de Stripe, correo con
factura PDF y `POST /admin/uploads` (ver `BACKEND_PROMPT_checkout-inventario.md`).

---

### CA-0.6.0-01 · Acceso al checkout
- **Dado** un visitante sin sesión, **cuando** entra a `/checkout`, **entonces**
  se le redirige a `/login` (guard `requiresAuth`).
- **Dado** que estaba comprando como invitado, **cuando** inicia sesión desde el
  carrito, **entonces** vuelve a `/checkout`.

### CA-0.6.0-02 · Compra con un clic
- **Dado** el detalle de un producto (con backend activo), **cuando** pulsa
  "Comprar ahora", **entonces** el producto queda en el carrito y se abre
  `/checkout` directamente (sin pasar por el drawer).

### CA-0.6.0-03 · Datos de envío
- **Dado** `/checkout`, **cuando** el cliente continúa, **entonces** Stripe
  recopila teléfono y dirección de envío en Estados Unidos.

### CA-0.6.0-04 · Resumen y total
- **Dado** el carrito, **entonces** el resumen muestra ítems, subtotal, envío
  (según método) y total estimado; el descuento aplicado en el carrito viaja al
  resumen y se puede quitar desde ahí. El envío es gratis con subtotal ≥ $200.

### CA-0.6.0-05 · Pago con Stripe Checkout
- **Dado** que el backend tiene la clave secreta configurada, **entonces** se crea
  una Checkout Session y se redirige al formulario alojado por Stripe.
- **Cuando** el backend verifica que la sesión está pagada, **entonces** se vacía el carrito y se muestra la
  página de éxito, que indica que se envió el **recibo y la factura (PDF)** por
  correo.
- **Dado** que falla Stripe, **entonces** el carrito se conserva y se muestra un
  error sin marcar el pedido como pagado.

### CA-0.6.0-06 · Importe autoritativo
- El importe cobrado lo calcula el backend en `POST /checkout/session`
  (subtotal + envío − descuento); el front solo muestra un estimado. Un código
  inválido/ya usado al cobrar responde 409 y el front lo desaplica.

### CA-0.6.0-07 · Inventario reflejado
- **Dado** el panel admin, **cuando** se crea/edita un perfume o se ajusta su
  stock (con imagen subida vía `POST /admin/uploads`), **entonces** el cambio se
  refleja en la tienda pública (`GET /products`).

---

**Notas de verificación:** el cargo real con Stripe Checkout y confirmación 3-D Secure
es un servicio externo y **no** se ejercita en la suite
E2E autocontenida; se valida en **staging con Stripe test mode** contra el backend
real. La suite cubre el flujo hasta el límite del pago (guard, resumen, datos,
degradación sin clave) — ver `casos-de-prueba.md`.
