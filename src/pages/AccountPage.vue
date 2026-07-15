<script setup>
// Mi cuenta: datos del usuario + historial de pedidos (GET /orders/mine).
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { t, locale } from '../i18n.js'
import { auth, logout } from '../auth.js'
import { api, apiErrorMessage } from '../api.js'
import { formatPrice } from '../store.js'

const router = useRouter()

const orders = ref([])
const loading = ref(true)
const error = ref('')

async function loadOrders() {
  loading.value = true
  error.value = ''
  try {
    orders.value = await api.myOrders()
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadOrders)

function onLogout() {
  logout()
  router.push('/')
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

// Etiqueta del método de envío. 'express' solo aparece en pedidos antiguos;
// se conserva como texto legible. Cualquier valor desconocido cae al literal.
function shippingLabel(m) {
  const keys = { standard: 'methodStandard', eco: 'methodEco', express: 'methodExpress' }
  return keys[m] ? t(`account.${keys[m]}`) : m
}
</script>

<template>
  <section class="section account">
    <div class="container">
      <header class="account-head">
        <div>
          <span class="eyebrow">{{ t('account.title') }}</span>
          <h1 class="row-title">
            {{ t('account.hello') }}, {{ auth.user?.name || auth.user?.email }}
          </h1>
          <p class="account-email">{{ auth.user?.email }}</p>
        </div>
        <button type="button" class="btn btn-ghost" @click="onLogout">
          {{ t('account.logout') }}
        </button>
      </header>

      <h2 class="account-orders-title">{{ t('account.ordersTitle') }}</h2>

      <p v-if="loading" class="account-note">{{ t('account.loading') }}</p>
      <p v-else-if="error" class="account-error">{{ error }}</p>

      <div v-else-if="!orders.length" class="account-empty">
        <p>{{ t('account.empty') }}</p>
        <router-link :to="{ path: '/', hash: '#coleccion' }" class="btn btn-primary">
          {{ t('account.browse') }}
        </router-link>
      </div>

      <ul v-else class="order-list">
        <li v-for="order in orders" :key="order.id" class="order">
          <header class="order-head">
            <div>
              <strong class="order-number">{{ t('account.orderLabel') }} {{ order.number }}</strong>
              <span class="order-date">{{ formatDate(order.created_at) }}</span>
            </div>
            <span class="order-status" :class="`order-status--${order.status}`">
              {{ t(`status.${order.status}`) }}
            </span>
          </header>

          <ul class="order-items">
            <li v-for="item in order.items" :key="`${order.id}-${item.id}`" class="order-item">
              <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy" />
              <div class="order-item-info">
                <p class="order-item-brand">{{ item.brand }}</p>
                <p class="order-item-name">{{ item.name }} × {{ item.qty }}</p>
              </div>
              <span class="order-item-price">{{ formatPrice(item.unit_price * item.qty) }}</span>
            </li>
          </ul>

          <footer class="order-foot">
            <span class="order-method">{{ shippingLabel(order.shipping_method) }}</span>
            <dl class="order-totals">
              <div>
                <dt>{{ t('account.subtotal') }}</dt>
                <dd>{{ formatPrice(order.subtotal) }}</dd>
              </div>
              <div>
                <dt>{{ t('account.shipping') }}</dt>
                <dd>{{ formatPrice(order.shipping_cost) }}</dd>
              </div>
              <div v-if="Number(order.discount_amount)" class="order-discount">
                <dt>
                  {{ t('account.discount') }}
                  <template v-if="order.discount_code">({{ order.discount_code }})</template>
                </dt>
                <dd>−{{ formatPrice(order.discount_amount) }}</dd>
              </div>
              <div v-if="Number(order.tax)">
                <dt>{{ t('account.tax') }}</dt>
                <dd>{{ formatPrice(order.tax) }}</dd>
              </div>
              <div class="order-total">
                <dt>{{ t('account.total') }}</dt>
                <dd>{{ formatPrice(order.total) }}</dd>
              </div>
            </dl>
          </footer>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.account {
  min-height: 60vh;
}

.account-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 36px;
}

.account-email {
  color: var(--text-muted);
  margin: 6px 0 0;
  font-size: 0.92rem;
}

.account-orders-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 18px;
}

.account-note {
  color: var(--text-muted);
}

.account-error {
  color: #e07070;
}

.account-empty {
  padding: 40px 0;
  color: var(--text-muted);
}

.account-empty p {
  margin: 0 0 18px;
}

.order-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 18px;
}

.order {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background-color: var(--bg-elevated);
  overflow: hidden;
}

.order-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.order-number {
  font-size: 1rem;
}

.order-date {
  margin-left: 12px;
  font-size: 0.84rem;
  color: var(--text-muted);
}

.order-status {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.order-status--pending {
  color: var(--bronce-light);
  border-color: var(--bronce);
}

.order-status--paid {
  color: var(--cian);
  border-color: var(--cian);
}

.order-status--shipped {
  color: var(--titanio);
  border-color: var(--titanio);
}

.order-status--delivered {
  color: #7fd88f;
  border-color: #3f7a4b;
}

.order-status--canceled {
  color: #e07070;
  border-color: #7a3f3f;
}

.order-items {
  list-style: none;
  margin: 0;
  padding: 8px 20px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.order-item:last-child {
  border-bottom: none;
}

.order-item img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--border);
  background-color: #090a0e;
}

.order-item-info {
  flex: 1;
  min-width: 0;
}

.order-item-brand {
  margin: 0;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
}

.order-item-name {
  margin: 2px 0 0;
  font-size: 0.92rem;
  font-weight: 600;
}

.order-item-price {
  font-size: 0.9rem;
  font-weight: 600;
}

.order-foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px 18px;
  background-color: var(--bg-soft);
  flex-wrap: wrap;
}

.order-method {
  font-size: 0.84rem;
  color: var(--text-muted);
}

.order-totals {
  margin: 0;
  display: grid;
  gap: 4px;
  min-width: 220px;
}

.order-totals div {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  font-size: 0.86rem;
  color: var(--text-muted);
}

.order-totals dt,
.order-totals dd {
  margin: 0;
}

.order-total {
  font-weight: 700;
  color: var(--text) !important;
  font-size: 0.98rem !important;
  padding-top: 4px;
  border-top: 1px solid var(--border);
}

.order-discount {
  color: var(--cian) !important;
  font-weight: 600;
}
</style>
