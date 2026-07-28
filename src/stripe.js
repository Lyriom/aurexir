/*
 * Carga de Stripe.js bajo demanda (sin dependencia npm, para mantener el árbol
 * mínimo). Inyecta https://js.stripe.com/v3/ una sola vez y devuelve la instancia
 * de Stripe con la clave publicable.
 *
 * La CSP de producción (nginx.conf) permite js.stripe.com en script-src y los
 * iframes de Stripe en frame-src.
 */
import { STRIPE_PUBLISHABLE_KEY } from './config.js'

const STRIPE_JS = 'https://js.stripe.com/v3/'
let stripePromise = null

export function stripeConfigured() {
  return Boolean(STRIPE_PUBLISHABLE_KEY)
}

function loadScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no-window'))
    if (window.Stripe) return resolve(window.Stripe)

    const existing = document.querySelector('script[data-stripe-js]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Stripe))
      existing.addEventListener('error', () => reject(new Error('stripe-js-load-failed')))
      return
    }
    const s = document.createElement('script')
    s.src = STRIPE_JS
    s.async = true
    s.dataset.stripeJs = '1'
    s.addEventListener('load', () => resolve(window.Stripe))
    s.addEventListener('error', () => reject(new Error('stripe-js-load-failed')))
    document.head.appendChild(s)
  })
}

// Devuelve la instancia de Stripe (o null si no hay clave configurada).
export async function getStripe() {
  if (!STRIPE_PUBLISHABLE_KEY) return null
  if (!stripePromise) {
    stripePromise = loadScript()
      .then((Stripe) => Stripe(STRIPE_PUBLISHABLE_KEY))
      .catch((e) => {
        stripePromise = null // permite reintentar en el próximo intento
        throw e
      })
  }
  return stripePromise
}
