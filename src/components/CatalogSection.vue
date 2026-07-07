<script setup>
import { ref, computed } from 'vue'
import ProductCard from './ProductCard.vue'
import ProductModal from './ProductModal.vue'
import { products } from '../data/products.js'

/*
 * Colección de AUREXIR. Maqueta solo front: los perfumes salen de
 * src/data/products.js. Los filtros se derivan de las líneas existentes.
 */
const lines = computed(() => [
  'Todas',
  ...Array.from(new Set(products.map((p) => p.line))),
])

const activeLine = ref('Todas')

const filteredProducts = computed(() =>
  activeLine.value === 'Todas'
    ? products
    : products.filter((p) => p.line === activeLine.value)
)

// Perfume seleccionado para el modal de detalle (null = cerrado).
const selected = ref(null)
</script>

<template>
  <section id="coleccion" class="section catalog">
    <div class="container">
      <header class="catalog-head">
        <div>
          <span class="eyebrow">Colección</span>
          <h2 class="catalog-title">Fragancias de autor</h2>
        </div>
        <p class="catalog-sub">
          Seis composiciones con carácter propio. Toca cualquier frasco para ver
          su pirámide olfativa y pedirla por Instagram o WhatsApp.
        </p>
      </header>

      <div class="filters" role="tablist" aria-label="Filtrar por línea">
        <button
          v-for="line in lines"
          :key="line"
          class="filter"
          :class="{ active: activeLine === line }"
          type="button"
          @click="activeLine = line"
        >
          {{ line }}
        </button>
      </div>

      <div class="grid">
        <ProductCard
          v-for="product in filteredProducts"
          :key="product.id"
          :product="product"
          @select="selected = product"
        />
      </div>
    </div>

    <ProductModal :product="selected" @close="selected = null" />
  </section>
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
  margin-bottom: 36px;
  flex-wrap: wrap;
}

.catalog-title {
  font-size: clamp(1.9rem, 4vw, 2.6rem);
  font-weight: 600;
}

.catalog-sub {
  color: var(--text-muted);
  max-width: 380px;
  margin: 0;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 40px;
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

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 1000px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
