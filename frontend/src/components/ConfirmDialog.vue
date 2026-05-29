<template>
  <Transition name="cd-fade">
    <div
      v-if="show"
      class="fixed inset-0 z-[70] bg-ink-900/50 flex items-end md:items-center justify-center p-4"
      @click.self="cancel"
      style="padding-bottom: calc(1rem + env(safe-area-inset-bottom));"
    >
      <div
        class="card w-full max-w-sm !p-5 animate-fade-up"
        role="dialog"
        aria-modal="true"
      >
        <p v-if="title" class="text-base font-semibold text-ink-900 mb-1">{{ title }}</p>
        <p class="text-sm text-ink-700">{{ message }}</p>
        <div class="flex gap-2 mt-5">
          <button type="button" class="btn-secondary flex-1" @click="cancel">
            {{ cancelText }}
          </button>
          <button type="button" class="btn-primary flex-1" @click="confirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    show: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  }>(),
  {
    title: '',
    confirmText: '确定',
    cancelText: '取消',
  },
);

const emit = defineEmits<{
  'update:show': [value: boolean];
  confirm: [];
  cancel: [];
}>();

function cancel() {
  emit('update:show', false);
  emit('cancel');
}

function confirm() {
  emit('update:show', false);
  emit('confirm');
}
</script>

<style scoped>
.cd-fade-enter-active,
.cd-fade-leave-active {
  transition: opacity 0.18s ease;
}
.cd-fade-enter-from,
.cd-fade-leave-to {
  opacity: 0;
}
</style>
