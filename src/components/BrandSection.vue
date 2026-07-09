<script setup>
// "La casa": pilares de marca. Textos vía i18n.
import { t } from '../i18n.js'

const pillars = [
  { titleKey: 'brand.pillars.p1Title', textKey: 'brand.pillars.p1Text', icon: 'drop' },
  { titleKey: 'brand.pillars.p2Title', textKey: 'brand.pillars.p2Text', icon: 'hex' },
  { titleKey: 'brand.pillars.p3Title', textKey: 'brand.pillars.p3Text', icon: 'spark' },
]
</script>

<template>
  <section id="esencia" class="section brand">
    <div class="container">
      <header class="brand-head">
        <span class="eyebrow">{{ t('brand.eyebrow') }}</span>
        <h2 class="brand-title">{{ t('brand.title') }}</h2>
        <p class="brand-sub">{{ t('brand.subtitle') }}</p>
      </header>

      <div class="pillars">
        <article v-for="pillar in pillars" :key="pillar.titleKey" class="pillar">
          <div class="pillar-icon" aria-hidden="true">
            <!-- Gota -->
            <svg v-if="pillar.icon === 'drop'" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
              <path d="M12 3c3.5 4.4 6 7.6 6 10.6A6 6 0 0 1 6 13.6C6 10.6 8.5 7.4 12 3z" />
            </svg>
            <!-- Hexágono -->
            <svg v-else-if="pillar.icon === 'hex'" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
              <path d="M12 2.5l8 4.75v9.5L12 21.5l-8-4.75v-9.5L12 2.5z" />
              <path d="M12 6v12" opacity="0.45" />
            </svg>
            <!-- Destello -->
            <svg v-else viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3z" />
            </svg>
          </div>
          <h3 class="pillar-title">{{ t(pillar.titleKey) }}</h3>
          <p class="pillar-text">{{ t(pillar.textKey) }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.brand {
  background:
    radial-gradient(
      circle at 50% 0%,
      color-mix(in srgb, var(--bronce) 8%, transparent),
      transparent 42%
    ),
    var(--bg);
}

.brand-head {
  max-width: 560px;
  margin: 0 auto 56px;
  text-align: center;
}

.brand-title {
  font-size: clamp(1.9rem, 4vw, 2.6rem);
  font-weight: 600;
  margin-bottom: 14px;
}

.brand-sub {
  color: var(--text-muted);
  margin: 0;
}

.pillars {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.pillar {
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 30px 26px;
  transition: transform var(--transition), border-color var(--transition);
}

.pillar:hover {
  transform: translateY(-4px);
  border-color: var(--hover);
}

.pillar-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background-color: color-mix(in srgb, var(--bronce) 14%, transparent);
  color: var(--accent);
  margin-bottom: 18px;
  transition: color var(--transition), background-color var(--transition);
}

.pillar:hover .pillar-icon {
  color: var(--hover);
  background-color: color-mix(in srgb, var(--cian) 12%, transparent);
}

.pillar-title {
  font-size: 1.12rem;
  font-weight: 600;
  margin-bottom: 10px;
}

.pillar-text {
  color: var(--text-muted);
  font-size: 0.94rem;
  margin: 0;
}

@media (max-width: 880px) {
  .pillars {
    grid-template-columns: 1fr;
  }
}
</style>
