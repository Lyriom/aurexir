<script setup>
// Selector de idioma EN/ES. Control segmentado compacto para el header.
import { locale, setLocale, t } from '../i18n.js'
</script>

<template>
  <div class="lang" role="group" :aria-label="t('lang.label')">
    <button
      type="button"
      class="lang-btn"
      :class="{ active: locale === 'en' }"
      :aria-pressed="locale === 'en'"
      @click="setLocale('en')"
    >
      EN
    </button>
    <button
      type="button"
      class="lang-btn"
      :class="{ active: locale === 'es' }"
      :aria-pressed="locale === 'es'"
      @click="setLocale('es')"
    >
      ES
    </button>
  </div>
</template>

<style scoped>
.lang {
  display: inline-flex;
  align-items: center;
  padding: 3px;
  gap: 2px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background-color: var(--bg-elevated);
}

.lang-btn {
  min-width: 34px;
  padding: 5px 9px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: color var(--transition), background-color var(--transition);
}

.lang-btn:hover {
  color: var(--hover);
}

.lang-btn.active {
  background-color: var(--accent);
  color: var(--accent-contrast);
}

.lang-btn:focus-visible {
  outline: 2px solid var(--hover);
  outline-offset: 2px;
}
</style>
