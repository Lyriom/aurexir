// v0.3.0 — Descuento de bienvenida 15%. Ver qa/v0.3.0_2026-07-15_descuento-bienvenida/
import { test, expect, suppressPromo, loginUI, addToCart, gotoAdminOrders, adminRow } from './fixtures.js'

test.describe('v0.3.0 · Descuento de bienvenida', () => {
  test('CP-0.3.0-01 popup aparece a los ~8 s (y no antes)', async ({ page, mock }) => {
    void mock
    await page.goto('/')
    await expect(page.locator('.promo-overlay')).toHaveCount(0)
    await expect(page.locator('.promo-overlay')).toBeVisible({ timeout: 12_000 })
  })

  test('CP-0.3.0-02 alta nueva → "Revisa tu correo" y marca promo_done', async ({ page, mock }) => {
    void mock
    await page.goto('/')
    await page.locator('.promo-overlay').waitFor({ state: 'visible', timeout: 12_000 })
    await page.fill('.promo-input', 'nuevo@test.com')
    await page.click('.promo-submit')
    await expect(page.locator('.promo-title')).toContainText(/check your inbox/i)
    const done = await page.evaluate(() => localStorage.getItem('aurexir_promo_done'))
    expect(done).toBe('1')
  })

  test('CP-0.3.0-03 no reaparece si ya dejó su email', async ({ page, mock }) => {
    void mock
    await suppressPromo(page) // simula aurexir_promo_done ya puesto
    await page.goto('/')
    await page.waitForTimeout(9_000)
    await expect(page.locator('.promo-overlay')).toHaveCount(0)
  })

  test('CP-0.3.0-05 footer: mensajes "resent" y "pending"', async ({ page, mock }) => {
    void mock
    await suppressPromo(page)
    await page.goto('/')
    await page.locator('.newsletter-input').scrollIntoViewIfNeeded()
    await page.fill('.newsletter-input', 'exists@test.com')
    await page.click('.newsletter-form button[type=submit]')
    await expect(page.locator('.newsletter-done')).toContainText(/already subscribed/i)
    await page.fill('.newsletter-input', 'fail@test.com')
    await page.click('.newsletter-form button[type=submit]')
    await expect(page.locator('.newsletter-done')).toContainText(/on its way/i)
  })

  test('CP-0.3.0-06 código inválido muestra error', async ({ page, mock }) => {
    void mock
    await suppressPromo(page)
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await page.fill('.cart-code-input', 'AURX15-NOPE99')
    await page.click('.cart-code-btn')
    await expect(page.locator('.cart-error')).toContainText(/invalid or already used/i)
  })

  test('CP-0.3.0-07/08 código válido: línea −$19.50 y envío no se descuenta', async ({ page, mock }) => {
    void mock
    await suppressPromo(page)
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy') // $130
    await page.fill('.cart-code-input', 'AURX15-TEST01')
    await page.click('.cart-code-btn')
    await expect(page.locator('.cart-discount')).toContainText('AURX15-TEST01')
    await expect(page.locator('.cart-discount-amount')).toHaveText('−$19.50')
    // Envío estándar $20; total estimado = 130 − 19.50 + 20 = $130.50
    await expect(page.locator('.cart-est-total span').last()).toHaveText('$130.50')
  })

  test('CP-0.3.0-09 quitar el código con la X', async ({ page, mock }) => {
    void mock
    await suppressPromo(page)
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await page.fill('.cart-code-input', 'AURX15-TEST01')
    await page.click('.cart-code-btn')
    await expect(page.locator('.cart-discount')).toBeVisible()
    await page.click('.cart-discount-remove')
    await expect(page.locator('.cart-discount')).toHaveCount(0)
    await expect(page.locator('.cart-code-input')).toBeVisible()
  })

  test('CP-0.3.0-10 409 al pagar desaplica el código', async ({ page, mock }) => {
    void mock
    await suppressPromo(page)
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await page.fill('.cart-code-input', 'AURX15-USED77')
    await page.click('.cart-code-btn')
    await expect(page.locator('.cart-discount')).toBeVisible()
    await page.click('.cart-pay')
    await expect(page.locator('.cart-error')).toContainText(/inválido o ya usado/i)
    await expect(page.locator('.cart-discount')).toHaveCount(0)
  })

  test('CP-0.3.0-11 pago OK envía discount_code y limpia al éxito', async ({ page, mock }) => {
    await suppressPromo(page)
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await page.fill('.cart-code-input', 'AURX15-TEST01')
    await page.click('.cart-code-btn')
    await expect(page.locator('.cart-discount')).toBeVisible()
    await page.click('.cart-pay')
    await expect(page).toHaveURL(/\/checkout\/success/)
    await expect(page.locator('.checkout-title')).toBeVisible() // espera onMounted (clearCart)
    expect(mock.captured.checkout.at(-1).discount_code).toBe('AURX15-TEST01')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('aurexir-discount'))).toBeNull()
  })

  test('CP-0.3.0-12 descuento visible en Mis pedidos', async ({ page, mock }) => {
    void mock
    await suppressPromo(page)
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/account')
    const o1 = page.locator('.order', { hasText: 'AX-1001' })
    await expect(o1.locator('.order-discount')).toContainText('AURX15-ABC123')
    await expect(o1.locator('.order-discount')).toContainText('−$15.00')
  })

  test('CP-0.3.0-13 descuento visible en admin', async ({ page, mock }) => {
    void mock
    await suppressPromo(page)
    await loginUI(page, 'admin@aurexir.com', 'adminpass123')
    await gotoAdminOrders(page)
    await expect(adminRow(page, 'AX-1001').locator('.order-discount')).toContainText('−$15.00')
  })
})
