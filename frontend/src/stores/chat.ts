import { defineStore } from 'pinia'
import { ref } from 'vue'
import { chatApi } from '@/api'

export const useChatStore = defineStore('chat', () => {
  const unread = ref(0)

  async function fetchUnread() {
    try {
      const res = await chatApi.unread()
      unread.value = res.count || 0
    } catch {
      // ignore
    }
    return unread.value
  }

  function increment(n = 1) {
    unread.value = Math.max(0, unread.value + n)
  }

  function clear() {
    unread.value = 0
  }

  return { unread, fetchUnread, increment, clear }
})
