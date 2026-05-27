<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-cream-50">
    <div class="w-full max-w-sm animate-fade-up">
      <div class="flex items-center gap-2 mb-8 justify-center">
        <Heart :size="20" class="text-rose-500" fill="#D85667" />
        <span class="text-sm font-medium tracking-wide uppercase text-ink-700">Memory Space</span>
      </div>

      <h2 class="text-2xl font-bold text-ink-900">创建账号</h2>
      <p class="text-ink-500 text-sm mt-1 mb-6">注册后邀请你的伴侣加入</p>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div class="relative">
          <UserIcon :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input v-model="form.username" type="text" placeholder="用户名 (3-64位)" class="input !pl-10" />
        </div>

        <div class="relative">
          <Smile :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input v-model="form.nickname" type="text" placeholder="昵称 (可选)" class="input !pl-10" />
        </div>

        <div class="relative">
          <Mail :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input v-model="form.email" type="email" placeholder="邮箱 (可选)" class="input !pl-10" />
        </div>

        <div class="relative">
          <Lock :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            v-model="form.password"
            :type="showPwd ? 'text' : 'password'"
            placeholder="密码 (至少6位)"
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
          {{ loading ? '注册中' : '注册' }}
        </button>
      </form>

      <p class="text-center text-sm text-ink-500 mt-6">
        已有账号？<router-link to="/login" class="text-rose-500 hover:text-rose-600 font-medium">去登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Heart, User as UserIcon, Lock, Eye, EyeOff, Mail, Smile, AlertCircle, Loader2 } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = ref({ username: '', password: '', email: '', nickname: '' })
const showPwd = ref(false)
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    await userStore.register(form.value)
    router.push('/bind')
  } catch (e: any) {
    error.value = e?.response?.data?.message || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>
