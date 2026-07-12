/*
 * Estado global de la tienda AUREXIR.
 *
 * - cart:   carrito reactivo persistido en localStorage. La forma de cada
 *           línea ({ id, name, brand, price, image, qty }) es el payload que
 *           consume el backend (ver api.js → cartToPayload).
 * - search / activeCategory: filtros compartidos entre el header (buscador y
 *           nav de categorías) y el catálogo.
 * - checkoutWhatsAppLink(): arma un pedido con TODO el carrito para WhatsApp.
 *
 * Igual que i18n.js, los refs/reactive viven en el módulo (singleton), así que
 * todos los componentes que lo importan comparten el mismo estado.
 */
import { reactive, ref, computed } from 'vue'
import { locale } from './i18n.js'
import { FREE_SHIPPING_THRESHOLD, WHATSAPP_NUMBER } from './config.js'

const STORAGE_KEY = 'aurexir-cart'

function loadItems() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const cart = reactive({
  items: loadItems(),
  open: false,
})

function persist() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart.items))
  } catch {
    /* almacenamiento no disponible */
  }
}

// Total de unidades (para el contador del icono del header).
export const cartCount = computed(() =>
  cart.items.reduce((sum, i) => sum + i.qty, 0)
)

// Importe total del carrito.
export const cartTotal = computed(() =>
  cart.items.reduce((sum, i) => sum + i.qty * i.price, 0)
)

/* ---- Envío gratis (mercado EE. UU.) ---- */
// Cuánto falta para el envío gratis y % de progreso hacia el umbral.
export const freeShippingRemaining = computed(() =>
  Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal.value)
)

export const freeShippingProgress = computed(() =>
  Math.min(100, Math.round((cartTotal.value / FREE_SHIPPING_THRESHOLD) * 100))
)

export function addToCart(product, qty = 1) {
  const existing = cart.items.find((i) => i.id === product.id)
  if (existing) {
    existing.qty += qty
  } else {
    cart.items.push({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      qty,
    })
  }
  cart.open = true
  persist()
}

export function removeFromCart(id) {
  const idx = cart.items.findIndex((i) => i.id === id)
  if (idx !== -1) cart.items.splice(idx, 1)
  persist()
}

export function setQty(id, qty) {
  const item = cart.items.find((i) => i.id === id)
  if (!item) return
  const next = Math.max(1, Math.round(qty))
  item.qty = next
  persist()
}

export function incQty(id) {
  const item = cart.items.find((i) => i.id === id)
  if (item) setQty(id, item.qty + 1)
}

export function decQty(id) {
  const item = cart.items.find((i) => i.id === id)
  if (!item) return
  if (item.qty <= 1) removeFromCart(id)
  else setQty(id, item.qty - 1)
}

export function clearCart() {
  cart.items.splice(0, cart.items.length)
  persist()
}

export function openCart() {
  cart.open = true
}

export function closeCart() {
  cart.open = false
}

// Formato de precio único de la tienda (mercado EE. UU. → en-US: $85.00).
export function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

// Arma un enlace de WhatsApp con el pedido completo (todas las líneas + total).
export function checkoutWhatsAppLink() {
  const en = locale.value === 'en'
  const head = en
    ? 'Hi AUREXIR ✦, I would like to order:'
    : 'Hola AUREXIR ✦, quiero pedir:'
  const lines = cart.items
    .map(
      (i) =>
        `• ${i.qty}× ${i.brand} — ${i.name} (${formatPrice(i.price * i.qty)})`
    )
    .join('\n')
  const totalLabel = en ? 'Total' : 'Total'
  const foot = `${totalLabel}: ${formatPrice(cartTotal.value)}`
  const msg = `${head}\n${lines}\n\n${foot}`
  const base = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}`
    : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(msg)}`
}

/* ---- Filtros compartidos (buscador + categoría) ---- */
export const search = ref('')
export const activeCategory = ref('all')

// Desplaza suavemente hasta el catálogo (usado por buscador y nav de categorías).
export function scrollToCatalog() {
  if (typeof document === 'undefined') return
  const el = document.getElementById('coleccion')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
