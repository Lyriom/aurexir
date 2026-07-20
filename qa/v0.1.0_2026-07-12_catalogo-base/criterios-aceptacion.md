# Criterios de aceptación — v0.1.0 · Catálogo y carrito (base)

- **Fecha:** 2026-07-12
- **Commit:** `3a6e6af` (consolida trabajo del 2026-07-06 al 2026-07-12)
- **Alcance:** catálogo estático de 20 perfumes, sitio bilingüe EN/ES, carrito
  en localStorage, pedidos por WhatsApp/Instagram, barra de envío gratis $200.
- **Fuera de alcance:** login, checkout con tarjeta, stock real, admin (llegan
  en v0.2.0).

## Checklist de aceptación

- [ ] El catálogo muestra los 20 productos con foto, marca, nombre, precio,
      rating y badges (nuevo / best seller / oferta / nicho).
- [ ] El sitio arranca en **inglés** y permite cambiar a español; la elección
      persiste entre recargas.
- [ ] El carrito persiste en `localStorage` y sobrevive a recargas.
- [ ] Los precios se muestran en formato USD (`$85.00`).
- [ ] El detalle del producto abre un modal con galería (3 tomas) y pirámide
      olfativa (salida / corazón / fondo).
- [ ] La barra de envío gratis refleja el progreso hacia $200 de subtotal.
- [ ] El pedido por WhatsApp/Instagram arma el mensaje con las líneas del
      carrito y el total.

## Escenarios

### CA-0.1.0-01 — Idioma por defecto y cambio persistente (P1)
- **Dado** que entro por primera vez sin preferencia guardada,
- **Cuando** carga la página,
- **Entonces** el contenido se muestra en inglés y, al pulsar "ES" y recargar,
  se mantiene en español.

### CA-0.1.0-02 — Añadir al carrito y persistencia (P0)
- **Dado** un producto del catálogo,
- **Cuando** pulso "Add to cart" y recargo la página,
- **Entonces** el ítem sigue en el carrito con su cantidad y el contador del
  header lo refleja.

### CA-0.1.0-03 — Cantidades y subtotal (P1)
- **Dado** un ítem en el carrito,
- **Cuando** aumento/disminuyo la cantidad,
- **Entonces** el subtotal y el total de unidades se recalculan; al bajar de 1
  el ítem se elimina.

### CA-0.1.0-04 — Barra de envío gratis (P2)
- **Dado** un carrito con subtotal < $200,
- **Cuando** veo el pie del carrito,
- **Entonces** muestra "Add $X more for FREE shipping" con X = 200 − subtotal;
  al alcanzar/superar $200 muestra "Your order ships FREE".

### CA-0.1.0-05 — Pedido por WhatsApp/Instagram (P1)
- **Dado** un carrito con ítems,
- **Cuando** pulso "Checkout on WhatsApp",
- **Entonces** se abre WhatsApp con un mensaje que lista cada línea
  (cantidad × marca — nombre) y el total.

### CA-0.1.0-06 — Buscador y filtros de categoría (P2)
- **Dado** el catálogo completo,
- **Cuando** busco por nombre/casa o selecciono una categoría,
- **Entonces** la rejilla se filtra y el contador de resultados se actualiza;
  "Limpiar" restablece la vista.
