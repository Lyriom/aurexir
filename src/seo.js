/*
 * SEO en tiempo de ejecución: inyecta un ItemList de los perfumes del catálogo
 * como JSON-LD (schema.org/Product) en el <head>.
 *
 * Complementa los datos estructurados ESTÁTICOS de index.html (Organization /
 * Brand / OnlineStore), que son los que fijan la identidad de la marca. Aquí se
 * declara además CADA producto como un "Product" de categoría Perfume, con su
 * precio y AUREXIR como vendedor → refuerza ante Google y la IA que el sitio
 * vende perfumería masculina.
 *
 * Se ejecuta en el cliente (Google renderiza JS); no depende del backend: usa
 * el catálogo local, que es la fuente de datos del front.
 */
import { products } from './data/products.js'

const SITE = 'https://aurexir.com'

export function injectProductJsonLd() {
  if (typeof document === 'undefined' || !Array.isArray(products)) return
  // Evitar duplicados si se llama más de una vez (HMR, re-montaje).
  if (document.querySelector('script[data-seo="products"]')) return

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Catálogo AUREXIR — Perfumería masculina',
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        category: 'Perfume',
        image: p.image ? `${SITE}${p.image}` : undefined,
        description: p.desc?.es || p.desc?.en || undefined,
        brand: { '@type': 'Brand', name: p.brand || 'AUREXIR' },
        offers: {
          '@type': 'Offer',
          price: p.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: `${SITE}/`,
          seller: { '@type': 'Organization', name: 'AUREXIR', '@id': `${SITE}/#organization` },
        },
      },
    })),
  }

  const el = document.createElement('script')
  el.type = 'application/ld+json'
  el.dataset.seo = 'products'
  el.textContent = JSON.stringify(itemList)
  document.head.appendChild(el)
}
