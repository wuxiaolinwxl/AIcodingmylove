<template>
  <div class="card group">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2 min-w-0">
        <span class="chip">
          <Images :size="12" :stroke-width="2" />
          相册 · {{ items.length }} 张
        </span>
        <span class="text-xs text-ink-500 truncate">来自 {{ uploaderText }}</span>
      </div>
      <span class="text-xs text-ink-500 flex-shrink-0">{{ formatDate(items[0]?.memoryDate) }}</span>
    </div>

    <!-- Thumbnail grid -->
    <div :class="['grid gap-1.5 mb-3', gridClass]">
      <button
        v-for="(item, idx) in displayItems"
        :key="item.id"
        class="relative aspect-square overflow-hidden rounded-lg bg-cream-100"
        @click="$emit('open', items, idx)"
      >
        <img :src="item.ossUrl" class="w-full h-full object-cover hover:scale-105 transition-transform duration-200" loading="lazy" />
        <div v-if="idx === MAX - 1 && extra > 0" class="absolute inset-0 bg-ink-900/55 flex items-center justify-center">
          <span class="text-white text-lg font-bold">+{{ extra }}</span>
        </div>
      </button>
    </div>

    <!-- Footer -->
    <p class="text-xs text-ink-500 mb-2">这一天共记录了 {{ items.length }} 张照片</p>
    <button
      @click="$emit('open', items, 0)"
      class="flex items-center gap-1 text-xs text-ink-500 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all"
    >
      <Maximize2 :size="13" />
      查看全部
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Images, Maximize2 } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useCoupleStore } from '@/stores/couple'

const props = defineProps<{
  items: Array<{
    id: number
    uploaderId: number
    ossUrl: string | null
    memoryDate: string
    title: string | null
  }>
}>()

defineEmits<{ open: [items: typeof props.items, index: number] }>()

const userStore = useUserStore()
const coupleStore = useCoupleStore()

const MAX = 9

const displayItems = computed(() => props.items.slice(0, MAX))
const extra = computed(() => Math.max(0, props.items.length - MAX))

const gridClass = computed(() => {
  const count = displayItems.value.length
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-2'
  if (count === 4) return 'grid-cols-2'
  return 'grid-cols-3'
})

const uploaderText = computed(() => {
  const ids = [...new Set(props.items.map((i) => i.uploaderId))]
  const members = coupleStore.info?.members || []
  return ids
    .map((id) => {
      if (id === userStore.user?.id) return '我'
      const m = members.find((u) => u.id === id)
      return m?.nickname || m?.username || 'TA'
    })
    .join('、')
})

function formatDate(d: string | undefined) {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}
</script>
