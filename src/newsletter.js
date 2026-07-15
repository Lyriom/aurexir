/*
 * Alta al newsletter con código de bienvenida (15%, un solo uso).
 * Compartido por el popup de captura (PromoModal) y el banner del footer,
 * para que ambos muestren exactamente los mismos mensajes.
 *
 * POST /newsletter {email, locale} →
 *   201 {status:"subscribed",       discount_email_sent:true|false}
 *   200 {status:"already_subscribed", ...}
 *
 * Devuelve la clave del mensaje (i18n newsletter.*):
 *   'sent'    → código enviado por primera vez
 *   'resent'  → ya estaba suscrito, se le reenvió el código
 *   'pending' → suscrito, pero el email del código falló (llegará luego)
 * Errores (429, red, etc.) se lanzan como ApiError → apiErrorMessage().
 */
import { api } from './api.js'
import { locale } from './i18n.js'

export async function subscribeWithDiscount(email) {
  const res = await api.subscribeNewsletter(email.trim(), locale.value)
  if (res && res.discount_email_sent === false) return 'pending'
  if (res && res.status === 'already_subscribed') return 'resent'
  return 'sent'
}
