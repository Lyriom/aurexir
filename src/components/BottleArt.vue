<script setup>
import { computed } from 'vue'

/*
 * Frasco ilustrado del perfume (no hay fotos: es una maqueta solo front).
 * Retoma la gema hexagonal del logo como silueta del frasco y tiñe el
 * "líquido" según el tono de cada fragancia, siempre dentro de la paleta.
 */
const props = defineProps({
  tone: {
    type: String,
    default: 'bronce', // bronce | cian | titanio | noir
  },
})

const TONES = {
  bronce: ['#e8c78a', '#7a5a25'],
  cian: ['#8fe8f2', '#1d7e8c'],
  titanio: ['#d8dce2', '#767c86'],
  noir: ['#4a4e59', '#0d0e12'],
}

const stops = computed(() => TONES[props.tone] || TONES.bronce)
// Ids de gradiente por tono: instancias del mismo tono comparten defs idénticas.
const liquidId = computed(() => `liquid-${props.tone}`)
</script>

<template>
  <svg viewBox="0 0 120 168" class="bottle" aria-hidden="true">
    <defs>
      <linearGradient id="bottle-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#eccd8f" />
        <stop offset="50%" stop-color="#b8863b" />
        <stop offset="100%" stop-color="#7a5a25" />
      </linearGradient>
      <linearGradient :id="liquidId" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" :stop-color="stops[0]" stop-opacity="0.85" />
        <stop offset="100%" :stop-color="stops[1]" />
      </linearGradient>
    </defs>

    <!-- Tapa gunmetal con anillo dorado -->
    <rect x="46" y="6" width="28" height="24" rx="4" fill="#2a2d34" />
    <rect x="46" y="6" width="28" height="6" rx="3" fill="#3a3e48" />
    <rect x="44" y="32" width="32" height="5" rx="2.5" fill="url(#bottle-gold)" />

    <!-- Cuello -->
    <rect x="52" y="37" width="16" height="9" fill="#15161b" stroke="#2a2d34" stroke-width="1" />

    <!-- Cuerpo: gema hexagonal alargada -->
    <polygon
      points="60,46 102,70 102,128 60,152 18,128 18,70"
      fill="#15161b"
      stroke="url(#bottle-gold)"
      stroke-width="1.5"
    />

    <!-- Líquido -->
    <polygon
      :points="'60,66 94,84 94,124 60,142 26,124 26,84'"
      :fill="`url(#${liquidId})`"
      opacity="0.92"
    />

    <!-- Facetas -->
    <line x1="60" y1="52" x2="60" y2="146" stroke="url(#bottle-gold)" stroke-width="0.5" opacity="0.3" />
    <line x1="30" y1="78" x2="90" y2="120" stroke="#eccd8f" stroke-width="0.5" opacity="0.18" />
    <line x1="90" y1="78" x2="30" y2="120" stroke="#eccd8f" stroke-width="0.5" opacity="0.18" />

    <!-- Brillo cian -->
    <path d="M 96 134 L 112 122" stroke="#3fd0e0" stroke-width="2" stroke-linecap="round" opacity="0.85" />
    <circle cx="60" cy="52" r="2.6" fill="#3fd0e0" />
  </svg>
</template>

<style scoped>
.bottle {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
