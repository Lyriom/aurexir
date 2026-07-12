/*
 * Cliente del backend AUREXIR (FastAPI).
 *
 * Este archivo ES el contrato front ↔ back: cada función de `api` corresponde
 * a un endpoint que el backend expone (ver BACKEND_PROMPT.md en la raíz).
 * Autenticación: JWT Bearer guardado en localStorage; un 401 limpia la sesión.
 *
 * Si API_BASE está vacío (sin .env), toda llamada rechaza con ApiError
 * 'API_DISABLED' — el front sigue funcionando en modo catálogo (IG/WhatsApp).
 */
import { API_BASE } from './config.js'

const TOKEN_KEY = 'aurexir-token'

export class ApiError extends Error {
  constructor(message, status = 0, detail = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* almacenamiento no disponible */
  }
}

export function isLoggedIn() {
  return Boolean(getToken())
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  if (!API_BASE) throw new ApiError('API_DISABLED', 0)

  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (!token) throw new ApiError('NOT_AUTHENTICATED', 401)
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (res.status === 401) {
    setToken(null)
    throw new ApiError('SESSION_EXPIRED', 401)
  }
  if (!res.ok) {
    let detail = null
    try {
      detail = (await res.json()).detail ?? null
    } catch {
      /* cuerpo no-JSON */
    }
    throw new ApiError(`HTTP_${res.status}`, res.status, detail)
  }
  return res.status === 204 ? null : res.json()
}

// Reduce el carrito al payload que consume el back: [{ id, qty }]
export function cartToPayload(items) {
  return items.map((i) => ({ id: i.id, qty: i.qty }))
}

export const api = {
  /* ---- Auth (cliente y admin comparten login; el rol viene en `user`) ---- */
  // → { access_token, user: { id, email, name, role } }
  register: ({ email, password, name }) =>
    request('/auth/register', { method: 'POST', body: { email, password, name } }),
  login: ({ email, password }) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me', { auth: true }),

  /* ---- Catálogo (el back es la fuente de verdad de precio y stock) ---- */
  // → [{ id, name, brand, category, price, oldPrice, image, gallery, stock, ... }]
  listProducts: () => request('/products'),
  getProduct: (id) => request(`/products/${id}`),

  /* ---- Envío ---- */
  // → { subtotal, shipping, free_shipping_threshold, method, total_estimate }
  quoteShipping: ({ items, zip, method = 'standard' }) =>
    request('/shipping/quote', { method: 'POST', body: { items, zip, method } }),

  /* ---- Checkout con Stripe (requiere sesión) ---- */
  // → { checkout_url }  (redirigir el navegador a esa URL)
  createCheckoutSession: ({ items, shipping_method = 'standard' }) =>
    request('/checkout/session', {
      method: 'POST',
      auth: true,
      body: {
        items,
        shipping_method,
        success_url: `${window.location.origin}/?checkout=success`,
        cancel_url: `${window.location.origin}/?checkout=cancel#cart`,
      },
    }),

  /* ---- Pedidos del cliente ---- */
  myOrders: () => request('/orders/mine', { auth: true }),

  /* ---- Newsletter ---- */
  subscribeNewsletter: (email, locale = 'en') =>
    request('/newsletter', { method: 'POST', body: { email, locale } }),

  /* ---- Admin (requiere user.role === 'admin') ---- */
  admin: {
    metrics: (days = 30) => request(`/admin/metrics?days=${days}`, { auth: true }),
    orders: () => request('/admin/orders', { auth: true }),
    updateOrderStatus: (orderId, status) =>
      request(`/admin/orders/${orderId}`, { method: 'PATCH', auth: true, body: { status } }),
    products: () => request('/admin/products', { auth: true }),
    createProduct: (data) =>
      request('/admin/products', { method: 'POST', auth: true, body: data }),
    updateProduct: (id, data) =>
      request(`/admin/products/${id}`, { method: 'PATCH', auth: true, body: data }),
    updateStock: (id, stock, reason = 'manual') =>
      request(`/admin/products/${id}/stock`, {
        method: 'PATCH',
        auth: true,
        body: { stock, reason },
      }),
  },
}
