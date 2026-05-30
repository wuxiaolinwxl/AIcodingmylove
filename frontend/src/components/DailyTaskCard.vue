<template>
  <div v-if="task" class="card !p-4 mb-5 border-rose-100 bg-gradient-to-r from-rose-50/80 to-white">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
        <Sparkles :size="16" class="text-rose-500" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-[11px] text-rose-400 font-medium mb-0.5">今日小任务</p>
        <p class="text-sm text-ink-900 truncate">{{ task.title }}</p>
      </div>
      <button
        @click="complete"
        :disabled="completing"
        class="btn-primary !py-1.5 !px-3 text-xs shrink-0"
      >
        <Loader2 v-if="completing" :size="12" class="animate-spin" />
        <Check v-else :size="12" />
        完成
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Sparkles, Check, Loader2 } from 'lucide-vue-next'
import { bucketApi } from '@/api'

const emit = defineEmits<{ completed: [id: number] }>()

interface Task {
  id: number
  title: string
  category: string
}

const task = ref<Task | null>(null)
const completing = ref(false)

async function load() {
  try {
    const res = await bucketApi.dailyTask()
    task.value = res || null
  } catch {
    task.value = null
  }
}

async function complete() {
  if (!task.value || completing.value) return
  completing.value = true
  try {
    await bucketApi.toggle(task.value.id)
    emit('completed', task.value.id)
    task.value = null
  } catch {
    // ignore
  } finally {
    completing.value = false
  }
}

onMounted(load)
</script>
