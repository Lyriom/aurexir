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
    nav: { home: 'Home', collection: 'Collection', essence: 'The house' },
    header: { buy: 'Shop', menu: 'Menu', home: 'AUREXIR — Home' },
    hero: {
      eyebrow: 'Parfum Homme · 2026 Collection',
      titleLead: 'The scent of those who',
      titleAccent: 'leave a mark',
      text: 'AUREXIR is a men’s perfumery: a hand-picked selection of designer and niche fragrances, from fresh daily signatures to bold night elixirs. Order in a tap by WhatsApp or Instagram.',
      ctaCollection: 'View collection',
      ctaEssence: 'The house',
      statFragrances: 'fragrances in the catalog',
      statHouses: 'designer & niche houses',
      statOrders: 'orders by DM',
    },
    catalog: {
      eyebrow: 'Collection',
      title: 'Selected fragrances',
      subtitle:
        'Twenty fragrances from designer and niche houses. Tap any of them to see its scent pyramid and order by Instagram or WhatsApp.',
    },
    filters: {
      all: 'All',
      multi: 'Versatile',
      daily: 'Everyday',
      night: 'Night / Winter',
      special: 'Special',
    },
    tags: { niche: 'Niche' },
    product: {
      top: 'Top',
      heart: 'Heart',
      base: 'Base',
      orderNote: 'You can order by Instagram or WhatsApp.',
      orderWa: 'Order on WhatsApp',
      orderIg: 'Order on Instagram',
      close: 'Close',
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
      text: 'Men’s perfumery: designer and niche fragrances, hand-picked. Order by WhatsApp or Instagram.',
      shopTitle: 'Shop',
      shopCollection: 'Collection',
      shopNew: 'New arrivals',
      shopBest: 'Best sellers',
      followTitle: 'Follow us',
      rights: 'All rights reserved.',
      soft: 'Parfum Homme · Online store coming soon',
    },
    lang: { label: 'Language' },
  },
  es: {
    nav: { home: 'Inicio', collection: 'Colección', essence: 'La casa' },
    header: { buy: 'Comprar', menu: 'Menú', home: 'AUREXIR — Inicio' },
    hero: {
      eyebrow: 'Parfum Homme · Colección 2026',
      titleLead: 'El aroma de quienes',
      titleAccent: 'dejan estela',
      text: 'AUREXIR es una perfumería masculina: una selección elegida a mano de fragancias de diseñador y nicho, desde frescos de diario hasta elixires de noche. Pide en un toque por WhatsApp o Instagram.',
      ctaCollection: 'Ver colección',
      ctaEssence: 'La casa',
      statFragrances: 'fragancias en catálogo',
      statHouses: 'casas de diseñador y nicho',
      statOrders: 'pedidos por DM',
    },
    catalog: {
      eyebrow: 'Colección',
      title: 'Fragancias seleccionadas',
      subtitle:
        'Veinte fragancias de casas de diseñador y nicho. Toca cualquiera para ver su pirámide olfativa y pedirla por Instagram o WhatsApp.',
    },
    filters: {
      all: 'Todas',
      multi: 'Multipropósito',
      daily: 'Uso diario',
      night: 'Nocturno / Invierno',
      special: 'Especiales',
    },
    tags: { niche: 'Nicho' },
    product: {
      top: 'Salida',
      heart: 'Corazón',
      base: 'Fondo',
      orderNote: 'Puedes pedir por Instagram o WhatsApp.',
      orderWa: 'Pedir por WhatsApp',
      orderIg: 'Pedir por Instagram',
      close: 'Cerrar',
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
      text: 'Perfumería masculina: fragancias de diseñador y nicho, elegidas a mano. Pide por WhatsApp o Instagram.',
      shopTitle: 'Tienda',
      shopCollection: 'Colección',
      shopNew: 'Novedades',
      shopBest: 'Best sellers',
      followTitle: 'Síguenos',
      rights: 'Todos los derechos reservados.',
      soft: 'Parfum Homme · Próximamente tienda online',
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
