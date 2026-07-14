<script setup>
// Panel de administración (requiere role=admin; el router ya lo protege y la
// API responde 403 ante cualquier intento sin permisos).
import { ref } from 'vue'
import { t } from '../i18n.js'
import AdminMetrics from '../components/admin/AdminMetrics.vue'
import AdminOrders from '../components/admin/AdminOrders.vue'
import AdminProducts from '../components/admin/AdminProducts.vue'

const tab = ref('dashboard') // 'dashboard' | 'orders' | 'products'

const tabs = [
  { key: 'dashboard', label: 'admin.tabDashboard' },
  { key: 'orders', label: 'admin.tabOrders' },
  { key: 'products', label: 'admin.tabProducts' },
]
</script>

<template>
  <section class="section admin-page">
    <div class="container">
      <header class="admin-head">
        <div>
          <span class="eyebrow">AUREXIR</span>
          <h1 class="row-title">{{ t('admin.title') }}</h1>
        </div>
        <nav class="admin-tabs" role="tablist">
          <button
            v-for="item in tabs"
            :key="item.key"
            type="button"
            role="tab"
            class="admin-tab"
            :class="{ active: tab === item.key }"
            :aria-selected="tab === item.key"
            @click="tab = item.key"
          >
            {{ t(item.label) }}
          </button>
        </nav>
      </header>

      <AdminMetrics v-if="tab === 'dashboard'" />
      <AdminOrders v-else-if="tab === 'orders'" />
      <AdminProducts v-else />
    </div>
  </section>
</template>

<style scoped>
.admin-page {
  min-height: 70vh;
}

.admin-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.admin-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.admin-tab {
  padding: 9px 20px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background-color: var(--bg-elevated);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--transition), border-color var(--transition),
    background-color var(--transition);
}

.admin-tab:hover {
  color: var(--hover);
  border-color: var(--hover);
}

.admin-tab.active {
  background-color: var(--accent);
  border-color: var(--accent);
  color: var(--accent-contrast);
}
</style>
