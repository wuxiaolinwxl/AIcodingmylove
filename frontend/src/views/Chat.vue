<template>
  <div class="flex flex-col h-full bg-cream-50">
    <!-- Header -->
    <div
      class="bg-white border-b border-cream-200 px-4 py-3 flex items-center gap-3"
      style="padding-top: calc(0.75rem + env(safe-area-inset-top));"
    >
      <div class="w-9 h-9 rounded-full bg-cream-100 border border-cream-200 flex items-center justify-center text-sm font-medium text-ink-700">
        {{ partnerInitial }}
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium text-ink-900">{{ partnerName }}</p>
        <div class="flex items-center gap-1">
          <span :class="['w-1.5 h-1.5 rounded-full', partnerOnline ? 'bg-emerald-500' : 'bg-ink-300']"></span>
          <span class="text-[11px] text-ink-500">{{ partnerOnline ? '在线' : '离线' }}</span>
        </div>
      </div>
      <button
        @click="showSearch = !showSearch"
        :class="['btn-icon', showSearch ? '!bg-cream-100' : '']"
      >
        <Search :size="18" />
      </button>
    </div>

    <!-- Love score -->
    <div class="bg-white border-b border-cream-200 px-4 py-2.5">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-9 h-9 rounded-full bg-cream-100 border border-cream-200 flex items-center justify-center text-xs font-medium text-ink-700 overflow-hidden shrink-0">
            <img v-if="userStore.user?.avatarUrl" :src="userStore.user.avatarUrl" class="w-full h-full object-cover" />
            <span v-else>{{ selfInitial }}</span>
          </div>
          <span class="text-[11px] text-ink-500 truncate">{{ selfDisplayName }}</span>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <Heart :size="14" class="text-rose-500" fill="#D85667" />
          <span class="text-rose-500 font-semibold tabular-nums text-base">
            {{ loveScoreText }}%
          </span>
          <Heart :size="14" class="text-rose-500" fill="#D85667" />
        </div>
        <div class="flex items-center gap-2 min-w-0 justify-end">
          <span class="text-[11px] text-ink-500 truncate text-right">{{ partnerName }}</span>
          <div class="w-9 h-9 rounded-full bg-cream-100 border border-cream-200 flex items-center justify-center text-xs font-medium text-ink-700 overflow-hidden shrink-0">
            <img v-if="partner?.avatarUrl" :src="partner.avatarUrl" class="w-full h-full object-cover" />
            <span v-else>{{ partnerInitial }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Search panel -->
    <div v-if="showSearch" class="bg-white border-b border-cream-200 px-4 py-3 space-y-3">
      <div class="relative">
        <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <input
          ref="searchInput"
          v-model="searchQuery"
          placeholder="搜索聊天记录"
          class="input !pl-9 !pr-9 !py-2"
          @keydown.escape="showSearch = false"
        />
        <button v-if="searchQuery" @click="searchQuery = ''; searchResults = []" class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-700">
          <X :size="14" />
        </button>
      </div>
      <div v-if="searching" class="text-center py-4 text-sm text-ink-500">
        <Loader2 :size="16" class="animate-spin inline mr-1" /> 搜索中...
      </div>
      <div v-else-if="searchQuery && searchResults.length === 0" class="text-center py-4 text-sm text-ink-500">
        未找到相关消息
      </div>
      <div v-else-if="searchResults.length > 0" class="space-y-2">
        <p class="text-xs text-ink-500">找到 <span class="text-rose-500 font-medium">{{ searchTotal }}</span> 条相关消息</p>
        <div class="max-h-[55vh] overflow-y-auto space-y-2">
          <button
            v-for="r in searchResults"
            :key="r.id"
            @click="jumpToMessage(r)"
            class="w-full text-left rounded-xl border border-cream-200 px-3 py-2.5 hover:bg-cream-50 transition-colors"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium text-ink-700">{{ r.senderId === userStore.user?.id ? '我' : partnerName }}</span>
              <span class="text-[10px] text-ink-300">{{ formatSearchTime(r.createdAt) }}</span>
            </div>
            <p class="text-sm text-ink-700 line-clamp-2">
              <template v-for="(seg, i) in highlightSegments(r.content || r.fileName || '', searchQuery)" :key="i">
                <mark v-if="seg.mark" class="bg-rose-100 text-rose-700 rounded px-0.5">{{ seg.text }}</mark>
                <template v-else>{{ seg.text }}</template>
              </template>
            </p>
          </button>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <div ref="msgContainer" class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      <div v-if="loading && messages.length === 0" class="flex items-center justify-center h-full">
        <Loader2 :size="20" class="animate-spin text-ink-400" />
      </div>
      <template v-else>
      <div v-if="loadingHistory" class="text-center py-2">
        <Loader2 :size="14" class="animate-spin inline text-ink-500" />
      </div>
      <button v-else-if="hasMoreHistory" @click="loadEarlier" class="btn-ghost mx-auto flex text-xs">
        <ChevronUp :size="14" />
        查看更早的消息
      </button>

      <template v-for="cell in displayCells" :key="cell.key">
        <!-- Date separator -->
        <div v-if="cell.kind === 'date'" class="flex justify-center my-2">
          <span class="px-3 py-1 rounded-full bg-cream-100 text-ink-500 text-[11px]">
            {{ formatDateLabel(cell.iso) }}
          </span>
        </div>

        <!-- Image group bubble -->
        <div
          v-else-if="cell.kind === 'image-group'"
          :data-msg-id="cell.msgs[0].id"
          :class="['group/msg flex transition-shadow duration-300 rounded-2xl items-center gap-1',
            cell.senderId === userStore.user?.id ? 'justify-end' : 'justify-start',
            highlightedId === cell.msgs[0].id ? 'ring-2 ring-rose-300 ring-offset-2 ring-offset-cream-50' : '']"
        >
          <button
            v-if="cell.senderId === userStore.user?.id && canRecall(cell.msgs[0])"
            @click="recallMessage(cell.msgs[0])"
            class="opacity-0 group-hover/msg:opacity-100 text-ink-400 hover:text-rose-500 transition-opacity"
            title="撤回"
          >
            <RotateCcw :size="14" />
          </button>
          <button
            v-if="cell.senderId === userStore.user?.id"
            @click="startReply(cell.msgs[cell.msgs.length - 1])"
            class="opacity-0 group-hover/msg:opacity-100 text-ink-400 hover:text-rose-500 transition-opacity"
            title="引用回复"
          >
            <Reply :size="14" />
          </button>
          <div :class="[
            'max-w-[78%] sm:max-w-[70%] p-2 rounded-2xl',
            cell.senderId === userStore.user?.id
              ? 'bg-emerald-500 text-white rounded-br-md'
              : 'bg-pink-100 text-ink-900 rounded-bl-md border border-pink-200'
          ]">
            <div :class="['grid gap-1', imageGridClass(cell.msgs.length)]">
              <button
                v-for="(im, idx) in cell.msgs.slice(0, 4)"
                :key="im.id"
                type="button"
                class="relative aspect-square overflow-hidden rounded-lg bg-black/10 focus:outline-none"
                @click="openImage(im)"
              >
                <SafeImage
                  :src="im.ossUrl"
                  loading="lazy"
                  wrapper-class="absolute inset-0"
                  img-class="w-full h-full object-cover"
                />
                <div
                  v-if="idx === 3 && cell.msgs.length > 4"
                  class="absolute inset-0 bg-ink-900/55 flex items-center justify-center text-white text-base font-semibold"
                >
                  +{{ cell.msgs.length - 4 }}
                </div>
              </button>
            </div>
            <div :class="['flex items-center gap-1 mt-1', cell.senderId === userStore.user?.id ? 'justify-end' : '']">
              <span class="text-[10px] opacity-60">{{ formatTime(cell.msgs[cell.msgs.length - 1].createdAt) }}</span>
              <template v-if="cell.senderId === userStore.user?.id">
                <CheckCheck v-if="cell.msgs[cell.msgs.length - 1].readAt" :size="12" class="opacity-70" />
                <Check v-else :size="12" class="opacity-60" />
              </template>
            </div>
          </div>
          <button
            v-if="cell.senderId !== userStore.user?.id"
            @click="startReply(cell.msgs[cell.msgs.length - 1])"
            class="opacity-0 group-hover/msg:opacity-100 text-ink-400 hover:text-rose-500 transition-opacity"
            title="引用回复"
          >
            <Reply :size="14" />
          </button>
        </div>

        <!-- Recalled placeholder -->
        <div
          v-else-if="cell.msg.deletedAt"
          :data-msg-id="cell.msg.id"
          class="flex justify-center"
        >
          <span class="text-[11px] text-ink-400 bg-cream-100 rounded-full px-3 py-1">
            {{ cell.msg.senderId === userStore.user?.id ? '你撤回了一条消息' : '对方撤回了一条消息' }}
            <button
              v-if="cell.msg.senderId === userStore.user?.id && cell.msg.msgType === 'text' && (cell.msg as any)._originalContent"
              @click="reEditRecalled(cell.msg)"
              class="ml-2 text-rose-500 hover:underline"
            >
              重新编辑
            </button>
          </span>
        </div>

        <!-- Regular message bubble -->
        <div
          v-else
          :data-msg-id="cell.msg.id"
          :class="['group/msg flex transition-shadow duration-300 rounded-2xl items-center gap-1',
            cell.msg.senderId === userStore.user?.id ? 'justify-end' : 'justify-start',
            highlightedId === cell.msg.id ? 'ring-2 ring-rose-300 ring-offset-2 ring-offset-cream-50' : '']"
        >
          <button
            v-if="cell.msg.senderId === userStore.user?.id && canRecall(cell.msg)"
            @click="recallMessage(cell.msg)"
            class="opacity-0 group-hover/msg:opacity-100 text-ink-400 hover:text-rose-500 transition-opacity"
            title="撤回"
          >
            <RotateCcw :size="14" />
          </button>
          <button
            v-if="cell.msg.senderId === userStore.user?.id"
            @click="startReply(cell.msg)"
            class="opacity-0 group-hover/msg:opacity-100 text-ink-400 hover:text-rose-500 transition-opacity"
            title="引用回复"
          >
            <Reply :size="14" />
          </button>
          <div :class="[
            'max-w-[78%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl',
            cell.msg.senderId === userStore.user?.id
              ? 'bg-emerald-500 text-white rounded-br-md'
              : 'bg-pink-100 text-ink-900 rounded-bl-md border border-pink-200'
          ]">
            <!-- Quoted reply -->
            <button
              v-if="cell.msg.replyToSnippet"
              @click="jumpToMessageId(cell.msg.replyToId)"
              :class="['w-full text-left mb-1.5 px-2 py-1 rounded-lg border-l-2 text-xs leading-snug truncate-2',
                cell.msg.senderId === userStore.user?.id
                  ? 'bg-white/15 border-white/60 text-white/90 hover:bg-white/25'
                  : 'bg-white/60 border-rose-300 text-ink-700 hover:bg-white']"
            >
              <span class="font-medium opacity-80">{{ quoteSenderName(cell.msg.replyToSenderId) }}</span>
              <span class="opacity-80">：</span>
              <span class="opacity-90">{{ cell.msg.replyToSnippet }}</span>
            </button>
            <!-- Text -->
            <p v-if="cell.msg.msgType === 'text'" class="whitespace-pre-wrap break-words leading-relaxed text-sm">{{ cell.msg.content }}</p>
            <!-- Image (single) -->
            <button
              v-else-if="cell.msg.msgType === 'image'"
              type="button"
              class="block focus:outline-none"
              @click="openImage(cell.msg)"
            >
              <img :src="cell.msg.ossUrl || ''" loading="lazy" class="rounded-xl max-w-full max-h-72 cursor-pointer" />
            </button>
            <!-- File -->
            <a
              v-else-if="cell.msg.msgType === 'file'"
              :href="cell.msg.ossUrl || '#'"
              :download="cell.msg.fileName || 'download'"
              target="_blank"
              rel="noopener"
              :class="['flex items-center gap-2 transition-opacity hover:opacity-90',
                cell.msg.senderId === userStore.user?.id ? 'text-white' : 'text-ink-900']"
            >
              <div :class="['w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', cell.msg.senderId === userStore.user?.id ? 'bg-white/20' : 'bg-pink-200']">
                <Paperclip :size="16" />
              </div>
              <div class="min-w-0">
                <p class="text-sm truncate underline-offset-2 hover:underline">{{ cell.msg.fileName }}</p>
                <p class="text-[10px] opacity-70">{{ formatSize(cell.msg.fileSize) }} · 点击下载</p>
              </div>
            </a>
            <!-- Voice -->
            <VoiceMessage
              v-else-if="cell.msg.msgType === 'voice'"
              :src="cell.msg.ossUrl || ''"
              :duration="cell.msg.duration || 0"
              :is-mine="cell.msg.senderId === userStore.user?.id"
            />
            <!-- Time + read status -->
            <div :class="['flex items-center gap-1 mt-1', cell.msg.senderId === userStore.user?.id ? 'justify-end' : '']">
              <span class="text-[10px] opacity-60">{{ formatTime(cell.msg.createdAt) }}</span>
              <template v-if="cell.msg.senderId === userStore.user?.id">
                <CheckCheck v-if="cell.msg.readAt" :size="12" class="opacity-70" />
                <Check v-else :size="12" class="opacity-60" />
              </template>
            </div>
          </div>
          <button
            v-if="cell.msg.senderId !== userStore.user?.id"
            @click="startReply(cell.msg)"
            class="opacity-0 group-hover/msg:opacity-100 text-ink-400 hover:text-rose-500 transition-opacity"
            title="引用回复"
          >
            <Reply :size="14" />
          </button>
        </div>
      </template>

      <!-- Typing indicator -->
      <div v-if="partnerTyping" class="flex justify-start">
        <div class="bg-white border border-cream-200 rounded-2xl px-4 py-3 flex items-center gap-1.5">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
      </template>
    </div>

    <!-- Input area -->
    <div
      class="bg-white border-t border-cream-200 px-3 sm:px-4 py-2.5 sm:py-3 chat-input-bar"
    >
      <div v-if="replyTo" class="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-cream-100 border-l-2 border-rose-400">
        <Reply :size="14" class="text-rose-500 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-[11px] text-rose-500 font-medium">回复 {{ quoteSenderName(replyTo.senderId) }}</p>
          <p class="text-xs text-ink-700 truncate">{{ quotePreviewText(replyTo) }}</p>
        </div>
        <button @click="cancelReply" class="text-ink-400 hover:text-ink-700 flex-shrink-0">
          <X :size="14" />
        </button>
      </div>
      <div v-if="uploading" class="flex items-center gap-2 mb-2 text-sm text-ink-500">
        <Loader2 :size="14" class="animate-spin" />
        <span>正在上传 {{ uploadFileName }}...</span>
      </div>
      <div class="relative flex items-center gap-2">
        <div v-if="showEmoji" ref="emojiPanelEl" class="absolute left-0 right-0 sm:right-auto sm:w-[22rem] bottom-full mb-2 z-30">
          <EmojiPicker @pick="onPickEmoji" />
        </div>
        <button @click="toggleEmoji" data-emoji-toggle :class="['btn-icon', showEmoji ? '!bg-cream-100' : '']">
          <Smile :size="20" />
        </button>
        <button @click="triggerImage" class="btn-icon">
          <ImagePlus :size="20" />
        </button>
        <button @click="triggerFile" class="btn-icon">
          <Paperclip :size="20" />
        </button>
        <button @click="showVoiceRecorder = !showVoiceRecorder" :class="['btn-icon', showVoiceRecorder ? '!bg-cream-100' : '']">
          <Mic :size="20" />
        </button>
        <template v-if="showVoiceRecorder">
          <VoiceRecorder class="flex-1" @recorded="onVoiceRecorded" @cancel="showVoiceRecorder = false" />
        </template>
        <template v-else>
          <textarea
            v-model="inputText"
            ref="inputEl"
            rows="1"
            class="input flex-1 !py-2 !rounded-xl resize-none max-h-24"
            placeholder="输入消息..."
            @keydown.enter.exact.prevent="sendText"
            @input="handleTyping"
            @focus="onInputFocus"
          ></textarea>
          <button @click="sendText" class="btn-primary !px-3.5 !py-2" :disabled="!inputText.trim()">
            <SendIcon :size="16" />
          </button>
        </template>
      </div>
      <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
      <input ref="fileInput" type="file" class="hidden" @change="handleFileUpload" />
    </div>

    <ImageLightbox
      v-model:show="lightbox.show"
      v-model:index="lightbox.index"
      :items="lightboxItems"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Search, X, Loader2, ChevronUp, Paperclip, ImagePlus, Send as SendIcon, Check, CheckCheck, Reply, Smile, RotateCcw, Heart, Mic } from 'lucide-vue-next'
import type { Socket } from 'socket.io-client'
import { useUserStore } from '@/stores/user'
import { useCoupleStore } from '@/stores/couple'
import { useChatStore } from '@/stores/chat'
import { chatApi } from '@/api'
import { uploadToOss } from '@/api/upload'
import ImageLightbox from '@/components/ImageLightbox.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'
import SafeImage from '@/components/SafeImage.vue'
import VoiceRecorder from '@/components/VoiceRecorder.vue'
import VoiceMessage from '@/components/VoiceMessage.vue'

interface Msg {
  id: number
  coupleId: number
  senderId: number
  msgType: 'text' | 'image' | 'file' | 'voice'
  content: string | null
  ossKey: string | null
  ossUrl: string | null
  fileName: string | null
  fileSize: number
  duration: number | null
  readAt: string | null
  createdAt: string
  replyToId?: number | null
  replyToSenderId?: number | null
  replyToSnippet?: string | null
  deletedAt?: string | null
}

const userStore = useUserStore()
const coupleStore = useCoupleStore()
const chatStore = useChatStore()

const loveScoreText = computed(() => {
  const v = Number(coupleStore.info?.loveScore || 0)
  return v.toFixed(2)
})

const messages = ref<Msg[]>([])
const inputText = ref('')
const inputEl = ref<HTMLTextAreaElement>()
const msgContainer = ref<HTMLDivElement>()
const imageInput = ref<HTMLInputElement>()
const fileInput = ref<HTMLInputElement>()
const searchInput = ref<HTMLInputElement>()

const loading = ref(false)
const loadingHistory = ref(false)
const hasMoreHistory = ref(true)
const showSearch = ref(false)
const searchQuery = ref('')
const searchResults = ref<Msg[]>([])
const searchTotal = ref(0)
const searching = ref(false)
const highlightedId = ref<number | null>(null)
const partnerTyping = ref(false)
const partnerOnline = ref(false)
const uploading = ref(false)
const uploadFileName = ref('')
const replyTo = ref<Msg | null>(null)
const showEmoji = ref(false)
const showVoiceRecorder = ref(false)
const emojiPanelEl = ref<HTMLDivElement>()

function toggleEmoji() {
  showEmoji.value = !showEmoji.value
  if (showEmoji.value) {
    inputEl.value?.blur()
  }
}

function onPickEmoji(emoji: string) {
  const ta = inputEl.value
  if (!ta) {
    inputText.value += emoji
    return
  }
  const start = ta.selectionStart ?? inputText.value.length
  const end = ta.selectionEnd ?? inputText.value.length
  const before = inputText.value.slice(0, start)
  const after = inputText.value.slice(end)
  inputText.value = before + emoji + after
  nextTick(() => {
    ta.focus()
    const pos = before.length + emoji.length
    ta.setSelectionRange(pos, pos)
  })
}

function handleDocClick(e: MouseEvent) {
  if (!showEmoji.value) return
  const t = e.target as Node
  if (emojiPanelEl.value?.contains(t)) return
  const triggerBtn = (e.target as HTMLElement).closest('[data-emoji-toggle]')
  if (triggerBtn) return
  showEmoji.value = false
}

const lightbox = ref({ show: false, index: 0 })

const allImages = computed(() =>
  messages.value
    .filter((m) => m.msgType === 'image' && m.ossUrl)
    .map((m) => ({ msgId: m.id, src: m.ossUrl as string, createdAt: m.createdAt })),
)

const lightboxItems = computed(() =>
  allImages.value.map((im) => ({
    src: im.src,
    caption: formatSearchTime(im.createdAt),
  })),
)

function openImage(msg: Msg) {
  const idx = allImages.value.findIndex((im) => im.msgId === msg.id)
  if (idx >= 0) {
    lightbox.value = { show: true, index: idx }
  }
}

function imageGridClass(count: number) {
  if (count === 1) return 'grid-cols-1 w-44 sm:w-56'
  if (count === 2) return 'grid-cols-2 w-44 sm:w-56'
  if (count === 3) return 'grid-cols-3 w-56 sm:w-64'
  return 'grid-cols-2 w-56 sm:w-64'
}

type DateCell = { kind: 'date'; key: string; iso: string }
type SingleCell = { kind: 'single'; key: string; msg: Msg }
type GroupCell = { kind: 'image-group'; key: string; senderId: number; msgs: Msg[] }
type DisplayCell = DateCell | SingleCell | GroupCell

function isPureImage(m: Msg) {
  return m.msgType === 'image' && !m.replyToId && !m.deletedAt
}

const displayCells = computed<DisplayCell[]>(() => {
  const cells: DisplayCell[] = []
  let lastDate = ''
  let i = 0
  while (i < messages.value.length) {
    const m = messages.value[i]
    const day = new Date(m.createdAt).toDateString()
    if (day !== lastDate) {
      cells.push({ kind: 'date', key: `d-${day}`, iso: m.createdAt })
      lastDate = day
    }
    if (isPureImage(m)) {
      const group: Msg[] = [m]
      let j = i + 1
      while (j < messages.value.length) {
        const n = messages.value[j]
        const sameDay = new Date(n.createdAt).toDateString() === day
        if (
          sameDay &&
          n.senderId === m.senderId &&
          isPureImage(n) &&
          new Date(n.createdAt).getTime() - new Date(messages.value[j - 1].createdAt).getTime() < 5 * 60 * 1000
        ) {
          group.push(n)
          j++
        } else {
          break
        }
      }
      if (group.length >= 2) {
        cells.push({
          kind: 'image-group',
          key: `g-${group[0].id}-${group.length}`,
          senderId: m.senderId,
          msgs: group,
        })
        i = j
        continue
      }
    }
    cells.push({ kind: 'single', key: `s-${m.id}`, msg: m })
    i++
  }
  return cells
})

function startReply(msg: Msg) {
  replyTo.value = msg
  nextTick(() => inputEl.value?.focus())
}
function cancelReply() {
  replyTo.value = null
}

const RECALL_WINDOW_MS = 2 * 60 * 1000
const nowTick = ref(Date.now())
let nowTimer: ReturnType<typeof setInterval> | null = null

function canRecall(msg: Msg): boolean {
  if (msg.deletedAt) return false
  if (msg.senderId !== userStore.user?.id) return false
  const age = nowTick.value - new Date(msg.createdAt).getTime()
  return age >= 0 && age < RECALL_WINDOW_MS
}

function recallMessage(msg: Msg) {
  if (!socket || !canRecall(msg)) return
  socket.emit('message:recall', { id: msg.id })
}

function reEditRecalled(msg: Msg) {
  if (msg.senderId !== userStore.user?.id) return
  if (msg.msgType !== 'text') return
  const original = (msg as any)._originalContent as string | undefined
  if (!original) return
  inputText.value = original
  if (replyTo.value?.id === msg.id) replyTo.value = null
  nextTick(() => inputEl.value?.focus())
}

function quotePreviewText(msg: Msg): string {
  if (msg.msgType === 'text') {
    const t = (msg.content || '').replace(/\s+/g, ' ').trim()
    return t.length > 80 ? t.slice(0, 80) + '…' : t
  }
  if (msg.msgType === 'image') return '[图片]'
  if (msg.msgType === 'file') return `[文件:${msg.fileName || '文件'}]`
  return ''
}

function quoteSenderName(senderId: number | null | undefined) {
  if (!senderId) return ''
  if (senderId === userStore.user?.id) return '我'
  return partnerName.value
}

let socket: Socket | null = null
let typingTimer: ReturnType<typeof setTimeout> | null = null
let searchTimer: ReturnType<typeof setTimeout> | null = null
let typingSent = false

const partner = computed(() => {
  const members = coupleStore.info?.members || []
  return members.find((m) => m.id !== userStore.user?.id)
})
const partnerName = computed(() => partner.value?.nickname || partner.value?.username || '伴侣')
const partnerInitial = computed(() => {
  const name = partnerName.value
  return name ? name.charAt(0).toUpperCase() : '·'
})
const selfDisplayName = computed(() => userStore.user?.nickname || userStore.user?.username || '我')
const selfInitial = computed(() => {
  const name = selfDisplayName.value
  return name ? name.charAt(0).toUpperCase() : '·'
})

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDateLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return '今天'
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function formatSearchTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${formatTime(iso)}`
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function showDateSeparator(idx: number) {
  if (idx === 0) return true
  const cur = new Date(messages.value[idx].createdAt).toDateString()
  const prev = new Date(messages.value[idx - 1].createdAt).toDateString()
  return cur !== prev
}
void showDateSeparator

function highlightSegments(text: string, q: string): Array<{ text: string; mark: boolean }> {
  if (!q) return [{ text, mark: false }]
  const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${safeQ})`, 'gi')
  const parts = text.split(regex)
  if (parts.length <= 1) return [{ text, mark: false }]
  const matcher = new RegExp(`^${safeQ}$`, 'i')
  return parts.filter((p) => p.length > 0).map((p) => ({ text: p, mark: matcher.test(p) }))
}

function scrollToBottom() {
  nextTick(() => {
    if (msgContainer.value) {
      msgContainer.value.scrollTop = msgContainer.value.scrollHeight
    }
  })
}

function onInputFocus() {
  showEmoji.value = false
  setTimeout(scrollToBottom, 50)
  setTimeout(scrollToBottom, 250)
  setTimeout(scrollToBottom, 500)
}

function onViewportResize() {
  if (document.activeElement === inputEl.value) {
    scrollToBottom()
  }
}

async function loadHistory() {
  loading.value = true
  try {
    const data = await chatApi.history(undefined, 30)
    messages.value = data
    hasMoreHistory.value = data.length === 30
    scrollToBottom()
    chatStore.clear()
  } finally {
    loading.value = false
  }
}

async function loadEarlier() {
  if (messages.value.length === 0) return
  loadingHistory.value = true
  try {
    const oldest = messages.value[0]
    const data = await chatApi.history(oldest.id, 30)
    messages.value = [...data, ...messages.value]
    hasMoreHistory.value = data.length === 30
  } finally {
    loadingHistory.value = false
  }
}

function setupSocket() {
  if (!userStore.token) return
  const s = chatStore.connect(userStore.token)
  socket = s

  s.off('message:new', onMessageNew)
  s.off('message:recalled', onMessageRecalled)
  s.off('message:recall:error', onRecallError)
  s.off('typing', onTyping)
  s.off('read', onRead)
  s.on('message:new', onMessageNew)
  s.on('message:recalled', onMessageRecalled)
  s.on('message:recall:error', onRecallError)
  s.on('typing', onTyping)
  s.on('read', onRead)

  const partnerId = partner.value?.id
  partnerOnline.value = partnerId ? chatStore.onlineUserIds.includes(partnerId) : false
}

const onMessageNew = (msg: Msg) => {
  messages.value.push(msg)
  scrollToBottom()
  if (msg.senderId !== userStore.user?.id) {
    socket?.emit('read')
    chatStore.clear()
  }
}

const onMessageRecalled = (msg: Msg) => {
  const idx = messages.value.findIndex((m) => m.id === msg.id)
  if (idx >= 0) {
    const prev = messages.value[idx]
    const merged: Msg = {
      ...prev,
      ...msg,
    }
    if (prev.senderId === userStore.user?.id && prev.msgType === 'text' && prev.content) {
      ;(merged as any)._originalContent = (prev as any)._originalContent ?? prev.content
    }
    messages.value.splice(idx, 1, merged)
  }
  if (replyTo.value?.id === msg.id) {
    replyTo.value = null
  }
  if (searchResults.value.length) {
    searchResults.value = searchResults.value.filter((r) => r.id !== msg.id)
  }
}

const onRecallError = (data: { id: number; message: string }) => {
  console.warn('[recall]', data)
  if (typeof window !== 'undefined') {
    window.alert(data.message || '撤回失败')
  }
}

const onTyping = () => {
  partnerTyping.value = true
  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = setTimeout(() => { partnerTyping.value = false }, 2000)
}

const onRead = () => {
  messages.value.forEach((m) => {
    if (m.senderId === userStore.user?.id && !m.readAt) {
      m.readAt = new Date().toISOString()
    }
  })
}

watch(
  () => [chatStore.onlineUserIds, partner.value?.id] as const,
  ([list, partnerId]) => {
    partnerOnline.value = !!partnerId && (list as number[]).includes(partnerId)
  },
  { deep: true },
)

function sendText() {
  const text = inputText.value.trim()
  if (!text || !socket) return
  socket.emit('message:send', {
    msgType: 'text',
    content: text,
    replyToId: replyTo.value?.id,
  })
  inputText.value = ''
  replyTo.value = null
  showEmoji.value = false
  typingSent = false
}

function handleTyping() {
  if (typingSent || !socket) return
  socket.emit('typing')
  typingSent = true
  setTimeout(() => { typingSent = false }, 1500)
}

function triggerImage() { imageInput.value?.click() }
function triggerFile() { fileInput.value?.click() }

async function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !socket) return
  uploading.value = true
  uploadFileName.value = file.name
  try {
    const res = await uploadToOss(file, 'chat', 'image')
    socket.emit('message:send', {
      msgType: 'image',
      ossKey: res.key,
      fileSize: res.size,
      replyToId: replyTo.value?.id,
    })
    replyTo.value = null
  } finally {
    uploading.value = false
    if (imageInput.value) imageInput.value.value = ''
  }
}

async function handleFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !socket) return
  uploading.value = true
  uploadFileName.value = file.name
  try {
    const res = await uploadToOss(file, 'chat', 'file')
    socket.emit('message:send', {
      msgType: 'file',
      ossKey: res.key,
      fileName: res.name,
      fileSize: res.size,
      replyToId: replyTo.value?.id,
    })
    replyTo.value = null
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function onVoiceRecorded(blob: Blob, duration: number) {
  if (!socket) return
  showVoiceRecorder.value = false
  uploading.value = true
  uploadFileName.value = '语音消息'
  try {
    const ext = blob.type.includes('mp4') ? '.m4a' : '.webm'
    const file = new File([blob], `voice${ext}`, { type: blob.type })
    const res = await uploadToOss(file, 'chat', 'voice')
    socket.emit('message:send', {
      msgType: 'voice',
      ossKey: res.key,
      fileSize: res.size,
      duration,
      replyToId: replyTo.value?.id,
    })
    replyTo.value = null
  } finally {
    uploading.value = false
  }
}

function jumpToMessage(msg: Msg) {
  showSearch.value = false
  const el = msgContainer.value?.querySelector(`[data-msg-id="${msg.id}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightedId.value = msg.id
    setTimeout(() => { highlightedId.value = null }, 1800)
  } else {
    chatApi.history(msg.id + 30, 60).then((data) => {
      messages.value = data
      nextTick(() => {
        const el2 = msgContainer.value?.querySelector(`[data-msg-id="${msg.id}"]`)
        if (el2) {
          el2.scrollIntoView({ behavior: 'smooth', block: 'center' })
          highlightedId.value = msg.id
          setTimeout(() => { highlightedId.value = null }, 1800)
        }
      })
    })
  }
}

function jumpToMessageId(id: number | null | undefined) {
  if (!id) return
  const el = msgContainer.value?.querySelector(`[data-msg-id="${id}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightedId.value = id
    setTimeout(() => { highlightedId.value = null }, 1800)
  }
}

watch(searchQuery, (q) => {
  if (searchTimer) clearTimeout(searchTimer)
  if (!q.trim()) { searchResults.value = []; return }
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      const res = await chatApi.search(q, 1, 50)
      searchResults.value = res.items
      searchTotal.value = res.total
    } finally {
      searching.value = false
    }
  }, 280)
})

onMounted(async () => {
  const infoPromise = coupleStore.info ? Promise.resolve() : coupleStore.fetchInfo()
  const historyPromise = loadHistory()
  setupSocket()
  document.addEventListener('click', handleDocClick)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onViewportResize)
  }
  nowTimer = setInterval(() => { nowTick.value = Date.now() }, 15_000)
  await Promise.all([infoPromise, historyPromise])
})

onBeforeUnmount(() => {
  if (socket) {
    socket.off('message:new', onMessageNew)
    socket.off('message:recalled', onMessageRecalled)
    socket.off('message:recall:error', onRecallError)
    socket.off('typing', onTyping)
    socket.off('read', onRead)
    socket = null
  }
  if (typingTimer) clearTimeout(typingTimer)
  if (searchTimer) clearTimeout(searchTimer)
  if (nowTimer) clearInterval(nowTimer)
  document.removeEventListener('click', handleDocClick)
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', onViewportResize)
  }
})
</script>

<style scoped>
.chat-input-bar {
  padding-bottom: calc(0.625rem + 3.5rem + env(safe-area-inset-bottom));
}
@media (min-width: 768px) {
  .chat-input-bar {
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
  }
}
</style>
