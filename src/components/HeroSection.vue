<script setup>
// Sección de presentación de la marca. Textos vía i18n; stats derivados del catálogo.
import { computed } from 'vue'
import { t } from '../i18n.js'
import { products } from '../data/products.js'

const productCount = products.length
const brandCount = computed(() => new Set(products.map((p) => p.brand)).size)
</script>

<template>
  <section id="inicio" class="hero">
    <div class="container hero-inner">
      <div class="hero-copy">
        <span class="eyebrow">{{ t('hero.eyebrow') }}</span>
        <h1 class="hero-title">
          {{ t('hero.titleLead') }} <span class="accent">{{ t('hero.titleAccent') }}</span>.
        </h1>
        <p class="hero-text">{{ t('hero.text') }}</p>
        <div class="hero-cta">
          <a href="#coleccion" class="btn btn-primary">{{ t('hero.ctaCollection') }}</a>
          <a href="#esencia" class="btn btn-ghost">{{ t('hero.ctaEssence') }}</a>
        </div>

        <div class="hero-stats">
          <div class="stat">
            <strong class="gold-text">{{ productCount }}</strong>
            <span>{{ t('hero.statFragrances') }}</span>
          </div>
          <div class="stat">
            <strong class="gold-text">{{ brandCount }}</strong>
            <span>{{ t('hero.statHouses') }}</span>
          </div>
          <div class="stat">
            <strong class="gold-text">24/7</strong>
            <span>{{ t('hero.statOrders') }}</span>
          </div>
        </div>
      </div>

      <div class="hero-visual" aria-hidden="true">
        <div class="hero-card">
          <img src="/logo-mark.svg" alt="" class="hero-logo" />
          <span class="hero-card-word gold-text">AUREXIR</span>
          <span class="hero-card-sub">Parfum Homme</span>
        </div>
        <div class="hero-blob hero-blob--gold"></div>
        <div class="hero-blob hero-blob--cyan"></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  padding: 84px 0 96px;
  background:
    radial-gradient(
      circle at 82% 0%,
      color-mix(in srgb, var(--bronce) 16%, transparent),
      transparent 46%
    ),
    radial-gradient(
      circle at 0% 100%,
      color-mix(in srgb, var(--cian) 7%, transparent),
      transparent 38%
    ),
    var(--bg);
}

.hero-inner {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 56px;
  align-items: center;
}

.hero-title {
  font-size: clamp(2.4rem, 5vw, 3.7rem);
  font-weight: 600;
  margin-bottom: 22px;
}

.accent {
  color: var(--accent);
}

.hero-text {
  font-size: 1.12rem;
  color: var(--text-secondary);
  max-width: 500px;
  margin-bottom: 32px;
}

.hero-cta {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 48px;
}

.hero-stats {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}

.stat strong {
  display: block;
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 700;
}

.stat span {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* Visual */
.hero-visual {
  position: relative;
  min-height: 440px;
}

.hero-card {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}

.hero-logo {
  width: 58%;
  max-width: 250px;
}

.hero-card-word {
  font-family: var(--font-display);
  font-size: 1.7rem;
  font-weight: 500;
  letter-spacing: 0.34em;
  margin-right: -0.34em;
}

.hero-card-sub {
  font-size: 0.72rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-right: -0.3em;
}

.hero-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(12px);
  z-index: -1;
}

.hero-blob--gold {
  inset: 20px -40px auto auto;
  width: 240px;
  height: 240px;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--bronce) 32%, transparent),
    transparent 70%
  );
}

.hero-blob--cyan {
  inset: auto auto -30px -30px;
  width: 190px;
  height: 190px;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--cian) 22%, transparent),
    transparent 70%
  );
}

@media (max-width: 880px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .hero-visual {
    display: none;
  }
}
</style>
