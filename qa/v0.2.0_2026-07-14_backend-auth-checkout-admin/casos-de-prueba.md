# Casos de prueba — v0.2.0 · Backend real (auth, checkout, admin)

Fecha: 2026-07-14 · Commit: `5db8ef7`
Estado ✅ = verificado end-to-end en navegador contra backend simulado.

| ID | Título | Prioridad | Estado |
|---|---|---|---|
| CP-0.2.0-01 | Catálogo desde API (20 productos con stock) | P0 | ✅ |
| CP-0.2.0-02 | Fallback a catálogo local si la API cae | P0 | ✅ |
| CP-0.2.0-03 | Producto con stock 0 = "Agotado" y sin añadir | P1 | ✅ |
| CP-0.2.0-04 | Login con credenciales incorrectas | P0 | ✅ |
| CP-0.2.0-05 | Login correcto y retorno al carrito | P0 | ✅ |
| CP-0.2.0-06 | Rate limit 429 en login | P1 | ✅ |
| CP-0.2.0-07 | Restauración de sesión con token válido | P0 | ✅ |
| CP-0.2.0-08 | Token corrupto → /account manda a /login | P0 | ✅ |
| CP-0.2.0-09 | Guard: customer no entra a /admin | P0 | ✅ |
| CP-0.2.0-10 | Checkout sin sesión redirige a /login | P0 | ✅ |
| CP-0.2.0-11 | Checkout con sesión → success y vacía carrito | P0 | ✅ |
| CP-0.2.0-12 | Mis pedidos: número, estado y totales | P1 | ✅ |
| CP-0.2.0-13 | Admin dashboard: métricas | P1 | ✅ |
| CP-0.2.0-14 | Admin pedidos: transición pending→paid | P0 | ✅ |
| CP-0.2.0-15 | Admin pedidos: no ofrece saltos inválidos | P0 | ✅ |
| CP-0.2.0-16 | Admin productos: ajuste de stock {delta} | P1 | ✅ |
| CP-0.2.0-17 | Registro nuevo cliente (role=customer) | P0 | ⬜ |
| CP-0.2.0-18 | Checkout cancelado conserva el carrito | P1 | ⬜ |

---

### CP-0.2.0-01 — Catálogo desde API (P0)
1. Con el backend disponible, abrir `/`.
2. Contar las tarjetas de la rejilla.

**Esperado:** se renderizan los 20 productos provenientes de `GET /products`
(incluyen `stock`).

### CP-0.2.0-02 — Fallback a catálogo local (P0)
1. Con el backend **caído**, abrir `/`.

**Esperado:** el catálogo local se muestra (20 productos) sin error visible; no
aparecen badges de "Agotado" (el local no trae stock).

### CP-0.2.0-03 — Producto agotado (P1)
**Precondición:** un producto con `stock = 0` (p. ej. Khamrah).
1. Localizar el producto en la rejilla.

**Esperado:** badge "Sold out/Agotado" y botón de añadir deshabilitado (también
en el modal de detalle).

### CP-0.2.0-04 — Login con credenciales incorrectas (P0)
1. Ir a `/login`, escribir email válido y contraseña incorrecta, enviar.

**Esperado:** mensaje "Wrong email or password / Correo o contraseña
incorrectos"; no se guarda token; permanezco en `/login`.

### CP-0.2.0-05 — Login correcto y retorno (P0)
1. Con un ítem en el carrito, pulsar "Pagar con tarjeta" sin sesión → llego a
   `/login?next=/#cart`.
2. Iniciar sesión con credenciales válidas.

**Esperado:** vuelvo a `/#cart` y el carrito se reabre con la sesión activa.

### CP-0.2.0-06 — Rate limit 429 (P1)
1. Forzar > 10 intentos de login en un minuto.
2. Intentar login válido.

**Esperado:** se muestra "Too many attempts / Demasiados intentos, espera un
momento".

### CP-0.2.0-07 — Restauración de sesión (P0)
1. Con sesión iniciada, recargar la página.

**Esperado:** la sesión se restaura (icono de cuenta con punto activo) sin pedir
login nuevamente.

### CP-0.2.0-08 — Token corrupto (P0)
1. Poner un token inválido en `localStorage.aurexir-token`.
2. Navegar a `/account`.

**Esperado:** el 401 limpia la sesión y redirige a `/login?next=/account`.

### CP-0.2.0-09 — Guard customer→/admin (P0)
1. Con sesión `customer`, navegar a `/admin`.

**Esperado:** redirección fuera de `/admin` (a `/`).

### CP-0.2.0-10 — Checkout sin sesión (P0)
1. Con carrito e invitado, pulsar "Pagar con tarjeta".

**Esperado:** redirige a `/login?next=/#cart`.

### CP-0.2.0-11 — Checkout con sesión → success (P0)
1. Con sesión y carrito, pulsar "Pagar con tarjeta".
2. Completar el pago de prueba de Stripe.

**Esperado:** redirige a `/checkout/success`; el carrito queda vacío y el
contador del header desaparece.

### CP-0.2.0-12 — Mis pedidos (P1)
1. Como cliente con pedidos, abrir `/account`.

**Esperado:** lista de pedidos con número (AX-####), estado, ítems y totales
correctos.

### CP-0.2.0-13 — Admin dashboard (P1)
1. Como admin, abrir `/admin` (pestaña Dashboard).

**Esperado:** se muestran ingresos, nº de pedidos, ticket promedio, clientes
nuevos, top productos, stock bajo y ventas por día.

### CP-0.2.0-14 — Transición pending→paid (P0)
1. En Pedidos, sobre un pedido "pending" pulsar "Marcar como paid".

**Esperado:** la fila pasa a "Paid" y sus acciones ahora ofrecen
shipped/canceled.

### CP-0.2.0-15 — Sin saltos inválidos (P0)
1. Observar un pedido "paid".

**Esperado:** NO se ofrece "Marcar como delivered" (solo shipped/canceled). Si
el backend rechaza con 409, la lista se recarga y se muestra el error.

### CP-0.2.0-16 — Ajuste de stock (P1)
1. En Productos, abrir "Stock" de un producto y aplicar `delta = +5`.

**Esperado:** el stock de la fila aumenta en 5; el ajuste va con `{delta, reason}`.

### CP-0.2.0-17 — Registro nuevo cliente (P0)
1. En `/login` cambiar a "Crear cuenta", enviar email nuevo, nombre y contraseña
   ≥ 8 caracteres.

**Esperado:** cuenta creada con `role=customer`, token guardado y sesión activa;
con contraseña < 8 se muestra el aviso de longitud mínima.

### CP-0.2.0-18 — Checkout cancelado (P1)
1. Iniciar checkout y cancelar en Stripe (volver por `cancel_url`).

**Esperado:** llego a `/checkout/cancel`; el carrito conserva sus ítems.
