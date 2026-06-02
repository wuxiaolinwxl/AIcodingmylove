<template>
  <div class="flex-1 overflow-y-auto pb-20 md:pb-8">
    <div class="max-w-5xl mx-auto p-4 md:p-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 class="text-2xl md:text-3xl font-semibold text-ink-900">恋爱清单</h1>
          <p class="text-sm text-ink-500 mt-1">
            已完成 <span class="text-rose-500 font-medium">{{ done }}</span>
            / {{ total }} 项
          </p>
        </div>
        <button @click="showAdd = true" class="btn-primary">
          <Plus :size="16" />
          自定义
        </button>
      </div>

      <!-- Daily task -->
      <DailyTaskCard @completed="load" />

      <!-- Progress -->
      <div class="card !p-4 mb-5">
        <div class="flex items-center justify-between text-xs text-ink-500 mb-2">
          <span>整体进度</span>
          <span>{{ percent }}%</span>
        </div>
        <div class="h-2 rounded-full bg-cream-100 overflow-hidden">
          <div
            class="h-full bg-rose-400 transition-all duration-500"
            :style="{ width: percent + '%' }"
          ></div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card !p-4 mb-6">
        <div class="flex flex-wrap gap-2 mb-3">
          <button
            @click="activeCat = ''"
            :class="['chip cursor-pointer transition-colors', activeCat === '' ? 'chip-active' : '']"
          >
            <ListChecks :size="12" :stroke-width="2" />
            全部
          </button>
          <button
            v-for="c in allCategories"
            :key="c"
            @click="activeCat = c"
            :class="['chip cursor-pointer transition-colors', activeCat === c ? 'chip-active' : '']"
          >
            {{ c }}
          </button>
        </div>
        <div class="divider !my-3"></div>
        <div class="flex items-center gap-3 flex-wrap">
          <label class="inline-flex items-center gap-1.5 text-xs text-ink-700 cursor-pointer">
            <input v-model="hideDone" type="checkbox" class="accent-rose-500" />
            隐藏已完成
          </label>
          <label class="inline-flex items-center gap-1.5 text-xs text-ink-700 cursor-pointer">
            <input v-model="onlyCustom" type="checkbox" class="accent-rose-500" />
            只看自定义
          </label>
          <label class="inline-flex items-center gap-1.5 text-xs text-ink-700 cursor-pointer">
            <input v-model="onlyMyChecked" type="checkbox" class="accent-rose-500" />
            我已选
          </label>
          <label class="inline-flex items-center gap-1.5 text-xs text-ink-700 cursor-pointer">
            <input v-model="onlyPartnerChecked" type="checkbox" class="accent-rose-500" />
            TA已选
          </label>
          <div class="relative flex-1 min-w-[140px]">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              v-model="keyword"
              placeholder="搜索清单"
              class="input !py-2 !pl-9"
            />
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20 text-ink-500">
        <Loader2 :size="24" class="animate-spin mx-auto mb-2" />
        <p class="text-sm">加载中...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="filtered.length === 0" class="text-center py-20">
        <div class="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
          <ListChecks :size="28" :stroke-width="1.5" class="text-rose-400" />
        </div>
        <p class="text-ink-700 font-medium">暂无符合条件的项目</p>
      </div>

      <!-- Items grouped by category -->
      <div v-else>
        <div v-for="g in grouped" :key="g.category" class="mb-6">
          <div class="flex items-center justify-between mb-3 px-1">
            <h3 class="text-sm font-bold text-ink-900">{{ g.category }}</h3>
            <span class="text-xs text-ink-500">
              {{ g.items.filter((i) => i.completed).length }} / {{ g.items.length }}
            </span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div
              v-for="item in visibleItems(g)"
              :key="item.id"
              :class="['group flex items-start gap-3 text-left card-flat !p-3.5 transition-all',
                item.completed ? 'bg-rose-50/60 border-rose-200/60' : '']"
            >
              <!-- Both completed: overlapping name badges + heart -->
              <div v-if="item.completed" class="relative mt-0.5 w-10 h-10 flex-shrink-0" @click="toggle(item)" role="button" :title="`双双完成（点击取消我的）`">
                <div class="absolute top-0 left-0 w-7 h-7 rounded-full border-2 border-white ring-2 ring-rose-300 bg-rose-50 z-[1] flex items-center justify-center text-[10px] font-semibold text-rose-500" :title="selfName">
                  {{ selfInitial }}
                </div>
                <div class="absolute top-2.5 left-3.5 w-7 h-7 rounded-full border-2 border-white ring-2 ring-rose-300 bg-rose-50 z-[2] flex items-center justify-center text-[10px] font-semibold text-rose-500" :title="partnerName">
                  {{ partnerInitial }}
                </div>
                <span class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center z-[3] shadow-sm">
                  <Heart :size="10" class="text-white fill-white" />
                </span>
              </div>
              <!-- Partial / none: stacked name badges with individual state -->
              <div v-else class="flex flex-col gap-1.5 mt-0.5 items-center">
                <button
                  type="button"
                  @click="toggle(item)"
                  :title="myChecked(item) ? `${selfName} 已完成（点击取消）` : `${selfName} 还没完成`"
                  :class="['relative w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold transition-all',
                    myChecked(item) ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50 text-rose-500' : 'border-cream-300 hover:border-rose-300 bg-white text-ink-500']"
                >
                  {{ selfInitial }}
                  <span v-if="myChecked(item)" class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 flex items-center justify-center shadow-sm">
                    <Check :size="8" :stroke-width="3" class="text-white" />
                  </span>
                </button>
                <div
                  :title="partnerChecked(item) ? `${partnerName} 已完成` : `${partnerName} 还没完成`"
                  :class="['relative w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold transition-all',
                    partnerChecked(item) ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50 text-rose-500' : 'border-cream-300 bg-white text-ink-500']"
                >
                  {{ partnerInitial }}
                  <span v-if="partnerChecked(item)" class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 flex items-center justify-center shadow-sm">
                    <Check :size="8" :stroke-width="3" class="text-white" />
                  </span>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p
                  :class="['text-sm leading-snug',
                    item.completed ? 'text-ink-500 line-through' : 'text-ink-900']"
                >
                  {{ item.title }}
                </p>
                <div class="flex items-center gap-2 mt-1 text-[11px] text-ink-400 flex-wrap">
                  <span v-if="item.isCustom" class="text-rose-400">自定义</span>
                  <span v-if="item.completed && item.completedAt" class="inline-flex items-center gap-0.5 text-rose-400">
                    <Heart :size="9" class="fill-rose-400" />
                    {{ formatDate(item.completedAt) }} 双双完成
                  </span>
                  <span v-else-if="item.checks.length > 0" :class="partnerChecked(item) ? 'text-blue-500' : 'text-rose-400'">
                    {{ checksLabel(item) }}
                  </span>
                </div>
              </div>
              <span
                v-if="item.isCustom"
                @click.stop="removeCustom(item)"
                class="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-rose-500 transition-opacity cursor-pointer"
                role="button"
                title="删除自定义"
              >
                <Trash2 :size="14" />
              </span>
            </div>
          </div>
          <div v-if="g.items.length > GROUP_LIMIT" class="mt-2 text-center">
            <button
              type="button"
              @click="toggleGroup(g.category)"
              class="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 px-3 py-1.5 rounded-full hover:bg-rose-50 transition-colors"
            >
              <component :is="isExpanded(g.category) ? ChevronUp : ChevronDown" :size="13" />
              {{ isExpanded(g.category) ? '收起' : `展开剩余 ${g.items.length - GROUP_LIMIT} 项` }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add custom modal -->
    <div
      v-if="showAdd"
      class="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4"
      @click.self="showAdd = false"
    >
      <div class="card w-full max-w-md">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-ink-900">添加自定义</h3>
          <button @click="showAdd = false" class="btn-icon"><X :size="18" /></button>
        </div>
        <div class="space-y-3">
          <div>
            <label class="text-xs text-ink-500">标题</label>
            <input
              v-model="newTitle"
              maxlength="200"
              placeholder="比如：一起去北海道滑雪"
              class="input mt-1"
              @keydown.enter="submitCustom"
            />
          </div>
          <div>
            <label class="text-xs text-ink-500">分类</label>
            <div class="flex flex-wrap gap-2 mt-2">
              <button
                v-for="c in allCategories"
                :key="c"
                type="button"
                @click="newCategory = c"
                :class="['chip cursor-pointer', newCategory === c ? 'chip-active' : '']"
              >{{ c }}</button>
              <button
                type="button"
                @click="newCategory = '自定义'"
                :class="['chip cursor-pointer', newCategory === '自定义' ? 'chip-active' : '']"
              >自定义</button>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-5">
          <button @click="showAdd = false" class="btn-secondary">取消</button>
          <button @click="submitCustom" class="btn-primary" :disabled="submitting || !newTitle.trim()">
            <Loader2 v-if="submitting" :size="14" class="animate-spin" />
            添加
          </button>
        </div>
      </div>
    </div>

    <ConfettiCelebration v-if="showCelebration" @done="showCelebration = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onActivated, ref, watch } from 'vue'
import { Plus, Check, Loader2, ListChecks, Search, Trash2, X, Heart, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { bucketApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { useCoupleStore } from '@/stores/couple'
import ConfettiCelebration from '@/components/ConfettiCelebration.vue'
import DailyTaskCard from '@/components/DailyTaskCard.vue'

const userStore = useUserStore()
const coupleStore = useCoupleStore()

interface Check {
  userId: number
  completedAt: string
}
interface Item {
  id: number
  category: string
  title: string
  isCustom: boolean
  createdBy: number | null
  completed: boolean
  completedAt: string | null
  checks: Check[]
}

const items = ref<Item[]>([])
const allCategories = ref<string[]>([])
const loading = ref(true)
const activeCat = ref('')
const hideDone = ref(false)
const onlyCustom = ref(false)
const onlyMyChecked = ref(false)
const onlyPartnerChecked = ref(false)
const keyword = ref('')

const GROUP_LIMIT = 12
const expandedGroups = ref<Set<string>>(new Set())

function isExpanded(category: string) {
  return expandedGroups.value.has(category)
}
function toggleGroup(category: string) {
  const next = new Set(expandedGroups.value)
  if (next.has(category)) next.delete(category)
  else next.add(category)
  expandedGroups.value = next
}
function visibleItems(g: { category: string; items: Item[] }) {
  return isExpanded(g.category) ? g.items : g.items.slice(0, GROUP_LIMIT)
}

watch([activeCat, hideDone, onlyCustom, onlyMyChecked, onlyPartnerChecked, keyword], () => {
  expandedGroups.value = new Set()
})

const showAdd = ref(false)
const showCelebration = ref(false)
const newTitle = ref('')
const newCategory = ref('日常')
const submitting = ref(false)

const total = computed(() => items.value.length)
const done = computed(() => items.value.filter((i) => i.completed).length)
const percent = computed(() => (total.value === 0 ? 0 : Math.round((done.value / total.value) * 100)))

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return items.value.filter((it) => {
    if (activeCat.value && it.category !== activeCat.value) return false
    if (hideDone.value && it.completed) return false
    if (onlyCustom.value && !it.isCustom) return false
    if (onlyMyChecked.value && !myChecked(it)) return false
    if (onlyPartnerChecked.value && !partnerChecked(it)) return false
    if (kw && !it.title.toLowerCase().includes(kw)) return false
    return true
  })
})

const grouped = computed(() => {
  const map = new Map<string, Item[]>()
  for (const it of filtered.value) {
    if (!map.has(it.category)) map.set(it.category, [])
    map.get(it.category)!.push(it)
  }
  const order = [...allCategories.value, '自定义']
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      const ai = order.indexOf(a)
      const bi = order.indexOf(b)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
    .map(([category, list]) => ({ category, items: list }))
})

async function load() {
  loading.value = true
  try {
    const res = await bucketApi.list()
    items.value = res.items
    allCategories.value = res.categories
    if (!newCategory.value || !allCategories.value.includes(newCategory.value)) {
      newCategory.value = allCategories.value[0] || '日常'
    }
  } finally {
    loading.value = false
  }
}

const partner = computed(() => {
  const members = coupleStore.info?.members || []
  return members.find((m) => m.id !== userStore.user?.id)
})
const partnerName = computed(() => partner.value?.nickname || partner.value?.username || '伴侣')
const selfName = computed(() => userStore.user?.nickname || userStore.user?.username || '我')
const selfInitial = computed(() => selfName.value.charAt(0).toUpperCase())
const partnerInitial = computed(() => partnerName.value.charAt(0).toUpperCase())

function myChecked(item: Item) {
  const uid = userStore.user?.id
  return !!uid && item.checks.some((c) => c.userId === uid)
}
function partnerChecked(item: Item) {
  const pid = partner.value?.id
  return !!pid && item.checks.some((c) => c.userId === pid)
}
function checksLabel(item: Item) {
  const mine = myChecked(item)
  const tas = partnerChecked(item)
  if (mine && !tas) return '我已完成，等 TA'
  if (!mine && tas) return 'TA 已完成，等你'
  return ''
}

async function toggle(item: Item) {
  const prevChecks = item.checks
  const prevCompleted = item.completed
  const prevAt = item.completedAt
  try {
    const res = await bucketApi.toggle(item.id)
    item.checks = res.checks || []
    item.completed = !!res.completed
    item.completedAt = res.completedAt || null
    if (!prevCompleted && item.completed) {
      showCelebration.value = true
    }
  } catch {
    item.checks = prevChecks
    item.completed = prevCompleted
    item.completedAt = prevAt
  }
}

async function submitCustom() {
  const t = newTitle.value.trim()
  if (!t || submitting.value) return
  submitting.value = true
  try {
    await bucketApi.addCustom({ title: t, category: newCategory.value })
    newTitle.value = ''
    showAdd.value = false
    await load()
  } catch (e: any) {
    alert(e?.response?.data?.message || '添加失败')
  } finally {
    submitting.value = false
  }
}

async function removeCustom(item: Item) {
  if (!confirm(`删除“${item.title}”？`)) return
  try {
    await bucketApi.removeCustom(item.id)
    items.value = items.value.filter((i) => i.id !== item.id)
  } catch (e: any) {
    alert(e?.response?.data?.message || '删除失败')
  }
}

function formatDate(d: string) {
  const date = new Date(d)
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

let isFirstActivation = true

onMounted(async () => {
  if (!coupleStore.info) coupleStore.fetchInfo().catch(() => {})
  await load()
})

onActivated(async () => {
  if (isFirstActivation) {
    isFirstActivation = false
    return
  }
  try {
    const res = await bucketApi.list()
    items.value = res.items
    allCategories.value = res.categories
  } catch {}
})
</script>
