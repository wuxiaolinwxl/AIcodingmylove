<template>
  <div class="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
    <button
      v-if="!recording"
      @click="start"
      class="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
      title="开始录音"
    >
      <Mic :size="18" />
    </button>
    <template v-else>
      <button
        @click="cancel"
        class="w-8 h-8 rounded-full bg-ink-200 text-ink-600 flex items-center justify-center hover:bg-ink-300 transition-colors"
        title="取消"
      >
        <X :size="14" />
      </button>
      <div class="flex-1 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
        <span class="text-sm text-rose-600 font-medium tabular-nums">{{ formattedTime }}</span>
      </div>
      <button
        @click="stop"
        class="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
        title="发送"
      >
        <Send :size="16" />
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { Mic, X, Send } from 'lucide-vue-next'

const emit = defineEmits<{ recorded: [blob: Blob, duration: number]; cancel: [] }>()

const recording = ref(false)
const elapsed = ref(0)

let mediaRecorder: MediaRecorder | null = null
let chunks: Blob[] = []
let timer: ReturnType<typeof setInterval> | null = null
let stream: MediaStream | null = null

const formattedTime = computed(() => {
  const s = elapsed.value
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
})

async function start() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    alert('无法获取麦克风权限')
    return
  }
  chunks = []
  elapsed.value = 0

  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : ''

  mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: mediaRecorder?.mimeType || 'audio/webm' })
    const duration = elapsed.value
    cleanup()
    if (duration > 0) {
      emit('recorded', blob, duration)
    }
  }
  mediaRecorder.start()
  recording.value = true
  timer = setInterval(() => {
    elapsed.value++
    if (elapsed.value >= 120) stop()
  }, 1000)
}

function stop() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop()
  }
  recording.value = false
}

function cancel() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.ondataavailable = null
    mediaRecorder.onstop = null
    mediaRecorder.stop()
  }
  cleanup()
  recording.value = false
  emit('cancel')
}

function cleanup() {
  if (timer) { clearInterval(timer); timer = null }
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null }
}

onUnmounted(() => {
  if (recording.value) cancel()
})
</script>
