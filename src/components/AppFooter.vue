<script setup>
// Footer de tienda: newsletter + columnas + barra inferior. Textos vía i18n.
import { ref, computed } from 'vue'
import { t } from '../i18n.js'
import { INSTAGRAM_DM_URL } from '../config.js'
import { apiErrorMessage, ApiError } from '../api.js'
import { subscribeWithDiscount } from '../newsletter.js'

const year = new Date().getFullYear()
const email = ref('')
const resultKey = ref('') // 'sent' | 'resent' | 'pending' | 'done' (sin backend)
const sending = ref(false)
const error = ref('')

// Mismo flujo y mensajes que el popup de bienvenida (newsletter.js):
// el alta envía por email un código de descuento del 15% de un solo uso.
const doneMessage = computed(() =>
  resultKey.value ? t(`newsletter.${resultKey.value}`) : ''
)

async function onSubscribe() {
  if (!email.value || sending.value) return
  error.value = ''
  sending.value = true
  try {
    resultKey.value = await subscribeWithDiscount(email.value)
    email.value = ''
  } catch (e) {
    if (e instanceof ApiError && e.message === 'API_DISABLED') {
      // Modo solo catálogo: feedback visual sin promesa de código.
      resultKey.value = 'done'
      email.value = ''
    } else {
      error.value = apiErrorMessage(e)
    }
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <footer class="footer">
    <!-- Newsletter -->
    <div class="newsletter">
      <div class="container newsletter-inner">
        <div class="newsletter-copy">
          <h3 class="newsletter-title">{{ t('newsletter.title') }}</h3>
          <p class="newsletter-text">{{ t('newsletter.text') }}</p>
        </div>
        <form class="newsletter-form" @submit.prevent="onSubscribe">
          <input
            v-model="email"
            type="email"
            required
            class="newsletter-input"
            :placeholder="t('newsletter.placeholder')"
            :aria-label="t('newsletter.placeholder')"
          />
          <button type="submit" class="btn btn-primary" :disabled="sending">
            {{ t('newsletter.button') }}
          </button>
        </form>
        <p v-if="doneMessage && !error" class="newsletter-done">{{ doneMessage }}</p>
        <p v-if="error" class="newsletter-error">{{ error }}</p>
      </div>
    </div>

    <div class="container footer-inner">
      <div class="footer-brand">
        <div class="footer-logo">
          <img src="/logo-mark.svg" alt="AUREXIR" />
          <span class="footer-word gold-text">AUREXIR</span>
        </div>
        <p>{{ t('footer.text') }}</p>
      </div>

      <div class="footer-col">
        <h4>{{ t('footer.shopTitle') }}</h4>
        <router-link :to="{ path: '/', hash: '#coleccion' }">{{ t('footer.shopCollection') }}</router-link>
        <router-link :to="{ path: '/', hash: '#novedades' }">{{ t('footer.shopNew') }}</router-link>
        <router-link :to="{ path: '/', hash: '#best' }">{{ t('footer.shopBest') }}</router-link>
        <router-link :to="{ path: '/', hash: '#ofertas' }">{{ t('footer.shopSale') }}</router-link>
      </div>

      <div class="footer-col">
        <h4>{{ t('footer.helpTitle') }}</h4>
        <router-link :to="{ path: '/', hash: '#tienda' }">{{ t('footer.helpShipping') }}</router-link>
        <router-link :to="{ path: '/', hash: '#tienda' }">{{ t('footer.helpAuth') }}</router-link>
        <router-link :to="{ path: '/', hash: '#tienda' }">{{ t('footer.helpOrder') }}</router-link>
      </div>

      <div class="footer-col">
        <h4>{{ t('footer.contactTitle') }}</h4>
        <a
          :href="INSTAGRAM_DM_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-social"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <path d="M17.5 6.5h.01" />
          </svg>
          @lyriom__
        </a>
        <a
          href="https://wa.me/"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-social"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2z"/>
          </svg>
          WhatsApp
        </a>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="container footer-bottom-inner">
        <span>© {{ year }} AUREXIR. {{ t('footer.rights') }}</span>
        <span class="footer-pay">{{ t('footer.pay') }}</span>
        <span class="footer-soft">{{ t('footer.soft') }}</span>
      </div>
    </div>

    <div class="footer-credit">
      <div class="container">
        <span>Powered by GOZSYL LLC</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: var(--bg-elevated);
  border-top: 1px solid var(--border);
}

/* Newsletter */
.newsletter {
  border-bottom: 1px solid var(--border);
  background:
    radial-gradient(circle at 80% 0%, color-mix(in srgb, var(--bronce) 12%, transparent), transparent 55%);
}

.newsletter-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding: 40px 24px;
  flex-wrap: wrap;
}

.newsletter-title {
  font-size: 1.35rem;
  font-weight: 600;
  margin: 0 0 6px;
}

.newsletter-text {
  color: var(--text-muted);
  margin: 0;
  font-size: 0.94rem;
}

.newsletter-form {
  display: flex;
  gap: 10px;
  flex: 1 1 340px;
  max-width: 440px;
}

.newsletter-input {
  flex: 1;
  min-width: 0;
  height: 48px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background-color: var(--bg);
  color: var(--text);
  font-family: inherit;
  font-size: 0.92rem;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.newsletter-input::placeholder {
  color: var(--text-muted);
}

.newsletter-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
}

.newsletter-done {
  flex-basis: 100%;
  margin: 0;
  color: var(--cian);
  font-size: 0.9rem;
  font-weight: 600;
}

.newsletter-error {
  flex-basis: 100%;
  margin: 0;
  color: #e07070;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Columnas */
.footer-inner {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 40px;
  padding: 56px 24px 44px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.footer-logo img {
  height: 48px;
  width: auto;
}

.footer-word {
  font-family: var(--font-display);
  font-size: 1.12rem;
  font-weight: 500;
  letter-spacing: 0.3em;
  margin-right: -0.3em;
}

.footer-brand p {
  color: var(--text-muted);
  max-width: 320px;
  margin: 0;
  font-size: 0.92rem;
}

.footer-col h4 {
  font-size: 0.95rem;
  margin: 0 0 16px;
  color: var(--text-secondary);
}

.footer-col a {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 5px 0;
  transition: color var(--transition);
}

.footer-col a:hover {
  color: var(--hover);
}

.footer-bottom {
  border-top: 1px solid var(--border);
}

.footer-bottom-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  padding: 20px 24px;
  font-size: 0.82rem;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.footer-pay {
  color: var(--text-secondary);
}

.footer-soft {
  color: var(--accent);
}

.footer-credit {
  border-top: 1px solid var(--border);
  padding: 14px 24px;
  text-align: center;
  font-size: 0.78rem;
  color: var(--text-muted);
}

@media (max-width: 860px) {
  .footer-inner {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
  .newsletter-inner {
    justify-content: flex-start;
  }
}

@media (max-width: 460px) {
  .footer-inner {
    grid-template-columns: 1fr;
  }
  .footer-bottom-inner {
    justify-content: flex-start;
  }
  /* Newsletter apilado: input y botón a ancho completo en móvil angosto. */
  .newsletter-form {
    flex-wrap: wrap;
    max-width: none;
  }
  .newsletter-input {
    flex-basis: 100%;
  }
  .newsletter-form .btn {
    width: 100%;
  }
}
</style>
