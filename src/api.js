/*
 * Cliente del backend AUREXIR (FastAPI).
 *
 * Este archivo ES el contrato front ↔ back: cada función de `api` corresponde
 * a un endpoint que el backend expone (ver BACKEND_PROMPT.md en la raíz).
 * Autenticación: JWT Bearer guardado en localStorage; un 401 en una llamada
 * autenticada limpia la sesión y avisa vía onSessionExpired (auth.js redirige).
 *
 * Si API_BASE está vacío (sin .env), toda llamada rechaza con ApiError
 * 'API_DISABLED' — el front sigue funcionando en modo catálogo (IG/WhatsApp).
 */
import { API_BASE } from './config.js'
import { locale } from './i18n.js'

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

/* Hook de sesión expirada: auth.js lo registra para limpiar el usuario y
 * mandar a /login cuando un endpoint autenticado devuelve 401. */
let sessionExpiredHandler = null
export function onSessionExpired(fn) {
  sessionExpiredHandler = fn
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  if (!API_BASE) throw new ApiError('API_DISABLED', 0)

  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (!token) throw new ApiError('NOT_AUTHENTICATED', 401)
    headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    // Red caída / CORS / servidor apagado.
    throw new ApiError('NETWORK_ERROR', 0)
  }

  // 401 en llamada autenticada = token inválido/expirado → cerrar sesión.
  // (Un 401 público, p. ej. credenciales malas en /auth/login, NO limpia nada.)
  if (res.status === 401 && auth) {
    setToken(null)
    if (sessionExpiredHandler) sessionExpiredHandler()
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

/*
 * Convierte un error (normalmente ApiError) en un mensaje legible en el
 * idioma activo. FastAPI devuelve {"detail": "..."} o, en errores de
 * validación 422, {"detail": [{loc, msg, ...}, ...]}.
 */
export function apiErrorMessage(err) {
  const en = locale.value === 'en'
  if (!(err instanceof ApiError)) {
    return en ? 'Something went wrong. Please try again.' : 'Algo salió mal. Inténtalo de nuevo.'
  }
  if (err.message === 'API_DISABLED' || err.message === 'NETWORK_ERROR') {
    return en
      ? 'We couldn’t reach the store server. Please try again in a moment.'
      : 'No pudimos conectar con el servidor de la tienda. Inténtalo en un momento.'
  }
  if (err.message === 'SESSION_EXPIRED' || err.message === 'NOT_AUTHENTICATED') {
    return en ? 'Your session expired. Please sign in again.' : 'Tu sesión expiró. Inicia sesión de nuevo.'
  }
  if (err.status === 429) {
    return en
      ? 'Too many attempts — please wait a moment and try again.'
      : 'Demasiados intentos: espera un momento y vuelve a intentarlo.'
  }
  // 422 de validación: lista [{loc, msg}]
  if (Array.isArray(err.detail)) {
    const msgs = err.detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null
        return field ? `${field}: ${d.msg}` : d.msg
      })
      .filter(Boolean)
    if (msgs.length) return msgs.join(' · ')
  }
  if (typeof err.detail === 'string' && err.detail) return err.detail
  return en ? 'Something went wrong. Please try again.' : 'Algo salió mal. Inténtalo de nuevo.'
}

export const api = {
  /* ---- Auth (cliente y admin comparten login; el rol viene en `user`) ---- */
  // → { access_token, token_type, user: { id, email, name, role } }
  register: ({ email, password, name }) =>
    request('/auth/register', { method: 'POST', body: { email, password, name } }),
  login: ({ email, password }) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me', { auth: true }),

  /* ---- Catálogo (el back es la fuente de verdad de precio y stock) ---- */
  // → [{ id, name, brand, category, price, oldPrice, image, gallery, stock, ... }]
  listProducts: () => request('/products'),
  getProduct: (id) => request(`/products/${id}`),

  /* ---- Envío (tarifa plana por método; ya no se envía ZIP) ---- */
  // method: 'standard' ($20) | 'eco' ($30). Envío gratis desde el umbral.
  // → { subtotal, shipping, free_shipping_threshold, method, total_estimate }
  quoteShipping: ({ items, method = 'standard' }) =>
    request('/shipping/quote', { method: 'POST', body: { items, method } }),

  /* ---- Descuentos ---- */
  // → { valid, code, percent } (siempre 200; valid=false si no existe o ya se usó)
  validateDiscount: (code) =>
    request('/discounts/validate', { method: 'POST', body: { code } }),

  /* ---- Checkout con Stripe (requiere sesión) ---- */
  // → { checkout_url }  (redirigir el navegador a esa URL)
  // discount_code opcional; el back responde 409 si es inválido o ya usado.
  createCheckoutSession: ({ items, shipping_method = 'standard', discount_code = null }) =>
    request('/checkout/session', {
      method: 'POST',
      auth: true,
      body: {
        items,
        shipping_method,
        ...(discount_code ? { discount_code } : {}),
        success_url: `${window.location.origin}/checkout/success`,
        cancel_url: `${window.location.origin}/checkout/cancel`,
      },
    }),

  /* ---- Pedidos del cliente ---- */
  myOrders: () => request('/orders/mine', { auth: true }),

  /* ---- Newsletter (201; idempotente, repetir no da error) ---- */
  subscribeNewsletter: (email, loc = 'en') =>
    request('/newsletter', { method: 'POST', body: { email, locale: loc } }),

  /* ---- Admin (requiere user.role === 'admin'; la API responde 403 si no) ---- */
  admin: {
    metrics: (days = 30) => request(`/admin/metrics?days=${days}`, { auth: true }),
    orders: (status = '') =>
      request(`/admin/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`, {
        auth: true,
      }),
    updateOrderStatus: (orderId, status) =>
      request(`/admin/orders/${orderId}`, { method: 'PATCH', auth: true, body: { status } }),
    products: () => request('/admin/products', { auth: true }),
    createProduct: (data) =>
      request('/admin/products', { method: 'POST', auth: true, body: data }),
    updateProduct: (id, data) =>
      request(`/admin/products/${id}`, { method: 'PATCH', auth: true, body: data }),
    // Ajuste de inventario: delta (+/-) y motivo (restock | manual | ...).
    adjustStock: (id, delta, reason = 'manual') =>
      request(`/admin/products/${id}/stock`, {
        method: 'PATCH',
        auth: true,
        body: { delta, reason },
      }),
  },
}
