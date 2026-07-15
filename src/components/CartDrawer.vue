<script setup>
// Panel lateral del carrito. Estado y acciones vienen de store.js.
// Con backend activo añade: cotización de envío (ZIP de EE. UU.) y pago con
// tarjeta vía Stripe Checkout (requiere sesión). WhatsApp sigue disponible.
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { t } from '../i18n.js'
import {
  cart,
  cartTotal,
  cartCount,
  openCart,
  closeCart,
  clearCart,
  incQty,
  decQty,
  removeFromCart,
  checkoutWhatsAppLink,
  formatPrice,
  freeShippingRemaining,
  freeShippingProgress,
  discount,
  discountAmount,
  applyDiscount,
  removeDiscount,
} from '../store.js'
import { api, cartToPayload, apiErrorMessage, ApiError } from '../api.js'
import { API_BASE } from '../config.js'
import { auth } from '../auth.js'

const route = useRoute()
const router = useRouter()

const apiEnabled = Boolean(API_BASE)

// Deep-link: abrir el carrito con #cart (enlaces externos o vuelta del login).
onMounted(() => {
  if (typeof window !== 'undefined' && window.location.hash === '#cart') {
    openCart()
  }
})
watch(
  () => route.hash,
  (hash) => {
    if (hash === '#cart') openCart()
  }
)

/* ---- Cotización de envío (POST /shipping/quote) ---- */
const zip = ref('')
const method = ref('standard')
const quote = ref(null)
const quoteLoading = ref(false)
const quoteError = ref('')

async function requestQuote() {
  quoteError.value = ''
  if (!/^\d{5}$/.test(zip.value.trim())) {
    quoteError.value = t('cart.zipInvalid')
    return
  }
  quoteLoading.value = true
  try {
    quote.value = await api.quoteShipping({
      items: cartToPayload(cart.items),
      zip: zip.value.trim(),
      method: method.value,
    })
  } catch (e) {
    quote.value = null
    quoteError.value = apiErrorMessage(e)
  } finally {
    quoteLoading.value = false
  }
}

// Si cambia el carrito o el método, la cotización anterior deja de valer.
watch(cartTotal, () => {
  quote.value = null
})
watch(method, () => {
  if (quote.value) requestQuote()
})

/* ---- Código de descuento (POST /discounts/validate) ---- */
const codeInput = ref('')
const codeApplying = ref(false)
const codeError = ref('')

async function applyCode() {
  const code = codeInput.value.trim()
  if (!code || codeApplying.value) return
  codeError.value = ''
  codeApplying.value = true
  try {
    // Siempre responde 200: {valid, code, percent}
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

function unapplyCode() {
  removeDiscount()
  codeError.value = ''
}

// Total estimado: subtotal − descuento + envío cotizado (el envío no se
// descuenta; el back aplica la misma regla al crear la sesión de Stripe).
const estimatedTotal = computed(() => {
  if (!quote.value) return null
  return (
    Math.round((Number(quote.value.total_estimate) - discountAmount.value) * 100) / 100
  )
})

/* ---- Pago con tarjeta (Stripe Checkout hospedado) ---- */
const checkoutLoading = ref(false)
const checkoutError = ref('')

async function payWithCard() {
  checkoutError.value = ''
  if (!auth.user) {
    // Sin sesión: al volver del login, /#cart reabre el drawer.
    closeCart()
    router.push({ path: '/login', query: { next: '/#cart' } })
    return
  }
  checkoutLoading.value = true
  try {
    const { checkout_url } = await api.createCheckoutSession({
      items: cartToPayload(cart.items),
      shipping_method: method.value,
      discount_code: discount.value?.code || null,
    })
    window.location.href = checkout_url
  } catch (e) {
    checkoutLoading.value = false
    if (e instanceof ApiError && (e.message === 'SESSION_EXPIRED' || e.message === 'NOT_AUTHENTICATED')) {
      closeCart()
      router.push({ path: '/login', query: { next: '/#cart' } })
      return
    }
    // 409 por código inválido/ya usado → mostrar el detalle y desaplicarlo.
    if (
      e instanceof ApiError &&
      e.status === 409 &&
      discount.value &&
      typeof e.detail === 'string' &&
      /c[oó]digo|descuento|discount/i.test(e.detail)
    ) {
      removeDiscount()
    }
    checkoutError.value = apiErrorMessage(e)
  }
}

// Mensaje de la barra de envío gratis (con el monto restante interpolado).
const freeShipLabel = computed(() =>
  freeShippingRemaining.value === 0
    ? t('cart.freeShipDone')
    : t('cart.freeShipAway').replace('{amount}', formatPrice(freeShippingRemaining.value))
)

function onKey(e) {
  if (e.key === 'Escape') closeCart()
}

// Bloquea el scroll del fondo y escucha Escape solo con el drawer abierto.
watch(
  () => cart.open,
  (open) => {
    if (typeof document === 'undefined') return
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', onKey)
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }
)

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', onKey)
  }
})
</script>

<template>
  <Transition name="drawer">
    <div v-if="cart.open" class="cart-overlay" @click.self="closeCart">
      <aside class="cart" role="dialog" aria-modal="true" :aria-label="t('cart.title')">
        <header class="cart-head">
          <h2 class="cart-title">
            {{ t('cart.title') }}
            <span v-if="cartCount" class="cart-count">
              {{ cartCount }} {{ cartCount === 1 ? t('cart.itemOne') : t('cart.itemMany') }}
            </span>
          </h2>
          <button class="cart-close" type="button" :aria-label="t('product.close')" @click="closeCart">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>

        <!-- Vacío -->
        <div v-if="!cart.items.length" class="cart-empty">
          <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 6h15l-1.5 9h-12z" />
            <path d="M6 6L5 3H2" />
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="18" cy="20" r="1.4" />
          </svg>
          <p class="cart-empty-title">{{ t('cart.empty') }}</p>
          <p class="cart-empty-hint">{{ t('cart.emptyHint') }}</p>
          <router-link :to="{ path: '/', hash: '#coleccion' }" class="btn btn-primary" @click="closeCart">
            {{ t('cart.browse') }}
          </router-link>
        </div>

        <!-- Con productos -->
        <template v-else>
          <ul class="cart-list">
            <li v-for="item in cart.items" :key="item.id" class="cart-item">
              <div class="cart-thumb">
                <img :src="item.image" :alt="item.name" loading="lazy" />
              </div>
              <div class="cart-info">
                <p class="cart-item-brand">{{ item.brand }}</p>
                <p class="cart-item-name">{{ item.name }}</p>
                <p class="cart-item-price">{{ formatPrice(item.price) }}</p>
                <div class="cart-qty">
                  <button type="button" aria-label="−" @click="decQty(item.id)">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14" /></svg>
                  </button>
                  <span>{{ item.qty }}</span>
                  <button type="button" aria-label="+" @click="incQty(item.id)">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </button>
                </div>
              </div>
              <div class="cart-item-side">
                <span class="cart-item-total">{{ formatPrice(item.price * item.qty) }}</span>
                <button type="button" class="cart-remove" :aria-label="t('cart.remove')" @click="removeFromCart(item.id)">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
                </button>
              </div>
            </li>
          </ul>

          <footer class="cart-foot">
            <!-- Progreso hacia envío gratis (umbral compartido con el back) -->
            <div class="cart-freeship" :class="{ done: freeShippingRemaining === 0 }">
              <p class="cart-freeship-text">{{ freeShipLabel }}</p>
              <div class="cart-freeship-track" aria-hidden="true">
                <div class="cart-freeship-fill" :style="{ width: freeShippingProgress + '%' }"></div>
              </div>
            </div>

            <button type="button" class="cart-clear" @click="clearCart">{{ t('cart.clear') }}</button>
            <div class="cart-subtotal">
              <span>{{ t('cart.subtotal') }}</span>
              <strong>{{ formatPrice(cartTotal) }}</strong>
            </div>

            <!-- Código de descuento (15% bienvenida, un solo uso) -->
            <template v-if="apiEnabled">
              <div v-if="discount" class="cart-shipline cart-discount">
                <span>
                  {{ t('cart.discountLabel') }} ({{ discount.code }})
                  <button
                    type="button"
                    class="cart-discount-remove"
                    :aria-label="t('cart.codeRemove')"
                    :title="t('cart.codeRemove')"
                    @click="unapplyCode"
                  >
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                </span>
                <span class="cart-discount-amount">−{{ formatPrice(discountAmount) }}</span>
              </div>
              <form v-else class="cart-code" @submit.prevent="applyCode">
                <input
                  v-model="codeInput"
                  class="cart-code-input"
                  type="text"
                  autocomplete="off"
                  spellcheck="false"
                  :placeholder="t('cart.codePlaceholder')"
                  :aria-label="t('cart.codeTitle')"
                />
                <button type="submit" class="cart-code-btn" :disabled="codeApplying || !codeInput.trim()">
                  {{ codeApplying ? '…' : t('cart.codeApply') }}
                </button>
              </form>
              <p v-if="codeError" class="cart-error">{{ codeError }}</p>
            </template>

            <!-- Cotización de envío real (backend) -->
            <form v-if="apiEnabled" class="cart-est" @submit.prevent="requestQuote">
              <p class="cart-est-title">{{ t('cart.estimateTitle') }}</p>
              <div class="cart-est-methods" role="radiogroup" :aria-label="t('cart.shipping')">
                <button
                  type="button"
                  class="cart-est-method"
                  :class="{ active: method === 'standard' }"
                  @click="method = 'standard'"
                >
                  {{ t('cart.methodStandard') }}
                </button>
                <button
                  type="button"
                  class="cart-est-method"
                  :class="{ active: method === 'express' }"
                  @click="method = 'express'"
                >
                  {{ t('cart.methodExpress') }}
                </button>
              </div>
              <div class="cart-est-row">
                <input
                  v-model="zip"
                  class="cart-est-zip"
                  type="text"
                  inputmode="numeric"
                  maxlength="5"
                  :placeholder="t('cart.zipPlaceholder')"
                  :aria-label="t('cart.zipPlaceholder')"
                />
                <button type="submit" class="cart-est-btn" :disabled="quoteLoading">
                  {{ quoteLoading ? '…' : t('cart.estimate') }}
                </button>
              </div>
              <p v-if="quoteError" class="cart-error">{{ quoteError }}</p>
            </form>

            <div class="cart-shipline">
              <span>{{ t('cart.shipping') }}</span>
              <span v-if="quote" :class="{ 'is-free': Number(quote.shipping) === 0 }">
                {{ Number(quote.shipping) === 0 ? t('cart.shippingFree') : formatPrice(quote.shipping) }}
              </span>
              <span v-else :class="{ 'is-free': freeShippingRemaining === 0 }">
                {{ freeShippingRemaining === 0 ? t('cart.shippingFree') : t('cart.shippingCalc') }}
              </span>
            </div>
            <div v-if="quote" class="cart-shipline cart-est-total">
              <span>{{ t('cart.estTotal') }}</span>
              <span>{{ formatPrice(estimatedTotal) }}</span>
            </div>

            <p class="cart-note">{{ apiEnabled ? t('cart.payNote') : t('cart.note') }}</p>

            <p v-if="checkoutError" class="cart-error">{{ checkoutError }}</p>
            <button
              v-if="apiEnabled"
              type="button"
              class="cart-pay"
              :disabled="checkoutLoading"
              @click="payWithCard"
            >
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                <path d="M2.5 9.5h19" />
                <path d="M6.5 14.5h4" />
              </svg>
              {{ checkoutLoading ? t('cart.paying') : auth.user ? t('cart.payCard') : t('cart.loginToPay') }}
            </button>
            <p v-if="apiEnabled" class="cart-or">{{ t('cart.orWhatsApp') }}</p>
            <a
              :href="checkoutWhatsAppLink()"
              target="_blank"
              rel="noopener noreferrer"
              class="cart-checkout"
              :class="{ 'cart-checkout--secondary': apiEnabled }"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.15h-.01c-1.52 0-3.01-.41-4.31-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/>
              </svg>
              {{ t('cart.checkout') }}
            </a>
          </footer>
        </template>
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
.cart-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  justify-content: flex-end;
  background-color: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
}

.cart {
  width: min(420px, 100%);
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-elevated);
  border-left: 1px solid var(--border);
  box-shadow: -20px 0 50px rgba(0, 0, 0, 0.5);
}

.cart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 22px;
  border-bottom: 1px solid var(--border);
}

.cart-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 1.2rem;
  font-weight: 600;
}

.cart-count {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
}

.cart-close {
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
  transition: color var(--transition), border-color var(--transition);
}

.cart-close:hover {
  color: var(--hover);
  border-color: var(--hover);
}

/* Vacío */
.cart-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
}

.cart-empty svg {
  color: var(--gunmetal);
  margin-bottom: 6px;
}

.cart-empty-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.cart-empty-hint {
  margin: 0 0 14px;
  font-size: 0.9rem;
}

/* Lista */
.cart-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 12px 16px;
}

.cart-item {
  display: flex;
  gap: 12px;
  padding: 14px 6px;
  border-bottom: 1px solid var(--border);
}

.cart-thumb {
  flex: 0 0 auto;
  width: 64px;
  height: 64px;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
  background-color: #090a0e;
}

.cart-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-info {
  flex: 1;
  min-width: 0;
}

.cart-item-brand {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
  margin: 0 0 2px;
}

.cart-item-name {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 2px;
}

.cart-item-price {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 0 0 8px;
}

.cart-qty {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px 6px;
}

.cart-qty button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition: color var(--transition), background-color var(--transition);
}

.cart-qty button:hover {
  color: var(--hover);
  background-color: var(--bg);
}

.cart-qty span {
  min-width: 16px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
}

.cart-item-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
}

.cart-item-total {
  font-size: 0.92rem;
  font-weight: 700;
}

.cart-remove {
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  transition: color var(--transition);
}

.cart-remove:hover {
  color: #d64545;
}

/* Pie */
.cart-foot {
  padding: 18px 22px 22px;
  border-top: 1px solid var(--border);
  background-color: var(--bg-soft);
}

/* Barra de envío gratis */
.cart-freeship {
  margin-bottom: 14px;
}

.cart-freeship-text {
  margin: 0 0 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.cart-freeship.done .cart-freeship-text {
  color: var(--cian);
}

.cart-freeship-track {
  height: 6px;
  border-radius: 999px;
  background-color: var(--gunmetal);
  overflow: hidden;
}

.cart-freeship-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--gold-grad);
  transition: width 0.35s ease;
}

.cart-freeship.done .cart-freeship-fill {
  background: var(--cian);
}

/* Código de descuento */
.cart-code {
  display: flex;
  gap: 8px;
  margin: 0 0 12px;
}

.cart-code-input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px dashed var(--border);
  background-color: var(--bg);
  color: var(--text);
  font-family: inherit;
  font-size: 0.86rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.cart-code-input::placeholder {
  text-transform: none;
  letter-spacing: normal;
  color: var(--text-muted);
}

.cart-code-input:focus {
  outline: none;
  border-color: var(--accent);
  border-style: solid;
}

.cart-code-btn {
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--transition), color var(--transition), opacity var(--transition);
}

.cart-code-btn:hover:not(:disabled) {
  background-color: var(--accent);
  color: var(--accent-contrast);
}

.cart-code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cart-discount {
  color: var(--cian);
  font-weight: 600;
}

.cart-discount-amount {
  color: var(--cian);
  font-weight: 700;
}

.cart-discount-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-left: 4px;
  vertical-align: -4px;
  border: none;
  border-radius: 50%;
  background-color: var(--gunmetal);
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--transition), background-color var(--transition);
}

.cart-discount-remove:hover {
  color: #fff;
  background-color: #7a3f3f;
}

/* Estimador de envío (ZIP + método) */
.cart-est {
  margin: 0 0 14px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background-color: var(--bg-elevated);
}

.cart-est-title {
  margin: 0 0 10px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.cart-est-methods {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.cart-est-method {
  flex: 1;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background-color: var(--bg);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--transition), border-color var(--transition),
    background-color var(--transition);
}

.cart-est-method.active {
  background-color: var(--accent);
  border-color: var(--accent);
  color: var(--accent-contrast);
}

.cart-est-row {
  display: flex;
  gap: 8px;
}

.cart-est-zip {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background-color: var(--bg);
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
}

.cart-est-zip:focus {
  outline: none;
  border-color: var(--accent);
}

.cart-est-btn {
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--transition), color var(--transition);
}

.cart-est-btn:hover:not(:disabled) {
  background-color: var(--accent);
  color: var(--accent-contrast);
}

.cart-est-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.cart-est-total {
  font-weight: 700;
  color: var(--text);
}

.cart-error {
  margin: 8px 0 10px;
  font-size: 0.82rem;
  color: #e07070;
}

/* Pago con tarjeta (acción principal con backend activo) */
.cart-pay {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  min-height: 52px;
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

.cart-pay:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-2px);
}

.cart-pay:disabled {
  opacity: 0.7;
  cursor: wait;
}

.cart-or {
  margin: 10px 0;
  text-align: center;
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* WhatsApp pasa a secundario cuando existe pago con tarjeta */
.cart-checkout--secondary {
  min-height: 46px;
  font-size: 0.92rem;
}

.cart-shipline {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: -4px 0 10px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.cart-shipline .is-free {
  color: var(--cian);
  font-weight: 700;
}

.cart-clear {
  display: inline-block;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.82rem;
  cursor: pointer;
  padding: 0 0 12px;
  transition: color var(--transition);
}

.cart-clear:hover {
  color: #d64545;
}

.cart-subtotal {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.cart-subtotal span {
  color: var(--text-secondary);
}

.cart-subtotal strong {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 700;
}

.cart-note {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0 0 14px;
}

.cart-checkout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  min-height: 52px;
  border-radius: var(--radius);
  background-color: #25d366;
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  transition: background-color var(--transition), transform var(--transition);
}

.cart-checkout:hover {
  background-color: #1ebe5d;
  transform: translateY(-2px);
}

/* Transición del drawer */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-enter-active .cart,
.drawer-leave-active .cart {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from .cart,
.drawer-leave-to .cart {
  transform: translateX(100%);
}
</style>
