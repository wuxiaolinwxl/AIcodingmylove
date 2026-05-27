<template>
  <div class="flex h-screen bg-cream-50">
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
          :class="['flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
            isActive(item.path) ? 'bg-cream-100 text-ink-900' : 'text-ink-700 hover:bg-cream-50']"
        >
          <component :is="item.icon" :size="18" :class="isActive(item.path) ? 'text-rose-500' : ''" />
          {{ item.label }}
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
    <nav class="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-cream-200 flex z-40">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="['flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
          isActive(item.path) ? 'text-rose-500' : 'text-ink-500']"
      >
        <component :is="item.icon" :size="20" :stroke-width="isActive(item.path) ? 2.2 : 1.8" />
        {{ item.label }}
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Clock, MessageCircle, User, Heart } from 'lucide-vue-next'
import { useCoupleStore } from '@/stores/couple'

const route = useRoute()
const coupleStore = useCoupleStore()

const navItems = [
  { path: '/timeline', label: '时间轴', icon: Clock },
  { path: '/chat', label: '悄悄话', icon: MessageCircle },
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

onMounted(async () => {
  if (!coupleStore.info) {
    await coupleStore.fetchInfo()
  }
})
</script>
