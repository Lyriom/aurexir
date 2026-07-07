/*
 * Configuración de la tienda.
 *
 * 👉 WHATSAPP_NUMBER: número al que se envían los pedidos, en formato
 *    internacional SIN "+", espacios ni guiones. Ejemplo Ecuador: 593991234567
 *    Mientras esté vacío, el botón abre WhatsApp sin destinatario fijo.
 * 👉 INSTAGRAM_DM_URL: enlace directo para escribir por DM en Instagram.
 */
export const WHATSAPP_NUMBER = ''
export const INSTAGRAM_DM_URL = 'https://ig.me/m/aurexir'

// Construye el enlace de WhatsApp con un mensaje pre-rellenado para el perfume.
export function whatsappLink(product) {
  const msg =
    `Hola AUREXIR ✦, me interesa *${product.name}*` +
    (product.size ? ` · ${product.size}` : '') +
    (product.price ? ` · Precio: $${product.price}` : '') +
    '. ¿Está disponible?'
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(msg)}`
}

export function instagramLink() {
  return INSTAGRAM_DM_URL
}

export function instagramMessage(product) {
  return (
    `Hola AUREXIR, busco más información sobre ${product?.name || 'esta fragancia'}` +
    (product?.size ? ` · ${product.size}` : '') +
    (product?.price ? ` · Precio: $${product.price}` : '')
  )
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
