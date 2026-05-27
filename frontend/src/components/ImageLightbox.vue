<template>
  <Transition name="lb-fade">
    <div
      v-if="show"
      class="fixed inset-0 z-[60] bg-ink-900/95 select-none"
      @click.self="close"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
      style="padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);"
    >
      <button
        @click="close"
        class="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center text-white"
        style="top: calc(0.75rem + env(safe-area-inset-top)); right: calc(0.75rem + env(safe-area-inset-right));"
      >
        <X :size="20" />
      </button>
      <div
        v-if="items.length > 1"
        class="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white text-xs"
        style="top: calc(0.75rem + env(safe-area-inset-top)); left: calc(0.75rem + env(safe-area-inset-left));"
      >
        {{ index + 1 }} / {{ items.length }}
      </div>

      <button
        v-if="items.length > 1 && index > 0"
        @click.stop="prev"
        class="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur items-center justify-center text-white"
      >
        <ChevronLeft :size="22" />
      </button>
      <button
        v-if="items.length > 1 && index < items.length - 1"
        @click.stop="next"
        class="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur items-center justify-center text-white"
      >
        <ChevronRight :size="22" />
      </button>

      <div class="absolute inset-0 flex items-center justify-center px-2" @click.self="close">
        <img
          :key="currentSrc"
          :src="currentSrc"
          class="max-w-full max-h-full object-contain rounded-xl"
          draggable="false"
          @click.stop
        />
      </div>

      <div
        v-if="currentCaption"
        class="absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/15 backdrop-blur text-white text-xs max-w-[80vw] truncate"
        style="bottom: calc(1rem + env(safe-area-inset-bottom));"
      >
        {{ currentCaption }}
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Item {
  src: string
  caption?: string
}

const props = defineProps<{
  show: boolean
  items: Item[]
  index: number
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'update:index': [value: number]
}>()

const index = computed({
  get: () => props.index,
  set: (v) => emit('update:index', v),
})

const currentSrc = computed(() => props.items[props.index]?.src || '')
const currentCaption = computed(() => props.items[props.index]?.caption || '')

function close() {
  emit('update:show', false)
}
function prev() {
  if (props.index > 0) emit('update:index', props.index - 1)
}
function next() {
  if (props.index < props.items.length - 1) emit('update:index', props.index + 1)
}

const touch = ref({ x: 0, y: 0, t: 0 })
function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  touch.value = { x: t.clientX, y: t.clientY, t: Date.now() }
}
function onTouchMove(_: TouchEvent) {}
function onTouchEnd(e: TouchEvent) {
  const t = e.changedTouches[0]
  if (!t) return
  const dx = t.clientX - touch.value.x
  const dy = t.clientY - touch.value.y
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
    if (dx < 0) next()
    else prev()
  } else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
    close()
  }
}

function onKey(e: KeyboardEvent) {
  if (!props.show) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'ArrowRight') next()
}

watch(
  () => props.show,
  (s) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = s ? 'hidden' : ''
  },
)

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<style scoped>
.lb-fade-enter-active,
.lb-fade-leave-active {
  transition: opacity 0.18s ease;
}
.lb-fade-enter-from,
.lb-fade-leave-to {
  opacity: 0;
}
</style>
