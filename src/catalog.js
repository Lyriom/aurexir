/*
 * Catálogo reactivo de la tienda.
 *
 * Fuente de verdad: GET /products del backend (incluye `stock` y precios
 * actualizados). Mientras carga —o si la API no responde— se usa el catálogo
 * local (src/data/products.js) como fallback, así la página nunca queda vacía.
 *
 * Mismo patrón singleton que store.js/i18n.js: el ref vive en el módulo y
 * todos los componentes comparten la misma lista.
 */
import { ref } from 'vue'
import { products as localProducts } from './data/products.js'
import { api } from './api.js'

export const products = ref(localProducts)

// 'local' | 'api' — útil para saber si el stock mostrado es real.
export const catalogSource = ref('local')
export const catalogLoading = ref(false)

let loadPromise = null

export function loadCatalog(force = false) {
  if (loadPromise && !force) return loadPromise
  catalogLoading.value = true
  loadPromise = api
    .listProducts()
    .then((list) => {
      if (Array.isArray(list) && list.length) {
        products.value = list
        catalogSource.value = 'api'
      }
    })
    .catch(() => {
      /* API caída o deshabilitada → seguimos con el catálogo local */
    })
    .finally(() => {
      catalogLoading.value = false
    })
  return loadPromise
}

export function findProduct(id) {
  return products.value.find((p) => p.id === id) || null
}

// Un producto está agotado solo si el back reporta stock numérico en 0.
export function isOutOfStock(product) {
  return typeof product?.stock === 'number' && product.stock <= 0
}
