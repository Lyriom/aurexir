<script setup>
// Bloque de confianza de la tienda (texto + 4 features). Textos vía i18n.
import { t } from '../i18n.js'

const features = [
  { titleKey: 'store.f1Title', textKey: 'store.f1Text', icon: 'shield' },
  { titleKey: 'store.f2Title', textKey: 'store.f2Text', icon: 'truck' },
  { titleKey: 'store.f3Title', textKey: 'store.f3Text', icon: 'chat' },
  { titleKey: 'store.f4Title', textKey: 'store.f4Text', icon: 'tag' },
]
</script>

<template>
  <section id="tienda" class="section store">
    <div class="container store-inner">
      <div class="store-copy">
        <span class="eyebrow">{{ t('store.eyebrow') }}</span>
        <h2 class="store-title">{{ t('store.title') }}</h2>
        <p class="store-text">{{ t('store.text') }}</p>
      </div>

      <div class="store-features">
        <article v-for="f in features" :key="f.titleKey" class="feature">
          <div class="feature-icon" aria-hidden="true">
            <svg v-if="f.icon === 'shield'" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.4-3 8.3-7 9.5C8 19.3 5 15.4 5 11V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
            <svg v-else-if="f.icon === 'truck'" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>
            <svg v-else-if="f.icon === 'chat'" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4z" /><path d="M8 9h8M8 12h5" /></svg>
            <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12l-8 8-9-9V3h8z" /><circle cx="8" cy="7" r="1.4" /></svg>
          </div>
          <div>
            <h3 class="feature-title">{{ t(f.titleKey) }}</h3>
            <p class="feature-text">{{ t(f.textKey) }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.store {
  background:
    radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--bronce) 8%, transparent), transparent 42%),
    var(--bg);
}

.store-inner {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 56px;
  align-items: center;
}

.store-title {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 600;
  margin-bottom: 16px;
}

.store-text {
  color: var(--text-secondary);
  font-size: 1.02rem;
  margin: 0;
}

.store-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.feature {
  display: flex;
  gap: 14px;
  padding: 22px 20px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  transition: transform var(--transition), border-color var(--transition);
}

.feature:hover {
  transform: translateY(-4px);
  border-color: var(--hover);
}

.feature-icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background-color: color-mix(in srgb, var(--bronce) 14%, transparent);
  color: var(--accent);
  transition: color var(--transition), background-color var(--transition);
}

.feature:hover .feature-icon {
  color: var(--hover);
  background-color: color-mix(in srgb, var(--cian) 12%, transparent);
}

.feature-title {
  font-size: 1.02rem;
  font-weight: 600;
  margin: 2px 0 6px;
}

.feature-text {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
}

@media (max-width: 880px) {
  .store-inner {
    grid-template-columns: 1fr;
    gap: 36px;
  }
}

@media (max-width: 520px) {
  .store-features {
    grid-template-columns: 1fr;
  }
}
</style>
