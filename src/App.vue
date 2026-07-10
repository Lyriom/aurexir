<script setup>
// Tienda de una sola página: barra de anuncios + header + secciones + footer.
// El carrito (drawer) vive al nivel raíz para superponerse a todo.
import AnnouncementBar from './components/AnnouncementBar.vue'
import AppHeader from './components/AppHeader.vue'
import HeroSection from './components/HeroSection.vue'
import BrandStrip from './components/BrandStrip.vue'
import CatalogSection from './components/CatalogSection.vue'
import StoreIntro from './components/StoreIntro.vue'
import AppFooter from './components/AppFooter.vue'
import CartDrawer from './components/CartDrawer.vue'
</script>

<template>
  <AnnouncementBar />
  <AppHeader />
  <main>
    <HeroSection />
    <BrandStrip />
    <CatalogSection />
    <StoreIntro />
  </main>
  <AppFooter />
  <CartDrawer />
</template>
