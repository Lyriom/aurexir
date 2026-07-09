<script setup>
import { instagramLink, openInstagramOrder, whatsappLink } from '../config.js'
import { locale, t } from '../i18n.js'

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

// Datos para el mensaje de pedido desde la tarjeta (marca + nombre + precio).
const orderInfo = {
  name: `${props.product.brand} — ${props.product.name}`,
  price: props.product.price,
}
</script>

<template>
  <article
    class="card"
    role="button"
    tabindex="0"
    @click="$emit('select', product)"
    @keydown.enter="$emit('select', product)"
    @keydown.space.prevent="$emit('select', product)"
  >
    <div class="card-media" :class="`card-media--${product.tone}`">
      <img
        :src="product.image"
        :alt="`${product.brand} ${product.name}`"
        class="card-photo"
        loading="lazy"
        decoding="async"
      />
      <span v-if="product.tag" class="card-tag">{{ t(`tags.${product.tag}`) }}</span>
    </div>

    <div class="card-body">
      <p class="card-line">{{ product.brand }}</p>
      <h3 class="card-name">{{ product.name }}</h3>
      <p class="card-notes">{{ product.notes.base[locale] }}</p>
      <div class="card-footer">
        <span class="card-price">{{ formatPrice(product.price) }}</span>
        <div class="card-actions">
          <a
            :href="whatsappLink(orderInfo)"
            target="_blank"
            rel="noopener noreferrer"
            class="card-btn card-btn--wa"
            aria-label="Pedir por WhatsApp"
            @click.stop
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.15h-.01c-1.52 0-3.01-.41-4.31-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/>
            </svg>
          </a>
          <a
            :href="instagramLink()"
            target="_blank"
            rel="noopener noreferrer"
            class="card-btn card-btn--ig"
            aria-label="Pedir por Instagram"
            @click.stop.prevent="openInstagramOrder(orderInfo)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <path d="M17.5 6.5h.01" />
            </svg>
          </a>
        </div>
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
  cursor: pointer;
  transition: transform var(--transition), border-color var(--transition),
    box-shadow var(--transition);
}

.card:hover,
.card:focus-visible {
  transform: translateY(-6px);
  border-color: var(--hover);
  box-shadow: var(--shadow);
  outline: none;
}

.card-media {
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  /* Panel claro tipo estudio: la foto de producto (fondo blanco) se funde. */
  background: radial-gradient(circle at 50% 20%, #ffffff, #e7e9ed 82%);
  overflow: hidden;
}

/* Halo de color según el tono, sutil sobre el panel claro. */
.card-media::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 4%, rgba(184, 134, 59, 0.18), transparent 55%);
  pointer-events: none;
}

.card-media--cian::before {
  background: radial-gradient(circle at 50% 4%, rgba(63, 208, 224, 0.16), transparent 55%);
}

.card-media--titanio::before {
  background: radial-gradient(circle at 50% 4%, rgba(120, 124, 134, 0.14), transparent 55%);
}

.card-media--noir::before {
  background: radial-gradient(circle at 50% 4%, rgba(13, 14, 18, 0.12), transparent 55%);
}

.card-photo {
  position: relative;
  width: auto;
  max-width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 14px 22px rgba(0, 0, 0, 0.26));
  transition: transform var(--transition);
}

.card:hover .card-photo {
  transform: translateY(-4px) scale(1.03);
}

.card-tag {
  position: absolute;
  top: 14px;
  left: 14px;
  background-color: var(--accent);
  color: var(--accent-contrast);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 5px 12px;
  border-radius: 999px;
}

.card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 18px 18px 20px;
}

.card-line {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--accent);
  margin: 0 0 6px;
}

.card-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 6px;
}

.card-notes {
  font-size: 0.84rem;
  color: var(--text-muted);
  margin: 0 0 14px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: auto;
}

.card-price {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-secondary);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.card-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background-color: var(--bg);
  color: var(--text);
  cursor: pointer;
  transition: background-color var(--transition), color var(--transition),
    border-color var(--transition), transform var(--transition);
}

.card-btn--wa:hover {
  background-color: #25d366;
  color: #fff;
  border-color: #25d366;
  transform: scale(1.08);
}

.card-btn--ig:hover {
  background-color: #e1306c;
  color: #fff;
  border-color: #e1306c;
  transform: scale(1.08);
}
</style>
