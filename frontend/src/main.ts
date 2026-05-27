import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/main.css'

async function bootstrap() {
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('demo')) {
    const { setupDemoMode } = await import('./demo')
    setupDemoMode()
  }

  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.mount('#app')

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('SW register failed', e))
    navigator.serviceWorker.addEventListener('message', (ev) => {
      const data = ev.data
      if (data && data.type === 'navigate' && typeof data.url === 'string') {
        router.push(data.url).catch(() => {})
      }
    })
  }
}

bootstrap()
