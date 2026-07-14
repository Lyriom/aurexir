<script setup>
// Acceso y registro de clientes (JWT). El backend crea siempre role="customer";
// el admin entra por aquí con sus credenciales y ve además el panel.
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { t } from '../i18n.js'
import { auth, login, register } from '../auth.js'
import { ApiError, apiErrorMessage } from '../api.js'

const route = useRoute()
const router = useRouter()

const mode = ref('login') // 'login' | 'register'
const email = ref('')
const name = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const isLogin = computed(() => mode.value === 'login')

// A dónde volver tras entrar (p. ej. /account o /#cart desde el carrito).
function goNext() {
  const next = typeof route.query.next === 'string' ? route.query.next : '/'
  router.replace(next || '/')
}

// Si ya hay sesión (o se restaura mientras estamos aquí), salir del login.
watch(
  () => auth.user,
  (user) => {
    if (user) goNext()
  },
  { immediate: true }
)

function switchMode() {
  mode.value = isLogin.value ? 'register' : 'login'
  error.value = ''
}

async function onSubmit() {
  error.value = ''
  if (!isLogin.value && password.value.length < 8) {
    error.value = t('auth.passwordHint')
    return
  }
  loading.value = true
  try {
    if (isLogin.value) {
      await login({ email: email.value.trim(), password: password.value })
    } else {
      await register({
        email: email.value.trim(),
        password: password.value,
        name: name.value.trim(),
      })
    }
    goNext()
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      error.value = t('auth.invalidCredentials')
    } else {
      error.value = apiErrorMessage(e)
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="section auth-page">
    <div class="container auth-wrap">
      <form class="auth-card" @submit.prevent="onSubmit">
        <img src="/logo-mark.svg" alt="" class="auth-logo" />
        <h1 class="auth-title">{{ isLogin ? t('auth.loginTitle') : t('auth.registerTitle') }}</h1>
        <p class="auth-sub">{{ isLogin ? t('auth.loginSub') : t('auth.registerSub') }}</p>

        <label v-if="!isLogin" class="auth-field">
          <span>{{ t('auth.name') }}</span>
          <input v-model="name" type="text" required autocomplete="name" />
        </label>

        <label class="auth-field">
          <span>{{ t('auth.email') }}</span>
          <input v-model="email" type="email" required autocomplete="email" />
        </label>

        <label class="auth-field">
          <span>{{ t('auth.password') }}</span>
          <input
            v-model="password"
            type="password"
            required
            :minlength="isLogin ? undefined : 8"
            :autocomplete="isLogin ? 'current-password' : 'new-password'"
          />
          <small v-if="!isLogin" class="auth-hint">{{ t('auth.passwordHint') }}</small>
        </label>

        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>

        <button type="submit" class="btn btn-primary auth-submit" :disabled="loading">
          {{ loading ? t('auth.working') : isLogin ? t('auth.loginBtn') : t('auth.registerBtn') }}
        </button>

        <button type="button" class="auth-switch" @click="switchMode">
          {{ isLogin ? t('auth.toRegister') : t('auth.toLogin') }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - var(--header-h) - 120px);
  display: flex;
  align-items: center;
}

.auth-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
}

.auth-card {
  width: min(420px, 100%);
  padding: 36px 32px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}

.auth-logo {
  height: 48px;
  margin: 0 auto 14px;
}

.auth-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 6px;
}

.auth-sub {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0 0 24px;
}

.auth-field {
  display: block;
  margin-bottom: 16px;
}

.auth-field span {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.auth-field input {
  width: 100%;
  height: 46px;
  padding: 0 16px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background-color: var(--bg);
  color: var(--text);
  font-family: inherit;
  font-size: 0.95rem;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.auth-field input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
}

.auth-hint {
  display: block;
  margin-top: 5px;
  font-size: 0.76rem;
  color: var(--text-muted);
}

.auth-error {
  margin: 0 0 14px;
  font-size: 0.86rem;
  color: #e07070;
}

.auth-submit {
  width: 100%;
  margin-bottom: 14px;
}

.auth-submit:disabled {
  opacity: 0.7;
  cursor: wait;
}

.auth-switch {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  color: var(--hover);
  font-family: inherit;
  font-size: 0.86rem;
  cursor: pointer;
  padding: 4px;
  text-align: center;
}

.auth-switch:hover {
  text-decoration: underline;
}
</style>
