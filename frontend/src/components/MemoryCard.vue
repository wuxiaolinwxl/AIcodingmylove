<template>
  <div class="card group">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2 min-w-0">
        <span class="chip">
          <component :is="typeIcon" :size="12" :stroke-width="2" />
          {{ typeLabel }}
        </span>
        <span class="text-xs text-ink-500 truncate">来自 {{ uploaderName }}</span>
      </div>
      <span class="text-xs text-ink-500 flex-shrink-0">{{ formatDate(item.memoryDate) }}</span>
    </div>

    <!-- Photo -->
    <div v-if="item.type === 'photo'" class="rounded-xl overflow-hidden bg-cream-100 mb-3">
      <SafeImage
        :src="item.ossUrl"
        :alt="item.title || ''"
        loading="lazy"
        wrapper-class="relative w-full aspect-[4/3]"
        img-class="w-full h-full object-cover"
      />
    </div>

    <!-- Video -->
    <div v-else-if="item.type === 'video'" class="rounded-xl overflow-hidden bg-ink-900 mb-3">
      <video
        v-if="item.ossUrl"
        :src="item.ossUrl"
        :poster="item.coverUrl || undefined"
        controls
        playsinline
        preload="metadata"
        class="w-full"
      ></video>
    </div>

    <!-- Song -->
    <div v-else-if="item.type === 'song'" class="bg-cream-50 border border-cream-200 rounded-xl p-3 mb-3">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
          <Music :size="18" class="text-rose-500" />
        </div>
        <span class="text-sm font-medium text-ink-900 truncate">{{ item.title || '未命名歌曲' }}</span>
      </div>
      <audio
        v-if="item.ossUrl"
        :src="item.ossUrl"
        controls
        preload="metadata"
        class="w-full"
      ></audio>
    </div>

    <!-- Generic file -->
    <a
      v-else-if="item.type === 'file' && item.ossUrl"
      :href="item.ossUrl"
      :download="item.fileName || item.title || 'download'"
      target="_blank"
      rel="noopener"
      class="flex items-center gap-3 bg-cream-50 border border-cream-200 rounded-xl p-3 mb-3 hover:bg-cream-100 transition-colors"
    >
      <div class="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
        <Paperclip :size="18" class="text-rose-500" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-ink-900 truncate">{{ item.fileName || item.title || '未命名文件' }}</p>
        <p class="text-xs text-ink-500">{{ formatSize(item.fileSize) }} · 点击下载</p>
      </div>
      <Download :size="16" class="text-ink-500 flex-shrink-0" />
    </a>

    <!-- Text -->
    <div v-else-if="item.type === 'text'" class="bg-cream-50 border border-cream-200 rounded-xl p-4 mb-3">
      <Quote :size="16" class="text-rose-300 mb-2" />
      <p
        class="text-sm text-ink-700 whitespace-pre-wrap leading-relaxed"
        :class="!expanded && isLong ? 'line-clamp-5' : ''"
      >{{ item.content }}</p>
      <button
        v-if="isLong"
        @click="expanded = !expanded"
        class="mt-2 inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600"
      >
        <component :is="expanded ? ChevronUp : ChevronDown" :size="14" />
        {{ expanded ? '收起' : '展开全文' }}
      </button>
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
import { computed, ref } from 'vue'
import { Image, Video, Music, FileText, Quote, Trash2, ChevronDown, ChevronUp, Paperclip, Download } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useCoupleStore } from '@/stores/couple'
import SafeImage from '@/components/SafeImage.vue'

const props = defineProps<{
  item: {
    id: number
    uploaderId: number
    type: 'photo' | 'video' | 'song' | 'text' | 'file'
    title: string | null
    content: string | null
    ossUrl: string | null
    coverUrl: string | null
    memoryDate: string
    fileName?: string | null
    fileSize?: number | null
  }
}>()

defineEmits<{ remove: [id: number] }>()

const userStore = useUserStore()
const coupleStore = useCoupleStore()
const userId = computed(() => userStore.user?.id)

const uploaderName = computed(() => {
  if (props.item.uploaderId === userStore.user?.id) return '我'
  const members = coupleStore.info?.members || []
  const m = members.find((u) => u.id === props.item.uploaderId)
  return m?.nickname || m?.username || 'TA'
})

const typeMap = {
  photo: { icon: Image, label: '照片' },
  video: { icon: Video, label: '视频' },
  song: { icon: Music, label: '歌曲' },
  text: { icon: FileText, label: '文字' },
  file: { icon: Paperclip, label: '文件' },
}

const typeIcon = computed(() => typeMap[props.item.type].icon)
const typeLabel = computed(() => typeMap[props.item.type].label)

const TEXT_PREVIEW_LIMIT = 140
const expanded = ref(false)
const isLong = computed(() => {
  const c = props.item.content || ''
  return c.length > TEXT_PREVIEW_LIMIT || c.split('\n').length > 6
})

function formatDate(d: string) {
  const date = new Date(d)
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

function formatSize(bytes?: number | null) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>
