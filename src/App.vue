<script setup>
// Shell de la tienda: barra de anuncios + header + página activa + footer.
// El carrito (drawer) vive al nivel raíz para superponerse a todo.
import { onMounted } from 'vue'
import AnnouncementBar from './components/AnnouncementBar.vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import CartDrawer from './components/CartDrawer.vue'
import PromoModal from './components/PromoModal.vue'
import { loadCatalog } from './catalog.js'
import { initAuth } from './auth.js'

onMounted(() => {
  loadCatalog() // catálogo real (precios/stock) desde la API, con fallback local
  initAuth() // restaura la sesión si hay token guardado
})
</script>

<template>
  <AnnouncementBar />
  <AppHeader />
  <main>
    <router-view />
  </main>
  <AppFooter />
  <CartDrawer />
  <PromoModal />
</template>
