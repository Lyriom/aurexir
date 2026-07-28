<script setup>
/*
 * Checkout embebido (requiere sesión).
 *
 * Flujo: el cliente ve el resumen, elige envío, opcionalmente aplica un código,
 * llena nombre/teléfono/dirección y paga con tarjeta SIN salir del sitio
 * (Stripe Payment Element, "deferred intent").
 *
 * El importe autoritativo lo calcula el backend al crear el PaymentIntent
 * (POST /checkout/intent); aquí solo se muestra un estimado (POST /shipping/quote
 * + descuento). Tras el pago, el backend (webhook) crea el pedido pagado y envía
 * el correo de recibo + factura PDF.
 */
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { t, locale } from '../i18n.js'
import { auth } from '../auth.js'
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
  clearCart,
} from '../store.js'
import { api, cartToPayload, apiErrorMessage, ApiError } from '../api.js'
import { API_BASE } from '../config.js'
import { getStripe, stripeConfigured } from '../stripe.js'

const router = useRouter()
const apiEnabled = Boolean(API_BASE)
const SHIPPING_RATES = { standard: 20, eco: 30 }

/* ---- Datos de envío del cliente ---- */
const form = reactive({
  name: auth.user?.name || '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
})

const COUNTRIES = [
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
  { code: 'MX', label: 'México' },
  { code: 'EC', label: 'Ecuador' },
  { code: 'ES', label: 'España' },
]

const formValid = computed(
  () =>
    form.name.trim() &&
    form.phone.trim() &&
    form.line1.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.postalCode.trim() &&
    form.country
)

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
const amountCents = computed(() => (total.value != null ? Math.round(total.value * 100) : 0))

/* ---- Stripe Payment Element (deferred intent) ---- */
const paymentElRef = ref(null)
const stripeReady = ref(false)
const stripeError = ref('')
let stripe = null
let elements = null
let paymentElement = null

async function ensureElements() {
  if (!stripeConfigured() || elements || amountCents.value <= 0) return
  try {
    if (!stripe) stripe = await getStripe()
    if (!stripe) return
    elements = stripe.elements({
      mode: 'payment',
      amount: amountCents.value,
      currency: 'usd',
      appearance: {
        theme: 'night',
        variables: {
          colorPrimary: '#b8863b',
          colorBackground: '#12131a',
          fontFamily: 'inherit',
          borderRadius: '12px',
        },
      },
    })
    paymentElement = elements.create('payment')
    await nextTick()
    if (paymentElRef.value) {
      paymentElement.mount(paymentElRef.value)
      stripeReady.value = true
    }
  } catch {
    stripeError.value = t('checkout.stripeLoadError')
  }
}

// Cuando cambia el importe: crea el Element (primera vez) o actualízalo.
watch(amountCents, (cents) => {
  if (cents <= 0) return
  if (elements) elements.update({ amount: cents })
  else ensureElements()
})

/* ---- Pago ---- */
const paying = ref(false)
const payError = ref('')

async function pay() {
  payError.value = ''
  if (!cart.items.length) return
  if (!formValid.value) {
    payError.value = t('checkout.fillFields')
    return
  }
  if (!stripeConfigured()) {
    payError.value = t('checkout.stripeNotConfigured')
    return
  }
  if (!stripe || !elements) {
    await ensureElements()
    if (!stripe || !elements) {
      payError.value = t('checkout.stripeLoadError')
      return
    }
  }

  paying.value = true
  // 1) Validar los datos de la tarjeta en el cliente.
  const { error: submitError } = await elements.submit()
  if (submitError) {
    payError.value = submitError.message || t('checkout.payError')
    paying.value = false
    return
  }

  // 2) Crear el PaymentIntent en el backend (importe autoritativo).
  let clientSecret
  try {
    const res = await api.createPaymentIntent({
      items: cartToPayload(cart.items),
      shipping_method: shippingMethod.value,
      discount_code: discount.value?.code || null,
      locale: locale.value,
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: auth.user?.email,
        address: {
          line1: form.line1.trim(),
          line2: form.line2.trim() || undefined,
          city: form.city.trim(),
          state: form.state.trim(),
          postal_code: form.postalCode.trim(),
          country: form.country,
        },
      },
    })
    clientSecret = res?.client_secret
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
    return
  }

  if (!clientSecret) {
    paying.value = false
    payError.value = t('checkout.payError')
    return
  }

  // 3) Confirmar el pago en el sitio (sin redirección salvo 3-D Secure).
  const { error } = await stripe.confirmPayment({
    elements,
    clientSecret,
    confirmParams: { return_url: `${window.location.origin}/checkout/success` },
    redirect: 'if_required',
  })
  if (error) {
    payError.value = error.message || t('checkout.payError')
    paying.value = false
    return
  }

  // Pago OK (sin redirección): limpiamos y celebramos.
  clearCart()
  router.push('/checkout/success')
}

onMounted(() => {
  scheduleQuote()
})

onBeforeUnmount(() => {
  if (quoteTimer) clearTimeout(quoteTimer)
  if (paymentElement) {
    try {
      paymentElement.unmount()
    } catch {
      /* ya desmontado */
    }
  }
})
</script>

<template>
  <section class="section checkout">
    <div class="container">
      <router-link to="/" class="checkout-back">← {{ t('checkout.back') }}</router-link>
      <h1 class="checkout-h1">{{ t('checkout.title') }}</h1>

      <!-- Carrito vacío -->
      <div v-if="!cart.items.length" class="checkout-empty">
        <p>{{ t('cart.empty') }}</p>
        <router-link :to="{ path: '/', hash: '#coleccion' }" class="btn btn-primary">
          {{ t('cart.browse') }}
        </router-link>
      </div>

      <form v-else class="checkout-grid" @submit.prevent="pay">
        <!-- Columna izquierda: datos + envío + pago -->
        <div class="checkout-main">
          <!-- Datos de envío -->
          <section class="co-card">
            <h2 class="co-h2">{{ t('checkout.shippingDetails') }}</h2>
            <div class="co-field">
              <label>{{ t('checkout.fullName') }}</label>
              <input v-model="form.name" type="text" autocomplete="name" required />
            </div>
            <div class="co-field">
              <label>{{ t('checkout.phone') }}</label>
              <input v-model="form.phone" type="tel" autocomplete="tel" required :placeholder="t('checkout.phonePlaceholder')" />
            </div>
            <div class="co-field">
              <label>{{ t('checkout.address1') }}</label>
              <input v-model="form.line1" type="text" autocomplete="address-line1" required />
            </div>
            <div class="co-field">
              <label>{{ t('checkout.address2') }}</label>
              <input v-model="form.line2" type="text" autocomplete="address-line2" />
            </div>
            <div class="co-row">
              <div class="co-field">
                <label>{{ t('checkout.city') }}</label>
                <input v-model="form.city" type="text" autocomplete="address-level2" required />
              </div>
              <div class="co-field">
                <label>{{ t('checkout.state') }}</label>
                <input v-model="form.state" type="text" autocomplete="address-level1" required />
              </div>
            </div>
            <div class="co-row">
              <div class="co-field">
                <label>{{ t('checkout.postalCode') }}</label>
                <input v-model="form.postalCode" type="text" autocomplete="postal-code" required />
              </div>
              <div class="co-field">
                <label>{{ t('checkout.country') }}</label>
                <select v-model="form.country" required>
                  <option v-for="c in COUNTRIES" :key="c.code" :value="c.code">{{ c.label }}</option>
                </select>
              </div>
            </div>
          </section>

          <!-- Método de envío -->
          <section class="co-card">
            <h2 class="co-h2">{{ t('cart.shippingMethod') }}</h2>
            <div class="co-methods" role="radiogroup">
              <button
                type="button"
                class="co-method"
                :class="{ active: shippingMethod === 'standard' }"
                role="radio"
                :aria-checked="shippingMethod === 'standard'"
                @click="chooseMethod('standard')"
              >
                <span class="co-method-top">
                  <span>{{ t('cart.methodStandard') }}</span>
                  <span class="co-method-price">{{ formatPrice(SHIPPING_RATES.standard) }}</span>
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
                <span class="co-method-top">
                  <span>🌿 {{ t('cart.methodEco') }}</span>
                  <span class="co-method-price">{{ formatPrice(SHIPPING_RATES.eco) }}</span>
                </span>
                <span class="co-method-sub">{{ t('cart.ecoSub') }}</span>
              </button>
            </div>
            <p v-if="quoteError" class="co-error">{{ quoteError }}</p>
          </section>

          <!-- Pago con tarjeta -->
          <section class="co-card">
            <h2 class="co-h2">{{ t('checkout.payment') }}</h2>
            <div v-if="stripeConfigured()" ref="paymentElRef" class="co-payment-el">
              <p v-if="!stripeReady" class="co-note">{{ t('checkout.loadingPayment') }}</p>
            </div>
            <p v-else class="co-note co-note--warn">{{ t('checkout.stripeNotConfigured') }}</p>
            <p v-if="stripeError" class="co-error">{{ stripeError }}</p>
            <p class="co-secure">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              {{ t('checkout.securedByStripe') }}
            </p>
          </section>
        </div>

        <!-- Columna derecha: resumen -->
        <aside class="checkout-summary">
          <div class="co-card co-summary">
            <h2 class="co-h2">
              {{ t('checkout.orderSummary') }}
              <span class="co-count">{{ cartCount }}</span>
            </h2>
            <ul class="co-items">
              <li v-for="item in cart.items" :key="item.id" class="co-item">
                <div class="co-thumb"><img :src="item.image" :alt="item.name" loading="lazy" /></div>
                <div class="co-item-info">
                  <p class="co-item-brand">{{ item.brand }}</p>
                  <p class="co-item-name">{{ item.name }} × {{ item.qty }}</p>
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
            <div v-else class="co-code">
              <input
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

            <p v-if="payError" class="co-error co-error--pay">{{ payError }}</p>

            <button
              type="submit"
              class="co-pay"
              :disabled="paying || quoteLoading || total == null || !stripeConfigured()"
            >
              {{ paying ? t('checkout.processing') : t('checkout.payNow') + (total != null ? ' · ' + formatPrice(total) : '') }}
            </button>
            <p class="co-invoice-note">{{ t('checkout.invoiceNote') }}</p>
          </div>
        </aside>
      </form>
    </div>
  </section>
</template>

<style scoped>
.checkout {
  min-height: calc(100vh - var(--header-h) - 120px);
}
.checkout-back {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 0.86rem;
  color: var(--text-muted);
}
.checkout-back:hover {
  color: var(--hover);
}
.checkout-h1 {
  font-size: 1.7rem;
  font-weight: 600;
  margin: 0 0 22px;
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
  grid-template-columns: 1fr 380px;
  gap: 24px;
  align-items: start;
}
.checkout-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.co-card {
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 22px;
}
.co-h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.02rem;
  font-weight: 600;
  margin: 0 0 16px;
}
.co-count {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  background-color: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 1px 9px;
}
.co-field {
  margin-bottom: 13px;
}
.co-field label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.co-field input,
.co-field select {
  width: 100%;
  height: 44px;
  padding: 0 13px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background-color: var(--bg);
  color: var(--text);
  font-family: inherit;
  font-size: 0.92rem;
}
.co-field input:focus,
.co-field select:focus {
  outline: none;
  border-color: var(--accent);
}
.co-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.co-methods {
  display: flex;
  gap: 10px;
}
.co-method {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 13px 15px;
  text-align: left;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background-color: var(--bg);
  color: var(--text-secondary);
  font-family: inherit;
  cursor: pointer;
  transition: color var(--transition), border-color var(--transition), background-color var(--transition);
}
.co-method.active {
  border-color: var(--accent);
  background-color: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--text);
}
.co-method--eco.active {
  border-color: #4caf6e;
  background-color: color-mix(in srgb, #4caf6e 14%, transparent);
}
.co-method-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}
.co-method-price {
  font-weight: 700;
}
.co-method-sub {
  font-size: 0.74rem;
  color: var(--text-muted);
}
.co-payment-el {
  min-height: 44px;
}
.co-note {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}
.co-note--warn {
  color: #e0a970;
}
.co-secure {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 14px 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.co-secure svg {
  color: var(--accent);
}
/* Resumen */
.checkout-summary {
  position: sticky;
  top: calc(var(--header-h) + 16px);
}
.co-items {
  list-style: none;
  margin: 0 0 14px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 260px;
  overflow-y: auto;
}
.co-item {
  display: flex;
  align-items: center;
  gap: 11px;
}
.co-thumb {
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
  background-color: #090a0e;
}
.co-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.co-item-info {
  flex: 1;
  min-width: 0;
}
.co-item-brand {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  margin: 0;
}
.co-item-name {
  font-size: 0.86rem;
  font-weight: 600;
  margin: 2px 0 0;
}
.co-item-total {
  font-size: 0.86rem;
  font-weight: 700;
}
.co-code {
  display: flex;
  gap: 8px;
  margin: 4px 0 6px;
}
.co-code input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px dashed var(--border);
  background-color: var(--bg);
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
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent);
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
  margin: 9px 0;
  font-size: 0.9rem;
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
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
}
.co-error {
  font-size: 0.82rem;
  color: #e07070;
  margin: 8px 0 0;
}
.co-error--pay {
  margin: 12px 0;
}
.co-pay {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 52px;
  margin-top: 16px;
  border: none;
  border-radius: var(--radius);
  background: var(--gold-grad);
  color: var(--accent-contrast);
  font-family: inherit;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: filter var(--transition), transform var(--transition);
}
.co-pay:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-2px);
}
.co-pay:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.co-invoice-note {
  margin: 12px 0 0;
  font-size: 0.76rem;
  color: var(--text-muted);
  text-align: center;
}
@media (max-width: 880px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
  .checkout-summary {
    position: static;
  }
}
</style>
