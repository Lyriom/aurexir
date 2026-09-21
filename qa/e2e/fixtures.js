/*
 * Fixtures y helpers compartidos por los specs E2E.
 *
 * `test` extiende el de Playwright con la fixture `mock`, que instala el
 * backend simulado (qa/e2e/mock) antes de cada test y expone su estado para
 * aserciones (p. ej. cuerpos capturados en `mock.captured`).
 */
import { test as base, expect } from '@playwright/test'
import { createState, installApiMock } from './mock/api-mock.js'

export const test = base.extend({
  // `auto: true` → se instala en TODOS los tests aunque no lo referencien en la
  // firma; así el backend simulado siempre está activo (si no, las llamadas a
  // la API fallarían por red y el catálogo caería al fallback local).
  mock: [
    async ({ page }, use) => {
      const state = createState()
      await installApiMock(page, state)
      await use(state)
    },
    { auto: true },
  ],
})

export { expect }

/* ---- Helpers de flujo ---- */

// Silencia el popup de bienvenida (para tests que no lo prueban).
export async function suppressPromo(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('aurexir_promo_done', '1')
    } catch {}
  })
}

// Fija el idioma antes de cargar (evita depender del selector visual).
export async function setLocale(page, locale) {
  await page.addInitScript((l) => {
    try {
      localStorage.setItem('aurexir-locale', l)
    } catch {}
  }, locale)
}

// Inicia sesión por la UI y espera a salir de /login.
export async function loginUI(page, email, password) {
  await page.goto('/login')
  await page.fill('.auth-card input[type=email]', email)
  await page.fill('.auth-card input[type=password]', password)
  await page.click('.auth-submit')
  await page.waitForFunction(() => !location.pathname.startsWith('/login'))
}

// Añade un producto (por texto) al carrito y espera el drawer abierto.
// Se acota a la rejilla completa (.grid) porque un producto puede aparecer
// también en las filas destacadas (novedades / best sellers / ofertas).
export async function addToCart(page, productText) {
  await page.locator('.grid .card', { hasText: productText }).first().locator('.add-btn').click()
  await page.locator('.cart').waitFor({ state: 'visible' })
}

// Abre el panel admin en la pestaña de pedidos.
export async function gotoAdminOrders(page) {
  await page.goto('/admin')
  await page.locator('.admin-tab', { hasText: /orders|pedidos/i }).click()
  await page.locator('.admin-table tbody tr').first().waitFor()
}

// Fila de la tabla admin que contiene el número de pedido.
export function adminRow(page, number) {
  return page.locator('.admin-table tbody tr', { hasText: number })
}

// Importe de la línea de ENVÍO del carrito (evita confundir con "Total
// estimado" o la línea de descuento, que también son .cart-shipline).
export function shipAmount(page) {
  return page.locator('.cart-shipline', { hasText: /shipping|env[ií]o/i }).locator('span').last()
}
