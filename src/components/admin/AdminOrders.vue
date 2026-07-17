<script setup>
// Pedidos (admin): GET /admin/orders?status=... + PATCH /admin/orders/{id}.
// Solo se ofrecen las transiciones que la API acepta (si no, respondería 409):
//   pending → paid | canceled · paid → shipped | canceled
//   shipped → delivered | canceled · delivered / canceled: finales.
import { ref, onMounted, watch } from 'vue'
import { t, locale } from '../../i18n.js'
import { api, apiErrorMessage } from '../../api.js'
import { formatPrice } from '../../store.js'

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'canceled']
const TRANSITIONS = {
  pending: ['paid', 'canceled'],
  paid: ['shipped', 'canceled'],
  shipped: ['delivered', 'canceled'],
  delivered: [],
  canceled: [],
}

const statusFilter = ref('')
const orders = ref([])
const loading = ref(true)
const error = ref('')
const okMessage = ref('')
const updatingId = ref(null)

async function load() {
  loading.value = true
  error.value = ''
  okMessage.value = ''
  try {
    orders.value = await api.admin.orders(statusFilter.value)
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(statusFilter, load)

async function setStatus(order, status) {
  error.value = ''
  updatingId.value = order.id
  try {
    const updated = await api.admin.updateOrderStatus(order.id, status)
    // La API devuelve el pedido actualizado; si no, aplicamos el cambio local.
    const idx = orders.value.findIndex((o) => o.id === order.id)
    if (idx !== -1) orders.value[idx] = { ...orders.value[idx], ...(updated || { status }) }
    // Si hay filtro activo y el pedido salió de ese estado, refrescamos la lista.
    if (statusFilter.value && statusFilter.value !== (updated?.status || status)) load()
  } catch (e) {
    // 409 = transición inválida (p. ej. cambiado desde otra sesión) → recargar.
    error.value = apiErrorMessage(e)
    if (e?.status === 409) load()
  } finally {
    updatingId.value = null
  }
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

// 'express' solo en pedidos antiguos; se conserva legible. Desconocido → literal.
function shippingLabel(m) {
  const keys = { standard: 'methodStandard', eco: 'methodEco', express: 'methodExpress' }
  return keys[m] ? t(`admin.${keys[m]}`) : m
}

/* ---- Seguimiento del envío (PATCH /admin/orders/{id}/tracking) ----
 * Disponible en pedidos 'paid' (envía y avisa al cliente) y 'shipped' (corregir).
 * El back pone status 'shipped' y manda el correo; no llamamos a updateOrderStatus. */
const trackingOrder = ref(null) // pedido en edición, o null
const trackNumber = ref('')
const trackCarrier = ref('')
const trackUrl = ref('')
const trackingError = ref('')
const trackingSaving = ref(false)

function canTrack(order) {
  return order.status === 'paid' || order.status === 'shipped'
}

function openTracking(order) {
  trackingOrder.value = order
  trackNumber.value = order.tracking_number || ''
  trackCarrier.value = order.tracking_carrier || ''
  trackUrl.value = order.tracking_url || ''
  trackingError.value = ''
  okMessage.value = ''
}

async function saveTracking() {
  const number = trackNumber.value.trim()
  if (!number || trackingSaving.value) return
  const url = trackUrl.value.trim()
  // Validación local: si hay URL, debe empezar por http/https (el back da 422 igual).
  if (url && !/^https?:\/\//i.test(url)) {
    trackingError.value = t('admin.trackingUrlInvalid')
    return
  }
  trackingError.value = ''
  trackingSaving.value = true
  const id = trackingOrder.value.id
  try {
    const updated = await api.admin.setTracking(id, {
      tracking_number: number,
      tracking_carrier: trackCarrier.value.trim() || undefined,
      tracking_url: url || undefined,
    })
    const patch = updated || {
      status: 'shipped',
      tracking_number: number,
      tracking_carrier: trackCarrier.value.trim() || null,
      tracking_url: url || null,
    }
    const idx = orders.value.findIndex((o) => o.id === id)
    if (idx !== -1) orders.value[idx] = { ...orders.value[idx], ...patch }
    okMessage.value = t('admin.trackingSaved')
    trackingOrder.value = null
    // Si el filtro activo ya no incluye al pedido (p. ej. 'paid' → 'shipped'), recargar.
    if (statusFilter.value && statusFilter.value !== (patch.status || 'shipped')) load()
  } catch (e) {
    // 409 → no pagado · 422 → URL inválida · otros → mensaje legible.
    trackingError.value = apiErrorMessage(e)
  } finally {
    trackingSaving.value = false
  }
}
</script>

<template>
  <div>
    <div class="orders-toolbar">
      <select v-model="statusFilter" class="admin-select">
        <option value="">{{ t('admin.filterAll') }}</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ t(`status.${s}`) }}</option>
      </select>
    </div>

    <p v-if="error" class="admin-error">{{ error }}</p>
    <p v-if="okMessage" class="admin-ok">{{ okMessage }}</p>
    <p v-if="loading" class="admin-note">{{ t('admin.loading') }}</p>

    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.order') }}</th>
            <th>{{ t('admin.date') }}</th>
            <th>{{ t('admin.customer') }}</th>
            <th>{{ t('admin.total') }}</th>
            <th>{{ t('admin.statusLabel') }}</th>
            <th>{{ t('admin.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>
              <strong>{{ order.number }}</strong>
              <span class="order-ship">{{ shippingLabel(order.shipping_method) }}</span>
            </td>
            <td>{{ formatDate(order.created_at) }}</td>
            <td>
              <span class="order-user">{{ order.user?.name }}</span>
              <span class="order-email">{{ order.user?.email }}</span>
            </td>
            <td>
              {{ formatPrice(order.total) }}
              <span v-if="Number(order.discount_amount)" class="order-discount">
                −{{ formatPrice(order.discount_amount) }}
                <template v-if="order.discount_code">({{ order.discount_code }})</template>
              </span>
            </td>
            <td>
              <span class="admin-badge" :class="`admin-badge--${order.status}`">
                {{ t(`status.${order.status}`) }}
              </span>
            </td>
            <td>
              <div class="order-actions">
                <button
                  v-if="canTrack(order)"
                  type="button"
                  class="admin-btn admin-btn--primary"
                  @click="openTracking(order)"
                >
                  {{ order.tracking_number ? t('admin.editTracking') : t('admin.addTracking') }}
                </button>
                <button
                  v-for="next in TRANSITIONS[order.status] || []"
                  :key="next"
                  type="button"
                  class="admin-btn"
                  :disabled="updatingId === order.id"
                  @click="setStatus(order, next)"
                >
                  {{ t('admin.markAs') }} {{ t(`status.${next}`).toLowerCase() }}
                </button>
                <span
                  v-if="!canTrack(order) && !(TRANSITIONS[order.status] || []).length"
                  class="admin-note"
                >—</span>
              </div>
            </td>
          </tr>
          <tr v-if="!orders.length">
            <td colspan="6" class="admin-note">{{ t('admin.empty') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de seguimiento (alta / edición) -->
    <div v-if="trackingOrder" class="admin-modal-overlay" @click.self="trackingOrder = null">
      <form class="admin-modal" @submit.prevent="saveTracking">
        <h3>{{ t('admin.trackingTitle') }} — {{ trackingOrder.number }}</h3>

        <label class="admin-field">
          <span>{{ t('admin.trackingNumber') }}</span>
          <input v-model="trackNumber" class="admin-input" type="text" required autocomplete="off" />
        </label>

        <label class="admin-field">
          <span>{{ t('admin.trackingCarrier') }}</span>
          <input
            v-model="trackCarrier"
            class="admin-input"
            type="text"
            autocomplete="off"
            :placeholder="t('admin.carrierPlaceholder')"
          />
        </label>

        <label class="admin-field">
          <span>{{ t('admin.trackingUrl') }}</span>
          <input v-model="trackUrl" class="admin-input" type="url" inputmode="url" placeholder="https://…" />
        </label>

        <p v-if="trackingError" class="admin-error">{{ trackingError }}</p>

        <div class="admin-modal-actions">
          <button type="button" class="admin-btn" @click="trackingOrder = null">
            {{ t('admin.cancel') }}
          </button>
          <button type="submit" class="admin-btn admin-btn--primary" :disabled="trackingSaving || !trackNumber.trim()">
            {{ trackingSaving ? t('admin.loading') : t('admin.save') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.orders-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 18px;
}

.order-user {
  display: block;
  font-weight: 600;
}

.order-email {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Método de envío bajo el número de pedido */
.order-ship {
  display: block;
  margin-top: 2px;
  font-size: 0.74rem;
  color: var(--text-muted);
}

/* Línea de descuento aplicado al pedido (código de bienvenida) */
.order-discount {
  display: block;
  font-size: 0.76rem;
  color: var(--cian);
  white-space: nowrap;
}

.order-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
