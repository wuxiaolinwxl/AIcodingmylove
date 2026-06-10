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
            <button
              type="button"
              @click="pickAvatar"
              :disabled="avatarUploading"
              class="relative w-12 h-12 rounded-full bg-cream-100 border border-cream-200 flex items-center justify-center text-sm font-medium text-ink-700 overflow-hidden group"
              title="点击更换头像"
            >
              <img v-if="userStore.user?.avatarUrl" :src="userStore.user.avatarUrl" class="w-full h-full object-cover" />
              <span v-else>{{ (userStore.user?.nickname || userStore.user?.username || '').charAt(0) }}</span>
              <span class="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Loader2 v-if="avatarUploading" :size="16" class="animate-spin" />
                <Camera v-else :size="14" />
              </span>
            </button>
            <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarSelected" />
            <div>
              <p class="text-sm font-medium text-ink-900">{{ userStore.user?.nickname || userStore.user?.username }}</p>
              <p class="text-xs text-ink-500">我</p>
            </div>
          </div>
          <div class="flex flex-col items-center mx-3">
            <Heart :size="14" class="text-rose-400 mb-0.5" fill="#fb7185" />
            <span class="text-xs font-semibold text-rose-500">{{ loveScoreText }}%</span>
          </div>
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
        <p v-if="avatarError" class="text-xs text-rose-500 mt-2">{{ avatarError }}</p>
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

      <!-- Birthday card -->
      <div class="card !p-5 mb-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Cake :size="16" class="text-ink-500" />
            <h3 class="text-sm font-bold text-ink-900">我的生日</h3>
          </div>
          <button
            v-if="hasBirthday && !birthdayEditing"
            @click="openBirthdayEdit"
            class="text-xs text-ink-400 hover:text-ink-600 transition-colors"
          >修改</button>
        </div>

        <!-- Read-only summary -->
        <div v-if="hasBirthday && !birthdayEditing" class="space-y-2 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-ink-500 text-xs">新历</span>
            <span class="text-ink-900">{{ solarSummary || '未设置' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-ink-500 text-xs">农历</span>
            <span class="text-ink-900">{{ lunarSummary || '未设置' }}</span>
          </div>
        </div>

        <!-- Editor -->
        <div v-else class="space-y-4">
          <div>
            <label class="text-xs text-ink-500 mb-1 block">新历生日</label>
            <div class="grid grid-cols-3 gap-2">
              <select v-model.number="solarYear" class="input">
                <option :value="0">年</option>
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
              </select>
              <select v-model.number="solarMonth" class="input">
                <option :value="0">月</option>
                <option v-for="m in 12" :key="m" :value="m">{{ m }} 月</option>
              </select>
              <select v-model.number="solarDay" class="input">
                <option :value="0">日</option>
                <option v-for="d in solarDayMax" :key="d" :value="d">{{ d }} 日</option>
              </select>
            </div>
          </div>
          <div>
            <label class="text-xs text-ink-500 mb-1 block">农历生日</label>
            <div class="grid grid-cols-3 gap-2">
              <select v-model.number="lunarYear" class="input">
                <option :value="0">年</option>
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
              </select>
              <select v-model.number="lunarMonth" class="input">
                <option :value="0">月</option>
                <option v-for="m in 12" :key="m" :value="m">{{ m }} 月</option>
              </select>
              <select v-model.number="lunarDay" class="input">
                <option :value="0">日</option>
                <option v-for="d in 30" :key="d" :value="d">{{ d }} 日</option>
              </select>
            </div>
            <label class="inline-flex items-center gap-2 mt-2 text-xs text-ink-600">
              <input v-model="birthdayForm.lunarIsLeap" type="checkbox" class="rounded" />
              <span>闰月</span>
            </label>
          </div>
          <div class="flex gap-2">
            <button
              v-if="hasBirthday"
              @click="cancelBirthdayEdit"
              class="btn-ghost flex-1"
              :disabled="birthdaySaving"
            >取消</button>
            <button @click="saveBirthday" class="btn-primary flex-1" :disabled="birthdaySaving">
              <Loader2 v-if="birthdaySaving" :size="14" class="animate-spin" />
              {{ birthdaySaving ? '保存中...' : '保存生日' }}
            </button>
          </div>
          <p v-if="birthdayError" class="text-xs text-rose-500">{{ birthdayError }}</p>
        </div>
      </div>

      <!-- Partner birthday card -->
      <div class="card !p-5 mb-4">
        <div class="flex items-center gap-2 mb-4">
          <Cake :size="16" class="text-ink-500" />
          <h3 class="text-sm font-bold text-ink-900">TA 的生日</h3>
        </div>
        <div v-if="partnerHasBirthday" class="space-y-2 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-ink-500 text-xs">新历</span>
            <span class="text-ink-900">{{ partnerSolarSummary || '未设置' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-ink-500 text-xs">农历</span>
            <span class="text-ink-900">{{ partnerLunarSummary || '未设置' }}</span>
          </div>
        </div>
        <p v-else class="text-xs text-ink-500">TA 还没有设置生日哦～</p>
      </div>

      <!-- Notification settings -->
      <div class="card !p-5 mb-4">
        <div class="flex items-center gap-2 mb-3">
          <Bell :size="16" class="text-ink-500" />
          <h3 class="text-sm font-bold text-ink-900">消息提醒</h3>
        </div>
        <p class="text-xs text-ink-500 mb-3">开启后，TA 给你发消息时即使应用没打开也会收到通知。</p>

        <!-- iOS 需要"添加到主屏幕"才能推送 -->
        <div v-if="iosNeedsInstall" class="bg-rose-50 border border-rose-100 rounded-lg p-3 mb-3 text-xs text-ink-700 leading-relaxed">
          <p class="font-semibold text-rose-600 mb-1.5">苹果手机需要"添加到主屏幕"才能接收推送</p>
          <ol class="list-decimal list-inside space-y-1 text-ink-700">
            <li>点击 Safari 底部的「分享」按钮 <Share :size="12" class="inline -mt-0.5" /></li>
            <li>在弹出菜单中选择「添加到主屏幕」</li>
            <li>从主屏幕图标启动后，再回到这里开启提醒</li>
          </ol>
        </div>
        <div v-else-if="!pushSupported" class="text-xs text-rose-500 mb-3">
          当前浏览器不支持 Web 推送。
        </div>
        <div v-else-if="!isHttps" class="text-xs text-rose-500 mb-3">
          推送需要 HTTPS（或 localhost），当前为 HTTP 环境。
        </div>

        <div class="flex items-center justify-between">
          <span :class="['text-sm', pushEnabled ? 'text-emerald-600' : 'text-ink-700']">
            {{ pushStatusLabel }}
          </span>
          <button
            v-if="!pushEnabled && !iosNeedsInstall"
            @click="enablePush"
            class="btn-primary !py-1.5 !px-3 text-xs"
            :disabled="pushBusy || !pushSupported || !isHttps"
          >
            <Loader2 v-if="pushBusy" :size="12" class="animate-spin" />
            {{ pushBusy ? '处理中...' : '开启提醒' }}
          </button>
          <button
            v-else-if="pushEnabled"
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

    <ConfirmDialog
      v-model:show="logoutDialog"
      title="退出登录"
      message="确定退出登录吗？"
      confirm-text="退出"
      cancel-text="取消"
      @confirm="doLogout"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { Heart, LogOut, Settings, Info, ChevronRight, Image, Video, Music, FileText, Paperclip, Loader2, Bell, Share, Cake, Camera } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useCoupleStore } from '@/stores/couple'
import { memoryApi, ossApi } from '@/api'
import { compressImage } from '@/utils/image'
import { isPushSupported, getCurrentPushSubscription, subscribePush, unsubscribePush, notificationPermission, isIOS, isStandalone } from '@/utils/push'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const userStore = useUserStore()
const coupleStore = useCoupleStore()

const logoutDialog = ref(false)

const saving = ref(false)
const settingsForm = ref({ spaceName: '', anniversaryDate: '' })

const birthdaySaving = ref(false)
const birthdayEditing = ref(false)
const birthdayError = ref('')
const birthdayForm = ref<{ lunarIsLeap: boolean }>({ lunarIsLeap: false })
const solarYear = ref(0)
const solarMonth = ref(0)
const solarDay = ref(0)
const lunarYear = ref(0)
const lunarMonth = ref(0)
const lunarDay = ref(0)

const yearOptions = computed(() => {
  const now = new Date().getFullYear()
  const arr: number[] = []
  for (let y = now; y >= 1930; y--) arr.push(y)
  return arr
})

const solarDayMax = computed(() => {
  if (!solarYear.value || !solarMonth.value) return 31
  return new Date(solarYear.value, solarMonth.value, 0).getDate()
})

function parseYMD(value: string | null | undefined) {
  if (!value) return { y: 0, m: 0, d: 0 }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!m) return { y: 0, m: 0, d: 0 }
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) }
}

function formatYMD(y: number, m: number, d: number): string | null {
  if (!y || !m || !d) return null
  const mm = String(m).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

const hasBirthday = computed(() => {
  const u = userStore.user
  return !!(u?.solarBirthday || u?.lunarBirthday)
})

const solarSummary = computed(() => {
  const v = userStore.user?.solarBirthday
  const { y, m, d } = parseYMD(v)
  if (!y || !m || !d) return ''
  return `${y} 年 ${m} 月 ${d} 日`
})

const lunarSummary = computed(() => {
  const v = userStore.user?.lunarBirthday
  const { y, m, d } = parseYMD(v)
  if (!y || !m || !d) return ''
  const leap = userStore.user?.lunarIsLeap
  return `${y} 年 ${leap ? '闰' : ''}${m} 月 ${d} 日`
})

function loadBirthdayDraftFromStore() {
  const u = userStore.user
  if (!u) return
  const s = parseYMD(u.solarBirthday)
  solarYear.value = s.y
  solarMonth.value = s.m
  solarDay.value = s.d
  const l = parseYMD(u.lunarBirthday)
  lunarYear.value = l.y
  lunarMonth.value = l.m
  lunarDay.value = l.d
  birthdayForm.value.lunarIsLeap = !!u.lunarIsLeap
  birthdayError.value = ''
}

function openBirthdayEdit() {
  loadBirthdayDraftFromStore()
  birthdayEditing.value = true
}

function cancelBirthdayEdit() {
  loadBirthdayDraftFromStore()
  birthdayEditing.value = false
}

const avatarInput = ref<HTMLInputElement>()
const avatarUploading = ref(false)
const avatarError = ref('')

function pickAvatar() {
  avatarError.value = ''
  avatarInput.value?.click()
}

async function onAvatarSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    avatarError.value = '请选择图片文件'
    input.value = ''
    return
  }
  if (file.size > 20 * 1024 * 1024) {
    avatarError.value = '图片需小于 20MB'
    input.value = ''
    return
  }
  avatarUploading.value = true
  try {
    const compressed = await compressImage(file, 512, 0.85)
    const res = await ossApi.upload(compressed, 'avatar', 'image')
    const cleanUrl = res.url.split('?')[0]
    await userStore.updateProfile({ avatarUrl: cleanUrl })
    coupleStore.fetchInfo().catch(() => {})
  } catch (err: any) {
    avatarError.value = err?.response?.data?.message || '头像上传失败'
  } finally {
    avatarUploading.value = false
    input.value = ''
  }
}
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
const iosNeedsInstall = computed(() => isIOS() && !isStandalone())
const pushStatusLabel = computed(() => {
  if (iosNeedsInstall.value) return '未开启（需先添加到主屏幕）'
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
const loveScoreText = computed(() => {
  const score = Number(coupleStore.info?.loveScore || 0)
  return score % 1 === 0 ? score.toFixed(0) : score.toFixed(1)
})

const partnerHasBirthday = computed(() => !!(partner.value?.solarBirthday || partner.value?.lunarBirthday))
const partnerSolarSummary = computed(() => {
  const v = partner.value?.solarBirthday
  const { y, m, d } = parseYMD(v)
  if (!y || !m || !d) return ''
  return `${y} 年 ${m} 月 ${d} 日`
})
const partnerLunarSummary = computed(() => {
  const v = partner.value?.lunarBirthday
  const { y, m, d } = parseYMD(v)
  if (!y || !m || !d) return ''
  const leap = partner.value?.lunarIsLeap
  return `${y} 年 ${leap ? '闰' : ''}${m} 月 ${d} 日`
})

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

async function saveBirthday() {
  birthdayError.value = ''
  const solarFilled = !!(solarYear.value && solarMonth.value && solarDay.value)
  const solarPartial = !!(solarYear.value || solarMonth.value || solarDay.value) && !solarFilled
  const lunarFilled = !!(lunarYear.value && lunarMonth.value && lunarDay.value)
  const lunarPartial = !!(lunarYear.value || lunarMonth.value || lunarDay.value) && !lunarFilled
  if (solarPartial || lunarPartial) {
    birthdayError.value = '请完整选择年/月/日'
    return
  }
  birthdaySaving.value = true
  try {
    await userStore.updateProfile({
      solarBirthday: formatYMD(solarYear.value, solarMonth.value, solarDay.value),
      lunarBirthday: formatYMD(lunarYear.value, lunarMonth.value, lunarDay.value),
      lunarIsLeap: !!birthdayForm.value.lunarIsLeap,
    })
    birthdayEditing.value = false
  } catch (e: any) {
    birthdayError.value = e?.response?.data?.message || '保存失败'
  } finally {
    birthdaySaving.value = false
  }
}

function handleLogout() {
  logoutDialog.value = true
}

async function doLogout() {
  try {
    userStore.logout()
    coupleStore.clear()
  } catch (e) {
    console.warn('logout cleanup failed', e)
  }
  await router.replace('/login')
}

let isFirstActivation = true

onMounted(async () => {
  if (coupleStore.info) {
    settingsForm.value.spaceName = coupleStore.info.spaceName || ''
    settingsForm.value.anniversaryDate = coupleStore.info.anniversaryDate || ''
  }

  const u = userStore.user
  if (u) {
    loadBirthdayDraftFromStore()
  }

  const counts = await memoryApi.stats()
  stats.value.forEach((s) => {
    s.count = counts[s.type] || 0
  })

  refreshPushState()
})

onActivated(async () => {
  if (isFirstActivation) {
    isFirstActivation = false
    return
  }
  if (coupleStore.info) {
    settingsForm.value.spaceName = coupleStore.info.spaceName || ''
    settingsForm.value.anniversaryDate = coupleStore.info.anniversaryDate || ''
  }
  try {
    const counts = await memoryApi.stats()
    stats.value.forEach((s) => {
      s.count = counts[s.type] || 0
    })
  } catch {}
  refreshPushState()
})
</script>
