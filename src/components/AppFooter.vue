<script setup>
// Footer. Textos vía i18n; la info de contacto/enlaces se podrá alimentar luego.
import { t } from '../i18n.js'
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <div class="footer-logo">
          <img src="/logo-mark.svg" alt="AUREXIR" />
          <span class="footer-word gold-text">AUREXIR</span>
        </div>
        <p>{{ t('footer.text') }}</p>
      </div>

      <div class="footer-col">
        <h4>{{ t('footer.shopTitle') }}</h4>
        <a href="#coleccion">{{ t('footer.shopCollection') }}</a>
        <a href="#coleccion">{{ t('footer.shopNew') }}</a>
        <a href="#coleccion">{{ t('footer.shopBest') }}</a>
      </div>

      <div class="footer-col">
        <h4>{{ t('footer.followTitle') }}</h4>
        <a
          href="https://www.instagram.com/lyriom__"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram @lyriom__"
          >@lyriom__</
        >
      </div>
    </div>

    <div class="footer-bottom">
      <div class="container footer-bottom-inner">
        <span>© {{ year }} AUREXIR. {{ t('footer.rights') }}</span>
        <span class="footer-soft">{{ t('footer.soft') }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: var(--bg-elevated);
  border-top: 1px solid var(--border);
}

.footer-inner {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr;
  gap: 40px;
  padding: 64px 24px 48px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.footer-logo img {
  height: 52px;
  width: auto;
}

.footer-word {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 500;
  letter-spacing: 0.3em;
  margin-right: -0.3em;
}

.footer-brand p {
  color: var(--text-muted);
  max-width: 320px;
  margin: 0;
}

.footer-col h4 {
  font-size: 0.95rem;
  margin: 0 0 16px;
  color: var(--text-secondary);
}

.footer-col a {
  display: block;
  color: var(--text-muted);
  font-size: 0.92rem;
  padding: 5px 0;
  transition: color var(--transition);
}

.footer-col a:hover {
  color: var(--hover);
}

.footer-bottom {
  border-top: 1px solid var(--border);
}

.footer-bottom-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 22px 24px;
  font-size: 0.85rem;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.footer-soft {
  color: var(--accent);
}

@media (max-width: 760px) {
  .footer-inner {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
}

@media (max-width: 440px) {
  .footer-inner {
    grid-template-columns: 1fr;
  }
}
</style>
