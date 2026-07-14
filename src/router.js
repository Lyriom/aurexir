/*
 * Rutas de la tienda.
 *
 * - '/'                 landing + catálogo (pública)
 * - '/login'            acceso / registro
 * - '/account'          mis pedidos (requiere sesión)
 * - '/checkout/success' vuelta de Stripe con pago OK (vacía el carrito)
 * - '/checkout/cancel'  vuelta de Stripe cancelando
 * - '/admin'            panel (requiere role=admin; carga perezosa)
 *
 * Los guards esperan initAuth() para que la sesión restaurada (token en
 * localStorage → GET /auth/me) esté lista antes de decidir.
 */
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import { auth, initAuth, onAuthExpired } from './auth.js'

const routes = [
  { path: '/', name: 'home', component: HomePage },
  {
    path: '/login',
    name: 'login',
    component: () => import('./pages/LoginPage.vue'),
  },
  {
    path: '/account',
    name: 'account',
    component: () => import('./pages/AccountPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/checkout/success',
    name: 'checkout-success',
    component: () => import('./pages/CheckoutSuccessPage.vue'),
  },
  {
    path: '/checkout/cancel',
    name: 'checkout-cancel',
    component: () => import('./pages/CheckoutCancelPage.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('./pages/AdminPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    // Anclas de la landing (#coleccion, #novedades…): scroll suave.
    if (to.hash && to.hash !== '#cart') {
      return { el: to.hash, behavior: 'smooth' }
    }
    if (to.path !== from.path) return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  await initAuth()
  if (to.meta.requiresAuth && !auth.user) {
    return { name: 'login', query: { next: to.fullPath } }
  }
  // La API igual respondería 403; esto solo evita mostrar un panel vacío.
  if (to.meta.requiresAdmin && auth.user?.role !== 'admin') {
    return { name: 'home' }
  }
})

// Sesión expirada (401 en una llamada autenticada): si la página actual
// requiere sesión, manda a /login conservando a dónde volver. En páginas
// públicas basta con quedar como invitado (p. ej. al restaurar un token
// viejo en la landing); los flujos como el checkout redirigen por su cuenta.
onAuthExpired(() => {
  const current = router.currentRoute.value
  if (current.meta.requiresAuth) {
    router.push({ name: 'login', query: { next: current.fullPath } })
  }
})
