<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-cream-50">
    <div class="card w-full max-w-lg !p-8 animate-fade-up">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 mb-3">
          <Users :size="22" class="text-rose-500" />
        </div>
        <p class="text-xs text-ink-500 uppercase tracking-widest mb-1">建立双人空间</p>
        <h2 class="text-xl font-bold text-ink-900">邀请你的伴侣</h2>
      </div>

      <!-- Tabs -->
      <div class="grid grid-cols-2 gap-1 p-1 bg-cream-100 rounded-xl mb-6">
        <button
          @click="tab = 'generate'"
          :class="['flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'generate' ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-700']"
        >
          <Send :size="14" />
          生成邀请码
        </button>
        <button
          @click="tab = 'input'"
          :class="['flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'input' ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-700']"
        >
          <KeyRound :size="14" />
          我有邀请码
        </button>
      </div>

      <!-- Generate panel -->
      <div v-if="tab === 'generate'" class="space-y-4">
        <div v-if="!inviteCode">
          <button @click="handleGenerate" class="btn-primary w-full" :disabled="generating">
            <Sparkles :size="16" />
            {{ generating ? '生成中...' : '生成新的邀请码' }}
          </button>
        </div>
        <div v-else class="bg-cream-50 border border-cream-200 rounded-xl p-6 text-center">
          <p class="text-[10px] text-ink-500 uppercase tracking-widest mb-2">Invitation Code</p>
          <p class="text-4xl tracking-[0.4em] font-mono font-bold text-ink-900">{{ inviteCode }}</p>
          <div class="flex items-center justify-center gap-1 mt-3 text-xs text-ink-500">
            <Clock :size="12" />
            <span>有效期至 {{ formatExpiry(inviteExpiresAt) }}</span>
          </div>
        </div>
        <div v-if="inviteCode" class="flex gap-3">
          <button @click="copyCode" class="btn-secondary flex-1">
            <Copy :size="14" />
            {{ copied ? '已复制' : '复制' }}
          </button>
          <button @click="handleGenerate" class="btn-secondary flex-1">
            <RotateCw :size="14" />
            重新生成
          </button>
        </div>
      </div>

      <!-- Input panel -->
      <div v-if="tab === 'input'" class="space-y-4">
        <input
          v-model="inputCode"
          type="text"
          placeholder="输入8位邀请码"
          maxlength="8"
          class="input text-center text-xl tracking-[0.3em] font-mono uppercase !py-3"
        />
        <button @click="handleAccept" class="btn-primary w-full" :disabled="accepting || inputCode.length < 8">
          <Heart v-if="!accepting" :size="16" fill="white" />
          <Loader2 v-else :size="16" class="animate-spin" />
          {{ accepting ? '绑定中...' : '完成绑定' }}
        </button>
        <div v-if="acceptError" class="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-100 rounded-lg">
          <AlertCircle :size="14" class="text-rose-500 flex-shrink-0" />
          <span class="text-xs text-rose-600">{{ acceptError }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="divider"></div>
      <div class="flex items-center justify-between">
        <span class="text-xs text-ink-500">当前账户: {{ userStore.user?.nickname || userStore.user?.username }}</span>
        <button @click="handleLogout" class="btn-ghost text-xs !px-2 !py-1">
          <LogOut :size="12" />
          退出
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Users, Send, KeyRound, Sparkles, Clock, Copy, RotateCw, Heart, Loader2, AlertCircle, LogOut } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useCoupleStore } from '@/stores/couple'

const router = useRouter()
const userStore = useUserStore()
const coupleStore = useCoupleStore()

const tab = ref<'generate' | 'input'>('generate')
const generating = ref(false)
const inviteCode = ref('')
const inviteExpiresAt = ref('')
const inputCode = ref('')
const accepting = ref(false)
const acceptError = ref('')
const copied = ref(false)

function formatExpiry(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function handleGenerate() {
  generating.value = true
  try {
    const res = await coupleStore.createInvite()
    inviteCode.value = res.code
    inviteExpiresAt.value = res.expiresAt
  } finally {
    generating.value = false
  }
}

async function copyCode() {
  await navigator.clipboard.writeText(inviteCode.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

async function handleAccept() {
  acceptError.value = ''
  accepting.value = true
  try {
    await coupleStore.accept(inputCode.value.toUpperCase())
    await userStore.fetchMe()
    router.push('/timeline')
  } catch (e: any) {
    acceptError.value = e?.response?.data?.message || '绑定失败，请重试'
  } finally {
    accepting.value = false
  }
}

function handleLogout() {
  userStore.logout()
  coupleStore.clear()
  router.replace('/login')
}
</script>
