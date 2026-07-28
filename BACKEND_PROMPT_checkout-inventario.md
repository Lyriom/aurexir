# Prompt para el backend — Checkout embebido + Inventario (AUREXIR)

> Pégalo tal cual a tu IA/dev de backend. Contexto: FastAPI en
> `https://api.aurexir.com`, ya con auth JWT, catálogo, envíos, descuentos,
> pedidos y panel admin (ver el contrato en `qa/HANDOFF-BACKEND.md`). El front
> (Vue 3) ya está implementado contra ESTE contrato; hay que construir la parte
> de backend.

---

## Contexto y objetivo

El front cambió el pago: en vez de redirigir a Stripe Checkout, ahora **cobra la
tarjeta DENTRO del sitio** con **Stripe Payment Element** (deferred intent) y
recoge nombre/teléfono/dirección en una página `/checkout` propia. Tras el pago
hay que **enviar por correo un recibo + una factura en PDF**. Además, el admin
debe poder **subir la imagen** al crear un perfume para que aparezca en la tienda.

Necesito que implementes:

1. `POST /checkout/intent` — crea el PaymentIntent de Stripe (importe calculado en
   servidor) y devuelve el `client_secret`.
2. `POST /webhooks/stripe` — confirma el pago, crea/actualiza el pedido como
   pagado, descuenta stock y dispara el correo con recibo + factura PDF.
3. Correo transaccional con **recibo (cuerpo)** + **factura PDF (adjunto)**,
   localizado por `locale`.
4. `POST /admin/uploads` — subida de imagen de producto; devuelve una URL usable
   como `image` del producto.

Variables de entorno del backend: `STRIPE_SECRET_KEY` (sk_…),
`STRIPE_WEBHOOK_SECRET` (whsec_…). La **clave publicable** (pk_…) va en el front
(`VITE_STRIPE_PUBLISHABLE_KEY`); NO la manejes tú.

---

## 1) `POST /checkout/intent`  🔒 (requiere Bearer)

Crea un PaymentIntent y (recomendado) un pedido `pending` asociado.

**Request**
```jsonc
{
  "items": [ { "id": "coral-fantasy", "qty": 1 } ],   // id = slug
  "shipping_method": "standard",                        // "standard" | "eco"
  "locale": "es",                                        // "es" | "en" (idioma de los correos)
  "discount_code": "AURX15-TEST01",                      // opcional
  "customer": {
    "name": "Cliente Test",
    "phone": "+1 555 123 4567",
    "email": "cliente@test.com",                         // el del usuario autenticado
    "address": {
      "line1": "123 Fifth Ave",
      "line2": "Apt 4B",                                 // opcional
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "US"                                    // ISO-3166 alpha-2
    }
  }
}
```

**Lógica (CRÍTICO — nunca confíes en importes del cliente):**
1. Verifica sesión (401 si no).
2. Recalcula **todo en servidor** con los precios y stock de la BD:
   - `subtotal` = Σ (precio_BD × qty). Rechaza si algún ítem no existe o no hay
     stock suficiente → **422** con `detail:[{loc,msg}]`.
   - `shipping` = `standard` $20 · `eco` $30; **gratis (0)** si `subtotal ≥ 200`.
     `express` no es válido → 422.
   - `discount`: valida el código (existe, no usado, no expirado). Si es
     inválido/ya usado → **409** `{ "detail": "Código de descuento inválido o ya usado" }`.
     Monto = `percent% × subtotal` (el envío NO se descuenta).
   - `total = subtotal − discount + shipping`. `amount = round(total × 100)` (centavos, USD).
3. Crea el **PaymentIntent** de Stripe:
   - `amount`, `currency: "usd"`, `automatic_payment_methods: { enabled: true }`.
   - `receipt_email` = email del usuario.
   - `metadata`: `user_id`, `order_id`, `shipping_method`, `discount_code`,
     `locale`, y lo necesario para reconstruir el pedido en el webhook.
   - Guarda nombre/teléfono/dirección en `shipping` del PaymentIntent y en el pedido.
4. Recomendado: crea un **Order** en estado `pending` con estos datos y su
   `payment_intent_id`, para que aparezca en `/orders/mine` y el webhook solo lo
   pase a `paid`.

**Response 200**
```jsonc
{
  "client_secret": "pi_..._secret_...",
  "amount": 15000,                 // centavos, informativo
  "currency": "usd",
  "breakdown": { "subtotal": 130, "shipping": 20, "discount": 0, "total": 150 }
}
```
**Errores:** `401` no autenticado · `409` descuento inválido/usado · `422`
validación / sin stock. Idempotencia: si el mismo carrito reintenta, puedes
reutilizar o recrear el PI; el front llama a este endpoint una vez por intento de
pago (tras `elements.submit()`), luego confirma con `stripe.confirmPayment`.

> Nota de flujo del front (para que encaje): usa **deferred intent** → primero
> `elements.submit()`, luego llama a este endpoint para obtener el `client_secret`,
> y por último `stripe.confirmPayment({ clientSecret, confirmParams:{ return_url:
> ".../checkout/success" }, redirect: "if_required" })`. Con 3-D Secure el
> navegador va al `return_url` con `?payment_intent=...&payment_intent_client_secret=...`;
> el pedido se confirma SIEMPRE por el webhook (no dependas del redirect).

---

## 2) `POST /webhooks/stripe`  (público, verificado por firma)

- **Verifica la firma** con `STRIPE_WEBHOOK_SECRET` (header `Stripe-Signature`).
  Si falla → 400.
- Escucha `payment_intent.succeeded`:
  1. Localiza el pedido por `payment_intent_id` (o recréalo desde `metadata`).
  2. Márcalo **`paid`**, guarda importes y dirección definitivos.
  3. **Descuenta stock** de cada ítem; marca el código de descuento como usado.
  4. Genera la **factura PDF** (ver §3) y **envía el correo** recibo + factura.
- **Idempotente**: Stripe reintenta; si el pedido ya está `paid`, responde 200 sin
  duplicar correo/stock (usa el `event.id` o un flag en el pedido).
- Opcional: `payment_intent.payment_failed` → marca intento fallido / notifica.
- Responde 200 rápido; haz el PDF/correo en background si tarda.

---

## 3) Correo transaccional: recibo + factura PDF

Un solo correo al comprador (email del usuario), **en el `locale` del pedido**:

- **Cuerpo (recibo):** marca AUREXIR, nº de pedido, fecha, lista de ítems
  (marca, nombre, cantidad, precio), subtotal, descuento (si hay), envío, **total**,
  método de envío y dirección de entrega. Enlace a "Mis pedidos".
- **Adjunto (factura / comprobante):** PDF con:
  - Nº de factura **secuencial** y fecha.
  - Emisor: AUREXIR — GOZSYL LLC (datos fiscales/país que corresponda).
  - Cliente: nombre, dirección, email/teléfono.
  - Detalle de líneas, subtotal, descuento, envío, impuestos (si aplica), total, USD.
- Sugerencia: plantillas ES/EN; PDF con WeasyPrint / ReportLab; envío con el
  proveedor que ya uses (los correos de confirmación/tracking ya existen).

> El front ya anuncia al comprador "te enviamos el recibo y la factura (PDF)".

---

## 4) Inventario — subida de imagen de producto

El admin ya crea/edita productos (`POST /admin/products`, `PATCH …`) y ajusta
stock; el catálogo público (`GET /products`) refleja los cambios. Falta la imagen:

**`POST /admin/uploads`  👑 (multipart/form-data)**
- Campo `file` (image/webp|jpeg|png, límite ~5 MB). Valida tipo y tamaño.
- Guarda el archivo (disco/S3/CDN) y responde:
  ```jsonc
  { "url": "https://api.aurexir.com/media/perfumes/mi-perfume-abc123.webp" }
  ```
- Sirve las imágenes desde **`https://api.aurexir.com`** (o un CDN). El front ya
  permite ese origen en la CSP (`img-src`). Si usas otro dominio/CDN, **avísame**
  para añadirlo a la CSP del front (`nginx.conf`).

El front pondrá esa `url` como `image` (y `gallery`) del producto al crearlo. El
`POST /admin/products` debe aceptar el mismo shape que hoy (id/slug, name, brand,
category, price, oldPrice, image, gallery, desc{en,es}, tag, tone, rating,
reviews, isNew, isBest, notes, stock, active) y persistirlo para que
`GET /products` lo devuelva de inmediato.

---

## Resumen de lo que espera el front

- [ ] `POST /checkout/intent` → `{ client_secret, amount, currency, breakdown }`;
      importe autoritativo en servidor; 409 descuento, 422 stock/validación.
- [ ] `POST /webhooks/stripe` con verificación de firma → pedido `paid`, stock,
      correo recibo + factura PDF; idempotente.
- [ ] Correo con recibo (cuerpo) + factura PDF (adjunto), localizado por `locale`.
- [ ] `POST /admin/uploads` → `{ url }`; imágenes servidas desde api.aurexir.com.
- [ ] `payment_methods` automáticos (tarjeta + wallets) en el PaymentIntent.
- [ ] (Opcional) puedes deprecar `POST /checkout/session` (checkout hospedado):
      el front ahora usa el flujo embebido, aunque el cliente API mantiene ambos.

*Cualquier cambio de contrato (dominio de imágenes, forma del breakdown, campos
del pedido) debe reflejarse también en `src/api.js`, el mock
`qa/e2e/mock/api-mock.js` y `qa/HANDOFF-BACKEND.md` del front.*
