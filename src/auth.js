/*
 * Sesión del usuario (equivalente a un AuthContext).
 *
 * - auth.user:  { id, email, name, role } o null. role: 'customer' | 'admin'.
 * - initAuth(): restaura la sesión al recargar (GET /auth/me con el token
 *               guardado). El router la espera antes de resolver guards.
 * - login/register/logout: gestionan token (localStorage) + usuario.
 * - Si cualquier endpoint autenticado devuelve 401, api.js limpia el token y
 *   este módulo borra el usuario; el router manda a /login si la ruta lo exige.
 */
import { reactive, computed } from 'vue'
import { api, getToken, setToken, onSessionExpired } from './api.js'

export const auth = reactive({
  user: null,
  ready: false, // true cuando ya se intentó restaurar la sesión
})

export const isAdmin = computed(() => auth.user?.role === 'admin')

let initPromise = null

export function initAuth() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    if (getToken()) {
      try {
        auth.user = await api.me()
      } catch {
        // Token inválido/expirado o API caída: seguimos como invitado.
        auth.user = null
      }
    }
    auth.ready = true
  })()
  return initPromise
}

export async function login({ email, password }) {
  const res = await api.login({ email, password })
  setToken(res.access_token)
  auth.user = res.user
  return res.user
}

export async function register({ email, password, name }) {
  const res = await api.register({ email, password, name })
  setToken(res.access_token)
  auth.user = res.user
  return res.user
}

export function logout() {
  setToken(null)
  auth.user = null
}

// El redirect a /login lo añade el router (necesita la ruta actual).
let expiredHandler = null
export function onAuthExpired(fn) {
  expiredHandler = fn
}

onSessionExpired(() => {
  auth.user = null
  if (expiredHandler) expiredHandler()
})
