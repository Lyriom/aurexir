<script setup>
// Vuelta de Stripe cancelando el pago: el carrito queda intacto.
import { useRouter } from 'vue-router'
import { t } from '../i18n.js'
import { openCart } from '../store.js'

const router = useRouter()

async function backToCart() {
  await router.push('/')
  openCart()
}
</script>

<template>
  <section class="section checkout-result">
    <div class="container checkout-wrap">
      <div class="checkout-card">
        <div class="checkout-icon checkout-icon--cancel" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </div>
        <h1 class="checkout-title">{{ t('checkoutPage.cancelTitle') }}</h1>
        <p class="checkout-text">{{ t('checkoutPage.cancelText') }}</p>
        <div class="checkout-actions">
          <button type="button" class="btn btn-primary" @click="backToCart">
            {{ t('checkoutPage.backToCart') }}
          </button>
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

.checkout-icon--cancel {
  color: var(--bronce-light);
  background-color: color-mix(in srgb, var(--bronce) 14%, transparent);
  border: 1px solid var(--bronce);
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
