/*
 * i18n ligero (sin dependencias) para AUREXIR.
 * Idioma por defecto: inglés. El usuario puede cambiar a español con el
 * selector del header; la elección se guarda en localStorage.
 *
 * Uso en componentes:
 *   import { t, locale, setLocale } from '../i18n.js'
 *   {{ t('nav.collection') }}   // reactivo: al leer locale.value en t(),
 *                               // Vue vuelve a renderizar al cambiar idioma.
 */
import { ref } from 'vue'

const STORAGE_KEY = 'aurexir-locale'
export const SUPPORTED = ['en', 'es']
const DEFAULT_LOCALE = 'en'

function detectInitial() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved && SUPPORTED.includes(saved)) return saved
  } catch {
    /* localStorage no disponible */
  }
  return DEFAULT_LOCALE
}

export const locale = ref(detectInitial())

// Sincroniza el atributo lang del documento desde el arranque.
if (typeof document !== 'undefined') {
  document.documentElement.lang = locale.value
}

export function setLocale(next) {
  if (!SUPPORTED.includes(next)) return
  locale.value = next
  if (typeof document !== 'undefined') document.documentElement.lang = next
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* ignore */
  }
}

const messages = {
  en: {
    announce: {
      shipping: 'Free delivery in USA on orders over $120',
      auth: '100% authentic fragrances',
      order: 'Order by WhatsApp or Instagram',
    },
    nav: {
      home: 'Home',
      newArrivals: 'New arrivals',
      bestSellers: 'Best sellers',
      sale: 'On sale',
      catalog: 'All fragrances',
      brands: 'Houses',
    },
    header: {
      buy: 'Shop',
      menu: 'Menu',
      home: 'AUREXIR — Home',
      searchPlaceholder: 'Search a fragrance or house…',
      search: 'Search',
      cart: 'Cart',
      account: 'Account',
    },
    hero: {
      eyebrow: 'Parfum Homme · 2026 Collection',
      titleLead: 'The scent of those who',
      titleAccent: 'leave a mark',
      text: 'A hand-picked selection of designer and niche fragrances for men — from fresh daily signatures to bold night elixirs. Authentic, fairly priced, delivered fast.',
      ctaCollection: 'Shop the collection',
      ctaEssence: 'Best sellers',
      badge: 'New · Parfums de Marly Althaïr in stock',
      statFragrances: 'fragrances',
      statHouses: 'houses',
      statOrders: 'orders by DM',
    },
    sections: {
      newTitle: 'New arrivals',
      newSub: 'The latest additions to the catalog.',
      bestTitle: 'Best sellers',
      bestSub: 'The most-loved fragrances by AUREXIR customers.',
      saleTitle: 'On sale',
      saleSub: 'Selected fragrances at a special price.',
      viewAll: 'View all',
    },
    brands: {
      eyebrow: 'Houses',
      title: 'Top perfume houses',
      subtitle: 'Designer icons and niche gems, all in one place.',
    },
    catalog: {
      eyebrow: 'Collection',
      title: 'All fragrances',
      subtitle:
        'Tap any fragrance to see its scent pyramid, or add it straight to your cart.',
      resultsOne: 'result',
      resultsMany: 'results',
      empty: 'No fragrances match your search.',
      clear: 'Clear search',
    },
    filters: {
      all: 'All',
      multi: 'Versatile',
      daily: 'Everyday',
      night: 'Night / Winter',
      special: 'Special',
    },
    tags: { niche: 'Niche', new: 'New', best: 'Best seller', sale: 'Sale' },
    product: {
      top: 'Top',
      heart: 'Heart',
      base: 'Base',
      reviews: 'reviews',
      off: 'OFF',
      addToCart: 'Add to cart',
      added: 'Added',
      viewDetails: 'View details',
      orderNote: 'You can also order by Instagram or WhatsApp.',
      orderWa: 'Order on WhatsApp',
      orderIg: 'Order on Instagram',
      close: 'Close',
    },
    cart: {
      title: 'Your cart',
      empty: 'Your cart is empty',
      emptyHint: 'Add fragrances and check out in a tap.',
      browse: 'Browse fragrances',
      subtotal: 'Subtotal',
      note: 'Checkout is completed by WhatsApp — we confirm stock and delivery there.',
      checkout: 'Checkout on WhatsApp',
      clear: 'Empty cart',
      remove: 'Remove',
      itemOne: 'item',
      itemMany: 'items',
    },
    store: {
      eyebrow: 'Why AUREXIR',
      title: 'Authentic fragrances, honest prices',
      text: 'AUREXIR is a men’s perfumery built around one idea: the fragrances worth wearing, without the markup. Every bottle is 100% original, hand-picked from designer and niche houses, and priced fairly. Ask anything and order in a tap — we reply fast and deliver quickly.',
      f1Title: '100% authentic',
      f1Text: 'Original bottles only — never testers or imitations.',
      f2Title: 'Fast delivery',
      f2Text: 'Same-day in Quito, nationwide shipping across Ecuador.',
      f3Title: 'Order in a tap',
      f3Text: 'Buy by WhatsApp or Instagram with quick, real replies.',
      f4Title: 'Fair prices',
      f4Text: 'Designer and niche scents without the boutique markup.',
    },
    newsletter: {
      title: 'Get new arrivals & offers first',
      text: 'Join the list — new drops and private sales, no spam.',
      placeholder: 'Your email',
      button: 'Subscribe',
      done: 'Thanks! We’ll be in touch. ✦',
    },
    brand: {
      eyebrow: 'The house',
      title: 'Scent, curated',
      subtitle:
        'AUREXIR brings together the men’s fragrances worth wearing — designer icons and niche gems — for those who treat scent as part of who they are.',
      pillars: {
        p1Title: 'Curated selection',
        p1Text: 'Designer and niche houses chosen one by one: from everyday classics to bold statement scents.',
        p2Title: 'Honest prices',
        p2Text: 'Quality fragrances at fair prices, with new arrivals added to the catalog often.',
        p3Title: 'Order in a tap',
        p3Text: 'Ask and buy straight from WhatsApp or Instagram — quick replies, easy delivery.',
      },
    },
    footer: {
      text: 'Men’s perfumery: designer and niche fragrances, hand-picked. Authentic, fairly priced, delivered fast.',
      shopTitle: 'Shop',
      shopCollection: 'All fragrances',
      shopNew: 'New arrivals',
      shopBest: 'Best sellers',
      shopSale: 'On sale',
      helpTitle: 'Help',
      helpShipping: 'Shipping & delivery',
      helpAuth: 'Authenticity',
      helpContact: 'Contact us',
      helpOrder: 'How to order',
      followTitle: 'Follow us',
      contactTitle: 'Contact',
      rights: 'All rights reserved.',
      soft: 'Parfum Homme · Made in Ecuador',
      pay: 'Order by WhatsApp · Instagram · Cash / transfer',
    },
    lang: { label: 'Language' },
  },
  es: {
    announce: {
      shipping: 'Envío gratis en USA en pedidos desde $120',
      auth: 'Fragancias 100% originales',
      order: 'Pide por WhatsApp o Instagram',
    },
    nav: {
      home: 'Inicio',
      newArrivals: 'Novedades',
      bestSellers: 'Best sellers',
      sale: 'Ofertas',
      catalog: 'Todas las fragancias',
      brands: 'Casas',
    },
    header: {
      buy: 'Comprar',
      menu: 'Menú',
      home: 'AUREXIR — Inicio',
      searchPlaceholder: 'Busca una fragancia o casa…',
      search: 'Buscar',
      cart: 'Carrito',
      account: 'Cuenta',
    },
    hero: {
      eyebrow: 'Parfum Homme · Colección 2026',
      titleLead: 'El aroma de quienes',
      titleAccent: 'dejan estela',
      text: 'Una selección elegida a mano de fragancias de diseñador y nicho para hombre: desde frescos de diario hasta elixires de noche. Originales, a precio justo y con entrega rápida.',
      ctaCollection: 'Ver colección',
      ctaEssence: 'Best sellers',
      badge: 'Nuevo · Parfums de Marly Althaïr disponible',
      statFragrances: 'fragancias',
      statHouses: 'casas',
      statOrders: 'pedidos por DM',
    },
    sections: {
      newTitle: 'Novedades',
      newSub: 'Lo último que sumamos al catálogo.',
      bestTitle: 'Best sellers',
      bestSub: 'Las fragancias favoritas de los clientes de AUREXIR.',
      saleTitle: 'Ofertas',
      saleSub: 'Fragancias seleccionadas a precio especial.',
      viewAll: 'Ver todo',
    },
    brands: {
      eyebrow: 'Casas',
      title: 'Las mejores casas de perfumería',
      subtitle: 'Iconos de diseñador y joyas de nicho, en un solo lugar.',
    },
    catalog: {
      eyebrow: 'Colección',
      title: 'Todas las fragancias',
      subtitle:
        'Toca cualquier fragancia para ver su pirámide olfativa, o añádela directo al carrito.',
      resultsOne: 'resultado',
      resultsMany: 'resultados',
      empty: 'Ninguna fragancia coincide con tu búsqueda.',
      clear: 'Limpiar búsqueda',
    },
    filters: {
      all: 'Todas',
      multi: 'Multipropósito',
      daily: 'Uso diario',
      night: 'Nocturno / Invierno',
      special: 'Especiales',
    },
    tags: { niche: 'Nicho', new: 'Nuevo', best: 'Best seller', sale: 'Oferta' },
    product: {
      top: 'Salida',
      heart: 'Corazón',
      base: 'Fondo',
      reviews: 'reseñas',
      off: 'DTO',
      addToCart: 'Añadir al carrito',
      added: 'Añadido',
      viewDetails: 'Ver detalle',
      orderNote: 'También puedes pedir por Instagram o WhatsApp.',
      orderWa: 'Pedir por WhatsApp',
      orderIg: 'Pedir por Instagram',
      close: 'Cerrar',
    },
    cart: {
      title: 'Tu carrito',
      empty: 'Tu carrito está vacío',
      emptyHint: 'Añade fragancias y finaliza en un toque.',
      browse: 'Ver fragancias',
      subtotal: 'Subtotal',
      note: 'La compra se finaliza por WhatsApp: ahí confirmamos stock y entrega.',
      checkout: 'Finalizar por WhatsApp',
      clear: 'Vaciar carrito',
      remove: 'Quitar',
      itemOne: 'artículo',
      itemMany: 'artículos',
    },
    store: {
      eyebrow: 'Por qué AUREXIR',
      title: 'Fragancias originales, precios justos',
      text: 'AUREXIR es una perfumería masculina con una idea clara: las fragancias que vale la pena llevar, sin sobreprecio. Cada frasco es 100% original, elegido a mano entre casas de diseñador y nicho, a precio honesto. Pregunta lo que quieras y pide en un toque: respondemos rápido y entregamos pronto.',
      f1Title: '100% originales',
      f1Text: 'Solo frascos originales, nunca testers ni imitaciones.',
      f2Title: 'Entrega rápida',
      f2Text: 'El mismo día en Quito y envíos a todo el Ecuador.',
      f3Title: 'Pide en un toque',
      f3Text: 'Compra por WhatsApp o Instagram con respuestas reales y rápidas.',
      f4Title: 'Precios justos',
      f4Text: 'Diseñador y nicho sin el sobreprecio de boutique.',
    },
    newsletter: {
      title: 'Recibe novedades y ofertas primero',
      text: 'Únete a la lista: lanzamientos y ventas privadas, sin spam.',
      placeholder: 'Tu correo',
      button: 'Suscribirme',
      done: '¡Gracias! Te escribiremos pronto. ✦',
    },
    brand: {
      eyebrow: 'La casa',
      title: 'Perfumería, curada',
      subtitle:
        'AUREXIR reúne las fragancias masculinas que vale la pena llevar —iconos de diseñador y joyas de nicho— para quienes entienden el aroma como parte de su identidad.',
      pillars: {
        p1Title: 'Selección curada',
        p1Text: 'Casas de diseñador y nicho elegidas una a una: desde clásicos de diario hasta aromas que marcan.',
        p2Title: 'Precios justos',
        p2Text: 'Fragancias de calidad a precios honestos, con novedades que sumamos al catálogo a menudo.',
        p3Title: 'Pide en un toque',
        p3Text: 'Consulta y compra directo por WhatsApp o Instagram: respuestas rápidas y entrega fácil.',
      },
    },
    footer: {
      text: 'Perfumería masculina: fragancias de diseñador y nicho, elegidas a mano. Originales, a precio justo y con entrega rápida.',
      shopTitle: 'Tienda',
      shopCollection: 'Todas las fragancias',
      shopNew: 'Novedades',
      shopBest: 'Best sellers',
      shopSale: 'Ofertas',
      helpTitle: 'Ayuda',
      helpShipping: 'Envíos y entrega',
      helpAuth: 'Autenticidad',
      helpContact: 'Contáctanos',
      helpOrder: 'Cómo pedir',
      followTitle: 'Síguenos',
      contactTitle: 'Contacto',
      rights: 'Todos los derechos reservados.',
      soft: 'Parfum Homme · Hecho en Ecuador',
      pay: 'Pide por WhatsApp · Instagram · Efectivo / transferencia',
    },
    lang: { label: 'Idioma' },
  },
}

// Resuelve una clave con puntos ('hero.text') en el idioma activo.
export function t(key) {
  const dict = messages[locale.value] || messages.en
  const value = key.split('.').reduce((obj, k) => (obj == null ? obj : obj[k]), dict)
  return value == null ? key : value
}
