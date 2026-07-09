/*
 * Configuración de la tienda.
 *
 * 👉 WHATSAPP_NUMBER: número al que se envían los pedidos, en formato
 *    internacional SIN "+", espacios ni guiones. Ejemplo Ecuador: 593991234567
 *    Mientras esté vacío, el botón abre WhatsApp sin destinatario fijo.
 * 👉 INSTAGRAM_DM_URL: enlace directo para escribir por DM en Instagram.
 */
import { locale } from './i18n.js'

export const WHATSAPP_NUMBER = ''
export const INSTAGRAM_DM_URL = 'https://ig.me/m/lyriom__'

// Construye el enlace de WhatsApp con un mensaje pre-rellenado, según el idioma.
export function whatsappLink(product) {
  const price = product?.price ? ` · ${locale.value === 'en' ? 'Price' : 'Precio'}: $${product.price}` : ''
  const msg =
    locale.value === 'en'
      ? `Hi AUREXIR ✦, I'm interested in *${product.name}*${price}. Is it available?`
      : `Hola AUREXIR ✦, me interesa *${product.name}*${price}. ¿Está disponible?`
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(msg)}`
}

export function instagramLink() {
  return INSTAGRAM_DM_URL
}

export function instagramMessage(product) {
  const en = locale.value === 'en'
  const name = product?.name || (en ? 'this fragrance' : 'esta fragancia')
  const price = product?.price ? ` · ${en ? 'Price' : 'Precio'}: $${product.price}` : ''
  return en
    ? `Hi AUREXIR, I'd like more info about ${name}${price}`
    : `Hola AUREXIR, busco más información sobre ${name}${price}`
}

function copyWithFallback(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

// Copia el mensaje al portapapeles y abre el DM de Instagram.
export async function openInstagramOrder(product) {
  const msg = instagramMessage(product)
  const dmUrl = instagramLink()

  if (typeof window === 'undefined') return

  const tab = window.open('about:blank', '_blank')
  if (tab) tab.opener = null

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(msg)
    } else {
      copyWithFallback(msg)
    }
  } catch {
    copyWithFallback(msg)
  } finally {
    if (tab) {
      tab.location.href = dmUrl
    } else {
      window.location.href = dmUrl
    }
  }
}
