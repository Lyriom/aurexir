// v0.1.0 — Catálogo y carrito (base). Ver qa/v0.1.0_2026-07-12_catalogo-base/
import { test, expect, suppressPromo, setLocale, addToCart } from './fixtures.js'

test.describe('v0.1.0 · Catálogo y carrito', () => {
  test.beforeEach(async ({ page }) => {
    await suppressPromo(page)
  })

  test('CP-0.1.0-01 idioma por defecto EN y cambio a ES persistente', async ({ page, mock }) => {
    void mock
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    await setLocale(page, 'es')
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  })

  test('CP-0.1.0-02 añadir al carrito y persistir tras recarga', async ({ page, mock }) => {
    void mock
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy')
    await expect(page.locator('.cart-count').first()).toContainText('1')

    await page.reload()
    await expect(page.locator('.cart-btn .cart-count')).toContainText('1')
  })

  test('CP-0.1.0-04 barra de envío gratis a $200', async ({ page, mock }) => {
    void mock
    await page.goto('/')
    await addToCart(page, 'Coral Fantasy') // $130 < 200
    await expect(page.locator('.cart-freeship-text')).toContainText(/more for FREE shipping/i)
  })

  test('CP-0.1.0-06 buscador filtra la rejilla', async ({ page, mock }) => {
    void mock
    await page.goto('/')
    await page.locator('.card').first().waitFor()
    const before = await page.locator('.grid .card').count()
    await page.fill('.header-inner .search-input', 'Dior')
    await expect(page.locator('.grid .card')).not.toHaveCount(before)
    await expect(page.locator('.grid .card')).toContainText([/Dior/i])
  })
})
