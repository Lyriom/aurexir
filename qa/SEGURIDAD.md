# Seguridad — AUREXIR front (Vue 3 + Vite)

Auditoría de seguridad del front y endurecimiento aplicado. Objetivo: dejar la
app **blindada ante ataques reales** en la parte que le corresponde al cliente
(navegador), y dejar por escrito lo que **debe** garantizar el backend, que es
donde vive el límite de seguridad de verdad.

- Fecha: 2026-07-20 · Alcance: código de [`src/`](../src), build de Vite,
  despliegue Nginx ([`nginx.conf`](../nginx.conf), [`Dockerfile`](../Dockerfile)).
- Complemento para el backend: [`qa/HANDOFF-BACKEND.md`](HANDOFF-BACKEND.md) §3 y §6.

> **Modelo de amenaza, en una frase:** el front es código que corre en el
> navegador del usuario y **no puede guardar secretos ni imponer reglas de
> negocio**. Todo control real (precios, stock, descuentos, permisos, sesión)
> se decide en el backend. El front endurece lo suyo: no ejecutar código
> ajeno (XSS), no filtrar datos, y no confiar ciegamente en las respuestas.

---

## 1. Resumen ejecutivo

**Veredicto:** el front no presentaba vulnerabilidades explotables directas
(no hay sinks de XSS, las dependencias están limpias), pero **carecía por
completo de cabeceras de seguridad** y confiaba sin validar en URLs venidas del
backend. Se aplicaron todos los endurecimientos de front razonables. El riesgo
residual depende ahora del backend (§5).

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| H1 | Sin cabeceras de seguridad en Nginx (sin CSP, anti-clickjacking, nosniff, etc.) | **Media** | ✅ Corregido |
| H2 | URLs del backend (`tracking_url`, `checkout_url`) usadas sin validar el esquema → riesgo `javascript:`/`data:` | Baja | ✅ Corregido |
| H3 | Archivos `.env` versionados (sin secretos hoy, pero footgun con Vite) | Informativa | ✅ Mitigado |
| H4 | JWT en `localStorage` (accesible a JS → alto valor si algún día hay XSS) | Baja (aceptada) | ⚠️ Compensada con CSP |
| — | Sin XSS, sin `eval`, `rel=noopener` en todos los `_blank`, deps sin CVEs | — | ✅ Ya estaba bien |

---

## 2. Metodología

1. **Análisis de dependencias:** `npm audit` → 0 vulnerabilidades (árbol mínimo:
   solo `vue` + `vue-router`).
2. **Búsqueda de sinks de XSS:** `v-html`, `innerHTML`, `outerHTML`,
   `insertAdjacentHTML`, `document.write`, `eval`, `new Function` → **ninguno**.
3. **Revisión de navegación/redirects:** `window.location`, `window.open`,
   `:href` dinámicos, `target="_blank"`.
4. **Manejo de credenciales:** almacenamiento de token, flujo 401, `autocomplete`.
5. **Config de despliegue:** `nginx.conf`, `Dockerfile`, `.env*`, `.gitignore`.
6. **Verificación en navegador real** (Chrome vía Playwright): que la CSP no
   rompa la app + re-ejecución de la suite E2E de 45 casos.

---

## 3. Controles que ya estaban bien

- **Sin sinks de XSS.** No se usa `v-html` ni manipulación de DOM con HTML crudo;
  Vue **auto-escapa** toda interpolación `{{ }}`. La búsqueda, los nombres de
  producto y los datos de pedido se muestran escapados.
- **`rel="noopener noreferrer"` en TODOS los enlaces `target="_blank"`**
  (tracking, WhatsApp, Instagram) → sin *reverse tabnabbing* ni fuga de referrer.
- **`window.open(...)` con `opener = null`** al abrir el DM de Instagram.
- **`autocomplete` correcto** en el login (`current-password` / `new-password`).
- **Sesión:** un 401 en llamada autenticada **borra el token y cierra sesión**;
  un 401 público (login fallido) no la toca.
- **Precios/totales del cliente son solo indicativos:** el cargo real lo hace
  Stripe con datos recomputados por el backend. Manipular el carrito en el
  navegador no altera el cobro.
- **Dependencias:** 0 CVEs; superficie mínima.

---

## 4. Endurecimiento aplicado

### H1 · Cabeceras de seguridad en Nginx  → [`nginx.conf`](../nginx.conf)

Antes no se enviaba **ninguna**. Ahora, en todas las respuestas (`always`):

| Cabecera | Valor | Protege contra |
|---|---|---|
| `Content-Security-Policy` | ver abajo | XSS (mitigación principal), inyección de recursos |
| `X-Frame-Options` | `DENY` | clickjacking (navegadores viejos) |
| `Content-Security-Policy: frame-ancestors 'none'` | — | clickjacking (moderno) |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | fuga de URLs a terceros |
| `Permissions-Policy` | cámara/micro/geo/pago/usb `()` | abuso de APIs del navegador |
| `Cross-Origin-Opener-Policy` | `same-origin` | XS-Leaks / abuso de `opener` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | downgrade a HTTP |
| `server_tokens off` | — | fingerprinting de versión |

**CSP (lista blanca de lo que la app realmente usa):**
```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none';
form-action 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self';
connect-src 'self' https://api.aurexir.com; upgrade-insecure-requests
```
- `script-src 'self'` → el build de Vite no genera scripts inline (verificado en
  `dist/index.html`). Cualquier `<script>` inyectado quedaría **bloqueado**.
- `style-src 'unsafe-inline'` es necesario por los estilos `:style` de Vue y el
  CSS de Google Fonts; **no** habilita ejecución de scripts.
- `connect-src` solo permite la API de AUREXIR (ajustar si cambia el dominio).

> ⚠️ HSTS solo lo aplica el navegador sobre HTTPS. Si Easypanel/Traefik termina
> el TLS por delante, conviene fijar HSTS **también** en ese borde.

### H2 · No confiar en URLs del backend  → [`src/security.js`](../src/security.js)

Nuevo helper `isHttpUrl()` / `safeHttpUrl()`: una URL solo se usa como `href` o
destino de navegación si es **http(s) absoluta**. Rechaza `javascript:`, `data:`,
`blob:`, rutas relativas, etc.
- [`AccountPage.vue`](../src/pages/AccountPage.vue): el botón "Seguir mi envío"
  solo se renderiza si `safeHttpUrl(order.tracking_url)` es válida.
- [`CartDrawer.vue`](../src/components/CartDrawer.vue): antes de
  `window.location.href = checkout_url` se exige `isHttpUrl(checkout_url)`.

Esto es **defensa en profundidad**: aunque el backend ya valida el esquema, un
dato manipulado en BD o una respuesta alterada no puede convertirse en XSS.

### H3 · Higiene de `.env`  → [`.gitignore`](../.gitignore)

Se ignoran `.env.local` y `.env.*.local`, con nota explícita: **toda variable
`VITE_*` se embebe en el bundle público**, así que jamás debe contener secretos
(claves Stripe, tokens). Los `.env` versionados hoy solo llevan la URL pública de
la API — sin secretos. Los secretos viven exclusivamente en el backend.

### H4 · JWT en `localStorage` (riesgo aceptado, compensado)

Guardar el JWT en `localStorage` lo hace accesible a JavaScript: si algún día se
introduce un XSS, el token es robable. Se deja así por simplicidad (evita CSRF y
no requiere cookies), y el riesgo se **compensa** con: (a) ausencia de sinks de
XSS y (b) la nueva CSP con `script-src 'self'`. Migrar a cookie
`HttpOnly; Secure; SameSite=Strict` es la mejora futura (requiere soporte del
backend y protección CSRF) — ver §6.

---

## 5. Responsabilidades del backend (el límite de seguridad real)

El front ya no puede hacer más; estos controles **deben** vivir en el backend.
Detalle y comandos de verificación en [`HANDOFF-BACKEND.md`](HANDOFF-BACKEND.md) §3/§6.

- **Recalcular TODO en servidor:** precio, stock, subtotal, envío, descuento y
  total. Nunca confiar en importes que manda el cliente. El carrito del front es
  solo `[{id, qty}]`; el backend pone los precios.
- **Autorización a nivel de objeto:** `/orders/mine` solo devuelve pedidos del
  usuario del token; los endpoints `/admin/*` exigen `role=admin` (403 si no).
  Verificar que un cliente no pueda leer/mutar pedidos de otro (IDOR).
- **Auth:** hash de contraseñas (bcrypt/argon2), JWT firmado y con expiración,
  **rate limit** en `/auth/login` y `/newsletter` (429).
- **Descuentos:** validez, un solo uso y topes decididos en servidor; el 409 en
  checkout es el mecanismo para rechazar un código ya usado.
- **CORS:** `Access-Control-Allow-Origin` restringido al origen del front en
  producción (verificado: la API **ya** rechaza orígenes ajenos — correcto).
- **Stripe:** verificar la **firma del webhook**; nunca marcar pagado sin ella.
- **TLS válido en el borde** (antes se detectó un certificado self-signed
  CN=Easypanel; debe ser un cert válido de Let's Encrypt).
- **Validación server-side de `tracking_url`** (esquema http/https) — ya en el
  contrato; mantenerla como fuente de verdad.

---

## 6. Recomendaciones pendientes (no aplicadas, con justificación)

1. **Auto-hospedar las fuentes** (quitar `fonts.googleapis.com`/`gstatic.com`).
   Permitiría cerrar la CSP a solo `'self'`, eliminar un tercero y mejorar
   privacidad/latencia. No aplicado por no alterar el look sin tu visto bueno.
2. **JWT en cookie `HttpOnly; Secure; SameSite`** en vez de `localStorage`
   (elimina el robo de token por XSS). Requiere cambios de backend + CSRF.
3. **HSTS con `preload`** y config TLS endurecida en Easypanel/Traefik (borde).
4. **CAPTCHA / protección anti-bot** en login y newsletter (backend), además del
   rate limit.
5. **Reporting de CSP** (`report-to`/`report-uri`) para detectar intentos de
   inyección en producción.

---

## 7. Verificación realizada

- **CSP no rompe la app:** se sirvió el `dist` con la CSP exacta de Nginx en
  Chrome real → **0 violaciones de CSP**; home renderiza 20 productos, login,
  cuenta y drawer de carrito funcionan. (Los estilos `:style` de Vue y Google
  Fonts cargan correctamente.)
- **Suite E2E de regresión:** `npm run test:e2e` → **45/45 en verde** tras los
  cambios de código (validación de `tracking_url` y `checkout_url` no rompe
  ningún flujo).

---

*Auditoría de seguridad del front. Si cambia el dominio de la API o se añade un
tercero (p. ej. un script de analítica), actualizar la `connect-src`/`script-src`
de la CSP en [`nginx.conf`](../nginx.conf) o se bloqueará en producción.*
