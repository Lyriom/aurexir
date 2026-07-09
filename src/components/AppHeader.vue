<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import LangSwitch from './LangSwitch.vue'
import { t } from '../i18n.js'

const scrolled = ref(false)
const menuOpen = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 8
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const links = [
  { key: 'nav.home', href: '#inicio' },
  { key: 'nav.collection', href: '#coleccion' },
  { key: 'nav.essence', href: '#esencia' },
]
</script>

<template>
  <header class="header" :class="{ 'is-scrolled': scrolled }">
    <div class="container header-inner">
      <a href="#inicio" class="brand" :aria-label="t('header.home')">
        <img src="/logo-mark.svg" alt="" class="brand-logo" />
        <span class="brand-word gold-text">AUREXIR</span>
      </a>

      <nav class="nav" :class="{ open: menuOpen }">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="nav-link"
          @click="menuOpen = false"
        >
          {{ t(link.key) }}
        </a>
      </nav>

      <div class="header-actions">
        <LangSwitch />
        <a href="#coleccion" class="btn btn-primary header-cta">{{ t('header.buy') }}</a>

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
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: saturate(160%) blur(14px);
  border-bottom: 1px solid transparent;
  transition: border-color var(--transition), background-color var(--transition);
}

.header.is-scrolled {
  border-bottom-color: var(--border);
}

.header-inner {
  height: var(--header-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  height: 44px;
  width: auto;
}

.brand-word {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.32em;
  /* Compensa el tracking del último carácter */
  margin-right: -0.32em;
}

.nav {
  display: flex;
  gap: 30px;
  margin-left: auto;
}

.nav-link {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color var(--transition);
}

.nav-link:hover {
  color: var(--hover);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-cta {
  padding: 10px 22px;
  font-size: 0.88rem;
}

.icon-btn {
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

.menu-toggle {
  display: none;
}

/* Responsive */
@media (max-width: 760px) {
  .nav {
    position: absolute;
    top: var(--header-h);
    left: 0;
    right: 0;
    flex-direction: column;
    gap: 0;
    background-color: var(--bg-elevated);
    border-bottom: 1px solid var(--border);
    padding: 0;
    max-height: 0;
    overflow: hidden;
    transition: max-height var(--transition);
  }

  .nav.open {
    max-height: 280px;
  }

  .nav-link {
    padding: 16px 24px;
    border-top: 1px solid var(--border);
  }

  .menu-toggle {
    display: inline-flex;
  }

  .header-cta {
    display: none;
  }
}
</style>
