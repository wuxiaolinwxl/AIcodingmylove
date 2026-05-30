<template>
  <div class="safe-image" :class="wrapperClass">
    <img
      v-if="src && !failed"
      :key="attempt"
      :src="resolvedSrc"
      :alt="alt"
      :loading="loading"
      :class="[imgClass, loaded ? 'safe-img-loaded' : 'safe-img-loading']"
      decoding="async"
      @load="onLoad"
      @error="onError"
    />
    <div
      v-if="!loaded && !failed"
      class="absolute inset-0 flex items-center justify-center bg-cream-100 text-ink-300"
      aria-hidden="true"
    >
      <ImageIcon :size="20" :stroke-width="1.5" />
    </div>
    <div
      v-if="failed"
      class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-cream-100 text-ink-400 cursor-pointer"
      role="button"
      :title="'加载失败，点击重试'"
      @click.stop="retry"
    >
      <ImageOff :size="20" :stroke-width="1.5" />
      <span class="text-[10px]">点击重试</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Image as ImageIcon, ImageOff } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    src: string | null | undefined;
    alt?: string;
    loading?: 'lazy' | 'eager';
    imgClass?: string;
    wrapperClass?: string;
    maxRetries?: number;
  }>(),
  {
    alt: '',
    loading: 'lazy',
    imgClass: 'w-full h-full object-cover',
    wrapperClass: '',
    maxRetries: 1,
  },
);

const attempt = ref(0);
const loaded = ref(false);
const failed = ref(false);

const resolvedSrc = computed(() => {
  if (!props.src) return '';
  if (attempt.value === 0) return props.src;
  const sep = props.src.includes('?') ? '&' : '?';
  return `${props.src}${sep}_r=${attempt.value}`;
});

watch(
  () => props.src,
  () => {
    attempt.value = 0;
    loaded.value = false;
    failed.value = !props.src;
  },
  { immediate: true },
);

function onLoad() {
  loaded.value = true;
  failed.value = false;
}

function onError() {
  if (attempt.value < props.maxRetries) {
    attempt.value += 1;
    return;
  }
  failed.value = true;
  loaded.value = false;
}

function retry() {
  failed.value = false;
  loaded.value = false;
  attempt.value += 1;
}
</script>

<style scoped>
.safe-img-loading {
  filter: blur(16px);
  transform: scale(1.04);
  opacity: 0.6;
}
.safe-img-loaded {
  filter: blur(0);
  transform: scale(1);
  opacity: 1;
  transition: filter 0.5s ease-out, transform 0.5s ease-out, opacity 0.5s ease-out;
}
</style>
