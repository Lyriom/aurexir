---
name: verify
description: Cómo verificar el front de AUREXIR end-to-end en el navegador (con mock del backend FastAPI).
---

# Verificar AUREXIR (Vue 3 + Vite)

## Levantar

```bash
npm run dev            # http://localhost:5173 — usa .env.development → VITE_API_URL=http://localhost:8000
```

Backend: si no está el real (`aurexir-api` en :8000), montar un mock en Python
stdlib (`ThreadingHTTPServer`) que implemente el contrato de `src/api.js` /
`BACKEND_PROMPT.md` con CORS `*` y preflight OPTIONS. Exportar el catálogo así:

```bash
node -e "import('./src/data/products.js').then(m => console.log(JSON.stringify(m.products)))" > /tmp/products.json
```

Añadir a cada producto `stock` (poner alguno en 0 para probar "Agotado") y `active`.
Usuarios de prueba: un `customer` y un `admin` (el rol viene en `user.role` del login).

## Manejar el navegador

No hay Playwright; usar `puppeteer-core` (instalar en el scratchpad, no en el
repo) con el Chrome instalado:
`executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`.

**Gotcha importante**: tras 2-3 navegaciones SPA, los key events de CDP
(`page.type`) dejan de llegar al documento (verificado con listener de captura:
no llegan). Setear campos con el setter nativo + evento `input` (v-model lo
procesa igual):

```js
await page.evaluate((s, v) => {
  const el = document.querySelector(s)
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}, sel, value)
```

También: clicks dentro del drawer del carrito fallan con `page.click` por la
transición → usar `page.evaluate(() => document.querySelector(sel).click())`.

## Flujos que vale la pena recorrer

1. Home: 20 cards; producto con stock 0 muestra "Sold out/Agotado" y botón deshabilitado (prueba que el catálogo vino de la API).
2. Carrito: añadir → cotizar ZIP 10001 estándar/exprés → shipping y total estimado cambian.
3. Pagar sin sesión → /login?next=/%23cart; login OK → reabre drawer; pagar → redirige a checkout_url; /checkout/success vacía el carrito.
4. /account: pedidos con número/estado/totales. Logout.
5. Guards: /admin como customer redirige fuera; token corrupto en localStorage → /account manda a /login.
6. Admin: dashboard con métricas; pedidos pending→paid (botones solo de transiciones válidas); productos: ajustar stock ({delta, reason}).
7. Probes: login con contraseña mala (error legible), 429 (mensaje "demasiados intentos"), API caída (fallback a products.js local + newsletter con error legible).
8. Descuento de bienvenida: popup a los ~8s (solo invitados; frecuencia en localStorage `aurexir_promo_seen`/`aurexir_promo_done`), newsletter devuelve {status, discount_email_sent}; código en el carrito (POST /discounts/validate → línea −15% del subtotal, envío intacto), 409 en checkout/session desaplica el código, pedidos con discount_code/discount_amount.
9. Envío: POST /shipping/quote recibe {items, method} SIN zip; method 'standard' ($20) | 'eco' ($30); 'express' → 422. El carrito cotiza solo al abrir/cambiar método/cambiar cantidades (sin ZIP ni botón Calculate); selector de dos tarjetas Standard/Eco 🌿. Pedidos muestran etiqueta standard/eco/express ('express' solo en históricos). Para verificar la etiqueta 'eco' hace falta un pedido con shipping_method='eco' en el mock.
10. Correos + tracking: POST /checkout/session lleva `locale` (idioma activo) para los correos que envía el back. /checkout/success menciona el correo de confirmación. GET /orders/mine trae tracking_number/tracking_carrier/tracking_url; el detalle del pedido muestra "Envío en camino" + botón "Seguir mi envío" (target=_blank) solo cuando status==='shipped' y hay tracking_number. Admin: PATCH /admin/orders/{id}/tracking {tracking_number, tracking_carrier?, tracking_url?} disponible en pedidos paid (acción "Add tracking", pasa a shipped) y shipped ("Edit tracking", precarga); 200 → fila a shipped + banner de éxito, 409 → no pagado, 422 → URL sin http/https (también validado en cliente). No se llama updateOrderStatus adicional. Mock necesita la ruta /tracking y un pedido shipped seed para el lado cliente.
