<script setup>
/*
 * Popup de bienvenida: 15% de descuento a cambio del email.
 *
 * Solo para visitantes SIN sesión (y con backend configurado). Se dispara a
 * los ~8s de entrar o al intento de salida (mouse hacia la barra del
 * navegador), lo que ocurra primero.
 *
 * Frecuencia (localStorage):
 *  - aurexir_promo_done → dejó su email: no volver a mostrar nunca.
 *  - aurexir_promo_seen → lo cerró: no volver a mostrar en 7 días.
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { t } from '../i18n.js'
import { auth } from '../auth.js'
import { API_BASE } from '../config.js'
import { cart } from '../store.js'
import { apiErrorMessage } from '../api.js'
import { subscribeWithDiscount } from '../newsletter.js'

const SEEN_KEY = 'aurexir_promo_seen'
const DONE_KEY = 'aurexir_promo_done'
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000 // 7 días
const SHOW_DELAY_MS = 8000

const route = useRoute()

const show = ref(false)
const email = ref('')
const sending = ref(false)
const error = ref('')
const resultKey = ref('') // 'sent' | 'resent' | 'pending' tras enviar

function storageGet(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* almacenamiento no disponible */
  }
}

function eligible() {
  if (!API_BASE) return false
  if (auth.user) return false // solo visitantes sin sesión
  if (storageGet(DONE_KEY)) return false
  const seen = Number(storageGet(SEEN_KEY) || 0)
  if (seen && Date.now() - seen < SNOOZE_MS) return false
  // No interrumpir login, checkout ni el panel; tampoco taparle el carrito.
  const path = route.path
  if (path.startsWith('/login') || path.startsWith('/checkout') || path.startsWith('/admin')) {
    return false
  }
  if (cart.open) return false
  return true
}

let timer = null
let fired = false

function maybeShow() {
  if (fired || show.value) return
  if (!eligible()) return
  fired = true
  show.value = true
}

// Exit intent: el cursor sale del documento por arriba (hacia cerrar/URL).
function onMouseOut(e) {
  if (!e.relatedTarget && e.clientY <= 0) maybeShow()
}

onMounted(() => {
  timer = setTimeout(maybeShow, SHOW_DELAY_MS)
  document.addEventListener('mouseout', onMouseOut)
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  document.removeEventListener('mouseout', onMouseOut)
})

function dismiss() {
  show.value = false
  // Si ya dejó el email, DONE manda; si no, snooze de 7 días.
  if (!resultKey.value) storageSet(SEEN_KEY, String(Date.now()))
}

async function onSubmit() {
  if (!email.value || sending.value) return
  error.value = ''
  sending.value = true
  try {
    resultKey.value = await subscribeWithDiscount(email.value)
    storageSet(DONE_KEY, '1')
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <Transition name="promo">
    <div v-if="show" class="promo-overlay" @click.self="dismiss">
      <div class="promo" role="dialog" aria-modal="true" :aria-label="t('promo.title')">
        <button class="promo-close" type="button" :aria-label="t('promo.close')" @click="dismiss">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <img src="/logo-mark.svg" alt="" class="promo-logo" />

        <!-- Resultado tras dejar el email -->
        <template v-if="resultKey">
          <p class="promo-percent gold-text">✦</p>
          <h2 class="promo-title">{{ t(`newsletter.${resultKey}`) }}</h2>
          <button type="button" class="btn btn-primary promo-ok" @click="dismiss">
            {{ t('promo.close') }}
          </button>
        </template>

        <!-- Oferta -->
        <template v-else>
          <span class="promo-eyebrow">{{ t('promo.eyebrow') }}</span>
          <p class="promo-percent gold-text">15%</p>
          <h2 class="promo-title">{{ t('promo.title') }}</h2>
          <p class="promo-text">{{ t('promo.text') }}</p>

          <form class="promo-form" @submit.prevent="onSubmit">
            <input
              v-model="email"
              type="email"
              required
              class="promo-input"
              :placeholder="t('promo.placeholder')"
              :aria-label="t('promo.placeholder')"
            />
            <button type="submit" class="btn btn-primary promo-submit" :disabled="sending">
              {{ sending ? t('promo.sending') : t('promo.button') }}
            </button>
          </form>

          <p v-if="error" class="promo-error">{{ error }}</p>
          <p class="promo-disclaimer">{{ t('promo.disclaimer') }}</p>
          <button type="button" class="promo-dismiss" @click="dismiss">
            {{ t('promo.dismiss') }}
          </button>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.promo-overlay {
  position: fixed;
  inset: 0;
  z-index: 130;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(5px);
}

.promo {
  position: relative;
  width: min(440px, 100%);
  padding: 42px 36px 30px;
  text-align: center;
  background:
    radial-gradient(circle at 50% -20%, color-mix(in srgb, var(--bronce) 20%, transparent), transparent 60%),
    var(--bg-elevated);
  border: 1px solid var(--bronce);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.65),
    0 0 0 1px color-mix(in srgb, var(--bronce) 25%, transparent);
}

.promo-close {
  position: absolute;
  top: 14px;
  right: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background-color: var(--bg);
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--transition), border-color var(--transition);
}

.promo-close:hover {
  color: var(--hover);
  border-color: var(--hover);
}

.promo-logo {
  height: 44px;
  margin: 0 auto 10px;
}

.promo-eyebrow {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.promo-percent {
  font-family: var(--font-display);
  font-size: 3.4rem;
  font-weight: 700;
  line-height: 1.1;
  margin: 0 0 4px;
}

.promo-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 10px;
}

.promo-text {
  color: var(--text-secondary);
  font-size: 0.92rem;
  line-height: 1.5;
  margin: 0 0 20px;
}

.promo-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.promo-input {
  height: 48px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background-color: var(--bg);
  color: var(--text);
  font-family: inherit;
  font-size: 0.92rem;
  text-align: center;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.promo-input::placeholder {
  color: var(--text-muted);
}

.promo-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
}

.promo-submit:disabled {
  opacity: 0.7;
  cursor: wait;
}

.promo-error {
  margin: 0 0 10px;
  font-size: 0.85rem;
  color: #e07070;
}

.promo-disclaimer {
  font-size: 0.74rem;
  color: var(--text-muted);
  margin: 0 0 14px;
}

.promo-dismiss {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.promo-dismiss:hover {
  color: var(--text-secondary);
}

.promo-ok {
  margin-top: 8px;
}

/* Transición */
.promo-enter-active,
.promo-leave-active {
  transition: opacity 0.25s ease;
}
.promo-enter-active .promo,
.promo-leave-active .promo {
  transition: transform 0.3s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.promo-enter-from,
.promo-leave-to {
  opacity: 0;
}
.promo-enter-from .promo,
.promo-leave-to .promo {
  transform: translateY(18px) scale(0.96);
}
</style>
