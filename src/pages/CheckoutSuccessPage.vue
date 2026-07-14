<script setup>
// Vuelta de Stripe con pago completado: vaciamos el carrito y celebramos.
// El pedido pasa a "paid" cuando el webhook de Stripe confirma el pago.
import { onMounted } from 'vue'
import { t } from '../i18n.js'
import { clearCart } from '../store.js'

onMounted(clearCart)
</script>

<template>
  <section class="section checkout-result">
    <div class="container checkout-wrap">
      <div class="checkout-card">
        <div class="checkout-icon checkout-icon--ok" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        </div>
        <h1 class="checkout-title">{{ t('checkoutPage.successTitle') }}</h1>
        <p class="checkout-text">{{ t('checkoutPage.successText') }}</p>
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

.checkout-icon--ok {
  color: var(--cian);
  background-color: color-mix(in srgb, var(--cian) 14%, transparent);
  border: 1px solid var(--cian);
}

.checkout-title {
  font-size: 1.6rem;
  font-weight: 600;
  margin: 0 0 10px;
}

.checkout-text {
  color: var(--text-secondary);
  margin: 0 0 26px;
  line-height: 1.55;
}

.checkout-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
