<script setup>
// Grid de casas de perfumería (marcas del catálogo). Al pulsar una, se filtra
// el catálogo por esa casa vía el buscador compartido.
import { computed } from 'vue'
import { t } from '../i18n.js'
import { products } from '../data/products.js'
import { search, activeCategory, scrollToCatalog } from '../store.js'

const brands = computed(() =>
  Array.from(new Set(products.map((p) => p.brand))).sort((a, b) =>
    a.localeCompare(b)
  )
)

function pickBrand(brand) {
  activeCategory.value = 'all'
  search.value = brand
  scrollToCatalog()
}
</script>

<template>
  <section id="casas" class="section brands">
    <div class="container">
      <header class="row-head brands-head">
        <div>
          <span class="eyebrow">{{ t('brands.eyebrow') }}</span>
          <h2 class="row-title">{{ t('brands.title') }}</h2>
          <p class="row-sub">{{ t('brands.subtitle') }}</p>
        </div>
      </header>

      <div class="brand-grid">
        <button
          v-for="brand in brands"
          :key="brand"
          type="button"
          class="brand-tile"
          @click="pickBrand(brand)"
        >
          {{ brand }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.brands {
  background-color: var(--bg);
}

.brand-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
}

.brand-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 84px;
  padding: 16px 14px;
  text-align: center;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background-color: var(--bg-elevated);
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: color var(--transition), border-color var(--transition),
    background-color var(--transition), transform var(--transition);
}

.brand-tile:hover {
  color: var(--accent);
  border-color: var(--accent);
  transform: translateY(-3px);
}

@media (max-width: 900px) {
  .brand-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 560px) {
  .brand-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .brand-tile {
    min-height: 68px;
    font-size: 0.85rem;
  }
}
</style>
