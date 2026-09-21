# AUREXIR — Landing

Tienda de la marca de perfumes masculinos **AUREXIR**, construida con Vue 3 y
Vite. Se conecta al API FastAPI (`aurexir_back`) para catálogo, cuentas,
inventario, descuentos y Stripe Checkout.

## Paleta

| Color | Hex | Uso |
| --- | --- | --- |
| Ónix | `#0D0E12` | Fondo principal |
| Gunmetal | `#2A2D34` | Superficies secundarias |
| Bronce | `#B8863B` | Color insignia (CTAs, acentos) |
| Cian hielo | `#3FD0E0` | Hovers, detalles, luces |
| Titanio | `#B8BCC2` | Texto secundario |

## Uso

```bash
npm install
npm run dev      # desarrollo
npm run build    # producción (dist/)
npm run preview  # sirve el build
```

## Configuración

- `.env.production` — `VITE_API_URL=https://api.aurexir.com`. No lleva claves de
  Stripe: Checkout se crea en el backend y se abre en el sitio alojado por Stripe.
- `src/config.js` — número de WhatsApp y DM de Instagram para los pedidos.
- `src/data/products.js` — catálogo de fragancias (nombre, línea, notas, precios).
