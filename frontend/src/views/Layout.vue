<template>
  <div class="flex bg-cream-50 layout-shell">
    <!-- Desktop sidebar -->
    <aside class="hidden md:flex w-60 flex-col p-6 bg-white border-r border-cream-200">
      <div class="mb-8">
        <p class="text-[10px] uppercase tracking-widest text-ink-500 mb-1">Memory Space</p>
        <h2 class="text-xl font-bold text-ink-900 truncate">{{ coupleStore.info?.spaceName || '我们的空间' }}</h2>
        <div v-if="daysCount !== null" class="flex items-center gap-1 mt-2 text-xs text-ink-500">
          <Heart :size="13" class="text-rose-500" fill="#D85667" />
          <span>在一起 {{ daysCount }} 天</span>
        </div>
      </div>

      <nav class="flex-1 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="['relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
            isActive(item.path) ? 'bg-cream-100 text-ink-900' : 'text-ink-700 hover:bg-cream-50']"
        >
          <component :is="item.icon" :size="18" :class="isActive(item.path) ? 'text-rose-500' : ''" />
          <span class="flex-1">{{ item.label }}</span>
          <span
            v-if="item.path === '/chat' && chatStore.unread > 0"
            class="min-w-[18px] h-[18px] px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center"
          >{{ chatStore.unread > 99 ? '99+' : chatStore.unread }}</span>
        </router-link>
      </nav>

      <p class="text-[11px] text-ink-300 flex items-center gap-1">
        Made with <Heart :size="10" class="text-rose-500" fill="#D85667" />
      </p>
    </aside>

    <!-- Main content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <router-view />
    </main>

    <!-- Mobile bottom tabs -->
    <nav
      class="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-cream-200 flex z-40"
      style="padding-bottom: env(safe-area-inset-bottom);"
    >
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="['relative flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
          isActive(item.path) ? 'text-rose-500' : 'text-ink-500']"
      >
        <div class="relative">
          <component :is="item.icon" :size="20" :stroke-width="isActive(item.path) ? 2.2 : 1.8" />
          <span
            v-if="item.path === '/chat' && chatStore.unread > 0"
            class="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-semibold flex items-center justify-center"
          >{{ chatStore.unread > 99 ? '99+' : chatStore.unread }}</span>
        </div>
        {{ item.label }}
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { Clock, MessageCircle, User, Heart, ListChecks, CalendarHeart, Gamepad2 } from 'lucide-vue-next'
import { useCoupleStore } from '@/stores/couple'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { primeAudioOnGesture, notifyNewMessage, stopTitleFlash } from '@/utils/notify'

const route = useRoute()
const coupleStore = useCoupleStore()
const userStore = useUserStore()
const chatStore = useChatStore()

const navItems = [
  { path: '/chat', label: '悄悄话', icon: MessageCircle },
  { path: '/timeline', label: '时间轴', icon: Clock },
  { path: '/bucket', label: '恋爱清单', icon: ListChecks },
  { path: '/anniversary', label: '纪念日', icon: CalendarHeart },
  { path: '/game', label: '小游戏', icon: Gamepad2 },
  { path: '/me', label: '我的', icon: User },
]

function isActive(path: string) {
  return route.path === path
}

const daysCount = computed(() => {
  if (!coupleStore.info?.anniversaryDate) return null
  const start = new Date(coupleStore.info.anniversaryDate)
  const now = new Date()
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
})

interface IncomingMsg {
  senderId: number
  msgType: 'text' | 'image' | 'file'
  content?: string | null
  fileName?: string | null
}

function previewOf(msg: IncomingMsg): string {
  if (msg.msgType === 'text') {
    const t = (msg.content || '').replace(/\s+/g, ' ').trim()
    return t.length > 30 ? t.slice(0, 30) + '…' : t
  }
  if (msg.msgType === 'image') return '[图片]'
  if (msg.msgType === 'file') return `[文件] ${msg.fileName || ''}`.trim()
  return ''
}

const onMessageNew = (msg: IncomingMsg) => {
  if (msg.senderId === userStore.user?.id) return
  const onChat = route.path === '/chat'
  if (!onChat) chatStore.increment(1)
  notifyNewMessage({ preview: previewOf(msg) })
}

function setupBadgeSocket() {
  if (!userStore.token) return
  const s = chatStore.connect(userStore.token)
  s.off('message:new', onMessageNew)
  s.on('message:new', onMessageNew)
}

onMounted(async () => {
  primeAudioOnGesture()
  const infoPromise = coupleStore.info ? Promise.resolve() : coupleStore.fetchInfo()
  const unreadPromise = chatStore.fetchUnread()
  setupBadgeSocket()
  await Promise.all([infoPromise, unreadPromise])
})

onBeforeUnmount(() => {
  chatStore.socket?.off('message:new', onMessageNew)
  stopTitleFlash()
})
</script>

<style scoped>
.layout-shell {
  height: 100vh;
  min-height: 100vh;
}
@supports (height: 100dvh) {
  .layout-shell {
    height: 100dvh;
    min-height: 100dvh;
  }
}
</style>
