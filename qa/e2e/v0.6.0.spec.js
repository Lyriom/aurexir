// v0.6.0 — Checkout embebido (datos de envío + pago con tarjeta) y compra con
// un clic. Ver qa/v0.6.0_2026-07-27_checkout-embebido/.
//
// El cargo real con Stripe (Payment Element) es externo y NO se ejercita en esta
// suite autocontenida: se verifica en staging con Stripe test mode. Aquí se cubre
// el flujo hasta el límite del pago (guard, resumen, datos, degradación sin clave).
import { test, expect, suppressPromo, loginUI, addToCart } from './fixtures.js'

test.describe('v0.6.0 · Checkout embebido y compra con un clic', () => {
  test.beforeEach(async ({ page }) => {
    await suppressPromo(page)
  })

  test('CP-0.6.0-01 /checkout requiere sesión (invitado → login)', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/login/)
  })

  test('CP-0.6.0-02 "Comprar ahora" en el detalle lleva a /checkout con el producto', async ({ page }) => {
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/')
    await page.locator('.grid .card', { hasText: 'Coral Fantasy' }).first().locator('.card-media').click()
    await page.locator('.modal-buy').click()
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.locator('.co-item')).toContainText('Coral Fantasy')
  })

  test('CP-0.6.0-03 el resumen calcula subtotal + envío = total', async ({ page }) => {
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy') // $130
    await page.click('.cart-pay')
    await expect(page).toHaveURL(/\/checkout$/)
    // Estándar $20 → total estimado $150.00
    await expect(page.locator('.co-total')).toContainText('$150.00')
  })

  test('CP-0.6.0-04 formulario de envío presente y nombre precargado de la cuenta', async ({ page }) => {
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await page.click('.cart-pay')
    await expect(page).toHaveURL(/\/checkout$/)
    const main = page.locator('.checkout-main')
    await expect(main.locator('input[autocomplete="name"]')).toHaveValue('Cliente Test')
    await expect(main.locator('input[autocomplete="tel"]')).toBeVisible()
    await expect(main.locator('input[autocomplete="address-line1"]')).toBeVisible()
    await expect(main.locator('input[autocomplete="postal-code"]')).toBeVisible()
  })

  test('CP-0.6.0-05 sin clave Stripe: aviso "pago no disponible" y botón deshabilitado', async ({ page }) => {
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await page.click('.cart-pay')
    await expect(page).toHaveURL(/\/checkout$/)
    // El dev server de la suite no define VITE_STRIPE_PUBLISHABLE_KEY.
    await expect(page.locator('.co-note--warn')).toBeVisible()
    await expect(page.locator('.co-pay')).toBeDisabled()
  })
})
