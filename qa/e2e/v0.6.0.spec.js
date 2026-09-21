// v0.6.0 — Stripe Checkout alojado y compra con
// un clic. Ver qa/v0.6.0_2026-07-27_checkout-embebido/.
//
// El cargo real es externo y NO se ejercita en esta suite autocontenida: el mock
// simula el retorno de Stripe y la verificación server-side de la sesión.
import { test, expect, suppressPromo, loginUI, addToCart } from './fixtures.js'

test.describe('v0.6.0 · Stripe Checkout y compra con un clic', () => {
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

  test('CP-0.6.0-04 explica que dirección y pago se completan en Stripe', async ({ page }) => {
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await page.click('.cart-pay')
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.locator('.co-stripe-panel')).toContainText('Stripe Checkout')
    await expect(page.locator('.co-stripe-panel')).toContainText(/address, phone and payment/i)
  })

  test('CP-0.6.0-05 crea sesión, verifica el pago y vacía el carrito', async ({ page, mock }) => {
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await page.click('.cart-pay')
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.locator('.co-pay')).toBeEnabled()
    await page.locator('.co-pay').click()
    await expect(page).toHaveURL(/\/checkout\/success\?session_id=cs_test_mock/)
    await expect(page.locator('.checkout-icon--paid')).toBeVisible()
    expect(mock.captured.checkout).toHaveLength(1)
    const items = await page.evaluate(() => JSON.parse(localStorage.getItem('aurexir-cart') || '[]'))
    expect(items).toEqual([])
  })
})
