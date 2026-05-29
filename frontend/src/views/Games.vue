<template>
  <div class="flex-1 overflow-y-auto pb-20 md:pb-8">
    <div class="max-w-5xl mx-auto p-4 md:p-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 class="text-2xl md:text-3xl font-semibold text-ink-900">情侣小游戏</h1>
          <p class="text-sm text-ink-500 mt-1">
            玩一局亲密度 <span class="text-rose-500 font-medium">+0.5%</span>
          </p>
        </div>
        <div class="text-xs text-ink-500 inline-flex items-center gap-1">
          <Heart :size="13" class="text-rose-500" fill="#D85667" />
          当前 {{ scoreText }}%
        </div>
      </div>

      <!-- Catalog -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <button
          v-for="g in catalog"
          :key="g.key"
          @click="openGame(g.key)"
          class="card !p-5 text-left hover:shadow-md transition-shadow"
        >
          <div class="text-3xl mb-2">{{ g.emoji }}</div>
          <div class="text-base font-semibold text-ink-900 mb-1">{{ g.title }}</div>
          <div class="text-xs text-ink-500 leading-relaxed">{{ g.desc }}</div>
          <div class="mt-3 inline-flex items-center gap-1 text-[11px] text-rose-500">
            <Heart :size="11" fill="#D85667" />
            +{{ g.score }}%
          </div>
        </button>
      </div>

      <!-- Recent plays -->
      <div class="card !p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-ink-900">最近的对局</h2>
          <button @click="loadRecent" class="text-xs text-ink-500 hover:text-rose-500 inline-flex items-center gap-1">
            <RefreshCw :size="12" />
            刷新
          </button>
        </div>
        <div v-if="recent.length === 0" class="text-center text-xs text-ink-300 py-6">
          还没有对局记录，先来玩一局？
        </div>
        <ul v-else class="divide-y divide-cream-100">
          <li v-for="p in recent" :key="p.id" class="py-2.5 flex items-start gap-3">
            <span class="text-lg shrink-0">{{ gameEmoji(p.game) }}</span>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-ink-900 break-words">{{ p.result || gameTitle(p.game) }}</div>
              <div class="text-[11px] text-ink-300 mt-0.5">
                {{ formatTime(p.createdAt) }} · {{ gameTitle(p.game) }}
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- Toast -->
      <transition name="fade">
        <div
          v-if="toast"
          class="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-ink-900/90 text-white text-sm px-4 py-2 rounded-full shadow-lg inline-flex items-center gap-1.5"
        >
          <Heart :size="13" class="text-rose-300" fill="#fda4af" />
          {{ toast }}
        </div>
      </transition>
    </div>

    <!-- Truth/Dare Modal -->
    <div
      v-if="modal === 'truth_dare'"
      class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-ink-900">真心话大冒险</h3>
          <button @click="closeModal" class="text-ink-500 hover:text-ink-900"><X :size="18" /></button>
        </div>
        <div v-if="!currentResult" class="space-y-3">
          <p class="text-xs text-ink-500">敢不敢？选一个：</p>
          <div class="grid grid-cols-3 gap-2">
            <button @click="play('truth_dare', { mode: 'truth' })" :disabled="playing" class="btn-primary">真心话</button>
            <button @click="play('truth_dare', { mode: 'dare' })" :disabled="playing" class="btn-primary">大冒险</button>
            <button @click="play('truth_dare', {})" :disabled="playing" class="btn-secondary">随机</button>
          </div>
        </div>
        <div v-else class="space-y-4">
          <div class="text-xs uppercase tracking-wider text-rose-500 font-medium">
            {{ currentResult.mode === 'truth' ? '真心话' : '大冒险' }}
          </div>
          <div class="text-base text-ink-900 leading-relaxed">{{ currentResult.prompt }}</div>
          <div class="flex gap-2 pt-2">
            <button @click="currentResult = null" class="btn-secondary flex-1">再抽一张</button>
            <button @click="closeModal" class="btn-primary flex-1">完成</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dice Modal -->
    <div
      v-if="modal === 'dice'"
      class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-ink-900">甜蜜骰子</h3>
          <button @click="closeModal" class="text-ink-500 hover:text-ink-900"><X :size="18" /></button>
        </div>
        <div v-if="!currentResult" class="text-center py-6">
          <div class="text-6xl mb-4">🎲</div>
          <button @click="play('dice', {})" :disabled="playing" class="btn-primary w-full">
            <Loader2 v-if="playing" :size="14" class="animate-spin" />
            掷骰子
          </button>
        </div>
        <div v-else class="text-center py-4 space-y-3">
          <div class="text-7xl">{{ currentResult.emoji || '🎲' }}</div>
          <div class="text-xs text-ink-500">第 {{ currentResult.face }} 面</div>
          <div class="text-base text-ink-900 font-medium">{{ currentResult.label }}</div>
          <div class="flex gap-2 pt-2">
            <button @click="currentResult = null" class="btn-secondary flex-1">再掷一次</button>
            <button @click="closeModal" class="btn-primary flex-1">完成</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Quiz Modal -->
    <div
      v-if="modal === 'quiz'"
      class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[85vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-ink-900">默契问答</h3>
          <button @click="closeModal" class="text-ink-500 hover:text-ink-900"><X :size="18" /></button>
        </div>
        <div v-if="!currentResult" class="text-center py-6">
          <div class="text-5xl mb-3">💞</div>
          <p class="text-sm text-ink-500 mb-4">抽 5 道题，看你们有多懂彼此。</p>
          <button @click="play('quiz', {})" :disabled="playing" class="btn-primary w-full">
            <Loader2 v-if="playing" :size="14" class="animate-spin" />
            开始抽题
          </button>
        </div>
        <div v-else class="space-y-3">
          <ol class="list-decimal list-inside space-y-2.5 text-sm text-ink-900 leading-relaxed">
            <li v-for="(q, i) in currentResult.questions" :key="i">{{ q.q }}</li>
          </ol>
          <div class="flex gap-2 pt-3">
            <button @click="currentResult = null" class="btn-secondary flex-1">再抽一组</button>
            <button @click="closeModal" class="btn-primary flex-1">完成</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Heart, X, Loader2, RefreshCw } from 'lucide-vue-next'
import { gameApi } from '@/api'
import { useCoupleStore } from '@/stores/couple'

interface CatalogItem {
  key: string
  title: string
  emoji: string
  desc: string
  score: number
}
interface RecentItem {
  id: number
  game: string
  result: string | null
  createdAt: string
}

const coupleStore = useCoupleStore()

const catalog = ref<CatalogItem[]>([])
const recent = ref<RecentItem[]>([])
const modal = ref<string | null>(null)
const currentResult = ref<any>(null)
const playing = ref(false)
const toast = ref('')

const scoreText = computed(() => Number(coupleStore.info?.loveScore || 0).toFixed(2))

function gameTitle(key: string) {
  return catalog.value.find((g) => g.key === key)?.title || key
}
function gameEmoji(key: string) {
  return catalog.value.find((g) => g.key === key)?.emoji || '🎮'
}

function openGame(key: string) {
  modal.value = key
  currentResult.value = null
}
function closeModal() {
  modal.value = null
  currentResult.value = null
}

async function loadCatalog() {
  try {
    catalog.value = await gameApi.list()
  } catch {
    // ignore
  }
}

async function loadRecent() {
  try {
    recent.value = await gameApi.recent()
  } catch {
    // ignore
  }
}

async function play(game: string, payload: any) {
  if (playing.value) return
  playing.value = true
  try {
    const res = await gameApi.play(game, payload)
    currentResult.value = res.result
    if (typeof res.score === 'number') coupleStore.setLoveScore(res.score)
    showToast('亲密度 +0.5%')
    loadRecent()
  } catch (e: any) {
    showToast(e?.response?.data?.message || '操作失败')
  } finally {
    playing.value = false
  }
}

function showToast(msg: string) {
  toast.value = msg
  setTimeout(() => {
    toast.value = ''
  }, 1800)
}

function formatTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(() => {
  loadCatalog()
  loadRecent()
  if (!coupleStore.info) coupleStore.fetchInfo()
})
</script>
