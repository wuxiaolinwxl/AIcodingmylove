import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, userApi } from '@/api'
import { useChatStore } from '@/stores/chat'

export interface UserInfo {
  id: number
  username: string
  nickname: string
  email: string | null
  avatarUrl: string | null
  coupleId: number | null
  solarBirthday: string | null
  lunarBirthday: string | null
  lunarIsLeap: boolean
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('ms_token') || '')
  const user = ref<UserInfo | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)
  const isBound = computed(() => !!user.value?.coupleId)

  function setAuth(t: string, u: UserInfo) {
    token.value = t
    user.value = u
    localStorage.setItem('ms_token', t)
  }

  async function login(data: { username: string; password: string }) {
    const res = await authApi.login(data)
    setAuth(res.token, res.user)
    return res
  }

  async function register(data: { username: string; password: string; email?: string; nickname?: string }) {
    const payload: { username: string; password: string; email?: string; nickname?: string } = {
      username: data.username,
      password: data.password,
    }
    if (data.email) payload.email = data.email
    if (data.nickname) payload.nickname = data.nickname
    const res = await authApi.register(payload)
    setAuth(res.token, res.user)
    return res
  }

  async function fetchMe() {
    loading.value = true
    try {
      const u = await authApi.me()
      user.value = u
      return u
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(data: {
    nickname?: string
    solarBirthday?: string | null
    lunarBirthday?: string | null
    lunarIsLeap?: boolean
  }) {
    const u = await userApi.updateMe(data)
    user.value = u
    return u
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('ms_token')
    try { useChatStore().disconnect() } catch { /* ignore */ }
  }

  return { token, user, loading, isLoggedIn, isBound, setAuth, login, register, fetchMe, updateProfile, logout }
})
