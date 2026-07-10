<script setup>
// Barra superior de anuncios: rota entre mensajes (envío, autenticidad, pedido).
import { ref, onMounted, onUnmounted } from 'vue'
import { t } from '../i18n.js'

const keys = ['announce.shipping', 'announce.auth', 'announce.order']
const index = ref(0)
let timer = null

onMounted(() => {
  timer = window.setInterval(() => {
    index.value = (index.value + 1) % keys.length
  }, 4000)
})

onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <div class="announce" role="status" aria-live="polite">
    <div class="container announce-inner">
      <svg class="announce-spark" viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
        <path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2z" />
      </svg>
      <Transition name="announce-fade" mode="out-in">
        <span :key="index" class="announce-text">{{ t(keys[index]) }}</span>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.announce {
  background: var(--gold-grad);
  color: var(--accent-contrast);
}

.announce-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 34px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-align: center;
}

.announce-spark {
  flex: 0 0 auto;
  opacity: 0.85;
}

.announce-fade-enter-active,
.announce-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.announce-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.announce-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
