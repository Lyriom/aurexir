<script setup>
// Banner principal de la tienda. Textos vía i18n; stats derivados del catálogo.
import { computed } from 'vue'
import { t } from '../i18n.js'
import { products } from '../data/products.js'

const productCount = products.length
const brandCount = computed(() => new Set(products.map((p) => p.brand)).size)

// Producto destacado del banner (nicho, buena foto).
const featured = products.find((p) => p.id === 'althair') || products[0]
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
          <a href="#best" class="btn btn-ghost">{{ t('hero.ctaEssence') }}</a>
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
        <div class="hero-stage">
          <img :src="featured.image" :alt="featured.name" class="hero-bottle" />
        </div>
        <div class="hero-badge">
          <span class="hero-badge-dot"></span>
          {{ t('hero.badge') }}
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
  padding: 76px 0 88px;
  background:
    radial-gradient(
      circle at 82% 0%,
      color-mix(in srgb, var(--bronce) 18%, transparent),
      transparent 46%
    ),
    radial-gradient(
      circle at 0% 100%,
      color-mix(in srgb, var(--cian) 8%, transparent),
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
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 500px;
  margin-bottom: 32px;
}

.hero-cta {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 44px;
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

/* Visual con botella destacada */
.hero-visual {
  position: relative;
  min-height: 460px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-stage {
  position: relative;
  z-index: 1;
  width: min(100%, 420px);
  aspect-ratio: 4 / 5;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background-color: #090a0e;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.hero-bottle {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-badge {
  position: absolute;
  z-index: 2;
  bottom: 26px;
  left: -14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 600;
  box-shadow: var(--shadow);
}

.hero-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--cian);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--cian) 30%, transparent);
}

.hero-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(14px);
  z-index: 0;
}

.hero-blob--gold {
  inset: 10px -30px auto auto;
  width: 240px;
  height: 240px;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--bronce) 34%, transparent),
    transparent 70%
  );
}

.hero-blob--cyan {
  inset: auto auto -20px -20px;
  width: 190px;
  height: 190px;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--cian) 24%, transparent),
    transparent 70%
  );
}

@media (max-width: 880px) {
  .hero {
    padding: 40px 0 56px;
  }
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  /* El titular y el CTA van primero; la foto queda debajo. */
  .hero-visual {
    min-height: 0;
    order: 0;
  }
  .hero-stage {
    width: min(100%, 360px);
  }
  .hero-badge {
    left: 6px;
    bottom: 16px;
  }
}
</style>
