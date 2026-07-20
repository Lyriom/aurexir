/*
 * Backend AUREXIR simulado por interceptación de red (Playwright route).
 * Replica el contrato de src/api.js para que la suite E2E sea autocontenida.
 *
 * Cada test crea su propio estado con createState() y lo instala con
 * installApiMock(page, state); así los tests no comparten datos entre sí.
 * `state.captured` guarda los cuerpos enviados a endpoints clave para aserciones.
 */
import { products as CATALOG } from '../../../src/data/products.js'

const BASE = 'http://localhost:8000'

export function createState() {
  // Catálogo: mismo shape que la API real + stock/active. Khamrah agotado.
  const products = CATALOG.map((p) => ({
    ...p,
    stock: p.id === 'khamrah' ? 0 : 10,
    active: true,
  }))

  const users = {
    'cliente@test.com': { id: 'u1', email: 'cliente@test.com', name: 'Cliente Test', role: 'customer', password: 'password123' },
    'admin@aurexir.com': { id: 'u2', email: 'admin@aurexir.com', name: 'Admin', role: 'admin', password: 'adminpass123' },
  }

  const orders = [
    {
      id: 'o1', number: 'AX-1001', status: 'paid', subtotal: 260, shipping_cost: 0,
      tax: 23.08, total: 268.08, discount_code: 'AURX15-ABC123', discount_amount: 15,
      shipping_method: 'standard', shipping_address: { zip: '10001' }, created_at: '2026-07-10T15:30:00Z',
      tracking_number: null, tracking_carrier: null, tracking_url: null,
      user: { id: 'u1', email: 'cliente@test.com', name: 'Cliente Test' },
      items: [
        { id: 'sauvage-edp', name: 'Sauvage EDP', brand: 'Dior', unit_price: 120, qty: 1, image: '/perfumes/sauvage-edp-1.webp' },
        { id: 'khamrah', name: 'Khamrah', brand: 'Lattafa', unit_price: 85, qty: 1, image: '/perfumes/khamrah-1.webp' },
      ],
    },
    {
      id: 'o2', number: 'AX-1002', status: 'pending', subtotal: 130, shipping_cost: 14.95,
      tax: 0, total: 144.95, discount_code: null, discount_amount: 0,
      shipping_method: 'express', shipping_address: {}, created_at: '2026-07-13T10:00:00Z',
      tracking_number: null, tracking_carrier: null, tracking_url: null,
      user: { id: 'u1', email: 'cliente@test.com', name: 'Cliente Test' },
      items: [{ id: 'coral-fantasy', name: 'Coral Fantasy', brand: 'Valentino Uomo', unit_price: 130, qty: 1, image: '/perfumes/coral-fantasy-1.webp' }],
    },
    {
      id: 'o3', number: 'AX-1003', status: 'paid', subtotal: 130, shipping_cost: 30,
      tax: 0, total: 160, discount_code: null, discount_amount: 0,
      shipping_method: 'eco', shipping_address: {}, created_at: '2026-07-14T09:00:00Z',
      tracking_number: null, tracking_carrier: null, tracking_url: null,
      user: { id: 'u1', email: 'cliente@test.com', name: 'Cliente Test' },
      items: [{ id: 'coral-fantasy', name: 'Coral Fantasy', brand: 'Valentino Uomo', unit_price: 130, qty: 1, image: '/perfumes/coral-fantasy-1.webp' }],
    },
    {
      id: 'o4', number: 'AX-1004', status: 'shipped', subtotal: 120, shipping_cost: 20,
      tax: 0, total: 140, discount_code: null, discount_amount: 0,
      shipping_method: 'standard', shipping_address: {}, created_at: '2026-07-09T12:00:00Z',
      tracking_number: '1Z999AA10123456784', tracking_carrier: 'UPS',
      tracking_url: 'https://www.ups.com/track?tracknum=1Z999AA10123456784',
      user: { id: 'u1', email: 'cliente@test.com', name: 'Cliente Test' },
      items: [{ id: 'sauvage-edp', name: 'Sauvage EDP', brand: 'Dior', unit_price: 120, qty: 1, image: '/perfumes/sauvage-edp-1.webp' }],
    },
  ]

  return {
    products,
    users,
    orders,
    tokens: {}, // token -> email
    subscribers: new Set(['exists@test.com']),
    loginAttempts: [], // timestamps (ms)
    validCodes: { 'AURX15-TEST01': 15, 'AURX15-USED77': 15 }, // USED77 falla al pagar (409)
    captured: { checkout: [], quote: [], newsletter: [], tracking: [] },
  }
}

const TRANSITIONS = {
  pending: ['paid', 'canceled'],
  paid: ['shipped', 'canceled'],
  shipped: ['delivered', 'canceled'],
  delivered: [],
  canceled: [],
}

function userFromAuth(state, auth) {
  const token = (auth || '').replace('Bearer ', '')
  const email = state.tokens[token]
  return email ? state.users[email] : null
}

function pub(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

// Devuelve { status, body } según método+path. Lógica equivalente a la API real.
function dispatch(state, { method, path, query, body, auth }) {
  const notFound = { status: 404, body: { detail: 'Not found' } }

  if (method === 'GET' && path === '/products') return { status: 200, body: state.products }
  if (method === 'GET' && path.startsWith('/products/')) {
    const slug = path.split('/')[2]
    const p = state.products.find((x) => x.id === slug)
    return p ? { status: 200, body: p } : { status: 404, body: { detail: 'Product not found' } }
  }

  if (method === 'POST' && path === '/auth/register') {
    if (!body?.password || body.password.length < 8) {
      return { status: 422, body: { detail: [{ loc: ['body', 'password'], msg: 'String should have at least 8 characters' }] } }
    }
    const email = (body.email || '').toLowerCase()
    const user = { id: 'u9', email, name: body.name || '', role: 'customer', password: body.password }
    state.users[email] = user
    state.tokens['tok-u9'] = email
    return { status: 201, body: { access_token: 'tok-u9', token_type: 'bearer', user: pub(user) } }
  }

  if (method === 'POST' && path === '/auth/login') {
    const now = Date.now()
    state.loginAttempts.push(now)
    const recent = state.loginAttempts.filter((t) => now - t < 60_000)
    if (recent.length > 10) return { status: 429, body: { detail: 'Too many login attempts' } }
    const user = state.users[(body.email || '').toLowerCase()]
    if (!user || user.password !== body.password) return { status: 401, body: { detail: 'Incorrect email or password' } }
    const token = `tok-${user.id}`
    state.tokens[token] = user.email
    return { status: 200, body: { access_token: token, token_type: 'bearer', user: pub(user) } }
  }

  if (method === 'GET' && path === '/auth/me') {
    const u = userFromAuth(state, auth)
    return u ? { status: 200, body: pub(u) } : { status: 401, body: { detail: 'Not authenticated' } }
  }

  if (method === 'GET' && path === '/orders/mine') {
    const u = userFromAuth(state, auth)
    if (!u) return { status: 401, body: { detail: 'Not authenticated' } }
    return { status: 200, body: state.orders }
  }

  if (method === 'POST' && path === '/shipping/quote') {
    state.captured.quote.push(body)
    const rates = { standard: 20, eco: 30 }
    if (!(body.method in rates)) {
      return { status: 422, body: { detail: [{ loc: ['body', 'method'], msg: 'method must be standard or eco' }] } }
    }
    let subtotal = 0
    for (const it of body.items || []) {
      const p = state.products.find((x) => x.id === it.id)
      if (p) subtotal += p.price * it.qty
    }
    const shipping = subtotal >= 200 ? 0 : rates[body.method]
    return { status: 200, body: { subtotal, shipping, free_shipping_threshold: 200, method: body.method, total_estimate: Math.round((subtotal + shipping) * 100) / 100 } }
  }

  if (method === 'POST' && path === '/newsletter') {
    state.captured.newsletter.push(body)
    const email = (body.email || '').toLowerCase()
    const sent = email !== 'fail@test.com'
    if (state.subscribers.has(email)) return { status: 200, body: { status: 'already_subscribed', discount_email_sent: sent } }
    state.subscribers.add(email)
    return { status: 201, body: { status: 'subscribed', discount_email_sent: sent } }
  }

  if (method === 'POST' && path === '/discounts/validate') {
    const code = (body.code || '').trim().toUpperCase()
    if (code in state.validCodes) return { status: 200, body: { valid: true, code, percent: state.validCodes[code] } }
    return { status: 200, body: { valid: false, code, percent: 0 } }
  }

  if (method === 'POST' && path === '/checkout/session') {
    const u = userFromAuth(state, auth)
    if (!u) return { status: 401, body: { detail: 'Not authenticated' } }
    state.captured.checkout.push(body)
    if (body.discount_code === 'AURX15-USED77') {
      return { status: 409, body: { detail: 'Código de descuento inválido o ya usado' } }
    }
    return { status: 200, body: { checkout_url: body.success_url || `${BASE}/checkout/success` } }
  }

  // ---- Admin ----
  if (path.startsWith('/admin/')) {
    const u = userFromAuth(state, auth)
    if (!u) return { status: 401, body: { detail: 'Not authenticated' } }
    if (u.role !== 'admin') return { status: 403, body: { detail: 'Admin only' } }

    if (method === 'GET' && path === '/admin/metrics') {
      return {
        status: 200,
        body: {
          revenue_total: 4820.5, orders_count: 23, aov: 209.58, new_customers: 9,
          revenue_by_day: [
            { date: '2026-07-12', revenue: 410, orders: 2 },
            { date: '2026-07-13', revenue: 283.08, orders: 1 },
          ],
          top_products: [
            { slug: 'sauvage-edp', name: 'Sauvage EDP', units: 7, revenue: 840 },
            { slug: 'althair', name: 'Althaïr', units: 2, revenue: 640 },
          ],
          low_stock: [{ slug: 'khamrah', name: 'Khamrah', stock: 0 }],
        },
      }
    }
    if (method === 'GET' && path === '/admin/orders') {
      const status = query.get('status')
      const data = status ? state.orders.filter((o) => o.status === status) : state.orders
      return { status: 200, body: data }
    }
    if (method === 'GET' && path === '/admin/products') return { status: 200, body: state.products }

    if (method === 'POST' && path === '/admin/products') {
      const p = { stock: 0, active: true, ...body }
      state.products.push(p)
      return { status: 201, body: p }
    }

    const trackM = path.match(/^\/admin\/orders\/([\w-]+)\/tracking$/)
    if (method === 'PATCH' && trackM) {
      state.captured.tracking.push({ id: trackM[1], body })
      const o = state.orders.find((x) => x.id === trackM[1])
      if (!o) return { status: 404, body: { detail: 'Order not found' } }
      if (o.status !== 'paid' && o.status !== 'shipped') return { status: 409, body: { detail: 'El pedido no está pagado' } }
      const url = body.tracking_url
      if (url && !/^https?:\/\//i.test(url)) return { status: 422, body: { detail: [{ loc: ['body', 'tracking_url'], msg: 'URL must start with http/https' }] } }
      const num = (body.tracking_number || '').trim()
      if (!num) return { status: 422, body: { detail: [{ loc: ['body', 'tracking_number'], msg: 'required' }] } }
      o.status = 'shipped'
      o.tracking_number = num
      o.tracking_carrier = body.tracking_carrier ?? null
      o.tracking_url = url ?? null
      return { status: 200, body: o }
    }

    const orderM = path.match(/^\/admin\/orders\/([\w-]+)$/)
    if (method === 'PATCH' && orderM) {
      const o = state.orders.find((x) => x.id === orderM[1])
      if (!o) return { status: 404, body: { detail: 'Order not found' } }
      if (!(TRANSITIONS[o.status] || []).includes(body.status)) {
        return { status: 409, body: { detail: `Invalid transition ${o.status} -> ${body.status}` } }
      }
      o.status = body.status
      return { status: 200, body: o }
    }

    const stockM = path.match(/^\/admin\/products\/([\w-]+)\/stock$/)
    if (method === 'PATCH' && stockM) {
      const p = state.products.find((x) => x.id === stockM[1])
      if (!p) return { status: 404, body: { detail: 'Product not found' } }
      if (!Number.isInteger(body.delta)) return { status: 422, body: { detail: [{ loc: ['body', 'delta'], msg: 'delta must be an integer' }] } }
      p.stock = Math.max(0, p.stock + body.delta)
      return { status: 200, body: p }
    }

    const prodM = path.match(/^\/admin\/products\/([\w-]+)$/)
    if (method === 'PATCH' && prodM) {
      const p = state.products.find((x) => x.id === prodM[1])
      if (!p) return { status: 404, body: { detail: 'Product not found' } }
      Object.assign(p, body)
      return { status: 200, body: p }
    }
  }

  return notFound
}

export async function installApiMock(page, state) {
  await page.route(`${BASE}/**`, async (route) => {
    const req = route.request()
    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
      'access-control-allow-headers': 'Content-Type,Authorization',
    }
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: cors, body: '' })
    }
    const url = new URL(req.url())
    let body
    try {
      body = req.postDataJSON()
    } catch {
      body = undefined
    }
    const { status, body: resBody } = dispatch(state, {
      method: req.method(),
      path: url.pathname,
      query: url.searchParams,
      body: body || {},
      auth: req.headers()['authorization'],
    })
    return route.fulfill({
      status,
      headers: { ...cors, 'content-type': 'application/json' },
      body: JSON.stringify(resBody ?? null),
    })
  })
}
