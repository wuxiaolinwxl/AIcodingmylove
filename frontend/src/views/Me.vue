<template>
  <div class="flex-1 overflow-y-auto pb-20 md:pb-8">
    <div class="max-w-2xl mx-auto px-4 pt-6 md:pt-10 pb-24 md:pb-10">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-ink-900">个人中心</h1>
          <p class="text-sm text-ink-500 mt-1">{{ coupleStore.info?.spaceName || '我们的空间' }}</p>
        </div>
        <button @click="handleLogout" class="btn-icon" title="退出登录">
          <LogOut :size="20" />
        </button>
      </div>

      <!-- Days together card -->
      <div class="card !p-6 text-center mb-4">
        <div class="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3">
          <Heart :size="20" class="text-rose-500" />
        </div>
        <template v-if="daysCount !== null">
          <p class="text-xs text-ink-500 mb-1">Together for</p>
          <p class="text-4xl font-bold text-ink-900">{{ daysCount }} <span class="text-lg font-normal">天</span></p>
          <p class="text-xs text-ink-500 mt-2">自 {{ formatAnniversary(coupleStore.info?.anniversaryDate) }}</p>
        </template>
        <template v-else>
          <p class="text-sm text-ink-700">还未设置纪念日</p>
          <p class="text-xs text-ink-500 mt-1">设置后可查看共度时光</p>
        </template>
      </div>

      <!-- Members card -->
      <div class="card !p-5 mb-4">
        <div class="flex items-center">
          <div class="flex-1 flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-cream-100 border border-cream-200 flex items-center justify-center text-sm font-medium text-ink-700 overflow-hidden">
              <img v-if="userStore.user?.avatarUrl" :src="userStore.user.avatarUrl" class="w-full h-full object-cover" />
              <span v-else>{{ (userStore.user?.nickname || userStore.user?.username || '').charAt(0) }}</span>
            </div>
            <div>
              <p class="text-sm font-medium text-ink-900">{{ userStore.user?.nickname || userStore.user?.username }}</p>
              <p class="text-xs text-ink-500">我</p>
            </div>
          </div>
          <Heart :size="14" class="text-rose-400 mx-4" />
          <div class="flex-1 flex items-center gap-3 justify-end">
            <div class="text-right">
              <p class="text-sm font-medium text-ink-900">{{ partnerName }}</p>
              <p class="text-xs text-ink-500">TA</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-cream-100 border border-cream-200 flex items-center justify-center text-sm font-medium text-ink-700 overflow-hidden">
              <img v-if="partner?.avatarUrl" :src="partner.avatarUrl" class="w-full h-full object-cover" />
              <span v-else>{{ partnerName.charAt(0) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-5 gap-3 mb-4">
        <div v-for="s in stats" :key="s.type" class="card !p-3 text-center">
          <component :is="s.icon" :size="18" :stroke-width="1.7" class="mx-auto mb-1 text-ink-500" />
          <p class="text-lg font-bold text-ink-900">{{ s.count }}</p>
          <p class="text-[10px] text-ink-500">{{ s.label }}</p>
        </div>
      </div>

      <!-- Settings card -->
      <div class="card !p-5 mb-4">
        <div class="flex items-center gap-2 mb-4">
          <Settings :size="16" class="text-ink-500" />
          <h3 class="text-sm font-bold text-ink-900">空间设置</h3>
        </div>
        <div class="space-y-3">
          <div>
            <label class="text-xs text-ink-500 mb-1 block">空间名称</label>
            <input v-model="settingsForm.spaceName" class="input" placeholder="我们的空间" />
          </div>
          <div>
            <label class="text-xs text-ink-500 mb-1 block">纪念日</label>
            <input v-model="settingsForm.anniversaryDate" type="date" class="input" />
          </div>
          <button @click="saveSettings" class="btn-primary w-full" :disabled="saving">
            <Loader2 v-if="saving" :size="14" class="animate-spin" />
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>

      <!-- Notification settings -->
      <div class="card !p-5 mb-4">
        <div class="flex items-center gap-2 mb-3">
          <Bell :size="16" class="text-ink-500" />
          <h3 class="text-sm font-bold text-ink-900">消息提醒</h3>
        </div>
        <p class="text-xs text-ink-500 mb-3">开启后，TA 给你发消息时即使应用没打开也会收到通知。</p>
        <div v-if="!pushSupported" class="text-xs text-rose-500 mb-3">当前浏览器不支持 Web 推送。建议把网页"添加到主屏幕"再试。</div>
        <div v-else-if="!isHttps" class="text-xs text-rose-500 mb-3">推送需要 HTTPS（或 localhost），当前为 HTTP 环境。</div>
        <div class="flex items-center justify-between">
          <span :class="['text-sm', pushEnabled ? 'text-emerald-600' : 'text-ink-700']">
            {{ pushStatusLabel }}
          </span>
          <button
            v-if="!pushEnabled"
            @click="enablePush"
            class="btn-primary !py-1.5 !px-3 text-xs"
            :disabled="pushBusy || !pushSupported || !isHttps"
          >
            <Loader2 v-if="pushBusy" :size="12" class="animate-spin" />
            {{ pushBusy ? '处理中...' : '开启提醒' }}
          </button>
          <button
            v-else
            @click="disablePush"
            class="btn-ghost !py-1.5 !px-3 text-xs"
            :disabled="pushBusy"
          >
            <Loader2 v-if="pushBusy" :size="12" class="animate-spin" />
            {{ pushBusy ? '处理中...' : '关闭提醒' }}
          </button>
        </div>
        <p v-if="pushError" class="text-xs text-rose-500 mt-2">{{ pushError }}</p>
      </div>

      <!-- About + logout -->
      <div class="card !p-0 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-cream-200">
          <div class="flex items-center gap-2">
            <Info :size="16" class="text-ink-500" />
            <span class="text-sm text-ink-700">关于</span>
          </div>
          <span class="text-xs text-ink-500">双人记忆空间 v1.0</span>
        </div>
        <button @click="handleLogout" class="w-full flex items-center justify-between px-5 py-3.5 hover:bg-cream-50 transition-colors">
          <div class="flex items-center gap-2">
            <LogOut :size="16" class="text-rose-500" />
            <span class="text-sm text-rose-600">退出登录</span>
          </div>
          <ChevronRight :size="16" class="text-ink-300" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Heart, LogOut, Settings, Info, ChevronRight, Image, Video, Music, FileText, Paperclip, Loader2, Bell } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useCoupleStore } from '@/stores/couple'
import { memoryApi } from '@/api'
import { isPushSupported, getCurrentPushSubscription, subscribePush, unsubscribePush, notificationPermission } from '@/utils/push'

const router = useRouter()
const userStore = useUserStore()
const coupleStore = useCoupleStore()

const saving = ref(false)
const settingsForm = ref({ spaceName: '', anniversaryDate: '' })
const stats = ref([
  { type: 'photo', label: '照片', icon: Image, count: 0 },
  { type: 'video', label: '视频', icon: Video, count: 0 },
  { type: 'song', label: '歌曲', icon: Music, count: 0 },
  { type: 'text', label: '文字', icon: FileText, count: 0 },
  { type: 'file', label: '文件', icon: Paperclip, count: 0 },
])

const pushSupported = ref(isPushSupported())
const pushEnabled = ref(false)
const pushBusy = ref(false)
const pushError = ref('')
const isHttps = computed(() => location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')
const pushStatusLabel = computed(() => {
  if (!pushSupported.value) return '不支持'
  if (pushEnabled.value) return '已开启'
  if (notificationPermission() === 'denied') return '权限已被禁用，请到浏览器设置中开启'
  return '未开启'
})

async function refreshPushState() {
  if (!pushSupported.value) return
  try {
    const sub = await getCurrentPushSubscription()
    pushEnabled.value = !!sub && notificationPermission() === 'granted'
  } catch {
    pushEnabled.value = false
  }
}

async function enablePush() {
  pushBusy.value = true
  pushError.value = ''
  try {
    const res = await subscribePush()
    if (!res.ok) pushError.value = res.reason || '开启失败'
    await refreshPushState()
  } finally {
    pushBusy.value = false
  }
}

async function disablePush() {
  pushBusy.value = true
  pushError.value = ''
  try {
    await unsubscribePush()
    await refreshPushState()
  } finally {
    pushBusy.value = false
  }
}

const partner = computed(() => {
  const members = coupleStore.info?.members || []
  return members.find((m) => m.id !== userStore.user?.id)
})
const partnerName = computed(() => partner.value?.nickname || partner.value?.username || '伴侣')

const daysCount = computed(() => {
  if (!coupleStore.info?.anniversaryDate) return null
  const start = new Date(coupleStore.info.anniversaryDate)
  const now = new Date()
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
})

function formatAnniversary(d: string | null | undefined) {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

async function saveSettings() {
  saving.value = true
  try {
    await coupleStore.update(settingsForm.value)
  } finally {
    saving.value = false
  }
}

function handleLogout() {
  if (!confirm('确定退出登录吗？')) return
  userStore.logout()
  coupleStore.clear()
  router.replace('/login')
}

onMounted(async () => {
  if (coupleStore.info) {
    settingsForm.value.spaceName = coupleStore.info.spaceName || ''
    settingsForm.value.anniversaryDate = coupleStore.info.anniversaryDate || ''
  }

  const counts = await memoryApi.stats()
  stats.value.forEach((s) => {
    s.count = counts[s.type] || 0
  })

  refreshPushState()
})
</script>
