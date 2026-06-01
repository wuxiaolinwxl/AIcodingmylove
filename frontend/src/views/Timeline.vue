<template>
  <div class="flex-1 overflow-y-auto pb-20 md:pb-8">
    <div class="max-w-5xl mx-auto p-4 md:p-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl md:text-3xl font-semibold text-ink-900">时间轴</h1>
          <p class="text-sm text-ink-500 mt-1">
            共 <span class="text-rose-500 font-medium">{{ total }}</span> 段回忆
          </p>
        </div>
        <button @click="showUpload = true" class="btn-primary">
          <Plus :size="16" />
          记下这一刻
        </button>
      </div>

      <!-- Filter bar -->
      <div class="card !p-4 mb-6">
        <div class="flex flex-wrap gap-2 mb-3">
          <button
            v-for="f in typeFilters"
            :key="f.value"
            @click="filter.type = f.value"
            :class="['chip cursor-pointer transition-colors', filter.type === f.value ? 'chip-active' : '']"
          >
            <component :is="f.icon" :size="12" :stroke-width="2" />
            {{ f.label }}
          </button>
        </div>
        <div class="divider !my-3"></div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative flex-1 min-w-[160px]">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              v-model="filter.keyword"
              placeholder="搜索标题或内容"
              class="input !py-2 !pl-9"
              @keydown.enter="reload"
            />
          </div>
          <input v-model="filter.start" type="date" class="input !w-auto !py-2" />
          <span class="text-ink-300">&rarr;</span>
          <input v-model="filter.end" type="date" class="input !w-auto !py-2" />
          <button @click="reload" class="btn-secondary !py-2">筛选</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading && items.length === 0" class="text-center py-20 text-ink-500">
        <Loader2 :size="24" class="animate-spin mx-auto mb-2" />
        <p class="text-sm">加载中...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!loading && items.length === 0" class="text-center py-20">
        <div class="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
          <Sparkles :size="28" :stroke-width="1.5" class="text-rose-400" />
        </div>
        <p class="text-ink-700 font-medium">还没有回忆</p>
        <p class="text-ink-500 text-sm mt-1">点击右上角记录第一段</p>
      </div>

      <!-- Month groups -->
      <div v-else>
        <div v-for="group in monthGroups" :key="group.month" class="mb-8">
          <div class="sticky top-0 -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-4 bg-cream-50/90 backdrop-blur-sm border-b border-cream-200/60 z-10">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-ink-900">{{ formatMonth(group.month) }}</h3>
              <span class="text-xs text-ink-500">{{ group.units.length }} 段回忆</span>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <template v-for="unit in group.units" :key="unit.key">
              <PhotoAlbumCard
                v-if="unit.kind === 'album'"
                :items="unit.items"
                @open="openLightbox"
              />
              <MemoryCard
                v-else
                :item="unit.item"
                @remove="handleRemove"
              />
            </template>
          </div>
        </div>

        <div ref="sentinelEl" class="h-10 mt-4 flex items-center justify-center text-xs text-ink-400">
          <span v-if="loading && items.length > 0" class="inline-flex items-center gap-1">
            <Loader2 :size="14" class="animate-spin" />
            加载中...
          </span>
          <span v-else-if="!hasMore && items.length > 0">已经到底啦</span>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <ImageLightbox
      v-model:show="lightbox.show"
      v-model:index="lightbox.index"
      :items="lightboxItems"
    />

    <!-- Upload dialog -->
    <UploadDialog v-model="showUpload" @created="onCreated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Plus, Search, Loader2, Sparkles, Layers, Image, Video, Music, FileText, Paperclip } from 'lucide-vue-next'
import { memoryApi } from '@/api'
import { useCoupleStore } from '@/stores/couple'
import MemoryCard from '@/components/MemoryCard.vue'
import PhotoAlbumCard from '@/components/PhotoAlbumCard.vue'
import UploadDialog from '@/components/UploadDialog.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'

interface MemoryItem {
  id: number
  coupleId: number
  uploaderId: number
  type: 'photo' | 'video' | 'song' | 'text' | 'file'
  title: string | null
  content: string | null
  ossKey: string | null
  ossUrl: string | null
  coverUrl: string | null
  fileSize: number
  memoryDate: string
  createdAt: string
}

type Unit =
  | { kind: 'single'; key: string; item: MemoryItem }
  | { kind: 'album'; key: string; day: string; items: MemoryItem[] }

const items = ref<MemoryItem[]>([])
const total = ref(0)
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const showUpload = ref(false)
const sentinelEl = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const INITIAL_PAGE_SIZE = 6
const NEXT_PAGE_SIZE = 12

const coupleStore = useCoupleStore()

const filter = ref({ type: '' as string, keyword: '', start: '', end: '' })

const typeFilters = [
  { value: '', label: '全部', icon: Layers },
  { value: 'photo', label: '照片', icon: Image },
  { value: 'video', label: '视频', icon: Video },
  { value: 'song', label: '歌曲', icon: Music },
  { value: 'text', label: '文字', icon: FileText },
  { value: 'file', label: '文件', icon: Paperclip },
]

const lightbox = ref({ show: false, items: [] as MemoryItem[], index: 0 })

const lightboxItems = computed(() =>
  lightbox.value.items.map((it) => ({
    src: it.ossUrl || '',
    caption: [it.title, formatDate(it.memoryDate)].filter(Boolean).join(' · '),
  })),
)

const monthGroups = computed(() => {
  const monthMap = new Map<string, MemoryItem[]>()
  for (const it of items.value) {
    const d = new Date(it.memoryDate)
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap.has(m)) monthMap.set(m, [])
    monthMap.get(m)!.push(it)
  }

  const result: { month: string; units: Unit[] }[] = []
  for (const [month, monthItems] of monthMap) {
    const dayMap = new Map<string, MemoryItem[]>()
    for (const it of monthItems) {
      const day = it.memoryDate.slice(0, 10)
      if (!dayMap.has(day)) dayMap.set(day, [])
      dayMap.get(day)!.push(it)
    }

    const units: Unit[] = []
    const sortedDays = [...dayMap.keys()].sort((a, b) => (a < b ? 1 : -1))
    for (const day of sortedDays) {
      const dayItems = dayMap.get(day)!
      const photos = dayItems.filter((i) => i.type === 'photo')
      const others = dayItems.filter((i) => i.type !== 'photo')

      if (photos.length >= 2) {
        units.push({ kind: 'album', key: `album-${day}`, day, items: photos })
      } else {
        for (const p of photos) {
          units.push({ kind: 'single', key: `s-${p.id}`, item: p })
        }
      }
      for (const o of others) {
        units.push({ kind: 'single', key: `s-${o.id}`, item: o })
      }
    }

    result.push({ month, units })
  }

  return result
})

function formatMonth(m: string) {
  const [y, mo] = m.split('-')
  return `${y} 年 ${parseInt(mo)} 月`
}

function formatDate(d: string) {
  const date = new Date(d)
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

async function fetchList(p = 1) {
  if (loading.value) return
  loading.value = true
  try {
    const pageSize = p === 1 ? INITIAL_PAGE_SIZE : NEXT_PAGE_SIZE
    const params: any = { page: p, pageSize }
    if (filter.value.type) params.type = filter.value.type
    if (filter.value.keyword) params.keyword = filter.value.keyword
    if (filter.value.start) params.start = filter.value.start
    if (filter.value.end) params.end = filter.value.end
    const res = await memoryApi.list(params)
    if (p === 1) {
      items.value = res.items
    } else {
      items.value.push(...res.items)
    }
    total.value = res.total
    hasMore.value = res.hasMore
    page.value = p
  } finally {
    loading.value = false
  }
}

function reload() {
  fetchList(1)
}

async function handleRemove(id: number) {
  await memoryApi.remove(id)
  items.value = items.value.filter((i) => i.id !== id)
  total.value--
}

function openLightbox(photos: unknown[], index: number) {
  lightbox.value = { show: true, items: photos as MemoryItem[], index }
}

function onCreated() {
  showUpload.value = false
  reload()
  coupleStore.fetchInfo().catch(() => {})
}

function setupObserver() {
  if (typeof IntersectionObserver === 'undefined') return
  if (observer) observer.disconnect()
  if (!sentinelEl.value) return
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && hasMore.value && !loading.value) {
          fetchList(page.value + 1)
        }
      }
    },
    { rootMargin: '300px 0px' },
  )
  observer.observe(sentinelEl.value)
}

watch(sentinelEl, (el) => {
  if (el) setupObserver()
})

onMounted(async () => {
  await fetchList(1)
  await nextTick()
  setupObserver()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>
