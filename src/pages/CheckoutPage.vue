<script setup>
/*
 * Checkout alojado por Stripe (requiere sesión).
 *
 * Flujo: el cliente ve el resumen, elige envío, opcionalmente aplica un código,
 * y paga en Stripe Checkout. Stripe recopila de forma segura el teléfono,
 * la dirección de envío y los datos de pago.
 *
 * El importe autoritativo lo calcula el backend al crear la Checkout Session
 * (POST /checkout/session); aquí solo se muestra un estimado. Tras el pago, el
 * webhook firmado confirma el pedido y envía el recibo + factura PDF.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { t, locale } from '../i18n.js'
import {
  cart,
  cartTotal,
  cartCount,
  discount,
  discountAmount,
  applyDiscount,
  removeDiscount,
  shippingMethod,
  setShippingMethod,
  formatPrice,
  closeCart,
} from '../store.js'
import { api, cartToPayload, apiErrorMessage, ApiError } from '../api.js'
import { API_BASE } from '../config.js'

const router = useRouter()
const apiEnabled = Boolean(API_BASE)
const SHIPPING_RATES = { standard: 20, eco: 30 }
const freeShipping = computed(() => cartTotal.value >= 200)

function shippingPrice(rate) {
  return freeShipping.value ? t('cart.shippingFree') : formatPrice(rate)
}

/* ---- Cotización de envío ---- */
const quote = ref(null)
const quoteLoading = ref(false)
const quoteError = ref('')

async function requestQuote() {
  if (!apiEnabled || !cart.items.length) {
    quote.value = null
    return
  }
  quoteError.value = ''
  quoteLoading.value = true
  try {
    quote.value = await api.quoteShipping({
      items: cartToPayload(cart.items),
      method: shippingMethod.value,
    })
  } catch (e) {
    quote.value = null
    quoteError.value = apiErrorMessage(e)
  } finally {
    quoteLoading.value = false
  }
}

let quoteTimer = null
function scheduleQuote() {
  if (quoteTimer) clearTimeout(quoteTimer)
  quoteTimer = setTimeout(requestQuote, 200)
}

function chooseMethod(m) {
  setShippingMethod(m)
}

watch([shippingMethod, cartTotal], () => scheduleQuote())

/* ---- Código de descuento ---- */
const codeInput = ref('')
const codeApplying = ref(false)
const codeError = ref('')

async function applyCode() {
  const code = codeInput.value.trim()
  if (!code || codeApplying.value) return
  codeError.value = ''
  codeApplying.value = true
  try {
    const res = await api.validateDiscount(code)
    if (res && res.valid) {
      applyDiscount(res.code || code, Number(res.percent))
      codeInput.value = ''
    } else {
      codeError.value = t('cart.codeInvalid')
    }
  } catch (e) {
    codeError.value = apiErrorMessage(e)
  } finally {
    codeApplying.value = false
  }
}

/* ---- Totales (estimado; el backend recalcula al cobrar) ---- */
const shippingCost = computed(() => (quote.value ? Number(quote.value.shipping) : null))
const total = computed(() => {
  if (!quote.value) return null
  return Math.round((Number(quote.value.total_estimate) - discountAmount.value) * 100) / 100
})

/* ---- Pago ---- */
const paying = ref(false)
const payError = ref('')

async function pay() {
  payError.value = ''
  if (!cart.items.length) return
  paying.value = true
  try {
    const res = await api.createCheckoutSession({
      items: cartToPayload(cart.items),
      shipping_method: shippingMethod.value,
      discount_code: discount.value?.code || null,
      locale: locale.value,
    })
    if (!res?.checkout_url) throw new Error('missing-checkout-url')
    window.location.assign(res.checkout_url)
  } catch (e) {
    paying.value = false
    if (e instanceof ApiError && (e.message === 'SESSION_EXPIRED' || e.message === 'NOT_AUTHENTICATED')) {
      router.push({ path: '/login', query: { next: '/checkout' } })
      return
    }
    // Código inválido/ya usado al cobrar → desaplicar y avisar.
    if (
      e instanceof ApiError &&
      e.status === 409 &&
      discount.value &&
      typeof e.detail === 'string' &&
      /c[oó]digo|descuento|discount/i.test(e.detail)
    ) {
      removeDiscount()
    }
    payError.value = apiErrorMessage(e)
    paying.value = false
  }
}

onMounted(() => {
  closeCart()
  if (apiEnabled) scheduleQuote()
  else quoteError.value = t('checkout.apiNotConfigured')
})

onBeforeUnmount(() => {
  if (quoteTimer) clearTimeout(quoteTimer)
})
</script>

<template>
  <section class="section checkout">
    <div class="container">
      <header class="checkout-head">
        <router-link to="/" class="checkout-back">
          <span aria-hidden="true">←</span> {{ t('checkout.back') }}
        </router-link>
        <div class="checkout-heading">
          <div>
            <span class="checkout-eyebrow">{{ t('checkout.eyebrow') }}</span>
            <h1 class="checkout-h1">{{ t('checkout.title') }}</h1>
            <p class="checkout-lead">{{ t('checkout.subtitle') }}</p>
          </div>
          <div class="checkout-security" aria-label="Stripe Checkout">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <path d="M12 3 5 6v5c0 4.8 2.9 8.1 7 10 4.1-1.9 7-5.2 7-10V6l-7-3Z" />
              <path d="m9.2 12 1.8 1.8 3.9-4" />
            </svg>
            <span>{{ t('checkout.secureCheckout') }}</span>
          </div>
        </div>
        <ol class="checkout-steps" :aria-label="t('checkout.stepsLabel')">
          <li class="is-current"><span>1</span>{{ t('checkout.stepReview') }}</li>
          <li><span>2</span>{{ t('checkout.stepStripe') }}</li>
          <li><span>3</span>{{ t('checkout.stepDone') }}</li>
        </ol>
      </header>

      <!-- Carrito vacío -->
      <div v-if="!cart.items.length" class="checkout-empty">
        <p>{{ t('cart.empty') }}</p>
        <router-link :to="{ path: '/', hash: '#coleccion' }" class="btn btn-primary">
          {{ t('cart.browse') }}
        </router-link>
      </div>

      <form v-else class="checkout-grid" @submit.prevent="pay">
        <!-- Columna izquierda: envío + transición a Stripe -->
        <div class="checkout-main">
          <!-- Método de envío -->
          <section class="co-card co-section-card">
            <div class="co-section-head">
              <span class="co-section-index">01</span>
              <div>
                <h2 class="co-h2">{{ t('cart.shippingMethod') }}</h2>
                <p>{{ t('checkout.shippingHint') }}</p>
              </div>
            </div>
            <div class="co-methods" role="radiogroup">
              <button
                type="button"
                class="co-method"
                :class="{ active: shippingMethod === 'standard' }"
                role="radio"
                :aria-checked="shippingMethod === 'standard'"
                @click="chooseMethod('standard')"
              >
                <span class="co-radio" aria-hidden="true"></span>
                <span class="co-method-top">
                  <span>{{ t('cart.methodStandard') }}</span>
                  <span class="co-method-price" :class="{ 'is-free': freeShipping }">{{ shippingPrice(SHIPPING_RATES.standard) }}</span>
                </span>
                <span class="co-method-sub">{{ t('cart.standardSub') }}</span>
              </button>
              <button
                type="button"
                class="co-method co-method--eco"
                :class="{ active: shippingMethod === 'eco' }"
                role="radio"
                :aria-checked="shippingMethod === 'eco'"
                @click="chooseMethod('eco')"
              >
                <span class="co-radio" aria-hidden="true"></span>
                <span class="co-method-top">
                  <span><span aria-hidden="true">🌿</span> {{ t('cart.methodEco') }}</span>
                  <span class="co-method-price" :class="{ 'is-free': freeShipping }">{{ shippingPrice(SHIPPING_RATES.eco) }}</span>
                </span>
                <span class="co-method-sub">{{ t('cart.ecoSub') }}</span>
              </button>
            </div>
            <p v-if="quoteError" class="co-error co-alert" role="alert">{{ quoteError }}</p>
          </section>

          <!-- Pago con tarjeta -->
          <section class="co-card co-section-card co-payment-card">
            <div class="co-section-head">
              <span class="co-section-index">02</span>
              <div>
                <h2 class="co-h2">{{ t('checkout.payment') }}</h2>
                <p>{{ t('checkout.stripeRedirect') }}</p>
              </div>
            </div>
            <div class="co-stripe-panel">
              <div class="co-stripe-mark" aria-hidden="true">S</div>
              <div>
                <strong>Stripe Checkout</strong>
                <span>{{ t('checkout.stripeDetails') }}</span>
              </div>
              <svg class="co-stripe-arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
            <div class="co-trust-row">
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                {{ t('checkout.encrypted') }}
              </span>
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3z"/><path d="m3 8 9 6 9-6"/></svg>
                {{ t('checkout.receiptIncluded') }}
              </span>
            </div>
          </section>
        </div>

        <!-- Columna derecha: resumen -->
        <aside class="checkout-summary">
          <div class="co-card co-summary">
            <div class="co-summary-head">
              <div>
                <span class="co-summary-kicker">{{ t('checkout.yourPurchase') }}</span>
                <h2 class="co-h2">{{ t('checkout.orderSummary') }}</h2>
              </div>
              <span class="co-count">{{ cartCount }}</span>
            </div>
            <ul class="co-items">
              <li v-for="item in cart.items" :key="item.id" class="co-item">
                <div class="co-thumb">
                  <img :src="item.image" :alt="item.name" loading="lazy" />
                  <span class="co-qty">{{ item.qty }}</span>
                </div>
                <div class="co-item-info">
                  <p class="co-item-brand">{{ item.brand }}</p>
                  <p class="co-item-name">{{ item.name }}</p>
                </div>
                <span class="co-item-total">{{ formatPrice(item.price * item.qty) }}</span>
              </li>
            </ul>

            <!-- Descuento -->
            <div v-if="discount" class="co-line co-discount">
              <span>
                {{ t('cart.discountLabel') }} ({{ discount.code }})
                <button type="button" class="co-code-remove" :aria-label="t('cart.codeRemove')" @click="removeDiscount">×</button>
              </span>
              <span>−{{ formatPrice(discountAmount) }}</span>
            </div>
            <div v-else class="co-code-wrap">
              <label for="checkout-code">{{ t('cart.codeTitle') }}</label>
              <div class="co-code">
                <input
                  id="checkout-code"
                  v-model="codeInput"
                  type="text"
                  autocomplete="off"
                  spellcheck="false"
                  :placeholder="t('cart.codePlaceholder')"
                  :aria-label="t('cart.codeTitle')"
                  @keydown.enter.prevent="applyCode"
                />
                <button type="button" :disabled="codeApplying || !codeInput.trim()" @click="applyCode">
                  {{ codeApplying ? '…' : t('cart.codeApply') }}
                </button>
              </div>
            </div>
            <p v-if="codeError" class="co-error">{{ codeError }}</p>

            <div class="co-line">
              <span>{{ t('cart.subtotal') }}</span>
              <span>{{ formatPrice(cartTotal) }}</span>
            </div>
            <div class="co-line">
              <span>{{ t('cart.shipping') }}</span>
              <span v-if="shippingCost != null" :class="{ 'co-free': shippingCost === 0 }">
                {{ shippingCost === 0 ? t('cart.shippingFree') : formatPrice(shippingCost) }}
              </span>
              <span v-else>{{ quoteLoading ? '…' : '—' }}</span>
            </div>
            <div class="co-line co-total">
              <span>{{ t('cart.estTotal') }}</span>
              <span>{{ total != null ? formatPrice(total) : '—' }}</span>
            </div>

            <p v-if="payError" class="co-error co-error--pay co-alert" role="alert">{{ payError }}</p>

            <button
              type="submit"
              class="co-pay"
              :disabled="paying || quoteLoading || total == null"
              :aria-busy="paying"
            >
              <span v-if="paying" class="co-spinner" aria-hidden="true"></span>
              <span>{{ paying ? t('checkout.processing') : t('checkout.payNow') }}</span>
              <span v-if="!paying && total != null" class="co-pay-total">{{ formatPrice(total) }}</span>
              <svg v-if="!paying" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <div class="co-summary-foot">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M12 3 5 6v5c0 4.8 2.9 8.1 7 10 4.1-1.9 7-5.2 7-10V6l-7-3Z" />
              </svg>
              <p class="co-invoice-note">{{ t('checkout.invoiceNote') }}</p>
            </div>
          </div>
        </aside>
      </form>
    </div>
  </section>
</template>

<style scoped>
.checkout {
  position: relative;
  min-height: calc(100vh - var(--header-h));
  overflow: hidden;
  padding-top: 52px;
  background:
    radial-gradient(circle at 9% 7%, rgba(184, 134, 59, 0.11), transparent 29rem),
    radial-gradient(circle at 95% 36%, rgba(63, 208, 224, 0.055), transparent 24rem);
}
.checkout::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.25;
  background-image: linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(to bottom, #000, transparent 72%);
}
.checkout > .container {
  position: relative;
  z-index: 1;
}
.checkout-head {
  margin-bottom: 34px;
}
.checkout-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  transition: color var(--transition), transform var(--transition);
}
.checkout-back:hover {
  color: var(--hover);
  transform: translateX(-3px);
}
.checkout-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}
.checkout-eyebrow,
.co-summary-kicker {
  display: block;
  margin-bottom: 8px;
  color: var(--accent);
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.checkout-h1 {
  font-size: clamp(2rem, 5vw, 3.35rem);
  font-weight: 300;
  letter-spacing: -0.035em;
}
.checkout-lead {
  max-width: 580px;
  margin: 10px 0 0;
  color: var(--text-muted);
  font-size: 0.93rem;
}
.checkout-security {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  flex: 0 0 auto;
  margin-bottom: 7px;
  padding: 10px 14px;
  border: 1px solid rgba(63, 208, 224, 0.22);
  border-radius: 999px;
  background: rgba(63, 208, 224, 0.055);
  color: #91e4ed;
  font-size: 0.76rem;
  letter-spacing: 0.035em;
}
.checkout-steps {
  display: flex;
  align-items: center;
  gap: 0;
  max-width: 570px;
  margin: 30px 0 0;
  padding: 0;
  list-style: none;
}
.checkout-steps li {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  color: #656a74;
  font-size: 0.72rem;
  letter-spacing: 0.035em;
  white-space: nowrap;
}
.checkout-steps li:not(:last-child)::after {
  content: '';
  position: absolute;
  z-index: -1;
  left: 30px;
  right: 9px;
  top: 12px;
  height: 1px;
  background: var(--border);
}
.checkout-steps span {
  display: grid;
  place-items: center;
  width: 25px;
  height: 25px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg);
  font-size: 0.68rem;
  font-weight: 700;
}
.checkout-steps .is-current {
  color: var(--bronce-light);
}
.checkout-steps .is-current span {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 15%, var(--bg));
  box-shadow: 0 0 0 4px rgba(184, 134, 59, 0.07);
}
.checkout-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 60px 20px;
  color: var(--text-muted);
}
.checkout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 410px;
  gap: 28px;
  align-items: start;
}
.checkout-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.co-card {
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(25, 27, 35, 0.96), rgba(16, 18, 24, 0.96));
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.25);
}
.co-section-card {
  padding: 26px;
}
.co-section-head {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 20px;
}
.co-section-head p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}
.co-section-index {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(184, 134, 59, 0.3);
  border-radius: 11px;
  background: rgba(184, 134, 59, 0.08);
  color: var(--bronce-light);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.co-h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.06rem;
  font-weight: 600;
  margin: 0;
}
.co-count {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: var(--bronce-light);
  background: rgba(184, 134, 59, 0.11);
  border: 1px solid rgba(184, 134, 59, 0.25);
  border-radius: 50%;
  font-size: 0.76rem;
  font-weight: 700;
}
.co-methods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.co-method {
  position: relative;
  display: grid;
  grid-template-columns: 19px 1fr;
  column-gap: 11px;
  row-gap: 3px;
  min-height: 92px;
  padding: 16px;
  overflow: hidden;
  text-align: left;
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 16px;
  background: rgba(8, 9, 13, 0.46);
  color: var(--text-secondary);
  font: inherit;
  cursor: pointer;
  transition: border-color var(--transition), background var(--transition), transform var(--transition), box-shadow var(--transition);
}
.co-method:hover {
  transform: translateY(-2px);
  border-color: rgba(184, 134, 59, 0.38);
}
.co-method.active {
  border-color: rgba(184, 134, 59, 0.75);
  background: linear-gradient(145deg, rgba(184, 134, 59, 0.14), rgba(184, 134, 59, 0.035));
  box-shadow: inset 0 0 0 1px rgba(184, 134, 59, 0.08), 0 12px 30px rgba(0,0,0,.18);
  color: var(--text);
}
.co-method--eco.active {
  border-color: rgba(76, 175, 110, 0.72);
  background: linear-gradient(145deg, rgba(76, 175, 110, 0.13), rgba(76, 175, 110, 0.025));
}
.co-radio {
  display: block;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  border: 1px solid #555b65;
  border-radius: 50%;
  box-shadow: inset 0 0 0 4px transparent;
}
.co-method.active .co-radio {
  border-color: var(--bronce-light);
  background: var(--bronce-light);
  box-shadow: inset 0 0 0 4px #1a1713;
}
.co-method--eco.active .co-radio {
  border-color: #76d092;
  background: #76d092;
}
.co-method-top {
  display: flex;
  grid-column: 2;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}
.co-method-price {
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
}
.co-method-price.is-free {
  color: #70d98f;
}
.co-method-sub {
  grid-column: 2;
  font-size: 0.72rem;
  color: var(--text-muted);
}
.co-stripe-panel {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid rgba(99, 91, 255, 0.3);
  border-radius: 16px;
  background: linear-gradient(105deg, rgba(99, 91, 255, 0.12), rgba(99, 91, 255, 0.025));
}
.co-stripe-mark {
  display: grid;
  place-items: center;
  width: 39px;
  height: 39px;
  border-radius: 11px;
  background: #635bff;
  color: white;
  font-size: 1.2rem;
  font-weight: 800;
  font-style: italic;
}
.co-stripe-panel strong,
.co-stripe-panel span {
  display: block;
}
.co-stripe-panel strong {
  font-size: 0.88rem;
}
.co-stripe-panel span {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 0.72rem;
}
.co-stripe-arrow {
  margin-left: auto;
  color: #948fff;
}
.co-trust-row {
  display: flex;
  gap: 20px;
  margin: 15px 2px 0;
}
.co-trust-row span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-muted);
  font-size: 0.72rem;
}
.co-trust-row svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.7;
}
/* Resumen */
.checkout-summary {
  position: sticky;
  top: calc(var(--header-h) + 20px);
}
.co-summary {
  padding: 25px;
  border-color: rgba(184, 134, 59, 0.18);
  box-shadow: 0 28px 80px rgba(0,0,0,.36);
}
.co-summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.co-summary-kicker {
  margin-bottom: 5px;
}
.co-items {
  list-style: none;
  margin: 0 0 18px;
  padding: 0 0 18px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 260px;
  overflow-y: auto;
  border-bottom: 1px solid rgba(255,255,255,.075);
}
.co-item {
  display: flex;
  align-items: center;
  gap: 11px;
}
.co-thumb {
  position: relative;
  flex: 0 0 auto;
  width: 57px;
  height: 57px;
  border-radius: 13px;
  border: 1px solid var(--border);
  background-color: #090a0e;
}
.co-thumb img {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: cover;
}
.co-qty {
  position: absolute;
  top: -7px;
  right: -7px;
  display: grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border: 2px solid #161820;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: 0.65rem;
  font-weight: 800;
}
.co-item-info {
  flex: 1;
  min-width: 0;
}
.co-item-brand {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  margin: 0;
}
.co-item-name {
  font-size: 0.84rem;
  font-weight: 600;
  margin: 2px 0 0;
}
.co-item-total {
  font-size: 0.84rem;
  font-weight: 700;
}
.co-code-wrap {
  margin: 0 0 14px;
}
.co-code-wrap > label {
  display: block;
  margin: 0 0 7px 2px;
  color: var(--text-muted);
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.co-code {
  display: flex;
  gap: 8px;
  margin: 0;
}
.co-code input {
  flex: 1;
  min-width: 0;
  height: 43px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background-color: rgba(8,9,13,.65);
  color: var(--text);
  font-family: inherit;
  font-size: 0.84rem;
  text-transform: uppercase;
}
.co-code input::placeholder {
  text-transform: none;
  color: var(--text-muted);
}
.co-code button {
  padding: 0 15px;
  border-radius: 12px;
  border: 1px solid rgba(184, 134, 59, 0.35);
  background: rgba(184, 134, 59, 0.08);
  color: var(--bronce-light);
  font-family: inherit;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
}
.co-code button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.co-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 10px 0;
  font-size: 0.84rem;
  color: var(--text-secondary);
}
.co-discount {
  color: var(--cian);
  font-weight: 600;
}
.co-code-remove {
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}
.co-code-remove:hover {
  color: #d64545;
}
.co-free {
  color: var(--cian);
  font-weight: 700;
}
.co-total {
  margin-top: 16px;
  padding-top: 17px;
  border-top: 1px solid var(--border);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}
.co-error {
  font-size: 0.82rem;
  color: #e07070;
  margin: 8px 0 0;
}
.co-alert {
  padding: 10px 12px;
  border: 1px solid rgba(224, 112, 112, 0.26);
  border-radius: 11px;
  background: rgba(224, 112, 112, 0.07);
}
.co-error--pay {
  margin: 12px 0;
}
.co-pay {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 56px;
  margin-top: 19px;
  padding: 0 18px;
  border: none;
  border-radius: 15px;
  background: var(--gold-grad);
  color: var(--accent-contrast);
  font-family: inherit;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 15px 34px rgba(184, 134, 59, 0.17);
  transition: filter var(--transition), transform var(--transition), box-shadow var(--transition);
}
.co-pay:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-2px);
  box-shadow: 0 20px 42px rgba(184, 134, 59, 0.27);
}
.co-pay:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.co-pay-total {
  margin-left: auto;
  padding-left: 16px;
  border-left: 1px solid rgba(13,14,18,.25);
}
.co-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(13,14,18,.3);
  border-top-color: var(--accent-contrast);
  border-radius: 50%;
  animation: co-spin .7s linear infinite;
}
@keyframes co-spin { to { transform: rotate(360deg); } }
.co-summary-foot {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 7px;
  margin: 13px 8px 0;
  color: var(--text-muted);
}
.co-summary-foot svg {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--accent);
}
.co-invoice-note {
  margin: 0;
  font-size: 0.7rem;
  line-height: 1.45;
  text-align: center;
}
@media (max-width: 880px) {
  .checkout {
    padding-top: 36px;
  }
  .checkout-grid {
    grid-template-columns: 1fr;
  }
  .checkout-summary {
    position: static;
    grid-row: 1;
  }
  .checkout-main {
    grid-row: 2;
  }
}
@media (max-width: 640px) {
  .checkout-heading {
    display: block;
  }
  .checkout-security {
    margin-top: 18px;
  }
  .checkout-steps {
    margin-top: 24px;
  }
  .checkout-steps li {
    font-size: 0;
  }
  .checkout-steps li:not(:last-child)::after {
    right: 16px;
  }
  .co-section-card,
  .co-summary {
    padding: 20px;
    border-radius: 20px;
  }
  .co-methods {
    grid-template-columns: 1fr;
  }
  .co-method {
    min-height: 82px;
  }
  .co-trust-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
  .co-stripe-panel {
    padding: 14px;
  }
  .co-item-total {
    align-self: flex-start;
  }
}
@media (prefers-reduced-motion: reduce) {
  .co-spinner {
    animation-duration: 1.5s;
  }
}
</style>
