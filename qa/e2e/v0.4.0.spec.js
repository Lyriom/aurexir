// v0.4.0 — Envíos Standard / Eco. Ver qa/v0.4.0_2026-07-15_envios-standard-eco/
import { test, expect, suppressPromo, loginUI, addToCart, shipAmount } from './fixtures.js'

test.describe('v0.4.0 · Envíos Standard/Eco', () => {
  test.beforeEach(async ({ page }) => {
    await suppressPromo(page)
  })

  test('CP-0.4.0-01 carrito sin ZIP ni botón "Calcular"', async ({ page }) => {
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await expect(page.locator('.cart .cart-est-zip')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /calculate|calcular/i })).toHaveCount(0)
  })

  test('CP-0.4.0-02 selector Standard $20 + Eco $30 🌿 con subtítulos', async ({ page }) => {
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    const opts = page.locator('.cart-ship-opt')
    await expect(opts).toHaveCount(2)
    await expect(page.locator('.cart-ship-opt-price')).toHaveText(['$20.00', '$30.00'])
    await expect(opts.nth(0)).toContainText(/standard/i)
    await expect(opts.nth(0)).toContainText(/3.?5 days/i)
    await expect(opts.nth(1)).toContainText(/🌿/)
    await expect(opts.nth(1)).toContainText(/carbon-neutral/i)
  })

  test('CP-0.4.0-03 cotización automática al abrir (body {items,method} sin zip)', async ({ page, mock }) => {
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await expect(shipAmount(page)).toHaveText('$20.00')
    const last = mock.captured.quote.at(-1)
    expect(last.method).toBe('standard')
    expect(last).not.toHaveProperty('zip')
  })

  test('CP-0.4.0-04 cambiar a Eco recotiza a $30', async ({ page, mock }) => {
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await expect(shipAmount(page)).toHaveText('$20.00')
    await page.locator('.cart-ship-opt', { hasText: /eco/i }).click()
    await expect(shipAmount(page)).toHaveText('$30.00')
    await expect(page.locator('.cart-est-total span').last()).toHaveText('$160.00')
    expect(mock.captured.quote.at(-1).method).toBe('eco')
  })

  test('CP-0.4.0-05 cambiar cantidades recotiza solo', async ({ page, mock }) => {
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await expect(shipAmount(page)).toHaveText('$20.00')
    const before = mock.captured.quote.length
    await page.locator('.cart-qty button[aria-label="+"]').click()
    await expect(page.locator('.cart-subtotal strong')).toHaveText('$260.00')
    await expect.poll(() => mock.captured.quote.length).toBeGreaterThan(before)
  })

  test('CP-0.4.0-06 subtotal ≥ $200 → envío GRATIS', async ({ page }) => {
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await page.locator('.cart-qty button[aria-label="+"]').click() // 2 × $130 = $260
    await expect(page.locator('.cart-shipline .is-free')).toContainText(/free|gratis/i)
  })

  test('CP-0.4.0-07 checkout envía shipping_method "eco"', async ({ page, mock }) => {
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await page.locator('.cart-ship-opt', { hasText: /eco/i }).click()
    await page.click('.cart-pay')
    await expect(page).toHaveURL(/\/checkout\/success/)
    expect(mock.captured.checkout.at(-1).shipping_method).toBe('eco')
  })

  test('CP-0.4.0-08 pedidos: etiqueta standard/eco/express', async ({ page }) => {
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/account')
    await page.locator('.order-method').first().waitFor()
    const methods = await page.locator('.order-method').allTextContents()
    const joined = methods.join(' | ')
    expect(joined).toMatch(/standard shipping/i)
    expect(joined).toMatch(/eco shipping/i)
    expect(joined).toMatch(/express shipping/i)
  })
})
