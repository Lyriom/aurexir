// v0.5.0 — Correos de pedido y seguimiento. Ver qa/v0.5.0_2026-07-17_correos-y-tracking/
import { test, expect, suppressPromo, setLocale, loginUI, addToCart, gotoAdminOrders, adminRow } from './fixtures.js'

test.describe('v0.5.0 · Correos y tracking', () => {
  test.beforeEach(async ({ page }) => {
    await suppressPromo(page)
  })

  test('CP-0.5.0-01/02 checkout envía locale "es" y success menciona el correo', async ({ page, mock }) => {
    await setLocale(page, 'es')
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await page.click('.cart-pay')
    await expect(page).toHaveURL(/\/checkout\/success/)
    expect(mock.captured.checkout.at(-1).locale).toBe('es')
    await expect(page.locator('.checkout-email')).toContainText(/correo de confirmación/i)
  })

  test('CP-0.5.0-03/04 pedido shipped muestra tracking y botón en pestaña nueva', async ({ page }) => {
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/account')
    const o4 = page.locator('.order', { hasText: 'AX-1004' })
    const block = o4.locator('.order-tracking')
    await expect(block).toBeVisible()
    await expect(block).toContainText('1Z999AA10123456784')
    await expect(block.locator('.order-tracking-carrier')).toHaveText('UPS')
    const btn = block.locator('a.order-tracking-btn')
    await expect(btn).toHaveAttribute('target', '_blank')
    await expect(btn).toHaveAttribute('href', /ups\.com/)
  })

  test('CP-0.5.0-05 pedido no enviado no muestra bloque de tracking', async ({ page }) => {
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/account')
    await expect(page.locator('.order', { hasText: 'AX-1001' }).locator('.order-tracking')).toHaveCount(0)
  })

  test('CP-0.5.0-06 admin: pedido paid ofrece "Add tracking"', async ({ page }) => {
    await loginUI(page, 'admin@aurexir.com', 'adminpass123')
    await gotoAdminOrders(page)
    await expect(adminRow(page, 'AX-1003').locator('.admin-btn', { hasText: /add tracking/i })).toBeVisible()
  })

  test('CP-0.5.0-07 admin: URL sin http/https → error', async ({ page }) => {
    await loginUI(page, 'admin@aurexir.com', 'adminpass123')
    await gotoAdminOrders(page)
    await adminRow(page, 'AX-1003').locator('.admin-btn', { hasText: /tracking/i }).click()
    await page.locator('.admin-modal input[type=text]').first().fill('1Z-ADMIN-999')
    await page.locator('.admin-modal input[type=url]').fill('ftp://nope')
    await page.locator('.admin-modal .admin-btn--primary').click()
    await expect(page.locator('.admin-modal .admin-error')).toContainText(/http/i)
  })

  test('CP-0.5.0-08 admin: guardar → shipped + éxito + "Edit tracking"', async ({ page }) => {
    await loginUI(page, 'admin@aurexir.com', 'adminpass123')
    await gotoAdminOrders(page)
    const row = adminRow(page, 'AX-1003')
    await row.locator('.admin-btn', { hasText: /tracking/i }).click()
    await page.locator('.admin-modal input[type=text]').first().fill('1Z-ADMIN-999')
    await page.locator('.admin-modal input[type=text]').nth(1).fill('FedEx')
    await page.locator('.admin-modal input[type=url]').fill('https://fedex.com/track/1Z-ADMIN-999')
    await page.locator('.admin-modal .admin-btn--primary').click()
    await expect(page.locator('.admin-ok')).toContainText(/saved|guardado/i)
    await expect(row.locator('.admin-badge')).toContainText(/shipped/i)
    await expect(row.locator('.admin-btn', { hasText: /edit tracking/i })).toBeVisible()
  })

  test('CP-0.5.0-09 admin: pending no ofrece tracking (evita 409)', async ({ page }) => {
    await loginUI(page, 'admin@aurexir.com', 'adminpass123')
    await gotoAdminOrders(page)
    await expect(adminRow(page, 'AX-1002').locator('.admin-btn', { hasText: /tracking/i })).toHaveCount(0)
  })

  test('CP-0.5.0-10 admin: editar tracking precarga el número', async ({ page }) => {
    await loginUI(page, 'admin@aurexir.com', 'adminpass123')
    await gotoAdminOrders(page)
    await adminRow(page, 'AX-1004').locator('.admin-btn', { hasText: /edit tracking/i }).click()
    await expect(page.locator('.admin-modal input[type=text]').first()).toHaveValue('1Z999AA10123456784')
  })
})
