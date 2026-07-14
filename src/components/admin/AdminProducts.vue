<script setup>
// Inventario (admin): GET /admin/products (incluye inactivos) +
// POST /admin/products · PATCH /admin/products/{id} ·
// PATCH /admin/products/{id}/stock {delta, reason}.
import { ref, reactive, onMounted } from 'vue'
import { t } from '../../i18n.js'
import { api, apiErrorMessage } from '../../api.js'
import { formatPrice } from '../../store.js'

const CATEGORIES = ['multi', 'daily', 'night', 'special']

const products = ref([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    products.value = await api.admin.products()
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

function refreshRow(id, patch) {
  const idx = products.value.findIndex((p) => p.id === id)
  if (idx !== -1) products.value[idx] = { ...products.value[idx], ...patch }
}

/* ---- Activar / desactivar ---- */
const togglingId = ref(null)

async function toggleActive(product) {
  error.value = ''
  togglingId.value = product.id
  try {
    const updated = await api.admin.updateProduct(product.id, { active: !product.active })
    refreshRow(product.id, updated || { active: !product.active })
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    togglingId.value = null
  }
}

/* ---- Crear / editar ---- */
const showForm = ref(false)
const formError = ref('')
const saving = ref(false)
const editingId = ref(null) // null = crear

const form = reactive({
  id: '',
  name: '',
  brand: '',
  category: 'multi',
  price: null,
  oldPrice: null,
  image: '',
  descEn: '',
  descEs: '',
  stock: 10,
})

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    id: '',
    name: '',
    brand: '',
    category: 'multi',
    price: null,
    oldPrice: null,
    image: '',
    descEn: '',
    descEs: '',
    stock: 10,
  })
  formError.value = ''
  showForm.value = true
}

function openEdit(product) {
  editingId.value = product.id
  Object.assign(form, {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    oldPrice: product.oldPrice ?? null,
    image: product.image,
    descEn: product.desc?.en || '',
    descEs: product.desc?.es || '',
    stock: product.stock ?? 0,
  })
  formError.value = ''
  showForm.value = true
}

async function saveForm() {
  formError.value = ''
  saving.value = true
  const fields = {
    name: form.name.trim(),
    brand: form.brand.trim(),
    category: form.category,
    price: Number(form.price),
    oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
    image: form.image.trim(),
    desc: { en: form.descEn.trim(), es: form.descEs.trim() },
  }
  try {
    if (editingId.value) {
      const updated = await api.admin.updateProduct(editingId.value, fields)
      refreshRow(editingId.value, updated || fields)
    } else {
      // Alta completa con el mismo shape que products.js (+ stock inicial).
      await api.admin.createProduct({
        id: form.id.trim(),
        ...fields,
        tag: null,
        tone: 'bronce',
        gallery: [fields.image],
        rating: 4.8,
        reviews: 0,
        isNew: true,
        isBest: false,
        notes: {
          top: { en: '', es: '' },
          heart: { en: '', es: '' },
          base: { en: '', es: '' },
        },
        stock: Number(form.stock) || 0,
        active: true,
      })
      await load()
    }
    showForm.value = false
  } catch (e) {
    formError.value = apiErrorMessage(e)
  } finally {
    saving.value = false
  }
}

/* ---- Ajuste de stock ---- */
const stockProduct = ref(null)
const stockDelta = ref(0)
const stockReason = ref('restock')
const stockError = ref('')
const stockSaving = ref(false)

function openStock(product) {
  stockProduct.value = product
  stockDelta.value = 0
  stockReason.value = 'restock'
  stockError.value = ''
}

async function saveStock() {
  const delta = Number(stockDelta.value)
  if (!delta) return
  stockError.value = ''
  stockSaving.value = true
  try {
    const updated = await api.admin.adjustStock(stockProduct.value.id, delta, stockReason.value)
    refreshRow(
      stockProduct.value.id,
      updated && typeof updated.stock === 'number'
        ? { stock: updated.stock }
        : { stock: Math.max(0, (stockProduct.value.stock || 0) + delta) }
    )
    stockProduct.value = null
  } catch (e) {
    stockError.value = apiErrorMessage(e)
  } finally {
    stockSaving.value = false
  }
}
</script>

<template>
  <div>
    <div class="products-toolbar">
      <button type="button" class="admin-btn admin-btn--primary" @click="openCreate">
        + {{ t('admin.newProduct') }}
      </button>
    </div>

    <p v-if="error" class="admin-error">{{ error }}</p>
    <p v-if="loading" class="admin-note">{{ t('admin.loading') }}</p>

    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>{{ t('admin.product') }}</th>
            <th>{{ t('admin.category') }}</th>
            <th>{{ t('admin.price') }}</th>
            <th>{{ t('admin.stock') }}</th>
            <th>{{ t('admin.statusLabel') }}</th>
            <th>{{ t('admin.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>
              <div class="product-cell">
                <img :src="product.image" :alt="product.name" loading="lazy" />
                <div>
                  <span class="product-brand">{{ product.brand }}</span>
                  <span class="product-name">{{ product.name }}</span>
                </div>
              </div>
            </td>
            <td>{{ t(`filters.${product.category}`) }}</td>
            <td>
              {{ formatPrice(product.price) }}
              <span v-if="product.oldPrice" class="product-oldprice">
                {{ formatPrice(product.oldPrice) }}
              </span>
            </td>
            <td>
              <span
                class="admin-badge"
                :class="{
                  'admin-badge--canceled': product.stock === 0,
                  'admin-badge--pending': product.stock > 0 && product.stock <= 3,
                }"
              >
                {{ product.stock ?? '—' }}
              </span>
            </td>
            <td>
              <span class="admin-badge" :class="product.active === false ? 'admin-badge--inactive' : 'admin-badge--active'">
                {{ product.active === false ? t('admin.inactive') : t('admin.active') }}
              </span>
            </td>
            <td>
              <div class="product-actions">
                <button type="button" class="admin-btn" @click="openEdit(product)">
                  {{ t('admin.edit') }}
                </button>
                <button type="button" class="admin-btn" @click="openStock(product)">
                  {{ t('admin.stock') }}
                </button>
                <button
                  type="button"
                  class="admin-btn"
                  :disabled="togglingId === product.id"
                  @click="toggleActive(product)"
                >
                  {{ product.active === false ? t('admin.activate') : t('admin.deactivate') }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!products.length">
            <td colspan="6" class="admin-note">{{ t('admin.empty') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal crear / editar -->
    <div v-if="showForm" class="admin-modal-overlay" @click.self="showForm = false">
      <form class="admin-modal" @submit.prevent="saveForm">
        <h3>{{ editingId ? t('admin.editProduct') : t('admin.newProduct') }}</h3>

        <label v-if="!editingId" class="admin-field">
          <span>{{ t('admin.slug') }}</span>
          <input v-model="form.id" class="admin-input" type="text" required pattern="[a-z0-9-]+" placeholder="mi-perfume" />
        </label>

        <div class="admin-field-row">
          <label class="admin-field">
            <span>{{ t('admin.nameField') }}</span>
            <input v-model="form.name" class="admin-input" type="text" required />
          </label>
          <label class="admin-field">
            <span>{{ t('admin.brand') }}</span>
            <input v-model="form.brand" class="admin-input" type="text" required />
          </label>
        </div>

        <div class="admin-field-row">
          <label class="admin-field">
            <span>{{ t('admin.category') }}</span>
            <select v-model="form.category" class="admin-select">
              <option v-for="c in CATEGORIES" :key="c" :value="c">{{ t(`filters.${c}`) }}</option>
            </select>
          </label>
          <label class="admin-field">
            <span>{{ t('admin.image') }}</span>
            <input v-model="form.image" class="admin-input" type="text" required placeholder="/perfumes/mi-perfume-1.webp" />
          </label>
        </div>

        <div class="admin-field-row">
          <label class="admin-field">
            <span>{{ t('admin.price') }} (USD)</span>
            <input v-model.number="form.price" class="admin-input" type="number" min="1" step="0.01" required />
          </label>
          <label class="admin-field">
            <span>{{ t('admin.oldPrice') }}</span>
            <input v-model.number="form.oldPrice" class="admin-input" type="number" min="0" step="0.01" />
          </label>
        </div>

        <label class="admin-field">
          <span>{{ t('admin.descEn') }}</span>
          <textarea v-model="form.descEn" class="admin-input"></textarea>
        </label>
        <label class="admin-field">
          <span>{{ t('admin.descEs') }}</span>
          <textarea v-model="form.descEs" class="admin-input"></textarea>
        </label>

        <label v-if="!editingId" class="admin-field">
          <span>{{ t('admin.initialStock') }}</span>
          <input v-model.number="form.stock" class="admin-input" type="number" min="0" required />
        </label>

        <p v-if="formError" class="admin-error">{{ formError }}</p>

        <div class="admin-modal-actions">
          <button type="button" class="admin-btn" @click="showForm = false">
            {{ t('admin.cancel') }}
          </button>
          <button type="submit" class="admin-btn admin-btn--primary" :disabled="saving">
            {{ saving ? t('admin.loading') : t('admin.save') }}
          </button>
        </div>
      </form>
    </div>

    <!-- Modal ajuste de stock -->
    <div v-if="stockProduct" class="admin-modal-overlay" @click.self="stockProduct = null">
      <form class="admin-modal" @submit.prevent="saveStock">
        <h3>{{ t('admin.adjustStock') }} — {{ stockProduct.name }}</h3>
        <p class="admin-note">
          {{ t('admin.stock') }}: <strong>{{ stockProduct.stock ?? 0 }}</strong>
        </p>

        <div class="admin-field-row">
          <label class="admin-field">
            <span>{{ t('admin.delta') }}</span>
            <input v-model.number="stockDelta" class="admin-input" type="number" step="1" required />
          </label>
          <label class="admin-field">
            <span>{{ t('admin.reason') }}</span>
            <select v-model="stockReason" class="admin-select">
              <option value="restock">{{ t('admin.reasonRestock') }}</option>
              <option value="manual">{{ t('admin.reasonManual') }}</option>
            </select>
          </label>
        </div>

        <p v-if="stockError" class="admin-error">{{ stockError }}</p>

        <div class="admin-modal-actions">
          <button type="button" class="admin-btn" @click="stockProduct = null">
            {{ t('admin.cancel') }}
          </button>
          <button type="submit" class="admin-btn admin-btn--primary" :disabled="stockSaving || !Number(stockDelta)">
            {{ stockSaving ? t('admin.loading') : t('admin.save') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.products-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 18px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.product-cell img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--border);
  background-color: #090a0e;
  flex: 0 0 auto;
}

.product-brand {
  display: block;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
}

.product-name {
  display: block;
  font-weight: 600;
}

.product-oldprice {
  margin-left: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.product-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
