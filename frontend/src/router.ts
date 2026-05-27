import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from './stores/user'

import Login from './views/Login.vue'
import Register from './views/Register.vue'
import Bind from './views/Bind.vue'
import Layout from './views/Layout.vue'
import Timeline from './views/Timeline.vue'
import Chat from './views/Chat.vue'
import Me from './views/Me.vue'

const routes = [
  { path: '/login', component: Login, meta: { public: true } },
  { path: '/register', component: Register, meta: { public: true } },
  { path: '/bind', component: Bind },
  {
    path: '/',
    component: Layout,
    meta: { requireCouple: true },
    children: [
      { path: '', redirect: '/timeline' },
      { path: 'timeline', component: Timeline },
      { path: 'chat', component: Chat },
      { path: 'me', component: Me },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/timeline' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const user = useUserStore()

  if (to.meta.public) return true

  if (!user.token) return '/login'

  if (!user.user) {
    try {
      await user.fetchMe()
    } catch {
      user.logout()
      return '/login'
    }
  }

  if (to.meta.requireCouple && !user.isBound) {
    return '/bind'
  }

  if (to.path === '/bind' && user.isBound) {
    return '/timeline'
  }

  return true
})

export default router
