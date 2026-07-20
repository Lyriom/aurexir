# Casos de prueba — v0.1.0 · Catálogo y carrito (base)

Fecha: 2026-07-12 · Commit: `3a6e6af`

| ID | Título | Prioridad | Estado |
|---|---|---|---|
| CP-0.1.0-01 | Idioma por defecto EN y cambio a ES persistente | P1 | ⬜ |
| CP-0.1.0-02 | Añadir al carrito y persistir tras recarga | P0 | ⬜ |
| CP-0.1.0-03 | Cambiar cantidades y eliminar al llegar a 0 | P1 | ⬜ |
| CP-0.1.0-04 | Barra de envío gratis a $200 | P2 | ⬜ |
| CP-0.1.0-05 | Pedido por WhatsApp con líneas y total | P1 | ⬜ |
| CP-0.1.0-06 | Buscador + filtros de categoría | P2 | ⬜ |
| CP-0.1.0-07 | Modal de detalle con galería y notas | P2 | ⬜ |

---

### CP-0.1.0-01 — Idioma por defecto EN y cambio a ES persistente (P1)
**Precondición:** navegador sin `aurexir-locale` en localStorage.
1. Abrir `/`.
2. Observar el idioma del contenido.
3. Pulsar el selector "ES".
4. Recargar la página.

**Resultado esperado:** en el paso 2 el sitio está en inglés; tras el paso 4 se
mantiene en español (persistió la preferencia).

### CP-0.1.0-02 — Añadir al carrito y persistir tras recarga (P0)
**Precondición:** carrito vacío.
1. En una tarjeta de producto pulsar "Add to cart".
2. Verificar que se abre el drawer con el ítem y el contador del header = 1.
3. Recargar la página y abrir el carrito.

**Resultado esperado:** el ítem sigue presente con su cantidad; el contador se
mantiene.

### CP-0.1.0-03 — Cambiar cantidades y eliminar al llegar a 0 (P1)
1. Con un ítem en el carrito, pulsar "+" dos veces → cantidad 3.
2. Verificar subtotal = precio × 3.
3. Pulsar "−" hasta llegar a 1 y una vez más.

**Resultado esperado:** el subtotal se recalcula en cada cambio; al bajar de 1 el
ítem se elimina del carrito.

### CP-0.1.0-04 — Barra de envío gratis a $200 (P2)
1. Añadir productos hasta un subtotal < $200.
2. Observar el texto y la barra de progreso.
3. Añadir hasta alcanzar/superar $200.

**Resultado esperado:** con < $200 muestra "Add $X more for FREE shipping"
(X = 200 − subtotal) y barra proporcional; con ≥ $200 muestra el estado de envío
gratis y la barra al 100%.

### CP-0.1.0-05 — Pedido por WhatsApp con líneas y total (P1)
1. Con 2 ítems en el carrito, pulsar "Checkout on WhatsApp".

**Resultado esperado:** se abre WhatsApp (`wa.me`) con un mensaje que incluye
cada línea (`cantidad× marca — nombre (importe)`) y el total del carrito.

### CP-0.1.0-06 — Buscador + filtros de categoría (P2)
1. Escribir en el buscador el nombre de una casa (p. ej. "Dior").
2. Verificar la rejilla y el contador de resultados.
3. Seleccionar una categoría del nav.
4. Pulsar "Limpiar".

**Resultado esperado:** la rejilla filtra por texto/categoría, el contador
coincide con los resultados y "Limpiar" restablece la vista completa.

### CP-0.1.0-07 — Modal de detalle con galería y notas (P2)
1. Pulsar una tarjeta de producto.

**Resultado esperado:** abre el modal con la galería (hasta 3 tomas), la
pirámide olfativa (salida/corazón/fondo) y el precio; se puede cerrar con la X o
Escape.
