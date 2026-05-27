<template>
  <div class="flex flex-col h-[100dvh] bg-cream-50">
    <!-- Header -->
    <div class="bg-white border-b border-cream-200 px-4 py-3 flex items-center gap-3">
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
            <p class="text-sm text-ink-700 line-clamp-2" v-html="highlight(r.content || r.fileName || '', searchQuery)"></p>
          </button>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <div ref="msgContainer" class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      <div v-if="loadingHistory" class="text-center py-2">
        <Loader2 :size="14" class="animate-spin inline text-ink-500" />
      </div>
      <button v-else-if="hasMoreHistory" @click="loadEarlier" class="btn-ghost mx-auto flex text-xs">
        <ChevronUp :size="14" />
        查看更早的消息
      </button>

      <template v-for="(msg, idx) in messages" :key="msg.id">
        <!-- Date separator -->
        <div v-if="showDateSeparator(idx)" class="flex justify-center my-2">
          <span class="px-3 py-1 rounded-full bg-cream-100 text-ink-500 text-[11px]">
            {{ formatDateLabel(msg.createdAt) }}
          </span>
        </div>

        <!-- Message bubble -->
        <div
          :data-msg-id="msg.id"
          :class="['flex transition-shadow duration-300 rounded-2xl',
            msg.senderId === userStore.user?.id ? 'justify-end' : 'justify-start',
            highlightedId === msg.id ? 'ring-2 ring-rose-300 ring-offset-2 ring-offset-cream-50' : '']"
        >
          <div :class="[
            'max-w-[75%] px-3.5 py-2 rounded-2xl',
            msg.senderId === userStore.user?.id
              ? 'bg-emerald-500 text-white rounded-br-md'
              : 'bg-pink-100 text-ink-900 rounded-bl-md border border-pink-200'
          ]">
            <!-- Text -->
            <p v-if="msg.msgType === 'text'" class="whitespace-pre-wrap break-words leading-relaxed text-sm">{{ msg.content }}</p>
            <!-- Image -->
            <img v-else-if="msg.msgType === 'image'" :src="msg.ossKey" class="rounded-xl max-w-full max-h-72 cursor-pointer" />
            <!-- File -->
            <div v-else-if="msg.msgType === 'file'" class="flex items-center gap-2">
              <div :class="['w-9 h-9 rounded-lg flex items-center justify-center', msg.senderId === userStore.user?.id ? 'bg-white/20' : 'bg-pink-200']">
                <Paperclip :size="16" />
              </div>
              <div class="min-w-0">
                <p class="text-sm truncate">{{ msg.fileName }}</p>
                <p class="text-[10px] opacity-70">{{ formatSize(msg.fileSize) }}</p>
              </div>
            </div>
            <!-- Time + read status -->
            <div :class="['flex items-center gap-1 mt-1', msg.senderId === userStore.user?.id ? 'justify-end' : '']">
              <span class="text-[10px] opacity-60">{{ formatTime(msg.createdAt) }}</span>
              <template v-if="msg.senderId === userStore.user?.id">
                <CheckCheck v-if="msg.readAt" :size="12" class="opacity-70" />
                <Check v-else :size="12" class="opacity-60" />
              </template>
            </div>
          </div>
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
    </div>

    <!-- Input area -->
    <div class="bg-white border-t border-cream-200 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div v-if="uploading" class="flex items-center gap-2 mb-2 text-sm text-ink-500">
        <Loader2 :size="14" class="animate-spin" />
        <span>正在上传 {{ uploadFileName }}...</span>
      </div>
      <div class="flex items-center gap-2">
        <button @click="triggerImage" class="btn-icon">
          <ImagePlus :size="20" />
        </button>
        <button @click="triggerFile" class="btn-icon">
          <Paperclip :size="20" />
        </button>
        <textarea
          v-model="inputText"
          ref="inputEl"
          rows="1"
          class="input flex-1 !py-2 !rounded-xl resize-none max-h-24"
          placeholder="输入消息..."
          @keydown.enter.exact.prevent="sendText"
          @input="handleTyping"
        ></textarea>
        <button @click="sendText" class="btn-primary !px-3.5 !py-2" :disabled="!inputText.trim()">
          <SendIcon :size="16" />
        </button>
      </div>
      <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
      <input ref="fileInput" type="file" class="hidden" @change="handleFileUpload" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Search, X, Loader2, ChevronUp, Paperclip, ImagePlus, Send as SendIcon, Check, CheckCheck } from 'lucide-vue-next'
import { io, Socket } from 'socket.io-client'
import { useUserStore } from '@/stores/user'
import { useCoupleStore } from '@/stores/couple'
import { chatApi } from '@/api'
import { uploadToOss } from '@/api/upload'

interface Msg {
  id: number
  coupleId: number
  senderId: number
  msgType: 'text' | 'image' | 'file'
  content: string | null
  ossKey: string | null
  fileName: string | null
  fileSize: number
  readAt: string | null
  createdAt: string
}

const userStore = useUserStore()
const coupleStore = useCoupleStore()

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

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlight(text: string, q: string) {
  if (!q) return escapeHtml(text)
  const escaped = escapeHtml(text)
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return escaped.replace(regex, '<mark class="bg-rose-100 text-rose-700 rounded px-0.5">$1</mark>')
}

function scrollToBottom() {
  nextTick(() => {
    if (msgContainer.value) {
      msgContainer.value.scrollTop = msgContainer.value.scrollHeight
    }
  })
}

async function loadHistory() {
  loading.value = true
  try {
    const data = await chatApi.history(undefined, 30)
    messages.value = data
    hasMoreHistory.value = data.length === 30
    scrollToBottom()
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
  socket = io(`${location.protocol}//${location.host}/chat`, {
    transports: ['websocket', 'polling'],
    auth: { token: userStore.token },
    path: '/socket.io',
  })

  socket.on('connected', () => {
    partnerOnline.value = true
  })

  socket.on('message:new', (msg: Msg) => {
    messages.value.push(msg)
    scrollToBottom()
    if (msg.senderId !== userStore.user?.id) {
      socket?.emit('read')
    }
  })

  socket.on('typing', () => {
    partnerTyping.value = true
    if (typingTimer) clearTimeout(typingTimer)
    typingTimer = setTimeout(() => { partnerTyping.value = false }, 2000)
  })

  socket.on('read', () => {
    messages.value.forEach((m) => {
      if (m.senderId === userStore.user?.id && !m.readAt) {
        m.readAt = new Date().toISOString()
      }
    })
  })

  socket.on('disconnect', () => {
    partnerOnline.value = false
  })
}

function sendText() {
  const text = inputText.value.trim()
  if (!text || !socket) return
  socket.emit('message:send', { msgType: 'text', content: text })
  inputText.value = ''
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
    socket.emit('message:send', { msgType: 'image', ossKey: res.url, fileSize: res.size })
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
    socket.emit('message:send', { msgType: 'file', ossKey: res.url, fileName: res.name, fileSize: res.size })
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
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

onMounted(() => {
  loadHistory()
  setupSocket()
})

onBeforeUnmount(() => {
  socket?.disconnect()
  if (typingTimer) clearTimeout(typingTimer)
  if (searchTimer) clearTimeout(searchTimer)
})
</script>
