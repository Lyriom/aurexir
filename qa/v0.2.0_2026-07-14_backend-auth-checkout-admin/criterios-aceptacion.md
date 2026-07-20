# Criterios de aceptación — v0.2.0 · Backend real (auth, checkout, admin)

- **Fecha:** 2026-07-14
- **Commit:** `5db8ef7`
- **Alcance:** catálogo desde API con stock, auth JWT con roles, checkout Stripe,
  cuenta + "Mis pedidos", panel admin (métricas, pedidos, productos), router con
  guards y manejo de errores del backend.

## Checklist de aceptación

- [ ] El catálogo se carga desde `GET /products`; si la API falla, cae al
      catálogo local sin romper la página.
- [ ] Un producto con `stock = 0` se muestra como **Agotado** y no se puede
      añadir al carrito.
- [ ] Registro e inicio de sesión funcionan y la sesión se restaura al recargar
      (vía `GET /auth/me`).
- [ ] `/account` exige sesión; `/admin` exige `role=admin`.
- [ ] El pago con tarjeta crea la sesión de Stripe y redirige a su URL.
- [ ] `/checkout/success` vacía el carrito; `/checkout/cancel` lo conserva.
- [ ] "Mis pedidos" lista los pedidos con estado, ítems y totales.
- [ ] El panel admin muestra métricas, permite cambiar estado de pedidos con
      **solo transiciones válidas** y hacer CRUD de productos + ajuste de stock.
- [ ] Los errores del backend se muestran legibles (detalle string, 422, 429).
- [ ] Un 401 en llamada autenticada limpia la sesión y lleva a `/login`.

## Escenarios

### CA-0.2.0-01 — Catálogo desde API con fallback (P0)
- **Dado** el backend disponible,
- **Cuando** entro a `/`,
- **Entonces** los productos vienen de `GET /products` (con stock); **y si** la
  API no responde, se muestra el catálogo local sin error visible.

### CA-0.2.0-02 — Producto agotado (P1)
- **Dado** un producto con `stock = 0`,
- **Cuando** lo veo en la rejilla o su modal,
- **Entonces** muestra la insignia "Agotado" y el botón de añadir está
  deshabilitado.

### CA-0.2.0-03 — Registro (P0)
- **Dado** el formulario de registro,
- **Cuando** envío email, nombre y contraseña (≥ 8),
- **Entonces** se crea la cuenta con `role=customer`, se guarda el token y quedo
  autenticado.

### CA-0.2.0-04 — Login y credenciales inválidas (P0)
- **Dado** el formulario de acceso,
- **Cuando** uso credenciales correctas, entro; **cuando** son incorrectas, veo
  "Correo o contraseña incorrectos" **sin** perder nada más.

### CA-0.2.0-05 — Rate limit de login (P1)
- **Dado** más de 10 intentos por minuto,
- **Cuando** el backend responde 429,
- **Entonces** se muestra "Demasiados intentos, espera un momento".

### CA-0.2.0-06 — Restauración de sesión (P0)
- **Dado** un token válido en localStorage,
- **Cuando** recargo,
- **Entonces** la sesión se restaura (icono de cuenta activo) sin re-login.

### CA-0.2.0-07 — Guard de /account (P0)
- **Dado** que no tengo sesión,
- **Cuando** navego a `/account`,
- **Entonces** se me redirige a `/login?next=/account`.

### CA-0.2.0-08 — Guard de /admin por rol (P0 · seguridad)
- **Dado** una sesión `customer`,
- **Cuando** navego a `/admin`,
- **Entonces** se me redirige fuera; el backend además responde 403 a las
  llamadas admin.

### CA-0.2.0-09 — Checkout con tarjeta (P0)
- **Dado** un carrito con sesión iniciada,
- **Cuando** pulso "Pagar con tarjeta",
- **Entonces** se crea la sesión de Stripe y el navegador se redirige a
  `checkout_url`. **Sin** sesión, primero voy a `/login` y al volver el carrito
  se reabre.

### CA-0.2.0-10 — Resultado del checkout (P0)
- **Dado** el retorno de Stripe,
- **Cuando** el pago fue exitoso llego a `/checkout/success` y el carrito queda
  vacío; **cuando** cancelo, llego a `/checkout/cancel` y el carrito se conserva.

### CA-0.2.0-11 — Mis pedidos (P1)
- **Dado** un cliente con pedidos,
- **Cuando** abro `/account`,
- **Entonces** veo cada pedido con número, estado, ítems y totales (subtotal,
  envío, impuestos, total).

### CA-0.2.0-12 — Admin: transiciones de estado válidas (P0)
- **Dado** un pedido en un estado dado,
- **Cuando** veo sus acciones,
- **Entonces** solo se ofrecen transiciones válidas
  (`pending→paid|canceled`, `paid→shipped|canceled`,
  `shipped→delivered|canceled`; `delivered`/`canceled` finales); un 409 del
  backend recarga y muestra el error.

### CA-0.2.0-13 — Admin: CRUD de productos y stock (P1)
- **Dado** el panel de productos,
- **Cuando** creo/edito un producto, lo activo/desactivo o ajusto stock
  (`{delta, reason}`),
- **Entonces** la tabla refleja el cambio y el ajuste registra el nuevo stock.

### CA-0.2.0-14 — Sesión expirada (P0 · seguridad)
- **Dado** un token inválido/expirado,
- **Cuando** una llamada autenticada responde 401,
- **Entonces** se limpia la sesión y, si la ruta lo requería, se va a `/login`.
