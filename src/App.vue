<script setup>
// Landing de una sola página: header + secciones + footer.
import AppHeader from './components/AppHeader.vue'
import HeroSection from './components/HeroSection.vue'
import CatalogSection from './components/CatalogSection.vue'
import BrandSection from './components/BrandSection.vue'
import AppFooter from './components/AppFooter.vue'
</script>

<template>
  <AppHeader />
  <main>
    <HeroSection />
    <CatalogSection />
    <BrandSection />
  </main>
  <AppFooter />
</template>
