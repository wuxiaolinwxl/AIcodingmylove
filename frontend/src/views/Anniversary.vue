<template>
  <div class="flex-1 overflow-y-auto pb-20 md:pb-8">
    <div class="max-w-5xl mx-auto p-4 md:p-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 class="text-2xl md:text-3xl font-semibold text-ink-900">纪念日</h1>
          <p class="text-sm text-ink-500 mt-1">
            共 <span class="text-rose-500 font-medium">{{ items.length }}</span> 个，
            离最近的还有 {{ nearestText }}
          </p>
        </div>
        <button @click="openCreate" class="btn-primary">
          <Plus :size="16" />
          新增
        </button>
      </div>

      <!-- Countdown -->
      <div v-if="countdown && !loading" class="card !p-5 mb-6 text-center bg-gradient-to-br from-rose-50 to-cream-50 border-rose-100">
        <p class="text-sm text-ink-600 mb-3">
          距离 <span class="font-semibold text-rose-600">{{ countdown.title }}</span>
        </p>
        <div v-if="countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0" class="text-xl font-bold text-rose-500">
          🎉 就是今天！
        </div>
        <div v-else class="flex items-center justify-center gap-2">
          <div class="countdown-block">
            <span class="countdown-num">{{ countdown.days }}</span>
            <span class="countdown-label">天</span>
          </div>
          <span class="text-ink-300 text-lg font-bold">:</span>
          <div class="countdown-block">
            <span class="countdown-num">{{ String(countdown.hours).padStart(2, '0') }}</span>
            <span class="countdown-label">时</span>
          </div>
          <span class="text-ink-300 text-lg font-bold">:</span>
          <div class="countdown-block">
            <span class="countdown-num">{{ String(countdown.minutes).padStart(2, '0') }}</span>
            <span class="countdown-label">分</span>
          </div>
          <span class="text-ink-300 text-lg font-bold">:</span>
          <div class="countdown-block">
            <span class="countdown-num">{{ String(countdown.seconds).padStart(2, '0') }}</span>
            <span class="countdown-label">秒</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20 text-ink-500">
        <Loader2 :size="24" class="animate-spin mx-auto mb-2" />
        <p class="text-sm">加载中...</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in items"
          :key="item.id"
          class="card !p-4 flex items-start gap-4"
        >
          <div
            :class="['w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0',
              kindBg(item.kind)]"
          >
            <component :is="kindIcon(item.kind)" :size="20" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-ink-900 truncate">
                  {{ item.title }}
                  <span v-if="item.isPreset" class="ml-1 text-[10px] text-ink-400">预设</span>
                </p>
                <p class="text-xs text-ink-500 mt-0.5">
                  {{ formatDates(item) }}
                  <span v-if="item.recurrence === 'yearly_solar'">· 每年</span>
                  <span v-else-if="item.recurrence === 'yearly_lunar'">· 每年（农历）</span>
                  <span v-else-if="item.recurrence === 'monthly'">· 每月</span>
                  <span v-else-if="item.recurrence === 'weekly'">· 每周</span>
                </p>
                <p
                  v-if="item.daysUntil !== null"
                  :class="['text-xs mt-0.5 font-medium',
                    item.daysUntil === 0 ? 'text-rose-500' : 'text-ink-700']"
                >
                  {{ item.daysUntil === 0 ? '🎉 就是今天！' : `还有 ${item.daysUntil} 天` }}
                  <span v-if="item.nextDate" class="text-ink-400 font-normal">
                    （{{ item.nextDate }}）
                  </span>
                </p>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <button
                  @click="openNotes(item)"
                  class="btn-icon"
                  title="日记"
                >
                  <BookOpen :size="16" />
                </button>
                <button
                  @click="toggleRemind(item)"
                  :class="['btn-icon', item.remindEnabled ? 'text-rose-500' : '']"
                  :title="item.remindEnabled ? '已开启提醒' : '已关闭提醒'"
                >
                  <Bell v-if="item.remindEnabled" :size="16" />
                  <BellOff v-else :size="16" />
                </button>
                <button
                  @click="openEdit(item)"
                  class="btn-icon"
                  title="编辑"
                >
                  <Pencil :size="16" />
                </button>
                <button
                  v-if="!item.isPreset"
                  @click="remove(item)"
                  class="btn-icon hover:text-rose-600"
                  title="删除"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="items.length === 0" class="text-center py-20">
          <div class="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
            <CalendarHeart :size="28" :stroke-width="1.5" class="text-rose-400" />
          </div>
          <p class="text-ink-700 font-medium">还没有纪念日</p>
          <p class="text-ink-500 text-sm mt-1">填好双方生日就会自动出现</p>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <div
      v-if="showForm"
      class="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4"
      @click.self="showForm = false"
    >
      <div class="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-ink-900">
            {{ form.id ? '编辑纪念日' : '新增纪念日' }}
          </h3>
          <button @click="showForm = false" class="btn-icon"><X :size="18" /></button>
        </div>
        <div class="space-y-3">
          <div>
            <label class="text-xs text-ink-500">标题</label>
            <input v-model="form.title" maxlength="100" class="input mt-1" />
          </div>
          <div>
            <label class="text-xs text-ink-500">公历日期</label>
            <input v-model="form.solarDate" type="date" class="input mt-1" />
          </div>
          <div>
            <label class="text-xs text-ink-500">农历（可选，YYYY-MM-DD）</label>
            <input v-model="form.lunarDate" placeholder="如 2025-08-15" class="input mt-1" />
          </div>
          <div>
            <label class="text-xs text-ink-500">重复</label>
            <div class="flex gap-2 mt-2 flex-wrap">
              <button
                v-for="opt in recurrenceOpts"
                :key="opt.value"
                type="button"
                @click="form.recurrence = opt.value"
                :class="['chip cursor-pointer', form.recurrence === opt.value ? 'chip-active' : '']"
              >{{ opt.label }}</button>
            </div>
            <div v-if="form.recurrence === 'monthly'" class="mt-2">
              <label class="text-xs text-ink-500">每月几号</label>
              <select v-model.number="form.recurrenceDay" class="input mt-1 !w-24">
                <option :value="null">自动</option>
                <option v-for="d in 31" :key="d" :value="d">{{ d }} 号</option>
              </select>
            </div>
            <div v-if="form.recurrence === 'weekly'" class="mt-2 flex gap-1.5 flex-wrap">
              <button
                v-for="(label, idx) in weekDays"
                :key="idx"
                type="button"
                @click="form.recurrenceDay = idx"
                :class="['chip cursor-pointer', form.recurrenceDay === idx ? 'chip-active' : '']"
              >{{ label }}</button>
            </div>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <label class="inline-flex items-center gap-1.5 text-xs text-ink-700 cursor-pointer">
              <input v-model="form.remindEnabled" type="checkbox" class="accent-rose-500" />
              开启提醒
            </label>
            <div v-if="form.remindEnabled" class="flex items-center gap-2 text-xs text-ink-700">
              <span>提前</span>
              <input
                v-model.number="form.remindDaysBefore"
                type="number"
                min="0"
                max="30"
                class="input !w-16 !py-1.5"
              />
              <span>天</span>
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs text-ink-700">
            <span>目标时刻</span>
            <select v-model.number="form.targetHour" class="input !w-24 !py-1.5">
              <option v-for="h in 24" :key="h - 1" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}:00</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-5">
          <button @click="showForm = false" class="btn-secondary">取消</button>
          <button @click="submitForm" class="btn-primary" :disabled="submitting || !form.title.trim()">
            <Loader2 v-if="submitting" :size="14" class="animate-spin" />
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- Notes Modal -->
    <div
      v-if="showNotes && currentNote"
      class="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4"
      @click.self="showNotes = false"
    >
      <div class="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-ink-900">{{ currentNote.title }} · 日记</h3>
          <button @click="showNotes = false" class="btn-icon"><X :size="18" /></button>
        </div>
        <p class="text-xs text-ink-500 mb-4">
          双方各自有独立的记录空间，互相可见但只能编辑自己的。
        </p>
        <div class="space-y-4">
          <div>
            <label class="text-xs text-ink-500">我的记录</label>
            <textarea
              v-model="myNoteText"
              rows="5"
              placeholder="写下今年这一刻..."
              class="input mt-1 resize-none"
            ></textarea>
            <div class="flex justify-end gap-2 mt-2">
              <button
                v-if="myNoteText"
                @click="clearMyNote"
                class="btn-secondary !py-2"
              >清空</button>
              <button
                @click="saveMyNote"
                class="btn-primary !py-2"
                :disabled="savingNote"
              >
                <Loader2 v-if="savingNote" :size="14" class="animate-spin" />
                保存
              </button>
            </div>
          </div>
          <div v-if="partnerNote">
            <label class="text-xs text-ink-500">{{ partnerNoteAuthor }} 的记录</label>
            <div class="mt-1 p-3 rounded-xl bg-cream-50 border border-cream-200 text-sm text-ink-700 whitespace-pre-wrap">
              {{ partnerNote.content }}
            </div>
            <p class="text-[10px] text-ink-400 mt-1">
              更新于 {{ formatDateTime(partnerNote.updatedAt) }}
            </p>
          </div>
          <p v-else class="text-xs text-ink-400">对方还没有写下记录</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onActivated, onDeactivated, onBeforeUnmount, ref } from 'vue'
import {
  Plus, Loader2, X, Pencil, Trash2, Bell, BellOff,
  CalendarHeart, Cake, Heart, PartyPopper, BookOpen,
} from 'lucide-vue-next'
import { anniversaryApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { useCoupleStore } from '@/stores/couple'

interface AnnItem {
  id: number
  title: string
  kind: string
  recurrence: string
  solarDate: string | null
  lunarDate: string | null
  lunarIsLeap: boolean
  remindEnabled: boolean
  remindDaysBefore: number
  targetHour: number
  isPreset: boolean
  nextDate: string | null
  daysUntil: number | null
}

interface Note {
  id: number
  anniversaryId: number
  userId: number
  content: string
  createdAt: string
  updatedAt: string
}

const userStore = useUserStore()
const coupleStore = useCoupleStore()

const items = ref<AnnItem[]>([])
const loading = ref(true)

const showForm = ref(false)
const submitting = ref(false)
const form = ref<{
  id: number | null
  title: string
  solarDate: string
  lunarDate: string
  recurrence: 'none' | 'yearly_solar' | 'yearly_lunar' | 'monthly' | 'weekly'
  recurrenceDay: number | null
  remindEnabled: boolean
  remindDaysBefore: number
  targetHour: number
}>({
  id: null,
  title: '',
  solarDate: '',
  lunarDate: '',
  recurrence: 'yearly_solar',
  recurrenceDay: null,
  remindEnabled: true,
  remindDaysBefore: 1,
  targetHour: 0,
})

const showNotes = ref(false)
const currentNote = ref<AnnItem | null>(null)
const myNote = ref<Note | null>(null)
const partnerNote = ref<Note | null>(null)
const myNoteText = ref('')
const savingNote = ref(false)

const recurrenceOpts = [
  { value: 'yearly_solar' as const, label: '每年（公历）' },
  { value: 'yearly_lunar' as const, label: '每年（农历）' },
  { value: 'monthly' as const, label: '每月' },
  { value: 'weekly' as const, label: '每周' },
  { value: 'none' as const, label: '一次性' },
]

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const nearestText = computed(() => {
  const upcoming = items.value
    .map((i) => i.daysUntil)
    .filter((d): d is number => d !== null)
    .sort((a, b) => a - b)
  if (upcoming.length === 0) return '暂无'
  const d = upcoming[0]
  return d === 0 ? '今天' : `${d} 天`
})

const nearestItem = computed(() => {
  return items.value
    .filter((i) => i.daysUntil !== null && i.nextDate)
    .sort((a, b) => a.daysUntil! - b.daysUntil!)[0] || null
})

const now = ref(Date.now())
let countdownTimer: ReturnType<typeof setInterval> | null = null

const countdown = computed(() => {
  const item = nearestItem.value
  if (!item || !item.nextDate) return null
  const hour = item.targetHour ?? 0
  const target = new Date(item.nextDate + 'T00:00:00').getTime() + hour * 3600000
  const diff = target - now.value
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, title: item.title }
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return { days, hours, minutes, seconds, title: item.title }
})

function startCountdown() {
  if (!countdownTimer) {
    countdownTimer = setInterval(() => { now.value = Date.now() }, 1000)
  }
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const partnerNoteAuthor = computed(() => {
  if (!partnerNote.value) return ''
  const m = coupleStore.info?.members?.find((u) => u.id === partnerNote.value!.userId)
  return m?.nickname || m?.username || 'TA'
})

function kindIcon(kind: string) {
  if (kind === 'birthday_a' || kind === 'birthday_b') return Cake
  if (kind === 'together') return Heart
  if (kind === 'festival') return PartyPopper
  return CalendarHeart
}
function kindBg(kind: string) {
  if (kind === 'birthday_a' || kind === 'birthday_b') return 'bg-amber-50 text-amber-500'
  if (kind === 'together') return 'bg-rose-50 text-rose-500'
  if (kind === 'festival') return 'bg-indigo-50 text-indigo-500'
  return 'bg-cream-100 text-ink-500'
}

function formatDates(item: AnnItem) {
  const parts: string[] = []
  if (item.solarDate) parts.push(`公历 ${item.solarDate}`)
  if (item.lunarDate) parts.push(`农历 ${item.lunarDate}${item.lunarIsLeap ? '（闰）' : ''}`)
  return parts.join(' · ') || '未设定日期'
}

function formatDateTime(s: string) {
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function load() {
  loading.value = true
  try {
    items.value = await anniversaryApi.list()
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.value = {
    id: null,
    title: '',
    solarDate: '',
    lunarDate: '',
    recurrence: 'yearly_solar',
    recurrenceDay: null,
    remindEnabled: true,
    remindDaysBefore: 1,
    targetHour: 0,
  }
  showForm.value = true
}

function openEdit(item: AnnItem) {
  form.value = {
    id: item.id,
    title: item.title,
    solarDate: item.solarDate || '',
    lunarDate: item.lunarDate || '',
    recurrence: (item.recurrence as any) || 'yearly_solar',
    recurrenceDay: (item as any).recurrenceDay ?? null,
    remindEnabled: item.remindEnabled,
    remindDaysBefore: item.remindDaysBefore,
    targetHour: item.targetHour ?? 0,
  }
  showForm.value = true
}

async function submitForm() {
  const t = form.value.title.trim()
  if (!t) return
  if (!form.value.solarDate && !form.value.lunarDate) {
    alert('请填写公历或农历日期')
    return
  }
  submitting.value = true
  try {
    const payload = {
      title: t,
      solarDate: form.value.solarDate || null,
      lunarDate: form.value.lunarDate || null,
      recurrence: form.value.recurrence,
      recurrenceDay: form.value.recurrenceDay,
      remindEnabled: form.value.remindEnabled,
      remindDaysBefore: form.value.remindDaysBefore,
      targetHour: form.value.targetHour,
    }
    if (form.value.id) {
      await anniversaryApi.update(form.value.id, payload)
    } else {
      await anniversaryApi.create(payload)
    }
    showForm.value = false
    await load()
  } catch (e: any) {
    alert(e?.response?.data?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function remove(item: AnnItem) {
  if (item.isPreset) return
  if (!confirm(`删除“${item.title}”？`)) return
  try {
    await anniversaryApi.remove(item.id)
    items.value = items.value.filter((i) => i.id !== item.id)
  } catch (e: any) {
    alert(e?.response?.data?.message || '删除失败')
  }
}

async function toggleRemind(item: AnnItem) {
  const next = !item.remindEnabled
  item.remindEnabled = next
  try {
    await anniversaryApi.update(item.id, { remindEnabled: next })
  } catch {
    item.remindEnabled = !next
  }
}

async function openNotes(item: AnnItem) {
  currentNote.value = item
  myNote.value = null
  partnerNote.value = null
  myNoteText.value = ''
  showNotes.value = true
  try {
    const notes: Note[] = await anniversaryApi.notes(item.id)
    const me = userStore.user?.id
    for (const n of notes) {
      if (n.userId === me) myNote.value = n
      else partnerNote.value = n
    }
    myNoteText.value = myNote.value?.content || ''
  } catch (e: any) {
    alert(e?.response?.data?.message || '加载失败')
  }
}

async function saveMyNote() {
  if (!currentNote.value) return
  savingNote.value = true
  try {
    const saved: Note = await anniversaryApi.saveMyNote(currentNote.value.id, myNoteText.value)
    myNote.value = saved
    myNoteText.value = saved.content
  } catch (e: any) {
    alert(e?.response?.data?.message || '保存失败')
  } finally {
    savingNote.value = false
  }
}

async function clearMyNote() {
  if (!currentNote.value) return
  if (!confirm('清空我的记录？')) return
  try {
    await anniversaryApi.removeMyNote(currentNote.value.id)
    myNote.value = null
    myNoteText.value = ''
  } catch (e: any) {
    alert(e?.response?.data?.message || '清空失败')
  }
}

let isFirstActivation = true

onMounted(() => {
  load()
  startCountdown()
})

onActivated(async () => {
  startCountdown()
  if (isFirstActivation) {
    isFirstActivation = false
    return
  }
  try {
    items.value = await anniversaryApi.list()
  } catch {}
})

onDeactivated(() => {
  stopCountdown()
})

onBeforeUnmount(() => {
  stopCountdown()
})
</script>

<style scoped>
.countdown-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 3rem;
}
.countdown-num {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
  color: var(--color-ink-900, #1a1a1a);
  font-variant-numeric: tabular-nums;
}
.countdown-label {
  font-size: 0.65rem;
  color: var(--color-ink-500, #6b6b6b);
  margin-top: 0.25rem;
}
</style>
