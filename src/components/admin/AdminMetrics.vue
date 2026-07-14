<script setup>
// Dashboard del admin: GET /admin/metrics?days=N
// → { revenue_total, orders_count, aov, revenue_by_day:[{date,revenue,orders}],
//     top_products:[{slug,name,units,revenue}], low_stock:[{slug,name,stock}],
//     new_customers }
import { ref, onMounted, watch } from 'vue'
import { t, locale } from '../../i18n.js'
import { api, apiErrorMessage } from '../../api.js'
import { formatPrice } from '../../store.js'

const days = ref(30)
const metrics = ref(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    metrics.value = await api.admin.metrics(days.value)
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(days, load)

function formatDay(iso) {
  try {
    return new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'es-ES', {
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
    <div class="metrics-toolbar">
      <span class="admin-note">{{ t('admin.lastDays').replace('{n}', String(days)) }}</span>
      <select v-model.number="days" class="admin-select">
        <option :value="7">7</option>
        <option :value="30">30</option>
        <option :value="90">90</option>
      </select>
    </div>

    <p v-if="loading" class="admin-note">{{ t('admin.loading') }}</p>
    <div v-else-if="error">
      <p class="admin-error">{{ error }}</p>
      <button type="button" class="admin-btn" @click="load">{{ t('admin.retry') }}</button>
    </div>

    <template v-else-if="metrics">
      <!-- Tarjetas -->
      <div class="metric-cards">
        <div class="metric-card">
          <span class="metric-label">{{ t('admin.revenue') }}</span>
          <strong class="metric-value gold-text">{{ formatPrice(metrics.revenue_total || 0) }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">{{ t('admin.ordersCount') }}</span>
          <strong class="metric-value">{{ metrics.orders_count ?? 0 }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">{{ t('admin.aov') }}</span>
          <strong class="metric-value">{{ formatPrice(metrics.aov || 0) }}</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">{{ t('admin.newCustomers') }}</span>
          <strong class="metric-value">{{ metrics.new_customers ?? 0 }}</strong>
        </div>
      </div>

      <div class="metric-grid">
        <!-- Más vendidos -->
        <div>
          <h3 class="metric-title">{{ t('admin.topProducts') }}</h3>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>{{ t('admin.product') }}</th>
                  <th>{{ t('admin.units') }}</th>
                  <th>{{ t('admin.revenue') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in metrics.top_products || []" :key="p.slug">
                  <td>{{ p.name }}</td>
                  <td>{{ p.units }}</td>
                  <td>{{ formatPrice(p.revenue) }}</td>
                </tr>
                <tr v-if="!(metrics.top_products || []).length">
                  <td colspan="3" class="admin-note">{{ t('admin.empty') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Stock bajo -->
        <div>
          <h3 class="metric-title">{{ t('admin.lowStock') }}</h3>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>{{ t('admin.product') }}</th>
                  <th>{{ t('admin.stock') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in metrics.low_stock || []" :key="p.slug">
                  <td>{{ p.name }}</td>
                  <td>
                    <span class="admin-badge" :class="p.stock === 0 ? 'admin-badge--canceled' : 'admin-badge--pending'">
                      {{ p.stock }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!(metrics.low_stock || []).length">
                  <td colspan="2" class="admin-note">{{ t('admin.empty') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Ventas por día -->
      <h3 class="metric-title">{{ t('admin.revenueByDay') }}</h3>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>{{ t('admin.date') }}</th>
              <th>{{ t('admin.ordersCount') }}</th>
              <th>{{ t('admin.revenue') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in metrics.revenue_by_day || []" :key="d.date">
              <td>{{ formatDay(d.date) }}</td>
              <td>{{ d.orders }}</td>
              <td>{{ formatPrice(d.revenue) }}</td>
            </tr>
            <tr v-if="!(metrics.revenue_by_day || []).length">
              <td colspan="3" class="admin-note">{{ t('admin.empty') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.metrics-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 18px;
}

.metric-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 26px;
}

.metric-card {
  padding: 18px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background-color: var(--bg-elevated);
}

.metric-label {
  display: block;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.metric-value {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
}

.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 26px;
}

.metric-title {
  font-size: 1.02rem;
  font-weight: 600;
  margin: 0 0 12px;
}

@media (max-width: 900px) {
  .metric-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
