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
}

bootstrap()
