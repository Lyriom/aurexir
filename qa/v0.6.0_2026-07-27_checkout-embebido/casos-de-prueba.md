# Casos de prueba — v0.6.0 · Stripe Checkout + compra con un clic

Estado: ✅ verificado (E2E en navegador contra backend simulado) · 🟡 verificable
solo en staging (Stripe real) · ⬜ pendiente.
Prioridad: **P0** crítico · **P1** alto · **P2** medio.

Automatizados en [`qa/e2e/v0.6.0.spec.js`](../e2e/v0.6.0.spec.js) (+ casos de
checkout afectados en v0.2.0/0.3.0/0.4.0/0.5.0, reajustados al nuevo flujo).

| ID | Prioridad | Caso | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-0.6.0-01 | P0 | Visitante sin sesión abre `/checkout` | Redirige a `/login` | ✅ |
| CP-0.6.0-02 | P1 | "Comprar ahora" en el detalle | Producto en carrito + navega a `/checkout` | ✅ |
| CP-0.6.0-03 | P0 | Resumen: subtotal + envío = total | Estándar $20 sobre $130 → total $150.00 | ✅ |
| CP-0.6.0-04 | P1 | Entrega segura a Stripe | Informa que dirección, teléfono y pago se completan en Stripe | ✅ |
| CP-0.6.0-05 | P0 | Retorno de Stripe | Verifica la sesión en backend antes de vaciar el carrito | ✅ |
| CP-0.2.0-05 | P0 | Checkout como invitado | Pide login y, al entrar, va a `/checkout` | ✅ |
| CP-0.2.0-11 | P0 | "Ir a pagar" con sesión | Abre `/checkout` con el resumen y el ítem | ✅ |
| CP-0.3.0-10 | P1 | Descuento viaja a `/checkout` | Se ve en el resumen y se puede quitar desde ahí | ✅ |
| CP-0.3.0-11 | P1 | Descuento en el resumen | Línea −$19.50 y total con descuento $130.50 | ✅ |
| CP-0.4.0-07 | P1 | Método eco al checkout | Eco activo + total $160.00 | ✅ |
| CP-0.5.0-01/02 | P1 | Página de éxito | Menciona el recibo y la factura (ES) | ✅ |
| CP-0.6.0-10 | P0 | Cobro real con tarjeta de prueba (4242…) | PaymentIntent OK → éxito + carrito vacío | 🟡 staging |
| CP-0.6.0-11 | P0 | Webhook → pedido `paid` + stock − + correo | Pedido pagado, stock descontado, correo recibo + factura PDF | 🟡 staging |
| CP-0.6.0-12 | P1 | Código inválido al cobrar | 409 → el front desaplica el código y avisa | 🟡 staging |
| CP-0.6.0-13 | P1 | Sesión envía locale/método/código | Body correcto en `POST /checkout/session` | 🟡 staging |
| CP-0.6.0-14 | P1 | Admin sube imagen y crea perfume | `POST /admin/uploads` → url; producto visible en la tienda | 🟡 staging |

**Cómo correr los ✅:**
```bash
npm run test:e2e -- v0.6.0            # solo Stripe Checkout
npm run test:e2e                      # toda la suite
```

**Los 🟡 (Stripe real / backend):** en staging con el backend configurado
con `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` de
test, y tarjeta `4242 4242 4242 4242` (fecha futura, CVC cualquiera). Verificar:
Stripe Checkout vuelve al sitio, la página de éxito verifica el pago, llega el correo
con recibo + factura PDF, el pedido queda `paid` en "Mis pedidos"/admin y el stock
baja.
