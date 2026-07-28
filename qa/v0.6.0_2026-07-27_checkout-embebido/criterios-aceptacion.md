# Criterios de aceptación — v0.6.0 · Checkout embebido + compra con un clic

Fecha: 2026-07-27 · Alcance: página `/checkout` propia (datos de envío + pago con
tarjeta con **Stripe Payment Element**, sin salir del sitio), compra con un clic
("Comprar ahora"), y correo de recibo + factura tras el pago.

Requiere backend nuevo: `POST /checkout/intent`, webhook de Stripe, correo con
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
- **Dado** `/checkout`, **entonces** se piden nombre, teléfono y dirección
  (línea 1/2, ciudad, estado, código postal, país); el nombre viene precargado de
  la cuenta y los campos obligatorios se validan antes de pagar.

### CA-0.6.0-04 · Resumen y total
- **Dado** el carrito, **entonces** el resumen muestra ítems, subtotal, envío
  (según método) y total estimado; el descuento aplicado en el carrito viaja al
  resumen y se puede quitar desde ahí. El envío es gratis con subtotal ≥ $200.

### CA-0.6.0-05 · Pago con tarjeta embebido
- **Dado** que hay clave publicable de Stripe configurada, **entonces** se muestra
  el formulario de tarjeta (Payment Element) y "Pagar $X" con el total.
- **Cuando** el pago se confirma, **entonces** se vacía el carrito y se muestra la
  página de éxito, que indica que se envió el **recibo y la factura (PDF)** por
  correo.
- **Dado** que NO hay clave configurada (o falla la carga), **entonces** se avisa
  "pago no disponible" y el botón de pagar queda deshabilitado (degradación
  elegante; no rompe la página).

### CA-0.6.0-06 · Importe autoritativo
- El importe cobrado lo calcula el backend en `POST /checkout/intent`
  (subtotal + envío − descuento); el front solo muestra un estimado. Un código
  inválido/ya usado al cobrar responde 409 y el front lo desaplica.

### CA-0.6.0-07 · Inventario reflejado
- **Dado** el panel admin, **cuando** se crea/edita un perfume o se ajusta su
  stock (con imagen subida vía `POST /admin/uploads`), **entonces** el cambio se
  refleja en la tienda pública (`GET /products`).

---

**Notas de verificación:** el cargo real con Stripe (Payment Element + iframes +
confirmación 3-D Secure) es un servicio externo y **no** se ejercita en la suite
E2E autocontenida; se valida en **staging con Stripe test mode** contra el backend
real. La suite cubre el flujo hasta el límite del pago (guard, resumen, datos,
degradación sin clave) — ver `casos-de-prueba.md`.
