<script setup>
import { ref, computed } from 'vue'
import ProductCard from './ProductCard.vue'
import ProductRow from './ProductRow.vue'
import ProductModal from './ProductModal.vue'
import { products } from '../data/products.js'
import { t } from '../i18n.js'
import { search, activeCategory } from '../store.js'

/*
 * Núcleo del catálogo. Tres filas destacadas (Novedades / Best sellers /
 * Ofertas) + rejilla completa filtrable por categoría y buscador (estado
 * compartido en store.js). El modal de detalle se gestiona aquí.
 */
const newArrivals = computed(() => products.filter((p) => p.isNew))
const bestSellers = computed(() => products.filter((p) => p.isBest))
const onSale = computed(() => products.filter((p) => p.oldPrice))

const categories = computed(() => [
  'all',
  ...Array.from(new Set(products.map((p) => p.category))),
])

// Rejilla completa filtrada por categoría + texto de búsqueda.
const filteredProducts = computed(() => {
  const q = search.value.trim().toLowerCase()
  return products.filter((p) => {
    const inCat = activeCategory.value === 'all' || p.category === activeCategory.value
    if (!inCat) return false
    if (!q) return true
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
    )
  })
})

const resultLabel = computed(() =>
  filteredProducts.value.length === 1
    ? t('catalog.resultsOne')
    : t('catalog.resultsMany')
)

const selected = ref(null)

function clearSearch() {
  search.value = ''
  activeCategory.value = 'all'
}
</script>

<template>
  <div class="catalog-wrap">
    <!-- Filas destacadas -->
    <ProductRow
      v-if="newArrivals.length"
      id="novedades"
      :title="t('sections.newTitle')"
      :subtitle="t('sections.newSub')"
      :items="newArrivals"
      @select="selected = $event"
    />
    <ProductRow
      v-if="bestSellers.length"
      id="best"
      :title="t('sections.bestTitle')"
      :subtitle="t('sections.bestSub')"
      :items="bestSellers"
      @select="selected = $event"
    />
    <ProductRow
      v-if="onSale.length"
      id="ofertas"
      :title="t('sections.saleTitle')"
      :subtitle="t('sections.saleSub')"
      :items="onSale"
      view-all-href="#coleccion"
      @select="selected = $event"
    />

    <!-- Rejilla completa filtrable -->
    <section id="coleccion" class="section catalog">
      <div class="container">
        <header class="catalog-head">
          <div>
            <span class="eyebrow">{{ t('catalog.eyebrow') }}</span>
            <h2 class="row-title">{{ t('catalog.title') }}</h2>
          </div>
          <p class="catalog-sub">{{ t('catalog.subtitle') }}</p>
        </header>

        <div class="filters-row">
          <div class="filters" role="tablist" :aria-label="t('catalog.eyebrow')">
            <button
              v-for="cat in categories"
              :key="cat"
              class="filter"
              :class="{ active: activeCategory === cat }"
              type="button"
              @click="activeCategory = cat"
            >
              {{ t(`filters.${cat}`) }}
            </button>
          </div>
          <span class="results">
            {{ filteredProducts.length }} {{ resultLabel }}
          </span>
        </div>

        <div v-if="filteredProducts.length" class="grid">
          <ProductCard
            v-for="product in filteredProducts"
            :key="product.id"
            :product="product"
            @select="selected = product"
          />
        </div>

        <div v-else class="empty">
          <p>{{ t('catalog.empty') }}</p>
          <button type="button" class="btn btn-ghost" @click="clearSearch">
            {{ t('catalog.clear') }}
          </button>
        </div>
      </div>
    </section>

    <ProductModal :product="selected" @close="selected = null" />
  </div>
</template>

<style scoped>
.catalog {
  background-color: var(--bg-soft);
}

.catalog-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.catalog-sub {
  color: var(--text-muted);
  max-width: 400px;
  margin: 0;
}

.filters-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 34px;
  flex-wrap: wrap;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter {
  padding: 9px 18px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background-color: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: color var(--transition), border-color var(--transition),
    background-color var(--transition);
}

.filter:hover {
  color: var(--hover);
  border-color: var(--hover);
}

.filter.active {
  background-color: var(--accent);
  color: var(--accent-contrast);
  border-color: var(--accent);
}

.results {
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
}

.empty {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
}

.empty p {
  margin: 0 0 20px;
  font-size: 1.05rem;
}

@media (max-width: 1100px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 800px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 460px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
