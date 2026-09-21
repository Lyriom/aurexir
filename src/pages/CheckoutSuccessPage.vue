<script setup>
// Vuelta de Stripe: el carrito se vacía solo después de verificar la Checkout
// Session en el backend. El navegador nunca se toma como prueba del pago.
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { t } from '../i18n.js'
import { clearCart } from '../store.js'
import { api } from '../api.js'

const route = useRoute()
const state = ref('checking')
const orderNumber = ref('')

const title = computed(() => t(`checkoutPage.${state.value}Title`))
const message = computed(() => t(`checkoutPage.${state.value}Text`))

onMounted(async () => {
  const sessionId = typeof route.query.session_id === 'string' ? route.query.session_id : ''
  if (!sessionId) {
    state.value = 'error'
    return
  }
  try {
    const result = await api.checkoutSessionStatus(sessionId)
    orderNumber.value = result.order_number || ''
    if (result.payment_status === 'paid') {
      clearCart()
      state.value = 'paid'
    } else {
      state.value = 'pending'
    }
  } catch {
    state.value = 'error'
  }
})
</script>

<template>
  <section class="section checkout-result">
    <div class="container checkout-wrap">
      <div class="checkout-card">
        <div class="checkout-icon" :class="`checkout-icon--${state}`" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path v-if="state === 'paid'" d="M4 12.5l5 5L20 6.5" />
            <path v-else-if="state === 'checking'" d="M12 3v4m0 10v4M3 12h4m10 0h4M5.6 5.6l2.8 2.8m7.2 7.2 2.8 2.8m0-12.8-2.8 2.8m-7.2 7.2-2.8 2.8" />
            <template v-else-if="state === 'pending'">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 7v5l3 2" />
            </template>
            <template v-else>
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v5m0 3h.01" />
            </template>
          </svg>
        </div>
        <h1 class="checkout-title">{{ title }}</h1>
        <p class="checkout-text">{{ message }}</p>
        <p v-if="orderNumber" class="checkout-order">{{ t('checkoutPage.orderLabel') }} <strong>{{ orderNumber }}</strong></p>
        <p v-if="state === 'paid'" class="checkout-email">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3.5 6.5l8.5 6 8.5-6" />
          </svg>
          {{ t('checkoutPage.emailNote') }}
        </p>
        <div class="checkout-actions">
          <router-link to="/account" class="btn btn-primary">
            {{ t('checkoutPage.viewOrders') }}
          </router-link>
          <router-link :to="{ path: '/', hash: '#coleccion' }" class="btn btn-ghost">
            {{ t('checkoutPage.keepShopping') }}
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.checkout-result {
  min-height: calc(100vh - var(--header-h) - 160px);
  display: flex;
  align-items: center;
}

.checkout-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
}

.checkout-card {
  width: min(520px, 100%);
  padding: 44px 36px;
  text-align: center;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}

.checkout-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  margin-bottom: 18px;
}

.checkout-icon--paid {
  color: var(--cian);
  background-color: color-mix(in srgb, var(--cian) 14%, transparent);
  border: 1px solid var(--cian);
}
.checkout-icon--checking,
.checkout-icon--pending {
  color: var(--bronce-light);
  background-color: color-mix(in srgb, var(--bronce) 14%, transparent);
  border: 1px solid var(--bronce);
}
.checkout-icon--error {
  color: #e07070;
  background: rgba(224, 112, 112, 0.1);
  border: 1px solid rgba(224, 112, 112, 0.6);
}

.checkout-title {
  font-size: 1.6rem;
  font-weight: 600;
  margin: 0 0 10px;
}

.checkout-text {
  color: var(--text-secondary);
  margin: 0 0 16px;
  line-height: 1.55;
}

.checkout-email {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 26px;
  padding: 9px 16px;
  border-radius: 999px;
  background-color: var(--bg-soft);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.85rem;
}
.checkout-order {
  margin: -4px 0 18px;
  color: var(--text-muted);
  font-size: 0.82rem;
}
.checkout-order strong {
  color: var(--bronce-light);
  letter-spacing: 0.04em;
}

.checkout-email svg {
  color: var(--accent);
  flex: 0 0 auto;
}

.checkout-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
