<script setup>
import { ref, computed } from 'vue'
import { locale, t } from '../i18n.js'
import { addToCart } from '../store.js'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

defineEmits(['select'])

function formatPrice(value) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

// % de descuento cuando hay precio anterior.
const discount = computed(() => {
  if (!props.product.oldPrice) return 0
  return Math.round((1 - props.product.price / props.product.oldPrice) * 100)
})

// Insignia principal mostrada sobre la foto (prioridad: oferta > nicho > nuevo > best).
const badge = computed(() => {
  const p = props.product
  if (p.oldPrice) return { key: 'sale', text: `-${discount.value}%`, variant: 'sale' }
  if (p.tag === 'niche') return { key: 'niche', text: t('tags.niche'), variant: 'niche' }
  if (p.isNew) return { key: 'new', text: t('tags.new'), variant: 'new' }
  if (p.isBest) return { key: 'best', text: t('tags.best'), variant: 'best' }
  return null
})

const added = ref(false)
let addedTimer = null

function onAdd() {
  addToCart(props.product)
  added.value = true
  if (addedTimer) clearTimeout(addedTimer)
  addedTimer = setTimeout(() => (added.value = false), 1400)
}
</script>

<template>
  <article class="card">
    <div
      class="card-media"
      :class="`card-media--${product.tone}`"
      role="button"
      tabindex="0"
      :aria-label="t('product.viewDetails')"
      @click="$emit('select', product)"
      @keydown.enter="$emit('select', product)"
      @keydown.space.prevent="$emit('select', product)"
    >
      <img
        :src="product.image"
        :alt="`${product.brand} ${product.name}`"
        class="card-photo"
        loading="lazy"
        decoding="async"
      />
      <span v-if="badge" class="card-badge" :class="`card-badge--${badge.variant}`">
        {{ badge.text }}
      </span>
      <span class="card-view">{{ t('product.viewDetails') }}</span>
    </div>

    <div class="card-body">
      <p class="card-brand">{{ product.brand }}</p>
      <h3 class="card-name" @click="$emit('select', product)">{{ product.name }}</h3>

      <div class="card-rating" :aria-label="`${product.rating} / 5`">
        <span class="stars" :style="{ '--fill': (product.rating / 5) * 100 + '%' }" aria-hidden="true">
          <span class="stars-bg">★★★★★</span>
          <span class="stars-fg">★★★★★</span>
        </span>
        <span class="card-reviews">({{ product.reviews }})</span>
      </div>

      <div class="card-foot">
        <div class="card-prices">
          <span class="card-price">{{ formatPrice(product.price) }}</span>
          <span v-if="product.oldPrice" class="card-oldprice">{{ formatPrice(product.oldPrice) }}</span>
        </div>
        <button
          type="button"
          class="add-btn"
          :class="{ 'is-added': added }"
          @click="onAdd"
        >
          <svg v-if="!added" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 6h15l-1.5 9h-12z" />
            <path d="M6 6L5 3H2" />
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="18" cy="20" r="1.4" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
          <span>{{ added ? t('product.added') : t('product.addToCart') }}</span>
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform var(--transition), border-color var(--transition),
    box-shadow var(--transition);
}

.card:hover {
  transform: translateY(-6px);
  border-color: var(--hover);
  box-shadow: var(--shadow);
}

.card-media {
  position: relative;
  aspect-ratio: 4 / 5;
  cursor: pointer;
  background-color: #090a0e;
  overflow: hidden;
}

/* Halo de color según el tono, superpuesto sobre la foto de fondo oscuro. */
.card-media::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: radial-gradient(circle at 50% 0%, rgba(184, 134, 59, 0.22), transparent 60%);
  mix-blend-mode: screen;
  pointer-events: none;
}

.card-media--cian::before {
  background: radial-gradient(circle at 50% 0%, rgba(63, 208, 224, 0.2), transparent 60%);
}
.card-media--titanio::before {
  background: radial-gradient(circle at 50% 0%, rgba(120, 124, 134, 0.18), transparent 60%);
}
.card-media--noir::before {
  background: radial-gradient(circle at 50% 0%, rgba(184, 134, 59, 0.12), transparent 60%);
}

.card-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.card:hover .card-photo {
  transform: scale(1.05);
}

.card-badge {
  position: absolute;
  z-index: 2;
  top: 12px;
  left: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 5px 11px;
  border-radius: 999px;
  color: #fff;
}

.card-badge--sale {
  background-color: #d64545;
}
.card-badge--new {
  background-color: var(--cian);
  color: #06232a;
}
.card-badge--best {
  background-color: var(--accent);
  color: var(--accent-contrast);
}
.card-badge--niche {
  background-color: #171921;
  border: 1px solid var(--bronce);
  color: var(--bronce-light);
}

.card-view {
  position: absolute;
  z-index: 2;
  left: 12px;
  right: 12px;
  bottom: 12px;
  text-align: center;
  padding: 8px 10px;
  border-radius: 999px;
  background-color: rgba(13, 14, 18, 0.78);
  color: #fff;
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity var(--transition), transform var(--transition);
}

.card-media:hover .card-view,
.card-media:focus-visible .card-view {
  opacity: 1;
  transform: translateY(0);
}

.card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 16px 16px 18px;
}

.card-brand {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--accent);
  margin: 0 0 5px;
}

.card-name {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 8px;
  cursor: pointer;
}

.card-name:hover {
  color: var(--hover);
}

/* Estrellas */
.card-rating {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 14px;
}

.stars {
  position: relative;
  display: inline-block;
  font-size: 0.9rem;
  line-height: 1;
  letter-spacing: 0.05em;
}

.stars-bg {
  color: var(--gunmetal);
}

.stars-fg {
  position: absolute;
  inset: 0;
  width: var(--fill, 0%);
  overflow: hidden;
  white-space: nowrap;
  color: var(--bronce-light);
}

.card-reviews {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
}

.card-prices {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.card-price {
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--text);
}

.card-oldprice {
  font-size: 0.82rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 15px;
  border-radius: 999px;
  border: 1px solid var(--accent);
  background-color: transparent;
  color: var(--accent);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color var(--transition), color var(--transition),
    border-color var(--transition), transform var(--transition);
}

.add-btn:hover {
  background-color: var(--accent);
  color: var(--accent-contrast);
  transform: translateY(-1px);
}

.add-btn.is-added {
  background-color: var(--cian);
  border-color: var(--cian);
  color: #06232a;
}

@media (max-width: 400px) {
  .add-btn span {
    display: none;
  }
  .add-btn {
    padding: 10px 12px;
  }
}
</style>
