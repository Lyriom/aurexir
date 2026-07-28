/*
 * Utilidades de seguridad del front.
 *
 * Aunque el backend valida las URLs que guarda (p. ej. el tracking o la URL de
 * Stripe), el front NO debe confiar ciegamente en ellas: una URL con esquema
 * `javascript:` o `data:` renderizada en un <a href> o pasada a
 * window.location se ejecutaría como código (XSS almacenado). Estas funciones
 * son la última barrera antes de convertir un dato del backend en navegación.
 */

// true solo si `value` es una URL absoluta http(s) bien formada.
// Rechaza javascript:, data:, blob:, vbscript:, rutas relativas, etc.
export function isHttpUrl(value) {
  if (typeof value !== 'string' || !value) return false
  let u
  try {
    u = new URL(value)
  } catch {
    return false
  }
  return u.protocol === 'http:' || u.protocol === 'https:'
}

// Devuelve la URL si es http(s) segura; si no, null (para ocultar el enlace).
export function safeHttpUrl(value) {
  return isHttpUrl(value) ? value : null
}
