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
const updatingId = ref(null)

async function load() {
  loading.value = true
  error.value = ''
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
            <td><strong>{{ order.number }}</strong></td>
            <td>{{ formatDate(order.created_at) }}</td>
            <td>
              <span class="order-user">{{ order.user?.name }}</span>
              <span class="order-email">{{ order.user?.email }}</span>
            </td>
            <td>{{ formatPrice(order.total) }}</td>
            <td>
              <span class="admin-badge" :class="`admin-badge--${order.status}`">
                {{ t(`status.${order.status}`) }}
              </span>
            </td>
            <td>
              <div class="order-actions">
                <button
                  v-for="next in TRANSITIONS[order.status] || []"
                  :key="next"
                  type="button"
                  class="admin-btn"
                  :class="{ 'admin-btn--primary': next !== 'canceled' }"
                  :disabled="updatingId === order.id"
                  @click="setStatus(order, next)"
                >
                  {{ t('admin.markAs') }} {{ t(`status.${next}`).toLowerCase() }}
                </button>
                <span v-if="!(TRANSITIONS[order.status] || []).length" class="admin-note">—</span>
              </div>
            </td>
          </tr>
          <tr v-if="!orders.length">
            <td colspan="6" class="admin-note">{{ t('admin.empty') }}</td>
          </tr>
        </tbody>
      </table>
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

.order-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
