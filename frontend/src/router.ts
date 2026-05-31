import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from './stores/user'

import Layout from './views/Layout.vue'

const Login = () => import('./views/Login.vue')
const Register = () => import('./views/Register.vue')
const Bind = () => import('./views/Bind.vue')
const Timeline = () => import('./views/Timeline.vue')
const Chat = () => import('./views/Chat.vue')
const Me = () => import('./views/Me.vue')
const BucketList = () => import('./views/BucketList.vue')
const Anniversary = () => import('./views/Anniversary.vue')
const Games = () => import('./views/Games.vue')

const routes = [
  { path: '/login', component: Login, meta: { public: true } },
  { path: '/register', component: Register, meta: { public: true } },
  { path: '/bind', component: Bind },
  {
    path: '/',
    component: Layout,
    meta: { requireCouple: true },
    children: [
      { path: '', redirect: '/chat' },
      { path: 'timeline', component: Timeline },
      { path: 'chat', component: Chat },
      { path: 'bucket', component: BucketList },
      { path: 'anniversary', component: Anniversary },
      { path: 'game', component: Games },
      { path: 'me', component: Me },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/chat' },
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
    return '/chat'
  }

  return true
})

export default router
