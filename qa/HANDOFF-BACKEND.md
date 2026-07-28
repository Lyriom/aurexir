# QA AUREXIR → Backend · Contrato verificado y cobertura

Documento de traspaso para el equipo de **backend (FastAPI, `https://api.aurexir.com`)**.
Resume el trabajo de QA hecho sobre el front (Vue 3 + Vite) y, sobre todo, deja
por escrito **el contrato que el front asume de cada endpoint**: método, cuerpo,
respuesta esperada y códigos de error. La suite E2E automatizada valida el front
contra un **backend simulado** que replica exactamente este contrato
([`qa/e2e/mock/api-mock.js`](e2e/mock/api-mock.js)); por eso este documento es la
referencia para comprobar que el backend real **coincide** con lo que el front
espera.

- Fuente de verdad del contrato en el front: [`src/api.js`](../src/api.js).
- Documentación QA por versión: carpetas [`qa/vX.Y.Z_*`](.) + [`qa/README.md`](README.md).
- Suite automatizada: [`qa/e2e/`](e2e/) — **45/45 en verde** (última ejecución local).

> ⚠️ La suite valida el **front contra el contrato simulado**. NO prueba el
> backend real. Si el backend se desvía de lo descrito aquí, el front romperá en
> producción aunque los 45 casos estén verdes. Este documento existe para que el
> backend pueda auto-verificar esa coincidencia. Ver §6 (smoke test).

---

## 1. Convenciones generales

| Aspecto | Contrato que el front asume |
|---|---|
| **Base URL** | `VITE_API_URL` (prod `https://api.aurexir.com`). Sin valor → front en modo solo-catálogo. |
| **Auth** | JWT **Bearer** en header `Authorization: Bearer <token>`. Token en `localStorage`. |
| **Content-Type** | El front **siempre** envía `application/json` (incluso en GET). Respuestas esperadas en JSON. |
| **Errores** | FastAPI estándar: `{"detail": "texto"}` **o** `{"detail": [{"loc":[...], "msg":"..."}]}` en validación 422. |
| **CORS** | El front vive en otro origen. Se requieren cabeceras CORS y respuesta a `OPTIONS` (preflight) para `GET, POST, PATCH`, headers `Content-Type, Authorization`. |
| **id de producto** | El `id` que el front manda al backend **es el slug** (`sauvage-edp`, `khamrah`, …). |
| **204** | Si un endpoint responde 204, el front lo interpreta como body `null` (no intenta parsear JSON). |

### Manejo de errores en el front (importante para el backend)

- **401 en llamada autenticada** → el front **borra el token y cierra sesión**
  (redirige a `/login`). Por tanto: **no devolver 401** salvo que el token sea de
  verdad inválido/expirado. Credenciales malas en `/auth/login` también son 401,
  pero esa ruta es pública y **no** dispara el cierre de sesión.
- **429** → mensaje "demasiados intentos" (rate limit).
- **422 con lista** `detail:[{loc,msg}]` → el front muestra `campo: msg` unido por ` · `.
- **Fallo de red / CORS mal configurado** → el front muestra "no pudimos conectar
  con el servidor". Un CORS mal puesto se ve igual que servidor caído.

---

## 2. Contrato por endpoint

Notación: 🔓 público · 🔒 requiere Bearer · 👑 requiere `role=admin`.
La columna **CP** indica qué caso de prueba lo cubre.

### 2.1 Autenticación

**`POST /auth/register`** 🔓
```jsonc
// req
{ "email": "nuevo@test.com", "password": "min8chars", "name": "Nuevo Cliente" }
// 201
{ "access_token": "…", "token_type": "bearer",
  "user": { "id": "…", "email": "…", "name": "…", "role": "customer" } }
// 422 si password < 8 → detail:[{loc:["body","password"], msg:"…at least 8…"}]
```
CP-0.2.0-17.

**`POST /auth/login`** 🔓
```jsonc
// req
{ "email": "cliente@test.com", "password": "password123" }
// 200 → { access_token, token_type:"bearer", user:{ id,email,name,role } }
// 401 → { detail: "Incorrect email or password" }
// 429 → { detail: "Too many login attempts" }  (>10 intentos/min)
```
CP-0.2.0-04 (401), CP-0.2.0-06 (429). El `role` del `user` decide `customer` vs `admin` (login compartido).

**`GET /auth/me`** 🔒 → `{ id, email, name, role }` · 401 si token inválido.
Usado para **restaurar sesión** al recargar. CP-0.2.0-07, CP-0.2.0-08.

### 2.2 Catálogo (backend = fuente de verdad de precio y stock)

**`GET /products`** 🔓 → array de productos.
```jsonc
{ "id":"sauvage-edp", "name":"Sauvage EDP", "brand":"Dior", "category":"…",
  "price":120, "oldPrice":null, "image":"…", "gallery":[…],
  "stock":10, "active":true }
```
El front trata **stock numérico ≤ 0 como agotado**: badge "Sold out" + botón deshabilitado. CP-0.2.0-01 (20 productos), CP-0.2.0-03 (agotado).

**`GET /products/{slug}`** 🔓 → producto · 404 `{detail:"Product not found"}`.

### 2.3 Envío — `POST /shipping/quote` 🔓

**Ya NO se envía ZIP.** Tarifa plana por método.
```jsonc
// req
{ "items": [ { "id":"coral-fantasy", "qty":1 } ], "method": "standard" }
// 200
{ "subtotal": 130, "shipping": 20, "free_shipping_threshold": 200,
  "method": "standard", "total_estimate": 150 }
// 422 si method no es standard|eco (p.ej. "express")
//     → detail:[{loc:["body","method"], msg:"method must be standard or eco"}]
```
- Métodos válidos: **`standard` ($20)** y **`eco` ($30)**. `express` → **422**.
- **Envío gratis** cuando `subtotal >= free_shipping_threshold` (200) → `shipping: 0`.
- El front **cotiza solo** al abrir el carrito, cambiar método o cambiar cantidades (sin botón "Calcular").

CP-0.4.0-01…08. ⚠️ El front hoy usa un umbral local `FREE_SHIPPING_THRESHOLD=200` para la barra "faltan $X"; el cobro real usa el `shipping` del quote. Mantener ambos alineados (ver §5).

### 2.4 Descuentos — `POST /discounts/validate` 🔓
```jsonc
// req  { "code": "AURX15-TEST01" }
// 200 SIEMPRE (nunca 4xx por código inexistente)
{ "valid": true,  "code": "AURX15-TEST01", "percent": 15 }   // válido
{ "valid": false, "code": "AURX15-NOPE99", "percent": 0 }    // inválido/usado
```
El monto que muestra el front es **`percent%` del subtotal** (el envío NO se
descuenta) y es **solo indicativo**: el descuento real lo aplica el
backend/Stripe en el checkout. CP-0.3.0-06/07/08.

### 2.5 Newsletter — `POST /newsletter` 🔓 (idempotente)
```jsonc
// req  { "email":"x@y.com", "locale":"es" }
// 201  { "status":"subscribed",        "discount_email_sent": true|false }
// 200  { "status":"already_subscribed", "discount_email_sent": true|false }
// 429  rate limit
```
`discount_email_sent` controla el mensaje ("revisa tu correo" vs "te reenviamos"). Repetir el alta **no** debe dar error. CP-0.3.0-02/05.

### 2.6 Checkout embebido — `POST /checkout/intent` 🔒  (flujo principal)
El front cobra la tarjeta **dentro del sitio** con Stripe Payment Element
(deferred intent). Este endpoint recalcula el importe en servidor y devuelve el
`client_secret`.
```jsonc
// req
{ "items": [ { "id":"coral-fantasy", "qty":1 } ],   // id = slug
  "shipping_method": "standard",          // "standard" | "eco"
  "locale": "es",                          // idioma de los correos
  "discount_code": "AURX15-TEST01",        // opcional; omitido si no hay
  "customer": {
    "name": "Cliente Test", "phone": "+1 555 123 4567",   // phone opcional
    "email": "cliente@test.com",                          // del usuario autenticado
    "address": { "line1":"…", "line2":"…?", "city":"…", "state":"…",
                 "postal_code":"…", "country":"US" }       // country ISO alpha-2 MAYÚS
  } }
// 200 → { client_secret, amount (centavos), currency:"usd",
//         breakdown:{ subtotal, shipping, discount, total } }
// 401 sin sesión · 409 { detail } descuento inválido/usado ·
// 422 sin stock o dirección incompleta (detail:[{loc,msg}])
```
- **Importe autoritativo en servidor** (nunca el del cliente). El front muestra un
  estimado con `/shipping/quote` + descuento.
- **Flujo:** `elements.submit()` → `POST /checkout/intent` →
  `stripe.confirmPayment({ clientSecret, confirmParams:{ return_url:".../checkout/success" }, redirect:"if_required" })`.
- El pedido se confirma **SIEMPRE por el webhook de Stripe** (`payment_intent.succeeded`
  → pedido `paid`, descuenta stock, envía **recibo + factura PDF** en `locale`).
  Puede tardar unos segundos en salir como `paid` en `/orders/mine`; el front no
  asume nada del redirect en `/checkout/success`.
- CP-0.6.0-* (checkout, hasta el borde del pago) · el cobro real se valida en
  staging (Stripe test mode).

### 2.6b Checkout hospedado — `POST /checkout/session` 🔒  (compat, en desuso)
Sigue existiendo por compatibilidad; el front ya **no** lo usa (migró al embebido).
```jsonc
// req  { items, shipping_method, locale, discount_code?, success_url, cancel_url }
// 200 → { "checkout_url": "https://checkout.stripe.com/…" }
// 401 no autenticado · 409 { detail } descuento inválido/usado
```

### 2.7 Pedidos del cliente — `GET /orders/mine` 🔒 → array
```jsonc
{ "id":"o4", "number":"AX-1004", "status":"shipped",
  "subtotal":120, "shipping_cost":20, "tax":0, "total":140,
  "discount_code":null, "discount_amount":0,
  "shipping_method":"standard",              // standard|eco|express (express = históricos)
  "created_at":"2026-07-09T12:00:00Z",
  "tracking_number":"1Z999AA10123456784",    // ← si hay, y status=shipped, el front
  "tracking_carrier":"UPS",                   //    muestra bloque "Envío en camino" +
  "tracking_url":"https://www.ups.com/track?…", //  botón "Seguir mi envío" (pestaña nueva)
  "user":{ id,email,name },
  "items":[ { id,name,brand,unit_price,qty,image } ] }
```
- **`status`** ∈ `pending|paid|shipped|delivered|canceled`.
- El **bloque de tracking** aparece solo si `status=="shipped"` **y** hay
  `tracking_number`. CP-0.5.0-03/04/05.
- `discount_code`/`discount_amount` se muestran como línea "Descuento (CODE) −$X". CP-0.3.0-12.
- `shipping_method` se rotula standard/eco/express (Express legible para pedidos históricos). CP-0.4.0-08.

CP-0.2.0-12 valida número, estado y total.

### 2.8 Admin 👑 (403 `{detail:"Admin only"}` si el rol no es admin)

**`GET /admin/metrics?days=30`** →
```jsonc
{ "revenue_total":4820.5, "orders_count":23, "aov":209.58, "new_customers":9,
  "revenue_by_day":[ {date,revenue,orders}, … ],
  "top_products":[ {slug,name,units,revenue}, … ],
  "low_stock":[ {slug,name,stock}, … ] }
```
CP-0.2.0-13 (muestra `$4,820.50`).

**`GET /admin/orders?status=`** → pedidos (filtrado opcional por status). CP-0.2.0-14/15.

**`PATCH /admin/orders/{id}`** — cambio de estado con transiciones válidas:
```
pending → paid|canceled     paid → shipped|canceled
shipped → delivered|canceled    delivered/canceled → (ninguna)
```
Transición inválida → **409** `{detail:"Invalid transition X -> Y"}`. El front
**solo ofrece botones para transiciones válidas** (p.ej. un `paid` no ofrece
saltar a `delivered`). CP-0.2.0-14/15.

**`PATCH /admin/orders/{id}/tracking`** — alta/edición de seguimiento:
```jsonc
// req  { "tracking_number":"1Z…", "tracking_carrier":"UPS", "tracking_url":"https://…" }
// 200 → pedido actualizado. El back pasa status a "shipped" y NOTIFICA por correo.
//        (El front NO llama además a updateOrderStatus.)
// 409 → { detail:"El pedido no está pagado" }   (solo paid/shipped admiten tracking)
// 422 → tracking_url sin http/https  ó  tracking_number vacío
```
- El front solo muestra "Add tracking"/"Edit tracking" en pedidos `paid`/`shipped`
  (nunca `pending`, para evitar el 409). CP-0.5.0-06/07/08/09/10.
- `tracking_carrier` y `tracking_url` son opcionales; se omiten si vacíos.

**Productos:**
- `GET /admin/products` → todos (incluye inactivos/stock 0).
- `POST /admin/products` → 201 con el producto creado.
- `PATCH /admin/products/{id}` → edición parcial.
- `PATCH /admin/products/{id}/stock` — `{ "delta": +5, "reason":"manual" }` → 200
  con stock actualizado; `delta` **debe ser entero** (si no → 422). CP-0.2.0-16.
- **`POST /admin/uploads`** (multipart/form-data, campo `file`) → **201** `{ url }`.
  Imagen `webp|jpeg|png`, ≤ 5 MB (**SVG no**). `403` no admin · `413` > 5 MB ·
  `422` tipo no permitido / no es imagen. El front sube la imagen al crear/editar
  un perfume y pone la `url` en `image` (y `gallery`). Se sirve desde
  `https://api.aurexir.com/media/…` → ya permitido por la CSP (`img-src`); si se
  usa otro dominio/CDN, avisar para actualizar `nginx.conf`.

---

## 3. Reglas de negocio que el backend debe garantizar

Verificadas en el front; el backend es quien debe hacerlas ciertas de verdad:

1. **Stock ≤ 0 = agotado.** El front deshabilita compra, pero el backend debe
   rechazar/validar stock al crear la sesión de checkout.
2. **Envío gratis por umbral** sobre el **subtotal** (no sobre el total con
   descuento). El descuento NO afecta el envío.
3. **`express` ya no es cotizable** (422). Solo existe como etiqueta de pedidos
   históricos en `GET /orders/mine`.
4. **Descuento indicativo en el front, autoritativo en el back.** El monto real y
   la validez (topes, un solo uso, exclusiones) los decide el backend; el 409 en
   checkout es el mecanismo para rechazar un código que dejó de ser válido.
5. **Tracking dispara el correo.** `PATCH …/tracking` debe (a) pasar a `shipped`,
   (b) guardar el tracking y (c) enviar el correo de "envío en camino" en el
   `locale` del pedido. El front asume que **una sola** llamada hace las tres cosas.
6. **`locale` en checkout** debe propagarse a TODOS los correos del pedido.
7. **401 solo cuando el token es inválido de verdad** (ver §1) — un 401 espurio
   cierra la sesión del cliente.

---

## 4. Cobertura de pruebas (45 casos automatizados)

Cada test lleva el **ID del caso** en el título → mapea 1:1 con los
`casos-de-prueba.md` de cada carpeta de versión.

| Versión | Archivo spec | Casos | Foco |
|---|---|---|---|
| v0.1.0 | [`v0.1.0-basics.spec.js`](e2e/v0.1.0-basics.spec.js) | CP-0.1.0-01/02/04/06 | i18n EN↔ES, carrito persistente, barra envío gratis, buscador |
| v0.2.0 | [`v0.2.0.spec.js`](e2e/v0.2.0.spec.js) | CP-0.2.0-01/03/04/05/06/07/08/09/11/12/13/14-15/16/17 | Catálogo API+stock, auth+roles, guards, checkout, mis pedidos, admin (métricas, transiciones, stock), registro |
| v0.3.0 | [`v0.3.0.spec.js`](e2e/v0.3.0.spec.js) | CP-0.3.0-01/02/03/05/06/07-08/09/10/11/12/13 | Popup bienvenida, newsletter, validar código, línea de descuento, 409 al pagar, descuento en pedidos/admin |
| v0.4.0 | [`v0.4.0.spec.js`](e2e/v0.4.0.spec.js) | CP-0.4.0-01…08 | Sin ZIP, selector Standard/Eco, cotización automática, gratis ≥$200, `shipping_method` en checkout, etiquetas |
| v0.5.0 | [`v0.5.0.spec.js`](e2e/v0.5.0.spec.js) | CP-0.5.0-01-02/03-04/05/06/07/08/09/10 | `locale` en checkout, aviso de correo, bloque de tracking, alta/edición tracking en admin, validación de URL |

**Cómo se corre** (autocontenido, no necesita la API real):
```bash
npm run test:e2e                     # 45 casos, ~1 min (Chrome del sistema, headless)
npm run test:e2e -- -g CP-0.5.0-08   # un caso por ID
npm run test:e2e:ui                  # modo interactivo
```

---

## 5. Puntos donde el backend debe confirmar la coincidencia

Riesgos QA que dependen del backend (de [`qa/README.md`](README.md) §Riesgos):

1. **Umbral de envío gratis duplicado.** El front tiene `FREE_SHIPPING_THRESHOLD=200`
   local para la barra "faltan $X"; el cobro usa `free_shipping_threshold` del
   quote. **Si el back cambia el umbral, avisar** para actualizar el front (o el
   front debería leerlo del quote).
2. **Tarifas $20/$30 rotuladas en el front.** El importe cobrado siempre viene del
   quote, pero el rótulo del selector está fijo. **Si cambian las tarifas, avisar.**
3. **Regla de descuento.** El front calcula `percent%` del subtotal. Si el back
   introduce topes/exclusiones/ítems no elegibles, la línea mostrada diferirá del
   cargo real de Stripe. Confirmar la regla exacta.
4. **"Marcar como enviado" (admin) sigue disponible en pedidos `paid`** aparte de
   "Añadir seguimiento". Marcar enviado por esa vía **NO** captura tracking ni
   dispara el correo con número. Decisión de negocio pendiente: ¿forzar siempre el
   envío vía tracking?
5. **Formato de fecha/moneda.** El front asume `created_at` ISO-8601 y montos
   numéricos (no strings). Confirmar tipos.

---

## 6. Cómo validar el backend real contra este contrato (smoke test)

Antes de cada release conviene ejecutar, contra `https://api.aurexir.com`, un
smoke test de los flujos **P0** y comparar la forma de las respuestas con §2:

```bash
API=https://api.aurexir.com

# 1) Catálogo: 200 + array con id/price/stock/active
curl -s $API/products | jq '.[0] | {id,price,stock,active}'

# 2) Login: 200 + {access_token, user:{role}}
TOKEN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"…","password":"…"}' | jq -r .access_token)

# 3) Quote: standard/eco 200, express 422
curl -s -X POST $API/shipping/quote -H 'Content-Type: application/json' \
  -d '{"items":[{"id":"coral-fantasy","qty":1}],"method":"standard"}' | jq
curl -s -o /dev/null -w '%{http_code}\n' -X POST $API/shipping/quote \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"id":"coral-fantasy","qty":1}],"method":"express"}'   # espera 422

# 4) Descuento: 200 con {valid, percent}
curl -s -X POST $API/discounts/validate -H 'Content-Type: application/json' \
  -d '{"code":"AURX15-TEST01"}' | jq

# 5) Checkout (con TOKEN): 200 + {checkout_url}; incluye locale y shipping_method
curl -s -X POST $API/checkout/session -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"id":"coral-fantasy","qty":1}],"shipping_method":"eco","locale":"es","success_url":"https://x/s","cancel_url":"https://x/c"}' | jq

# 6) Mis pedidos: array con status/shipping_method/tracking_*
curl -s $API/orders/mine -H "Authorization: Bearer $TOKEN" | jq '.[0]'
```

**Checklist de coincidencia** (marcar contra §2):
- [ ] `/products` incluye `stock` y `active`; el slug es el `id`.
- [ ] login devuelve `role`; 401 solo con credenciales malas; 429 con rate limit.
- [ ] `/shipping/quote` acepta `{items,method}` **sin zip**; `express`→422; gratis ≥ umbral.
- [ ] `/discounts/validate` responde **200** siempre con `{valid,percent}`.
- [ ] `/checkout/session` acepta `locale` y `shipping_method`; 409 con código usado; devuelve `checkout_url`.
- [ ] correo de confirmación se envía en el `locale` recibido.
- [ ] `/orders/mine` trae `tracking_number/carrier/url` y `shipping_method`.
- [ ] `PATCH /admin/orders/{id}/tracking` → shipped + correo en **una** llamada; 409 si no pagado; 422 URL inválida.
- [ ] transiciones de estado inválidas → 409.
- [ ] CORS + preflight OPTIONS habilitados para el origen del front.

---

*Generado por QA. Referencia viva: si el contrato del backend cambia, actualizar
[`src/api.js`](../src/api.js), el mock [`qa/e2e/mock/api-mock.js`](e2e/mock/api-mock.js)
y este documento en el mismo commit.*
