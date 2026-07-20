# Suite E2E (Playwright)

Automatiza los casos ✅ documentados en `qa/`. Cada `test` lleva el **ID del
caso** (p. ej. `CP-0.3.0-07`) en su título, para mapear la ejecución con
`qa/vX.Y.Z_*/casos-de-prueba.md`.

## Cómo ejecutar

```bash
npm run test:e2e            # toda la suite (headless)
npm run test:e2e:headed     # con navegador visible
npm run test:e2e:ui         # modo UI interactivo de Playwright
npm run test:e2e -- v0.3.0  # solo un archivo
npm run test:e2e -- -g CP-0.5.0-08   # un caso por ID
npm run test:e2e:report     # abrir el último informe HTML
```

- Playwright levanta solo el dev server de Vite (`npm run dev`, puerto 5173).
- Usa el **Google Chrome instalado** (`channel: 'chrome'`), no descarga
  navegadores.

## Backend simulado (sin API real)

La suite **no** necesita `https://api.aurexir.com`. El backend se simula por
interceptación de red en [`mock/api-mock.js`](mock/api-mock.js), que replica el
contrato de `src/api.js`:

- Cada test crea su propio estado (`createState()`) → los tests no comparten
  datos.
- El fixture `mock` (en [`fixtures.js`](fixtures.js)) es **automático**: instala
  la intercepción en todos los tests. Referenciar `mock` en la firma del test
  da acceso al estado y a `mock.captured` (cuerpos enviados a
  `/checkout/session`, `/shipping/quote`, `/newsletter`, `/tracking`).

Datos sembrados: catálogo real de `src/data/products.js` (Khamrah con stock 0),
usuarios `cliente@test.com` / `password123` y `admin@aurexir.com` /
`adminpass123`, y pedidos AX-1001…AX-1004 (paid, pending/express, eco, shipped
con tracking). Códigos de descuento: `AURX15-TEST01` (válido) y `AURX15-USED77`
(válido al validar, **409** al pagar).

## Estructura

```
qa/e2e/
├── fixtures.js            # test extendido (fixture mock auto) + helpers
├── mock/api-mock.js       # backend simulado (contrato de src/api.js)
├── v0.1.0-basics.spec.js  # catálogo, carrito, i18n
├── v0.2.0.spec.js         # auth, checkout, admin
├── v0.3.0.spec.js         # descuento de bienvenida
├── v0.4.0.spec.js         # envíos Standard/Eco
└── v0.5.0.spec.js         # correos + tracking
```

## Nota

Estos tests verifican el **front contra el contrato** esperado del backend. No
sustituyen una prueba de humo contra la API real antes de cada release: para
eso, apuntar el front a `https://api.aurexir.com` y recorrer manualmente los
casos P0 de `qa/`.
