# QA — AUREXIR (front Vue 3 + Vite)

Documentación de calidad del front de AUREXIR. Cada **carpeta = una versión**
entregada, nombrada `vX.Y.Z_AAAA-MM-DD_slug`, para tener trazabilidad entre el
código (commit), la funcionalidad y sus pruebas.

Cada carpeta contiene:
- **`criterios-aceptacion.md`** — qué debe cumplir la versión para darse por
  aceptada (formato Gherkin *Dado/Cuando/Entonces* + checklist).
- **`casos-de-prueba.md`** — casos de uso y pruebas paso a paso, con resultado
  esperado, prioridad y estado.

Convenciones de IDs:
- `CA-<ver>-NN` → Criterio de Aceptación (p. ej. `CA-0.2.0-03`).
- `CP-<ver>-NN` → Caso de Prueba (p. ej. `CP-0.3.0-05`).
- Prioridad: **P0** crítico (bloquea venta/pago/seguridad) · **P1** alto ·
  **P2** medio.
- Estado: ✅ verificado (ejecutado en navegador) · ⬜ pendiente · ⚠️ con
  observación.

> Nota: los estados ✅ reflejan verificación **end-to-end en navegador
> (Chrome headless)** contra un backend simulado que replica el contrato de
> `src/api.js`. Antes de cada release conviene re-ejecutar los casos P0/P1
> contra `https://api.aurexir.com`.

---

## Matriz de trazabilidad (versión → commit → alcance)

| Versión | Fecha | Commit | Alcance | Áreas de código |
|---|---|---|---|---|
| [v0.1.0](v0.1.0_2026-07-12_catalogo-base/) | 2026-07-12 | `3a6e6af` (y previos 07-06…07-12) | Catálogo estático de 20 perfumes, sitio bilingüe EN/ES, carrito en localStorage, pedidos por WhatsApp/Instagram, barra de envío gratis $200 | `data/products.js`, `i18n.js`, `store.js`, `components/*` |
| [v0.2.0](v0.2.0_2026-07-14_backend-auth-checkout-admin/) | 2026-07-14 | `5db8ef7` | Conexión al backend real: catálogo desde API con stock, auth JWT con roles, checkout Stripe, cuenta + "Mis pedidos", panel admin (métricas, pedidos, productos), router con guards | `api.js`, `auth.js`, `catalog.js`, `router.js`, `pages/*`, `components/admin/*` |
| [v0.3.0](v0.3.0_2026-07-15_descuento-bienvenida/) | 2026-07-15 | `ef2eac6` | Descuento de bienvenida 15%: popup de captura de email, código en el carrito, línea de descuento en pedidos | `PromoModal.vue`, `newsletter.js`, `store.js`, `CartDrawer.vue`, `AccountPage.vue`, `admin/AdminOrders.vue` |
| [v0.4.0](v0.4.0_2026-07-15_envios-standard-eco/) | 2026-07-15 | `f5b1498` | Nuevo sistema de envíos: Standard $20 / Eco $30, sin ZIP, cotización automática | `api.js`, `CartDrawer.vue`, `i18n.js`, `AccountPage.vue`, `admin/AdminOrders.vue` |
| [v0.5.0](v0.5.0_2026-07-17_correos-y-tracking/) | 2026-07-17 | `5ccae56` | Correos de pedido (envío de `locale` en checkout) y seguimiento de envíos (bloque de tracking en "Mis pedidos" + alta/edición en admin) | `api.js`, `CartDrawer.vue`, `CheckoutSuccessPage.vue`, `AccountPage.vue`, `admin/AdminOrders.vue` |

Versión actual del producto: **v0.5.0**.

---

## Entorno y datos de prueba

- **URL API:** `VITE_API_URL` — prod `https://api.aurexir.com`, dev
  `http://localhost:8000`. Sin `VITE_API_URL` el front corre en **modo solo
  catálogo** (sin login/checkout/admin; pedidos por WhatsApp/Instagram).
- **Rutas:** `/` landing, `/login`, `/account` (requiere sesión),
  `/admin` (requiere `role=admin`), `/checkout/success`, `/checkout/cancel`.
- **Roles:** `customer` (registro) y `admin` (sembrado en el backend).
- **Stripe (test):** tarjeta `4242 4242 4242 4242`, fecha futura, CVC cualquiera.
- **localStorage relevante:** `aurexir-token` (sesión), `aurexir-cart`
  (carrito), `aurexir-discount` (código aplicado), `aurexir-locale` (idioma),
  `aurexir_promo_seen` / `aurexir_promo_done` (frecuencia del popup).

---

## Riesgos y observaciones transversales (revisión QA)

Estos puntos no son defectos bloqueantes, pero deben vigilarse en regresión:

1. **Umbral de envío gratis duplicado.** La barra "Add $X more for FREE
   shipping" usa la constante local `FREE_SHIPPING_THRESHOLD = 200`
   (`config.js`), mientras el importe de envío real viene del backend
   (`free_shipping_threshold` del quote). Si el backend cambia el umbral, la
   barra puede desalinearse del cobro real. *Recomendación:* alimentar la barra
   desde el quote cuando exista.
2. **Tarifas $20/$30 mostradas en el selector de envío** están fijas en el
   front (`CartDrawer.vue`); el importe cobrado siempre proviene del quote del
   backend. Si cambian las tarifas en el backend, actualizar también el rótulo.
3. **Monto de descuento calculado en el cliente** (`percent%` del subtotal) es
   solo indicativo; el descuento real lo aplica Stripe/el backend. Si el backend
   cambiara la regla (topes, exclusión de ítems), la línea mostrada podría
   diferir del cargo final.
4. **Código de descuento persistido** en `localStorage`; no se re-valida hasta
   el checkout. Un código válido al aplicarlo puede resultar inválido/usado al
   pagar → el backend responde 409 y el front lo desaplica (cubierto).
5. **Admin: "Marcar como enviado" sigue disponible en pedidos `paid`** junto a
   "Añadir seguimiento". Marcar enviado por esa vía **no** captura tracking ni
   dispara el correo con número. Decisión de diseño; validar con negocio si se
   desea forzar el envío siempre vía tracking.
6. **Modo solo catálogo:** con `VITE_API_URL` vacío, login/checkout/admin/
   descuento/tracking quedan inactivos por diseño; el sitio debe seguir
   funcionando como catálogo con WhatsApp/Instagram.
