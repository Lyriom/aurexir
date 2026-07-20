// v0.2.0 — Backend real (auth, checkout, admin).
// Ver qa/v0.2.0_2026-07-14_backend-auth-checkout-admin/
import { test, expect, suppressPromo, loginUI, addToCart, gotoAdminOrders, adminRow } from './fixtures.js'

test.describe('v0.2.0 · Backend, auth, checkout, admin', () => {
  test.beforeEach(async ({ page }) => {
    await suppressPromo(page)
  })

  test('CP-0.2.0-01 catálogo desde API (20 productos)', async ({ page }) => {
    await page.goto('/')
    await page.locator('.grid .card').first().waitFor()
    await expect(page.locator('.grid .card')).toHaveCount(20)
  })

  test('CP-0.2.0-03 producto agotado: badge y botón deshabilitado', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('.grid .card', { hasText: 'Khamrah' })
    await expect(card.locator('.card-badge')).toHaveText(/sold out/i)
    await expect(card.locator('.add-btn')).toBeDisabled()
  })

  test('CP-0.2.0-04 login con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login')
    await page.fill('.auth-card input[type=email]', 'cliente@test.com')
    await page.fill('.auth-card input[type=password]', 'incorrecta')
    await page.click('.auth-submit')
    await expect(page.locator('.auth-error')).toContainText(/wrong email or password|incorrect/i)
    await expect(page).toHaveURL(/\/login/)
  })

  test('CP-0.2.0-05 checkout como invitado vuelve al carrito tras login', async ({ page }) => {
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await page.click('.cart-pay')
    await expect(page).toHaveURL(/\/login/)
    await page.fill('.auth-card input[type=email]', 'cliente@test.com')
    await page.fill('.auth-card input[type=password]', 'password123')
    await page.click('.auth-submit')
    await expect(page).toHaveURL(/#cart/)
    await expect(page.locator('.cart')).toBeVisible()
  })

  test('CP-0.2.0-06 rate limit 429 en login', async ({ page, mock }) => {
    for (let i = 0; i < 11; i++) mock.loginAttempts.push(Date.now())
    await page.goto('/login')
    await page.fill('.auth-card input[type=email]', 'cliente@test.com')
    await page.fill('.auth-card input[type=password]', 'password123')
    await page.click('.auth-submit')
    await expect(page.locator('.auth-error')).toContainText(/too many|demasiados/i)
  })

  test('CP-0.2.0-07 restauración de sesión tras recarga', async ({ page }) => {
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.reload()
    await page.goto('/account')
    await expect(page).toHaveURL(/\/account/)
    await expect(page.locator('.order').first()).toBeVisible()
  })

  test('CP-0.2.0-08 token corrupto → /account manda a /login', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('aurexir-token', 'tok-basura')
      } catch {}
    })
    await page.goto('/account')
    await expect(page).toHaveURL(/\/login/)
  })

  test('CP-0.2.0-09 guard: customer no entra a /admin', async ({ page }) => {
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/admin')
    await expect(page).not.toHaveURL(/\/admin/)
  })

  test('CP-0.2.0-11 checkout con sesión → success y vacía carrito', async ({ page }) => {
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await page.click('.cart-pay')
    await expect(page).toHaveURL(/\/checkout\/success/)
    await expect(page.locator('.cart-btn .cart-count')).toHaveCount(0)
  })

  test('CP-0.2.0-12 mis pedidos: número, estado y total', async ({ page }) => {
    await loginUI(page, 'cliente@test.com', 'password123')
    await page.goto('/account')
    await expect(page.locator('.order')).toHaveCount(4)
    const o1 = page.locator('.order', { hasText: 'AX-1001' })
    await expect(o1.locator('.order-status')).toContainText(/paid/i)
    await expect(o1.locator('.order-total dd')).toContainText('$268.08')
  })

  test('CP-0.2.0-13 admin dashboard: métricas', async ({ page }) => {
    await loginUI(page, 'admin@aurexir.com', 'adminpass123')
    await page.goto('/admin')
    await expect(page.locator('.metric-card .metric-value').first()).toHaveText('$4,820.50')
  })

  test('CP-0.2.0-14/15 admin: transición pending→paid y sin saltos inválidos', async ({ page }) => {
    await loginUI(page, 'admin@aurexir.com', 'adminpass123')
    await gotoAdminOrders(page)
    const pending = adminRow(page, 'AX-1002')
    await expect(pending.locator('.admin-badge')).toContainText(/pending/i)
    await pending.locator('.admin-btn', { hasText: /paid/i }).click()
    await expect(pending.locator('.admin-badge')).toContainText(/paid/i)
    await expect(pending.locator('.admin-btn', { hasText: /shipped/i })).toBeVisible()
    // Un pedido "paid" no ofrece saltar directo a "delivered".
    const paid = adminRow(page, 'AX-1003')
    await expect(paid.locator('.admin-btn', { hasText: /delivered/i })).toHaveCount(0)
  })

  test('CP-0.2.0-16 admin: ajuste de stock {delta:+5}', async ({ page }) => {
    await loginUI(page, 'admin@aurexir.com', 'adminpass123')
    await page.goto('/admin')
    await page.locator('.admin-tab', { hasText: /products|productos/i }).click()
    const row = page.locator('.admin-table tbody tr', { hasText: 'Khamrah' })
    await row.locator('.admin-btn', { hasText: /^stock$/i }).click()
    await page.fill('.admin-modal input[type=number]', '5')
    await page.locator('.admin-modal .admin-btn--primary').click()
    // La 4ª columna es el stock (la 5ª es el estado activo/inactivo).
    await expect(row.locator('td').nth(3).locator('.admin-badge')).toHaveText('5')
  })

  test('CP-0.2.0-17 registro de nuevo cliente', async ({ page }) => {
    await page.goto('/login')
    await page.locator('.auth-switch').click()
    await page.fill('.auth-card input[type=text]', 'Nuevo Cliente')
    await page.fill('.auth-card input[type=email]', 'nuevo@test.com')
    await page.fill('.auth-card input[type=password]', 'password123')
    await page.click('.auth-submit')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('.account-dot')).toBeVisible()
  })
})
