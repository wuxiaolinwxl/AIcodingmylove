<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm" @click.self="close">
        <div class="card max-w-md w-full mx-4 max-h-[92vh] !p-6 overflow-y-auto animate-fade-up">
          <!-- Header -->
          <div class="flex items-center justify-between mb-5">
            <div>
              <h2 class="text-lg font-bold text-ink-900">记下这一刻</h2>
              <p class="text-xs text-ink-500 mt-0.5">为时间轴添加一段回忆</p>
            </div>
            <button @click="close" class="btn-icon">
              <X :size="18" />
            </button>
          </div>

          <!-- Type selection -->
          <div class="grid grid-cols-4 gap-2 mb-5">
            <button
              v-for="t in types"
              :key="t.value"
              @click="form.type = t.value"
              :class="['flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors',
                form.type === t.value ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-cream-200 text-ink-700 hover:bg-cream-50']"
            >
              <component :is="t.icon" :size="20" :stroke-width="1.7" />
              <span class="text-xs">{{ t.label }}</span>
            </button>
          </div>

          <!-- Date -->
          <div class="mb-4">
            <label class="text-xs text-ink-500 mb-1 block">记忆日期</label>
            <input v-model="form.memoryDate" type="datetime-local" class="input" />
          </div>

          <!-- Title (non-text) -->
          <div v-if="form.type !== 'text'" class="mb-4">
            <label class="text-xs text-ink-500 mb-1 block">标题</label>
            <input v-model="form.title" class="input" placeholder="给这段回忆起个名字" />
          </div>

          <!-- Content / description -->
          <div class="mb-4">
            <label class="text-xs text-ink-500 mb-1 block">{{ form.type === 'text' ? '正文' : '描述' }}</label>
            <textarea
              v-model="form.content"
              :class="['input resize-none', form.type === 'text' ? 'min-h-[140px]' : 'h-16']"
              :placeholder="form.type === 'text' ? '写下你想记录的文字...' : '可选描述'"
            ></textarea>
          </div>

          <!-- File upload (non-text) -->
          <div v-if="form.type !== 'text'" class="mb-5">
            <label class="text-xs text-ink-500 mb-1 block">文件</label>
            <div
              @click="triggerFileInput"
              :class="['border rounded-xl p-4 text-center cursor-pointer transition-colors',
                uploaded ? 'border-emerald-300 bg-emerald-50/40' : 'border-dashed border-cream-300 bg-cream-50 hover:border-rose-300 hover:bg-rose-50/30']"
            >
              <template v-if="uploading">
                <Loader2 :size="22" class="animate-spin mx-auto mb-1 text-rose-500" />
                <p class="text-sm text-ink-700">上传中...</p>
              </template>
              <template v-else-if="uploaded">
                <CheckCircle :size="22" class="mx-auto mb-1 text-emerald-600" />
                <template v-if="uploadedFiles.length > 1">
                  <p class="text-sm text-ink-700">已选择 {{ uploadedFiles.length }} 张照片</p>
                  <p class="text-xs text-ink-500">共 {{ formatSize(uploadedFiles.reduce((s, f) => s + f.size, 0)) }} · 点击重新选择</p>
                </template>
                <template v-else>
                  <p class="text-sm text-ink-700 truncate">{{ uploadedName }}</p>
                  <p class="text-xs text-ink-500">{{ formatSize(uploadedSize) }} · 点击重新选择</p>
                </template>
              </template>
              <template v-else>
                <Upload :size="22" class="mx-auto mb-1 text-ink-500" />
                <p class="text-sm text-ink-700">点击选择文件</p>
                <p class="text-xs text-ink-500">支持图片、视频、音频</p>
              </template>
            </div>
            <input ref="fileEl" type="file" class="hidden" :accept="acceptType" :multiple="form.type === 'photo'" @change="handleFile" />
          </div>

          <!-- Error -->
          <div v-if="error" class="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg mb-4">
            <AlertCircle :size="14" class="text-rose-600 flex-shrink-0" />
            <span class="text-xs text-rose-600">{{ error }}</span>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button @click="close" class="btn-secondary flex-1">取消</button>
            <button @click="submit" class="btn-primary flex-1" :disabled="submitting">
              <Loader2 v-if="submitting" :size="14" class="animate-spin" />
              {{ submitting ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Image, Video, Music, FileText, Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-vue-next'
import { memoryApi } from '@/api'
import { uploadToOss } from '@/api/upload'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; created: [] }>()

function toLocalDateTimeString(date: Date) {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

const types = [
  { value: 'photo', label: '照片', icon: Image },
  { value: 'video', label: '视频', icon: Video },
  { value: 'song', label: '歌曲', icon: Music },
  { value: 'text', label: '文字', icon: FileText },
]

const form = ref({
  type: 'photo' as string,
  title: '',
  content: '',
  memoryDate: toLocalDateTimeString(new Date()),
})

const fileEl = ref<HTMLInputElement>()
const uploaded = ref(false)
const uploading = ref(false)
const uploadedName = ref('')
const uploadedSize = ref(0)
const uploadedKey = ref('')
const uploadedUrl = ref('')
const uploadedFiles = ref<{ key: string; url: string; size: number; name: string }[]>([])
const error = ref('')
const submitting = ref(false)

const acceptType = computed(() => {
  if (form.value.type === 'photo') return 'image/*'
  if (form.value.type === 'video') return 'video/*'
  if (form.value.type === 'song') return 'audio/*'
  return '*'
})

function close() {
  emit('update:modelValue', false)
}

function triggerFileInput() {
  fileEl.value?.click()
}

async function handleFile(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return
  uploading.value = true
  error.value = ''
  uploadedFiles.value = []
  try {
    uploadedFiles.value = await Promise.all(
      Array.from(files).map((file) => uploadToOss(file, 'memory', form.value.type))
    )
    const last = uploadedFiles.value[uploadedFiles.value.length - 1]
    uploaded.value = true
    uploadedName.value = last.name
    uploadedSize.value = last.size
    uploadedKey.value = last.key
    uploadedUrl.value = last.url
  } catch (e: any) {
    error.value = '文件上传失败，请重试'
  } finally {
    uploading.value = false
    if (fileEl.value) fileEl.value.value = ''
  }
}

async function submit() {
  error.value = ''
  if (form.value.type === 'text' && !form.value.content.trim()) {
    error.value = '请输入文字内容'
    return
  }
  if (form.value.type !== 'text' && !uploaded.value) {
    error.value = '请先上传文件'
    return
  }

  submitting.value = true
  try {
    const memoryDate = new Date(form.value.memoryDate).toISOString()
    if (uploadedFiles.value.length > 1) {
      await Promise.all(
        uploadedFiles.value.map((f) =>
          memoryApi.create({
            type: form.value.type,
            title: form.value.title || undefined,
            content: form.value.content || undefined,
            ossKey: f.key,
            ossUrl: f.url,
            fileSize: f.size,
            memoryDate,
          }),
        ),
      )
    } else {
      await memoryApi.create({
        type: form.value.type,
        title: form.value.title || undefined,
        content: form.value.content || undefined,
        ossKey: uploadedKey.value || undefined,
        ossUrl: uploadedUrl.value || undefined,
        fileSize: uploadedSize.value || 0,
        memoryDate,
      })
    }
    resetForm()
    emit('created')
  } catch (e: any) {
    error.value = e?.response?.data?.message || '保存失败'
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.value = { type: 'photo', title: '', content: '', memoryDate: toLocalDateTimeString(new Date()) }
  uploaded.value = false
  uploadedKey.value = ''
  uploadedUrl.value = ''
  uploadedName.value = ''
  uploadedSize.value = 0
  uploadedFiles.value = []
  error.value = ''
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

watch(() => props.modelValue, (v) => {
  if (v) resetForm()
})
</script>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: all 0.25s ease-out;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .card, .modal-leave-to .card {
  transform: scale(0.96) translateY(8px);
}
</style>
