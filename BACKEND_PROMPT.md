# PROMPT — Backend AUREXIR (FastAPI)

> **Cómo usarlo:** crea una carpeta nueva `aurexir-api` (hermana de este repo),
> abre Claude Code ahí dentro y pega TODO este documento como prompt.
> El contrato de endpoints DEBE coincidir con `../aurexir/src/api.js`.

---

## Rol y objetivo

Eres un ingeniero backend senior. Construye desde cero el backend de **AUREXIR**,
un e-commerce de perfumería masculina (fragancias de diseñador y nicho) enfocado
en el **mercado de Estados Unidos, con base en Nueva York**. El frontend ya
existe (Vue 3 + Vite, repo `aurexir`) y funciona hoy como catálogo con pedidos
por WhatsApp/Instagram; ese canal se mantiene para invitados. El backend añade:

1. **Auth con roles**: clientes (`customer`) y administrador (`admin`).
2. **Compras online**: checkout con **Stripe** (Checkout Session + webhook).
3. **Cliente**: ver su historial de pedidos.
4. **Admin**: inventario (CRUD de productos + stock) y **métricas** de ventas.
5. **Envíos**: cálculo por regla; **gratis si el subtotal ≥ $200 USD**.

Trabaja fase por fase (ver "Fases" al final), con commits pequeños por fase.
**No añadas co-autoría de IA en los commits.**

## Stack (obligatorio)

- Python 3.12 · **FastAPI** · Uvicorn
- **SQLAlchemy 2.x** (estilo 2.0, `Mapped[]`) + **Alembic** para migraciones
- **PostgreSQL 16** (en docker-compose; para tests, SQLite in-memory está bien)
- **Pydantic v2** para schemas · `pydantic-settings` para configuración
- Auth: **JWT** (access token, `python-jose` o `pyjwt`) + **argon2** (`passlib[argon2]`)
- **stripe** (SDK oficial) — modo test
- **pytest** + `httpx` para tests
- **ruff** (lint + format)
- **Docker** + docker-compose (servicios: `api`, `db`)

## Estructura del proyecto

```
aurexir-api/
├── app/
│   ├── main.py            # create_app, CORS, routers, /health
│   ├── config.py          # Settings (env)
│   ├── database.py        # engine, SessionLocal, get_db
│   ├── models/            # user.py, product.py, order.py, newsletter.py
│   ├── schemas/           # pydantic por dominio
│   ├── routers/           # auth.py, products.py, shipping.py, checkout.py,
│   │                      # orders.py, newsletter.py, admin.py, webhooks.py
│   ├── services/          # shipping.py, stripe_service.py, metrics.py, inventory.py
│   ├── security.py        # hash/verify, create_token, get_current_user, require_admin
│   └── seed.py            # seed de productos + admin
├── alembic/
├── tests/
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── README.md              # cómo levantar, migrar, seedear, probar Stripe local
```

## Modelos de datos

**User**: id (uuid), email (único, lower), name, password_hash,
role (`customer` | `admin`), created_at.

**Product**: id (uuid), **slug** (único — ver seed: el front usa el slug como id),
name, brand, category (`multi|daily|night|special`), tag (nullable, ej. `niche`),
tone, price (Numeric 10,2), old_price (nullable), image, gallery (JSON, 3 urls),
desc_en, desc_es, notes (JSON), rating, reviews, is_new, is_best,
**stock (int ≥ 0)**, active (bool), created_at, updated_at.

**InventoryMovement**: id, product_id (FK), delta (int, +/-),
reason (`sale | restock | manual | cancel`), order_id (nullable), created_at.
→ Cada cambio de stock queda registrado (auditoría del inventario).

**Order**: id (uuid), number (secuencial legible, ej. `AX-1042`), user_id (FK),
status (`pending | paid | shipped | delivered | canceled`),
subtotal, shipping_cost, tax, total (Numeric),
shipping_method (`standard | express`), shipping_address (JSON),
stripe_session_id, stripe_payment_intent (nullables), created_at, updated_at.

**OrderItem**: id, order_id (FK), product_id (FK), name_snapshot,
brand_snapshot, unit_price (Numeric — precio al momento de la compra), qty.

**NewsletterSubscriber**: id, email (único), locale, created_at.

## Contrato de endpoints (DEBE coincidir con `src/api.js` del front)

### Público
| Método | Ruta | Body → Respuesta |
|---|---|---|
| POST | `/auth/register` | `{email, password, name}` → `{access_token, user:{id,email,name,role}}` |
| POST | `/auth/login` | `{email, password}` → igual que register |
| GET | `/auth/me` | (Bearer) → `user` |
| GET | `/products` | → lista de productos **activos** con stock visible |
| GET | `/products/{slug}` | → producto |
| POST | `/shipping/quote` | `{items:[{id,qty}], zip, method}` → `{subtotal, shipping, free_shipping_threshold, method, total_estimate}` |
| POST | `/newsletter` | `{email, locale}` → 201 (idempotente: si ya existe, 200) |
| GET | `/health` | → `{status:"ok"}` |

### Cliente autenticado (Bearer)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/checkout/session` | `{items:[{id,qty}], shipping_method, success_url, cancel_url}` → `{checkout_url}`. Crea Order `pending` + Stripe Checkout Session. |
| GET | `/orders/mine` | Pedidos del usuario (con items), más reciente primero. |

### Webhook
| POST | `/webhooks/stripe` | Verifica firma (`STRIPE_WEBHOOK_SECRET`). En `checkout.session.completed`: Order → `paid`, guarda `payment_intent`, **descuenta stock** (movimiento `sale`). En `checkout.session.expired`: Order → `canceled`. |

### Admin (Bearer + role=admin, si no → 403)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/admin/metrics?days=30` | `{revenue_total, orders_count, aov, revenue_by_day:[{date,revenue,orders}], top_products:[{slug,name,units,revenue}], low_stock:[{slug,name,stock}], new_customers}` — solo pedidos `paid/shipped/delivered`. |
| GET | `/admin/orders` | Todos los pedidos (filtro `?status=`). |
| PATCH | `/admin/orders/{id}` | `{status}` — transiciones válidas solamente (paid→shipped→delivered; cancelar repone stock con movimiento `cancel`). |
| GET | `/admin/products` | Incluye inactivos y stock real. |
| POST | `/admin/products` | Crear producto. |
| PATCH | `/admin/products/{id}` | Editar campos (precio, active, etc.). |
| PATCH | `/admin/products/{id}/stock` | `{stock, reason}` → registra InventoryMovement con el delta. |

## Reglas de negocio

### Precios y checkout (seguridad)
- El cliente envía **solo `{id, qty}`**; precios SIEMPRE desde la base de datos.
- Antes de crear la sesión de Stripe: validar stock suficiente y producto activo;
  si falla → 409 con detalle por producto.
- Moneda: **USD**. Almacenar Numeric(10,2); enviar a Stripe en **centavos**.

### Envíos (solo EE. UU.)
- `FREE_SHIPPING_THRESHOLD = 200` (env, default 200): subtotal ≥ umbral → envío **$0**.
- Si no: `standard` = $6.95 · `express` = $14.95 (env: `SHIPPING_STANDARD`, `SHIPPING_EXPRESS`).
- El quote y la Checkout Session deben usar **la misma función** (`services/shipping.py`).
- En Stripe usar `shipping_options` con el monto calculado y
  `shipping_address_collection: {allowed_countries: ["US"]}`.

### Impuestos (NY)
- Activar **Stripe Tax** (`automatic_tax: {enabled: true}`) para que Stripe
  calcule el sales tax por estado (registro en NY). Guardar el tax final que
  reporte el webhook en `Order.tax`. Si Stripe Tax no está disponible en la
  cuenta, dejar `tax = 0` y un TODO claro.

### Inventario
- El stock se descuenta **solo cuando el pago se confirma** (webhook), nunca al
  crear la sesión. Todo cambio pasa por `services/inventory.py` y deja
  `InventoryMovement`. Cancelación de orden pagada → repone stock.

### Invitados
- El flujo IG/WhatsApp vive 100% en el front: **no** bloquear nada público
  detrás de login. Solo `checkout/session` y `orders/mine` requieren sesión.

## Configuración (.env.example)

```
DATABASE_URL=postgresql+psycopg://aurexir:aurexir@db:5432/aurexir
JWT_SECRET=cambia-esto
JWT_EXPIRES_MIN=10080
ADMIN_EMAIL=admin@aurexir.com
ADMIN_PASSWORD=cambia-esto
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_ORIGIN=http://localhost:5173
FREE_SHIPPING_THRESHOLD=200
SHIPPING_STANDARD=6.95
SHIPPING_EXPRESS=14.95
```

CORS: permitir `FRONTEND_ORIGIN` (y en prod `https://aurexir.com`).

## Seed (`app/seed.py`, idempotente)

1. Admin desde `ADMIN_EMAIL`/`ADMIN_PASSWORD` si no existe.
2. Los 20 productos del catálogo. **Fuente de verdad**: si existe
   `../aurexir/src/data/products.js`, tomar de ahí los campos completos
   (desc, notes, gallery, rating…). Slugs y precios (stock inicial 10):

| slug | brand — name | price | old_price |
|---|---|---|---|
| coral-fantasy | Valentino Uomo — Coral Fantasy | 130 | — |
| valentino-intense | Valentino — Uomo Intense | 130 | — |
| myslf-le-parfum | YSL — MYSLF Le Parfum | 135 | — |
| bleu-de-chanel-parfum | Chanel — Bleu de Chanel Parfum | 140 | — |
| armani-code-parfum | Giorgio Armani — Armani Code Parfum | 125 | — |
| polo-67 | Ralph Lauren — Polo 67 | 120 | — |
| explorer | Montblanc — Explorer | 120 | 150 |
| luna-rossa-carbon | Prada — Luna Rossa Carbon | 110 | — |
| acqua-di-gio-parfum | Giorgio Armani — Acqua di Giò Parfum | 125 | — |
| sauvage-edp | Dior — Sauvage EDP | 120 | — |
| victory-elixir | Paco Rabanne — Invictus Victory Elixir | 130 | — |
| althair | Parfums de Marly — Althaïr | 320 | — |
| le-male-elixir | JPG — Le Male Elixir | 125 | — |
| khamrah | Lattafa — Khamrah | 85 | 110 |
| stronger-with-you-intense | Emporio Armani — SWY Intensely | 90 | 115 |
| pure-xs-night | Paco Rabanne — Pure XS Night | 120 | — |
| reserve-privee | Givenchy — Gentleman Réserve Privée | 100 | 130 |
| 9pm | Afnan — 9PM | 80 | 100 |
| naxos | Xerjoff — Naxos | 70 | 95 |
| cobalt-elixir | Carolina Herrera — Bad Boy Cobalt Elixir | 120 | — |

Imágenes: `image = /perfumes/{slug}-1.webp`, `gallery = [-1,-2,-3].webp`
(las sirve el front; el back solo guarda las rutas).

## Calidad

- **Tests** (pytest) mínimos: registro/login + `me`; permisos (customer no entra
  a `/admin/*` → 403); regla de envío (199.99 → cobra, 200 → gratis); checkout
  crea Order `pending` con montos correctos (Stripe mockeado); webhook con firma
  válida marca `paid` y descuenta stock; webhook con firma inválida → 400;
  cancelar orden pagada repone stock.
- Validaciones Pydantic estrictas (email, password ≥ 8, qty ≥ 1, zip US de 5 dígitos).
- Rate-limit sencillo en `/auth/login` (p. ej. `slowapi`) para frenar fuerza bruta.
- OpenAPI: título "AUREXIR API"; docs habilitadas.
- README: levantar con `docker compose up`, migrar, seedear, y probar el webhook
  con `stripe listen --forward-to localhost:8000/webhooks/stripe`.

## Fases (en orden, commit por fase)

1. **Esqueleto**: FastAPI + Settings + Postgres + Alembic + docker-compose + `/health`.
2. **Modelos + seed**: tablas, migración inicial, seed de admin y 20 productos.
3. **Auth**: register/login/me, JWT, roles, rate-limit.
4. **Catálogo + envío**: `/products`, `/products/{slug}`, `/shipping/quote`.
5. **Checkout Stripe**: `/checkout/session` + `/webhooks/stripe` + descuento de stock.
6. **Pedidos**: `/orders/mine` + `/admin/orders` (+ cambio de estado con reglas).
7. **Admin**: CRUD productos, stock con auditoría, `/admin/metrics`.
8. **Newsletter + pulido**: `/newsletter`, CORS prod, README, tests completos verdes.

Criterio de aceptación global: `docker compose up` levanta todo; `pytest` verde;
un flujo completo manual funciona: registro → carrito → checkout test de Stripe
(tarjeta `4242 4242 4242 4242`) → webhook marca pagado → stock baja → la orden
aparece en `/orders/mine` y en las métricas de admin.
