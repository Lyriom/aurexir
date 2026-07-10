<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import LangSwitch from './LangSwitch.vue'
import { t } from '../i18n.js'
import { search, activeCategory, scrollToCatalog, openCart, cartCount } from '../store.js'

const scrolled = ref(false)
const menuOpen = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 8
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

// Navegación tipo tienda: cada enlace lleva a una sección.
const links = [
  { key: 'nav.home', href: '#inicio' },
  { key: 'nav.newArrivals', href: '#novedades' },
  { key: 'nav.bestSellers', href: '#best' },
  { key: 'nav.sale', href: '#ofertas' },
  { key: 'nav.catalog', href: '#coleccion' },
  { key: 'nav.brands', href: '#casas' },
]

function onSearchSubmit() {
  menuOpen.value = false
  scrollToCatalog()
}

// "Todas las fragancias": limpia el filtro de categoría antes de desplazar.
function onCatalogLink() {
  activeCategory.value = 'all'
  menuOpen.value = false
}

function clearSearch() {
  search.value = ''
}
</script>

<template>
  <header class="header" :class="{ 'is-scrolled': scrolled }">
    <div class="container header-inner">
      <a href="#inicio" class="brand" :aria-label="t('header.home')" @click="menuOpen = false">
        <img src="/logo-mark.svg" alt="" class="brand-logo" />
        <span class="brand-word gold-text">AUREXIR</span>
      </a>

      <form class="search" role="search" @submit.prevent="onSearchSubmit">
        <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          v-model="search"
          type="search"
          class="search-input"
          :placeholder="t('header.searchPlaceholder')"
          :aria-label="t('header.search')"
        />
        <button
          v-if="search"
          type="button"
          class="search-clear"
          :aria-label="t('catalog.clear')"
          @click="clearSearch"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </form>

      <div class="header-actions">
        <LangSwitch />

        <button
          class="icon-btn cart-btn"
          type="button"
          :aria-label="t('header.cart')"
          @click="openCart"
        >
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 6h15l-1.5 9h-12z" />
            <path d="M6 6L5 3H2" />
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="18" cy="20" r="1.4" />
          </svg>
          <Transition name="pop">
            <span v-if="cartCount" class="cart-count">{{ cartCount }}</span>
          </Transition>
        </button>

        <button
          class="icon-btn menu-toggle"
          type="button"
          :aria-label="t('header.menu')"
          @click="menuOpen = !menuOpen"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path v-if="!menuOpen" d="M3 6h18M3 12h18M3 18h18" />
            <path v-else d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Buscador en móvil (segunda fila) -->
    <form class="search search--mobile container" role="search" @submit.prevent="onSearchSubmit">
      <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        v-model="search"
        type="search"
        class="search-input"
        :placeholder="t('header.searchPlaceholder')"
        :aria-label="t('header.search')"
      />
    </form>

    <!-- Navegación de categorías -->
    <nav class="catnav" :class="{ open: menuOpen }" :aria-label="t('nav.catalog')">
      <div class="container catnav-inner">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="catnav-link"
          @click="link.href === '#coleccion' ? onCatalogLink() : (menuOpen = false)"
        >
          {{ t(link.key) }}
        </a>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: color-mix(in srgb, var(--bg) 90%, transparent);
  backdrop-filter: saturate(160%) blur(14px);
  border-bottom: 1px solid var(--border);
}

.header-inner {
  height: var(--header-h);
  display: flex;
  align-items: center;
  gap: 22px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
}

.brand-logo {
  height: 42px;
  width: auto;
}

.brand-word {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 500;
  letter-spacing: 0.3em;
  margin-right: -0.3em;
}

/* Buscador */
.search {
  position: relative;
  flex: 1 1 auto;
  max-width: 520px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 16px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 42px 0 44px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background-color: var(--bg-elevated);
  color: var(--text);
  font-family: inherit;
  font-size: 0.92rem;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
}

.search-clear {
  position: absolute;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--transition), background-color var(--transition);
}

.search-clear:hover {
  color: var(--text);
  background-color: var(--gunmetal);
}

.search--mobile {
  display: none;
  margin: 0 auto 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  flex: 0 0 auto;
}

.icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background-color: var(--bg-elevated);
  color: var(--text);
  cursor: pointer;
  transition: color var(--transition), border-color var(--transition),
    transform var(--transition);
}

.icon-btn:hover {
  color: var(--hover);
  border-color: var(--hover);
  transform: translateY(-1px);
}

.cart-count {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--gold-grad);
  color: var(--accent-contrast);
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1;
}

.pop-enter-active {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pop-enter-from {
  transform: scale(0);
}

.menu-toggle {
  display: none;
}

/* Navegación de categorías */
.catnav {
  border-top: 1px solid var(--border);
}

.catnav-inner {
  display: flex;
  gap: 30px;
  height: 46px;
  align-items: center;
}

.catnav-link {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  transition: color var(--transition);
}

.catnav-link:hover {
  color: var(--hover);
}

/* Responsive */
@media (max-width: 860px) {
  .header-inner > .search {
    display: none;
  }
  .search--mobile {
    display: flex;
  }
  .search--mobile .search-input {
    max-width: none;
  }
}

@media (max-width: 640px) {
  .header-inner {
    gap: 12px;
  }
  /* El isotipo basta como marca; libera espacio para carrito + menú. */
  .brand-word {
    display: none;
  }
  .menu-toggle {
    display: inline-flex;
  }
  .catnav {
    overflow: hidden;
    max-height: 0;
    border-top: none;
    transition: max-height var(--transition);
  }
  .catnav.open {
    max-height: 340px;
    border-top: 1px solid var(--border);
  }
  .catnav-inner {
    flex-direction: column;
    align-items: stretch;
    height: auto;
    gap: 0;
  }
  .catnav-link {
    padding: 14px 4px;
    border-bottom: 1px solid var(--border);
  }
}
</style>
