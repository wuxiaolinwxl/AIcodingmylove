<template>
  <div
    :class="['flex items-center gap-2 px-3 py-2 rounded-xl min-w-[140px] max-w-[220px] cursor-pointer select-none',
      isMine ? 'bg-rose-100' : 'bg-cream-100']"
    @click="toggle"
  >
    <button class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors"
      :class="isMine ? 'bg-rose-500 text-white' : 'bg-ink-700 text-white'"
    >
      <Pause v-if="playing" :size="12" />
      <Play v-else :size="12" class="ml-0.5" />
    </button>
    <div class="flex-1 flex items-center gap-1 h-5 overflow-hidden">
      <div
        v-for="(h, i) in bars"
        :key="i"
        :class="['w-[3px] rounded-full transition-all duration-150',
          isMine ? 'bg-rose-400' : 'bg-ink-400']"
        :style="{ height: h + 'px', opacity: i <= playedBars ? 1 : 0.4 }"
      ></div>
    </div>
    <span class="text-[11px] text-ink-500 shrink-0 tabular-nums">{{ formattedDuration }}</span>
    <audio ref="audioEl" :src="src" preload="metadata" @ended="onEnded" @timeupdate="onTimeUpdate" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { Play, Pause } from 'lucide-vue-next'

const props = defineProps<{
  src: string
  duration: number
  isMine: boolean
}>()

const audioEl = ref<HTMLAudioElement>()
const playing = ref(false)
const currentTime = ref(0)

const BAR_COUNT = 20
const bars = computed(() => {
  const arr: number[] = []
  for (let i = 0; i < BAR_COUNT; i++) {
    arr.push(4 + Math.abs(Math.sin((i * 1.3) + props.duration)) * 14)
  }
  return arr
})

const playedBars = computed(() => {
  if (!props.duration || !playing.value) return -1
  return Math.floor((currentTime.value / props.duration) * BAR_COUNT)
})

const formattedDuration = computed(() => {
  const s = Math.round(props.duration || 0)
  if (s < 60) return `${s}″`
  return `${Math.floor(s / 60)}′${s % 60}″`
})

function toggle() {
  if (!audioEl.value) return
  if (playing.value) {
    audioEl.value.pause()
    playing.value = false
  } else {
    audioEl.value.play()
    playing.value = true
  }
}

function onEnded() {
  playing.value = false
  currentTime.value = 0
}

function onTimeUpdate() {
  if (audioEl.value) currentTime.value = audioEl.value.currentTime
}

onUnmounted(() => {
  if (audioEl.value) audioEl.value.pause()
})
</script>
