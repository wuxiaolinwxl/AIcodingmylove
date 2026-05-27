<template>
  <div class="card group">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <span class="chip">
        <component :is="typeIcon" :size="12" :stroke-width="2" />
        {{ typeLabel }}
      </span>
      <span class="text-xs text-ink-500">{{ formatDate(item.memoryDate) }}</span>
    </div>

    <!-- Photo -->
    <div v-if="item.type === 'photo'" class="rounded-xl overflow-hidden bg-cream-100 mb-3">
      <img :src="item.ossUrl" :alt="item.title || ''" class="w-full h-auto" loading="lazy" />
    </div>

    <!-- Video -->
    <div v-else-if="item.type === 'video'" class="rounded-xl overflow-hidden bg-ink-900 mb-3">
      <video controls :poster="item.coverUrl || undefined" class="w-full">
        <source :src="item.ossUrl" />
      </video>
    </div>

    <!-- Song -->
    <div v-else-if="item.type === 'song'" class="bg-cream-50 border border-cream-200 rounded-xl p-3 mb-3">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
          <Music :size="18" class="text-rose-500" />
        </div>
        <span class="text-sm font-medium text-ink-900 truncate">{{ item.title || '未命名歌曲' }}</span>
      </div>
      <audio controls class="w-full">
        <source :src="item.ossUrl" />
      </audio>
    </div>

    <!-- Text -->
    <div v-else-if="item.type === 'text'" class="bg-cream-50 border border-cream-200 rounded-xl p-4 mb-3">
      <Quote :size="16" class="text-rose-300 mb-2" />
      <p class="text-sm text-ink-700 whitespace-pre-wrap leading-relaxed">{{ item.content }}</p>
    </div>

    <!-- Title & description (non-text) -->
    <div v-if="item.type !== 'text' && (item.title || item.content)">
      <p v-if="item.title" class="text-sm font-medium text-ink-900 mb-1">{{ item.title }}</p>
      <p v-if="item.content" class="text-xs text-ink-500 line-clamp-2">{{ item.content }}</p>
    </div>

    <!-- Delete button -->
    <button
      v-if="item.uploaderId === userId"
      @click="$emit('remove', item.id)"
      class="flex items-center gap-1 mt-2 text-xs text-ink-500 opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-all"
    >
      <Trash2 :size="13" />
      删除
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Image, Video, Music, FileText, Quote, Trash2 } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  item: {
    id: number
    uploaderId: number
    type: 'photo' | 'video' | 'song' | 'text'
    title: string | null
    content: string | null
    ossUrl: string | null
    coverUrl: string | null
    memoryDate: string
  }
}>()

defineEmits<{ remove: [id: number] }>()

const userStore = useUserStore()
const userId = computed(() => userStore.user?.id)

const typeMap = {
  photo: { icon: Image, label: '照片' },
  video: { icon: Video, label: '视频' },
  song: { icon: Music, label: '歌曲' },
  text: { icon: FileText, label: '文字' },
}

const typeIcon = computed(() => typeMap[props.item.type].icon)
const typeLabel = computed(() => typeMap[props.item.type].label)

function formatDate(d: string) {
  const date = new Date(d)
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}
</script>
