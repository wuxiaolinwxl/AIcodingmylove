<template>
  <div class="min-h-screen flex">
    <!-- Left panel (desktop only) -->
    <div class="hidden lg:flex lg:w-3/5 bg-white flex-col justify-between p-12 relative overflow-hidden">
      <div class="flex items-center gap-2">
        <Heart :size="22" class="text-rose-500" fill="#D85667" />
        <span class="text-sm font-medium tracking-wide uppercase text-ink-700">Memory Space</span>
      </div>

      <div class="max-w-lg">
        <h1 class="text-5xl lg:text-6xl font-bold text-ink-900 leading-tight">
          为我们留下<br />
          <span class="handwrite text-rose-500 text-7xl lg:text-8xl">每一刻</span>
        </h1>
        <p class="mt-6 text-ink-500 text-base leading-relaxed">
          一个只属于两个人的角落 —— 把照片、视频、歌曲与文字按时间轴温柔收藏，并在这里继续聊天。
        </p>
      </div>

      <p class="text-xs text-ink-300">&copy; Memory Space · 双人记忆空间</p>
    </div>

    <!-- Right panel (form) -->
    <div class="flex-1 flex items-center justify-center p-6 bg-cream-50">
      <div class="w-full max-w-sm animate-fade-up">
        <!-- Mobile logo -->
        <div class="lg:hidden flex items-center gap-2 mb-8 justify-center">
          <Heart :size="20" class="text-rose-500" fill="#D85667" />
          <span class="text-sm font-medium tracking-wide uppercase text-ink-700">Memory Space</span>
        </div>

        <h2 class="text-2xl font-bold text-ink-900">欢迎回来</h2>
        <p class="text-ink-500 text-sm mt-1 mb-6">登录以进入我们的小空间</p>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="relative">
            <UserIcon :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              v-model="form.username"
              type="text"
              placeholder="用户名"
              class="input !pl-10"
            />
          </div>

          <div class="relative">
            <Lock :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              placeholder="密码"
              class="input !pl-10 !pr-10"
            />
            <button
              type="button"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-700"
              @click="showPwd = !showPwd"
            >
              <Eye v-if="!showPwd" :size="16" />
              <EyeOff v-else :size="16" />
            </button>
          </div>

          <div v-if="error" class="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-100 rounded-lg">
            <AlertCircle :size="14" class="text-rose-500 flex-shrink-0" />
            <span class="text-xs text-rose-600">{{ error }}</span>
          </div>

          <button type="submit" class="btn-primary w-full !py-3" :disabled="loading">
            <Loader2 v-if="loading" :size="16" class="animate-spin" />
            {{ loading ? '登录中' : '登录' }}
          </button>
        </form>

        <p class="text-center text-sm text-ink-500 mt-6">
          还没有账号？<router-link to="/register" class="text-rose-500 hover:text-rose-600 font-medium">立即注册</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Heart, User as UserIcon, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = ref({ username: '', password: '' })
const showPwd = ref(false)
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await userStore.login(form.value)
    if (userStore.isBound) {
      router.push('/timeline')
    } else {
      router.push('/bind')
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>
