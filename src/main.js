import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router.js'
import { injectProductJsonLd } from './seo.js'

createApp(App).use(router).mount('#app')

// Datos estructurados de los productos (schema.org) para SEO / IA.
injectProductJsonLd()
