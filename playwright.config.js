import { defineConfig, devices } from '@playwright/test'

/*
 * Suite E2E de QA (ver qa/e2e). Levanta el dev server de Vite y ejecuta los
 * casos ✅ documentados en qa/. El backend se simula por interceptación de red
 * (qa/e2e/mock), así que la suite es autocontenida: no necesita la API real.
 *
 * Usa el Google Chrome instalado (channel: 'chrome') para no descargar
 * navegadores de Playwright.
 */
export default defineConfig({
  testDir: './qa/e2e',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'qa/e2e/report', open: 'never' }]],
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'chrome',
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
