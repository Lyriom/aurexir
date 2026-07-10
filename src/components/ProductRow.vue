<script setup>
// Fila de productos con desplazamiento horizontal (Novedades / Best sellers / Ofertas).
import { ref } from 'vue'
import ProductCard from './ProductCard.vue'
import { t } from '../i18n.js'

defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  items: { type: Array, required: true },
  viewAllHref: { type: String, default: '#coleccion' },
})

defineEmits(['select'])

const track = ref(null)

function scrollBy(dir) {
  const el = track.value
  if (!el) return
  el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 520), behavior: 'smooth' })
}
</script>

<template>
  <section :id="id" class="section row">
    <div class="container">
      <header class="row-head">
        <div>
          <h2 class="row-title">{{ title }}</h2>
          <p v-if="subtitle" class="row-sub">{{ subtitle }}</p>
        </div>
        <div class="row-tools">
          <a :href="viewAllHref" class="row-viewall">{{ t('sections.viewAll') }}</a>
          <div class="row-arrows">
            <button type="button" class="arrow" aria-label="◀" @click="scrollBy(-1)">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button type="button" class="arrow" aria-label="▶" @click="scrollBy(1)">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>
        </div>
      </header>

      <div ref="track" class="row-track">
        <ProductCard
          v-for="product in items"
          :key="product.id"
          :product="product"
          class="row-item"
          @select="$emit('select', $event)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.row {
  padding: 56px 0;
}

.row-tools {
  display: flex;
  align-items: center;
  gap: 16px;
}

.row-viewall {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--accent);
  transition: color var(--transition);
}

.row-viewall:hover {
  color: var(--hover);
}

.row-arrows {
  display: flex;
  gap: 8px;
}

.arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background-color: var(--bg-elevated);
  color: var(--text);
  cursor: pointer;
  transition: color var(--transition), border-color var(--transition);
}

.arrow:hover {
  color: var(--hover);
  border-color: var(--hover);
}

.row-track {
  display: grid;
  grid-auto-flow: column;
  /* Ancho de tarjeta fijo → las filas largas desplazan en horizontal
     (carrusel) en lugar de comprimir todas las tarjetas para que quepan. */
  grid-auto-columns: 80%;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 6px 4px 16px;
  margin: 0 -4px;
  scrollbar-width: thin;
  scrollbar-color: var(--gunmetal) transparent;
}

.row-track::-webkit-scrollbar {
  height: 8px;
}
.row-track::-webkit-scrollbar-thumb {
  background-color: var(--gunmetal);
  border-radius: 999px;
}

.row-item {
  scroll-snap-align: start;
}

@media (min-width: 560px) {
  /* Tablet: ~2-3 tarjetas visibles. */
  .row-track {
    grid-auto-columns: 300px;
  }
}

@media (min-width: 1000px) {
  /* Escritorio: ~4 tarjetas visibles, el resto se desplaza. */
  .row-track {
    grid-auto-columns: 270px;
  }
}

@media (max-width: 559px) {
  .row-arrows {
    display: none;
  }
}
</style>
